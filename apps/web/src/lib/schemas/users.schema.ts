import { z } from 'zod'
import { UserRole } from '@/lib/types/enums.ts'

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
  )

export const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  username: z.string().min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  password: passwordSchema,
  role: z.nativeEnum(UserRole, { message: 'Rôle invalide' }),
})

export const updateUserSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  username: z.string().min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères').optional(),
  role: z.nativeEnum(UserRole, { message: 'Rôle invalide' }).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: passwordSchema,
})

export type CreateUserFormData = z.infer<typeof createUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
