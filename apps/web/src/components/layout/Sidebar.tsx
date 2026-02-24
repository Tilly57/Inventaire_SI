/** @fileoverview Barre laterale de navigation avec liens et logo */
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import { NAVIGATION_ITEMS } from '@/lib/utils/constants'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Users,
  Package,
  Monitor,
  Boxes,
  FileText,
  UserCog,
  History,
} from 'lucide-react'

const iconMap = {
  LayoutDashboard,
  Users,
  Package,
  Monitor,
  Boxes,
  FileText,
  UserCog,
  History,
}

export function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return null

  // Filter navigation items based on user role
  const visibleItems = NAVIGATION_ITEMS.filter((item) =>
    item.allowedRoles.includes(user.role)
  )

  return (
    <aside className="hidden md:flex w-64 bg-[#231F20] border-r border-[#EE2722]/20 min-h-screen flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[#EE2722]/20">
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-bold text-[#EE2722] text-center">
            Gestion des équipements
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap]
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
                isActive
                  ? 'bg-[#EE2722] text-white hover:bg-[#EE2722]/90'
                  : 'text-gray-400 hover:bg-[#EE2722]/10 hover:text-[#EE2722]'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-[#EE2722]/20">
        <div className="text-xs text-gray-400">
          <p className="font-medium text-white">{user.username}</p>
          <p className="truncate">{user.email}</p>
        </div>
      </div>
    </aside>
  )
}
