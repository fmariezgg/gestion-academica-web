export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-6 text-slate-600">
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"
      />
      <span>{label}</span>
    </div>
  )
}
