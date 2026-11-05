export type Rol = 'ADMIN' | 'DOCENTE' | 'ESTUDIANTE'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: 'Bearer'
  /** Lifetime in seconds. */
  expiresIn: number
  username: string
  rol: Rol
}

/** What the app keeps in sessionStorage while the user is logged in. */
export interface Session {
  accessToken: string
  username: string
  rol: Rol
  /** Epoch milliseconds. */
  expiresAt: number
}
