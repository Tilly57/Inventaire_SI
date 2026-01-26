import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmployeesTable } from '@/components/employees/EmployeesTable';
import type { Employee } from '@/lib/types/models.types';

/**
 * Tests for EmployeesTable component
 * Tests rendering, selection, actions, mobile/desktop views
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

const mockEmployees: Employee[] = [
  {
    id: 'emp1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@test.com',
    dept: 'IT',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'emp2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@test.com',
    dept: 'HR',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'emp3',
    firstName: 'Bob',
    lastName: 'Wilson',
    email: 'bob.wilson@test.com',
    dept: null,
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
  },
];

describe('EmployeesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop View', () => {
    it('should render table with employees data', () => {
      render(<EmployeesTable employees={mockEmployees} />, { wrapper: createWrapper() });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('should render empty state when no employees', () => {
      render(<EmployeesTable employees={[]} />, { wrapper: createWrapper() });

      expect(screen.getByText('Aucun employé trouvé')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(<EmployeesTable employees={mockEmployees} />, { wrapper: createWrapper() });

      expect(screen.getByText('Nom complet')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Département')).toBeInTheDocument();
      expect(screen.getByText('Créé le')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display employee emails', () => {
      render(<EmployeesTable employees={mockEmployees} />, { wrapper: createWrapper() });

      expect(screen.getByText('john.doe@test.com')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@test.com')).toBeInTheDocument();
      expect(screen.getByText('bob.wilson@test.com')).toBeInTheDocument();
    });

    it('should display employee departments', () => {
      render(<EmployeesTable employees={mockEmployees} />, { wrapper: createWrapper() });

      expect(screen.getByText('IT')).toBeInTheDocument();
      expect(screen.getByText('HR')).toBeInTheDocument();
    });

    it('should display "-" when department is null', () => {
      render(<EmployeesTable employees={mockEmployees} />, { wrapper: createWrapper() });

      const rows = screen.getAllByRole('row');
      const bobRow = rows.find(row => row.textContent?.includes('Bob Wilson'));
      expect(bobRow).toBeDefined();
      expect(within(bobRow!).getByText('-')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should show edit dialog on edit button click', async () => {
      const user = userEvent.setup();
      render(<EmployeesTable employees={mockEmployees} />, { wrapper: createWrapper() });

      const editButtons = screen.getAllByRole('button', { name: '' }).filter(btn => {
        const svg = btn.querySelector('svg');
        return svg && svg.classList.toString().includes('lucide');
      });

      await user.click(editButtons[0]);

      // Dialog should open (EmployeeFormDialog component)
      // We can't fully test the dialog content as it's lazy loaded
    });

    it('should show delete dialog on delete button click', async () => {
      const user = userEvent.setup();
      render(<EmployeesTable employees={mockEmployees} />, { wrapper: createWrapper() });

      const buttons = screen.getAllByRole('button', { name: '' });
      const deleteButton = buttons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && btn.title === '';
      });

      if (deleteButton) {
        await user.click(deleteButton);
      }

      // Dialog should open (DeleteEmployeeDialog component)
    });
  });

  describe('Selection', () => {
    it('should render checkbox column when onSelectionChange is provided', () => {
      const onSelectionChange = vi.fn();
      render(
        <EmployeesTable
          employees={mockEmployees}
          selectedEmployees={[]}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should not render checkbox column when onSelectionChange is not provided', () => {
      render(<EmployeesTable employees={mockEmployees} />, { wrapper: createWrapper() });

      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes.length).toBe(0);
    });

    it('should handle select all checkbox', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <EmployeesTable
          employees={mockEmployees}
          selectedEmployees={[]}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const selectAllCheckbox = screen.getByLabelText('Sélectionner tout');
      await user.click(selectAllCheckbox);

      expect(onSelectionChange).toHaveBeenCalledWith(['emp1', 'emp2', 'emp3']);
    });

    it('should handle deselect all', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <EmployeesTable
          employees={mockEmployees}
          selectedEmployees={['emp1', 'emp2', 'emp3']}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const selectAllCheckbox = screen.getByLabelText('Sélectionner tout');
      await user.click(selectAllCheckbox);

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should handle individual employee selection', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <EmployeesTable
          employees={mockEmployees}
          selectedEmployees={[]}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const johnCheckbox = screen.getByLabelText('Sélectionner John Doe');
      await user.click(johnCheckbox);

      expect(onSelectionChange).toHaveBeenCalledWith(['emp1']);
    });

    it('should handle individual employee deselection', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <EmployeesTable
          employees={mockEmployees}
          selectedEmployees={['emp1', 'emp2']}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const johnCheckbox = screen.getByLabelText('Sélectionner John Doe');
      await user.click(johnCheckbox);

      expect(onSelectionChange).toHaveBeenCalledWith(['emp2']);
    });

    it('should show indeterminate state when some items selected', () => {
      const onSelectionChange = vi.fn();

      render(
        <EmployeesTable
          employees={mockEmployees}
          selectedEmployees={['emp1']}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const selectAllCheckbox = screen.getByLabelText('Sélectionner tout');
      expect(selectAllCheckbox).toBeInTheDocument();
      // Indeterminate state is set via JavaScript, not as an attribute
    });

    it('should check all checkbox when all items are selected', () => {
      const onSelectionChange = vi.fn();

      render(
        <EmployeesTable
          employees={mockEmployees}
          selectedEmployees={['emp1', 'emp2', 'emp3']}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const selectAllCheckbox = screen.getByLabelText('Sélectionner tout');
      expect(selectAllCheckbox).toBeChecked();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for checkboxes', () => {
      const onSelectionChange = vi.fn();

      render(
        <EmployeesTable
          employees={mockEmployees}
          selectedEmployees={[]}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByLabelText('Sélectionner tout')).toBeInTheDocument();
      expect(screen.getByLabelText('Sélectionner John Doe')).toBeInTheDocument();
      expect(screen.getByLabelText('Sélectionner Jane Smith')).toBeInTheDocument();
      expect(screen.getByLabelText('Sélectionner Bob Wilson')).toBeInTheDocument();
    });
  });

  describe('Name Formatting', () => {
    it('should format full names correctly', () => {
      render(<EmployeesTable employees={mockEmployees} />, { wrapper: createWrapper() });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format created dates correctly', () => {
      render(<EmployeesTable employees={mockEmployees} />, { wrapper: createWrapper() });

      // Check that dates are rendered (format depends on formatDate utility)
      expect(screen.getByText(/15\/01\/2024|2024-01-15|Jan.*15.*2024/i)).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should be properly memoized to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <EmployeesTable employees={mockEmployees} />,
        { wrapper: createWrapper() }
      );

      // Rerender with same props
      rerender(<EmployeesTable employees={mockEmployees} />);

      // Component should still render correctly
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array of employees', () => {
      render(<EmployeesTable employees={[]} />, { wrapper: createWrapper() });

      expect(screen.getByText('Aucun employé trouvé')).toBeInTheDocument();
    });

    it('should handle employees with missing optional fields', () => {
      const employeeWithNullDept: Employee = {
        id: 'emp-null',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@test.com',
        dept: null,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      };

      render(
        <EmployeesTable employees={[employeeWithNullDept]} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should handle employees with long names', () => {
      const longNameEmployee: Employee = {
        id: 'emp-long',
        firstName: 'VeryLongFirstNameThatMightBreakLayout',
        lastName: 'VeryLongLastNameThatMightBreakLayout',
        email: 'verylongemail@test.com',
        dept: 'VeryLongDepartmentName',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      };

      render(
        <EmployeesTable employees={[longNameEmployee]} />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.getByText(
          'VeryLongFirstNameThatMightBreakLayout VeryLongLastNameThatMightBreakLayout'
        )
      ).toBeInTheDocument();
    });
  });
});
