/**
 * @fileoverview Loans controllers - HTTP request handlers
 *
 * This module provides:
 * - Loan CRUD operations (create, read, delete)
 * - Loan line management (add/remove equipment from loans)
 * - Digital signature uploads (pickup and return)
 * - Loan closure workflow
 *
 * Loan Workflow:
 * 1. Create loan (OPEN status) → POST /loans
 * 2. Add equipment lines → POST /loans/:id/lines
 * 3. Upload pickup signature → POST /loans/:id/pickup-signature
 * 4. Employee uses equipment
 * 5. Upload return signature → POST /loans/:id/return-signature
 * 6. Close loan (CLOSED status) → PATCH /loans/:id/close
 *
 * Business Rules:
 * - Cannot close loan without both pickup AND return signatures
 * - Closing loan sets all borrowed items back to EN_STOCK status
 * - Removing loan line reverts asset status to EN_STOCK
 * - Signatures stored as files, URLs saved in database
 */
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as loansService from '../services/loans.service.js';

/**
 * Get all loans with optional filters
 *
 * Route: GET /api/loans
 * Access: Protected (requires authentication)
 *
 * Returns list of loans with related data (employee, lines, assets).
 * Supports filtering by status and employee.
 *
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.status] - Filter by loan status (OPEN, CLOSED)
 * @param {string} [req.query.employeeId] - Filter by employee ID
 *
 * @returns {Object} 200 - Array of loan objects
 *
 * @example
 * GET /api/loans?status=OPEN
 * GET /api/loans?employeeId=ckx123
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "ckx...",
 *       "status": "OPEN",
 *       "employee": { "id": "...", "firstName": "John", "lastName": "Doe" },
 *       "lines": [
 *         { "id": "...", "assetItem": { "assetTag": "LAP-001", ... } }
 *       ],
 *       "pickupSignatureUrl": "/uploads/signatures/...",
 *       "returnSignatureUrl": null,
 *       "createdAt": "2024-01-15T10:00:00Z"
 *     }
 *   ]
 * }
 */
export const getAllLoans = asyncHandler(async (req, res) => {
  const { status, employeeId } = req.query;

  const loans = await loansService.getAllLoans({ status, employeeId });

  res.json({
    success: true,
    data: loans
  });
});

/**
 * Get loan by ID with full details
 *
 * Route: GET /api/loans/:id
 * Access: Protected (requires authentication)
 *
 * Returns single loan with employee, loan lines, and asset details.
 *
 * @param {string} req.params.id - Loan ID
 *
 * @returns {Object} 200 - Loan object with relations
 * @returns {Object} 404 - Loan not found
 *
 * @example
 * GET /api/loans/ckx123
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "ckx123",
 *     "status": "OPEN",
 *     "employee": { ... },
 *     "lines": [ ... ],
 *     "pickupSignatureUrl": "/uploads/...",
 *     "pickupSignedAt": "2024-01-15T10:00:00Z",
 *     "returnSignatureUrl": null,
 *     "returnSignedAt": null,
 *     "closedAt": null
 *   }
 * }
 */
export const getLoanById = asyncHandler(async (req, res) => {
  const loan = await loansService.getLoanById(req.params.id);

  res.json({
    success: true,
    data: loan
  });
});

/**
 * Create a new loan
 *
 * Route: POST /api/loans
 * Access: Protected (requires authentication)
 *
 * Creates a new OPEN loan for an employee. The authenticated user
 * is recorded as the creator. Loan starts empty; add equipment via
 * POST /loans/:id/lines.
 *
 * @param {Object} req.body - Loan creation data
 * @param {string} req.body.employeeId - ID of employee receiving equipment
 * @param {Object} req.user - Authenticated user from middleware
 * @param {string} req.user.userId - ID of user creating the loan
 *
 * @returns {Object} 201 - Created loan object
 * @returns {Object} 404 - Employee not found
 *
 * @example
 * POST /api/loans
 * Authorization: Bearer eyJ...
 * {
 *   "employeeId": "ckx456"
 * }
 *
 * Response 201:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "ckx789",
 *     "status": "OPEN",
 *     "employeeId": "ckx456",
 *     "createdById": "ckx012",
 *     "lines": [],
 *     "createdAt": "2024-01-15T10:00:00Z"
 *   }
 * }
 */
