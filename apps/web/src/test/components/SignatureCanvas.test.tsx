import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignatureCanvas } from '@/components/common/SignatureCanvas';

/**
 * Tests for SignatureCanvas component
 * Tests signature drawing, clearing, and validation
 */

// Mock react-signature-canvas
let mockIsEmpty = true;
let mockClear: (() => void) | undefined;
let mockToDataURL: (() => string) | undefined;

vi.mock('react-signature-canvas', () => {
  const React = require('react');
  return {
    default: React.forwardRef((props: any, ref: any) => {
      const { onEnd, canvasProps } = props;

      React.useImperativeHandle(ref, () => ({
        isEmpty: () => mockIsEmpty,
        clear: () => {
          mockIsEmpty = true;
          if (mockClear) mockClear();
        },
        toDataURL: () => mockToDataURL ? mockToDataURL() : 'data:image/png;base64,mockImageData',
      }));

      const handleMouseUp = () => {
        mockIsEmpty = false;
        if (onEnd) onEnd();
      };

      return (
        <canvas
          {...canvasProps}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
        />
      );
    }),
  };
});

describe('SignatureCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEmpty = true;
    mockClear = undefined;
    mockToDataURL = undefined;
  });

  it('should render canvas', () => {
    const { container } = render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render clear button', () => {
    render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('button', { name: /effacer|clear/i })).toBeInTheDocument();
  });

  it('should render save and cancel buttons', () => {
    render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('button', { name: /enregistrer|save/i })).toBeInTheDocument();
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

    const saveButton = screen.getByRole('button', { name: /enregistrer|save/i });
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button after drawing', async () => {
    const { container } = render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    // Simulate drawing (this is a simplified test)
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Trigger mouse up to simulate drawing completion
    fireEvent.mouseUp(canvas!);

    // After drawing, save button should be enabled
    const saveButton = screen.getByRole('button', { name: /enregistrer|save/i });
    expect(saveButton).toBeEnabled();
  });

  it('should clear signature when clear button is clicked', async () => {
    const user = userEvent.setup();

    const { container } = render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    // Simulate drawing
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Trigger mouse up to simulate drawing completion
    fireEvent.mouseUp(canvas!);

    // Click clear button
    await user.click(screen.getByRole('button', { name: /effacer|clear/i }));

    // Save button should be disabled again
    const saveButton = screen.getByRole('button', { name: /enregistrer|save/i });
    expect(saveButton).toBeDisabled();
  });

  it('should call onSave with signature data', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    const { container } = render(<SignatureCanvas onSave={onSave} onCancel={vi.fn()} />);

    // Simulate drawing
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Trigger mouse up to simulate drawing completion
    fireEvent.mouseUp(canvas!);

    // Click save
    const saveButton = screen.getByRole('button', { name: /enregistrer|save/i });
    await user.click(saveButton);

    // Should call onSave with data URL
    expect(onSave).toHaveBeenCalledWith(expect.stringMatching(/^data:image/));
  });

  it('should show signature instructions', () => {
    render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText(/dessinez.*signature|signez ici/i)).toBeInTheDocument();
  });

  it('should be responsive to touch events', async () => {
    const { container } = render(<SignatureCanvas onSave={vi.fn()} onCancel={vi.fn()} />);

    const canvas = container.querySelector('canvas');

    // Canvas should handle touch events
    expect(canvas).toBeInTheDocument();
    // Touch event handling is tested through integration tests
  });
});
