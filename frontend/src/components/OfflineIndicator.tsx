import React, { useEffect, useState } from 'react';
import {
  Box,
  Chip,
  Snackbar,
  Alert,
  Typography,
  IconButton,
  Collapse,
  LinearProgress,
} from '@mui/material';
import {
  WifiOff,
  Wifi,
  Sync,
  SyncProblem,
  ExpandLess,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../types';
import { setOnlineStatus } from '../store/slices/uiSlice';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { syncService } from '../services/syncService';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showDetailsButton?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  position = 'top',
  showDetailsButton = true,
}) => {
  const dispatch = useDispatch();
  const isOnline = useOnlineStatus();
  const uiState = useSelector((state: RootState) => state.ui);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [showDetails, setShowDetailsState] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Update Redux store when online status changes
  useEffect(() => {
    dispatch(setOnlineStatus(isOnline));
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

  // Load initial sync data
  useEffect(() => {
    const loadSyncData = async () => {
      try {
        const [pendingCount, lastSync] = await Promise.all([
          syncService.getPendingOperationsCount(),
          syncService.getLastSyncTime(),
        ]);
        
        setPendingOperations(pendingCount);
        setLastSyncTime(lastSync);
      } catch (error) {
        console.error('Failed to load sync data:', error);
      }
    };

    loadSyncData();
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingOperations > 0) {
      handleSync();
    }
  }, [isOnline, pendingOperations]);

  // Handle manual sync
  const handleSync = async () => {
    if (isSyncing || !isOnline) return;

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
      } else {
        setSyncError('Sync completed with errors');
      }
    } catch (error) {
      setSyncError('Sync failed');
      console.error('Sync error:', error);
    }
  };

  // Format last sync time
  const formatLastSyncTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  // Get status color
  const getStatusColor = (): 'success' | 'warning' | 'error' | 'info' => {
    if (!isOnline) return 'error';
    if (isSyncing) return 'info';
    if (pendingOperations > 0) return 'warning';
    return 'success';
  };

  // Get status text
  const getStatusText = (): string => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (pendingOperations > 0) return `${pendingOperations} pending`;
    return 'Online';
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff />;
    if (isSyncing) return <Sync className="rotating" />;
    if (pendingOperations > 0) return <SyncProblem />;
    return <Wifi />;
  };

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          [position]: 16,
          right: 16,
          zIndex: 1300,
          minWidth: 120,
        }}
      >
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor()}
          variant={isOnline ? 'filled' : 'outlined'}
          onClick={() => showDetailsButton && setShowDetailsState(!showDetails)}
          sx={{
            cursor: showDetailsButton ? 'pointer' : 'default',
            '& .rotating': {
              animation: 'spin 1s linear infinite',
            },
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />

        {showDetails && (
          <Collapse in={showDetails}>
            <Box
              sx={{
                mt: 1,
                p: 2,
                backgroundColor: 'background.paper',
                borderRadius: 1,
                boxShadow: 2,
                minWidth: 250,
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Connection Status
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {getStatusIcon()}
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {isOnline ? 'Connected' : 'Disconnected'}
                </Typography>
              </Box>

              {isOnline && (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last sync: {formatLastSyncTime(lastSyncTime)}
                  </Typography>

                  {pendingOperations > 0 && (
                    <Typography variant="body2" color="warning.main" gutterBottom>
                      {pendingOperations} operations pending sync
                    </Typography>
                  )}

                  {isSyncing && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress />
                      <Typography variant="caption" color="text.secondary">
                        Synchronizing data...
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <IconButton
                      size="small"
                      onClick={handleSync}
                      disabled={isSyncing}
                      title="Sync now"
                    >
                      <Sync />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      onClick={() => setShowDetailsState(false)}
                      title="Close"
                    >
                      <ExpandLess />
                    </IconButton>
                  </Box>
                </>
              )}

              {!isOnline && (
                <Typography variant="body2" color="text.secondary">
                  Working offline. Changes will sync when connection is restored.
                </Typography>
              )}
            </Box>
          </Collapse>
        )}
      </Box>

      {/* Sync error notification */}
      <Snackbar
        open={!!syncError}
        autoHideDuration={6000}
        onClose={() => setSyncError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSyncError(null)} severity="error">
          {syncError}
        </Alert>
      </Snackbar>

      {/* Connection status notifications */}
      <Snackbar
        open={!isOnline}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning">
          You're offline. Changes will be saved locally and synced when connection is restored.
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineIndicator;