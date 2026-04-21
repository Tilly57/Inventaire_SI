/**
 * Asset Model validation schemas
 */
import { z } from 'zod';

export const createAssetModelSchema = z.object({
  type: z.string().min(1, 'Type requis').max(100, 'Le type ne peut pas dépasser 100 caractères'),
  brand: z.string().min(1, 'Marque requise').max(100, 'La marque ne peut pas dépasser 100 caractères'),
  modelName: z.string().min(1, 'Nom du modèle requis').max(200, 'Le nom du modèle ne peut pas dépasser 200 caractères')
});

export const updateAssetModelSchema = z.object({
  type: z.string().min(1, 'Type requis').max(100, 'Le type ne peut pas dépasser 100 caractères').optional(),
  brand: z.string().min(1, 'Marque requise').max(100, 'La marque ne peut pas dépasser 100 caractères').optional(),
  modelName: z.string().min(1, 'Nom du modèle requis').max(200, 'Le nom du modèle ne peut pas dépasser 200 caractères').optional()
});

export const batchDeleteAssetModelsSchema = z.object({
  modelIds: z.array(z.string().cuid())
    .min(1, 'Au moins un modèle doit être sélectionné')
    .max(100, 'Impossible de supprimer plus de 100 modèles à la fois')
});
