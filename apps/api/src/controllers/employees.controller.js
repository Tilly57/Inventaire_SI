/**
 * @fileoverview Employees controllers - HTTP request handlers
 *
 * This module provides:
 * - Employee CRUD operations (create, read, update, delete)
 * - Employee listing with loan history
 * - Excel import functionality (handled by separate endpoint)
 *
 * Business Rules:
 * - Email is unique (enforced by Prisma schema)
 * - Cannot delete employees with loan history (data integrity)
 * - All employees can borrow equipment regardless of department
 */
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as employeesService from '../services/employees.service.js';

/**
 * Get all employees
 *
 * Route: GET /api/employees
 * Access: Protected (requires authentication)
 *
 * Returns list of all employees ordered by creation date (newest first).
 * Includes loan count for each employee.
 *
 * @returns {Object} 200 - Array of employee objects
 *
 * @example
 * GET /api/employees
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "ckx...",
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "email": "john.doe@example.com",
 *       "department": "IT",
 *       "phone": "+33612345678",
 *       "_count": { "loans": 3 },
 *       "createdAt": "2024-01-15T10:00:00Z"
 *     }
 *   ]
 * }
 */
export const getAllEmployees = asyncHandler(async (req, res) => {
  const employees = await employeesService.getAllEmployees();

  res.json({
    success: true,
    data: employees
  });
});

/**
 * Get employee by ID
 *
 * Route: GET /api/employees/:id
 * Access: Protected (requires authentication)
 *
 * Returns single employee with full loan history (including loan lines
 * and equipment details).
 *
 * @param {string} req.params.id - Employee ID
 *
 * @returns {Object} 200 - Employee object with loans
 * @returns {Object} 404 - Employee not found
 *
 * @example
 * GET /api/employees/ckx123
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "ckx123",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "email": "john.doe@example.com",
 *     "department": "IT",
 *     "phone": "+33612345678",
 *     "loans": [
 *       {
 *         "id": "ckx456",
 *         "status": "OPEN",
 *         "lines": [
 *           { "assetItem": { "assetTag": "LAP-001" } }
 *         ],
 *         "createdAt": "2024-01-15T10:00:00Z"
 *       }
 *     ]
 *   }
 * }
 */
export const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await employeesService.getEmployeeById(req.params.id);

  res.json({
    success: true,
    data: employee
  });
});

/**
 * Create a new employee
 *
 * Route: POST /api/employees
 * Access: Protected (requires authentication)
 *
 * Creates a new employee record. Email must be unique.
 *
 * @param {Object} req.body - Employee data
 * @param {string} req.body.firstName - Employee first name
 * @param {string} req.body.lastName - Employee last name
 * @param {string} req.body.email - Employee email (unique)
 * @param {string} [req.body.department] - Department name
 * @param {string} [req.body.phone] - Phone number
 *
 * @returns {Object} 201 - Created employee object
 * @returns {Object} 400 - Validation error (invalid data)
 * @returns {Object} 409 - Conflict (email already exists)
 *
 * @example
 * POST /api/employees
 * {
 *   "firstName": "Jane",
 *   "lastName": "Smith",
 *   "email": "jane.smith@example.com",
 *   "department": "HR",
 *   "phone": "+33698765432"
 * }
 *
 * Response 201:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "ckx789",
 *     "firstName": "Jane",
 *     "lastName": "Smith",
 *     "email": "jane.smith@example.com",
 *     "department": "HR",
 *     "phone": "+33698765432",
 *     "createdAt": "2024-01-15T11:00:00Z"
 *   }
 * }
 */
export const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeesService.createEmployee(req.body);

  res.status(201).json({
    success: true,
    data: employee
  });
});

/**
 * Bulk create employees
 *
 * Route: POST /api/employees/bulk
 * Access: Protected (requires authentication)
 *
 * Creates multiple employees in a single request. Skips employees with
 * duplicate emails (both with existing database records and within the batch).
 *
 * @param {Object} req.body - Bulk creation data
 * @param {Array} req.body.employees - Array of employee objects
 *
 * @returns {Object} 201 - Bulk creation result
 *
 * @example
 * POST /api/employees/bulk
 * {
 *   "employees": [
 *     { "firstName": "Jane", "lastName": "Smith", "email": "jane@example.com" },
 *     { "firstName": "John", "lastName": "Doe", "email": "john@example.com" }
 *   ]
 * }
 *
 * Response 201:
 * {
 *   "success": true,
 *   "data": {
 *     "created": 2,
 *     "skipped": 0,
 *     "errors": []
 *   }
 * }
 */
export const bulkCreateEmployees = asyncHandler(async (req, res) => {
  const result = await employeesService.bulkCreateEmployees(req.body.employees);

  res.status(201).json({
    success: true,
    data: result
  });
});

/**
 * Update an existing employee
 *
 * Route: PATCH /api/employees/:id
 * Access: Protected (requires authentication)
 *
 * Updates employee information. All fields are optional.
 * Email must remain unique if changed.
 *
 * @param {string} req.params.id - Employee ID
 * @param {Object} req.body - Updated employee data
 * @param {string} [req.body.firstName] - Updated first name
 * @param {string} [req.body.lastName] - Updated last name
 * @param {string} [req.body.email] - Updated email (must be unique)
 * @param {string} [req.body.department] - Updated department
 * @param {string} [req.body.phone] - Updated phone number
 *
 * @returns {Object} 200 - Updated employee object
 * @returns {Object} 404 - Employee not found
 * @returns {Object} 409 - Conflict (email already used by another employee)
 *
 * @example
 * PATCH /api/employees/ckx123
 * {
 *   "department": "Engineering",
 *   "phone": "+33611223344"
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "ckx123",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "email": "john.doe@example.com",
 *     "department": "Engineering",
 *     "phone": "+33611223344",
 *     "updatedAt": "2024-01-16T09:00:00Z"
 *   }
 * }
 */
export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeesService.updateEmployee(req.params.id, req.body);

  res.json({
    success: true,
    data: employee
  });
});

/**
 * Delete an employee
 *
 * Route: DELETE /api/employees/:id
 * Access: Protected (requires authentication)
 *
 * Deletes an employee record. IMPORTANT: Cannot delete employees with
 * loan history (maintains audit trail and data integrity).
 *
 * @param {string} req.params.id - Employee ID
 *
 * @returns {Object} 200 - Success message
 * @returns {Object} 404 - Employee not found
 * @returns {Object} 400 - Cannot delete employee with loans
 *
 * @example
 * DELETE /api/employees/ckx123
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": { "message": "Employé supprimé avec succès" }
 * }
 *
 * Response 400 (has loans):
 * {
 *   "success": false,
 *   "error": "Impossible de supprimer un employé qui a des prêts"
 * }
 */
export const deleteEmployee = asyncHandler(async (req, res) => {
  const result = await employeesService.deleteEmployee(req.params.id);

  res.json({
    success: true,
    data: result
  });
});
