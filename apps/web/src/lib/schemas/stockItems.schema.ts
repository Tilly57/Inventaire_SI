import { z } from 'zod'

export const createStockItemSchema = z.object({
  assetModelId: z.string().min(1, 'Le modèle est requis'),
  quantity: z.number().min(0, 'La quantité doit être positive').int('La quantité doit être un nombre entier'),
  notes: z.string().optional(),
})

export const updateStockItemSchema = z.object({
  assetModelId: z.string().min(1, 'Le modèle est requis').optional(),
  quantity: z.number().min(0, 'La quantité doit être positive').int('La quantité doit être un nombre entier').optional(),
  notes: z.string().optional().nullable(),
})

export type CreateStockItemFormData = z.infer<typeof createStockItemSchema>
export type UpdateStockItemFormData = z.infer<typeof updateStockItemSchema>
