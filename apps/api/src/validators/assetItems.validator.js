/**
 * Asset Item validation schemas
 */
import { z } from 'zod';

export const createAssetItemSchema = z.object({
  assetModelId: z.string().cuid('ID du modèle invalide'),
  assetTag: z.string().max(100, 'Le tag ne peut pas dépasser 100 caractères').optional().nullable(),
  serial: z.string().max(100, 'Le numéro de série ne peut pas dépasser 100 caractères').optional().nullable(),
  status: z.enum(['EN_STOCK', 'PRETE', 'HS', 'REPARATION']).optional(),
  notes: z.string().max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères').optional().nullable()
});

export const updateAssetItemSchema = z.object({
  assetModelId: z.string().cuid('ID du modèle invalide').optional(),
  assetTag: z.string().max(100, 'Le tag ne peut pas dépasser 100 caractères').optional().nullable(),
  serial: z.string().max(100, 'Le numéro de série ne peut pas dépasser 100 caractères').optional().nullable(),
  status: z.enum(['EN_STOCK', 'PRETE', 'HS', 'REPARATION']).optional(),
  notes: z.string().max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères').optional().nullable()
});

export const updateStatusSchema = z.object({
  status: z.enum(['EN_STOCK', 'PRETE', 'HS', 'REPARATION'])
});

export const createAssetItemsBulkSchema = z.object({
  assetModelId: z.string().cuid('ID du modèle invalide'),
  tagPrefix: z.string()
    .min(1, 'Le préfixe du tag est requis')
    .max(20, 'Le préfixe ne peut pas dépasser 20 caractères'),
  quantity: z.number()
    .int('La quantité doit être un nombre entier')
    .min(1, 'La quantité doit être au moins 1')
    .max(100, 'La quantité ne peut pas dépasser 100'),
  status: z.enum(['EN_STOCK', 'PRETE', 'HS', 'REPARATION']).optional(),
  notes: z.string().max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères').optional().nullable()
});

export const bulkPreviewSchema = z.object({
  tagPrefix: z.string().min(1),
  quantity: z.number().int().min(1).max(100)
});
