import { readErrorMessage } from '@/shared/api/errorMessages'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { ErrorMessage } from '@/shared/ui/StateMessage'
import { useEstudiante } from './useEstudiantes'

interface EstudianteDetailProps {
  id: number
  carreraNombre: (carreraId: number) => string
  onClose: () => void
}

/** Fetches GET /estudiantes/{id} on its own, with independent loading/error states. */
export function EstudianteDetail({ id, carreraNombre, onClose }: EstudianteDetailProps) {
  const { data, isPending, isError, error, refetch } = useEstudiante(id)

  return (
    <section aria-label="Detalle del estudiante" className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Detalle</h3>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </div>

      {isPending && <Spinner label="Cargando detalle…" />}
      {isError && <ErrorMessage message={readErrorMessage(error, 'este estudiante')} onRetry={() => refetch()} />}
      {data && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-500">ID</dt>
          <dd>{data.id}</dd>
          <dt className="text-slate-500">Nombre</dt>
          <dd>{data.nombre}</dd>
          <dt className="text-slate-500">Correo</dt>
          <dd className="break-all">{data.correo}</dd>
          <dt className="text-slate-500">Edad</dt>
          <dd>{data.edad}</dd>
          <dt className="text-slate-500">Carrera</dt>
          <dd>{carreraNombre(data.carreraId)}</dd>
        </dl>
      )}
    </section>
  )
}
