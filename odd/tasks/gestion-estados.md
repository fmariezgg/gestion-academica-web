# Feature: gestion-estados

## Objective
Fulfil the practice guide "Gestión de estados en React" (SIS0421, 10 pts) on top of the existing
Sesión 12 client: classify state, typed queries, mutations (POST + PUT) with cache
synchronisation, robustness (validation, network retry, 401 vs 403) and role-based UI.

## Starting point
Already present: login, protected routes, session storage, fetch `http()` client, `useEstudiantes`,
`useCarreras`, table with loading/error/empty states, local filter, create form (ADMIN only).

Missing: edit via `PUT /estudiantes/{id}`, precise cache sync after mutations, retry on network
failure inside the form, state classification / design documentation, analysis answers, tests.

## Constraints
- Do not rebuild login. Do not modify the backend. No credentials or tokens in the repo.
- No `window.location.reload()`. No copy of server data into `useState`.
- TDD: disabled (no project configuration). Runner added in T2: `pnpm test` (Vitest).
- Delivery strategy: single-pr (small feature). Push/merge are the user's decision.

## Tasks
- [x] T1 Edit + sync: `update` service, `useUpdateEstudiante`, hierarchical query keys, shared
      create/edit form, retry on network error, role-gated actions. Route: delegated writer
      (6 non-trivial files).
- [x] T2 Tests: Vitest + Testing Library for form validation, API error mapping, edit prefill,
      cache sync and role gating. Route: same delegated writer.
- [x] T3 Docs: README sections for state classification, component design, query keys, analysis
      answers, permissions. Route: inline (one file).
- [x] T4 Deliverable: cover PDF in `04-Entregables/` (outside the repo). Route: inline.

## Checks
`pnpm lint`, `pnpm build`, `pnpm test`, manual run against the backend on :9090.

## Progress / evidence
- T1/T2: `pnpm lint` clean, `pnpm build` OK, `pnpm test` 17/17 (9 form, 8 page). Re-run by the parent.
- T3: README sections added (state classification, design, keys, sync, robustness, analysis answers).
- T4: `04-Entregables/Entrega_Gestion_Estados_React.pdf` (cover, same layout as Sesión 12).
- Backend on :9090 answers 401 to unauthenticated GET/PUT `/estudiantes` (route exists, security on).
- Pending: manual browser run as ADMIN and DOCENTE (needs the user's credentials).
