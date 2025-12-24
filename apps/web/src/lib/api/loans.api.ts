/**
 * @fileoverview Loans API client
 *
 * Provides functions to interact with /api/loans endpoints.
 *
 * Loan workflow:
 * 1. Create loan (OPEN status) for an employee
 * 2. Add loan lines (asset items and/or stock items)
 * 3. Upload pickup signature when employee takes equipment
 * 4. Upload return signature when employee returns equipment
 * 5. Close loan (CLOSED status)
 *
 * Digital signatures are uploaded as image files (PNG/JPEG from canvas or file input).
 *
 * Requires ADMIN or GESTIONNAIRE role for modifications.
 */

import apiClient from './client'
import type {
  Loan,
  CreateLoanDto,
  AddLoanLineDto,
  ApiResponse,
} from '@/lib/types/models.types'

/**
 * Fetch all loans
 *
 * Returns all loans with employee and line details.
 * Uses high limit (1000) to bypass pagination.
 *
 * @returns Promise resolving to array of loans
 *
 * @example
 * const loans = await getAllLoansApi();
 * // loans = [
 * //   {
 * //     id, status: 'OPEN', openedAt, closedAt,
 * //     employee: { firstName, lastName, email },
 * //     lines: [{ assetItem: {...}, stockItem: {...}, quantity }],
 * //     pickupSignatureUrl, returnSignatureUrl
 * //   },
 * //   ...
 * // ]
 */
export async function getAllLoansApi(): Promise<Loan[]> {
  const response = await apiClient.get<any>('/loans?limit=1000')
  const data = response.data.data
  return Array.isArray(data) ? data : data.loans || []
}

/**
 * Fetch single loan by ID
 *
 * Returns complete loan details with employee, all lines, and signatures.
 *
 * @param id - Loan ID (CUID format)
 * @returns Promise resolving to Loan object
 * @throws {NotFoundError} If loan doesn't exist (404)
 *
 * @example
 * const loan = await getLoanApi('loanId123');
 * // loan = {
 * //   id, status, openedAt, closedAt, pickupSignedAt, returnSignedAt,
 * //   employee: { id, firstName, lastName },
 * //   lines: [
 * //     { id, assetItem: {...}, quantity: 1 },
 * //     { id, stockItem: {...}, quantity: 5 }
 * //   ],
 * //   pickupSignatureUrl: '/uploads/signatures/...',
 * //   returnSignatureUrl: '/uploads/signatures/...'
 * // }
 */
export async function getLoanApi(id: string): Promise<Loan> {
  const response = await apiClient.get<ApiResponse<Loan>>(`/loans/${id}`)
  return response.data.data
}

/**
 * Create new loan
 *
 * Creates a new loan in OPEN status for an employee.
 * Lines must be added separately using addLoanLineApi.
 *
 * @param data - Loan creation data
 * @param data.employeeId - Employee borrowing the equipment
 * @returns Promise resolving to created Loan (empty lines array)
 * @throws {NotFoundError} If employee doesn't exist (404)
 *
 * @example
 * const loan = await createLoanApi({
 *   employeeId: 'empId123'
 * });
 * // loan = { id, employeeId, status: 'OPEN', lines: [], ... }
 */
export async function createLoanApi(data: CreateLoanDto): Promise<Loan> {
  const response = await apiClient.post<ApiResponse<Loan>>('/loans', data)
  return response.data.data
}

/**
 * Add line to loan
 *
 * Adds an asset item OR stock item to the loan.
 * For asset items: status automatically updated to PRETE.
 * For stock items: quantity automatically decremented.
 *
 * Can only add lines to OPEN loans.
 *
 * @param loanId - Loan ID to add line to
 * @param data - Line data
 * @param data.assetItemId - Asset item to add (mutually exclusive with stockItemId)
 * @param data.stockItemId - Stock item to add (mutually exclusive with assetItemId)
 * @param data.quantity - Quantity for stock items (default: 1, required for stock)
 * @returns Promise resolving to updated Loan with new line
 * @throws {NotFoundError} If loan or item doesn't exist (404)
 * @throws {ValidationError} If loan is closed or item unavailable (400)
 *
 * @example
 * // Add asset item
 * const loan = await addLoanLineApi('loanId123', {
 *   assetItemId: 'laptopId456'
 * });
 *
 * @example
 * // Add stock item with quantity
 * const loan = await addLoanLineApi('loanId123', {
 *   stockItemId: 'cableId789',
 *   quantity: 5
 * });
 */
export async function addLoanLineApi(loanId: string, data: AddLoanLineDto): Promise<Loan> {
  const response = await apiClient.post<ApiResponse<Loan>>(`/loans/${loanId}/lines`, data)
  return response.data.data
}

