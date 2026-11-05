import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { LoginPage } from '@/features/auth/LoginPage'
import { EstudiantesPage } from '@/features/estudiantes/EstudiantesPage'
import { Layout } from '@/shared/ui/Layout'
import { ProtectedRoute } from './ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    // Failures are shown to the user with an explicit "Reintentar" button instead of silent retries.
    queries: { retry: false, refetchOnWindowFocus: false },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/estudiantes" replace />} />
                <Route path="/estudiantes" element={<EstudiantesPage />} />
              </Route>
            </Route>
            <Route
              path="*"
              element={<p className="p-8 text-center text-slate-600">Página no encontrada</p>}
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
