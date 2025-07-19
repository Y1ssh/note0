import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotesStore, useNotesActions } from '@/store/notes-store';
import { utils as supabaseUtils } from '@/lib/supabase';
import { NoteStorage } from '@/lib/storage';
import { SYNC_CONFIG } from '@/lib/constants';
import type { SyncStatus } from '@/types/note';

interface SyncState {
  status: SyncStatus;
  lastSyncAt: string | null;
  error: string | null;
  isOnline: boolean;
  syncProgress: number;
  queueSize: number;
}

interface UseSyncReturn extends SyncState {
  sync: () => Promise<void>;
  forceSync: () => Promise<void>;
  resetSync: () => void;
  retryFailedSync: () => Promise<void>;
  clearSyncError: () => void;
}

export function useSync(): UseSyncReturn {
  const actions = useNotesActions();
  const syncStatus = useNotesStore(state => state.syncStatus);
  const isOnline = useNotesStore(state => state.isOnline);
  const lastSyncAt = useNotesStore(state => state.lastSyncAt);
  const offlineQueue = useNotesStore(state => state.offlineQueue);
  
  const [error, setError] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);

  // Automatic sync when coming back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      // Small delay to ensure connection is stable
      setTimeout(() => {
        sync();
      }, 1000);
    }
  }, [isOnline]);

  // Set up periodic sync interval
  useEffect(() => {
    if (isOnline && SYNC_CONFIG.SYNC_INTERVAL > 0) {
      syncIntervalRef.current = setInterval(() => {
        sync();
      }, SYNC_CONFIG.SYNC_INTERVAL);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [isOnline]);

  // Main sync function
  const sync = useCallback(async () => {
    if (!isOnline) {
      return;
    }

    try {
      setError(null);
      setSyncProgress(0);
      actions.setSyncStatus('syncing');

      // Check connection first
      const isConnected = await supabaseUtils.checkConnection();
      if (!isConnected) {
        throw new Error('No connection to database');
      }

      setSyncProgress(25);

      // Process offline queue first
      if (offlineQueue.length > 0) {
        await actions.processOfflineQueue();
        setSyncProgress(50);
      }

      // Fetch latest data from server
      await actions.fetchNotes();
      setSyncProgress(75);

      // Update sync status
      actions.setSyncStatus('synced');
      setSyncProgress(100);

      // Reset retry count on successful sync
      retryCountRef.current = 0;

      // Save last sync time
      const now = new Date().toISOString();
      NoteStorage.setLastSync(now);

    } catch (syncError) {
      console.error('Sync failed:', syncError);
      
      const errorMessage = syncError instanceof Error 
        ? syncError.message 
        : 'Sync failed';
      
      setError(errorMessage);
      actions.setSyncStatus('error');
      setSyncProgress(0);

      // Schedule retry with exponential backoff
      scheduleRetry();
    }
  }, [isOnline, offlineQueue.length, actions]);

  // Force sync (bypass interval and retry logic)
  const forceSync = useCallback(async () => {
    retryCountRef.current = 0;
    await sync();
  }, [sync]);

  // Schedule retry with exponential backoff
  const scheduleRetry = useCallback(() => {
    if (retryCountRef.current >= SYNC_CONFIG.RETRY_ATTEMPTS) {
      console.warn('Max retry attempts reached for sync');
      return;
    }

    const delay = SYNC_CONFIG.RETRY_DELAY * Math.pow(2, retryCountRef.current);
    retryCountRef.current++;

    retryTimeoutRef.current = setTimeout(() => {
      console.log(`Retrying sync (attempt ${retryCountRef.current})`);
      sync();
    }, delay);
  }, [sync]);

  // Retry failed sync manually
  const retryFailedSync = useCallback(async () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    retryCountRef.current = 0;
    await sync();
  }, [sync]);

  // Reset sync state
  const resetSync = useCallback(() => {
    setError(null);
    setSyncProgress(0);
    retryCountRef.current = 0;
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    actions.setSyncStatus('synced');
    actions.clearOfflineQueue();
  }, [actions]);

  // Clear sync error
  const clearSyncError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    status: syncStatus,
    lastSyncAt,
    error,
    isOnline,
    syncProgress,
    queueSize: offlineQueue.length,
    sync,
    forceSync,
    resetSync,
    retryFailedSync,
    clearSyncError,
  };
}

// Hook for managing sync conflicts
export function useSyncConflicts() {
  const [conflicts, setConflicts] = useState<Array<{
    id: string;
    type: 'note' | 'file';
    localVersion: any;
    remoteVersion: any;
    conflictTime: string;
  }>>([]);

  const addConflict = useCallback((conflict: {
    id: string;
    type: 'note' | 'file';
    localVersion: any;
    remoteVersion: any;
  }) => {
    setConflicts(prev => [
      ...prev,
      {
        ...conflict,
        conflictTime: new Date().toISOString(),
      }
    ]);
  }, []);

  const resolveConflict = useCallback((conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    // TODO: Implement actual conflict resolution logic
  }, []);

  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  return {
    conflicts,
    hasConflicts: conflicts.length > 0,
    addConflict,
    resolveConflict,
    clearConflicts,
  };
}

