import { Outlet } from 'react-router'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from './Button'

export function Layout() {
  const { session, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-lg font-semibold">Gestión Académica</h1>
          {session && (
            <div className="flex items-center gap-3 text-sm">
              <span>
                {session.username}{' '}
                <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                  {session.rol}
                </span>
              </span>
              <Button variant="secondary" onClick={logout}>
                Cerrar sesión
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
