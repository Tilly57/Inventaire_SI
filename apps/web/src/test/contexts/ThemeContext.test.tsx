/**
 * @fileoverview Unit tests for ThemeContext
 *
 * Tests:
 * - ThemeProvider initialization
 * - useTheme hook functionality
 * - Theme switching (light, dark, system)
 * - localStorage persistence
 * - System theme detection
 * - Document class manipulation
 * - Error handling for hook used outside provider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { render } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@/lib/contexts/ThemeContext'
import { ReactNode } from 'react'

describe('ThemeContext', () => {
  let localStorageMock: { [key: string]: string }
  let matchMediaMock: { matches: boolean; addEventListener: any; removeEventListener: any }

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {}

    Storage.prototype.getItem = vi.fn((key: string) => localStorageMock[key] || null)
    Storage.prototype.setItem = vi.fn((key: string, value: string) => {
      localStorageMock[key] = value
    })
    Storage.prototype.removeItem = vi.fn((key: string) => {
      delete localStorageMock[key]
    })

    // Mock matchMedia
    matchMediaMock = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    window.matchMedia = vi.fn(() => matchMediaMock as any)

    // Mock document.documentElement
    document.documentElement.classList.remove('light', 'dark')
  })

  afterEach(() => {
    vi.clearAllMocks()
    document.documentElement.classList.remove('light', 'dark')
  })

  describe('ThemeProvider - Initialization', () => {
    it('should initialize with system theme by default', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(result.current.theme).toBe('system')
    })

    it('should load theme from localStorage', () => {
      localStorageMock['inventaire-si-theme'] = 'dark'

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(result.current.theme).toBe('dark')
    })

    it('should initialize with light theme from localStorage', () => {
      localStorageMock['inventaire-si-theme'] = 'light'

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(result.current.theme).toBe('light')
    })

    it('should apply light theme to document when system prefers light', () => {
      matchMediaMock.matches = false // Light mode

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(result.current.actualTheme).toBe('light')
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })

    it('should apply dark theme to document when system prefers dark', () => {
      matchMediaMock.matches = true // Dark mode

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(result.current.actualTheme).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('ThemeProvider - Theme switching', () => {
    it('should switch to dark theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('dark')
      expect(result.current.actualTheme).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })

    it('should switch to light theme', () => {
      localStorageMock['inventaire-si-theme'] = 'dark'

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('light')
      })

      expect(result.current.theme).toBe('light')
      expect(result.current.actualTheme).toBe('light')
      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should switch to system theme', () => {
      localStorageMock['inventaire-si-theme'] = 'dark'
      matchMediaMock.matches = false // System prefers light

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('system')
      })

      expect(result.current.theme).toBe('system')
      expect(result.current.actualTheme).toBe('light')
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })

    it('should persist theme to localStorage when changed', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('dark')
      })

      expect(localStorage.setItem).toHaveBeenCalledWith('inventaire-si-theme', 'dark')
      expect(localStorageMock['inventaire-si-theme']).toBe('dark')
    })

    it('should switch between multiple themes', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('dark')
      })
      expect(result.current.theme).toBe('dark')

      act(() => {
        result.current.setTheme('light')
      })
      expect(result.current.theme).toBe('light')

      act(() => {
        result.current.setTheme('system')
      })
      expect(result.current.theme).toBe('system')
    })
  })

  describe('ThemeProvider - System theme detection', () => {
    it('should detect system dark mode preference', () => {
      matchMediaMock.matches = true

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(result.current.actualTheme).toBe('dark')
    })

    it('should detect system light mode preference', () => {
      matchMediaMock.matches = false

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(result.current.actualTheme).toBe('light')
    })

    it('should listen to system theme changes when theme is system', () => {
      localStorageMock['inventaire-si-theme'] = 'system'
      matchMediaMock.matches = false

      renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
      expect(matchMediaMock.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should not listen to system theme changes when theme is not system', () => {
      vi.clearAllMocks()
      localStorageMock['inventaire-si-theme'] = 'dark'

      renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      // matchMedia is called once during initialization to determine actual theme
      expect(matchMediaMock.addEventListener).not.toHaveBeenCalled()
    })

    it('should update theme when system preference changes', () => {
      let changeHandler: (() => void) | null = null

      matchMediaMock.addEventListener = vi.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler
        }
      })

      matchMediaMock.matches = false
      localStorageMock['inventaire-si-theme'] = 'system'

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(result.current.actualTheme).toBe('light')

      // Simulate system theme change to dark
      matchMediaMock.matches = true
      act(() => {
        if (changeHandler) {
          changeHandler()
        }
      })

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should cleanup system theme listener on unmount', () => {
      localStorageMock['inventaire-si-theme'] = 'system'

      const { unmount } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      unmount()

      expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })
  })

  describe('ThemeProvider - Document class manipulation', () => {
    it('should add light class to document root', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('light')
      })

      expect(document.documentElement.classList.contains('light')).toBe(true)
    })

    it('should add dark class to document root', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('dark')
      })

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should remove previous theme class when switching themes', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('dark')
      })
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      act(() => {
        result.current.setTheme('light')
      })
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })

    it('should only have one theme class at a time', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('dark')
      })

      const hasLight = document.documentElement.classList.contains('light')
      const hasDark = document.documentElement.classList.contains('dark')

      expect((hasLight && hasDark) || (!hasLight && !hasDark)).toBe(false)
      expect(hasLight || hasDark).toBe(true)
    })
  })

  describe('useTheme - Hook usage', () => {
    it('should throw error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useTheme())
      }).toThrow('useTheme must be used within a ThemeProvider')

      consoleErrorSpy.mockRestore()
    })

    it('should return theme context values', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(result.current).toHaveProperty('theme')
      expect(result.current).toHaveProperty('setTheme')
      expect(result.current).toHaveProperty('actualTheme')
    })

    it('should provide setTheme function', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(typeof result.current.setTheme).toBe('function')
    })

    it('should allow multiple consumers to access theme', () => {
      let sharedResult1: any
      let sharedResult2: any

      const TestComponent = () => {
        sharedResult1 = useTheme()
        sharedResult2 = useTheme()
        return null
      }

      const { rerender } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      act(() => {
        sharedResult1.setTheme('dark')
      })

      rerender(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(sharedResult2.theme).toBe('dark')
    })
  })

  describe('ThemeProvider - Edge cases', () => {
    it('should handle invalid theme in localStorage', () => {
      localStorageMock['inventaire-si-theme'] = 'invalid-theme'

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      // Should still initialize, treating invalid as a string
      expect(result.current.theme).toBe('invalid-theme')
    })

    it('should handle missing localStorage gracefully', () => {
      Storage.prototype.getItem = vi.fn(() => null)

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(result.current.theme).toBe('system')
    })

    it('should render children correctly', () => {
      const { getByText } = render(
        <ThemeProvider>
          <div>Test Child</div>
        </ThemeProvider>
      )

      expect(getByText('Test Child')).toBeDefined()
    })

    it('should handle rapid theme changes', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('dark')
        result.current.setTheme('light')
        result.current.setTheme('system')
      })

      expect(result.current.theme).toBe('system')
    })
  })

  describe('ThemeProvider - actualTheme calculation', () => {
    it('should calculate actualTheme as dark when theme is dark', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.actualTheme).toBe('dark')
    })

    it('should calculate actualTheme as light when theme is light', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('light')
      })

      expect(result.current.actualTheme).toBe('light')
    })

    it('should calculate actualTheme based on system when theme is system', () => {
      matchMediaMock.matches = true // System prefers dark

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('system')
      })

      expect(result.current.actualTheme).toBe('dark')
    })
  })
})
