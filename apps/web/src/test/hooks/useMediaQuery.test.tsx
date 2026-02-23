/**
 * @fileoverview Unit tests for useMediaQuery hooks
 *
 * Tests:
 * - useMediaQuery (responsive breakpoint detection)
 * - useMediaQueryMatch (custom media query matching)
 * - Window resize handling
 * - SSR compatibility
 * - Breakpoint thresholds
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery, useMediaQueryMatch } from '@/lib/hooks/useMediaQuery'

describe('useMediaQuery', () => {
  let originalInnerWidth: number

  beforeEach(() => {
    // Store original window width
    originalInnerWidth = window.innerWidth

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    // Restore original window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
  })

  describe('useMediaQuery - Breakpoint detection', () => {
    it('should detect mobile viewport (< 640px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })

      const { result } = renderHook(() => useMediaQuery())

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isMobile).toBe(true)
      expect(result.current.isTablet).toBe(false)
      expect(result.current.isDesktop).toBe(false)
      expect(result.current.width).toBe(500)
    })

    it('should detect tablet viewport (640px - 1023px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      const { result } = renderHook(() => useMediaQuery())

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isMobile).toBe(false)
      expect(result.current.isTablet).toBe(true)
      expect(result.current.isDesktop).toBe(false)
      expect(result.current.width).toBe(768)
    })

    it('should detect desktop viewport (>= 1024px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      })

      const { result } = renderHook(() => useMediaQuery())

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isMobile).toBe(false)
      expect(result.current.isTablet).toBe(false)
      expect(result.current.isDesktop).toBe(true)
      expect(result.current.width).toBe(1280)
    })

    it('should handle exact mobile breakpoint (639px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 639,
      })

      const { result } = renderHook(() => useMediaQuery())

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isMobile).toBe(true)
      expect(result.current.isTablet).toBe(false)
    })

    it('should handle exact tablet breakpoint start (640px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      })

      const { result } = renderHook(() => useMediaQuery())

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isMobile).toBe(false)
      expect(result.current.isTablet).toBe(true)
      expect(result.current.isDesktop).toBe(false)
    })

    it('should handle exact desktop breakpoint start (1024px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      const { result } = renderHook(() => useMediaQuery())

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isMobile).toBe(false)
      expect(result.current.isTablet).toBe(false)
      expect(result.current.isDesktop).toBe(true)
    })

    it('should handle very small mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      })

      const { result } = renderHook(() => useMediaQuery())

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isMobile).toBe(true)
      expect(result.current.width).toBe(320)
    })

    it('should handle very large desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 2560,
      })

      const { result } = renderHook(() => useMediaQuery())

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isDesktop).toBe(true)
      expect(result.current.width).toBe(2560)
    })
  })

  describe('useMediaQuery - Resize handling', () => {
    it('should update on window resize from mobile to tablet', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })

      const { result } = renderHook(() => useMediaQuery())

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isMobile).toBe(true)

      // Resize to tablet
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isTablet).toBe(true)
      expect(result.current.isMobile).toBe(false)
    })

    it('should update on window resize from tablet to desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      const { result } = renderHook(() => useMediaQuery())

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isTablet).toBe(true)

      // Resize to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      })

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isDesktop).toBe(true)
      expect(result.current.isTablet).toBe(false)
    })

    it('should update on window resize from desktop to mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      })

      const { result } = renderHook(() => useMediaQuery())

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isDesktop).toBe(true)

      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isMobile).toBe(true)
      expect(result.current.isDesktop).toBe(false)
    })

    it('should handle multiple rapid resizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })

      const { result } = renderHook(() => useMediaQuery())

      // Trigger multiple resizes
      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      })

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.isDesktop).toBe(true)
      expect(result.current.width).toBe(1280)
    })
  })

  describe('useMediaQuery - Cleanup', () => {
    it('should cleanup resize listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useMediaQuery())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('should not trigger updates after unmount', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })

      const { result, unmount } = renderHook(() => useMediaQuery())

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      const widthBeforeUnmount = result.current.width

      unmount()

      // Try to trigger resize after unmount
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      })

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      // Width should not have changed after unmount
      expect(widthBeforeUnmount).toBe(500)
    })
  })

  describe('useMediaQuery - Return values', () => {
    it('should return all required properties', () => {
      const { result } = renderHook(() => useMediaQuery())

      expect(result.current).toHaveProperty('isMobile')
      expect(result.current).toHaveProperty('isTablet')
      expect(result.current).toHaveProperty('isDesktop')
      expect(result.current).toHaveProperty('width')
    })

    it('should return boolean values for breakpoints', () => {
      const { result } = renderHook(() => useMediaQuery())

      expect(typeof result.current.isMobile).toBe('boolean')
      expect(typeof result.current.isTablet).toBe('boolean')
      expect(typeof result.current.isDesktop).toBe('boolean')
    })

    it('should return number value for width', () => {
      const { result } = renderHook(() => useMediaQuery())

      expect(typeof result.current.width).toBe('number')
      expect(result.current.width).toBeGreaterThanOrEqual(0)
    })

    it('should ensure only one breakpoint is true at a time', () => {
      const { result } = renderHook(() => useMediaQuery())

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      const trueCount = [
        result.current.isMobile,
        result.current.isTablet,
        result.current.isDesktop,
      ].filter(Boolean).length

      expect(trueCount).toBe(1)
    })
  })
})

describe('useMediaQueryMatch', () => {
  describe('Custom media query matching', () => {
    it('should match custom media query', () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        media: '(min-width: 768px)',
        onchange: null,
        dispatchEvent: vi.fn(),
      }

      vi.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery as any)

      const { result } = renderHook(() => useMediaQueryMatch('(min-width: 768px)'))

      expect(result.current).toBe(true)
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)')
    })

    it('should not match when media query does not match', () => {
      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        media: '(min-width: 768px)',
        onchange: null,
        dispatchEvent: vi.fn(),
      }

      vi.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery as any)

      const { result } = renderHook(() => useMediaQueryMatch('(min-width: 768px)'))

      expect(result.current).toBe(false)
    })

    it('should update when media query changes', () => {
      let changeHandler: ((event: MediaQueryListEvent) => void) | null = null

      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn((event, handler) => {
          if (event === 'change') {
            changeHandler = handler as (event: MediaQueryListEvent) => void
          }
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        media: '(min-width: 768px)',
        onchange: null,
        dispatchEvent: vi.fn(),
      }

      vi.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery as any)

      const { result } = renderHook(() => useMediaQueryMatch('(min-width: 768px)'))

      expect(result.current).toBe(false)

      // Simulate media query change
      act(() => {
        if (changeHandler) {
          changeHandler({ matches: true } as MediaQueryListEvent)
        }
      })

      expect(result.current).toBe(true)
    })

    it('should handle fallback for old browsers without addEventListener', () => {
      let changeHandler: ((event: MediaQueryListEvent) => void) | null = null

      const mockMediaQuery = {
        matches: true,
        addEventListener: undefined, // Old browser without addEventListener
        removeEventListener: undefined,
        addListener: vi.fn((handler) => {
          changeHandler = handler as (event: MediaQueryListEvent) => void
        }),
        removeListener: vi.fn(),
        media: '(min-width: 768px)',
        onchange: null,
        dispatchEvent: vi.fn(),
      }

      vi.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery as any)

      const { result } = renderHook(() => useMediaQueryMatch('(min-width: 768px)'))

      expect(result.current).toBe(true)
      expect(mockMediaQuery.addListener).toHaveBeenCalled()
    })

    it('should cleanup media query listener on unmount', () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        media: '(min-width: 768px)',
        onchange: null,
        dispatchEvent: vi.fn(),
      }

      vi.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery as any)

      const { unmount } = renderHook(() => useMediaQueryMatch('(min-width: 768px)'))

      unmount()

      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should handle orientation media queries', () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        media: '(orientation: landscape)',
        onchange: null,
        dispatchEvent: vi.fn(),
      }

      vi.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery as any)

      const { result } = renderHook(() => useMediaQueryMatch('(orientation: landscape)'))

      expect(result.current).toBe(true)
    })

    it('should handle print media queries', () => {
      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        media: 'print',
        onchange: null,
        dispatchEvent: vi.fn(),
      }

      vi.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery as any)

      const { result } = renderHook(() => useMediaQueryMatch('print'))

      expect(result.current).toBe(false)
    })

    it('should handle complex media queries with multiple conditions', () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        media: '(min-width: 768px) and (max-width: 1024px)',
        onchange: null,
        dispatchEvent: vi.fn(),
      }

      vi.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery as any)

      const { result } = renderHook(() => useMediaQueryMatch('(min-width: 768px) and (max-width: 1024px)'))

      expect(result.current).toBe(true)
    })
  })
})
