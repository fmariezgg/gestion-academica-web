import { env } from '@/shared/config/env'
import type { ApiErrorBody } from './types'

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors?: Record<string, string>

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

/**
 * The HTTP client knows nothing about the auth module.
 * The app layer injects how to read the token and what to do on a 401.
 */
interface HttpClientConfig {
  getToken: () => string | null
  onUnauthorized: () => void
}

let config: HttpClientConfig = {
  getToken: () => null,
  onUnauthorized: () => {},
}

export function configureHttpClient(newConfig: HttpClientConfig) {
  config = newConfig
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  /** When true (default) the Bearer token is attached and a 401 triggers onUnauthorized. */
  auth?: boolean
  signal?: AbortSignal
}

export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, auth = true, signal } = options
  const token = auth ? config.getToken() : null

  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('No se pudo conectar con el servidor', 0)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && auth) {
      config.onUnauthorized()
    }
    const errorBody = (data ?? {}) as Partial<ApiErrorBody>
    // Trust the HTTP status, not body.status (the backend may serialize it as a string).
    throw new ApiError(buildMessage(errorBody, response.status), response.status, errorBody.errors)
  }

  return data as T
}

/** Validation errors carry an `errors` map and no `message`. */
function buildMessage(body: Partial<ApiErrorBody>, status: number): string {
  if (body.message) return body.message
  const firstFieldError = body.errors ? Object.values(body.errors)[0] : undefined
  return firstFieldError ?? defaultMessage(status)
}

function defaultMessage(status: number): string {
  if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente'
  if (status === 403) return 'No tienes permiso para realizar esta operación'
  if (status === 500) return 'Error interno del servidor'
  return 'Ocurrió un error inesperado'
}
