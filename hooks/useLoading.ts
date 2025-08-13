'use client'

import { useCallback, useState } from 'react'

export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState)

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    try {
      setIsLoading(true)
      return await asyncFn()
    } finally {
      setIsLoading(false)
    }
  }, []) // stabila reference

  return { isLoading, setIsLoading, withLoading }
}