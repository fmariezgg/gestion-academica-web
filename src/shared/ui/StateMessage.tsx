import type { ReactNode } from 'react'
import { Button } from './Button'

export function EmptyMessage({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
      {children}
    </p>
  )
}

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
    >
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