export const createLoan = asyncHandler(async (req, res) => {
  const { employeeId } = req.body;
  const createdById = req.user.userId;

  const loan = await loansService.createLoan(employeeId, createdById);

  res.status(201).json({
    success: true,
    data: loan
  });
});

/**
 * Add equipment line to loan
 *
 * Route: POST /api/loans/:id/lines
 * Access: Protected (requires authentication)
 *
 * Adds an asset item or stock item to the loan. For asset items, status
 * is automatically updated to PRETE (borrowed).
 *
 * @param {string} req.params.id - Loan ID
 * @param {Object} req.body - Line creation data
 * @param {string} [req.body.assetItemId] - ID of asset item to loan
 * @param {string} [req.body.stockItemId] - ID of stock item to loan
 * @param {number} [req.body.quantity] - Quantity (for stock items only)
 *
 * @returns {Object} 201 - Created loan line object
 * @returns {Object} 404 - Loan or asset not found
 * @returns {Object} 400 - Asset already borrowed or invalid quantity
 *
 * @example
 * POST /api/loans/ckx123/lines
 * {
 *   "assetItemId": "ckx999"
 * }
 *
 * Response 201:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "ckx888",
 *     "loanId": "ckx123",
 *     "assetItemId": "ckx999",
 *     "assetItem": {
 *       "id": "ckx999",
 *       "assetTag": "LAP-001",
 *       "status": "PRETE"
 *     }
 *   }
 * }
 */
export const addLoanLine = asyncHandler(async (req, res) => {
  const loanLine = await loansService.addLoanLine(req.params.id, req.body);

  res.status(201).json({
    success: true,
    data: loanLine
  });
});

/**
 * Remove equipment line from loan
 *
 * Route: DELETE /api/loans/:id/lines/:lineId
 * Access: Protected (requires authentication)
 *
 * Removes a loan line and reverts asset status to EN_STOCK (if asset item).
 * For stock items, decrements the loaned quantity.
 *
 * @param {string} req.params.id - Loan ID
 * @param {string} req.params.lineId - Loan line ID to remove
 *
 * @returns {Object} 200 - Success message
 * @returns {Object} 404 - Loan or line not found
 *
 * @example
 * DELETE /api/loans/ckx123/lines/ckx888
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": { "message": "Ligne de prêt supprimée avec succès" }
 * }
 */
export const removeLoanLine = asyncHandler(async (req, res) => {
  const result = await loansService.removeLoanLine(req.params.id, req.params.lineId);

  res.json({
    success: true,
    data: result
  });
});

/**
 * Upload pickup signature for loan
 *
 * Route: POST /api/loans/:id/pickup-signature
 * Access: Protected (requires authentication + multer middleware)
 *
 * Uploads employee's signature when picking up equipment.
 * Uses multer middleware for file handling (max 5MB, PNG/JPEG only).
 *
 * @param {string} req.params.id - Loan ID
 * @param {Object} req.file - Uploaded file from multer
 *
 * @returns {Object} 200 - Updated loan with signature URL
 * @returns {Object} 400 - No file provided
 * @returns {Object} 404 - Loan not found
 *
 * @example
 * POST /api/loans/ckx123/pickup-signature
 * Content-Type: multipart/form-data
 * [signature image file]
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "ckx123",
 *     "pickupSignatureUrl": "/uploads/signatures/1234567890-signature.png",
 *     "pickupSignedAt": "2024-01-15T10:30:00Z"
 *   }
 * }
 */
export const uploadPickupSignature = asyncHandler(async (req, res) => {
  // Accept either file upload (multipart/form-data) or base64 (application/json)
  const signatureData = req.file || req.body.signatureBase64;

  if (!signatureData) {
    return res.status(400).json({
      success: false,
      error: 'Aucune signature fournie'
    });
  }

  const loan = await loansService.uploadPickupSignature(req.params.id, signatureData);

  res.json({
    success: true,
    data: loan
  });
});

