import { z } from 'zod'
import { AssetStatus } from '@/lib/types/enums'

export const createAssetItemSchema = z.object({
  assetTag: z.string().min(1, 'Le tag est requis'),
  serialNumber: z.string().optional(),
  status: z.nativeEnum(AssetStatus, { message: 'Statut invalide' }).optional(),
  notes: z.string().optional(),
  assetModelId: z.string().min(1, 'Le modèle est requis'),
})

export const updateAssetItemSchema = z.object({
  assetTag: z.string().min(1, 'Le tag est requis').optional(),
  serialNumber: z.string().optional().nullable(),
  status: z.nativeEnum(AssetStatus, { message: 'Statut invalide' }).optional(),
  notes: z.string().optional().nullable(),
  assetModelId: z.string().min(1, 'Le modèle est requis').optional(),
})

// Schema pour création en masse
export const createBulkAssetItemsSchema = z.object({
  tagPrefix: z.string()
    .min(1, 'Le préfixe est requis')
    .max(20, 'Le préfixe ne peut pas dépasser 20 caractères')
    .regex(/^[A-Z0-9-_]+$/i, 'Lettres, chiffres, tirets et underscores seulement'),
  quantity: z.number()
    .int('Nombre entier requis')
    .min(1, 'Minimum 1')
    .max(100, 'Maximum 100'),
  status: z.nativeEnum(AssetStatus).optional(),
  notes: z.string().optional(),
  assetModelId: z.string().min(1, 'Le modèle est requis'),
})

// Schema unifié pour le formulaire (mode conditionnel)
export const assetItemFormSchema = z.object({
  quantity: z.number().int().min(1).max(100),
  assetModelId: z.string().min(1, 'Le modèle est requis'),
  status: z.nativeEnum(AssetStatus).optional(),
  notes: z.string().optional(),
  assetTag: z.string().optional(),
  tagPrefix: z.string().optional(),
  serialNumber: z.string().optional(),
}).refine(
  (data) => {
    // Si quantity === 1, assetTag requis
    if (data.quantity === 1) {
      return !!data.assetTag && data.assetTag.length > 0;
    }
    // Si quantity > 1, tagPrefix requis
    return !!data.tagPrefix && data.tagPrefix.length > 0;
  },
  {
    message: 'Tag d\'actif ou préfixe requis selon le mode',
    path: ['assetTag'],
  }
)

export type CreateAssetItemFormData = z.infer<typeof createAssetItemSchema>
export type UpdateAssetItemFormData = z.infer<typeof updateAssetItemSchema>
export type CreateBulkAssetItemsFormData = z.infer<typeof createBulkAssetItemsSchema>
export type AssetItemFormData = z.infer<typeof assetItemFormSchema>
