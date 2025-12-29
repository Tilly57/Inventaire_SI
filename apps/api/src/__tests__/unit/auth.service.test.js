/**
 * Unit Tests for Auth Service
 *
 * Tests for authentication business logic
 */

import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import * as authService from '../../services/auth.service.js';
import { cleanDatabase, disconnectDatabase, createTestUser } from '../utils/testUtils.js';
import { ConflictError, UnauthorizedError } from '../../utils/errors.js';
import { ROLES } from '../../utils/constants.js';

describe('Auth Service - register()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should register first user as ADMIN automatically', async () => {
    const user = await authService.register(
      'first@example.com',
      'password123',
      ROLES.GESTIONNAIRE
    );

    expect(user).toBeDefined();
    expect(user.email).toBe('first@example.com');
    expect(user.role).toBe(ROLES.ADMIN); // Auto-promoted
    expect(user.passwordHash).toBeUndefined(); // Should be excluded
  });

  test('should register second user with specified role', async () => {
    // Create first user
    await authService.register('first@example.com', 'password123', ROLES.GESTIONNAIRE);

    // Create second user
    const user = await authService.register(
      'second@example.com',
      'password123',
      ROLES.GESTIONNAIRE
    );

    expect(user).toBeDefined();
    expect(user.email).toBe('second@example.com');
    expect(user.role).toBe(ROLES.GESTIONNAIRE); // NOT auto-promoted
  });

  test('should throw ConflictError if email already exists', async () => {
    await authService.register('test@example.com', 'password123');

    await expect(
      authService.register('test@example.com', 'another-password')
    ).rejects.toThrow(ConflictError);
  });

  test('should hash password before storing', async () => {
    const password = 'mySecretPassword123';
    const user = await authService.register('test@example.com', password);

    // Password should be hashed, not stored in plain text
    expect(user.passwordHash).toBeUndefined(); // Not returned

    // Verify we can login with the password (implicitly tests hashing worked)
    const loginResult = await authService.login('test@example.com', password);
    expect(loginResult.user.id).toBe(user.id);
  });

  test('should default to GESTIONNAIRE role if not specified', async () => {
    // Create first admin user
    await authService.register('admin@example.com', 'password123');

    // Create user without specifying role
    const user = await authService.register('test@example.com', 'password123');

    expect(user.role).toBe(ROLES.GESTIONNAIRE);
  });
});

describe('Auth Service - login()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should login with correct credentials', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    await authService.register(email, password);
    const result = await authService.login(email, password);

    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(email);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  test('should throw UnauthorizedError with wrong password', async () => {
    const email = 'test@example.com';
    await authService.register(email, 'correct-password');

    await expect(
      authService.login(email, 'wrong-password')
    ).rejects.toThrow(UnauthorizedError);
  });

  test('should throw UnauthorizedError with non-existent email', async () => {
    await expect(
      authService.login('nonexistent@example.com', 'password123')
    ).rejects.toThrow(UnauthorizedError);
  });

  test('should return user without password hash', async () => {
    const email = 'test@example.com';
    await authService.register(email, 'password123');
    const result = await authService.login(email, 'password123');

    expect(result.user.passwordHash).toBeUndefined();
    expect(result.user.email).toBe(email);
    expect(result.user.role).toBeDefined();
  });

  test('should generate valid JWT tokens', async () => {
    const email = 'test@example.com';
    await authService.register(email, 'password123');
    const result = await authService.login(email, 'password123');

    // Tokens should be non-empty strings
    expect(typeof result.accessToken).toBe('string');
    expect(result.accessToken.length).toBeGreaterThan(20);
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken.length).toBeGreaterThan(20);

    // Tokens should be different
    expect(result.accessToken).not.toBe(result.refreshToken);
  });
});

describe('Auth Service - Error Messages', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should return generic error for security (no email enumeration)', async () => {
    // Login with non-existent email should return same error as wrong password
    try {
      await authService.login('nonexistent@example.com', 'password');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Email ou mot de passe incorrect');
    }

    // Create user and test wrong password
    await authService.register('test@example.com', 'correct');

    try {
      await authService.login('test@example.com', 'wrong');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Email ou mot de passe incorrect');
    }
  });
});
