import { z } from 'zod'
import { UserRole } from '@/lib/types/enums.ts'

export const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  username: z.string().min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  role: z.nativeEnum(UserRole, { message: 'Rôle invalide' }),
})

export const updateUserSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  username: z.string().min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères').optional(),
  role: z.nativeEnum(UserRole, { message: 'Rôle invalide' }).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
})

export type CreateUserFormData = z.infer<typeof createUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
