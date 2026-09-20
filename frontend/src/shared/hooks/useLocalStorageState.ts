import { useCallback, useState } from 'react'

export function useLocalStorageState<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key)

      if (storedValue !== null) {
        const parsedValue: unknown = JSON.parse(storedValue)

        if (isValid(parsedValue)) {
          return parsedValue
        }
      }
    } catch {
      // Ignore unavailable storage or malformed values and use the safe default.
    }

    return fallback
  })

  const setStoredValue = useCallback((nextValue: T) => {
    setValue(nextValue)

    try {
      window.localStorage.setItem(key, JSON.stringify(nextValue))
    } catch {
      // The in-memory preference still works when storage is unavailable.
    }
  }, [key])

  return [value, setStoredValue] as const
}
