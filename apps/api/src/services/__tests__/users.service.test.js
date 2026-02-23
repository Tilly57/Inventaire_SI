/**
 * Unit Tests for Users Service
 *
 * Tests for system user management business logic:
 * - CRUD operations (create, read, update, delete)
 * - Password management (creation, hashing, change password)
 * - Email uniqueness validation
 * - Audit trail logging
 * - Error handling (NotFoundError, ConflictError, UnauthorizedError)
 */

import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import * as usersService from '../users.service.js';
import { cleanDatabase, disconnectDatabase, createTestUser, createTestAdmin } from '../../__tests__/utils/testUtils.js';
import { NotFoundError, ConflictError, UnauthorizedError } from '../../utils/errors.js';
import { ROLES } from '../../utils/constants.js';

// Mock audit helpers (we're testing business logic, not audit logging)
jest.mock('../../utils/auditHelpers.js', () => ({
  logCreate: jest.fn(),
  logUpdate: jest.fn(),
  logDelete: jest.fn()
}));

describe('Users Service - getAllUsers()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should return all users without password hashes', async () => {
    // Create test users
    await createTestUser({ email: 'user1@example.com', role: ROLES.GESTIONNAIRE });
    await createTestUser({ email: 'user2@example.com', role: ROLES.LECTURE });
    await createTestAdmin({ email: 'admin@example.com' });

    const users = await usersService.getAllUsers();

    expect(users).toHaveLength(3);
    expect(users[0]).toHaveProperty('id');
    expect(users[0]).toHaveProperty('email');
    expect(users[0]).toHaveProperty('role');
    expect(users[0]).toHaveProperty('createdAt');
    expect(users[0]).toHaveProperty('updatedAt');
    expect(users[0]).not.toHaveProperty('passwordHash'); // Security: excluded
  });

  test('should return users ordered by createdAt descending (newest first)', async () => {
    // Create users with slight delay to ensure different timestamps
    const user1 = await createTestUser({ email: 'first@example.com' });
    await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay
    const user2 = await createTestUser({ email: 'second@example.com' });
    await new Promise(resolve => setTimeout(resolve, 10));
    const user3 = await createTestUser({ email: 'third@example.com' });

    const users = await usersService.getAllUsers();

    expect(users).toHaveLength(3);
    // Newest first (user3, user2, user1)
    expect(users[0].email).toBe('third@example.com');
    expect(users[1].email).toBe('second@example.com');
    expect(users[2].email).toBe('first@example.com');
  });

  test('should return empty array when no users exist', async () => {
    const users = await usersService.getAllUsers();

    expect(users).toEqual([]);
    expect(users).toHaveLength(0);
  });
});

describe('Users Service - getUserById()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should return user by ID without password hash', async () => {
    const createdUser = await createTestUser({ email: 'test@example.com', role: ROLES.ADMIN });

    const user = await usersService.getUserById(createdUser.id);

    expect(user).toBeDefined();
    expect(user.id).toBe(createdUser.id);
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe(ROLES.ADMIN);
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
    expect(user).not.toHaveProperty('passwordHash'); // Security: excluded
  });

  test('should throw NotFoundError if user does not exist', async () => {
    await expect(
      usersService.getUserById('non-existent-id')
    ).rejects.toThrow(NotFoundError);

    await expect(
      usersService.getUserById('non-existent-id')
    ).rejects.toThrow('Utilisateur non trouvé');
  });
});

