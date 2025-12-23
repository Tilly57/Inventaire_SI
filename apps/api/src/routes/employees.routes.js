/**
 * Employees routes - ADMIN and GESTIONNAIRE
 */
import express from 'express';
import { getAllEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee } from '../controllers/employees.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireManager } from '../middleware/rbac.js';
import { validate } from '../middleware/validateRequest.js';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employees.validator.js';

const router = express.Router();

// All employee routes require authentication and ADMIN or GESTIONNAIRE role
router.use(requireAuth, requireManager);

router.get('/', getAllEmployees);
router.get('/:id', getEmployeeById);
router.post('/', validate(createEmployeeSchema), createEmployee);
router.patch('/:id', validate(updateEmployeeSchema), updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;
