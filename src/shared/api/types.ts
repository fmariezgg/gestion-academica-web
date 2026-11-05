/**
 * Error format returned by the backend (GlobalExceptionHandler and the 401/403 handlers).
 * Validation errors (400) carry `errors` and no `message`.
 */
export interface ApiErrorBody {
  timestamp: string
  /** May arrive as a number or as a string such as 'NOT_FOUND'; do not rely on it. */
  status: number | string
  error: string
  message?: string
  errors?: Record<string, string>
}
