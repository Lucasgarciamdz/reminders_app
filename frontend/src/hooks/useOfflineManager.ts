import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useOnlineStatus } from './useOnlineStatus';
import { setOnlineStatus, addNotification } from '../store/slices/uiSlice';
import { syncService } from '../services/syncService';
import { offlineStorageService } from '../services/offlineStorageService';

interface OfflineManagerState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime: number | null;
  syncError: string | null;
}

interface OfflineManagerActions {
  syncNow: () => Promise<void>;
  clearSyncError: () => void;
  getPendingOperationsCount: () => Promise<number>;
  getStorageInfo: () => Promise<{
    remindersCount: number;
    syncQueueCount: number;
    settingsCount: number;
  }>;
}

export function useOfflineManager(): OfflineManagerState & OfflineManagerActions {
  const dispatch = useDispatch();
  const isOnline = useOnlineStatus();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Update Redux store when online status changes
  useEffect(() => {
    dispatch(setOnlineStatus(isOnline));
    
    // Show notification when going offline/online
    if (!isOnline) {
      dispatch(addNotification({
        type: 'warning',
        message: 'You are now offline. Changes will be saved locally.',
        duration: 5000,
      }));
    } else {
      dispatch(addNotification({
        type: 'success',
        message: 'Connection restored. Syncing data...',
        duration: 3000,
      }));
    }
  }, [isOnline, dispatch]);

  // Set up sync status listener
  useEffect(() => {
    const handleSyncStatus = (status: boolean) => {
      setIsSyncing(status);
    };

    syncService.addSyncListener(handleSyncStatus);

    return () => {
      syncService.removeSyncListener(handleSyncStatus);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [pendingCount, lastSync] = await Promise.all([
          syncService.getPendingOperationsCount(),
          syncService.getLastSyncTime(),
        ]);
        
        setPendingOperations(pendingCount);
        setLastSyncTime(lastSync);
      } catch (error) {
        console.error('Failed to load initial offline data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingOperations > 0 && !isSyncing) {
      syncNow();
    }
  }, [isOnline, pendingOperations, isSyncing]);

  // Sync function
  const syncNow = useCallback(async () => {
    if (isSyncing || !isOnline) {
      return;
    }

    try {
      setSyncError(null);
      const result = await syncService.syncData();
      
      if (result.success) {
        const [pendingCount, lastSync] = await Promise.all([
          syncService.getPendingOperationsCount(),
          syncService.getLastSyncTime(),
        ]);
        
        setPendingOperations(pendingCount);
        setLastSyncTime(lastSync);
        
        dispatch(addNotification({
          type: 'success',
          message: 'Data synchronized successfully',
          duration: 3000,
        }));
      } else {
        const errorMessage = result.errors.length > 0 
          ? `Sync completed with ${result.errors.length} errors`
          : 'Sync completed with some issues';
        
        setSyncError(errorMessage);
        dispatch(addNotification({
          type: 'warning',
          message: errorMessage,
          duration: 5000,
        }));
      }
    } catch (error) {
      const errorMessage = 'Failed to synchronize data';
      setSyncError(errorMessage);
      
      dispatch(addNotification({
        type: 'error',
        message: errorMessage,
        duration: 5000,
      }));
      
      console.error('Sync error:', error);
    }
  }, [isSyncing, isOnline, dispatch]);

  // Clear sync error
  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  // Get pending operations count
  const getPendingOperationsCount = useCallback(async () => {
    try {
      const count = await syncService.getPendingOperationsCount();
      setPendingOperations(count);
      return count;
    } catch (error) {
      console.error('Failed to get pending operations count:', error);
      return 0;
    }
  }, []);

  // Get storage info
  const getStorageInfo = useCallback(async () => {
    try {
      return await offlineStorageService.getStorageInfo();
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        remindersCount: 0,
        syncQueueCount: 0,
        settingsCount: 0,
      };
    }
  }, []);

  // Register background sync when online
  useEffect(() => {
    if (isOnline) {
      syncService.registerBackgroundSync();
    }
  }, [isOnline]);

  // Periodic sync check (every 5 minutes when online)
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(async () => {
      const pendingCount = await getPendingOperationsCount();
      if (pendingCount > 0 && !isSyncing) {
        syncNow();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isOnline, isSyncing, getPendingOperationsCount, syncNow]);

  return {
    // State
    isOnline,
    isSyncing,
    pendingOperations,
    lastSyncTime,
    syncError,
    
    // Actions
    syncNow,
    clearSyncError,
    getPendingOperationsCount,
    getStorageInfo,
  };
}