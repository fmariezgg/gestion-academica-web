import { http } from '@/shared/api/httpClient'
import type { LoginRequest, LoginResponse } from './types'

export function login(credentials: LoginRequest, signal?: AbortSignal) {
  // Public endpoint: no token attached and a 401 here means "bad credentials", not "expired session".
  return http<LoginResponse>('/auth/login', { method: 'POST', body: credentials, auth: false, signal })
}
