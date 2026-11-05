import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { configureHttpClient } from '@/shared/api/httpClient'
import { AuthContext, type AuthContextValue } from './AuthContext'
import * as authApi from './authApi'
import { tokenStorage } from './tokenStorage'
import type { Session } from './types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(() => tokenStorage.load())

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setSession(null)
    // Do not leak data from one user to the next.
    queryClient.clear()
  }, [queryClient])

  // Layout effect: runs before any child fires a request. On a 401 the session is
  // cleared and ProtectedRoute redirects to /login.
  useLayoutEffect(() => {
    configureHttpClient({
      getToken: () => tokenStorage.load()?.accessToken ?? null,
      onUnauthorized: clearSession,
    })
  }, [clearSession])

  const login = useCallback<AuthContextValue['login']>(async (credentials) => {
    const res = await authApi.login(credentials)
    const next: Session = {
      accessToken: res.accessToken,
      username: res.username,
      rol: res.rol,
      expiresAt: Date.now() + res.expiresIn * 1000,
    }
    tokenStorage.save(next)
    setSession(next)
  }, [])

  const value = useMemo(() => ({ session, login, logout: clearSession }), [session, login, clearSession])

  return <AuthContext value={value}>{children}</AuthContext>
}
