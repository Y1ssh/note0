import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotesActions } from '@/store/notes-store';

interface ConnectionInfo {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null; // Round-trip time
  saveData: boolean;
}

interface UseOnlineReturn extends ConnectionInfo {
  checkConnection: () => Promise<boolean>;
  forceRecheck: () => void;
  connectionHistory: Array<{
    timestamp: string;
    isOnline: boolean;
    connectionType: string | null;
  }>;
}

export function useOnline(): UseOnlineReturn {
  const actions = useNotesActions();
  
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: null,
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false,
  });

  const [connectionHistory, setConnectionHistory] = useState<Array<{
    timestamp: string;
    isOnline: boolean;
    connectionType: string | null;
  }>>([]);

  const checkTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCheckRef = useRef<number>(0);

  // Get network information from Navigator API
  const getNetworkInfo = useCallback((): Partial<ConnectionInfo> => {
    if (typeof navigator === 'undefined') {
      return {};
    }

    const connection = (navigator as any).connection 
      || (navigator as any).mozConnection 
      || (navigator as any).webkitConnection;

    if (!connection) {
      return {};
    }

    const effectiveType = connection.effectiveType || null;
    const isSlowConnection = effectiveType === 'slow-2g' || effectiveType === '2g';

    return {
      connectionType: connection.type || null,
      effectiveType,
      downlink: connection.downlink || null,
      rtt: connection.rtt || null,
      saveData: connection.saveData || false,
      isSlowConnection,
    };
  }, []);

  // Perform actual network connectivity check
  const checkConnection = useCallback(async (): Promise<boolean> => {
    // Avoid too frequent checks
    const now = Date.now();
    if (now - lastCheckRef.current < 1000) {
      return connectionInfo.isOnline;
    }
    lastCheckRef.current = now;

    try {
      // Try to fetch a small resource to verify actual connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://httpbin.org/json', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      // If fetch fails, we're likely offline
      return false;
    }
  }, [connectionInfo.isOnline]);

  // Update connection status
  const updateConnectionStatus = useCallback((isOnline: boolean) => {
    const networkInfo = getNetworkInfo();
    
    setConnectionInfo(prev => ({
      ...prev,
      isOnline,
      ...networkInfo,
    }));

    // Update store
    actions.setOnlineStatus(isOnline);

    // Add to history
    setConnectionHistory(prev => {
      const newEntry = {
        timestamp: new Date().toISOString(),
        isOnline,
        connectionType: networkInfo.connectionType || null,
      };
      
      // Keep only last 50 entries
      return [newEntry, ...prev.slice(0, 49)];
    });
  }, [getNetworkInfo, actions]);

  // Force recheck connection
  const forceRecheck = useCallback(async () => {
    const isOnline = await checkConnection();
    updateConnectionStatus(isOnline);
  }, [checkConnection, updateConnectionStatus]);

  // Set up event listeners for online/offline detection
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOnline = () => {
      console.log('Network: Online');
      updateConnectionStatus(true);
    };

    const handleOffline = () => {
      console.log('Network: Offline');
      updateConnectionStatus(false);
    };

    // Listen for native online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes (if supported)
    const connection = (navigator as any).connection;
    if (connection) {
      const handleConnectionChange = () => {
        console.log('Network: Connection changed');
        // Small delay to let the connection stabilize
        setTimeout(() => {
          forceRecheck();
        }, 500);
      };

      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateConnectionStatus, forceRecheck]);

  // Periodic connectivity checks (every 30 seconds when online)
  useEffect(() => {
    if (connectionInfo.isOnline) {
      checkTimeoutRef.current = setInterval(async () => {
        const isConnected = await checkConnection();
        if (!isConnected && connectionInfo.isOnline) {
          updateConnectionStatus(false);
        }
      }, 30000);

      return () => {
        if (checkTimeoutRef.current) {
          clearInterval(checkTimeoutRef.current);
        }
      };
    }
  }, [connectionInfo.isOnline, checkConnection, updateConnectionStatus]);

  // Initial setup
  useEffect(() => {
    updateConnectionStatus(navigator.onLine);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearInterval(checkTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...connectionInfo,
    checkConnection,
    forceRecheck,
    connectionHistory,
  };
}

// Hook for connection quality monitoring
export function useConnectionQuality() {
  const [quality, setQuality] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'offline'>('good');
  const [metrics, setMetrics] = useState({
    latency: 0,
    bandwidth: 0,
    packetLoss: 0,
    jitter: 0,
  });

  const measureLatency = useCallback(async (): Promise<number> => {
    const start = performance.now();
    
    try {
      await fetch('https://httpbin.org/json', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
      });
      
      return performance.now() - start;
    } catch {
      return Infinity;
    }
  }, []);

  const measureBandwidth = useCallback(async (): Promise<number> => {
    const testSize = 100000; // 100KB test
    const start = performance.now();
    
    try {
      const response = await fetch(`https://httpbin.org/bytes/${testSize}`, {
        cache: 'no-cache',
      });
      
      await response.blob();
      const duration = (performance.now() - start) / 1000; // seconds
      
      return (testSize * 8) / duration / 1000; // kbps
    } catch {
      return 0;
    }
  }, []);

  const assessQuality = useCallback(async () => {
    const latency = await measureLatency();
    
    if (latency === Infinity) {
      setQuality('offline');
      return;
    }

    // Simple quality assessment based on latency
    if (latency < 100) {
      setQuality('excellent');
    } else if (latency < 300) {
      setQuality('good');
    } else if (latency < 600) {
      setQuality('fair');
    } else {
      setQuality('poor');
    }

    setMetrics(prev => ({ ...prev, latency }));
  }, [measureLatency]);

  const runSpeedTest = useCallback(async () => {
    const bandwidth = await measureBandwidth();
    setMetrics(prev => ({ ...prev, bandwidth }));
  }, [measureBandwidth]);

  return {
    quality,
    metrics,
    assessQuality,
    runSpeedTest,
    isGoodConnection: quality === 'excellent' || quality === 'good',
  };
}

