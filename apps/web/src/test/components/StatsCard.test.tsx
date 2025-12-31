import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Package } from 'lucide-react';

describe('StatsCard', () => {
  it('should render title and value', () => {
    render(
      <StatsCard
        title="Total Assets"
        value={150}
        icon={Package}
      />
    );

    expect(screen.getByText('Total Assets')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should render with description', () => {
    render(
      <StatsCard
        title="Active Loans"
        value={25}
        icon={Package}
        description="Currently active"
      />
    );

    expect(screen.getByText('Active Loans')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Currently active')).toBeInTheDocument();
  });

  it('should render with color variant', () => {
    const { container } = render(
      <StatsCard
        title="Stock Items"
        value={80}
        icon={Package}
        color="success"
      />
    );

    expect(screen.getByText('Stock Items')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(container.querySelector('.bg-green-100')).toBeInTheDocument();
  });

  it('should render without optional props', () => {
    render(
      <StatsCard
        title="Employees"
        value={50}
        icon={Package}
      />
    );

    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('should handle zero value', () => {
    render(
      <StatsCard
        title="Broken Items"
        value={0}
        icon={Package}
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should handle large numbers', () => {
    render(
      <StatsCard
        title="Total Value"
        value={1250000}
        icon={Package}
      />
    );

    expect(screen.getByText('1250000')).toBeInTheDocument();
  });
});
