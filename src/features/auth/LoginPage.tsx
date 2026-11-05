import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useLocation } from 'react-router'
import { ApiError } from '@/shared/api/httpClient'
import { Button } from '@/shared/ui/Button'
import { Field, inputClass } from '@/shared/ui/Field'
import { useAuth } from './useAuth'

const schema = z.object({
  username: z.string().trim().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

type FormValues = z.infer<typeof schema>

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Usuario o contraseña incorrectos'
    if (error.status === 403) return 'Tu usuario está inactivo. Contacta al administrador'
    return error.message
  }
  return 'Ocurrió un error inesperado'
}

export function LoginPage() {
  const { session, login } = useAuth()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (session) {
    const from = (location.state as { from?: string } | null)?.from ?? '/estudiantes'
    return <Navigate to={from} replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await login(values)
    } catch (error) {
      setServerError(loginErrorMessage(error))
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-slate-900">Iniciar sesión</h1>

        <Field id="username" label="Usuario" error={errors.username?.message}>
          <input
            id="username"
            autoComplete="username"
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? 'username-error' : undefined}
            className={inputClass}
            {...register('username')}
          />
        </Field>

        <Field id="password" label="Contraseña" error={errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={inputClass}
            {...register('password')}
          />
        </Field>

        {serverError && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {serverError}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </div>
  )
}
