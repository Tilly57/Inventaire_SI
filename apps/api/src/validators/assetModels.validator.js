/**
 * Asset Model validation schemas
 */
import { z } from 'zod';

export const createAssetModelSchema = z.object({
  type: z.string().min(1, 'Type requis'),
  brand: z.string().min(1, 'Marque requise'),
  modelName: z.string().min(1, 'Nom du modèle requis'),
  quantity: z.number().int().min(1).max(100).optional()
});

export const updateAssetModelSchema = z.object({
  type: z.string().min(1, 'Type requis').optional(),
  brand: z.string().min(1, 'Marque requise').optional(),
  modelName: z.string().min(1, 'Nom du modèle requis').optional(),
  quantity: z.number().int().min(1).max(100).optional()
});

export const batchDeleteAssetModelsSchema = z.object({
  modelIds: z.array(z.string().cuid())
    .min(1, 'Au moins un modèle doit être sélectionné')
    .max(100, 'Impossible de supprimer plus de 100 modèles à la fois')
});