/**
 * Upload return signature for loan
 *
 * Route: POST /api/loans/:id/return-signature
 * Access: Protected (requires authentication + multer middleware)
 *
 * Uploads employee's signature when returning equipment.
 * Uses multer middleware for file handling (max 5MB, PNG/JPEG only).
 *
 * @param {string} req.params.id - Loan ID
 * @param {Object} req.file - Uploaded file from multer
 *
 * @returns {Object} 200 - Updated loan with signature URL
 * @returns {Object} 400 - No file provided
 * @returns {Object} 404 - Loan not found
 *
 * @example
 * POST /api/loans/ckx123/return-signature
 * Content-Type: multipart/form-data
 * [signature image file]
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "ckx123",
 *     "returnSignatureUrl": "/uploads/signatures/1234567891-signature.png",
 *     "returnSignedAt": "2024-01-16T14:00:00Z"
 *   }
 * }
 */
export const uploadReturnSignature = asyncHandler(async (req, res) => {
  // Accept either file upload (multipart/form-data) or base64 (application/json)
  const signatureData = req.file || req.body.signatureBase64;

  if (!signatureData) {
    return res.status(400).json({
      success: false,
      error: 'Aucune signature fournie'
    });
  }

  const loan = await loansService.uploadReturnSignature(req.params.id, signatureData);

  res.json({
    success: true,
    data: loan
  });
});

/**
 * Close a loan
 *
 * Route: PATCH /api/loans/:id/close
 * Access: Protected (requires authentication)
 *
 * Closes the loan and returns all borrowed assets to EN_STOCK status.
 * Requires both pickup AND return signatures to be present.
 *
 * @param {string} req.params.id - Loan ID
 *
 * @returns {Object} 200 - Updated loan with CLOSED status
 * @returns {Object} 400 - Missing signatures
 * @returns {Object} 404 - Loan not found
 *
 * @example
 * PATCH /api/loans/ckx123/close
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "ckx123",
 *     "status": "CLOSED",
 *     "closedAt": "2024-01-16T14:30:00Z",
 *     "lines": [
 *       { "assetItem": { "status": "EN_STOCK" } }
 *     ]
 *   }
 * }
 */
export const closeLoan = asyncHandler(async (req, res) => {
  const loan = await loansService.closeLoan(req.params.id);

  res.json({
    success: true,
    data: loan
  });
});

/**
 * Delete a loan
 *
 * Route: DELETE /api/loans/:id
 * Access: Protected (requires authentication)
 *
 * Deletes the loan and all associated loan lines. Reverts all borrowed
 * assets to EN_STOCK status. Cannot delete loans with signatures (use close instead).
 *
 * @param {string} req.params.id - Loan ID
 *
 * @returns {Object} 200 - Success message
 * @returns {Object} 400 - Cannot delete loan with signatures
 * @returns {Object} 404 - Loan not found
 *
 * @example
 * DELETE /api/loans/ckx123
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": { "message": "Prêt supprimé avec succès" }
 * }
 */
export const deleteLoan = asyncHandler(async (req, res) => {
  const result = await loansService.deleteLoan(req.params.id, req.user.id);

  res.json({
    success: true,
    data: result
  });
});

/**
 * Batch delete loans (ADMIN only)
 *
 * Route: POST /api/loans/batch-delete
 * Access: ADMIN only
 *
 * Deletes multiple loans in a single atomic transaction. All associated
 * asset statuses are reverted to EN_STOCK and stock quantities are restored.
 * Signature files are deleted from the server.
 *
 * @param {Object} req.body - Request body
 * @param {string[]} req.body.loanIds - Array of loan IDs to delete (max 100)
 *
 * @returns {Object} 200 - Deletion result
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "deletedCount": 5,
 *     "message": "5 prêt(s) supprimé(s) avec succès"
 *   }
 * }
 *
 * @throws {400} If loanIds array is empty or contains invalid IDs
 * @throws {403} If user is not ADMIN
 * @throws {404} If no loans found with provided IDs
 */
export const batchDeleteLoans = asyncHandler(async (req, res) => {
  const { loanIds } = req.body;
  const result = await loansService.batchDeleteLoans(loanIds, req.user.id);

  res.json({
    success: true,
    data: result
  });
});
