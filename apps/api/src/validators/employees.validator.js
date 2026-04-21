/**
 * Employee validation schemas
 */
import { z } from 'zod';

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(100, 'Le prénom ne peut pas dépasser 100 caractères'),
  lastName: z.string().min(1, 'Nom requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string().email('Email invalide').max(255, 'L\'email ne peut pas dépasser 255 caractères').optional().nullable(),
  dept: z.string().max(100, 'Le département ne peut pas dépasser 100 caractères').optional().nullable(),
  managerId: z.string().cuid('ID manager invalide').optional().nullable()
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(100, 'Le prénom ne peut pas dépasser 100 caractères').optional(),
  lastName: z.string().min(1, 'Nom requis').max(100, 'Le nom ne peut pas dépasser 100 caractères').optional(),
  email: z.string().email('Email invalide').max(255, 'L\'email ne peut pas dépasser 255 caractères').optional().nullable(),
  dept: z.string().max(100, 'Le département ne peut pas dépasser 100 caractères').optional().nullable(),
  managerId: z.string().cuid('ID manager invalide').optional().nullable()
});

export const bulkCreateEmployeesSchema = z.object({
  employees: z.array(createEmployeeSchema).min(1, 'Au moins un employé requis')
});
