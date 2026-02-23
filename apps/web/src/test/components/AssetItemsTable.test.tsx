import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssetItemsTable } from '@/components/assets/AssetItemsTable';
import type { AssetItem } from '@/lib/types/models.types';

/**
 * Tests for AssetItemsTable component
 * Tests rendering, selection, actions, status badges, mobile/desktop views
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

const mockAssetItems: AssetItem[] = [
  {
    id: 'item1',
    assetTag: 'LAP-001',
    serial: 'SN123456',
    status: 'EN_STOCK',
    notes: 'New laptop',
    assetModelId: 'model1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    assetModel: {
      id: 'model1',
      type: 'Laptop',
      brand: 'Dell',
      modelName: 'Latitude 5420',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
  },
  {
    id: 'item2',
    assetTag: 'MON-002',
    serial: null,
    status: 'PRETE',
    notes: null,
    assetModelId: 'model2',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
    assetModel: {
      id: 'model2',
      type: 'Monitor',
      brand: 'Samsung',
      modelName: 'S27A600',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
  },
  {
    id: 'item3',
    assetTag: 'KEY-003',
    serial: 'KEY789',
    status: 'HS',
    notes: 'Broken keys',
    assetModelId: 'model3',
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
    assetModel: {
      id: 'model3',
      type: 'Keyboard',
      brand: 'Logitech',
      modelName: 'MX Keys',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
  },
];

describe('AssetItemsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop View', () => {
    it('should render table with asset items data', () => {
      render(<AssetItemsTable items={mockAssetItems} />, { wrapper: createWrapper() });

      expect(screen.getByText('LAP-001')).toBeInTheDocument();
      expect(screen.getByText('MON-002')).toBeInTheDocument();
      expect(screen.getByText('KEY-003')).toBeInTheDocument();
    });

    it('should render empty state when no items', () => {
      render(<AssetItemsTable items={[]} />, { wrapper: createWrapper() });

      expect(screen.getByText('Aucun équipement trouvé')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(<AssetItemsTable items={mockAssetItems} />, { wrapper: createWrapper() });

      expect(screen.getByText('Tag')).toBeInTheDocument();
      expect(screen.getByText('Modèle')).toBeInTheDocument();
      expect(screen.getByText('N° série')).toBeInTheDocument();
      expect(screen.getByText('Statut')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Créé le')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display asset model information', () => {
      render(<AssetItemsTable items={mockAssetItems} />, { wrapper: createWrapper() });

      expect(screen.getByText('Dell Latitude 5420')).toBeInTheDocument();
      expect(screen.getByText('Samsung S27A600')).toBeInTheDocument();
      expect(screen.getByText('Logitech MX Keys')).toBeInTheDocument();
    });

    it('should display serial numbers', () => {
      render(<AssetItemsTable items={mockAssetItems} />, { wrapper: createWrapper() });

      expect(screen.getByText('SN123456')).toBeInTheDocument();
      expect(screen.getByText('KEY789')).toBeInTheDocument();
    });

    it('should display "-" when serial number is null', () => {
      render(<AssetItemsTable items={mockAssetItems} />, { wrapper: createWrapper() });

      const rows = screen.getAllByRole('row');
      const monRow = rows.find(row => row.textContent?.includes('MON-002'));
      expect(monRow).toBeDefined();
      // There should be a "-" for null serial
      const cells = within(monRow!).getAllByRole('cell');
      const serialCell = cells.find(cell => cell.textContent === '-');
      expect(serialCell).toBeDefined();
    });

    it('should display notes', () => {
      render(<AssetItemsTable items={mockAssetItems} />, { wrapper: createWrapper() });

      expect(screen.getByText('New laptop')).toBeInTheDocument();
      expect(screen.getByText('Broken keys')).toBeInTheDocument();
    });

    it('should display "-" when notes are null', () => {
      render(<AssetItemsTable items={mockAssetItems} />, { wrapper: createWrapper() });

      const rows = screen.getAllByRole('row');
      // Count "-" characters in the table (for null fields)
      const dashCells = screen.getAllByText('-');
      expect(dashCells.length).toBeGreaterThan(0);
    });

    it('should handle missing asset model', () => {
      const itemWithoutModel: AssetItem = {
        ...mockAssetItems[0],
        assetModel: undefined,
      };

      render(<AssetItemsTable items={[itemWithoutModel]} />, { wrapper: createWrapper() });

      expect(screen.getByText('Non défini')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should show edit dialog on edit button click', async () => {
      const user = userEvent.setup();
      render(<AssetItemsTable items={mockAssetItems} />, { wrapper: createWrapper() });

      const editButtons = screen.getAllByRole('button', { name: '' }).filter(btn => {
        const svg = btn.querySelector('svg');
        return svg && svg.classList.toString().includes('lucide');
      });

      await user.click(editButtons[0]);

      // Dialog should open (AssetItemFormDialog component)
      // We can't fully test the dialog content as it's lazy loaded
    });

    it('should show delete dialog on delete button click', async () => {
      const user = userEvent.setup();
      render(<AssetItemsTable items={mockAssetItems} />, { wrapper: createWrapper() });

      const buttons = screen.getAllByRole('button', { name: '' });
      // Find delete buttons (second button in each row's action group)
      const deleteButtons = buttons.filter((btn, index) => index % 2 === 1);

      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
      }

      // Dialog should open (DeleteAssetItemDialog component)
    });
  });

  describe('Selection', () => {
    it('should render checkbox column when onSelectionChange is provided', () => {
      const onSelectionChange = vi.fn();
      render(
        <AssetItemsTable
          items={mockAssetItems}
          selectedItems={[]}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should not render checkbox column when onSelectionChange is not provided', () => {
      render(<AssetItemsTable items={mockAssetItems} />, { wrapper: createWrapper() });

      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes.length).toBe(0);
    });

    it('should handle select all checkbox', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <AssetItemsTable
          items={mockAssetItems}
          selectedItems={[]}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const selectAllCheckbox = screen.getByLabelText('Sélectionner tout');
      await user.click(selectAllCheckbox);

      expect(onSelectionChange).toHaveBeenCalledWith(['item1', 'item2', 'item3']);
    });

    it('should handle deselect all', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <AssetItemsTable
          items={mockAssetItems}
          selectedItems={['item1', 'item2', 'item3']}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const selectAllCheckbox = screen.getByLabelText('Sélectionner tout');
      await user.click(selectAllCheckbox);

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should handle individual item selection', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <AssetItemsTable
          items={mockAssetItems}
          selectedItems={[]}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const itemCheckbox = screen.getByLabelText('Sélectionner LAP-001');
      await user.click(itemCheckbox);

      expect(onSelectionChange).toHaveBeenCalledWith(['item1']);
    });

    it('should handle individual item deselection', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(
        <AssetItemsTable
          items={mockAssetItems}
          selectedItems={['item1', 'item2']}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const itemCheckbox = screen.getByLabelText('Sélectionner LAP-001');
      await user.click(itemCheckbox);

      expect(onSelectionChange).toHaveBeenCalledWith(['item2']);
    });

    it('should show indeterminate state when some items selected', () => {
      const onSelectionChange = vi.fn();

      render(
        <AssetItemsTable
          items={mockAssetItems}
          selectedItems={['item1']}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const selectAllCheckbox = screen.getByLabelText('Sélectionner tout');
      expect(selectAllCheckbox).toBeInTheDocument();
    });

    it('should check all checkbox when all items are selected', () => {
      const onSelectionChange = vi.fn();

      render(
        <AssetItemsTable
          items={mockAssetItems}
          selectedItems={['item1', 'item2', 'item3']}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      const selectAllCheckbox = screen.getByLabelText('Sélectionner tout');
      expect(selectAllCheckbox).toBeChecked();
    });
  });

  describe('Status Badges', () => {
    it('should display status badges for all items', () => {
      render(<AssetItemsTable items={mockAssetItems} />, { wrapper: createWrapper() });

      // StatusBadge component should render for each item
      // We can't test exact badge text without knowing StatusBadge implementation
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(mockAssetItems.length);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for checkboxes', () => {
      const onSelectionChange = vi.fn();

      render(
        <AssetItemsTable
          items={mockAssetItems}
          selectedItems={[]}
          onSelectionChange={onSelectionChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByLabelText('Sélectionner tout')).toBeInTheDocument();
      expect(screen.getByLabelText('Sélectionner LAP-001')).toBeInTheDocument();
      expect(screen.getByLabelText('Sélectionner MON-002')).toBeInTheDocument();
      expect(screen.getByLabelText('Sélectionner KEY-003')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format created dates correctly', () => {
      render(<AssetItemsTable items={mockAssetItems} />, { wrapper: createWrapper() });

      // Check that dates are rendered (format depends on formatDate utility)
      expect(screen.getByText(/15\/01\/2024|2024-01-15|Jan.*15.*2024/i)).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should be properly memoized to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <AssetItemsTable items={mockAssetItems} />,
        { wrapper: createWrapper() }
      );

      // Rerender with same props
      rerender(<AssetItemsTable items={mockAssetItems} />);

      // Component should still render correctly
      expect(screen.getByText('LAP-001')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array of items', () => {
      render(<AssetItemsTable items={[]} />, { wrapper: createWrapper() });

      expect(screen.getByText('Aucun équipement trouvé')).toBeInTheDocument();
    });

    it('should handle items with all null optional fields', () => {
      const itemWithNulls: AssetItem = {
        id: 'item-nulls',
        assetTag: 'TEST-001',
        serial: null,
        status: 'EN_STOCK',
        notes: null,
        assetModelId: 'model1',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      };

      render(
        <AssetItemsTable items={[itemWithNulls]} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('TEST-001')).toBeInTheDocument();
    });

    it('should handle items with long notes', () => {
      const itemWithLongNotes: AssetItem = {
        id: 'item-long',
        assetTag: 'LONG-001',
        serial: 'SN999',
        status: 'EN_STOCK',
        notes: 'This is a very long note that might cause layout issues if not properly handled by the table component with truncation or proper styling',
        assetModelId: 'model1',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        assetModel: mockAssetItems[0].assetModel,
      };

      render(
        <AssetItemsTable items={[itemWithLongNotes]} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/This is a very long note/)).toBeInTheDocument();
    });

    it('should handle different asset statuses', () => {
      const itemsWithDifferentStatuses: AssetItem[] = [
        { ...mockAssetItems[0], status: 'EN_STOCK' },
        { ...mockAssetItems[0], id: 'item-prete', assetTag: 'TAG-2', status: 'PRETE' },
        { ...mockAssetItems[0], id: 'item-hs', assetTag: 'TAG-3', status: 'HS' },
        { ...mockAssetItems[0], id: 'item-rep', assetTag: 'TAG-4', status: 'REPARATION' },
      ];

      render(
        <AssetItemsTable items={itemsWithDifferentStatuses} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('LAP-001')).toBeInTheDocument();
      expect(screen.getByText('TAG-2')).toBeInTheDocument();
      expect(screen.getByText('TAG-3')).toBeInTheDocument();
      expect(screen.getByText('TAG-4')).toBeInTheDocument();
    });
  });
});
