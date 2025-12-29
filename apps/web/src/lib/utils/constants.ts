import { UserRole } from '@/lib/types/enums'

// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// Toast notifications duration (ms)
export const TOAST_DURATION = 4000

// Query stale time (5 minutes)
export const QUERY_STALE_TIME = 5 * 60 * 1000

// File upload limits
export const MAX_SIGNATURE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_SIGNATURE_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

// Low stock threshold
export const LOW_STOCK_THRESHOLD = 2

// Navigation links
export const NAVIGATION_ITEMS = [
  {
    label: 'Tableau de bord',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    allowedRoles: [UserRole.ADMIN, UserRole.GESTIONNAIRE, UserRole.LECTURE],
  },
  {
    label: 'Employés',
    path: '/employees',
    icon: 'Users',
    allowedRoles: [UserRole.ADMIN, UserRole.GESTIONNAIRE],
  },
  {
    label: 'Modèles d\'équipement',
    path: '/assets/models',
    icon: 'Package',
    allowedRoles: [UserRole.ADMIN, UserRole.GESTIONNAIRE],
  },
  {
    label: 'Équipements',
    path: '/assets/items',
    icon: 'Monitor',
    allowedRoles: [UserRole.ADMIN, UserRole.GESTIONNAIRE],
  },
  {
    label: 'Stock',
    path: '/stock',
    icon: 'Boxes',
    allowedRoles: [UserRole.ADMIN, UserRole.GESTIONNAIRE],
  },
  {
    label: 'Prêts',
    path: '/loans',
    icon: 'FileText',
    allowedRoles: [UserRole.ADMIN, UserRole.GESTIONNAIRE],
  },
  {
    label: 'Utilisateurs',
    path: '/users',
    icon: 'UserCog',
    allowedRoles: [UserRole.ADMIN],
  },
]
