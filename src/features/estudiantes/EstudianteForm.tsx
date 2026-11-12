import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ApiError } from '@/shared/api/httpClient'
import { Button } from '@/shared/ui/Button'
import { Field, inputClass } from '@/shared/ui/Field'
import type { Carrera } from '@/features/carreras/types'
import type { EstudianteResponse } from './types'
import { useCreateEstudiante, useUpdateEstudiante } from './useEstudiantes'

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

interface EstudianteFormProps {
  carreras: Carrera[]
  /** When present the form edits this student; otherwise it creates one. */
  estudiante?: EstudianteResponse
  onSaved: (message: string) => void
  onCancel: () => void
}

export function EstudianteForm({ carreras, estudiante, onSaved, onCancel }: EstudianteFormProps) {
  const create = useCreateEstudiante()
  const update = useUpdateEstudiante()
  const [formError, setFormError] = useState<string | null>(null)
  const [networkError, setNetworkError] = useState(false)
  const isEdit = estudiante !== undefined
  const isPending = create.isPending || update.isPending
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    // The response uses `carreraId`, the request/form uses `carrera`.
    defaultValues: estudiante
      ? { nombre: estudiante.nombre, correo: estudiante.correo, edad: estudiante.edad, carrera: estudiante.carreraId }
      : undefined,
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setNetworkError(false)
    try {
      if (estudiante) {
        const saved = await update.mutateAsync({ id: estudiante.id, data: values })
        onSaved(`Estudiante "${saved.nombre}" actualizado correctamente`)
      } else {
        const saved = await create.mutateAsync(values)
        onSaved(`Estudiante "${saved.nombre}" creado correctamente`)
        reset()
      }
    } catch (error) {
      // Typed values are never cleared on error: the form is only reset after a successful create.
      if (!(error instanceof ApiError)) {
        setFormError('Ocurrió un error inesperado')
        return
      }
      if (error.status === 0) {
        setNetworkError(true)
        setFormError(error.message)
        return
      }
      // 400 validation: map server field errors onto the form. 403 / 409 / business rule: show the message.
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
      <h3 className="mb-3 font-semibold">{isEdit ? 'Editar estudiante' : 'Registrar estudiante'}</h3>
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
          <select id="carrera" aria-invalid={!!errors.carrera} aria-describedby={describedBy('carrera')} className={inputClass} {...register('carrera', { valueAsNumber: true })}>
            <option value="">Selecciona…</option>
            {carreras.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </Field>
      </div>

      <div aria-live="polite" className="mt-3 text-sm">
        {formError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-red-50 p-3 text-red-800">
            <p>{formError}</p>
            {networkError && (
              <Button variant="secondary" disabled={isPending} onClick={() => void onSubmit()}>
                Reintentar
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
