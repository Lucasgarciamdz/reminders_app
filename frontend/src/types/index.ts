// User types
export interface User {
  id: number;
  login: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  activated: boolean;
  langKey?: string;
  authorities: string[];
}

// Authentication types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  id_token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Reminder types
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface Reminder {
  id: number;
  title: string;
  description?: string;
  dueDate: string; // ISO datetime string
  isCompleted: boolean;
  priority: Priority;
  createdDate: string;
  lastModifiedDate?: string;
  user?: {
    id: number;
    login: string;
  };
  category?: {
    id: number;
    name: string;
  };
  tags?: Array<{
    id: number;
    name: string;
  }>;
}

export interface CreateReminderRequest {
  title: string;
  description?: string;
  dueDate: string; // ISO datetime string
  isCompleted: boolean;
  priority: Priority;
}

export interface UpdateReminderRequest {
  id: number;
  title: string;
  description?: string;
  dueDate: string; // ISO datetime string
  isCompleted: boolean;
  priority: Priority;
  createdDate: string; // Required by backend
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ReminderQueryParams {
  page?: number;
  size?: number;
  sort?: string;
  completed?: boolean;
  priority?: Priority;
  dateFrom?: string;
  dateTo?: string;
}

// Filter types
export interface ReminderFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  completed?: boolean;
  priority?: Priority[];
  searchText?: string;
}

// Redux state types
export interface RemindersState {
  items: Reminder[];
  loading: boolean;
  error: string | null;
  filters: ReminderFilters;
  pagination: {
    page: number;
    size: number;
    total: number;
  };
}

export interface UIState {
  isOnline: boolean;
  showAddForm: boolean;
  selectedReminder: Reminder | null;
  notifications: NotificationItem[];
  sidebarOpen: boolean;
}

export interface SyncState {
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingOperations: number;
  conflicts: ConflictItem[];
}

export interface RootState {
  auth: AuthState;
  reminders: RemindersState;
  ui: UIState;
  sync: SyncState;
}

// Sync types
export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  reminderId?: number;
  localId?: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  error?: string;
}

export interface ConflictItem {
  id: string;
  localData: any;
  serverData: any;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
}

export interface SyncResult {
  success: boolean;
  conflicts: ConflictItem[];
  errors: SyncError[];
}

export interface SyncError {
  operation: SyncOperation;
  error: string;
}

// Local storage types
export interface LocalReminder extends Reminder {
  localId?: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'CONFLICT';
  lastModified: number;
}

export interface AppSettings {
  key: string;
  value: any;
  updatedAt: number;
}

// Notification types
export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: number;
}

// Component prop types
export interface ReminderListProps {
  reminders: Reminder[];
  onToggleComplete: (id: number) => void;
  onDelete: (id: number) => void;
  loading: boolean;
  filters: ReminderFilters;
}

export interface ReminderItemProps {
  reminder: Reminder;
  onToggleComplete: (id: number) => void;
  onDelete: (id: number) => void;
}

export interface AddReminderFormProps {
  onSubmit: (reminder: CreateReminderRequest) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export interface ReminderFiltersProps {
  filters: ReminderFilters;
  onFiltersChange: (filters: ReminderFilters) => void;
}

export interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  loading: boolean;
  error?: string;
}

// Theme types
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

// PWA types
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    deferredPrompt?: PWAInstallPrompt;
  }
}