import React, { useEffect, useState } from 'react';
import {
  Snackbar,
  Alert,
  Box,
  Typography,
  Button,
  Slide,
  Fade,
} from '@mui/material';
import {
  WifiOff,
  Wifi,
  Sync,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useOfflineManager } from '../hooks/useOfflineManager';
import { useFeatureAvailability } from '../hooks/useFeatureAvailability';

interface AppOfflineManagerProps {
  children: React.ReactNode;
}

interface ConnectionEvent {
  type: 'online' | 'offline' | 'sync-start' | 'sync-complete' | 'sync-error';
  timestamp: number;
  message: string;
}

const AppOfflineManager: React.FC<AppOfflineManagerProps> = ({ children }) => {
  const {
    isOnline,
    isSyncing,
    pendingOperations,
    syncError,
    syncNow,
    clearSyncError,
  } = useOfflineManager();

  const { showOfflineIndicator, getFeatureMessage } = useFeatureAvailability();

  const [connectionEvents, setConnectionEvents] = useState<ConnectionEvent[]>([]);
  const [showTransitionMessage, setShowTransitionMessage] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [wasOffline, setWasOffline] = useState(!isOnline);

  // Handle connection state changes
  useEffect(() => {
    const now = Date.now();
    
    if (isOnline && wasOffline) {
      // Coming back online
      const message = pendingOperations > 0 
        ? `Back online! Syncing ${pendingOperations} pending changes...`
        : 'Back online!';
      
      setConnectionEvents(prev => [...prev, {
        type: 'online',
        timestamp: now,
        message,
      }]);
      
      setTransitionMessage(message);
      setShowTransitionMessage(true);
      
      // Auto-hide after 3 seconds
      setTimeout(() => setShowTransitionMessage(false), 3000);
      
    } else if (!isOnline && !wasOffline) {
      // Going offline
      const message = 'You\'re now offline. Changes will be saved locally.';
      
      setConnectionEvents(prev => [...prev, {
        type: 'offline',
        timestamp: now,
        message,
      }]);
      
      setTransitionMessage(message);
      setShowTransitionMessage(true);
      
      // Auto-hide after 5 seconds
      setTimeout(() => setShowTransitionMessage(false), 5000);
    }
    
    setWasOffline(!isOnline);
  }, [isOnline, wasOffline, pendingOperations]);

  // Handle sync state changes
  useEffect(() => {
    const now = Date.now();
    
    if (isSyncing) {
      setConnectionEvents(prev => [...prev, {
        type: 'sync-start',
        timestamp: now,
        message: `Synchronizing ${pendingOperations} operations...`,
      }]);
    }
  }, [isSyncing, pendingOperations]);

  // Handle sync completion
  useEffect(() => {
    if (!isSyncing && wasOffline && isOnline && pendingOperations === 0) {
      const now = Date.now();
      
      setConnectionEvents(prev => [...prev, {
        type: 'sync-complete',
        timestamp: now,
        message: 'All changes synchronized successfully!',
      }]);
      
      setTransitionMessage('All changes synchronized successfully!');
      setShowTransitionMessage(true);
      setTimeout(() => setShowTransitionMessage(false), 3000);
    }
  }, [isSyncing, wasOffline, isOnline, pendingOperations]);

  // Handle sync errors
  useEffect(() => {
    if (syncError) {
      const now = Date.now();
      
      setConnectionEvents(prev => [...prev, {
        type: 'sync-error',
        timestamp: now,
        message: syncError,
      }]);
    }
  }, [syncError]);

  // Get transition icon
  const getTransitionIcon = () => {
    if (!isOnline) return <WifiOff />;
    if (isSyncing) return <Sync className="rotating" />;
    if (pendingOperations === 0 && isOnline) return <CheckCircle />;
    return <Wifi />;
  };

  // Get transition severity
  const getTransitionSeverity = (): 'success' | 'info' | 'warning' | 'error' => {
    if (!isOnline) return 'warning';
    if (syncError) return 'error';
    if (isSyncing) return 'info';
    return 'success';
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {children}

      {/* Connection transition message */}
      <Slide direction="down" in={showTransitionMessage} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1400,
            minWidth: 300,
            maxWidth: 500,
          }}
        >
          <Alert
            severity={getTransitionSeverity()}
            icon={getTransitionIcon()}
            sx={{
              '& .rotating': {
                animation: 'spin 1s linear infinite',
              },
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
            action={
              !isOnline && pendingOperations > 0 ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setShowTransitionMessage(false)}
                >
                  OK
                </Button>
              ) : undefined
            }
          >
            <Typography variant="body2">{transitionMessage}</Typography>
          </Alert>
        </Box>
      </Slide>

      {/* Persistent offline indicator */}
      {showOfflineIndicator && (
        <Fade in={!isOnline || pendingOperations > 0}>
          <Box
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1300,
            }}
          >
            <Alert
              severity={!isOnline ? 'warning' : 'info'}
              icon={!isOnline ? <WifiOff /> : <Warning />}
              sx={{
                minWidth: 250,
                '& .MuiAlert-message': {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                },
              }}
              action={
                isOnline && pendingOperations > 0 ? (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={syncNow}
                    disabled={isSyncing}
                    startIcon={<Sync />}
                  >
                    Sync Now
                  </Button>
                ) : undefined
              }
            >
              <Typography variant="body2" fontWeight="medium">
                {!isOnline ? 'Working Offline' : `${pendingOperations} Changes Pending`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getFeatureMessage(!isOnline ? 'sync' : 'create')}
              </Typography>
            </Alert>
          </Box>
        </Fade>
      )}

      {/* Sync error notification */}
      <Snackbar
        open={!!syncError}
        autoHideDuration={8000}
        onClose={clearSyncError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={clearSyncError}
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={syncNow}
              disabled={!isOnline || isSyncing}
            >
              Retry
            </Button>
          }
        >
          <Typography variant="body2">{syncError}</Typography>
        </Alert>
      </Snackbar>

      {/* Development: Connection events log (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            maxWidth: 300,
            maxHeight: 200,
            overflow: 'auto',
            backgroundColor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            fontSize: '0.75rem',
            opacity: 0.8,
            zIndex: 1200,
          }}
        >
          <Typography variant="caption" fontWeight="bold" gutterBottom>
            Connection Events:
          </Typography>
          {connectionEvents.slice(-5).map((event, index) => (
            <Typography
              key={`${event.timestamp}-${index}`}
              variant="caption"
              sx={{
                display: 'block',
                color: event.type === 'sync-error' ? 'error.main' : 'text.secondary',
                mb: 0.5,
              }}
            >
              {new Date(event.timestamp).toLocaleTimeString()}: {event.message}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AppOfflineManager;