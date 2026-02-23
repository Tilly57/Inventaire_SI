/**
 * @fileoverview Unit tests for formatters utility functions
 *
 * Tests:
 * - formatDate - French locale date formatting
 * - formatDateTime - Date with time formatting
 * - formatCurrency - EUR currency formatting
 * - formatFullName - Name formatting
 * - formatFullNameLastFirst - Last name first formatting
 * - truncate - Text truncation with ellipsis
 */

import { describe, it, expect, vi } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatFullName,
  formatFullNameLastFirst,
  truncate,
} from '@/lib/utils/formatters'

describe('formatters', () => {
  describe('formatDate', () => {
    it('should format date string with default format', () => {
      const result = formatDate('2024-01-15')
      expect(result).toBe('15/01/2024')
    })

    it('should format date string with custom format', () => {
      const result = formatDate('2024-01-15', 'dd-MM-yyyy')
      expect(result).toBe('15-01-2024')
    })

    it('should format Date object', () => {
      const date = new Date('2024-01-15T10:30:00')
      const result = formatDate(date)
      expect(result).toBe('15/01/2024')
    })

    it('should return dash for null date', () => {
      const result = formatDate(null)
      expect(result).toBe('-')
    })

    it('should return dash for undefined date', () => {
      const result = formatDate(undefined)
      expect(result).toBe('-')
    })

    it('should handle invalid date string gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = formatDate('invalid-date')
      expect(result).toBe('-')
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })

    it('should format date with month name', () => {
      const result = formatDate('2024-01-15', 'dd MMMM yyyy')
      expect(result).toContain('janvier')
    })

    it('should handle leap year dates', () => {
      const result = formatDate('2024-02-29')
      expect(result).toBe('29/02/2024')
    })

    it('should handle year start date', () => {
      const result = formatDate('2024-01-01')
      expect(result).toBe('01/01/2024')
    })

    it('should handle year end date', () => {
      const result = formatDate('2024-12-31')
      expect(result).toBe('31/12/2024')
    })
  })

  describe('formatDateTime', () => {
    it('should format datetime string with time', () => {
      const result = formatDateTime('2024-01-15T14:30:00')
      expect(result).toBe('15/01/2024 à 14:30')
    })

    it('should format Date object with time', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatDateTime(date)
      expect(result).toBe('15/01/2024 à 14:30')
    })

    it('should return dash for null datetime', () => {
      const result = formatDateTime(null)
      expect(result).toBe('-')
    })

    it('should return dash for undefined datetime', () => {
      const result = formatDateTime(undefined)
      expect(result).toBe('-')
    })

    it('should handle midnight time', () => {
      const result = formatDateTime('2024-01-15T00:00:00')
      expect(result).toBe('15/01/2024 à 00:00')
    })

    it('should handle end of day time', () => {
      const result = formatDateTime('2024-01-15T23:59:59')
      expect(result).toBe('15/01/2024 à 23:59')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with EUR symbol', () => {
      const result = formatCurrency(1000)
      expect(result).toContain('€')
      expect(result).toContain('1')
      expect(result).toContain('000')
    })

    it('should format zero currency', () => {
      const result = formatCurrency(0)
      expect(result).toContain('0')
      expect(result).toContain('€')
    })

    it('should format decimal currency', () => {
      const result = formatCurrency(1234.56)
      expect(result).toContain('€')
    })

    it('should return dash for null amount', () => {
      const result = formatCurrency(null)
      expect(result).toBe('-')
    })

    it('should return dash for undefined amount', () => {
      const result = formatCurrency(undefined)
      expect(result).toBe('-')
    })

    it('should format large currency', () => {
      const result = formatCurrency(1000000)
      expect(result).toContain('€')
      expect(result).toContain('1')
    })

    it('should format negative currency', () => {
      const result = formatCurrency(-500)
      expect(result).toContain('€')
      expect(result).toContain('500')
    })

    it('should format very small decimal', () => {
      const result = formatCurrency(0.01)
      expect(result).toContain('€')
    })
  })

  describe('formatFullName', () => {
    it('should format full name with first name first', () => {
      const result = formatFullName('Jean', 'Dupont')
      expect(result).toBe('Jean Dupont')
    })

    it('should handle single character names', () => {
      const result = formatFullName('J', 'D')
      expect(result).toBe('J D')
    })

    it('should handle names with spaces', () => {
      const result = formatFullName('Jean Claude', 'Van Damme')
      expect(result).toBe('Jean Claude Van Damme')
    })

    it('should handle names with hyphens', () => {
      const result = formatFullName('Marie-Claire', 'Dubois-Martin')
      expect(result).toBe('Marie-Claire Dubois-Martin')
    })

    it('should handle names with accents', () => {
      const result = formatFullName('François', 'Müller')
      expect(result).toBe('François Müller')
    })

    it('should handle empty strings', () => {
      const result = formatFullName('', '')
      expect(result).toBe(' ')
    })
  })

  describe('formatFullNameLastFirst', () => {
    it('should format full name with last name first', () => {
      const result = formatFullNameLastFirst('Jean', 'Dupont')
      expect(result).toBe('Dupont Jean')
    })

    it('should handle single character names', () => {
      const result = formatFullNameLastFirst('J', 'D')
      expect(result).toBe('D J')
    })

    it('should handle names with spaces', () => {
      const result = formatFullNameLastFirst('Jean Claude', 'Van Damme')
      expect(result).toBe('Van Damme Jean Claude')
    })

    it('should handle names with hyphens', () => {
      const result = formatFullNameLastFirst('Marie-Claire', 'Dubois-Martin')
      expect(result).toBe('Dubois-Martin Marie-Claire')
    })

    it('should handle names with accents', () => {
      const result = formatFullNameLastFirst('François', 'Müller')
      expect(result).toBe('Müller François')
    })

    it('should handle empty strings', () => {
      const result = formatFullNameLastFirst('', '')
      expect(result).toBe(' ')
    })
  })

  describe('truncate', () => {
    it('should truncate text longer than max length', () => {
      const result = truncate('This is a long text', 10)
      expect(result).toBe('This is a ...')
    })

    it('should not truncate text shorter than max length', () => {
      const result = truncate('Short', 10)
      expect(result).toBe('Short')
    })

    it('should not truncate text equal to max length', () => {
      const result = truncate('Exactly10!', 10)
      expect(result).toBe('Exactly10!')
    })

    it('should handle empty string', () => {
      const result = truncate('', 10)
      expect(result).toBe('')
    })

    it('should handle zero max length', () => {
      const result = truncate('Text', 0)
      expect(result).toBe('...')
    })

    it('should truncate at exact boundary', () => {
      const result = truncate('Hello World!', 5)
      expect(result).toBe('Hello...')
    })

    it('should handle unicode characters', () => {
      const result = truncate('Hello 世界', 7)
      expect(result).toBe('Hello 世...')
    })

    it('should handle very long text', () => {
      const longText = 'a'.repeat(1000)
      const result = truncate(longText, 10)
      expect(result).toBe('aaaaaaaaaa...')
      expect(result.length).toBe(13)
    })

    it('should handle single character max length', () => {
      const result = truncate('Test', 1)
      expect(result).toBe('T...')
    })
  })
})
