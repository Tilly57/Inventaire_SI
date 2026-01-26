/**
 * @fileoverview Unit tests for users.controller.js
 *
 * Tests HTTP layer behavior:
 * - Request/response handling
 * - Status codes
 * - CRUD operations
 * - Password management
 * - Role management
 * - Error handling
 * - Service integration
 */

import { jest } from '@jest/globals';

// Mock dependencies BEFORE imports
const mockGetAllUsers = jest.fn();
const mockGetUserById = jest.fn();
const mockCreateUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockDeleteUser = jest.fn();
const mockChangePassword = jest.fn();
const mockAsyncHandler = jest.fn((fn) => fn);

jest.unstable_mockModule('../../services/users.service.js', () => ({
  getAllUsers: mockGetAllUsers,
  getUserById: mockGetUserById,
  createUser: mockCreateUser,
  updateUser: mockUpdateUser,
  deleteUser: mockDeleteUser,
  changePassword: mockChangePassword
}));

jest.unstable_mockModule('../../middleware/asyncHandler.js', () => ({
  asyncHandler: mockAsyncHandler
}));

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword
} = await import('../users.controller.js');

describe('users.controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, query: {}, body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'admin@test.com', role: 'ADMIN' },
        { id: 'user-2', email: 'user@test.com', role: 'GESTIONNAIRE' }
      ];
      mockGetAllUsers.mockResolvedValue(mockUsers);

      await getAllUsers(req, res);

      expect(mockGetAllUsers).toHaveBeenCalledWith();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers
      });
    });

    it('should return empty array when no users exist', async () => {
      mockGetAllUsers.mockResolvedValue([]);

      await getAllUsers(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should handle service errors', async () => {
      mockGetAllUsers.mockRejectedValue(new Error('Database error'));

      await expect(getAllUsers(req, res)).rejects.toThrow('Database error');
    });
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      const mockUser = { id: 'user-1', email: 'admin@test.com', role: 'ADMIN' };
      req.params = { id: 'user-1' };
      mockGetUserById.mockResolvedValue(mockUser);

      await getUserById(req, res);

      expect(mockGetUserById).toHaveBeenCalledWith('user-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    it('should handle user not found', async () => {
      req.params = { id: 'non-existent' };
      mockGetUserById.mockRejectedValue(new Error('User not found'));

      await expect(getUserById(req, res)).rejects.toThrow('User not found');
    });
  });

  describe('createUser', () => {
    it('should create ADMIN user successfully', async () => {
      req.body = { email: 'admin@test.com', password: 'Pass123!', role: 'ADMIN' };
      const mockCreated = { id: 'user-new', email: 'admin@test.com', role: 'ADMIN' };
      mockCreateUser.mockResolvedValue(mockCreated);

      await createUser(req, res);

      expect(mockCreateUser).toHaveBeenCalledWith('admin@test.com', 'Pass123!', 'ADMIN', req);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreated
      });
    });

    it('should create GESTIONNAIRE user successfully', async () => {
      req.body = { email: 'gest@test.com', password: 'Pass123!', role: 'GESTIONNAIRE' };
      const mockCreated = { id: 'user-new', email: 'gest@test.com', role: 'GESTIONNAIRE' };
      mockCreateUser.mockResolvedValue(mockCreated);

      await createUser(req, res);

      expect(mockCreateUser).toHaveBeenCalledWith('gest@test.com', 'Pass123!', 'GESTIONNAIRE', req);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should create LECTURE user successfully', async () => {
      req.body = { email: 'read@test.com', password: 'Pass123!', role: 'LECTURE' };
      const mockCreated = { id: 'user-new', email: 'read@test.com', role: 'LECTURE' };
      mockCreateUser.mockResolvedValue(mockCreated);

      await createUser(req, res);

      expect(mockCreateUser).toHaveBeenCalledWith('read@test.com', 'Pass123!', 'LECTURE', req);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle missing email', async () => {
      req.body = { password: 'Pass123!', role: 'ADMIN' };
      mockCreateUser.mockRejectedValue(new Error('Email is required'));

      await expect(createUser(req, res)).rejects.toThrow('Email is required');
    });

    it('should handle missing password', async () => {
      req.body = { email: 'test@test.com', role: 'ADMIN' };
      mockCreateUser.mockRejectedValue(new Error('Password is required'));

      await expect(createUser(req, res)).rejects.toThrow('Password is required');
    });

    it('should handle invalid email format', async () => {
      req.body = { email: 'invalid-email', password: 'Pass123!', role: 'ADMIN' };
      mockCreateUser.mockRejectedValue(new Error('Invalid email format'));

      await expect(createUser(req, res)).rejects.toThrow('Invalid email format');
    });

    it('should handle duplicate email', async () => {
      req.body = { email: 'existing@test.com', password: 'Pass123!', role: 'ADMIN' };
      mockCreateUser.mockRejectedValue(new Error('Email already exists'));

      await expect(createUser(req, res)).rejects.toThrow('Email already exists');
    });

    it('should handle invalid role', async () => {
      req.body = { email: 'test@test.com', password: 'Pass123!', role: 'INVALID' };
      mockCreateUser.mockRejectedValue(new Error('Invalid role'));

      await expect(createUser(req, res)).rejects.toThrow('Invalid role');
    });

    it('should handle weak password', async () => {
      req.body = { email: 'test@test.com', password: 'weak', role: 'ADMIN' };
      mockCreateUser.mockRejectedValue(new Error('Password too weak'));

      await expect(createUser(req, res)).rejects.toThrow('Password too weak');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      req.params = { id: 'user-1' };
      req.body = { email: 'updated@test.com', role: 'ADMIN' };
      const mockUpdated = { id: 'user-1', email: 'updated@test.com', role: 'ADMIN' };
      mockUpdateUser.mockResolvedValue(mockUpdated);

      await updateUser(req, res);

      expect(mockUpdateUser).toHaveBeenCalledWith('user-1', req.body, req);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdated
      });
    });

    it('should update only email', async () => {
      req.params = { id: 'user-1' };
      req.body = { email: 'newemail@test.com' };
      mockUpdateUser.mockResolvedValue({ id: 'user-1', email: 'newemail@test.com' });

      await updateUser(req, res);

      expect(mockUpdateUser).toHaveBeenCalledWith('user-1', req.body, req);
    });

    it('should update only role', async () => {
      req.params = { id: 'user-1' };
      req.body = { role: 'LECTURE' };
      mockUpdateUser.mockResolvedValue({ id: 'user-1', role: 'LECTURE' });

      await updateUser(req, res);

      expect(mockUpdateUser).toHaveBeenCalledWith('user-1', req.body, req);
    });

    it('should handle user not found', async () => {
      req.params = { id: 'non-existent' };
      req.body = { email: 'test@test.com' };
      mockUpdateUser.mockRejectedValue(new Error('User not found'));

      await expect(updateUser(req, res)).rejects.toThrow('User not found');
    });

    it('should handle duplicate email', async () => {
      req.params = { id: 'user-1' };
      req.body = { email: 'existing@test.com' };
      mockUpdateUser.mockRejectedValue(new Error('Email already in use'));

      await expect(updateUser(req, res)).rejects.toThrow('Email already in use');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      req.params = { id: 'user-1' };
      mockDeleteUser.mockResolvedValue({ message: 'Utilisateur supprimé' });

      await deleteUser(req, res);

      expect(mockDeleteUser).toHaveBeenCalledWith('user-1', req);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Utilisateur supprimé' }
      });
    });

    it('should handle user not found', async () => {
      req.params = { id: 'non-existent' };
      mockDeleteUser.mockRejectedValue(new Error('User not found'));

      await expect(deleteUser(req, res)).rejects.toThrow('User not found');
    });

    it('should handle cannot delete last admin', async () => {
      req.params = { id: 'admin-1' };
      mockDeleteUser.mockRejectedValue(new Error('Cannot delete last admin'));

      await expect(deleteUser(req, res)).rejects.toThrow('Cannot delete last admin');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      req.params = { id: 'user-1' };
      req.body = { currentPassword: 'OldPass123!', newPassword: 'NewPass456!' };
      mockChangePassword.mockResolvedValue({ message: 'Mot de passe modifié' });

      await changePassword(req, res);

      expect(mockChangePassword).toHaveBeenCalledWith('user-1', 'OldPass123!', 'NewPass456!');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Mot de passe modifié' }
      });
    });

    it('should handle incorrect current password', async () => {
      req.params = { id: 'user-1' };
      req.body = { currentPassword: 'Wrong123!', newPassword: 'NewPass456!' };
      mockChangePassword.mockRejectedValue(new Error('Incorrect password'));

      await expect(changePassword(req, res)).rejects.toThrow('Incorrect password');
    });

    it('should handle user not found', async () => {
      req.params = { id: 'non-existent' };
      req.body = { currentPassword: 'Pass123!', newPassword: 'NewPass456!' };
      mockChangePassword.mockRejectedValue(new Error('User not found'));

      await expect(changePassword(req, res)).rejects.toThrow('User not found');
    });

    it('should handle weak new password', async () => {
      req.params = { id: 'user-1' };
      req.body = { currentPassword: 'OldPass123!', newPassword: 'weak' };
      mockChangePassword.mockRejectedValue(new Error('Password too weak'));

      await expect(changePassword(req, res)).rejects.toThrow('Password too weak');
    });
  });

  describe('HTTP layer behavior', () => {
    it('should handle async errors', async () => {
      req.params = { id: 'user-1' };
      mockGetUserById.mockRejectedValue(new Error('Database error'));

      await expect(getUserById(req, res)).rejects.toThrow('Database error');
    });

    it('should return consistent response format', async () => {
      mockGetAllUsers.mockResolvedValue([]);

      await getAllUsers(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });

    it('should use 201 status for creation', async () => {
      req.body = { email: 'new@test.com', password: 'Pass123!', role: 'ADMIN' };
      mockCreateUser.mockResolvedValue({ id: 'new' });

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
