
import { useState, useEffect, useCallback } from 'react';

// Returns: [value, setValue, isInitializedFromStorage]
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const [isInitializedFromStorage, setIsInitializedFromStorage] = useState(false);
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    let valueFromStorage: T = initialValue;
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        valueFromStorage = JSON.parse(item);
      }
    } catch (error) {
      console.error("Error reading localStorage key “" + key + "”:", error);
      // If error, valueFromStorage remains initialValue
    } finally {
      setStoredValue(valueFromStorage); // Set value found or initial
      setIsInitializedFromStorage(true); // Signal that loading from localStorage is complete.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Only re-run if key changes (which it shouldn't in this app's context)

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error("Error setting localStorage key “" + key + "”:", error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue, isInitializedFromStorage];
}

export default useLocalStorage;
