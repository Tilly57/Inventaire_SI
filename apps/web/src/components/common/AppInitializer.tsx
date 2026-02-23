/**
 * @fileoverview Application Initializer Component
 *
 * Handles one-time initialization tasks when the app loads:
 * - CSRF token initialization for security
 * - Future: Other initialization tasks (analytics, feature flags, etc.)
 */

import { useEffect } from 'react'
import { initializeCsrf } from '@/lib/api/client'

interface AppInitializerProps {
  children: React.ReactNode
}

/**
 * AppInitializer component
 *
 * Wraps the application and ensures critical initialization tasks
 * are completed before rendering children.
 */
export function AppInitializer({ children }: AppInitializerProps) {
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize CSRF protection
        await initializeCsrf()
      } catch (error) {
        console.error('[AppInitializer] Initialization failed:', error)
        // Even if initialization fails, allow app to render
        // Individual requests will handle missing CSRF tokens
      }
    }

    initialize()
  }, [])

  // Render children immediately - CSRF is non-blocking
  // The token will be available for subsequent mutations
  return <>{children}</>
}
