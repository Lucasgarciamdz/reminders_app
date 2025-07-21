import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
  Alert,
} from '@mui/material';
import {
  Sync,
  SyncProblem,
  CheckCircle,
  Error,
  Warning,
  Refresh,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import { useOfflineManager } from '../hooks/useOfflineManager';

interface SyncStatusIndicatorProps {
  compact?: boolean;
  showDetails?: boolean;
}

interface RetryInfo {
  operationId: string;
  attempt: number;
  maxRetries: number;
  delay?: number;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  compact = false,
  showDetails = true,
}) => {
  const { isOnline } = useSelector((state: RootState) => state.ui);
  const {
    isSyncing,
    pendingOperations,
    lastSyncTime,
    syncError,
    syncNow,
    clearSyncError,
  } = useOfflineManager();

  const [retryInfo, setRetryInfo] = useState<RetryInfo[]>([]);
  const [showDetailsState, setShowDetailsState] = useState(false);
  const [apiRetryAttempts, setApiRetryAttempts] = useState<number>(0);

  // Listen for sync retry events
  useEffect(() => {
    const handleRetryScheduled = (event: CustomEvent) => {
      const { operationId, attempt, maxRetries, delay } = event.detail;
      setRetryInfo(prev => [
        ...prev.filter(r => r.operationId !== operationId),
        { operationId, attempt, maxRetries, delay },
      ]);
    };

    const handleRetrySuccess = (event: CustomEvent) => {
      const { operationId } = event.detail;
      setRetryInfo(prev => prev.filter(r => r.operationId !== operationId));
    };

    const handleRetryFailed = (event: CustomEvent) => {
      const { operationId } = event.detail;
      setRetryInfo(prev => prev.filter(r => r.operationId !== operationId));
    };

    const handleApiRetry = (event: CustomEvent) => {
      const { attempt } = event.detail;
      setApiRetryAttempts(attempt);
    };

    const handleApiMaxRetries = () => {
      setApiRetryAttempts(0);
    };

    window.addEventListener('sync:retry-scheduled', handleRetryScheduled as EventListener);
    window.addEventListener('sync:retry-success', handleRetrySuccess as EventListener);
    window.addEventListener('sync:retry-failed', handleRetryFailed as EventListener);
    window.addEventListener('api:retry-attempt', handleApiRetry as EventListener);
    window.addEventListener('api:max-retries-exceeded', handleApiMaxRetries);

    return () => {
      window.removeEventListener('sync:retry-scheduled', handleRetryScheduled as EventListener);
      window.removeEventListener('sync:retry-success', handleRetrySuccess as EventListener);
      window.removeEventListener('sync:retry-failed', handleRetryFailed as EventListener);
      window.removeEventListener('api:retry-attempt', handleApiRetry as EventListener);
      window.removeEventListener('api:max-retries-exceeded', handleApiMaxRetries);
    };
  }, []);

  // Get sync status
  const getSyncStatus = () => {
    if (!isOnline) return 'offline';
    if (isSyncing) return 'syncing';
    if (syncError) return 'error';
    if (pendingOperations > 0) return 'pending';
    if (retryInfo.length > 0) return 'retrying';
    return 'synced';
  };

  // Get status color
  const getStatusColor = () => {
    const status = getSyncStatus();
    switch (status) {
      case 'offline': return 'error';
      case 'syncing': return 'info';
      case 'error': return 'error';
      case 'pending': return 'warning';
      case 'retrying': return 'warning';
      case 'synced': return 'success';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    const status = getSyncStatus();
    switch (status) {
      case 'offline': return <SyncProblem />;
      case 'syncing': return <Sync className="rotating" />;
      case 'error': return <Error />;
      case 'pending': return <Warning />;
      case 'retrying': return <Refresh className="rotating" />;
      case 'synced': return <CheckCircle />;
      default: return <Sync />;
    }
  };

  // Get status text
  const getStatusText = () => {
    const status = getSyncStatus();
    switch (status) {
      case 'offline': return 'Offline';
      case 'syncing': return 'Syncing...';
      case 'error': return 'Sync Error';
      case 'pending': return `${pendingOperations} pending`;
      case 'retrying': return `Retrying (${retryInfo.length})`;
      case 'synced': return 'Synced';
      default: return 'Unknown';
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

  if (compact) {
    return (
      <Tooltip title={`Sync Status: ${getStatusText()}`}>
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor()}
          size="small"
          onClick={showDetails ? () => setShowDetailsState(!showDetailsState) : undefined}
          sx={{
            cursor: showDetails ? 'pointer' : 'default',
            '& .rotating': {
              animation: 'spin 1s linear infinite',
            },
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Main status display */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          backgroundColor: 'background.paper',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon()}
          <Typography variant="body2" fontWeight="medium">
            {getStatusText()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isOnline && (
            <IconButton
              size="small"
              onClick={syncNow}
              disabled={isSyncing}
              title="Sync now"
            >
              <Sync />
            </IconButton>
          )}
          
          {showDetails && (
            <IconButton
              size="small"
              onClick={() => setShowDetailsState(!showDetailsState)}
              title={showDetailsState ? 'Hide details' : 'Show details'}
            >
              {showDetailsState ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Sync progress indicator */}
      {isSyncing && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Synchronizing {pendingOperations} operations...
          </Typography>
        </Box>
      )}

      {/* API retry indicator */}
      {apiRetryAttempts > 0 && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress color="warning" />
          <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
            Retrying network request (attempt {apiRetryAttempts})...
          </Typography>
        </Box>
      )}

      {/* Error display */}
      {syncError && (
        <Alert
          severity="error"
          sx={{ mt: 1 }}
          action={
            <IconButton
              size="small"
              onClick={clearSyncError}
              title="Dismiss error"
            >
              <ExpandLess />
            </IconButton>
          }
        >
          {syncError}
        </Alert>
      )}

      {/* Detailed status */}
      <Collapse in={showDetailsState}>
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Sync Details
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Status: {isOnline ? 'Online' : 'Offline'}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Last sync: {formatLastSyncTime(lastSyncTime)}
            </Typography>
            
            {pendingOperations > 0 && (
              <Typography variant="body2" color="warning.main">
                {pendingOperations} operations pending sync
              </Typography>
            )}

            {retryInfo.length > 0 && (
              <Box>
                <Typography variant="body2" color="warning.main" gutterBottom>
                  Retrying operations:
                </Typography>
                {retryInfo.map((retry) => (
                  <Typography
                    key={retry.operationId}
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', ml: 1 }}
                  >
                    Operation {retry.operationId.slice(-8)}: Attempt {retry.attempt}/{retry.maxRetries}
                  </Typography>
                ))}
              </Box>
            )}

            {!isOnline && (
              <Typography variant="body2" color="text.secondary">
                Working offline. Changes will sync when connection is restored.
              </Typography>
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default SyncStatusIndicator;