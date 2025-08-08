import { create } from 'zustand'

type AlertState = {
  message: string
  type: 'success' | 'error' | 'warning' | 'info' | null
  show: boolean
  setAlert: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void
  hideAlert: () => void
}

export const useAlert = create<AlertState>((set) => ({
  message: '',
  type: null,
  show: false,
  setAlert: (message, type) => set({ message, type, show: true }),
  hideAlert: () => set({ show: false }),
}))
