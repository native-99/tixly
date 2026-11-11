import { createContext } from 'react'
import type { SignUpInput } from '@/services'
import type { User } from '@/types'

export interface AuthContextValue {
  user: User | null
  /** True only while the initial session check is running. */
  isLoading: boolean
  signIn(email: string, password: string): Promise<User>
  signUp(input: SignUpInput): Promise<User>
  signOut(): Promise<void>
  /** Emails a one-time login link. `redirectTo` is where the link returns to. */
  sendMagicLink(email: string, redirectTo?: string): Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
