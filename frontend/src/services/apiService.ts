import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  LoginCredentials,
  AuthResponse,
  User,
  Reminder,
  CreateReminderRequest,
  UpdateReminderRequest,
  PaginatedResponse,
  ReminderQueryParams,
} from '../types';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

interface RequestWithRetry extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
  _retryConfig?: RetryConfig;
}

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token and retry config
    this.axiosInstance.interceptors.request.use(
      (config: RequestWithRetry) => {
        const token = localStorage.getItem('authToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Set default retry config if not specified
        if (!config._retryConfig) {
          config._retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            retryCondition: (error: AxiosError) => {
              // Retry on network errors, timeouts, and 5xx server errors
              return !error.response || 
                     error.code === 'ECONNABORTED' ||
                     (error.response.status >= 500 && error.response.status < 600);
            }
          };
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token expiration and retries
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as RequestWithRetry;

        // Handle authentication errors first
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const newToken = response.data.id_token;
              
              // Update stored token
              localStorage.setItem('authToken', newToken);
              this.setToken(newToken);
              
              // Retry original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          }
        }

        // If 401 and no refresh token or refresh failed
        if (error.response?.status === 401) {
          this.handleAuthFailure();
          return Promise.reject(error);
        }

        // Handle retries with exponential backoff
        return this.handleRetry(error, originalRequest);
      }
    );
  }

  private async handleRetry(error: AxiosError, originalRequest: RequestWithRetry): Promise<any> {
    const retryConfig = originalRequest._retryConfig;
    
    if (!retryConfig || !retryConfig.retryCondition) {
      return Promise.reject(error);
    }

    // Check if we should retry this error
    if (!retryConfig.retryCondition(error)) {
      return Promise.reject(error);
    }

    // Initialize retry count
    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    // Check if we've exceeded max retries
    if (originalRequest._retryCount >= retryConfig.maxRetries) {
      // Dispatch custom event for max retries exceeded
      window.dispatchEvent(new CustomEvent('api:max-retries-exceeded', {
        detail: { error, request: originalRequest }
      }));
      return Promise.reject(error);
    }

    // Increment retry count
    originalRequest._retryCount++;

    // Calculate delay with exponential backoff
    const delay = Math.min(
      retryConfig.baseDelay * Math.pow(2, originalRequest._retryCount - 1),
      retryConfig.maxDelay
    );

    // Add jitter to prevent thundering herd
    const jitteredDelay = delay + Math.random() * 1000;

    // Dispatch retry event
    window.dispatchEvent(new CustomEvent('api:retry-attempt', {
      detail: { 
        attempt: originalRequest._retryCount, 
        maxRetries: retryConfig.maxRetries,
        delay: jitteredDelay,
        error 
      }
    }));

    // Wait for the calculated delay
    await new Promise(resolve => setTimeout(resolve, jitteredDelay));

    // Retry the request
    return this.axiosInstance(originalRequest);
  }

  private handleAuthFailure(): void {
    // Clear tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    // Dispatch custom event for logout
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  public setToken(token: string): void {
    if (token) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  public clearToken(): void {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  // Authentication endpoints
  public async login(credentials: LoginCredentials): Promise<AxiosResponse<AuthResponse>> {
    const response = await this.axiosInstance.post<AuthResponse>('/api/authenticate', {
      username: credentials.username,
      password: credentials.password,
      rememberMe: false,
    });
    return response;
  }

  public async refreshToken(refreshToken: string): Promise<AxiosResponse<AuthResponse>> {
    const response = await this.axiosInstance.post<AuthResponse>('/api/auth/refresh', {
      refreshToken,
    });
    return response;
  }

  public async getCurrentUser(): Promise<AxiosResponse<User>> {
    const response = await this.axiosInstance.get<User>('/api/account');
    return response;
  }

  // Reminder endpoints
  public async getReminders(params?: ReminderQueryParams): Promise<AxiosResponse<PaginatedResponse<Reminder>>> {
    const response = await this.axiosInstance.get<PaginatedResponse<Reminder>>('/api/reminders', {
      params,
    });
    return response;
  }

  public async createReminder(reminder: CreateReminderRequest & { createdDate: string }): Promise<AxiosResponse<Reminder>> {
    const response = await this.axiosInstance.post<Reminder>('/api/reminders', reminder);
    return response;
  }

  public async updateReminder(id: number, reminder: UpdateReminderRequest): Promise<AxiosResponse<Reminder>> {
    const response = await this.axiosInstance.put<Reminder>(`/api/reminders/${id}`, reminder);
    return response;
  }

  public async deleteReminder(id: number): Promise<AxiosResponse<void>> {
    const response = await this.axiosInstance.delete<void>(`/api/reminders/${id}`);
    return response;
  }

  public async getReminderById(id: number): Promise<AxiosResponse<Reminder>> {
    const response = await this.axiosInstance.get<Reminder>(`/api/reminders/${id}`);
    return response;
  }

  // Generic HTTP methods
  public async get<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, config);
  }

  public async post<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config);
  }

  public async put<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config);
  }

  public async delete<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config);
  }

  public async patch<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch<T>(url, data, config);
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;