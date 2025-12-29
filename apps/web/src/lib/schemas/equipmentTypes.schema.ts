/**
 * Equipment Types Zod validation schemas
 */
import { z } from 'zod';

/**
 * Schema for creating/updating equipment types
 */
export const equipmentTypeFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .trim(),
});

export type EquipmentTypeFormData = z.infer<typeof equipmentTypeFormSchema>;
