import { User as SupabaseUser } from '@supabase/supabase-js'

// Izmantojam Supabase User tipu tieši
export type User = SupabaseUser

// Paplašinām ar mūsu papildu laukiem (ja vajag)
export interface UserProfile {
  id: string
  email: string
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  user: User | null
  error: string | null
}