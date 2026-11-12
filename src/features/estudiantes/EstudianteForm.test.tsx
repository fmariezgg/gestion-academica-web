import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Carrera } from '@/features/carreras/types'
import { jsonResponse, renderWithProviders, stubFetch } from '@/test/utils'
import { EstudianteForm } from './EstudianteForm'
import type { EstudianteResponse } from './types'

const carreras: Carrera[] = [
  { id: 1, codigo: 'SIS', nombre: 'Sistemas' },
  { id: 2, codigo: 'IND', nombre: 'Industrial' },
]

const saved: EstudianteResponse = { id: 10, nombre: 'Ana Pérez', correo: 'ana@uni.edu', edad: 20, carreraId: 1 }

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre'), 'Ana Pérez')
  await user.type(screen.getByLabelText('Correo'), 'ana@uni.edu')
  await user.type(screen.getByLabelText('Edad'), '20')
  await user.selectOptions(screen.getByLabelText('Carrera'), 'Sistemas')
}

function renderForm(props: Partial<React.ComponentProps<typeof EstudianteForm>> = {}) {
  const onSaved = vi.fn()
  const onCancel = vi.fn()
  renderWithProviders(<EstudianteForm carreras={carreras} onSaved={onSaved} onCancel={onCancel} {...props} />)
  return { onSaved, onCancel }
}

describe('EstudianteForm', () => {
  it('shows required-field messages and sends nothing on an empty submit', async () => {
    const { fetchMock } = stubFetch(() => jsonResponse(201, saved))
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('Ingresa un correo válido')).toBeInTheDocument()
    expect(screen.getByText('Ingresa la edad')).toBeInTheDocument()
    expect(screen.getByText('Selecciona una carrera')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the email message for an invalid email', async () => {
    const { fetchMock } = stubFetch(() => jsonResponse(201, saved))
    const user = userEvent.setup()
    renderForm()

    await fillValid(user)
    await user.clear(screen.getByLabelText('Correo'))
    await user.type(screen.getByLabelText('Correo'), 'no-es-correo')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Ingresa un correo válido')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps typed values and shows server field errors under the right field on a 400', async () => {
    stubFetch(() => jsonResponse(400, { errors: { correo: 'El correo ya tiene un formato inválido en el servidor' } }))
    const user = userEvent.setup()
    const { onSaved } = renderForm()

    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    const message = await screen.findByText('El correo ya tiene un formato inválido en el servidor')
    expect(message).toHaveAttribute('id', 'correo-error')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana Pérez')
    expect(screen.getByLabelText('Correo')).toHaveValue('ana@uni.edu')
    expect(screen.getByLabelText('Edad')).toHaveValue(20)
    expect(screen.getByLabelText('Carrera')).toHaveValue('1')
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('shows the message on a 409 and keeps the values', async () => {
    stubFetch(() => jsonResponse(409, { message: 'El correo ya está registrado' }))
    const user = userEvent.setup()
    renderForm()

    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('El correo ya está registrado')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana Pérez')
  })

  it('shows the message on a 403 without offering a retry', async () => {
    stubFetch(() => jsonResponse(403, {}))
    const user = userEvent.setup()
    renderForm()

    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('No tienes permiso para realizar esta operación')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana Pérez')
  })

  it('offers "Reintentar" on a network failure and resubmits the same values', async () => {
    let calls = 0
    const { requests, fetchMock } = stubFetch(() => jsonResponse(201, saved))
    fetchMock.mockImplementationOnce(async () => {
      calls++
      throw new TypeError('Failed to fetch')
    })
    const user = userEvent.setup()
    const { onSaved } = renderForm()

    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('No se pudo conectar con el servidor')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana Pérez')

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(calls).toBe(1)
    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({
      method: 'POST',
      path: '/estudiantes',
      body: { nombre: 'Ana Pérez', correo: 'ana@uni.edu', edad: 20, carrera: 1 },
    })
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })

  it('prefills edit mode and sends PUT to /estudiantes/{id}', async () => {
    const { requests } = stubFetch(() => jsonResponse(200, { ...saved, nombre: 'Ana María' }))
    const user = userEvent.setup()
    const { onSaved } = renderForm({ estudiante: saved })

    expect(screen.getByRole('heading', { name: 'Editar estudiante' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana Pérez')
    expect(screen.getByLabelText('Correo')).toHaveValue('ana@uni.edu')
    expect(screen.getByLabelText('Edad')).toHaveValue(20)
    expect(screen.getByLabelText('Carrera')).toHaveValue('1')

    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'Ana María')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(requests[0]).toMatchObject({
      method: 'PUT',
      path: '/estudiantes/10',
      body: { nombre: 'Ana María', correo: 'ana@uni.edu', edad: 20, carrera: 1 },
    })
  })

  it('disables the submit button while the mutation is pending (no double submit)', async () => {
    let release: (r: Response) => void = () => {}
    const { requests } = stubFetch(() => new Promise<Response>((resolve) => (release = resolve)))
    const user = userEvent.setup()
    renderForm()

    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    const pending = await screen.findByRole('button', { name: 'Guardando…' })
    expect(pending).toBeDisabled()
    await user.click(pending)
    expect(requests).toHaveLength(1)

    release(jsonResponse(201, saved))
    expect(await screen.findByRole('button', { name: 'Guardar' })).toBeEnabled()
  })

  it('calls onCancel from the Cancelar button', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderForm()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