// Hook for adaptive behavior based on connection
export function useAdaptiveConnection() {
  const { isOnline, isSlowConnection, saveData } = useOnline();
  const { quality } = useConnectionQuality();

  const shouldReduceQuality = isSlowConnection || saveData || quality === 'poor';
  const shouldPreloadContent = !shouldReduceQuality && isOnline;
  const shouldCompress = isSlowConnection || saveData;
  const shouldBatch = shouldReduceQuality;

  const getOptimalImageQuality = useCallback(() => {
    if (!isOnline) return 'low';
    if (shouldReduceQuality) return 'medium';
    return 'high';
  }, [isOnline, shouldReduceQuality]);

  const getOptimalSyncInterval = useCallback(() => {
    if (!isOnline) return 0; // No sync when offline
    if (shouldReduceQuality) return 60000; // 1 minute
    return 30000; // 30 seconds
  }, [isOnline, shouldReduceQuality]);

  const shouldDeferNonCriticalOperations = useCallback(() => {
    return !isOnline || shouldReduceQuality;
  }, [isOnline, shouldReduceQuality]);

  return {
    isOnline,
    isSlowConnection,
    quality,
    shouldReduceQuality,
    shouldPreloadContent,
    shouldCompress,
    shouldBatch,
    getOptimalImageQuality,
    getOptimalSyncInterval,
    shouldDeferNonCriticalOperations,
  };
}

// Hook for offline-first behavior
export function useOfflineFirst() {
  const { isOnline } = useOnline();
  const [offlineActions, setOfflineActions] = useState<Array<{
    id: string;
    action: string;
    data: any;
    timestamp: string;
  }>>([]);

  const queueAction = useCallback((action: string, data: any) => {
    const id = Math.random().toString(36).substring(2);
    const newAction = {
      id,
      action,
      data,
      timestamp: new Date().toISOString(),
    };

    setOfflineActions(prev => [...prev, newAction]);
    return id;
  }, []);

  const removeAction = useCallback((id: string) => {
    setOfflineActions(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearActions = useCallback(() => {
    setOfflineActions([]);
  }, []);

  const processQueuedActions = useCallback(async () => {
    if (!isOnline || offlineActions.length === 0) {
      return;
    }

    // Process actions sequentially to maintain order
    for (const action of offlineActions) {
      try {
        // Here you would dispatch the actual action
        console.log('Processing queued action:', action);
        removeAction(action.id);
      } catch (error) {
        console.error('Failed to process action:', action, error);
        // Keep the action in queue for retry
      }
    }
  }, [isOnline, offlineActions, removeAction]);

  // Auto-process queue when coming back online
  useEffect(() => {
    if (isOnline) {
      processQueuedActions();
    }
  }, [isOnline, processQueuedActions]);

  return {
    isOnline,
    queuedActionsCount: offlineActions.length,
    queueAction,
    removeAction,
    clearActions,
    processQueuedActions,
  };
} 