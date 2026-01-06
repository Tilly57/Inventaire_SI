import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssetItemFormDialog } from '@/components/assets/AssetItemFormDialog';

/**
 * Tests for AssetItemFormDialog component
 * Tests asset creation, validation, and bulk creation
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

describe('AssetItemFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form when open', () => {
    render(
      <AssetItemFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText(/modèle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/numéro de série/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    render(
      <AssetItemFormDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    // Submit without filling
    await user.click(screen.getByRole('button', { name: /créer/i }));

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/modèle.*requis/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <AssetItemFormDialog open={true} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    // Select asset model (mock selection)
    const modelSelect = screen.getByLabelText(/modèle/i);
    await user.click(modelSelect);
    // Note: actual selection depends on the select component implementation

    // Fill serial number
    await user.type(screen.getByLabelText(/numéro de série/i), 'SN123456');

    // Submit
    await user.click(screen.getByRole('button', { name: /créer/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should show bulk creation mode', async () => {
    const user = userEvent.setup();

    render(
      <AssetItemFormDialog open={true} onClose={vi.fn()} mode="bulk" />,
      { wrapper: createWrapper() }
    );

    // Should show quantity field
    expect(screen.getByLabelText(/quantité/i)).toBeInTheDocument();

    // Should show preview button
    expect(screen.getByRole('button', { name: /prévisualiser/i })).toBeInTheDocument();
  });

  it('should validate quantity in bulk mode', async () => {
    const user = userEvent.setup();

    render(
      <AssetItemFormDialog open={true} onClose={vi.fn()} mode="bulk" />,
      { wrapper: createWrapper() }
    );

    // Enter invalid quantity (0 or negative)
    await user.type(screen.getByLabelText(/quantité/i), '0');

    await user.click(screen.getByRole('button', { name: /prévisualiser/i }));

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/quantité.*supérieure|minimum.*1/i)).toBeInTheDocument();
    });
  });

  it('should show preview for bulk creation', async () => {
    const user = userEvent.setup();

    render(
      <AssetItemFormDialog open={true} onClose={vi.fn()} mode="bulk" />,
      { wrapper: createWrapper() }
    );

    // Select model and enter quantity
    await user.type(screen.getByLabelText(/quantité/i), '3');

    await user.click(screen.getByRole('button', { name: /prévisualiser/i }));

    // Should show preview items
    await waitFor(() => {
      expect(screen.getByText(/prévisualisation/i)).toBeInTheDocument();
    });
  });

  it('should populate form when editing asset', () => {
    const asset = {
      id: '1',
      assetModelId: 'model-1',
      serial: 'SN123456',
      assetTag: 'TAG-001',
      status: 'EN_STOCK',
      notes: 'Test notes',
    };

    render(
      <AssetItemFormDialog open={true} onClose={vi.fn()} asset={asset} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText(/numéro de série/i)).toHaveValue('SN123456');
    expect(screen.getByLabelText(/notes/i)).toHaveValue('Test notes');
  });

  it('should allow changing status when editing', () => {
    const asset = {
      id: '1',
      assetModelId: 'model-1',
      serial: 'SN123456',
      assetTag: 'TAG-001',
      status: 'EN_STOCK',
    };

    render(
      <AssetItemFormDialog open={true} onClose={vi.fn()} asset={asset} />,
      { wrapper: createWrapper() }
    );

    // Status select should be visible
    expect(screen.getByLabelText(/statut/i)).toBeInTheDocument();
  });
});
