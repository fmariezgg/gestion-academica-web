import type { Rol } from './types'

/**
 * Only shapes the UI (hides actions the user cannot perform).
 * The backend remains the authority: it answers 403 to non-ADMIN writes.
 */
export function canManageEstudiantes(rol: Rol | undefined): boolean {
  return rol === 'ADMIN'
}
