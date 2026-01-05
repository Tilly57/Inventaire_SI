/**
 * Unit tests for auth.service.js
 * Tests the authentication service including:
 * - User registration with password hashing
 * - User login with credential verification
 * - JWT token generation
 * - First user auto-promotion to ADMIN
 * - Error handling for invalid credentials
 */

import { jest } from '@jest/globals';
import { UnauthorizedError, ConflictError } from '../../utils/errors.js';
import { ROLES } from '../../utils/constants.js';

// Mock Prisma client before importing service
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
};

// Mock bcrypt
const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
};

// Mock JWT utilities
const mockJwt = {
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
};

// Set up mocks before importing service
jest.unstable_mockModule('../../config/database.js', () => ({
  default: mockPrisma
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: mockBcrypt
}));

jest.unstable_mockModule('../../utils/jwt.js', () => mockJwt);

// Import service after mocks are set up
const { register, login, getCurrentUser } = await import('../auth.service.js');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockEmail = 'test@example.com';
    const mockPassword = 'password123';
    const mockPasswordHash = '$2a$10$hashedpassword';
    const mockAccessToken = 'mock-access-token';
    const mockRefreshToken = 'mock-refresh-token';

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user1',
        email: mockEmail,
        role: ROLES.GESTIONNAIRE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
      mockPrisma.user.count.mockResolvedValue(1); // Not first user
      mockBcrypt.hash.mockResolvedValue(mockPasswordHash);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockJwt.generateAccessToken.mockReturnValue(mockAccessToken);
      mockJwt.generateRefreshToken.mockReturnValue(mockRefreshToken);

      const result = await register(mockEmail, mockPassword);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail }
      });
      expect(mockPrisma.user.count).toHaveBeenCalled();
      expect(mockBcrypt.hash).toHaveBeenCalledWith(mockPassword, expect.any(Number));
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: mockEmail,
          passwordHash: mockPasswordHash,
          role: ROLES.GESTIONNAIRE,
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      expect(mockJwt.generateAccessToken).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockUser.role
      );
      expect(mockJwt.generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        }
      });
    });

    it('should auto-promote first user to ADMIN', async () => {
      const mockUser = {
        id: 'user1',
        email: mockEmail,
        role: ROLES.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(0); // First user
      mockBcrypt.hash.mockResolvedValue(mockPasswordHash);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockJwt.generateAccessToken.mockReturnValue(mockAccessToken);
      mockJwt.generateRefreshToken.mockReturnValue(mockRefreshToken);

      const result = await register(mockEmail, mockPassword, ROLES.GESTIONNAIRE);

      expect(mockPrisma.user.count).toHaveBeenCalled();
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: ROLES.ADMIN, // Should be promoted to ADMIN
          })
        })
      );
      expect(result.user.role).toBe(ROLES.ADMIN);
    });

    it('should respect specified role for non-first users', async () => {
      const mockUser = {
        id: 'user2',
        email: mockEmail,
        role: ROLES.LECTURE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(5); // Not first user
      mockBcrypt.hash.mockResolvedValue(mockPasswordHash);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockJwt.generateAccessToken.mockReturnValue(mockAccessToken);
      mockJwt.generateRefreshToken.mockReturnValue(mockRefreshToken);

      await register(mockEmail, mockPassword, ROLES.LECTURE);

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: ROLES.LECTURE,
          })
        })
      );
    });

    it('should throw ConflictError if email already exists', async () => {
      const existingUser = {
        id: 'existing1',
        email: mockEmail,
        passwordHash: mockPasswordHash,
        role: ROLES.ADMIN,
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(register(mockEmail, mockPassword))
        .rejects.toThrow(ConflictError);
      await expect(register(mockEmail, mockPassword))
        .rejects.toThrow('Un utilisateur avec cet email existe déjà');

      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should use default GESTIONNAIRE role when not specified', async () => {
      const mockUser = {
        id: 'user3',
        email: mockEmail,
        role: ROLES.GESTIONNAIRE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(1); // Not first user
      mockBcrypt.hash.mockResolvedValue(mockPasswordHash);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockJwt.generateAccessToken.mockReturnValue(mockAccessToken);
      mockJwt.generateRefreshToken.mockReturnValue(mockRefreshToken);

      await register(mockEmail, mockPassword); // No role specified

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: ROLES.GESTIONNAIRE,
          })
        })
      );
    });
  });

  describe('login', () => {
    const mockEmail = 'user@example.com';
    const mockPassword = 'password123';
    const mockPasswordHash = '$2a$10$hashedpassword';
    const mockAccessToken = 'mock-access-token';
    const mockRefreshToken = 'mock-refresh-token';

    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user1',
        email: mockEmail,
        passwordHash: mockPasswordHash,
        role: ROLES.GESTIONNAIRE,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true); // Password matches
      mockJwt.generateAccessToken.mockReturnValue(mockAccessToken);
      mockJwt.generateRefreshToken.mockReturnValue(mockRefreshToken);

      const result = await login(mockEmail, mockPassword);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail }
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(mockPassword, mockPasswordHash);
      expect(mockJwt.generateAccessToken).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockUser.role
      );
      expect(mockJwt.generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        }
      });
    });

    it('should throw UnauthorizedError if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(login(mockEmail, mockPassword))
        .rejects.toThrow(UnauthorizedError);
      await expect(login(mockEmail, mockPassword))
        .rejects.toThrow('Email ou mot de passe incorrect');

      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwt.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if password is incorrect', async () => {
      const mockUser = {
        id: 'user1',
        email: mockEmail,
        passwordHash: mockPasswordHash,
        role: ROLES.ADMIN,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false); // Password doesn't match

      await expect(login(mockEmail, mockPassword))
        .rejects.toThrow(UnauthorizedError);
      await expect(login(mockEmail, mockPassword))
        .rejects.toThrow('Email ou mot de passe incorrect');

      expect(mockBcrypt.compare).toHaveBeenCalledWith(mockPassword, mockPasswordHash);
      expect(mockJwt.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should return correct user roles in response', async () => {
      const adminUser = {
        id: 'admin1',
        email: 'admin@example.com',
        passwordHash: mockPasswordHash,
        role: ROLES.ADMIN,
      };

      mockPrisma.user.findUnique.mockResolvedValue(adminUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.generateAccessToken.mockReturnValue(mockAccessToken);
      mockJwt.generateRefreshToken.mockReturnValue(mockRefreshToken);

      const result = await login('admin@example.com', mockPassword);

      expect(result.user.role).toBe(ROLES.ADMIN);
      expect(mockJwt.generateAccessToken).toHaveBeenCalledWith(
        adminUser.id,
        adminUser.email,
        ROLES.ADMIN
      );
    });

    it('should not expose password hash in response', async () => {
      const mockUser = {
        id: 'user1',
        email: mockEmail,
        passwordHash: mockPasswordHash,
        role: ROLES.GESTIONNAIRE,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.generateAccessToken.mockReturnValue(mockAccessToken);
      mockJwt.generateRefreshToken.mockReturnValue(mockRefreshToken);

      const result = await login(mockEmail, mockPassword);

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data by ID', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user@example.com',
        role: ROLES.GESTIONNAIRE,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await getCurrentUser('user1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedError if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(getCurrentUser('nonexistent'))
        .rejects.toThrow(UnauthorizedError);
      await expect(getCurrentUser('nonexistent'))
        .rejects.toThrow('Utilisateur non trouvé');
    });

    it('should not return password hash in select', async () => {
      const mockUserWithPassword = {
        id: 'user1',
        email: 'user@example.com',
        role: ROLES.ADMIN,
        passwordHash: '$2a$10$hashedpassword', // This shouldn't be selected
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Prisma select should exclude passwordHash
      const mockUserWithoutPassword = {
        id: mockUserWithPassword.id,
        email: mockUserWithPassword.email,
        role: mockUserWithPassword.role,
        createdAt: mockUserWithPassword.createdAt,
        updatedAt: mockUserWithPassword.updatedAt,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithoutPassword);

      const result = await getCurrentUser('user1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        select: expect.objectContaining({
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        })
      });
      // Ensure passwordHash is not in select
      expect(mockPrisma.user.findUnique.mock.calls[0][0].select).not.toHaveProperty('passwordHash');
    });

    it('should return all user roles correctly', async () => {
      const roles = [ROLES.ADMIN, ROLES.GESTIONNAIRE, ROLES.LECTURE];

      for (const role of roles) {
        const mockUser = {
          id: `user-${role}`,
          email: `${role}@example.com`,
          role: role,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const result = await getCurrentUser(`user-${role}`);

        expect(result.role).toBe(role);
      }
    });
  });
});
