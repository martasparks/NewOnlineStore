'use client'
import { useEffect } from 'react'
import { useAlert } from '../../lib/store/alert'

export default function AlertMessage() {
  const { message, type, show, hideAlert } = useAlert()

  useEffect(() => {
    if (show) {
      const timeout = setTimeout(() => hideAlert(), 3000)
      return () => clearTimeout(timeout)
    }
  }, [show, hideAlert])

  if (!show) return null

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      {message}
    </div>
  )
}
