'use client'

import { useState } from 'react'

export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState)

  const withLoading = async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    try {
      setIsLoading(true)
      return await asyncFn()
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, setIsLoading, withLoading }
}
