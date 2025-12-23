/**
 * User validation schemas
 */
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  role: z.enum(['ADMIN', 'GESTIONNAIRE', 'LECTURE'])
});

export const updateUserSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  role: z.enum(['ADMIN', 'GESTIONNAIRE', 'LECTURE']).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
});
