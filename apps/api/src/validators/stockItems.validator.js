/**
 * Stock Item validation schemas
 */
import { z } from 'zod';

export const createStockItemSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  quantity: z.number().int().min(0, 'La quantité doit être positive').optional(),
  notes: z.string().optional().nullable()
});

export const updateStockItemSchema = z.object({
  name: z.string().min(1, 'Nom requis').optional(),
  quantity: z.number().int().min(0, 'La quantité doit être positive').optional(),
  notes: z.string().optional().nullable()
});

export const adjustQuantitySchema = z.object({
  quantity: z.number().int()
});
