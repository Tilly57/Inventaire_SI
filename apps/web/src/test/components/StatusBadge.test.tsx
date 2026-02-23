import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/assets/StatusBadge';

describe('StatusBadge', () => {
  it('should render EN_STOCK status', () => {
    render(<StatusBadge status="EN_STOCK" />);

    const badge = screen.getByText('En stock');
    expect(badge).toBeInTheDocument();
  });

  it('should render PRETE status', () => {
    render(<StatusBadge status="PRETE" />);

    const badge = screen.getByText('Prêté');
    expect(badge).toBeInTheDocument();
  });

  it('should render HS status', () => {
    render(<StatusBadge status="HS" />);

    const badge = screen.getByText('Hors service');
    expect(badge).toBeInTheDocument();
  });

  it('should render REPARATION status', () => {
    render(<StatusBadge status="REPARATION" />);

    const badge = screen.getByText('En réparation');
    expect(badge).toBeInTheDocument();
  });

  it('should handle unknown status gracefully', () => {
    render(<StatusBadge status={"UNKNOWN" as any} />);

    // Should still render without crashing
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
  });

  it('should apply correct CSS classes for EN_STOCK', () => {
    const { container } = render(<StatusBadge status="EN_STOCK" />);

    const badge = container.querySelector('.bg-primary');
    expect(badge).toBeInTheDocument();
  });

  it('should apply correct CSS classes for HS', () => {
    const { container } = render(<StatusBadge status="HS" />);

    const badge = container.querySelector('.bg-destructive');
    expect(badge).toBeInTheDocument();
  });
});
