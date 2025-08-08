'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { AuthState } from '@/types/auth'

interface AuthContextType extends AuthState {
  signIn(email: string, password: string, captchaToken?: string): Promise<{ error: string | null }>
  signUp: (email: string, password: string, captchaToken?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signInWithFacebook: () => Promise<{ error: string | null }>
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
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error
        } = await supabase.auth.getSession()

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
      } catch {
        setState(prev => ({
          ...prev,
          error: 'Neizdevās ielādēt sesiju',
          loading: false
        }))
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        loading: false,
        error: null
      }))
    })

    return () => {
      try {
        subscription.unsubscribe()
      } catch {
        // ignore
      }
    }
  }, [supabase])

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
        captchaToken
      }
      })

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { error: error.message }
      }

      setState(prev => ({ ...prev, loading: false, error: null }))
      return { error: null }
    } catch {
      const errorMessage = 'Neizdevās pieteikties'
      setState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { error: errorMessage }
    }
  }

  // Atbalsta hCaptcha tokenu, ja Supabase Auth CAPTCHA ir ieslēgts
  const signUp = async (email: string, password: string, captchaToken?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          // Ja CAPTCHA ir ieslēgts, Supabase prasīs captchaToken
          captchaToken
        }
      })

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { error: error.message }
      }

      setState(prev => ({ ...prev, loading: false, error: null }))
      return { error: null }
    } catch {
      const errorMessage = 'Neizdevās reģistrēties'
      setState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { error: errorMessage }
    }
  }

  const signInWithGoogle = async () => {
    try {
      // Neuzturam loading=true ilgi, jo SDK var veikt tūlītēju redirect
      setState(prev => ({ ...prev, error: null }))

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setState(prev => ({ ...prev, error: error.message }))
        return { error: error.message }
      }

      return { error: null }
    } catch {
      const errorMessage = 'Neizdevās pieteikties ar Google'
      setState(prev => ({ ...prev, error: errorMessage }))
      return { error: errorMessage }
    }
  }

  const signInWithFacebook = async () => {
    try {
      setState(prev => ({ ...prev, error: null }))

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setState(prev => ({ ...prev, error: error.message }))
        return { error: error.message }
      }

      return { error: null }
    } catch {
      const errorMessage = 'Neizdevās pieteikties ar Facebook'
      setState(prev => ({ ...prev, error: errorMessage }))
      return { error: errorMessage }
    }
  }

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      await supabase.auth.signOut()
      setState(prev => ({ ...prev, user: null, loading: false, error: null }))
    } catch {
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
    } catch {
      return { error: 'Neizdevās nosūtīt paroles atjaunošanas e-pastu' }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        resetPassword,
        signInWithGoogle,
        signInWithFacebook
      }}
    >
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
