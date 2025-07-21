import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState, NotificationItem } from '../../types';

const initialState: UIState = {
  isOnline: navigator.onLine,
  showAddForm: false,
  selectedReminder: null,
  notifications: [],
  sidebarOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    showAddReminderForm: (state) => {
      state.showAddForm = true;
    },
    hideAddReminderForm: (state) => {
      state.showAddForm = false;
    },
    setSelectedReminder: (state, action: PayloadAction<any>) => {
      state.selectedReminder = action.payload;
    },
    clearSelectedReminder: (state) => {
      state.selectedReminder = null;
    },
    addNotification: (state, action: PayloadAction<Omit<NotificationItem, 'id' | 'timestamp'>>) => {
      const notification: NotificationItem = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const {
  setOnlineStatus,
  showAddReminderForm,
  hideAddReminderForm,
  setSelectedReminder,
  clearSelectedReminder,
  addNotification,
  removeNotification,
  clearAllNotifications,
  toggleSidebar,
  setSidebarOpen,
} = uiSlice.actions;

// Selectors
export const selectIsOnline = (state: { ui: UIState }) => state.ui.isOnline;
export const selectShowAddForm = (state: { ui: UIState }) => state.ui.showAddForm;
export const selectSelectedReminder = (state: { ui: UIState }) => state.ui.selectedReminder;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;

export default uiSlice.reducer;