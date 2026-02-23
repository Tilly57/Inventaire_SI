/**
 * Authentication validation schemas
 * Phase 2: Strong password policy with complexity requirements
 */
import { z } from 'zod';

/**
 * Strong password schema - Phase 2 Security Enhancement
 *
 * Requirements:
 * - Minimum 8 characters (OWASP recommendation)
 * - Maximum 128 characters (prevent DoS via bcrypt)
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 *
 * Security rationale:
 * - Complexity requirements significantly increase password strength
 * - 8+ chars with complexity = ~60 bits entropy (resistant to online attacks)
 * - Protection against common weak passwords
 */
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/,
    'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)'
  );

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: passwordSchema,
  role: z.enum(['ADMIN', 'GESTIONNAIRE', 'LECTURE']).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis')  // No validation on login (any password accepted for verification)
});

/**
 * Password change schema
 * Used for password updates after initial registration
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: passwordSchema
});
