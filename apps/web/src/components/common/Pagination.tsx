/**
 * @fileoverview Pagination - Reusable pagination component
 *
 * This component provides:
 * - Page navigation controls (first, previous, next, last)
 * - Page size selector (rows per page)
 * - Current page and total pages display
 * - Items range display (e.g., "Showing 1 to 20 of 100 results")
 *
 * Features:
 * - Responsive design (stacks on mobile, horizontal on desktop)
 * - Customizable page size options
 * - Disabled state for boundary buttons (first/last page)
 * - Accessible with aria labels and titles
 * - Supports French translations
 */
import { memo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

/**
 * Props for Pagination component
 *
 * @interface PaginationProps
 * @property {number} currentPage - Current active page (1-indexed)
 * @property {number} totalPages - Total number of pages available
 * @property {number} pageSize - Number of items per page
 * @property {number} totalItems - Total number of items across all pages
 * @property {Function} onPageChange - Callback when page changes
 * @property {Function} onPageSizeChange - Callback when page size changes
 * @property {number[]} [pageSizeOptions] - Available page size options (default: [10, 20, 50, 100])
 */
interface PaginationProps {
  /** Current active page number (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Number of items per page */
  pageSize: number
  /** Total number of items */
  totalItems: number
  /** Callback invoked when user navigates to a different page */
  onPageChange: (page: number) => void
  /** Callback invoked when user changes page size */
  onPageSizeChange: (pageSize: number) => void
  /** Available page size options (default: [10, 20, 50, 100]) */
  pageSizeOptions?: number[]
}

/**
 * Pagination component for navigating through paginated data
 *
 * Provides page navigation buttons, page size selector, and displays
 * the current range of items being shown.
 *
 * @param {PaginationProps} props - Component props
 * @returns {JSX.Element} Pagination controls
 *
 * @example
 * // Basic usage with state management
 * const [currentPage, setCurrentPage] = useState(1)
 * const [pageSize, setPageSize] = useState(20)
 * const totalItems = 150
 * const totalPages = Math.ceil(totalItems / pageSize)
 *
 * <Pagination
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   pageSize={pageSize}
 *   totalItems={totalItems}
 *   onPageChange={setCurrentPage}
 *   onPageSizeChange={setPageSize}
 * />
 *
 * @example
 * // With custom page size options
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   pageSize={25}
 *   totalItems={250}
 *   onPageChange={(page) => console.log('Navigate to page', page)}
 *   onPageSizeChange={(size) => console.log('Page size changed to', size)}
 *   pageSizeOptions={[25, 50, 75, 100]}
 * />
 */
export const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  // Calculate the range of items currently displayed
  // startItem: first item number on current page (1-indexed)
  // endItem: last item number on current page (capped at totalItems)
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      {/* Items info */}
      <div className="text-sm text-muted-foreground">
        Affichage de <strong>{startItem}</strong> à <strong>{endItem}</strong> sur{' '}
        <strong>{totalItems}</strong> résultat{totalItems > 1 ? 's' : ''}
      </div>

      <div className="flex items-center gap-6">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Lignes par page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              title="Première page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              title="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm font-medium whitespace-nowrap">
            Page {currentPage} sur {totalPages}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              title="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage >= totalPages}
              title="Dernière page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
})
