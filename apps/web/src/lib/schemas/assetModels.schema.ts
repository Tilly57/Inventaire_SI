import { z } from 'zod'
import { AssetType } from '@/lib/types/enums'

export const createAssetModelSchema = z.object({
  type: z.nativeEnum(AssetType, { errorMap: () => ({ message: 'Type invalide' }) }),
  brand: z.string().min(2, 'La marque doit contenir au moins 2 caractères'),
  modelName: z.string().min(2, 'Le nom du modèle doit contenir au moins 2 caractères'),
})

export const updateAssetModelSchema = z.object({
  type: z.nativeEnum(AssetType, { errorMap: () => ({ message: 'Type invalide' }) }).optional(),
  brand: z.string().min(2, 'La marque doit contenir au moins 2 caractères').optional(),
  modelName: z.string().min(2, 'Le nom du modèle doit contenir au moins 2 caractères').optional(),
})

export type CreateAssetModelFormData = z.infer<typeof createAssetModelSchema>
export type UpdateAssetModelFormData = z.infer<typeof updateAssetModelSchema>
