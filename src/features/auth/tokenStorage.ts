import type { Session } from './types'

const KEY = 'gestion-academica.session'

/** sessionStorage: cleared when the tab closes. Every access is guarded (it can throw in private mode). */
export const tokenStorage = {
  load(): Session | null {
    try {
      const raw = sessionStorage.getItem(KEY)
      if (!raw) return null
      const session = JSON.parse(raw) as Session
      if (typeof session.accessToken !== 'string' || session.expiresAt <= Date.now()) {
        sessionStorage.removeItem(KEY)
        return null
      }
      return session
    } catch {
      return null
    }
  },

  save(session: Session): void {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(session))
    } catch {
      // Storage unavailable: the session just won't survive a reload.
    }
  },

  clear(): void {
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      // Nothing to clean up.
    }
  },
}
