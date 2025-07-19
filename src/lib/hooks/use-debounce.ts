import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook that debounces a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that provides a debounced callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps?: React.DependencyList
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...(deps || [])]);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook that debounces a function and provides immediate execution option
 */
export function useAdvancedDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: {
    leading?: boolean; // Execute immediately on first call
    trailing?: boolean; // Execute after delay (default: true)
    maxWait?: number; // Maximum time to wait before forced execution
  } = {}
): {
  debouncedCallback: T;
  cancel: () => void;
  flush: () => void;
} {
  const { leading = false, trailing = true, maxWait } = options;
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxTimeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  const lastCallTimeRef = useRef<number>();
  const lastInvokeTimeRef = useRef<number>(0);
  const argsRef = useRef<Parameters<T>>();

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const invokeCallback = useCallback(() => {
    if (argsRef.current) {
      const result = callbackRef.current(...argsRef.current);
      lastInvokeTimeRef.current = Date.now();
      return result;
    }
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = undefined;
    }
    lastCallTimeRef.current = undefined;
    argsRef.current = undefined;
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
      return invokeCallback();
    }
  }, [invokeCallback]);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const isInvoking = !lastCallTimeRef.current;
      
      lastCallTimeRef.current = now;
      argsRef.current = args;

      // Leading execution
      if (isInvoking && leading) {
        lastInvokeTimeRef.current = now;
        return callbackRef.current(...args);
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set up max wait timeout
      if (maxWait && !maxTimeoutRef.current) {
        maxTimeoutRef.current = setTimeout(() => {
          maxTimeoutRef.current = undefined;
          invokeCallback();
        }, maxWait);
      }

      // Set up trailing execution
      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = undefined;
          if (maxTimeoutRef.current) {
            clearTimeout(maxTimeoutRef.current);
            maxTimeoutRef.current = undefined;
          }
          invokeCallback();
        }, delay);
      }
    }) as T,
    [delay, leading, trailing, maxWait, invokeCallback]
  );

  // Cleanup on unmount
  useEffect(() => {
    return cancel;
  }, [cancel]);

  return {
    debouncedCallback,
    cancel,
    flush,
  };
}

/**
 * Hook for debouncing search queries with loading state
 */
export function useDebouncedSearch(
  searchQuery: string,
  delay: number = 300
): {
  debouncedQuery: string;
  isSearching: boolean;
} {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery !== debouncedQuery) {
      setIsSearching(true);
    }

    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, delay, debouncedQuery]);

  return {
    debouncedQuery,
    isSearching,
  };
}

/**
 * Hook for debouncing API calls with automatic cancellation
 */
export function useDebouncedApi<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>,
  delay: number = 500
): {
  debouncedCall: (...args: P) => Promise<T>;
  cancel: () => void;
  isPending: boolean;
} {
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();
  const promiseResolversRef = useRef<{
    resolve: (value: T) => void;
    reject: (reason: any) => void;
  }>();

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = undefined;
    }

    if (promiseResolversRef.current) {
      promiseResolversRef.current.reject(new Error('API call cancelled'));
      promiseResolversRef.current = undefined;
    }

    setIsPending(false);
  }, []);

  const debouncedCall = useCallback(
    (...args: P): Promise<T> => {
      // Cancel any pending call
      cancel();
      
      setIsPending(true);

      return new Promise<T>((resolve, reject) => {
        promiseResolversRef.current = { resolve, reject };

        timeoutRef.current = setTimeout(async () => {
          try {
            // Create new abort controller for this request
            abortControllerRef.current = new AbortController();
            
            const result = await apiFunction(...args);
            
            if (promiseResolversRef.current) {
              promiseResolversRef.current.resolve(result);
              promiseResolversRef.current = undefined;
            }
          } catch (error) {
            if (promiseResolversRef.current) {
              promiseResolversRef.current.reject(error);
              promiseResolversRef.current = undefined;
            }
          } finally {
            setIsPending(false);
            timeoutRef.current = undefined;
            abortControllerRef.current = undefined;
          }
        }, delay);
      });
    },
    [apiFunction, delay, cancel]
  );

  // Cleanup on unmount
  useEffect(() => {
    return cancel;
  }, [cancel]);

  return {
    debouncedCall,
    cancel,
    isPending,
  };
}

/**
 * Hook for debouncing state updates with batching
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [immediateValue, setImmediateValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(immediateValue) : value;
      setImmediateValue(newValue);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(newValue);
      }, delay);
    },
    [immediateValue, delay]
  );

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setDebouncedValue(immediateValue);
    }
  }, [immediateValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [immediateValue, debouncedValue, setValue, flush];
}

/**
 * Hook for throttling with debounce fallback
 */
export function useThrottledDebounce<T extends (...args: any[]) => any>(
  callback: T,
  throttleDelay: number,
  debounceDelay: number
): T {
  const lastExecutedRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledDebouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastExecution = now - lastExecutedRef.current;

      // Clear any pending debounced call
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (timeSinceLastExecution >= throttleDelay) {
        // Execute immediately (throttled)
        lastExecutedRef.current = now;
        callbackRef.current(...args);
      } else {
        // Schedule for later (debounced)
        timeoutRef.current = setTimeout(() => {
          lastExecutedRef.current = Date.now();
          callbackRef.current(...args);
        }, debounceDelay);
      }
    }) as T,
    [throttleDelay, debounceDelay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledDebouncedCallback;
} 