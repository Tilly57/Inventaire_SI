import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsCard from '@/components/dashboard/StatsCard';
import { Package } from 'lucide-react';

describe('StatsCard', () => {
  it('should render title and value', () => {
    render(
      <StatsCard
        title="Total Assets"
        value={150}
        icon={Package}
        trend={{ value: 12, isPositive: true }}
      />
    );

    expect(screen.getByText('Total Assets')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should display positive trend correctly', () => {
    render(
      <StatsCard
        title="Active Loans"
        value={25}
        icon={Package}
        trend={{ value: 5, isPositive: true }}
      />
    );

    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('should display negative trend correctly', () => {
    render(
      <StatsCard
        title="Stock Items"
        value={80}
        icon={Package}
        trend={{ value: 3, isPositive: false }}
      />
    );

    expect(screen.getByText('-3%')).toBeInTheDocument();
  });

  it('should render without trend', () => {
    render(
      <StatsCard
        title="Employees"
        value={50}
        icon={Package}
      />
    );

    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.queryByText('%')).not.toBeInTheDocument();
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
