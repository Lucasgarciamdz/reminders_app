import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Reminder,
  RemindersState,
  CreateReminderRequest,
  UpdateReminderRequest,
  ReminderFilters,
  ReminderQueryParams,
  PaginatedResponse,
} from '../../types';
import { apiService } from '../../services/apiService';
import { offlineStorageService } from '../../services/offlineStorageService';
import { syncService } from '../../services/syncService';

// Load filters from localStorage
const loadFiltersFromStorage = (): ReminderFilters => {
  try {
    const savedFilters = localStorage.getItem('reminderFilters');
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters);
      // Convert date strings back to Date objects
      if (parsed.dateRange) {
        parsed.dateRange = {
          start: new Date(parsed.dateRange.start),
          end: new Date(parsed.dateRange.end),
        };
      }
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to load filters from localStorage:', error);
  }
  
  return {
    completed: undefined,
    priority: undefined,
    dateRange: undefined,
    searchText: '',
  };
};

// Save filters to localStorage
const saveFiltersToStorage = (filters: ReminderFilters) => {
  try {
    localStorage.setItem('reminderFilters', JSON.stringify(filters));
  } catch (error) {
    console.warn('Failed to save filters to localStorage:', error);
  }
};

// Initial state
const initialState: RemindersState = {
  items: [],
  loading: false,
  error: null,
  filters: loadFiltersFromStorage(),
  pagination: {
    page: 0,
    size: 20,
    total: 0,
  },
};

