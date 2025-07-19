import { STORAGE_KEYS } from './constants';

/**
 * Utility class for localStorage operations with error handling
 */
export class Storage {
  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get item from localStorage with type safety
   */
  static get<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Failed to get localStorage item "${key}":`, error);
      return defaultValue;
    }
  }

  /**
   * Set item in localStorage with error handling
   */
  static set<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Failed to set localStorage item "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  static remove(key: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove localStorage item "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all localStorage items
   */
  static clear(): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * Get all keys from localStorage
   */
  static keys(): string[] {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.warn('Failed to get localStorage keys:', error);
      return [];
    }
  }

  /**
   * Get storage usage information
   */
  static getUsage(): { used: number; available: number; total: number } {
    if (!this.isAvailable()) {
      return { used: 0, available: 0, total: 0 };
    }

    try {
      let used = 0;
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          const value = window.localStorage.getItem(key);
          used += key.length + (value?.length || 0);
        }
      }

      // Estimate total available storage (usually 5-10MB)
      const total = 5 * 1024 * 1024; // 5MB estimate
      const available = total - used;

      return { used, available, total };
    } catch (error) {
      console.warn('Failed to calculate localStorage usage:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }

  /**
   * Check if storage is getting full (>80% usage)
   */
  static isNearCapacity(): boolean {
    const { used, total } = this.getUsage();
    return used / total > 0.8;
  }

  /**
   * Cleanup old or unnecessary items
   */
  static cleanup(): void {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const keys = this.keys();
      const appKeys = Object.values(STORAGE_KEYS);
      
             // Remove non-app related keys if storage is near capacity
       if (this.isNearCapacity()) {
         keys.forEach(key => {
           if (!appKeys.includes(key as keyof typeof STORAGE_KEYS)) {
             this.remove(key);
           }
         });
       }
    } catch (error) {
      console.warn('Failed to cleanup localStorage:', error);
    }
  }
}

/**
 * Specific storage functions for the Note0 app
 */
export const NoteStorage = {
  /**
   * Get notes from localStorage
   */
  getNotes: () => Storage.get(STORAGE_KEYS.NOTES, []),

  /**
   * Set notes in localStorage
   */
  setNotes: (notes: any[]) => Storage.set(STORAGE_KEYS.NOTES, notes),

  /**
   * Get files from localStorage
   */
  getFiles: () => Storage.get(STORAGE_KEYS.FILES, []),

  /**
   * Set files in localStorage
   */
  setFiles: (files: any[]) => Storage.set(STORAGE_KEYS.FILES, files),

  /**
   * Get app settings
   */
  getSettings: () => Storage.get(STORAGE_KEYS.SETTINGS, {}),

  /**
   * Set app settings
   */
  setSettings: (settings: any) => Storage.set(STORAGE_KEYS.SETTINGS, settings),

  /**
   * Get theme preference
   */
  getTheme: () => Storage.get(STORAGE_KEYS.THEME, 'system'),

  /**
   * Set theme preference
   */
  setTheme: (theme: string) => Storage.set(STORAGE_KEYS.THEME, theme),

  /**
   * Get sidebar width
   */
  getSidebarWidth: () => Storage.get(STORAGE_KEYS.SIDEBAR_WIDTH, 280),

  /**
   * Set sidebar width
   */
  setSidebarWidth: (width: number) => Storage.set(STORAGE_KEYS.SIDEBAR_WIDTH, width),

  /**
   * Get editor preferences
   */
  getEditorPreferences: () => Storage.get(STORAGE_KEYS.EDITOR_PREFERENCES, {}),

  /**
   * Set editor preferences
   */
  setEditorPreferences: (preferences: any) => Storage.set(STORAGE_KEYS.EDITOR_PREFERENCES, preferences),

  /**
   * Get last sync timestamp
   */
  getLastSync: () => Storage.get(STORAGE_KEYS.LAST_SYNC, null),

  /**
   * Set last sync timestamp
   */
  setLastSync: (timestamp: string) => Storage.set(STORAGE_KEYS.LAST_SYNC, timestamp),

  /**
   * Get offline queue
   */
  getOfflineQueue: () => Storage.get(STORAGE_KEYS.OFFLINE_QUEUE, []),

  /**
   * Set offline queue
   */
  setOfflineQueue: (queue: any[]) => Storage.set(STORAGE_KEYS.OFFLINE_QUEUE, queue),

  /**
   * Add item to offline queue
   */
  addToOfflineQueue: (item: any) => {
    const queue = NoteStorage.getOfflineQueue();
    queue.push(item);
    NoteStorage.setOfflineQueue(queue);
  },

  /**
   * Remove item from offline queue
   */
  removeFromOfflineQueue: (itemId: string) => {
    const queue = NoteStorage.getOfflineQueue();
    const filteredQueue = queue.filter((item: any) => item.id !== itemId);
    NoteStorage.setOfflineQueue(filteredQueue);
  },

  /**
   * Clear all app data
   */
  clearAppData: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      Storage.remove(key);
    });
  },

  /**
   * Export all app data
   */
  exportAppData: () => {
    const data: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      data[name] = Storage.get(key, null);
    });
    return data;
  },

  /**
   * Import app data
   */
  importAppData: (data: Record<string, any>) => {
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      if (data[name] !== undefined) {
        Storage.set(key, data[name]);
      }
    });
  },
}; 