// Hook for sync statistics and monitoring
export function useSyncStats() {
  const [stats, setStats] = useState({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    lastSyncDuration: 0,
    averageSyncTime: 0,
    dataTransferred: 0,
  });

  const updateStats = useCallback((update: Partial<typeof stats>) => {
    setStats(prev => ({ ...prev, ...update }));
  }, []);

  const recordSyncStart = useCallback(() => {
    const startTime = Date.now();
    return startTime;
  }, []);

  const recordSyncEnd = useCallback((startTime: number, success: boolean, dataSize = 0) => {
    const duration = Date.now() - startTime;
    
    setStats(prev => {
      const newTotalSyncs = prev.totalSyncs + 1;
      const newSuccessfulSyncs = success ? prev.successfulSyncs + 1 : prev.successfulSyncs;
      const newFailedSyncs = success ? prev.failedSyncs : prev.failedSyncs + 1;
      const newAverageSyncTime = ((prev.averageSyncTime * prev.totalSyncs) + duration) / newTotalSyncs;

      return {
        totalSyncs: newTotalSyncs,
        successfulSyncs: newSuccessfulSyncs,
        failedSyncs: newFailedSyncs,
        lastSyncDuration: duration,
        averageSyncTime: newAverageSyncTime,
        dataTransferred: prev.dataTransferred + dataSize,
      };
    });
  }, []);

  const resetStats = useCallback(() => {
    setStats({
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastSyncDuration: 0,
      averageSyncTime: 0,
      dataTransferred: 0,
    });
  }, []);

  return {
    stats,
    updateStats,
    recordSyncStart,
    recordSyncEnd,
    resetStats,
    successRate: stats.totalSyncs > 0 ? (stats.successfulSyncs / stats.totalSyncs) * 100 : 0,
  };
}

// Hook for bandwidth-aware syncing
export function useBandwidthAwareSync() {
  const [connectionType, setConnectionType] = useState<'fast' | 'slow' | 'unknown'>('unknown');
  const [dataUsage, setDataUsage] = useState(0);
  const { sync } = useSync();

  // Detect connection speed (basic implementation)
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConnectionInfo = () => {
        const effectiveType = connection.effectiveType;
        
        if (effectiveType === '4g' || effectiveType === '3g') {
          setConnectionType('fast');
        } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
          setConnectionType('slow');
        } else {
          setConnectionType('unknown');
        }
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);

      return () => {
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }
  }, []);

  const adaptiveSync = useCallback(async () => {
    if (connectionType === 'slow') {
      // On slow connections, only sync critical data
      console.log('Slow connection detected, performing lightweight sync');
      // TODO: Implement lightweight sync logic
    } else {
      // On fast connections, perform full sync
      await sync();
    }
  }, [connectionType, sync]);

  const trackDataUsage = useCallback((bytes: number) => {
    setDataUsage(prev => prev + bytes);
  }, []);

  return {
    connectionType,
    dataUsage,
    adaptiveSync,
    trackDataUsage,
    isSlowConnection: connectionType === 'slow',
  };
}

// Hook for sync scheduling
export function useSyncScheduler() {
  const [isScheduled, setIsScheduled] = useState(false);
  const [nextSyncTime, setNextSyncTime] = useState<Date | null>(null);
  const scheduleRef = useRef<NodeJS.Timeout>();
  const { sync } = useSync();

  const scheduleSync = useCallback((delay: number) => {
    if (scheduleRef.current) {
      clearTimeout(scheduleRef.current);
    }

    const scheduledTime = new Date(Date.now() + delay);
    setNextSyncTime(scheduledTime);
    setIsScheduled(true);

    scheduleRef.current = setTimeout(() => {
      sync();
      setIsScheduled(false);
      setNextSyncTime(null);
    }, delay);
  }, [sync]);

  const cancelScheduledSync = useCallback(() => {
    if (scheduleRef.current) {
      clearTimeout(scheduleRef.current);
      scheduleRef.current = undefined;
    }
    setIsScheduled(false);
    setNextSyncTime(null);
  }, []);

  // Schedule sync during low activity periods
  const scheduleOptimalSync = useCallback(() => {
    // Schedule sync for when user is likely to be less active
    const now = new Date();
    const hour = now.getHours();
    
    let delay: number;
    
    // If it's late night/early morning, schedule sooner
    if (hour >= 23 || hour <= 6) {
      delay = 5 * 60 * 1000; // 5 minutes
    } else {
      delay = 30 * 60 * 1000; // 30 minutes
    }
    
    scheduleSync(delay);
  }, [scheduleSync]);

  useEffect(() => {
    return () => {
      if (scheduleRef.current) {
        clearTimeout(scheduleRef.current);
      }
    };
  }, []);

  return {
    isScheduled,
    nextSyncTime,
    scheduleSync,
    cancelScheduledSync,
    scheduleOptimalSync,
  };
} 