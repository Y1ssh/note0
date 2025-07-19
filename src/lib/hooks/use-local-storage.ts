import { useState, useEffect, useCallback } from 'react';
import { Storage } from '@/lib/storage';

interface UseLocalStorageOptions<T> {
  deserializer?: (value: string) => T;
  serializer?: (value: T) => string;
  initializeWithValue?: boolean;
}

type UseLocalStorageReturn<T> = [
  T,
  (value: T | ((prevValue: T) => T)) => void,
  () => void
];

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: UseLocalStorageOptions<T> = {}
): UseLocalStorageReturn<T> {
  const {
    deserializer = JSON.parse,
    serializer = JSON.stringify,
    initializeWithValue = true,
  } = options;

  // Get value from localStorage on mount
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    if (!initializeWithValue) {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return deserializer(item);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Set value in localStorage
  const setValue = useCallback(
    (value: T | ((prevValue: T) => T)) => {
      try {
        // Allow value to be a function for same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save state
        setStoredValue(valueToStore);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serializer(valueToStore));
          
          // Dispatch custom event for cross-tab synchronization
          window.dispatchEvent(
            new CustomEvent('localStorage-change', {
              detail: { key, value: valueToStore },
            })
          );
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serializer, storedValue]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        
        // Dispatch custom event
        window.dispatchEvent(
          new CustomEvent('localStorage-change', {
            detail: { key, value: undefined },
          })
        );
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  // Listen for changes to localStorage (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ('detail' in e) {
        // Custom event from our own tabs
        if (e.detail.key === key) {
          setStoredValue(e.detail.value ?? defaultValue);
        }
      } else {
        // Native storage event from other tabs
        if (e.key === key) {
          try {
            const newValue = e.newValue ? deserializer(e.newValue) : defaultValue;
            setStoredValue(newValue);
          } catch (error) {
            console.warn(`Error parsing localStorage value for key "${key}":`, error);
            setStoredValue(defaultValue);
          }
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange as EventListener);
      window.addEventListener('localStorage-change', handleStorageChange as EventListener);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange as EventListener);
        window.removeEventListener('localStorage-change', handleStorageChange as EventListener);
      };
    }
  }, [key, defaultValue, deserializer]);

  return [storedValue, setValue, removeValue];
}

// Specialized hooks for common use cases

export function useLocalStorageBoolean(key: string, defaultValue = false) {
  return useLocalStorage(key, defaultValue, {
    deserializer: (value) => value === 'true',
    serializer: (value) => String(value),
  });
}

export function useLocalStorageNumber(key: string, defaultValue = 0) {
  return useLocalStorage(key, defaultValue, {
    deserializer: (value) => {
      const parsed = Number(value);
      return isNaN(parsed) ? defaultValue : parsed;
    },
    serializer: (value) => String(value),
  });
}

export function useLocalStorageArray<T>(key: string, defaultValue: T[] = []) {
  return useLocalStorage(key, defaultValue, {
    deserializer: (value) => {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : defaultValue;
      } catch {
        return defaultValue;
      }
    },
  });
}

export function useLocalStorageObject<T extends Record<string, any>>(
  key: string,
  defaultValue: T
) {
  return useLocalStorage(key, defaultValue, {
    deserializer: (value) => {
      try {
        const parsed = JSON.parse(value);
        return typeof parsed === 'object' && parsed !== null ? parsed : defaultValue;
      } catch {
        return defaultValue;
      }
    },
  });
}

// Hook for managing multiple localStorage keys
export function useLocalStorageState<T extends Record<string, any>>(
  keyValuePairs: T
): [T, (key: keyof T, value: T[keyof T]) => void, (key: keyof T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return keyValuePairs;
    }

    const initialState = { ...keyValuePairs };
    
    Object.keys(keyValuePairs).forEach((key) => {
      try {
        const stored = Storage.get(key, keyValuePairs[key]);
        initialState[key] = stored;
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
      }
    });

    return initialState;
  });

  const setValue = useCallback((key: keyof T, value: T[keyof T]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    Storage.set(String(key), value);
  }, []);

  const removeValue = useCallback((key: keyof T) => {
    setState((prev) => ({ ...prev, [key]: keyValuePairs[key] }));
    Storage.remove(String(key));
  }, [keyValuePairs]);

  return [state, setValue, removeValue];
}

// Hook for localStorage with validation
export function useValidatedLocalStorage<T>(
  key: string,
  defaultValue: T,
  validator: (value: any) => value is T
): UseLocalStorageReturn<T> {
  return useLocalStorage(key, defaultValue, {
    deserializer: (value) => {
      try {
        const parsed = JSON.parse(value);
        return validator(parsed) ? parsed : defaultValue;
      } catch {
        return defaultValue;
      }
    },
  });
}

// Hook for localStorage with expiration
interface UseLocalStorageWithExpirationOptions<T> extends UseLocalStorageOptions<T> {
  expirationTime?: number; // in milliseconds
}

export function useLocalStorageWithExpiration<T>(
  key: string,
  defaultValue: T,
  options: UseLocalStorageWithExpirationOptions<T> = {}
): UseLocalStorageReturn<T> {
  const { expirationTime, ...storageOptions } = options;
  
  const [value, setValue, removeValue] = useLocalStorage(
    key,
    defaultValue,
    {
      ...storageOptions,
      deserializer: (storedValue) => {
        try {
          const parsed = JSON.parse(storedValue);
          
          if (expirationTime && parsed.timestamp) {
            const now = Date.now();
            const age = now - parsed.timestamp;
            
            if (age > expirationTime) {
              // Value has expired
              return defaultValue;
            }
            
            return options.deserializer ? options.deserializer(parsed.value) : parsed.value;
          }
          
          return options.deserializer ? options.deserializer(storedValue) : parsed;
        } catch {
          return defaultValue;
        }
      },
      serializer: (valueToStore) => {
        const dataToStore = expirationTime
          ? { value: valueToStore, timestamp: Date.now() }
          : valueToStore;
          
        return options.serializer 
          ? options.serializer(dataToStore as T)
          : JSON.stringify(dataToStore);
      },
    }
  );

  return [value, setValue, removeValue];
}

// Hook for localStorage with compression (for large data)
export function useCompressedLocalStorage<T>(
  key: string,
  defaultValue: T
): UseLocalStorageReturn<T> {
  return useLocalStorage(key, defaultValue, {
    serializer: (value) => {
      // Simple compression by removing whitespace from JSON
      return JSON.stringify(value).replace(/\s+/g, '');
    },
    deserializer: (value) => {
      try {
        return JSON.parse(value);
      } catch {
        return defaultValue;
      }
    },
  });
} 