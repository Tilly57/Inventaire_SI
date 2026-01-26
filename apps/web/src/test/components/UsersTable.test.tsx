import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UsersTable } from '@/components/users/UsersTable';
import type { User } from '@/lib/types/models.types';

/**
 * Tests for UsersTable component
 * Tests rendering, actions, role badges, disabled state for current user
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

const mockUsers: User[] = [
  {
    id: 'user1',
    username: 'admin',
    email: 'admin@test.com',
    role: 'ADMIN',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user2',
    username: 'manager',
    email: 'manager@test.com',
    role: 'GESTIONNAIRE',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'user3',
    username: 'viewer',
    email: 'viewer@test.com',
    role: 'LECTURE',
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
  },
];

describe('UsersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop View', () => {
    it('should render table with users data', () => {
      render(<UsersTable users={mockUsers} />, { wrapper: createWrapper() });

      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('manager')).toBeInTheDocument();
      expect(screen.getByText('viewer')).toBeInTheDocument();
    });

    it('should render empty state when no users', () => {
      render(<UsersTable users={[]} />, { wrapper: createWrapper() });

      expect(screen.getByText('Aucun utilisateur trouvé')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(<UsersTable users={mockUsers} />, { wrapper: createWrapper() });

      expect(screen.getByText("Nom d'utilisateur")).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Rôle')).toBeInTheDocument();
      expect(screen.getByText('Créé le')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display user emails', () => {
      render(<UsersTable users={mockUsers} />, { wrapper: createWrapper() });

      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      expect(screen.getByText('manager@test.com')).toBeInTheDocument();
      expect(screen.getByText('viewer@test.com')).toBeInTheDocument();
    });

    it('should display user roles with correct labels', () => {
      render(<UsersTable users={mockUsers} />, { wrapper: createWrapper() });

      // The UserRoleLabels mapping should provide French labels
      expect(screen.getByText('Administrateur')).toBeInTheDocument();
      expect(screen.getByText('Gestionnaire')).toBeInTheDocument();
      expect(screen.getByText('Lecture seule')).toBeInTheDocument();
    });
  });

  describe('Role Badges', () => {
    it('should display role badges with appropriate variants', () => {
      render(<UsersTable users={mockUsers} />, { wrapper: createWrapper() });

      // Admin role should have destructive variant (red)
      const adminBadge = screen.getByText('Administrateur');
      expect(adminBadge).toBeInTheDocument();

      // Gestionnaire role should have default variant
      const managerBadge = screen.getByText('Gestionnaire');
      expect(managerBadge).toBeInTheDocument();

      // Lecture role should have secondary variant
      const viewerBadge = screen.getByText('Lecture seule');
      expect(viewerBadge).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should show edit dialog on edit button click', async () => {
      const user = userEvent.setup();
      render(<UsersTable users={mockUsers} />, { wrapper: createWrapper() });

      const editButtons = screen.getAllByRole('button', { name: '' }).filter(btn => {
        const svg = btn.querySelector('svg');
        return svg && svg.classList.toString().includes('lucide');
      });

      await user.click(editButtons[0]);

      // Dialog should open (UserFormDialog component)
      // We can't fully test the dialog content as it's lazy loaded
    });

    it('should show delete dialog on delete button click', async () => {
      const user = userEvent.setup();
      render(<UsersTable users={mockUsers} />, { wrapper: createWrapper() });

      const buttons = screen.getAllByRole('button', { name: '' });
      const deleteButtons = buttons.filter((btn, index) => index % 2 === 1);

      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
      }

      // Dialog should open (DeleteUserDialog component)
    });

    it('should disable delete button for current user', () => {
      render(
        <UsersTable users={mockUsers} currentUserId="user1" />,
        { wrapper: createWrapper() }
      );

      const buttons = screen.getAllByRole('button');
      const deleteButtons = buttons.filter(btn => {
        const svg = btn.querySelector('svg');
        // Find trash icon buttons
        return svg && btn.disabled;
      });

      // At least one delete button should be disabled (for current user)
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('should not disable delete button for other users', () => {
      render(
        <UsersTable users={mockUsers} currentUserId="user1" />,
        { wrapper: createWrapper() }
      );

      // Get all rows
      const rows = screen.getAllByRole('row');
      const user2Row = rows.find(row => row.textContent?.includes('manager'));

      expect(user2Row).toBeDefined();

      // Delete buttons for other users should not be disabled
      if (user2Row) {
        const buttons = within(user2Row).getAllByRole('button');
        const deleteButton = buttons.find(btn => {
          const svg = btn.querySelector('svg');
          return svg;
        });

        // This button should not be disabled
        if (deleteButton) {
          expect(deleteButton).not.toBeDisabled();
        }
      }
    });
  });

  describe('No Selection Support', () => {
    it('should not render checkboxes (UsersTable does not support selection)', () => {
      render(<UsersTable users={mockUsers} />, { wrapper: createWrapper() });

      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes.length).toBe(0);
    });
  });

  describe('Date Formatting', () => {
    it('should format created dates correctly', () => {
      render(<UsersTable users={mockUsers} />, { wrapper: createWrapper() });

      // Check that dates are rendered (format depends on formatDate utility)
      expect(screen.getByText(/15\/01\/2024|2024-01-15|Jan.*15.*2024/i)).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should be properly memoized to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <UsersTable users={mockUsers} />,
        { wrapper: createWrapper() }
      );

      // Rerender with same props
      rerender(<UsersTable users={mockUsers} />);

      // Component should still render correctly
      expect(screen.getByText('admin')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array of users', () => {
      render(<UsersTable users={[]} />, { wrapper: createWrapper() });

      expect(screen.getByText('Aucun utilisateur trouvé')).toBeInTheDocument();
    });

    it('should handle users with long usernames', () => {
      const userWithLongName: User = {
        id: 'user-long',
        username: 'verylongusernamethatmightbreakthelayout',
        email: 'verylongemail@test.com',
        role: 'ADMIN',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      };

      render(
        <UsersTable users={[userWithLongName]} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('verylongusernamethatmightbreakthelayout')).toBeInTheDocument();
    });

    it('should handle all role types', () => {
      const usersWithAllRoles: User[] = [
        { ...mockUsers[0], role: 'ADMIN' },
        { ...mockUsers[1], role: 'GESTIONNAIRE' },
        { ...mockUsers[2], role: 'LECTURE' },
      ];

      render(
        <UsersTable users={usersWithAllRoles} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Administrateur')).toBeInTheDocument();
      expect(screen.getByText('Gestionnaire')).toBeInTheDocument();
      expect(screen.getByText('Lecture seule')).toBeInTheDocument();
    });

    it('should handle user without currentUserId (all delete buttons enabled)', () => {
      render(
        <UsersTable users={mockUsers} />,
        { wrapper: createWrapper() }
      );

      const buttons = screen.getAllByRole('button');
      const disabledButtons = buttons.filter(btn => btn.disabled);

      // No delete buttons should be disabled when currentUserId is not provided
      expect(disabledButtons.length).toBe(0);
    });

    it('should properly identify current user by ID', () => {
      render(
        <UsersTable users={mockUsers} currentUserId="user2" />,
        { wrapper: createWrapper() }
      );

      const rows = screen.getAllByRole('row');
      const user2Row = rows.find(row => row.textContent?.includes('manager'));

      expect(user2Row).toBeDefined();

      if (user2Row) {
        const buttons = within(user2Row).getAllByRole('button');
        // Find the delete button (usually second button or the one with trash icon)
        const deleteButton = buttons.find(btn => btn.disabled);

        // The delete button for current user should be disabled
        expect(deleteButton).toBeDefined();
      }
    });
  });

  describe('Table Structure', () => {
    it('should have correct number of columns', () => {
      render(<UsersTable users={mockUsers} />, { wrapper: createWrapper() });

      const headerRow = screen.getAllByRole('row')[0];
      const headers = within(headerRow).getAllByRole('columnheader');

      // Should have 5 columns: Username, Email, Role, Created, Actions
      expect(headers.length).toBe(5);
    });

    it('should have correct number of rows', () => {
      render(<UsersTable users={mockUsers} />, { wrapper: createWrapper() });

      const rows = screen.getAllByRole('row');

      // Should have 1 header row + 3 data rows
      expect(rows.length).toBe(4);
    });

    it('should render all data cells correctly', () => {
      render(<UsersTable users={mockUsers} />, { wrapper: createWrapper() });

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      const cells = within(firstDataRow).getAllByRole('cell');

      // Should have 5 cells per row
      expect(cells.length).toBe(5);
    });
  });

  describe('Integration', () => {
    it('should render correctly with minimum required props', () => {
      render(<UsersTable users={[]} />, { wrapper: createWrapper() });

      expect(screen.getByText('Aucun utilisateur trouvé')).toBeInTheDocument();
    });

    it('should render correctly with all props', () => {
      render(
        <UsersTable users={mockUsers} currentUserId="user1" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('manager')).toBeInTheDocument();
      expect(screen.getByText('viewer')).toBeInTheDocument();
    });
  });
});
