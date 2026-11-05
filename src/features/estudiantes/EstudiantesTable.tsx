import type { EstudianteResponse } from './types'

interface EstudiantesTableProps {
  estudiantes: EstudianteResponse[]
  carreraNombre: (carreraId: number) => string
  selectedId: number | null
  onSelect: (id: number) => void
}

export function EstudiantesTable({ estudiantes, carreraNombre, selectedId, onSelect }: EstudiantesTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Listado de estudiantes. Selecciona una fila para ver su detalle.</caption>
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">Nombre</th>
            <th scope="col" className="px-4 py-2 font-medium">Correo</th>
            <th scope="col" className="px-4 py-2 font-medium">Edad</th>
            <th scope="col" className="px-4 py-2 font-medium">Carrera</th>
            <th scope="col" className="px-4 py-2"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {estudiantes.map((e) => (
            <tr
              key={e.id}
              onClick={() => onSelect(e.id)}
              className={`cursor-pointer hover:bg-slate-50 ${selectedId === e.id ? 'bg-indigo-50' : ''}`}
            >
              <td className="px-4 py-2 font-medium">{e.nombre}</td>
              <td className="px-4 py-2">{e.correo}</td>
              <td className="px-4 py-2">{e.edad}</td>
              <td className="px-4 py-2">{carreraNombre(e.carreraId)}</td>
              <td className="px-4 py-2 text-right">
                {/* The real button keeps the row keyboard-accessible; the row click is a mouse convenience. */}
                <button
                  type="button"
                  aria-pressed={selectedId === e.id}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    onSelect(e.id)
                  }}
                  className="text-indigo-700 underline focus-visible:outline-2 focus-visible:outline-indigo-600"
                >
                  Ver detalle<span className="sr-only"> de {e.nombre}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
