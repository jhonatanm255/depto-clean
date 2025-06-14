
import { useState, useEffect } from 'react';

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const [isLoading, setIsLoading] = useState(true);
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    // Set storedValue from localStorage here.
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
      // If no item, storedValue remains initialValue, which is correct.
    } catch (error) {
      console.error("Error reading localStorage key “" + key + "”:", error);
      // If error, storedValue remains initialValue, which is correct.
    } finally {
      setIsLoading(false); // Signal that loading from localStorage is complete.
    }
  }, [key]); // Only depend on key, initialValue is handled by useState initializer.

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error("Error setting localStorage key “" + key + "”:", error);
    }
  };

  return [storedValue, setValue, isLoading];
}

export default useLocalStorage;
