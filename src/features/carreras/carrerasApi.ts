import { http } from '@/shared/api/httpClient'
import type { Carrera } from './types'

export function getAll(signal?: AbortSignal) {
  return http<Carrera[]>('/carreras', { signal })
}
