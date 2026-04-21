/**
 * User validation schemas
 */
import { z } from 'zod';
import { passwordSchema } from './auth.validator.js';

export const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: passwordSchema,
  role: z.enum(['ADMIN', 'GESTIONNAIRE', 'LECTURE'])
});

export const updateUserSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  role: z.enum(['ADMIN', 'GESTIONNAIRE', 'LECTURE']).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: passwordSchema
});
