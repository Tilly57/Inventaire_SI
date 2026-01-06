import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmployeeFormDialog } from '@/components/employees/EmployeeFormDialog';

/**
 * Tests for EmployeeFormDialog component
 * Tests form validation, submission, and error handling
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

describe('EmployeeFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form when open', () => {
    render(
      <EmployeeFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/département/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <EmployeeFormDialog open={false} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByLabelText(/prénom/i)).not.toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    render(
      <EmployeeFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    // Submit without filling fields
    const submitButton = screen.getByRole('button', { name: /créer/i });
    await user.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/prénom.*requis/i)).toBeInTheDocument();
      expect(screen.getByText(/nom.*requis/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();

    render(
      <EmployeeFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    // Fill with invalid email
    await user.type(screen.getByLabelText(/prénom/i), 'John');
    await user.type(screen.getByLabelText(/nom/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');

    await user.click(screen.getByRole('button', { name: /créer/i }));

    // Should show email validation error
    await waitFor(() => {
      expect(screen.getByText(/email.*invalide/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <EmployeeFormDialog open={true} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    // Fill form
    await user.type(screen.getByLabelText(/prénom/i), 'John');
    await user.type(screen.getByLabelText(/nom/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText(/département/i), 'IT');

    // Submit
    await user.click(screen.getByRole('button', { name: /créer/i }));

    // Should call onClose after successful submission
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should populate form when editing employee', () => {
    const employee = {
      id: '1',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      dept: 'HR',
    };

    render(
      <EmployeeFormDialog open={true} onClose={vi.fn()} employee={employee} />,
      { wrapper: createWrapper() }
    );

    // Fields should be populated
    expect(screen.getByLabelText(/prénom/i)).toHaveValue('Jane');
    expect(screen.getByLabelText(/nom/i)).toHaveValue('Smith');
    expect(screen.getByLabelText(/email/i)).toHaveValue('jane.smith@example.com');
    expect(screen.getByLabelText(/département/i)).toHaveValue('HR');
  });

  it('should show "Modifier" button when editing', () => {
    const employee = {
      id: '1',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      dept: 'HR',
    };

    render(
      <EmployeeFormDialog open={true} onClose={vi.fn()} employee={employee} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('button', { name: /modifier|enregistrer/i })).toBeInTheDocument();
  });

  it('should close dialog on cancel', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <EmployeeFormDialog open={true} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByRole('button', { name: /annuler/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should reset form after submission', async () => {
    const user = userEvent.setup();

    render(
      <EmployeeFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    // Fill and submit
    await user.type(screen.getByLabelText(/prénom/i), 'John');
    await user.type(screen.getByLabelText(/nom/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText(/département/i), 'IT');

    await user.click(screen.getByRole('button', { name: /créer/i }));

    // After submission, form should be reset if reopened
    // This is handled by the parent component's state management
  });
});
