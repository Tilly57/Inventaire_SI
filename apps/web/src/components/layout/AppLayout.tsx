/** @fileoverview Layout principal avec sidebar, header, zone de contenu et session timeout actif */
import { useEffect, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuthStore } from '@/lib/stores/authStore'
import { useToast } from '@/lib/hooks/use-toast'

const SESSION_DURATION = 30 * 60 * 1000 // 30 minutes
const WARNING_THRESHOLD = 5 * 60 * 1000 // Warn 5 min before expiry
const CHECK_INTERVAL = 30 * 1000 // Check every 30 seconds

export function AppLayout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const updateActivity = useAuthStore((s) => s.updateActivity)
  const { toast } = useToast()
  const warningShown = useRef(false)

  // Active session timeout: check every 30s, warn before expiry
  useEffect(() => {
    const interval = setInterval(() => {
      const lastActivity = useAuthStore.getState().lastActivity
      if (!lastActivity) return

      const remaining = SESSION_DURATION - (Date.now() - lastActivity)

      if (remaining <= 0) {
        logout()
        navigate('/login')
      } else if (remaining <= WARNING_THRESHOLD && !warningShown.current) {
        warningShown.current = true
        toast({
          variant: 'destructive',
          title: 'Session bientôt expirée',
          description: 'Votre session expire dans 5 minutes. Cliquez ou tapez pour rester connecté.',
          duration: 10000,
        })
      } else if (remaining > WARNING_THRESHOLD) {
        warningShown.current = false
      }
    }, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [logout, navigate, toast])

  // Track user activity on interactions
  useEffect(() => {
    const onActivity = () => updateActivity()
    window.addEventListener('click', onActivity)
    window.addEventListener('keydown', onActivity)
    return () => {
      window.removeEventListener('click', onActivity)
      window.removeEventListener('keydown', onActivity)
    }
  }, [updateActivity])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-muted/40 p-3 md:p-6 lg:p-8 custom-scrollbar smooth-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
