/**
 * @fileoverview Unit tests for cn utility function
 *
 * Tests:
 * - Class name merging
 * - Tailwind CSS conflict resolution
 * - Conditional class names
 */

import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils/cn'

describe('cn utility', () => {
  it('should merge simple class names', () => {
    const result = cn('text-red-500', 'font-bold')
    expect(result).toContain('text-red-500')
    expect(result).toContain('font-bold')
  })

  it('should resolve Tailwind CSS conflicts', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('should handle conditional class names', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toContain('base-class')
    expect(result).toContain('active-class')
  })

  it('should handle false conditional class names', () => {
    const isActive = false
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toBe('base-class')
  })

  it('should handle objects', () => {
    const result = cn({ 'text-red-500': true, 'font-bold': false })
    expect(result).toContain('text-red-500')
    expect(result).not.toContain('font-bold')
  })

  it('should handle arrays', () => {
    const result = cn(['text-red-500', 'font-bold'])
    expect(result).toContain('text-red-500')
    expect(result).toContain('font-bold')
  })

  it('should handle empty input', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle undefined and null', () => {
    const result = cn('text-red-500', undefined, null, 'font-bold')
    expect(result).toContain('text-red-500')
    expect(result).toContain('font-bold')
  })

  it('should resolve multiple Tailwind conflicts', () => {
    const result = cn('p-4', 'p-8', 'm-2', 'm-4')
    expect(result).toBe('p-8 m-4')
  })

  it('should handle mixed inputs', () => {
    const result = cn(
      'base-class',
      { 'conditional-class': true },
      ['array-class'],
      false && 'never-included',
      'final-class'
    )
    expect(result).toContain('base-class')
    expect(result).toContain('conditional-class')
    expect(result).toContain('array-class')
    expect(result).toContain('final-class')
    expect(result).not.toContain('never-included')
  })
})
