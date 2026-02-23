import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import * as useAuthHook from '@/lib/hooks/useAuth';

/**
 * Tests for ProtectedRoute component
 * Tests authentication and authorization checks
 */

// Mock the auth hook
vi.mock('@/lib/hooks/useAuth');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login when not authenticated', () => {
    // Mock unauthenticated state
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);

    render(
      <Routes>
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        } />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { wrapper: createWrapper() }
    );

    // Should redirect to login
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should render content when authenticated', () => {
    // Mock authenticated state
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'ADMIN' },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(
      <Routes>
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        } />
      </Routes>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should block access for LECTEUR role when requiredRole is ADMIN', () => {
    // Mock LECTEUR user
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: '1', email: 'lecteur@example.com', role: 'LECTURE' },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    const { container } = render(
      <MemoryRouter initialEntries={['/users']}>
        <Routes>
          <Route path="/users" element={
            <ProtectedRoute requiredRole="ADMIN">
              <div>Admin Content</div>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Should not show admin content, should show access denied
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(screen.getByText(/Accès refusé/i)).toBeInTheDocument();
  });

  it('should allow access for ADMIN role', () => {
    // Mock ADMIN user
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: '1', email: 'admin@example.com', role: 'ADMIN' },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(
      <MemoryRouter initialEntries={['/users']}>
        <Routes>
          <Route path="/users" element={
            <ProtectedRoute requiredRole="ADMIN">
              <div>Admin Content</div>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('should allow GESTIONNAIRE to access non-admin routes', () => {
    // Mock GESTIONNAIRE user
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: '1', email: 'gestionnaire@example.com', role: 'GESTIONNAIRE' },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(
      <MemoryRouter initialEntries={['/employees']}>
        <Routes>
          <Route path="/employees" element={
            <ProtectedRoute requiredRole="GESTIONNAIRE">
              <div>Employees Content</div>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Employees Content')).toBeInTheDocument();
  });

  it('should allow access with multiple allowed roles', () => {
    // Mock GESTIONNAIRE user
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: '1', email: 'gestionnaire@example.com', role: 'GESTIONNAIRE' },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'GESTIONNAIRE']}>
              <div>Dashboard Content</div>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('should show loading state while checking auth', () => {
    // Mock loading state
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    } as any);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    // Should show loading indicator
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });
});
