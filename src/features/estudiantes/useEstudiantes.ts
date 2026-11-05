import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as estudiantesApi from './estudiantesApi'

export const estudiantesKeys = {
  all: ['estudiantes'] as const,
  detail: (id: number) => ['estudiantes', id] as const,
}

export function useEstudiantes() {
  return useQuery({
    queryKey: estudiantesKeys.all,
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
    // Refresh the list so the new student shows up.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: estudiantesKeys.all }),
  })
}
