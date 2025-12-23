import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Format a date string or Date object to French locale
 */
export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: fr })
}

/**
 * Format a date string to include time
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy à HH:mm')
}

/**
 * Format currency in EUR
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Format full name from first and last name
 */
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