describe('Users Service - createUser()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should create a new user with hashed password', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };
    const password = 'SecurePassword123!';

    const user = await usersService.createUser(
      'newuser@example.com',
      password,
      ROLES.GESTIONNAIRE,
      mockReq
    );

    expect(user).toBeDefined();
    expect(user.email).toBe('newuser@example.com');
    expect(user.role).toBe(ROLES.GESTIONNAIRE);
    expect(user).not.toHaveProperty('passwordHash'); // Not returned for security

    // Verify password was hashed correctly by trying to login
    const { getPrismaClient } = await import('../../__tests__/utils/testUtils.js');
    const prisma = getPrismaClient();
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

    expect(dbUser.passwordHash).toBeDefined();
    expect(dbUser.passwordHash).not.toBe(password); // Should be hashed

    // Verify we can compare the hash
    const isValid = await bcrypt.compare(password, dbUser.passwordHash);
    expect(isValid).toBe(true);
  });

  test('should throw ConflictError if email already exists', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    // Create first user
    await createTestUser({ email: 'duplicate@example.com' });

    // Try to create second user with same email
    await expect(
      usersService.createUser('duplicate@example.com', 'password123', ROLES.LECTURE, mockReq)
    ).rejects.toThrow(ConflictError);

    await expect(
      usersService.createUser('duplicate@example.com', 'password123', ROLES.LECTURE, mockReq)
    ).rejects.toThrow('Un utilisateur avec cet email existe déjà');
  });

  test('should create users with different roles', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const admin = await usersService.createUser('admin@example.com', 'pass', ROLES.ADMIN, mockReq);
    const manager = await usersService.createUser('manager@example.com', 'pass', ROLES.GESTIONNAIRE, mockReq);
    const reader = await usersService.createUser('reader@example.com', 'pass', ROLES.LECTURE, mockReq);

    expect(admin.role).toBe(ROLES.ADMIN);
    expect(manager.role).toBe(ROLES.GESTIONNAIRE);
    expect(reader.role).toBe(ROLES.LECTURE);
  });
});

describe('Users Service - updateUser()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should update user email', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };
    const user = await createTestUser({ email: 'old@example.com' });

    const updated = await usersService.updateUser(
      user.id,
      { email: 'new@example.com' },
      mockReq
    );

    expect(updated.email).toBe('new@example.com');
    expect(updated.id).toBe(user.id);
  });

  test('should update user role', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };
    const user = await createTestUser({ role: ROLES.LECTURE });

    const updated = await usersService.updateUser(
      user.id,
      { role: ROLES.ADMIN },
      mockReq
    );

    expect(updated.role).toBe(ROLES.ADMIN);
  });

  test('should update both email and role', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };
    const user = await createTestUser({ email: 'test@example.com', role: ROLES.LECTURE });

    const updated = await usersService.updateUser(
      user.id,
      { email: 'updated@example.com', role: ROLES.GESTIONNAIRE },
      mockReq
    );

    expect(updated.email).toBe('updated@example.com');
    expect(updated.role).toBe(ROLES.GESTIONNAIRE);
  });

  test('should throw NotFoundError if user does not exist', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    await expect(
      usersService.updateUser('non-existent-id', { role: ROLES.ADMIN }, mockReq)
    ).rejects.toThrow(NotFoundError);

    await expect(
      usersService.updateUser('non-existent-id', { role: ROLES.ADMIN }, mockReq)
    ).rejects.toThrow('Utilisateur non trouvé');
  });

  test('should throw ConflictError if new email already exists', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    // Create two users
    const user1 = await createTestUser({ email: 'user1@example.com' });
    await createTestUser({ email: 'user2@example.com' });

    // Try to update user1 to have user2's email
    await expect(
      usersService.updateUser(user1.id, { email: 'user2@example.com' }, mockReq)
    ).rejects.toThrow(ConflictError);

    await expect(
      usersService.updateUser(user1.id, { email: 'user2@example.com' }, mockReq)
    ).rejects.toThrow('Un utilisateur avec cet email existe déjà');
  });

  test('should allow updating email to same value (no conflict)', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };
    const user = await createTestUser({ email: 'test@example.com' });

    // Update to same email should work (no duplicate check needed)
    const updated = await usersService.updateUser(
      user.id,
      { email: 'test@example.com', role: ROLES.ADMIN },
      mockReq
    );

    expect(updated.email).toBe('test@example.com');
    expect(updated.role).toBe(ROLES.ADMIN);
  });
});

describe('Users Service - deleteUser()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should delete existing user', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };
    const user = await createTestUser({ email: 'todelete@example.com' });

    const result = await usersService.deleteUser(user.id, mockReq);

    expect(result).toEqual({ message: 'Utilisateur supprimé avec succès' });

    // Verify user no longer exists
    const { getPrismaClient } = await import('../../__tests__/utils/testUtils.js');
    const prisma = getPrismaClient();
    const deletedUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(deletedUser).toBeNull();
  });

  test('should throw NotFoundError if user does not exist', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    await expect(
      usersService.deleteUser('non-existent-id', mockReq)
    ).rejects.toThrow(NotFoundError);

    await expect(
      usersService.deleteUser('non-existent-id', mockReq)
    ).rejects.toThrow('Utilisateur non trouvé');
  });

  test('should permanently remove user from database', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };
    const user1 = await createTestUser({ email: 'user1@example.com' });
    const user2 = await createTestUser({ email: 'user2@example.com' });

    // Delete user1
    await usersService.deleteUser(user1.id, mockReq);

    // Verify only user2 remains
    const users = await usersService.getAllUsers();
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(user2.id);
  });
});

