import { apiService } from './apiService';
import { offlineStorageService } from './offlineStorageService';
import {
  SyncOperation,
  SyncResult,
  ConflictItem,
  LocalReminder,
  Reminder,
  CreateReminderRequest,
  UpdateReminderRequest,
} from '../types';

class SyncService {
  private isSyncing = false;
  private syncListeners: Array<(status: boolean) => void> = [];
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private maxRetries = 5;
  private baseRetryDelay = 2000; // 2 seconds
  private maxRetryDelay = 60000; // 1 minute

  // Add sync status listener
  addSyncListener(listener: (status: boolean) => void): void {
    this.syncListeners.push(listener);
  }

  // Remove sync status listener
  removeSyncListener(listener: (status: boolean) => void): void {
    this.syncListeners = this.syncListeners.filter(l => l !== listener);
  }

  // Notify all listeners about sync status
  private notifySyncStatus(status: boolean): void {
    this.isSyncing = status;
    this.syncListeners.forEach(listener => listener(status));
  }

  // Main sync method
  async syncData(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, conflicts: [], errors: [] };
    }

    this.notifySyncStatus(true);

    try {
      // First, sync from server to get latest data
      await this.syncFromServer();

      // Then, sync local changes to server
      const result = await this.syncToServer();

      // Update last sync time
      await offlineStorageService.setSetting('lastSyncTime', Date.now());

      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        success: false,
        conflicts: [],
        errors: [{ operation: {} as SyncOperation, error: String(error) }],
      };
    } finally {
      this.notifySyncStatus(false);
    }
  }

  // Sync from server to local storage
  private async syncFromServer(): Promise<void> {
    try {
      const response = await apiService.getReminders();
      const serverReminders = response.data.content;

      // Convert server reminders to local format
      const localReminders: LocalReminder[] = serverReminders.map(reminder => ({
        ...reminder,
        syncStatus: 'SYNCED' as const,
        lastModified: Date.now(),
      }));

      // Save to local storage
      await offlineStorageService.bulkSaveReminders(localReminders);
    } catch (error) {
      console.error('Failed to sync from server:', error);
      throw error;
    }
  }

  // Sync local changes to server
  private async syncToServer(): Promise<SyncResult> {
    const syncQueue = await offlineStorageService.getSyncQueue();
    const conflicts: ConflictItem[] = [];
    const errors: any[] = [];

    for (const operation of syncQueue) {
      try {
        await this.processSyncOperation(operation);
        await offlineStorageService.removeSyncOperation(operation.id);
        
        // Clear any existing retry timeout for this operation
        this.clearRetryTimeout(operation.id);
      } catch (error) {
        console.error('Failed to process sync operation:', error);
        
        // Check if we should retry this operation
        if (operation.retryCount < this.maxRetries) {
          // Increment retry count
          await offlineStorageService.updateSyncOperation(operation.id, {
            retryCount: operation.retryCount + 1,
            error: String(error),
          });

          // Schedule retry with exponential backoff
          this.scheduleRetry(operation);
        } else {
          // Max retries exceeded, mark as failed
          await offlineStorageService.updateSyncOperation(operation.id, {
            error: `Max retries exceeded: ${String(error)}`,
          });
          
          errors.push({ operation, error: String(error) });
        }
      }
    }

    return {
      success: errors.length === 0,
      conflicts,
      errors,
    };
  }

  // Schedule retry with exponential backoff
  private scheduleRetry(operation: SyncOperation): void {
    // Clear any existing timeout
    this.clearRetryTimeout(operation.id);

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.baseRetryDelay * Math.pow(2, operation.retryCount),
      this.maxRetryDelay
    );

    // Add jitter to prevent thundering herd
    const jitteredDelay = delay + Math.random() * 1000;

    // Dispatch retry scheduled event
    window.dispatchEvent(new CustomEvent('sync:retry-scheduled', {
      detail: {
        operationId: operation.id,
        attempt: operation.retryCount + 1,
        maxRetries: this.maxRetries,
        delay: jitteredDelay,
      }
    }));

    // Schedule the retry
    const timeoutId = setTimeout(async () => {
      try {
        // Remove from timeout map
        this.retryTimeouts.delete(operation.id);
        
        // Dispatch retry attempt event
        window.dispatchEvent(new CustomEvent('sync:retry-attempt', {
          detail: {
            operationId: operation.id,
            attempt: operation.retryCount + 1,
          }
        }));

        // Retry the operation
        await this.processSyncOperation(operation);
        await offlineStorageService.removeSyncOperation(operation.id);
        
        // Dispatch retry success event
        window.dispatchEvent(new CustomEvent('sync:retry-success', {
          detail: { operationId: operation.id }
        }));
      } catch (error) {
        console.error('Retry failed for operation:', operation.id, error);
        
        // Update retry count and schedule next retry if within limits
        const updatedOperation = {
          ...operation,
          retryCount: operation.retryCount + 1,
          error: String(error),
        };

        if (updatedOperation.retryCount < this.maxRetries) {
          await offlineStorageService.updateSyncOperation(operation.id, {
            retryCount: updatedOperation.retryCount,
            error: String(error),
          });
          
          this.scheduleRetry(updatedOperation);
        } else {
          // Max retries exceeded
          await offlineStorageService.updateSyncOperation(operation.id, {
            error: `Max retries exceeded: ${String(error)}`,
          });
          
          // Dispatch retry failed event
          window.dispatchEvent(new CustomEvent('sync:retry-failed', {
            detail: {
              operationId: operation.id,
              error: String(error),
            }
          }));
        }
      }
    }, jitteredDelay);

    // Store timeout reference
    this.retryTimeouts.set(operation.id, timeoutId);
  }

  // Clear retry timeout
  private clearRetryTimeout(operationId: string): void {
    const timeoutId = this.retryTimeouts.get(operationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.retryTimeouts.delete(operationId);
    }
  }

  // Process individual sync operation
  private async processSyncOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'CREATE':
        await this.syncCreateOperation(operation);
        break;
      case 'UPDATE':
        await this.syncUpdateOperation(operation);
        break;
      case 'DELETE':
        await this.syncDeleteOperation(operation);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  // Sync create operation
  private async syncCreateOperation(operation: SyncOperation): Promise<void> {
    if (!operation.data) {
      throw new Error('No data provided for create operation');
    }

    const createRequest: CreateReminderRequest = operation.data;
    const response = await apiService.createReminder(createRequest);
    const serverReminder = response.data;

    // Update local reminder with server ID
    if (operation.localId) {
      const localReminder = await offlineStorageService.getLocalReminderByLocalId(operation.localId);
      if (localReminder) {
        const updatedReminder: LocalReminder = {
          ...serverReminder,
          syncStatus: 'SYNCED',
          lastModified: Date.now(),
        };
        await offlineStorageService.saveLocalReminder(updatedReminder);
      }
    }
  }

  // Sync update operation
  private async syncUpdateOperation(operation: SyncOperation): Promise<void> {
    if (!operation.reminderId || !operation.data) {
      throw new Error('Missing reminder ID or data for update operation');
    }

    const updateRequest: UpdateReminderRequest = {
      id: operation.reminderId,
      ...operation.data,
    };

    const response = await apiService.updateReminder(operation.reminderId, updateRequest);
    const serverReminder = response.data;

    // Update local reminder
    const updatedReminder: LocalReminder = {
      ...serverReminder,
      syncStatus: 'SYNCED',
      lastModified: Date.now(),
    };
    await offlineStorageService.saveLocalReminder(updatedReminder);
  }

  // Sync delete operation
  private async syncDeleteOperation(operation: SyncOperation): Promise<void> {
    if (!operation.reminderId) {
      throw new Error('Missing reminder ID for delete operation');
    }

    await apiService.deleteReminder(operation.reminderId);
    await offlineStorageService.deleteLocalReminder(operation.reminderId);
  }

  // Queue operations for sync
  async queueCreateOperation(reminder: CreateReminderRequest, localId?: string): Promise<void> {
    const operation: SyncOperation = {
      id: this.generateOperationId(),
      type: 'CREATE',
      localId,
      data: reminder,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await offlineStorageService.addToSyncQueue(operation);
  }

  async queueUpdateOperation(reminderId: number, updates: Partial<Reminder>): Promise<void> {
    const operation: SyncOperation = {
      id: this.generateOperationId(),
      type: 'UPDATE',
      reminderId,
      data: updates,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await offlineStorageService.addToSyncQueue(operation);
  }

  async queueDeleteOperation(reminderId: number): Promise<void> {
    const operation: SyncOperation = {
      id: this.generateOperationId(),
      type: 'DELETE',
      reminderId,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await offlineStorageService.addToSyncQueue(operation);
  }

  // Background sync registration
  registerBackgroundSync(): void {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Type assertion for background sync API
        const syncManager = (registration as any).sync;
        if (syncManager) {
          return syncManager.register('reminder-sync');
        }
      }).catch((error) => {
        console.error('Background sync registration failed:', error);
      });
    }
  }

  // Handle background sync event (called from service worker)
  async handleBackgroundSync(): Promise<void> {
    try {
      await this.syncData();
    } catch (error) {
      console.error('Background sync failed:', error);
      throw error;
    }
  }

  // Conflict resolution
  async resolveConflict(conflictId: string, resolution: 'local' | 'server'): Promise<void> {
    const conflicts = await offlineStorageService.getConflictReminders();
    const conflict = conflicts.find(c => c.localId === conflictId);

    if (!conflict) {
      throw new Error('Conflict not found');
    }

    if (resolution === 'server') {
      // Accept server version - fetch latest from server
      const response = await apiService.getReminderById(conflict.id);
      const serverReminder = response.data;
      
      const updatedReminder: LocalReminder = {
        ...serverReminder,
        syncStatus: 'SYNCED',
        lastModified: Date.now(),
      };
      
      await offlineStorageService.saveLocalReminder(updatedReminder);
    } else {
      // Accept local version - queue for sync
      await this.queueUpdateOperation(conflict.id, conflict);
      
      const updatedReminder: LocalReminder = {
        ...conflict,
        syncStatus: 'PENDING',
        lastModified: Date.now(),
      };
      
      await offlineStorageService.saveLocalReminder(updatedReminder);
    }
  }

  // Utility methods
  private generateOperationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get sync status
  getSyncStatus(): boolean {
    return this.isSyncing;
  }

  // Get last sync time
  async getLastSyncTime(): Promise<number | null> {
    const result = await offlineStorageService.getSetting<number>('lastSyncTime');
    return result ?? null;
  }

  // Get pending operations count
  async getPendingOperationsCount(): Promise<number> {
    const syncQueue = await offlineStorageService.getSyncQueue();
    return syncQueue.length;
  }

  // Force sync (ignores sync status)
  async forcSync(): Promise<SyncResult> {
    this.isSyncing = false;
    return await this.syncData();
  }

  // Clear all sync data
  async clearSyncData(): Promise<void> {
    await offlineStorageService.clearSyncQueue();
    await offlineStorageService.deleteSetting('lastSyncTime');
  }
}

// Create and export a singleton instance
export const syncService = new SyncService();
export default syncService;