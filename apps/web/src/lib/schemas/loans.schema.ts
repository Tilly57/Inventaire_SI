import { z } from 'zod'

export const createLoanSchema = z.object({
  employeeId: z.string().min(1, 'L\'employé est requis'),
})

export const addLoanLineSchema = z.object({
  assetItemId: z.string().optional(),
  stockItemId: z.string().optional(),
  quantity: z.number().min(1, 'La quantité doit être au moins 1').int().optional(),
}).refine(
  (data) => data.assetItemId || data.stockItemId,
  {
    message: 'Vous devez sélectionner soit un équipement, soit un article de stock',
  }
)

export type CreateLoanFormData = z.infer<typeof createLoanSchema>
export type AddLoanLineFormData = z.infer<typeof addLoanLineSchema>
