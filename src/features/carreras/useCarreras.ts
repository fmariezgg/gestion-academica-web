import { useQuery } from '@tanstack/react-query'
import * as carrerasApi from './carrerasApi'

export const carrerasKeys = {
  all: ['carreras'] as const,
}

export function useCarreras() {
  return useQuery({
    queryKey: carrerasKeys.all,
    queryFn: ({ signal }) => carrerasApi.getAll(signal),
    staleTime: 5 * 60 * 1000, // catalog data rarely changes
  })
}
