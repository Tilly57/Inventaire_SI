/**
 * @fileoverview ProtectedRoute - Route guard component for authentication and authorization
 *
 * This component:
 * - Protects routes from unauthenticated access
 * - Implements role-based access control (RBAC)
 * - Shows loading state during authentication check
 * - Redirects to login if not authenticated
 * - Shows access denied if user lacks required role
 *
 * Usage with React Router:
 * - Wrap protected routes with <ProtectedRoute>
 * - Use <Outlet /> pattern for nested routes
 * - Specify allowedRoles for role-based restrictions
 *
 * Security:
 * - Uses useAuth hook which validates JWT tokens
 * - Authentication state synced with backend via API
 * - Failed auth redirects to /login with replace (no back button)
 */
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import { UserRole } from '@/lib/types/enums.ts'

/**
 * Props for ProtectedRoute component
 *
 * @interface ProtectedRouteProps
 * @property {UserRole[]} [allowedRoles] - Optional array of roles allowed to access this route
 *
 * @example
 * // Allow only ADMIN users
 * <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />
 *
 * @example
 * // Allow ADMIN and GESTIONNAIRE users
 * <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GESTIONNAIRE]} />
 *
 * @example
 * // Allow any authenticated user (no role restriction)
 * <ProtectedRoute />
 */
interface ProtectedRouteProps {
  /** Optional array of user roles allowed to access this route */
  allowedRoles?: UserRole[]
}

/**
 * Route guard component that protects routes with authentication and authorization
 *
 * Handles three states:
 * 1. Loading: Shows spinner while checking authentication
 * 2. Not Authenticated: Redirects to /login
 * 3. Insufficient Permissions: Shows access denied page
 * 4. Success: Renders child routes via <Outlet />
 *
 * @param {ProtectedRouteProps} props - Component props
 * @returns {JSX.Element} Protected route content or redirect
 *
 * @example
 * // In router configuration (main.tsx or App.tsx)
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 *
 * @example
 * // Admin-only routes
 * <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
 *   <Route path="/users" element={<UsersPage />} />
 * </Route>
 *
 * @example
 * // Multiple allowed roles
 * <Route
 *   element={
 *     <ProtectedRoute
 *       allowedRoles={[UserRole.ADMIN, UserRole.GESTIONNAIRE]}
 *     />
 *   }
 * >
 *   <Route path="/employees" element={<EmployeesPage />} />
 *   <Route path="/assets" element={<AssetsPage />} />
 * </Route>
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  // Show loading state while checking authentication
  // The useAuth hook verifies JWT token and fetches user data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  // 'replace' prevents user from going back to protected page
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Check if user has required role (RBAC)
  // If allowedRoles is undefined, any authenticated user can access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Accès refusé
          </h1>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    )
  }

  // User is authenticated and has correct role
  // Render child routes via React Router's Outlet component
  return <Outlet />
}