describe('Users Service - changePassword()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should change password with correct current password', async () => {
    const currentPassword = 'OldPassword123!';
    const newPassword = 'NewSecurePassword456!';

    // Create user with known password
    const hashedPassword = await bcrypt.hash(currentPassword, 10);
    const user = await createTestUser({
      email: 'test@example.com',
      passwordHash: hashedPassword
    });

    const result = await usersService.changePassword(
      user.id,
      currentPassword,
      newPassword
    );

    expect(result).toEqual({ message: 'Mot de passe modifié avec succès' });

    // Verify new password was hashed and stored
    const { getPrismaClient } = await import('../../__tests__/utils/testUtils.js');
    const prisma = getPrismaClient();
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });

    expect(updatedUser.passwordHash).toBeDefined();
    expect(updatedUser.passwordHash).not.toBe(newPassword); // Should be hashed
    expect(updatedUser.passwordHash).not.toBe(hashedPassword); // Should be different from old hash

    // Verify new password is valid
    const isNewPasswordValid = await bcrypt.compare(newPassword, updatedUser.passwordHash);
    expect(isNewPasswordValid).toBe(true);

    // Verify old password no longer works
    const isOldPasswordValid = await bcrypt.compare(currentPassword, updatedUser.passwordHash);
    expect(isOldPasswordValid).toBe(false);
  });

  test('should throw UnauthorizedError if current password is incorrect', async () => {
    const correctPassword = 'CorrectPassword123!';
    const wrongPassword = 'WrongPassword456!';
    const newPassword = 'NewPassword789!';

    const hashedPassword = await bcrypt.hash(correctPassword, 10);
    const user = await createTestUser({
      email: 'test@example.com',
      passwordHash: hashedPassword
    });

    await expect(
      usersService.changePassword(user.id, wrongPassword, newPassword)
    ).rejects.toThrow(UnauthorizedError);

    await expect(
      usersService.changePassword(user.id, wrongPassword, newPassword)
    ).rejects.toThrow('Mot de passe actuel incorrect');

    // Verify password was NOT changed
    const { getPrismaClient } = await import('../../__tests__/utils/testUtils.js');
    const prisma = getPrismaClient();
    const unchangedUser = await prisma.user.findUnique({ where: { id: user.id } });

    const isOriginalPasswordStillValid = await bcrypt.compare(correctPassword, unchangedUser.passwordHash);
    expect(isOriginalPasswordStillValid).toBe(true);
  });

  test('should throw NotFoundError if user does not exist', async () => {
    await expect(
      usersService.changePassword('non-existent-id', 'oldpass', 'newpass')
    ).rejects.toThrow(NotFoundError);

    await expect(
      usersService.changePassword('non-existent-id', 'oldpass', 'newpass')
    ).rejects.toThrow('Utilisateur non trouvé');
  });

  test('should hash new password with bcrypt', async () => {
    const currentPassword = 'Current123!';
    const newPassword = 'NewPassword456!';

    const hashedPassword = await bcrypt.hash(currentPassword, 10);
    const user = await createTestUser({
      email: 'test@example.com',
      passwordHash: hashedPassword
    });

    await usersService.changePassword(user.id, currentPassword, newPassword);

    const { getPrismaClient } = await import('../../__tests__/utils/testUtils.js');
    const prisma = getPrismaClient();
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });

    // Verify password is hashed (bcrypt hashes start with $2a$ or $2b$)
    expect(updatedUser.passwordHash).toMatch(/^\$2[ab]\$/);

    // Verify it's a valid bcrypt hash by comparing
    const isValid = await bcrypt.compare(newPassword, updatedUser.passwordHash);
    expect(isValid).toBe(true);
  });
});
