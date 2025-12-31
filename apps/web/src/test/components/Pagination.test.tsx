import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/common/Pagination';

describe('Pagination', () => {
  it('should render current page and total', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <Pagination
        currentPage={1}
        totalPages={10}
        pageSize={20}
        totalItems={200}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    expect(screen.getByText(/Page 1 sur 10/)).toBeInTheDocument();
  });

  it('should disable previous button on first page', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <Pagination
        currentPage={1}
        totalPages={10}
        pageSize={20}
        totalItems={200}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const prevButton = screen.getByRole('button', { name: /précédent/i });
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <Pagination
        currentPage={10}
        totalPages={10}
        pageSize={20}
        totalItems={200}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const nextButton = screen.getByRole('button', { name: /suivant/i });
    expect(nextButton).toBeDisabled();
  });

  it('should call onPageChange when clicking next', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        pageSize={20}
        totalItems={200}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const nextButton = screen.getByRole('button', { name: /suivant/i });
    fireEvent.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(6);
  });

  it('should call onPageChange when clicking previous', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        pageSize={20}
        totalItems={200}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const prevButton = screen.getByRole('button', { name: /précédent/i });
    fireEvent.click(prevButton);

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('should handle single page gracefully', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <Pagination
        currentPage={1}
        totalPages={1}
        pageSize={20}
        totalItems={20}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const prevButton = screen.getByRole('button', { name: /précédent/i });
    const nextButton = screen.getByRole('button', { name: /suivant/i });

    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('should handle zero pages', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <Pagination
        currentPage={1}
        totalPages={0}
        pageSize={20}
        totalItems={0}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    expect(screen.getByText(/Page 1 sur 0/)).toBeInTheDocument();
  });
});
