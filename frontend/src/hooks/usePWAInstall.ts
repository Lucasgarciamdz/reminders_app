import { useState, useEffect } from 'react';
import { installPWA } from '../utils/serviceWorkerRegistration';

interface UsePWAInstallReturn {
  canInstall: boolean;
  install: () => Promise<boolean>;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [canInstall, setCanInstall] = useState<boolean>(false);

  useEffect(() => {
    const checkInstallPrompt = () => {
      setCanInstall(!!window.deferredPrompt);
    };

    // Check initially
    checkInstallPrompt();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = () => {
      setCanInstall(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    const result = await installPWA();
    if (result) {
      setCanInstall(false);
    }
    return result;
  };

  return { canInstall, install };
}