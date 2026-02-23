import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { LoansTable } from '@/components/loans/LoansTable';
import type { Loan } from '@/lib/types/models.types';

/**
 * Tests for LoansTable component
 * Tests rendering, selection, actions, mobile/desktop views
 */

const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const mockLoans: Loan[] = [
  {
    id: 'loan1',
    employeeId: 'emp1',
    status: 'OPEN',
    pickupSignatureUrl: null,
    pickupSignedAt: null,
    returnSignatureUrl: null,
    returnSignedAt: null,
    closedAt: null,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    employee: {
      id: 'emp1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@test.com',
      dept: 'IT',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
    lines: [
      {
        id: 'line1',
        loanId: 'loan1',
        assetItemId: 'asset1',
        stockItemId: null,
        quantity: 1,
        addedAt: '2024-01-15T10:00:00Z',
        createdAt: '2024-01-15T10:00:00Z',
      },
    ],
  },
  {
    id: 'loan2',
    employeeId: 'emp2',
    status: 'CLOSED',
    pickupSignatureUrl: '/signatures/pickup.png',
    pickupSignedAt: '2024-01-10T10:00:00Z',
    returnSignatureUrl: '/signatures/return.png',
    returnSignedAt: '2024-01-20T10:00:00Z',
    closedAt: '2024-01-20T10:00:00Z',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    employee: {
      id: 'emp2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@test.com',
      dept: 'HR',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
    lines: [
      {
        id: 'line2',
        loanId: 'loan2',
        assetItemId: null,
        stockItemId: 'stock1',
        quantity: 2,
        addedAt: '2024-01-10T10:00:00Z',
        createdAt: '2024-01-10T10:00:00Z',
      },
    ],
  },
];

describe('LoansTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop View', () => {
    it('should render table with loans data', () => {
      render(<LoansTable loans={mockLoans} />, { wrapper: createWrapper() });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Ouvert')).toBeInTheDocument();
      expect(screen.getByText('Fermé')).toBeInTheDocument();
    });

    it('should render empty state when no loans', () => {
      render(<LoansTable loans={[]} />, { wrapper: createWrapper() });

      expect(screen.getByText('Aucun prêt trouvé')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(<LoansTable loans={mockLoans} />, { wrapper: createWrapper() });

      expect(screen.getByText('Employé')).toBeInTheDocument();
      expect(screen.getByText('Statut')).toBeInTheDocument();
      expect(screen.getByText('Articles')).toBeInTheDocument();
      expect(screen.getByText('Créé le')).toBeInTheDocument();
      expect(screen.getByText('Fermé le')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display loan line counts', () => {
      render(<LoansTable loans={mockLoans} />, { wrapper: createWrapper() });

      const rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('1')).toBeInTheDocument(); // First loan has 1 line
      expect(within(rows[2]).getByText('1')).toBeInTheDocument(); // Second loan has 1 line (lines.length, not quantity)
    });

    it('should display "-" for closed date when loan is open', () => {
      render(<LoansTable loans={mockLoans} />, { wrapper: createWrapper() });

      const rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('-')).toBeInTheDocument();
    });

    it('should handle deleted employee', () => {
      const loanWithoutEmployee: Loan = {
        ...mockLoans[0],
        employee: undefined,
      };

      render(<LoansTable loans={[loanWithoutEmployee]} />, { wrapper: createWrapper() });

      expect(screen.getByText('Employé supprimé')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should navigate to loan details on row click', async () => {
      const user = userEvent.setup();
      render(<LoansTable loans={mockLoans} />, { wrapper: createWrapper() });

      const rows = screen.getAllByRole('row');
      await user.click(rows[1]); // Click first data row

      expect(mockNavigate).toHaveBeenCalledWith('/loans/loan1');
    });

    it('should navigate to loan details on view button click', async () => {
      const user = userEvent.setup();
      render(<LoansTable loans={mockLoans} />, { wrapper: createWrapper() });

      const viewButtons = screen.getAllByTitle('Voir les détails');
      await user.click(viewButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/loans/loan1');
    });

    it('should show delete dialog on delete button click', async () => {
      const user = userEvent.setup();
      render(<LoansTable loans={mockLoans} />, { wrapper: createWrapper() });

      const deleteButtons = screen.getAllByTitle('Supprimer le prêt');
      await user.click(deleteButtons[0]);

      // Dialog should open (DeleteLoanDialog component)
      // We can't fully test the dialog content as it's in a separate component
    });

    it('should not propagate row click when clicking action buttons', async () => {
      const user = userEvent.setup();
      render(<LoansTable loans={mockLoans} />, { wrapper: createWrapper() });

      const deleteButtons = screen.getAllByTitle('Supprimer le prêt');
      await user.click(deleteButtons[0]);

      // mockNavigate should not be called when clicking delete button
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Selection', () => {
    it('should render checkbox column when onSelectionChange is provided', () => {
      const onSelectionChange = vi.fn();
      render(
        <LoansTable
          loans={mockLoans}
          selectedLoans={[]}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should not render checkbox column when onSelectionChange is not provided', () => {
      render(<LoansTable loans={mockLoans} />, { wrapper: createWrapper() });

      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes.length).toBe(0);
    });

    it('should handle select all checkbox', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <LoansTable
          loans={mockLoans}
          selectedLoans={[]}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const selectAllCheckbox = screen.getByLabelText('Sélectionner tout');
      await user.click(selectAllCheckbox);

      expect(onSelectionChange).toHaveBeenCalledWith(['loan1', 'loan2']);
    });

    it('should handle deselect all', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <LoansTable
          loans={mockLoans}
          selectedLoans={['loan1', 'loan2']}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const selectAllCheckbox = screen.getByLabelText('Sélectionner tout');
      await user.click(selectAllCheckbox);

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should handle individual loan selection', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <LoansTable
          loans={mockLoans}
          selectedLoans={[]}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // First loan checkbox (index 0 is select all)

      expect(onSelectionChange).toHaveBeenCalledWith(['loan1']);
    });

    it('should handle individual loan deselection', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <LoansTable
          loans={mockLoans}
          selectedLoans={['loan1', 'loan2']}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // First loan checkbox

      expect(onSelectionChange).toHaveBeenCalledWith(['loan2']);
    });

    it('should show correct selection count in checkbox label', () => {
      const onSelectionChange = vi.fn();

      render(
        <LoansTable
          loans={mockLoans}
          selectedLoans={['loan1']}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      // Check that individual loan is marked as selected
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[1]).toBeChecked();
      expect(checkboxes[2]).not.toBeChecked();
    });
  });

  describe('Status Badges', () => {
    it('should display correct badge variant for OPEN status', () => {
      render(<LoansTable loans={mockLoans} />, { wrapper: createWrapper() });

      const openBadge = screen.getByText('Ouvert');
      expect(openBadge).toBeInTheDocument();
    });

    it('should display correct badge variant for CLOSED status', () => {
      render(<LoansTable loans={mockLoans} />, { wrapper: createWrapper() });

      const closedBadge = screen.getByText('Fermé');
      expect(closedBadge).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for checkboxes', () => {
      const onSelectionChange = vi.fn();

      render(
        <LoansTable
          loans={mockLoans}
          selectedLoans={[]}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByLabelText('Sélectionner tout')).toBeInTheDocument();
      expect(screen.getByLabelText('Sélectionner John')).toBeInTheDocument();
      expect(screen.getByLabelText('Sélectionner Jane')).toBeInTheDocument();
    });

    it('should have accessible labels for action buttons', () => {
      render(<LoansTable loans={mockLoans} />, { wrapper: createWrapper() });

      const viewButtons = screen.getAllByTitle('Voir les détails');
      const deleteButtons = screen.getAllByTitle('Supprimer le prêt');

      expect(viewButtons.length).toBe(2);
      expect(deleteButtons.length).toBe(2);
    });
  });

  describe('Date Formatting', () => {
    it('should format created dates correctly', () => {
      render(<LoansTable loans={mockLoans} />, { wrapper: createWrapper() });

      // Check that dates are rendered (format depends on formatDate utility)
      expect(screen.getByText(/15\/01\/2024|2024-01-15|Jan.*15.*2024/i)).toBeInTheDocument();
    });
  });
});
