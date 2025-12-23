import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { QUERY_STALE_TIME } from '@/lib/utils/constants'
import { Toaster } from '@/components/ui/toaster'

// Layout
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

// Pages
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersListPage } from '@/pages/UsersListPage'
import { EmployeesListPage } from '@/pages/EmployeesListPage'
import { AssetModelsListPage } from '@/pages/AssetModelsListPage'
import { AssetItemsListPage } from '@/pages/AssetItemsListPage'
import { StockItemsListPage } from '@/pages/StockItemsListPage'
import { LoansListPage } from '@/pages/LoansListPage'
import { LoanDetailsPage } from '@/pages/LoanDetailsPage'

// Enums
import { UserRole } from '@/lib/types/enums.ts'

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
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
              </Route>
            </Route>
          </Route>

          {/* 404 - Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
