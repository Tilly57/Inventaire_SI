import { z } from 'zod'

export const createAssetModelSchema = z.object({
  type: z.string().min(1, 'Veuillez sélectionner un type'),
  brand: z.string().min(2, 'La marque doit contenir au moins 2 caractères'),
  modelName: z.string().min(2, 'Le nom du modèle doit contenir au moins 2 caractères'),
  quantity: z.number().int().min(1).max(100).optional(),
})

export const updateAssetModelSchema = z.object({
  type: z.string().min(1, 'Veuillez sélectionner un type').optional(),
  brand: z.string().min(2, 'La marque doit contenir au moins 2 caractères').optional(),
  modelName: z.string().min(2, 'Le nom du modèle doit contenir au moins 2 caractères').optional(),
  quantity: z.number().int().min(1).max(100).optional(),
})

export type CreateAssetModelFormData = z.infer<typeof createAssetModelSchema>
export type UpdateAssetModelFormData = z.infer<typeof updateAssetModelSchema>