/**
 * Remove line from loan
 *
 * Removes an item from the loan.
 * For asset items: status reverted to EN_STOCK.
 * For stock items: quantity incremented back.
 *
 * Can only remove lines from OPEN loans.
 *
 * @param loanId - Loan ID
 * @param lineId - Line ID to remove
 * @returns Promise resolving to updated Loan without the removed line
 * @throws {NotFoundError} If loan or line doesn't exist (404)
 * @throws {ValidationError} If loan is closed (400)
 *
 * @example
 * const loan = await removeLoanLineApi('loanId123', 'lineId456');
 * // Line removed, asset status reverted, stock quantity restored
 */
export async function removeLoanLineApi(loanId: string, lineId: string): Promise<Loan> {
  const response = await apiClient.delete<ApiResponse<Loan>>(`/loans/${loanId}/lines/${lineId}`)
  return response.data.data
}

/**
 * Upload pickup signature
 *
 * Uploads employee's signature for equipment pickup.
 * File is converted to FormData and sent as multipart/form-data.
 *
 * Signature can be from canvas (dataURL → Blob) or file input.
 *
 * @param loanId - Loan ID
 * @param file - Signature image file (PNG, JPEG)
 * @returns Promise resolving to updated Loan with pickupSignatureUrl and pickupSignedAt
 * @throws {NotFoundError} If loan doesn't exist (404)
 * @throws {ValidationError} If file too large (>5MB) (400)
 *
 * @example
 * // From file input
 * const file = inputElement.files[0];
 * const loan = await uploadPickupSignatureApi('loanId123', file);
 *
 * @example
 * // From canvas (signature pad)
 * const dataUrl = signaturePad.toDataURL();
 * const blob = await fetch(dataUrl).then(r => r.blob());
 * const file = new File([blob], 'signature.png', { type: 'image/png' });
 * const loan = await uploadPickupSignatureApi('loanId123', file);
 */
export async function uploadPickupSignatureApi(loanId: string, file: File): Promise<Loan> {
  const formData = new FormData()
  formData.append('signature', file)

  const response = await apiClient.post<ApiResponse<Loan>>(
    `/loans/${loanId}/pickup-signature`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data.data
}

/**
 * Upload return signature
 *
 * Uploads employee's signature for equipment return.
 * File is converted to FormData and sent as multipart/form-data.
 *
 * @param loanId - Loan ID
 * @param file - Signature image file (PNG, JPEG)
 * @returns Promise resolving to updated Loan with returnSignatureUrl and returnSignedAt
 * @throws {NotFoundError} If loan doesn't exist (404)
 * @throws {ValidationError} If file too large (>5MB) or no pickup signature yet (400)
 *
 * @example
 * // From canvas (signature pad)
 * const dataUrl = signaturePad.toDataURL();
 * const blob = await fetch(dataUrl).then(r => r.blob());
 * const file = new File([blob], 'signature.png', { type: 'image/png' });
 * const loan = await uploadReturnSignatureApi('loanId123', file);
 */
export async function uploadReturnSignatureApi(loanId: string, file: File): Promise<Loan> {
  const formData = new FormData()
  formData.append('signature', file)

  const response = await apiClient.post<ApiResponse<Loan>>(
    `/loans/${loanId}/return-signature`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data.data
}

/**
 * Close loan
 *
 * Marks loan as CLOSED and sets closedAt timestamp.
 * Requires at least one line and pickup signature.
 *
 * Once closed, loan cannot be modified (no adding/removing lines).
 *
 * @param loanId - Loan ID to close
 * @returns Promise resolving to closed Loan with status='CLOSED' and closedAt
 * @throws {NotFoundError} If loan doesn't exist (404)
 * @throws {ValidationError} If no lines or no pickup signature (400)
 *
 * @example
 * const loan = await closeLoanApi('loanId123');
 * // loan.status = 'CLOSED', loan.closedAt = '2024-01-15T10:30:00Z'
 */
export async function closeLoanApi(loanId: string): Promise<Loan> {
  const response = await apiClient.patch<ApiResponse<Loan>>(`/loans/${loanId}/close`)
  return response.data.data
}

/**
 * Delete loan
 *
 * Permanently removes loan and all its lines.
 * Asset statuses are reverted, stock quantities are restored.
 *
 * Typically only used for mistakenly created loans.
 *
 * @param id - Loan ID to delete
 * @returns Promise resolving when deletion is complete
 * @throws {NotFoundError} If loan doesn't exist (404)
 *
 * @example
 * await deleteLoanApi('loanId123');
 * // All lines removed, asset statuses reverted, stock restored
 */
export async function deleteLoanApi(id: string): Promise<void> {
  await apiClient.delete(`/loans/${id}`)
}