// Async thunks for API calls
export const fetchReminders = createAsyncThunk(
  'reminders/fetchReminders',
  async (params: ReminderQueryParams | undefined, { rejectWithValue }) => {
    try {
      const response = await apiService.getReminders(params);
      return response.data;
    } catch (error: any) {
      // If offline, try to get from local storage
      if (!navigator.onLine) {
        try {
          const localReminders = await offlineStorageService.getLocalReminders();
          return {
            content: localReminders,
            totalElements: localReminders.length,
            totalPages: Math.ceil(localReminders.length / (params?.size || 20)),
            size: params?.size || 20,
            number: params?.page || 0,
          } as PaginatedResponse<Reminder>;
        } catch (localError) {
          return rejectWithValue('Failed to fetch reminders from local storage');
        }
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reminders');
    }
  }
);

export const createReminder = createAsyncThunk(
  'reminders/createReminder',
  async (reminderData: CreateReminderRequest, { rejectWithValue }) => {
    try {
      if (navigator.onLine) {
        const response = await apiService.createReminder(reminderData);
        return response.data;
      } else {
        // Create locally when offline
        const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const localReminder = {
          id: Date.now(), // Temporary ID
          localId,
          ...reminderData,
          createdAt: new Date().toISOString(),
          user: { id: 0, login: 'current_user' }, // Will be updated when synced
          syncStatus: 'PENDING' as const,
          lastModified: Date.now(),
        };
        
        await offlineStorageService.saveLocalReminder(localReminder);
        await syncService.queueCreateOperation(reminderData, localId);
        
        return localReminder;
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create reminder');
    }
  }
);

export const updateReminder = createAsyncThunk(
  'reminders/updateReminder',
  async ({ id, updates }: { id: number; updates: UpdateReminderRequest }, { rejectWithValue }) => {
    try {
      if (navigator.onLine) {
        const response = await apiService.updateReminder(id, updates);
        return response.data;
      } else {
        // Update locally when offline
        await offlineStorageService.updateLocalReminder(id, updates);
        await syncService.queueUpdateOperation(id, updates);
        
        const updatedReminder = await offlineStorageService.getLocalReminderById(id);
        if (!updatedReminder) {
          throw new Error('Failed to update local reminder');
        }
        return updatedReminder;
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update reminder');
    }
  }
);

export const deleteReminder = createAsyncThunk(
  'reminders/deleteReminder',
  async (id: number, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { reminders: RemindersState };
      const reminder = state.reminders.items.find(r => r.id === id);
      
      if (!reminder) {
        throw new Error('Reminder not found');
      }

      // Optimistic delete - remove from UI immediately
      dispatch(optimisticDeleteReminder(id));
      
      try {
        if (navigator.onLine) {
          await apiService.deleteReminder(id);
          return id;
        } else {
          // Delete locally when offline
          await offlineStorageService.deleteLocalReminder(id);
          await syncService.queueDeleteOperation(id);
          return id;
        }
      } catch (error: any) {
        // Revert optimistic delete on failure
        dispatch(revertOptimisticDelete(reminder));
        throw error;
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete reminder');
    }
  }
);

export const toggleReminderCompletion = createAsyncThunk(
  'reminders/toggleCompletion',
  async (id: number, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { reminders: RemindersState };
      const reminder = state.reminders.items.find(r => r.id === id);
      
      if (!reminder) {
        throw new Error('Reminder not found');
      }

      const updates = { completed: !reminder.completed };
      
      // Optimistic update
      dispatch(optimisticUpdateReminder({ id, updates }));
      
      try {
        if (navigator.onLine) {
          const response = await apiService.updateReminder(id, { id, ...updates });
          return response.data;
        } else {
          // Update locally when offline
          await offlineStorageService.updateLocalReminder(id, updates);
          await syncService.queueUpdateOperation(id, updates);
          
          const updatedReminder = await offlineStorageService.getLocalReminderById(id);
          if (!updatedReminder) {
            throw new Error('Failed to update local reminder');
          }
          return updatedReminder;
        }
      } catch (error: any) {
        // Revert optimistic update on failure
        dispatch(revertOptimisticUpdate(reminder));
        throw error;
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle reminder completion');
    }
  }
);

// Slice
const remindersSlice = createSlice({
  name: 'reminders',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ReminderFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      // Save filters to localStorage for persistence
      saveFiltersToStorage(state.filters);
    },
    clearFilters: (state) => {
      const defaultFilters = {
        completed: undefined,
        priority: undefined,
        dateRange: undefined,
        searchText: '',
      };
      state.filters = defaultFilters;
      // Save cleared filters to localStorage
      saveFiltersToStorage(defaultFilters);
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    // Local state updates for optimistic UI
    optimisticUpdateReminder: (state, action: PayloadAction<{ id: number; updates: Partial<Reminder> }>) => {
      const { id, updates } = action.payload;
      const index = state.items.findIndex(reminder => reminder.id === id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...updates };
      }
    },
    revertOptimisticUpdate: (state, action: PayloadAction<Reminder>) => {
      const reminder = action.payload;
      const index = state.items.findIndex(r => r.id === reminder.id);
      if (index !== -1) {
        state.items[index] = reminder;
      }
    },
    // Optimistic delete operations
    optimisticDeleteReminder: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      state.items = state.items.filter(reminder => reminder.id !== id);
      state.pagination.total -= 1;
    },
    revertOptimisticDelete: (state, action: PayloadAction<Reminder>) => {
      const reminder = action.payload;
      // Add the reminder back to its original position
      state.items.push(reminder);
      state.pagination.total += 1;
      // Sort by creation date to maintain order
      state.items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
  },
  extraReducers: (builder) => {
    // Fetch reminders
    builder
      .addCase(fetchReminders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReminders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.content;
        state.pagination = {
          page: action.payload.number,
          size: action.payload.size,
          total: action.payload.totalElements,
        };
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create reminder
    builder
      .addCase(createReminder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReminder.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createReminder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update reminder
    builder
      .addCase(updateReminder.pending, (state) => {
        state.error = null;
      })
      .addCase(updateReminder.fulfilled, (state, action) => {
        const index = state.items.findIndex(reminder => reminder.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateReminder.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Delete reminder
    builder
      .addCase(deleteReminder.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteReminder.fulfilled, (state, action) => {
        state.items = state.items.filter(reminder => reminder.id !== action.payload);
        state.pagination.total -= 1;
      })
      .addCase(deleteReminder.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Toggle completion
    builder
      .addCase(toggleReminderCompletion.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleReminderCompletion.fulfilled, (state, action) => {
        const index = state.items.findIndex(reminder => reminder.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(toggleReminderCompletion.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setFilters,
  clearFilters,
  setPagination,
  clearError,
  setLoading,
  optimisticUpdateReminder,
  revertOptimisticUpdate,
  optimisticDeleteReminder,
  revertOptimisticDelete,
} = remindersSlice.actions;

// Selectors
export const selectReminders = (state: { reminders: RemindersState }) => state.reminders.items;
export const selectRemindersLoading = (state: { reminders: RemindersState }) => state.reminders.loading;
export const selectRemindersError = (state: { reminders: RemindersState }) => state.reminders.error;
export const selectRemindersFilters = (state: { reminders: RemindersState }) => state.reminders.filters;
export const selectRemindersPagination = (state: { reminders: RemindersState }) => state.reminders.pagination;

// Filtered selectors
export const selectFilteredReminders = (state: { reminders: RemindersState }) => {
  const { items, filters } = state.reminders;
  
  return items.filter(reminder => {
    // Filter by completion status
    if (filters.completed !== undefined && reminder.completed !== filters.completed) {
      return false;
    }
    
    // Filter by priority
    if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(reminder.priority)) {
      return false;
    }
    
    // Filter by date range
    if (filters.dateRange) {
      const reminderDate = new Date(reminder.reminderDate);
      const startDate = filters.dateRange.start;
      const endDate = filters.dateRange.end;
      
      if (reminderDate < startDate || reminderDate > endDate) {
        return false;
      }
    }
    
    // Filter by search text
    if (filters.searchText && filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      if (!reminder.text.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    return true;
  });
};

export const selectCompletedReminders = (state: { reminders: RemindersState }) => 
  state.reminders.items.filter(reminder => reminder.completed);

export const selectIncompleteReminders = (state: { reminders: RemindersState }) => 
  state.reminders.items.filter(reminder => !reminder.completed);

export const selectRemindersByPriority = (priority: string) => (state: { reminders: RemindersState }) =>
  state.reminders.items.filter(reminder => reminder.priority === priority);

export const selectTodayReminders = (state: { reminders: RemindersState }) => {
  const today = new Date().toISOString().split('T')[0];
  return state.reminders.items.filter(reminder => 
    reminder.reminderDate.startsWith(today)
  );
};

export const selectUpcomingReminders = (state: { reminders: RemindersState }) => {
  const today = new Date();
  return state.reminders.items.filter(reminder => {
    const reminderDate = new Date(reminder.reminderDate);
    return reminderDate >= today && !reminder.completed;
  }).sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime());
};

export default remindersSlice.reducer;