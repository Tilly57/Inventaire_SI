/**
 * Loan validation schemas
 */
import { z } from 'zod';

export const createLoanSchema = z.object({
  employeeId: z.string().min(1, 'ID de l\'employé requis')
});

export const addLoanLineSchema = z.object({
  assetItemId: z.string().optional().nullable(),
  stockItemId: z.string().optional().nullable(),
  quantity: z.number().int().min(1, 'La quantité doit être au moins 1').optional()
}).refine(data => data.assetItemId || data.stockItemId, {
  message: 'Vous devez spécifier soit un article d\'équipement soit un article de stock'
});
