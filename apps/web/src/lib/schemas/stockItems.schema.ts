import { z } from 'zod'

export const createStockItemSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  quantity: z.number().min(0, 'La quantité doit être positive').int('La quantité doit être un nombre entier'),
  unitPrice: z.number().min(0, 'Le prix doit être positif').optional(),
})

export const updateStockItemSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  description: z.string().optional().nullable(),
  quantity: z.number().min(0, 'La quantité doit être positive').int('La quantité doit être un nombre entier').optional(),
  unitPrice: z.number().min(0, 'Le prix doit être positif').optional().nullable(),
})

export type CreateStockItemFormData = z.infer<typeof createStockItemSchema>
export type UpdateStockItemFormData = z.infer<typeof updateStockItemSchema>
