import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StockItemFormDialog } from '@/components/stock/StockItemFormDialog';

/**
 * Tests for StockItemFormDialog component
 * Tests stock item creation, quantity adjustments
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

describe('StockItemFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form when open', () => {
    render(
      <StockItemFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText(/modèle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantité/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    render(
      <StockItemFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    // Submit without filling
    await user.click(screen.getByRole('button', { name: /créer/i }));

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/modèle.*requis/i)).toBeInTheDocument();
      expect(screen.getByText(/quantité.*requise/i)).toBeInTheDocument();
    });
  });

  it('should validate quantity is positive', async () => {
    const user = userEvent.setup();

    render(
      <StockItemFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    // Enter negative quantity
    await user.type(screen.getByLabelText(/quantité/i), '-5');

    await user.click(screen.getByRole('button', { name: /créer/i }));

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/quantité.*positive|supérieure.*0/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <StockItemFormDialog open={true} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    // Fill form
    await user.type(screen.getByLabelText(/quantité/i), '50');

    await user.click(screen.getByRole('button', { name: /créer/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should populate form when editing', () => {
    const stockItem = {
      id: '1',
      assetModelId: 'model-1',
      quantity: 100,
      loaned: 20,
      notes: 'Test notes',
    };

    render(
      <StockItemFormDialog open={true} onClose={vi.fn()} stockItem={stockItem} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText(/quantité/i)).toHaveValue(100);
    expect(screen.getByLabelText(/notes/i)).toHaveValue('Test notes');
  });

  it('should show loaned quantity when editing', () => {
    const stockItem = {
      id: '1',
      assetModelId: 'model-1',
      quantity: 100,
      loaned: 20,
    };

    render(
      <StockItemFormDialog open={true} onClose={vi.fn()} stockItem={stockItem} />,
      { wrapper: createWrapper() }
    );

    // Should display loaned quantity info
    expect(screen.getByText(/prêté.*20/i)).toBeInTheDocument();
  });

  it('should warn when reducing quantity below loaned amount', async () => {
    const user = userEvent.setup();

    const stockItem = {
      id: '1',
      assetModelId: 'model-1',
      quantity: 100,
      loaned: 20,
    };

    render(
      <StockItemFormDialog open={true} onClose={vi.fn()} stockItem={stockItem} />,
      { wrapper: createWrapper() }
    );

    // Try to set quantity to 15 (below loaned 20)
    const quantityInput = screen.getByLabelText(/quantité/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '15');

    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    // Should show warning
    await waitFor(() => {
      expect(screen.getByText(/quantité.*inférieure.*prêté/i)).toBeInTheDocument();
    });
  });

  it('should allow adding notes', async () => {
    const user = userEvent.setup();

    render(
      <StockItemFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    const notesInput = screen.getByLabelText(/notes/i);
    await user.type(notesInput, 'Important notes about this stock item');

    expect(notesInput).toHaveValue('Important notes about this stock item');
  });
});
