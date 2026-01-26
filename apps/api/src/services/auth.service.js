/**
 * @fileoverview Authentication service - Business logic for user authentication
 *
 * This service handles:
 * - User registration with password hashing
 * - User login with credential verification
 * - JWT token generation (access and refresh tokens)
 * - First user auto-promotion to ADMIN
 * - User logout with token revocation (Phase 2)
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { UnauthorizedError, ConflictError } from '../utils/errors.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { BCRYPT_SALT_ROUNDS, ROLES } from '../utils/constants.js';
import { blacklistToken } from './cache.service.js';

/**
 * Register a new user in the system
 *
 * Special behavior: The first user created is automatically assigned ADMIN role.
 * Subsequent users receive the role specified in the parameter.
 *
 * @param {string} email - User email address (must be unique)
 * @param {string} password - Plain text password (will be hashed)
 * @param {string} [role=ROLES.GESTIONNAIRE] - User role (ADMIN, GESTIONNAIRE, or LECTURE)
 * @returns {Promise<Object>} Object containing accessToken, refreshToken, and user data
 * @throws {ConflictError} If email is already registered
 *
 * @example
 * const { accessToken, refreshToken, user } = await register('admin@example.com', 'password123', ROLES.ADMIN);
 */
export async function register(email, password, role = ROLES.GESTIONNAIRE) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('Un utilisateur avec cet email existe déjà');
  }

  // Auto-promote first user to ADMIN for initial setup
  const userCount = await prisma.user.count();
  const userRole = userCount === 0 ? ROLES.ADMIN : role;

  // Hash password using bcrypt with configured salt rounds
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Create user (exclude passwordHash from response for security)
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: userRole
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  // Generate JWT tokens (same as login)
  const accessToken = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  };
}

/**
 * Authenticate a user and generate JWT tokens
 *
 * Verifies credentials and returns both access token (short-lived)
 * and refresh token (long-lived, stored in httpOnly cookie).
 *
 * @param {string} email - User email address
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} Object containing accessToken, refreshToken, and user data
 * @throws {UnauthorizedError} If email not found or password incorrect
 *
 * @example
 * const { accessToken, refreshToken, user } = await login('user@example.com', 'password');
 */
export async function login(email, password) {
  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Generic error message to prevent email enumeration attacks
    throw new UnauthorizedError('Email ou mot de passe incorrect');
  }

  // Verify password against stored hash
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    // Same generic error message for security
    throw new UnauthorizedError('Email ou mot de passe incorrect');
  }

  // Generate JWT tokens
  // Access token: Short-lived (15 min), sent in response body
  // Refresh token: Long-lived (7 days), sent as httpOnly cookie
  const accessToken = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  };
}

/**
 * Get current authenticated user information
 *
 * Used to verify user identity and fetch fresh user data.
 *
 * @param {string} userId - User ID from JWT token
 * @returns {Promise<Object>} User object (without password hash)
 * @throws {UnauthorizedError} If user not found
 *
 * @example
 * const user = await getCurrentUser('clijrn9ht0000...');
 */
export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new UnauthorizedError('Utilisateur non trouvé');
  }

  return user;
}

/**
 * Logout user by blacklisting the access token
 *
 * Implements immediate logout by adding the token to a Redis blacklist.
 * The token remains blacklisted until its natural expiration time.
 *
 * Phase 2 Security Enhancement:
 * - Tokens are immediately invalidated (no 15-minute grace period)
 * - Blacklist entry auto-expires when token would expire anyway
 * - Prevents token reuse after logout
 *
 * @param {string} accessToken - JWT access token to revoke
 * @returns {Promise<Object>} Success message
 *
 * @example
 * // In controller:
 * const token = req.headers.authorization.substring(7)
 * await logout(token)
 */
export async function logout(accessToken) {
  try {
    // Decode token to get expiration time (don't verify, just decode)
    const decoded = jwt.decode(accessToken);

    if (!decoded || !decoded.exp) {
      // Token malformed, but logout succeeds anyway
      return { message: 'Déconnexion réussie' };
    }

    // Calculate remaining token lifetime
    const now = Math.floor(Date.now() / 1000);
    const remainingTime = decoded.exp - now;

    // Only blacklist if token hasn't expired yet
    if (remainingTime > 0) {
      await blacklistToken(accessToken, remainingTime);
    }

    return { message: 'Déconnexion réussie' };
  } catch (error) {
    // Even if blacklisting fails, logout succeeds
    // (Frontend will remove token, so user appears logged out)
    return { message: 'Déconnexion réussie' };
  }
}
