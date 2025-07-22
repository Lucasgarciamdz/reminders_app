import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Reminder,
  RemindersState,
  CreateReminderRequest,
  UpdateReminderRequest,
  ReminderFilters,
  ReminderQueryParams,
  PaginatedResponse,
  Priority,
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

      // Handle both paginated and direct array responses
      if (Array.isArray(response.data)) {
        // Direct array response - convert to paginated format
        return {
          content: response.data,
          totalElements: response.data.length,
          totalPages: Math.ceil(response.data.length / (params?.size || 20)),
          size: params?.size || 20,
          number: params?.page || 0,
        } as PaginatedResponse<Reminder>;
      } else {
        // Already paginated response
        return response.data;
      }
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
        // Add createdDate to the request as required by backend
        const requestData = {
          ...reminderData,
          createdDate: new Date().toISOString(),
        };
        const response = await apiService.createReminder(requestData);
        return response.data;
      } else {
        // Create locally when offline
        const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const requestData = {
          ...reminderData,
          createdDate: new Date().toISOString(),
        };
        const localReminder = {
          id: Date.now(), // Temporary ID
          localId,
          ...requestData,
          user: { id: 0, login: 'current_user' }, // Will be updated when synced
          syncStatus: 'PENDING' as const,
          lastModified: Date.now(),
        };

        await offlineStorageService.saveLocalReminder(localReminder);
        await syncService.queueCreateOperation(requestData, localId);

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

      const updates = { isCompleted: !reminder.isCompleted };

      // Optimistic update
      dispatch(optimisticUpdateReminder({ id, updates }));

      try {
        if (navigator.onLine) {
          // Send complete reminder data with the toggled completion status
          // Ensure all required fields are properly set and not null/undefined
          const completeUpdateRequest: UpdateReminderRequest = {
            id: reminder.id,
            title: reminder.title || '', // Ensure title is not null
            description: reminder.description || undefined, // Description can be undefined
            dueDate: reminder.dueDate || new Date().toISOString(), // Ensure dueDate is not null
            isCompleted: !reminder.isCompleted,
            priority: reminder.priority || Priority.MEDIUM, // Ensure priority is not null
            createdDate: reminder.createdDate || new Date().toISOString(), // Ensure createdDate is not null
          };

          // Validate that all required fields are present before sending
          if (!completeUpdateRequest.title || !completeUpdateRequest.dueDate ||
            !completeUpdateRequest.priority || !completeUpdateRequest.createdDate) {
            throw new Error('Missing required fields for reminder update');
          }

          const response = await apiService.updateReminder(id, completeUpdateRequest);
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
      console.log('Filters cleared, new filters:', defaultFilters);
    },
    // Debug action to force clear localStorage filters
    debugClearAllFilters: (state) => {
      localStorage.removeItem('reminderFilters');
      const defaultFilters = {
        completed: undefined,
        priority: undefined,
        dateRange: undefined,
        searchText: '',
      };
      state.filters = defaultFilters;
      console.log('DEBUG: All filters cleared from localStorage and state');
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
      if (!state.items) state.items = [];
      const index = state.items.findIndex(reminder => reminder.id === id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...updates };
      }
    },
    revertOptimisticUpdate: (state, action: PayloadAction<Reminder>) => {
      const reminder = action.payload;
      if (!state.items) state.items = [];
      const index = state.items.findIndex(r => r.id === reminder.id);
      if (index !== -1) {
        state.items[index] = reminder;
      }
    },
    // Optimistic delete operations
    optimisticDeleteReminder: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (!state.items) state.items = [];
      state.items = state.items.filter(reminder => reminder.id !== id);
      state.pagination.total -= 1;
    },
    revertOptimisticDelete: (state, action: PayloadAction<Reminder>) => {
      const reminder = action.payload;
      if (!state.items) state.items = [];
      // Add the reminder back to its original position
      state.items.push(reminder);
      state.pagination.total += 1;
      // Sort by creation date to maintain order
      state.items.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
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
        console.log('fetchReminders.fulfilled: received data:', action.payload);
        console.log('fetchReminders.fulfilled: content length:', action.payload.content?.length);
        state.items = action.payload.content;
        state.pagination = {
          page: action.payload.number,
          size: action.payload.size,
          total: action.payload.totalElements,
        };
        console.log('fetchReminders.fulfilled: state.items length:', state.items?.length);
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
        // Ensure items array exists before trying to modify it
        if (!state.items) {
          state.items = [];
        }
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
        if (!state.items) state.items = [];
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
        if (!state.items) state.items = [];
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
        if (!state.items) state.items = [];
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
  debugClearAllFilters,
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

  // Handle case where items might be undefined during initialization
  if (!items || !Array.isArray(items)) {
    console.log('selectFilteredReminders: items is empty or not array', items);
    return [];
  }

  console.log('selectFilteredReminders: items count:', items.length);
  console.log('selectFilteredReminders: active filters:', filters);

  const filteredItems = items.filter(reminder => {
    // Filter by completion status
    if (filters.completed !== undefined && reminder.isCompleted !== filters.completed) {
      console.log('Filtered out by completion status:', reminder.id, 'isCompleted:', reminder.isCompleted, 'filter:', filters.completed);
      return false;
    }

    // Filter by priority
    if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(reminder.priority)) {
      console.log('Filtered out by priority:', reminder.id, 'priority:', reminder.priority, 'filter:', filters.priority);
      return false;
    }

    // Filter by date range
    if (filters.dateRange) {
      const reminderDate = new Date(reminder.dueDate);
      const startDate = filters.dateRange.start;
      const endDate = filters.dateRange.end;

      if (reminderDate < startDate || reminderDate > endDate) {
        console.log('Filtered out by date range:', reminder.id, 'date:', reminder.dueDate, 'range:', startDate, 'to', endDate);
        return false;
      }
    }

    // Filter by search text
    if (filters.searchText && filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      if (!reminder.title.toLowerCase().includes(searchLower)) {
        console.log('Filtered out by search text:', reminder.id, 'title:', reminder.title, 'search:', filters.searchText);
        return false;
      }
    }

    return true;
  });

  console.log('selectFilteredReminders: filtered count:', filteredItems.length);
  return filteredItems;
};

export const selectCompletedReminders = (state: { reminders: RemindersState }) => {
  const items = state.reminders.items;
  if (!items || !Array.isArray(items)) return [];
  return items.filter(reminder => reminder.isCompleted);
};

export const selectIncompleteReminders = (state: { reminders: RemindersState }) => {
  const items = state.reminders.items;
  if (!items || !Array.isArray(items)) return [];
  return items.filter(reminder => !reminder.isCompleted);
};

export const selectRemindersByPriority = (priority: string) => (state: { reminders: RemindersState }) => {
  const items = state.reminders.items;
  if (!items || !Array.isArray(items)) return [];
  return items.filter(reminder => reminder.priority === priority);
};

export const selectTodayReminders = (state: { reminders: RemindersState }) => {
  const items = state.reminders.items;
  if (!items || !Array.isArray(items)) return [];
  const today = new Date().toISOString().split('T')[0];
  return items.filter(reminder =>
    reminder.dueDate.startsWith(today)
  );
};

export const selectUpcomingReminders = (state: { reminders: RemindersState }) => {
  const items = state.reminders.items;
  if (!items || !Array.isArray(items)) return [];
  const today = new Date();
  return items.filter(reminder => {
    const reminderDate = new Date(reminder.dueDate);
    return reminderDate >= today && !reminder.isCompleted;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
};

export default remindersSlice.reducer;