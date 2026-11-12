import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthContext } from '@/features/auth/AuthContext'
import type { Rol } from '@/features/auth/types'

/** A fresh client per test so no cache leaks between tests. */
export function renderWithProviders(ui: ReactElement, options: { rol?: Rol } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false }, mutations: { retry: false } },
  })
  const session = options.rol
    ? { accessToken: 'test-token', username: 'tester', rol: options.rol, expiresAt: Date.now() + 3_600_000 }
    : null
  const auth = { session, login: async () => {}, logout: () => {} }
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>{ui}</AuthContext.Provider>
      </QueryClientProvider>,
    ),
  }
}

export function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

export interface RecordedRequest {
  method: string
  path: string
  body: unknown
}

type Handler = (req: RecordedRequest) => Response | Promise<Response>

/** Stubs global fetch. `path` is the URL without the API base prefix. */
export function stubFetch(handler: Handler) {
  const requests: RecordedRequest[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const req: RecordedRequest = {
      method: init?.method ?? 'GET',
      path: url.replace(/^.*\/api\/v1/, ''),
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    }
    requests.push(req)
    return handler(req)
  })
  vi.stubGlobal('fetch', fetchMock)
  return { requests, fetchMock }
}
