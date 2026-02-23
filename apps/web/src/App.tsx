import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AppInitializer } from '@/components/common/AppInitializer'
import * as Sentry from '@sentry/react'

// Layout (not lazy-loaded - needed immediately)
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { PageSkeleton } from '@/components/common/PageSkeleton'

// Enums
import { UserRole } from '@/lib/types/enums.ts'

// Lazy-loaded pages (code splitting for optimal bundle size)
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const UsersListPage = lazy(() => import('@/pages/UsersListPage'))
const EmployeesListPage = lazy(() => import('@/pages/EmployeesListPage'))
const AssetModelsListPage = lazy(() => import('@/pages/AssetModelsListPage'))
const AssetItemsListPage = lazy(() => import('@/pages/AssetItemsListPage'))
const StockItemsListPage = lazy(() => import('@/pages/StockItemsListPage'))
const LoansListPage = lazy(() => import('@/pages/LoansListPage'))
const LoanDetailsPage = lazy(() => import('@/pages/LoanDetailsPage'))
const AuditLogsPage = lazy(() => import('@/pages/AuditLogsPage'))

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s — avoid excessive refetches on navigation
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

// Wrap BrowserRouter with Sentry for automatic navigation tracking
const SentryRoutes = Sentry.withSentryRouting(Routes)

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AppInitializer>
            <Toaster />
            <BrowserRouter>
        <Suspense fallback={<PageSkeleton />}>
          <SentryRoutes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Dashboard - accessible to all roles */}
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Users - ADMIN only */}
                <Route
                  element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}
                >
                  <Route path="/users" element={<UsersListPage />} />
                </Route>

                {/* Employees, Assets, Stock, Loans - ADMIN and GESTIONNAIRE */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[UserRole.ADMIN, UserRole.GESTIONNAIRE]}
                    />
                  }
                >
                  <Route path="/employees" element={<EmployeesListPage />} />
                  <Route path="/assets/models" element={<AssetModelsListPage />} />
                  <Route path="/assets/items" element={<AssetItemsListPage />} />
                  <Route path="/stock" element={<StockItemsListPage />} />
                  <Route path="/loans" element={<LoansListPage />} />
                  <Route path="/loans/:id" element={<LoanDetailsPage />} />
                  <Route path="/audit-logs" element={<AuditLogsPage />} />
                </Route>
              </Route>
            </Route>

            {/* 404 - Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </SentryRoutes>
        </Suspense>
        </BrowserRouter>
          </AppInitializer>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
