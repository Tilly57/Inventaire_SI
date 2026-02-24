import { AxiosError } from 'axios'

/**
 * Extract a user-friendly error message from an unknown error.
 * Avoids exposing raw backend details to users.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.error || fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}
