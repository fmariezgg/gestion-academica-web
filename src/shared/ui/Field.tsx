import type { ReactNode } from 'react'

export const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-indigo-600'

interface FieldProps {
  id: string
  label: string
  error?: string
  children: ReactNode
}

/** Label + control + accessible error message. The control must set id and aria-describedby itself. */
export function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
