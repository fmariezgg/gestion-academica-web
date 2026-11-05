import { createContext } from 'react'
import type { LoginRequest, Session } from './types'

export interface AuthContextValue {
  session: Session | null
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
