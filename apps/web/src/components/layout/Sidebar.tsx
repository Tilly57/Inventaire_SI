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
} from 'lucide-react'

const iconMap = {
  LayoutDashboard,
  Users,
  Package,
  Monitor,
  Boxes,
  FileText,
  UserCog,
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
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">Inventaire SI</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Gestion des équipements
        </p>
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
                'hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{user.username}</p>
          <p className="truncate">{user.email}</p>
        </div>
      </div>
    </aside>
  )
}
