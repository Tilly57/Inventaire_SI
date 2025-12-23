/**
 * Employees controllers - HTTP handlers
 */
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as employeesService from '../services/employees.service.js';

/**
 * GET /api/employees
 */
export const getAllEmployees = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;

  const result = await employeesService.getAllEmployees(
    parseInt(page),
    parseInt(limit),
    search
  );

  res.json({
    success: true,
    data: result
  });
});

/**
 * GET /api/employees/:id
 */
export const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await employeesService.getEmployeeById(req.params.id);

  res.json({
    success: true,
    data: employee
  });
});

/**
 * POST /api/employees
 */
export const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeesService.createEmployee(req.body);

  res.status(201).json({
    success: true,
    data: employee
  });
});

/**
 * PATCH /api/employees/:id
 */
export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeesService.updateEmployee(req.params.id, req.body);

  res.json({
    success: true,
    data: employee
  });
});

/**
 * DELETE /api/employees/:id
 */
export const deleteEmployee = asyncHandler(async (req, res) => {
  const result = await employeesService.deleteEmployee(req.params.id);

  res.json({
    success: true,
    data: result
  });
});
