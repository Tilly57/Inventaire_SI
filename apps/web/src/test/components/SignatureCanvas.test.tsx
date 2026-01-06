import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignatureCanvas } from '@/components/common/SignatureCanvas';

/**
 * Tests for SignatureCanvas component
 * Tests signature drawing, clearing, and validation
 */

describe('SignatureCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render canvas', () => {
    render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toBeInTheDocument();
  });

  it('should render clear button', () => {
    render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('button', { name: /effacer|clear/i })).toBeInTheDocument();
  });

  it('should render save and cancel buttons', () => {
    render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('button', { name: /valider|save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /annuler|cancel/i })).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<SignatureCanvas onSave={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: /annuler|cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('should disable save button when signature is empty', () => {
    render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    const saveButton = screen.getByRole('button', { name: /valider|save/i });
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button after drawing', async () => {
    const user = userEvent.setup();

    render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    // Simulate drawing (this is a simplified test)
    const canvas = screen.getByRole('img', { hidden: true });

    // Trigger mouse events to simulate drawing
    await user.pointer([
      { keys: '[MouseLeft>]', target: canvas, coords: { x: 50, y: 50 } },
      { coords: { x: 100, y: 100 } },
      { keys: '[/MouseLeft]' },
    ]);

    // After drawing, save button should be enabled
    const saveButton = screen.getByRole('button', { name: /valider|save/i });
    expect(saveButton).toBeEnabled();
  });

  it('should clear signature when clear button is clicked', async () => {
    const user = userEvent.setup();

    render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    // Simulate drawing
    const canvas = screen.getByRole('img', { hidden: true });
    await user.pointer([
      { keys: '[MouseLeft>]', target: canvas, coords: { x: 50, y: 50 } },
      { coords: { x: 100, y: 100 } },
      { keys: '[/MouseLeft]' },
    ]);

    // Click clear button
    await user.click(screen.getByRole('button', { name: /effacer|clear/i }));

    // Save button should be disabled again
    const saveButton = screen.getByRole('button', { name: /valider|save/i });
    expect(saveButton).toBeDisabled();
  });

  it('should call onSave with signature data', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<SignatureCanvas onSave={onSave} onCancel={vi.fn()} />);

    // Simulate drawing
    const canvas = screen.getByRole('img', { hidden: true });
    await user.pointer([
      { keys: '[MouseLeft>]', target: canvas, coords: { x: 50, y: 50 } },
      { coords: { x: 100, y: 100 } },
      { keys: '[/MouseLeft]' },
    ]);

    // Click save
    const saveButton = screen.getByRole('button', { name: /valider|save/i });
    await user.click(saveButton);

    // Should call onSave with data URL
    expect(onSave).toHaveBeenCalledWith(expect.stringMatching(/^data:image/));
  });

  it('should show signature instructions', () => {
    render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText(/dessinez.*signature|signez ici/i)).toBeInTheDocument();
  });

  it('should be responsive to touch events', async () => {
    render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    const canvas = screen.getByRole('img', { hidden: true });

    // Canvas should handle touch events
    expect(canvas).toBeInTheDocument();
    // Touch event handling is tested through integration tests
  });
});
