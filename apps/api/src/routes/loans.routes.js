/**
 * Loans routes - ADMIN and GESTIONNAIRE
 */
import express from 'express';
import { getAllLoans, getLoanById, createLoan, addLoanLine, removeLoanLine, uploadPickupSignature, uploadReturnSignature, closeLoan, deleteLoan } from '../controllers/loans.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireManager } from '../middleware/rbac.js';
import { validate } from '../middleware/validateRequest.js';
import { createLoanSchema, addLoanLineSchema } from '../validators/loans.validator.js';
import { upload } from '../config/multer.js';

const router = express.Router();

// All loan routes require authentication and ADMIN or GESTIONNAIRE role
router.use(requireAuth, requireManager);

router.get('/', getAllLoans);
router.get('/:id', getLoanById);
router.post('/', validate(createLoanSchema), createLoan);
router.post('/:id/lines', validate(addLoanLineSchema), addLoanLine);
router.delete('/:id/lines/:lineId', removeLoanLine);
router.post('/:id/pickup-signature', upload.single('signature'), uploadPickupSignature);
router.post('/:id/return-signature', upload.single('signature'), uploadReturnSignature);
router.patch('/:id/close', closeLoan);
router.delete('/:id', deleteLoan);

export default router;
