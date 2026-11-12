import { useMemo, useState } from 'react'
import { readErrorMessage } from '@/shared/api/errorMessages'
import { Spinner } from '@/shared/ui/Spinner'
import { EmptyMessage, ErrorMessage } from '@/shared/ui/StateMessage'
import { inputClass } from '@/shared/ui/Field'
import { canManageEstudiantes } from '@/features/auth/permissions'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/shared/ui/Button'
import { useCarreras } from '@/features/carreras/useCarreras'
import { EstudianteDetail } from './EstudianteDetail'
import { EstudianteForm } from './EstudianteForm'
import { EstudiantesTable } from './EstudiantesTable'
import type { EstudianteResponse } from './types'
import { useEstudiantes } from './useEstudiantes'

// UI state only: which form is open. Server data lives in the query cache.
type FormMode = { mode: 'create' } | { mode: 'edit'; estudiante: EstudianteResponse }

export function EstudiantesPage() {
  const { session } = useAuth()
  const estudiantes = useEstudiantes()
  const carreras = useCarreras()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [carreraFilter, setCarreraFilter] = useState('')
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const canManage = canManageEstudiantes(session?.rol)

  const carreraNombre = (carreraId: number) =>
    carreras.data?.find((c) => c.id === carreraId)?.nombre ?? `Carrera #${carreraId}`

  // Option B is filtered CLIENT-SIDE: the API exposes no query parameters (no search/filter/pagination).
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (estudiantes.data ?? []).filter(
      (e) =>
        (!term || e.nombre.toLowerCase().includes(term) || e.correo.toLowerCase().includes(term)) &&
        (!carreraFilter || e.carreraId === Number(carreraFilter)),
    )
  }, [estudiantes.data, search, carreraFilter])

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold">Estudiantes</h2>

      {canManage && (
        <div className="flex flex-col gap-3">
          {formMode === null && (
            <div>
              <Button
                onClick={() => {
                  setNotice(null)
                  setFormMode({ mode: 'create' })
                }}
              >
                Nuevo estudiante
              </Button>
            </div>
          )}

          {formMode !== null && carreras.isError && (
            <ErrorMessage
              message={readErrorMessage(carreras.error, 'las carreras')}
              onRetry={() => carreras.refetch()}
            />
          )}

          {formMode !== null && carreras.data && (
            <EstudianteForm
              key={formMode.mode === 'edit' ? `edit-${formMode.estudiante.id}` : 'create'}
              carreras={carreras.data}
              estudiante={formMode.mode === 'edit' ? formMode.estudiante : undefined}
              onSaved={(message) => {
                setNotice(message)
                if (formMode.mode === 'edit') setFormMode(null)
              }}
              onCancel={() => setFormMode(null)}
            />
          )}
        </div>
      )}

      {notice && (
        <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          {notice}
        </p>
      )}

      <div aria-live="polite" className="flex flex-col gap-4">
        {estudiantes.isPending && <Spinner label="Cargando estudiantes…" />}

        {estudiantes.isError && (
          <ErrorMessage
            message={readErrorMessage(estudiantes.error, 'estudiantes')}
            onRetry={() => estudiantes.refetch()}
          />
        )}

        {estudiantes.data && (
          <>
            <div className="flex flex-wrap gap-3">
              <div className="flex min-w-48 flex-1 flex-col gap-1">
                <label htmlFor="search" className="text-sm font-medium text-slate-700">Buscar por nombre o correo</label>
                <input id="search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="carreraFilter" className="text-sm font-medium text-slate-700">Carrera</label>
                <select id="carreraFilter" value={carreraFilter} onChange={(e) => setCarreraFilter(e.target.value)} className={inputClass}>
                  <option value="">Todas</option>
                  {carreras.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {estudiantes.data.length === 0 ? (
              <EmptyMessage>No hay estudiantes registrados</EmptyMessage>
            ) : filtered.length === 0 ? (
              <EmptyMessage>Ningún estudiante coincide con los filtros</EmptyMessage>
            ) : (
              <EstudiantesTable
                estudiantes={filtered}
                carreraNombre={carreraNombre}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onEdit={
                  canManage
                    ? (estudiante) => {
                        setNotice(null)
                        setFormMode({ mode: 'edit', estudiante })
                      }
                    : undefined
                }
              />
            )}
          </>
        )}
      </div>

      {selectedId !== null && (
        <EstudianteDetail id={selectedId} carreraNombre={carreraNombre} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
