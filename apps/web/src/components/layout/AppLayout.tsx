/** @fileoverview Layout principal avec sidebar, header, zone de contenu et session timeout actif */
import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuthStore } from '@/lib/stores/authStore'

const SESSION_DURATION = 30 * 60 * 1000 // 30 minutes
const CHECK_INTERVAL = 60 * 1000 // Check every 60 seconds

export function AppLayout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const updateActivity = useAuthStore((s) => s.updateActivity)

  // Active session timeout: check every 60s if session has expired
  useEffect(() => {
    const interval = setInterval(() => {
      const lastActivity = useAuthStore.getState().lastActivity
      if (lastActivity && Date.now() - lastActivity > SESSION_DURATION) {
        logout()
        navigate('/login')
      }
    }, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [logout, navigate])

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
