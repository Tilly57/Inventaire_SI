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

export const createAssetItemsBulkSchema = z.object({
  assetModelId: z.string().min(1, 'ID du modèle requis'),
  tagPrefix: z.string()
    .min(1, 'Le préfixe du tag est requis')
    .max(20, 'Le préfixe ne peut pas dépasser 20 caractères'),
  quantity: z.number()
    .int('La quantité doit être un nombre entier')
    .min(1, 'La quantité doit être au moins 1')
    .max(100, 'La quantité ne peut pas dépasser 100'),
  status: z.enum(['EN_STOCK', 'PRETE', 'HS', 'REPARATION']).optional(),
  notes: z.string().optional().nullable()
});

export const bulkPreviewSchema = z.object({
  tagPrefix: z.string().min(1),
  quantity: z.number().int().min(1).max(100)
});
