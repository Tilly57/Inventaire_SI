import { z } from 'zod'
import { AssetStatus } from '@/lib/types/enums'

export const createAssetItemSchema = z.object({
  assetTag: z.string().min(1, 'Le tag est requis'),
  serialNumber: z.string().optional(),
  status: z.nativeEnum(AssetStatus, { errorMap: () => ({ message: 'Statut invalide' }) }).optional(),
  notes: z.string().optional(),
  assetModelId: z.string().min(1, 'Le modèle est requis'),
})

export const updateAssetItemSchema = z.object({
  assetTag: z.string().min(1, 'Le tag est requis').optional(),
  serialNumber: z.string().optional().nullable(),
  status: z.nativeEnum(AssetStatus, { errorMap: () => ({ message: 'Statut invalide' }) }).optional(),
  notes: z.string().optional().nullable(),
  assetModelId: z.string().min(1, 'Le modèle est requis').optional(),
})

export type CreateAssetItemFormData = z.infer<typeof createAssetItemSchema>
export type UpdateAssetItemFormData = z.infer<typeof updateAssetItemSchema>
