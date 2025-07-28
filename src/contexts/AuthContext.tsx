'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { AuthState } from '@/types/auth'

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  const supabase = createClient()

  useEffect(() => {
    // Iegūstam sākotnējo sesiju
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setState(prev => ({ ...prev, error: error.message, loading: false }))
          return
        }

        setState(prev => ({ 
          ...prev, 
          user: session?.user ?? null, 
          loading: false,
          error: null
        }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Neizdevās ielādēt sesiju', 
          loading: false 
        }))
      }
    }

    getInitialSession()

    // Klausāmies autentifikācijas izmaiņas
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({ 
          ...prev, 
          user: session?.user ?? null,
          loading: false,
          error: null
        }))
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { error: error.message }
      }

      setState(prev => ({ ...prev, loading: false, error: null }))
      return { error: null }
    } catch (error) {
      const errorMessage = 'Neizdevās pieteikties'
      setState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { error: errorMessage }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { error: error.message }
      }

      setState(prev => ({ ...prev, loading: false, error: null }))
      return { error: null }
    } catch (error) {
      const errorMessage = 'Neizdevās reģistrēties'
      setState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { error: errorMessage }
    }
  }

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      await supabase.auth.signOut()
      setState(prev => ({ ...prev, user: null, loading: false, error: null }))
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Neizdevās iziet', loading: false }))
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return { error: 'Neizdevās nosūtīt paroles atjaunošanas e-pastu' }
    }
  }

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      signUp,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}