import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Enhanced network connectivity check
  const verifyConnectivity = useCallback(async (): Promise<boolean> => {
    if (isVerifying) return isOnline;
    
    setIsVerifying(true);
    
    try {
      // Try to fetch a small resource with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const isConnected = response.ok;
      
      if (isConnected !== isOnline) {
        setIsOnline(isConnected);
      }
      
      return isConnected;
    } catch (error) {
      // Network request failed, we're likely offline
      if (isOnline) {
        setIsOnline(false);
      }
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [isOnline, isVerifying]);

  // Get network information if available
  const getNetworkInfo = useCallback((): NetworkStatus => {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
    
    return {
      isOnline,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    };
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Verify connectivity when coming back online
      setTimeout(verifyConnectivity, 1000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    // Handle visibility change to check connectivity when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        verifyConnectivity();
      }
    };

    // Handle network information changes
    const handleConnectionChange = () => {
      if (navigator.onLine) {
        verifyConnectivity();
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Network Information API listeners
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Initial connectivity verification
    if (navigator.onLine) {
      setTimeout(verifyConnectivity, 1000);
    }

    // Periodic connectivity check (every 30 seconds when online)
    const intervalId = setInterval(() => {
      if (navigator.onLine && !document.hidden) {
        verifyConnectivity();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
      
      clearInterval(intervalId);
    };
  }, [verifyConnectivity]);

  return isOnline;
}

// Hook for getting detailed network information
export function useNetworkInfo(): NetworkStatus {
  const isOnline = useOnlineStatus();
  
  const getNetworkInfo = useCallback((): NetworkStatus => {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
    
    return {
      isOnline,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    };
  }, [isOnline]);

  return getNetworkInfo();
}