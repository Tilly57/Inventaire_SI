/**
 * Asset Item validation schemas
 */
import { z } from 'zod';

export const createAssetItemSchema = z.object({
  assetModelId: z.string().min(1, 'ID du modèle requis'),
  assetTag: z.string().optional().nullable(),
  serial: z.string().optional().nullable(),
  status: z.enum(['EN_STOCK', 'PRETE', 'HS', 'REPARATION']).optional(),
  notes: z.string().optional().nullable()
});

export const updateAssetItemSchema = z.object({
  assetModelId: z.string().min(1, 'ID du modèle requis').optional(),
  assetTag: z.string().optional().nullable(),
  serial: z.string().optional().nullable(),
  status: z.enum(['EN_STOCK', 'PRETE', 'HS', 'REPARATION']).optional(),
  notes: z.string().optional().nullable()
});

export const updateStatusSchema = z.object({
  status: z.enum(['EN_STOCK', 'PRETE', 'HS', 'REPARATION'])
});
