import { User as SupabaseUser } from '@supabase/supabase-js'

export type User = SupabaseUser

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
  captchaToken?: string // pievienots hCaptcha token
}

export interface RegisterCredentials {
  email: string
  password: string
  confirmPassword: string
  captchaToken?: string // pievienots hCaptcha token
  personType?: 'private' | 'company' // var arī pievienot šo, ja vajag
}

export interface AuthResponse {
  user: User | null
  error: string | null
}
