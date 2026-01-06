import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserFormDialog } from '@/components/users/UserFormDialog';

/**
 * Tests for UserFormDialog component
 * Tests user creation, role management, password validation
 */

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('UserFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form when open', () => {
    render(
      <UserFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rôle/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    render(
      <UserFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByRole('button', { name: /créer/i }));

    await waitFor(() => {
      expect(screen.getByText(/email.*requis/i)).toBeInTheDocument();
      expect(screen.getByText(/mot de passe.*requis/i)).toBeInTheDocument();
      expect(screen.getByText(/rôle.*requis/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();

    render(
      <UserFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /créer/i }));

    await waitFor(() => {
      expect(screen.getByText(/email.*invalide/i)).toBeInTheDocument();
    });
  });

  it('should validate password strength', async () => {
    const user = userEvent.setup();

    render(
      <UserFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    // Weak password
    await user.type(screen.getByLabelText(/mot de passe/i), '123');
    await user.click(screen.getByRole('button', { name: /créer/i }));

    await waitFor(() => {
      expect(screen.getByText(/mot de passe.*8 caractères|trop court/i)).toBeInTheDocument();
    });
  });

  it('should show role options', async () => {
    const user = userEvent.setup();

    render(
      <UserFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    // Click role select
    const roleSelect = screen.getByLabelText(/rôle/i);
    await user.click(roleSelect);

    // Should show all roles
    expect(screen.getByText(/ADMIN/i)).toBeInTheDocument();
    expect(screen.getByText(/GESTIONNAIRE/i)).toBeInTheDocument();
    expect(screen.getByText(/LECTURE/i)).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <UserFormDialog open={true} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'SecurePass123!');

    // Select role
    const roleSelect = screen.getByLabelText(/rôle/i);
    await user.click(roleSelect);
    await user.click(screen.getByText(/GESTIONNAIRE/i));

    await user.click(screen.getByRole('button', { name: /créer/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should populate form when editing user', () => {
    const existingUser = {
      id: '1',
      email: 'existing@example.com',
      role: 'GESTIONNAIRE',
    };

    render(
      <UserFormDialog open={true} onClose={vi.fn()} user={existingUser} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText(/email/i)).toHaveValue('existing@example.com');
    expect(screen.getByLabelText(/rôle/i)).toHaveValue('GESTIONNAIRE');
  });

  it('should not require password when editing', () => {
    const existingUser = {
      id: '1',
      email: 'existing@example.com',
      role: 'ADMIN',
    };

    render(
      <UserFormDialog open={true} onClose={vi.fn()} user={existingUser} />,
      { wrapper: createWrapper() }
    );

    // Password field should not be required when editing
    const passwordField = screen.queryByLabelText(/nouveau mot de passe/i);
    expect(passwordField).toBeInTheDocument();
  });

  it('should show password change option when editing', () => {
    const existingUser = {
      id: '1',
      email: 'existing@example.com',
      role: 'ADMIN',
    };

    render(
      <UserFormDialog open={true} onClose={vi.fn()} user={existingUser} />,
      { wrapper: createWrapper() }
    );

    // Should have option to change password
    expect(screen.getByText(/changer.*mot de passe/i)).toBeInTheDocument();
  });

  it('should disable email editing when updating', () => {
    const existingUser = {
      id: '1',
      email: 'existing@example.com',
      role: 'ADMIN',
    };

    render(
      <UserFormDialog open={true} onClose={vi.fn()} user={existingUser} />,
      { wrapper: createWrapper() }
    );

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeDisabled();
  });

  it('should allow changing user role', async () => {
    const user = userEvent.setup();

    const existingUser = {
      id: '1',
      email: 'existing@example.com',
      role: 'GESTIONNAIRE',
    };

    render(
      <UserFormDialog open={true} onClose={vi.fn()} user={existingUser} />,
      { wrapper: createWrapper() }
    );

    // Change role to LECTURE
    const roleSelect = screen.getByLabelText(/rôle/i);
    await user.click(roleSelect);
    await user.click(screen.getByText(/LECTURE/i));

    expect(roleSelect).toHaveValue('LECTURE');
  });
});
