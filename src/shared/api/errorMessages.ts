import { ApiError } from './httpClient'

/** Maps an error from a read request to a user-facing message. */
export function readErrorMessage(error: unknown, resource: string): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'No se pudo conectar con el servidor'
    if (error.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente'
    if (error.status === 403) return `No tienes permiso para ver ${resource}`
    if (error.status === 404) return 'No se encontró el recurso solicitado'
    return error.message
  }
  return 'Ocurrió un error inesperado'
}
