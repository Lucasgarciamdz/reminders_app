import { useMemo } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { useSelector } from 'react-redux';
import { RootState } from '../types';

interface FeatureAvailability {
  // Core features
  canCreateReminder: boolean;
  canUpdateReminder: boolean;
  canDeleteReminder: boolean;
  canSyncData: boolean;
  
  // Advanced features
  canSearchReminders: boolean;
  canFilterByDate: boolean;
  canExportData: boolean;
  canImportData: boolean;
  
  // UI features
  showSyncStatus: boolean;
  showOfflineIndicator: boolean;
  enableRealTimeUpdates: boolean;
  
  // Feature messages
  getFeatureMessage: (feature: string) => string | null;
}

export function useFeatureAvailability(): FeatureAvailability {
  const isOnline = useOnlineStatus();
  const { isSyncing, pendingOperations } = useSelector((state: RootState) => ({
    isSyncing: state.ui.isOnline && state.sync?.isSyncing,
    pendingOperations: state.sync?.pendingOperations || 0,
  }));

  const featureAvailability = useMemo((): FeatureAvailability => {
    // Core features - available offline with local storage
    const canCreateReminder = true; // Always available (stored locally when offline)
    const canUpdateReminder = true; // Always available (stored locally when offline)
    const canDeleteReminder = true; // Always available (stored locally when offline)
    const canSyncData = isOnline && !isSyncing;

    // Advanced features - require online connection
    const canSearchReminders = true; // Available offline with local search
    const canFilterByDate = true; // Available offline
    const canExportData = isOnline; // Requires server processing
    const canImportData = isOnline; // Requires server validation

    // UI features
    const showSyncStatus = pendingOperations > 0 || isSyncing;
    const showOfflineIndicator = !isOnline || pendingOperations > 0;
    const enableRealTimeUpdates = isOnline;

    const getFeatureMessage = (feature: string): string | null => {
      if (isOnline) return null;

      const offlineMessages: Record<string, string> = {
        sync: 'Sync will resume when connection is restored',
        export: 'Export requires an internet connection',
        import: 'Import requires an internet connection',
        realtime: 'Real-time updates disabled while offline',
        create: 'Reminder will be saved locally and synced when online',
        update: 'Changes will be saved locally and synced when online',
        delete: 'Deletion will be synced when connection is restored',
      };

      return offlineMessages[feature] || null;
    };

    return {
      canCreateReminder,
      canUpdateReminder,
      canDeleteReminder,
      canSyncData,
      canSearchReminders,
      canFilterByDate,
      canExportData,
      canImportData,
      showSyncStatus,
      showOfflineIndicator,
      enableRealTimeUpdates,
      getFeatureMessage,
    };
  }, [isOnline, isSyncing, pendingOperations]);

  return featureAvailability;
}

// Hook for checking specific feature availability
export function useFeatureCheck(feature: string): {
  isAvailable: boolean;
  message: string | null;
  requiresOnline: boolean;
} {
  const isOnline = useOnlineStatus();
  const availability = useFeatureAvailability();

  const featureConfig: Record<string, { requiresOnline: boolean; key: keyof FeatureAvailability }> = {
    create: { requiresOnline: false, key: 'canCreateReminder' },
    update: { requiresOnline: false, key: 'canUpdateReminder' },
    delete: { requiresOnline: false, key: 'canDeleteReminder' },
    sync: { requiresOnline: true, key: 'canSyncData' },
    search: { requiresOnline: false, key: 'canSearchReminders' },
    filter: { requiresOnline: false, key: 'canFilterByDate' },
    export: { requiresOnline: true, key: 'canExportData' },
    import: { requiresOnline: true, key: 'canImportData' },
  };

  const config = featureConfig[feature];
  if (!config) {
    return {
      isAvailable: false,
      message: 'Unknown feature',
      requiresOnline: false,
    };
  }

  const isAvailable = Boolean(availability[config.key]);
  const message = availability.getFeatureMessage(feature);
  const requiresOnline = config.requiresOnline;

  return {
    isAvailable,
    message,
    requiresOnline,
  };
}