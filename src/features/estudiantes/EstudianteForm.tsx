import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ApiError } from '@/shared/api/httpClient'
import { Button } from '@/shared/ui/Button'
import { Field, inputClass } from '@/shared/ui/Field'
import type { Carrera } from '@/features/carreras/types'
import { useCreateEstudiante } from './useEstudiantes'

// Mirrors the backend rules (the server remains the source of truth).
const schema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  correo: z.email('Ingresa un correo válido'),
  edad: z
    .number({ error: 'Ingresa la edad' })
    .int('La edad debe ser un número entero')
    .min(18, 'El estudiante debe tener al menos 18 años'),
  carrera: z.number({ error: 'Selecciona una carrera' }).int().min(1, 'Selecciona una carrera'),
})

type FormValues = z.infer<typeof schema>
const fieldNames: ReadonlySet<string> = new Set(['nombre', 'correo', 'edad', 'carrera'])

export function EstudianteForm({ carreras }: { carreras: Carrera[] }) {
  const create = useCreateEstudiante()
  const [formError, setFormError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setCreated(null)
    try {
      const estudiante = await create.mutateAsync(values)
      setCreated(`Estudiante "${estudiante.nombre}" creado correctamente`)
      reset()
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError('Ocurrió un error inesperado')
        return
      }
      // 400 validation: map server field errors onto the form. 409 / business rule: show the message.
      let mapped = false
      for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
        if (fieldNames.has(field)) {
          setError(field as keyof FormValues, { message })
          mapped = true
        }
      }
      if (!mapped) setFormError(error.message)
    }
  })

  const describedBy = (name: keyof FormValues) => (errors[name] ? `${name}-error` : undefined)

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 font-semibold">Registrar estudiante</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="nombre" label="Nombre" error={errors.nombre?.message}>
          <input id="nombre" aria-invalid={!!errors.nombre} aria-describedby={describedBy('nombre')} className={inputClass} {...register('nombre')} />
        </Field>
        <Field id="correo" label="Correo" error={errors.correo?.message}>
          <input id="correo" type="email" aria-invalid={!!errors.correo} aria-describedby={describedBy('correo')} className={inputClass} {...register('correo')} />
        </Field>
        <Field id="edad" label="Edad" error={errors.edad?.message}>
          <input id="edad" type="number" inputMode="numeric" aria-invalid={!!errors.edad} aria-describedby={describedBy('edad')} className={inputClass} {...register('edad', { valueAsNumber: true })} />
        </Field>
        <Field id="carrera" label="Carrera" error={errors.carrera?.message}>
          <select id="carrera" aria-invalid={!!errors.carrera} aria-describedby={describedBy('carrera')} className={inputClass} defaultValue="" {...register('carrera', { valueAsNumber: true })}>
            <option value="">Selecciona…</option>
            {carreras.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </Field>
      </div>

      <div aria-live="polite" className="mt-3 text-sm">
        {formError && <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800">{formError}</p>}
        {created && <p className="rounded-md bg-green-50 p-3 text-green-800">{created}</p>}
      </div>

      <div className="mt-3">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
