import React, { useState, useEffect } from 'react';
import { Button, Snackbar, Alert, Box, Typography } from '@mui/material';
import { GetApp as InstallIcon, Close as CloseIcon } from '@mui/icons-material';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
}) => {
  const { canInstall, install } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Show prompt after a delay if installation is available
    if (canInstall) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [canInstall]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const result = await install();
      if (result) {
        setShowPrompt(false);
        onInstall?.();
      }
    } catch (error) {
      console.error('Failed to install PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onDismiss?.();
  };

  if (!canInstall || !showPrompt) {
    return null;
  }

  return (
    <Snackbar
      open={showPrompt}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: 2 }}
    >
      <Alert
        severity="info"
        sx={{
          width: '100%',
          alignItems: 'center',
          '& .MuiAlert-message': {
            flex: 1,
          },
        }}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              color="inherit"
              size="small"
              onClick={handleInstall}
              disabled={isInstalling}
              startIcon={<InstallIcon />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={handleDismiss}
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </Button>
          </Box>
        }
      >
        <Typography variant="body2">
          Install Reminders app for quick access and offline use
        </Typography>
      </Alert>
    </Snackbar>
  );
};

export default PWAInstallPrompt;