/**
 * @fileoverview Pagination types for API responses
 *
 * Defines TypeScript types for paginated API responses.
 * Matches backend pagination structure from pagination.js
 */

/**
 * Pagination metadata returned by API
 */
export interface PaginationMetadata {
  /** Current page number (1-indexed) */
  page: number

  /** Number of items per page */
  pageSize: number

  /** Total number of items across all pages */
  totalItems: number

  /** Total number of pages */
  totalPages: number

  /** Whether there is a next page available */
  hasNextPage: boolean

  /** Whether there is a previous page available */
  hasPreviousPage: boolean
}

/**
 * Paginated API response structure
 */
export interface PaginatedResponse<T> {
  /** Success status */
  success: boolean

  /** Array of data items for current page */
  data: T[]

  /** Pagination metadata */
  pagination: PaginationMetadata
}

/**
 * Parameters for paginated API requests
 */
export interface PaginationParams {
  /** Page number to fetch (1-indexed) */
  page?: number

  /** Number of items per page (default: 20, max: 100) */
  pageSize?: number

  /** Field to sort by */
  sortBy?: string

  /** Sort order */
  sortOrder?: 'asc' | 'desc'
}

/**
 * Paginated query options for React Query
 */
export interface UsePaginatedQueryOptions extends PaginationParams {
  /** Additional filter parameters */
  [key: string]: any
}
