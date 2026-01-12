import { useAuth } from '@/lib/hooks/useAuth'
import { UserRoleLabels } from '@/lib/types/enums.ts'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MobileNav } from './MobileNav'
import { GlobalSearch } from '@/components/common/GlobalSearch'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { User, LogOut, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <header className="h-16 border-b border-[#EE2722]/20 bg-[#231F20] flex items-center justify-between px-4 md:px-6">
      {/* Mobile menu */}
      <div className="md:hidden">
        <MobileNav />
      </div>

      {/* Logo and Company Name */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="/images/logo.jpg"
            alt="Groupe Tilly Logo"
            className="h-10 sm:h-12 w-auto object-contain"
            onError={(e) => {
              // Fallback si le logo n'existe pas encore
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>

        {/* Company Name */}
        <div className="flex flex-col">
          <h1 className="text-lg sm:text-xl font-bold text-[#EE2722] leading-tight">Groupe Tilly</h1>
          <p className="text-xs text-gray-400 hidden md:block">Inventaire SI</p>
        </div>
      </div>

      {/* Global Search - Centered */}
      <div className="flex-1 flex justify-center px-4">
        <GlobalSearch />
      </div>

      {/* User menu */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 hover:bg-[#EE2722]/10">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#EE2722] text-white">
                <User className="h-4 w-4" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-white">{user.username}</p>
                <p className="text-xs text-gray-400">
                  {UserRoleLabels[user.role]}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
