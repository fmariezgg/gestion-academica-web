import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Rol } from '@/features/auth/types'
import { jsonResponse, renderWithProviders, stubFetch, type RecordedRequest } from '@/test/utils'
import { EstudiantesPage } from './EstudiantesPage'
import type { EstudianteResponse } from './types'

const carreras = [
  { id: 1, codigo: 'SIS', nombre: 'Sistemas' },
  { id: 2, codigo: 'IND', nombre: 'Industrial' },
]

const seed: EstudianteResponse[] = [
  { id: 1, nombre: 'Ana Pérez', correo: 'ana@uni.edu', edad: 20, carreraId: 1 },
  { id: 2, nombre: 'Luis Gómez', correo: 'luis@uni.edu', edad: 22, carreraId: 2 },
]

/** Minimal stateful fake of the backend so refetches return what mutations wrote. */
function fakeBackend(initial: EstudianteResponse[] = seed) {
  const students = [...initial]
  const handler = (req: RecordedRequest) => {
    if (req.path === '/carreras') return jsonResponse(200, carreras)
    if (req.path === '/estudiantes' && req.method === 'GET') return jsonResponse(200, students)
    if (req.path === '/estudiantes' && req.method === 'POST') {
      const body = req.body as { nombre: string; correo: string; edad: number; carrera: number }
      const created = { id: 99, nombre: body.nombre, correo: body.correo, edad: body.edad, carreraId: body.carrera }
      students.push(created)
      return jsonResponse(201, created)
    }
    const match = req.path.match(/^\/estudiantes\/(\d+)$/)
    if (match && req.method === 'PUT') {
      const body = req.body as { nombre: string; correo: string; edad: number; carrera: number }
      const idx = students.findIndex((s) => s.id === Number(match[1]))
      students[idx] = { id: Number(match[1]), nombre: body.nombre, correo: body.correo, edad: body.edad, carreraId: body.carrera }
      return jsonResponse(200, students[idx])
    }
    return jsonResponse(404, { message: 'No encontrado' })
  }
  return { students, handler }
}

function renderPage(rol: Rol) {
  return renderWithProviders(<EstudiantesPage />, { rol })
}

describe('EstudiantesPage', () => {
  it('shows loading, then rows with the career name from the catalogue', async () => {
    stubFetch(fakeBackend().handler)
    renderPage('DOCENTE')

    expect(screen.getByText('Cargando estudiantes…')).toBeInTheDocument()
    const row = (await screen.findByText('Ana Pérez')).closest('tr')!
    expect(within(row).getByText('Sistemas')).toBeInTheDocument()
    expect(screen.queryByText('Cargando estudiantes…')).not.toBeInTheDocument()
  })

  it('shows the empty message when there are no students', async () => {
    stubFetch(fakeBackend([]).handler)
    renderPage('DOCENTE')
    expect(await screen.findByText('No hay estudiantes registrados')).toBeInTheDocument()
  })

  it('shows an error with "Reintentar" that recovers', async () => {
    const backend = fakeBackend()
    let failing = true
    stubFetch((req) => {
      if (req.path === '/estudiantes' && failing) return jsonResponse(500, { message: 'Error interno del servidor' })
      return backend.handler(req)
    })
    const user = userEvent.setup()
    renderPage('DOCENTE')

    expect(await screen.findByText('Error interno del servidor')).toBeInTheDocument()
    failing = false
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
  })

  it('narrows the rows with the search filter', async () => {
    stubFetch(fakeBackend().handler)
    const user = userEvent.setup()
    renderPage('DOCENTE')

    await screen.findByText('Ana Pérez')
    await user.type(screen.getByLabelText('Buscar por nombre o correo'), 'luis')

    expect(screen.queryByText('Ana Pérez')).not.toBeInTheDocument()
    expect(screen.getByText('Luis Gómez')).toBeInTheDocument()
  })

  it('shows a created student in the table without reloading', async () => {
    const { requests } = stubFetch(fakeBackend().handler)
    const user = userEvent.setup()
    renderPage('ADMIN')

    await screen.findByText('Ana Pérez')
    await user.click(screen.getByRole('button', { name: 'Nuevo estudiante' }))
    await user.type(screen.getByLabelText('Nombre'), 'Marta Ruiz')
    await user.type(screen.getByLabelText('Correo'), 'marta@uni.edu')
    await user.type(screen.getByLabelText('Edad'), '25')
    await user.selectOptions(screen.getByLabelText('Carrera', { selector: 'select#carrera' }), 'Industrial')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Marta Ruiz')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '' })).toBeDefined()
    expect(await screen.findByText('Estudiante "Marta Ruiz" creado correctamente')).toBeInTheDocument()
    expect(requests.filter((r) => r.method === 'GET' && r.path === '/estudiantes')).toHaveLength(2)
  })

  it('shows the new values in the row after an edit and closes the form', async () => {
    stubFetch(fakeBackend().handler)
    const user = userEvent.setup()
    renderPage('ADMIN')

    await screen.findByText('Ana Pérez')
    await user.click(screen.getByRole('button', { name: /Editar.*Ana Pérez/ }))
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana Pérez')
    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'Ana María')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Ana María')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Editar estudiante' })).not.toBeInTheDocument())
    expect(screen.queryByText('Ana Pérez')).not.toBeInTheDocument()
    expect(screen.getByText('Estudiante "Ana María" actualizado correctamente')).toBeInTheDocument()
  })

  it('hides create and edit actions from a DOCENTE session', async () => {
    stubFetch(fakeBackend().handler)
    renderPage('DOCENTE')

    await screen.findByText('Ana Pérez')
    expect(screen.queryByRole('button', { name: 'Nuevo estudiante' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
  })

  it('shows create and edit actions to an ADMIN session', async () => {
    stubFetch(fakeBackend().handler)
    renderPage('ADMIN')

    await screen.findByText('Ana Pérez')
    expect(screen.getByRole('button', { name: 'Nuevo estudiante' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Editar/ })).toHaveLength(2)
  })
})
