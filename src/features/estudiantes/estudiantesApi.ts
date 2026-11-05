import { http } from '@/shared/api/httpClient'
import type { EstudianteRequest, EstudianteResponse } from './types'

export function getAll(signal?: AbortSignal) {
  return http<EstudianteResponse[]>('/estudiantes', { signal })
}

export function getById(id: number, signal?: AbortSignal) {
  return http<EstudianteResponse>(`/estudiantes/${id}`, { signal })
}

export function create(data: EstudianteRequest) {
  return http<EstudianteResponse>('/estudiantes', { method: 'POST', body: data })
}
