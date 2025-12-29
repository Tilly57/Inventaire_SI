/**
 * Equipment Types validation schemas
 *
 * Zod schemas for validating equipment type creation and update requests
 */
import { z } from 'zod';

/**
 * Schema for creating a new equipment type
 */
export const createEquipmentTypeSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .trim()
});

/**
 * Schema for updating an existing equipment type
 */
export const updateEquipmentTypeSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .trim()
    .optional()
});