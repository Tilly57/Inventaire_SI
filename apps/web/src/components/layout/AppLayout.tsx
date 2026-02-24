/** @fileoverview Layout principal avec sidebar, header et zone de contenu */
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppLayout() {
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
