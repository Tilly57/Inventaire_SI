/**
 * Authentication service - Business logic for auth operations
 */
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { UnauthorizedError, ConflictError } from '../utils/errors.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { BCRYPT_SALT_ROUNDS, ROLES } from '../utils/constants.js';

/**
 * Register a new user
 */
export async function register(email, password, role = ROLES.GESTIONNAIRE) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('Un utilisateur avec cet email existe déjà');
  }

  // If this is the first user, make them admin
  const userCount = await prisma.user.count();
  const userRole = userCount === 0 ? ROLES.ADMIN : role;

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Create user
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

  return user;
}

/**
 * Login user
 */
export async function login(email, password) {
  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('Email ou mot de passe incorrect');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Email ou mot de passe incorrect');
  }

  // Generate tokens
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
 * Get current user info
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
