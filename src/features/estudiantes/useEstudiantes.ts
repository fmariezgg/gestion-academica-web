import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as estudiantesApi from './estudiantesApi'
import type { EstudianteRequest } from './types'

export const estudiantesKeys = {
  all: ['estudiantes'] as const,
  list: () => ['estudiantes', 'list'] as const,
  detail: (id: number) => ['estudiantes', 'detail', id] as const,
}

export function useEstudiantes() {
  return useQuery({
    queryKey: estudiantesKeys.list(),
    queryFn: ({ signal }) => estudiantesApi.getAll(signal),
  })
}

export function useEstudiante(id: number) {
  return useQuery({
    queryKey: estudiantesKeys.detail(id),
    queryFn: ({ signal }) => estudiantesApi.getById(id, signal),
  })
}

export function useCreateEstudiante() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: estudiantesApi.create,
    // The new row's position/shape is decided by the server, so refetch the list instead of patching it.
    // Returning the promise keeps the mutation pending until the list is fresh.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: estudiantesKeys.list() }),
  })
}

export function useUpdateEstudiante() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EstudianteRequest }) => estudiantesApi.update(id, data),
    onSuccess: (updated) => {
      // setQueryData: the PUT response is the exact new state of one student, so the detail view updates instantly.
      queryClient.setQueryData(estudiantesKeys.detail(updated.id), updated)
      // invalidate: the list is a server-ordered collection, so let the server give the authoritative version.
      return queryClient.invalidateQueries({ queryKey: estudiantesKeys.list() })
    },
  })
}
