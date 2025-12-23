/**
 * Asset Model validation schemas
 */
import { z } from 'zod';

export const createAssetModelSchema = z.object({
  type: z.string().min(1, 'Type requis'),
  brand: z.string().min(1, 'Marque requise'),
  modelName: z.string().min(1, 'Nom du modèle requis')
});

export const updateAssetModelSchema = z.object({
  type: z.string().min(1, 'Type requis').optional(),
  brand: z.string().min(1, 'Marque requise').optional(),
  modelName: z.string().min(1, 'Nom du modèle requis').optional()
});
