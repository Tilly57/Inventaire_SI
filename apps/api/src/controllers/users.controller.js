/**
 * Users controllers - HTTP handlers
 */
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as usersService from '../services/users.service.js';
import { sendSuccess, sendCreated } from '../utils/responseHelpers.js';

/**
 * GET /api/users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await usersService.getAllUsers();

  sendSuccess(res, users);
});

/**
 * GET /api/users/:id
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await usersService.getUserById(req.params.id);

  sendSuccess(res, user);
});

/**
 * POST /api/users
 */
export const createUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const user = await usersService.createUser(email, password, role, req);

  sendCreated(res, user);
});

/**
 * PATCH /api/users/:id
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await usersService.updateUser(req.params.id, req.body, req);

  sendSuccess(res, user);
});

/**
 * DELETE /api/users/:id
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const result = await usersService.deleteUser(req.params.id, req);

  sendSuccess(res, result);
});

/**
 * PATCH /api/users/:id/password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const result = await usersService.changePassword(req.params.id, currentPassword, newPassword);

  sendSuccess(res, result);
});
