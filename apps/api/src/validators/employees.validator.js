/**
 * Employee validation schemas
 */
import { z } from 'zod';

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide').optional().nullable(),
  dept: z.string().optional().nullable()
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').optional(),
  lastName: z.string().min(1, 'Nom requis').optional(),
  email: z.string().email('Email invalide').optional().nullable(),
  dept: z.string().optional().nullable()
});

export const bulkCreateEmployeesSchema = z.object({
  employees: z.array(createEmployeeSchema).min(1, 'Au moins un employé requis')
});
