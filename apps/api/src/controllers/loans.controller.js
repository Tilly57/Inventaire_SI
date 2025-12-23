/**
 * Loans controllers - HTTP handlers
 */
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as loansService from '../services/loans.service.js';

/**
 * GET /api/loans
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
 * GET /api/loans/:id
 */
export const getLoanById = asyncHandler(async (req, res) => {
  const loan = await loansService.getLoanById(req.params.id);

  res.json({
    success: true,
    data: loan
  });
});

/**
 * POST /api/loans
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
 * POST /api/loans/:id/lines
 */
export const addLoanLine = asyncHandler(async (req, res) => {
  const loanLine = await loansService.addLoanLine(req.params.id, req.body);

  res.status(201).json({
    success: true,
    data: loanLine
  });
});

/**
 * DELETE /api/loans/:id/lines/:lineId
 */
export const removeLoanLine = asyncHandler(async (req, res) => {
  const result = await loansService.removeLoanLine(req.params.id, req.params.lineId);

  res.json({
    success: true,
    data: result
  });
});

/**
 * POST /api/loans/:id/pickup-signature
 */
export const uploadPickupSignature = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Aucun fichier fourni'
    });
  }

  const loan = await loansService.uploadPickupSignature(req.params.id, req.file);

  res.json({
    success: true,
    data: loan
  });
});

/**
 * POST /api/loans/:id/return-signature
 */
export const uploadReturnSignature = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Aucun fichier fourni'
    });
  }

  const loan = await loansService.uploadReturnSignature(req.params.id, req.file);

  res.json({
    success: true,
    data: loan
  });
});

/**
 * PATCH /api/loans/:id/close
 */
export const closeLoan = asyncHandler(async (req, res) => {
  const loan = await loansService.closeLoan(req.params.id);

  res.json({
    success: true,
    data: loan
  });
});

/**
 * DELETE /api/loans/:id
 */
export const deleteLoan = asyncHandler(async (req, res) => {
  const result = await loansService.deleteLoan(req.params.id);

  res.json({
    success: true,
    data: result
  });
});
