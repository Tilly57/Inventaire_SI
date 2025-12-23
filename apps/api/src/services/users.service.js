/**
 * Users service - Business logic for user management
 */
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { NotFoundError, ConflictError, UnauthorizedError } from '../utils/errors.js';
import { BCRYPT_SALT_ROUNDS } from '../utils/constants.js';

/**
 * Get all users
 */
export async function getAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return users;
}

/**
 * Get user by ID
 */
export async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  return user;
}

/**
 * Create new user
 */
export async function createUser(email, password, role) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('Un utilisateur avec cet email existe déjà');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role
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
 * Update user
 */
export async function updateUser(id, data) {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // If email is being changed, check for conflicts
  if (data.email && data.email !== existingUser.email) {
    const emailConflict = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailConflict) {
      throw new ConflictError('Un utilisateur avec cet email existe déjà');
    }
  }

  // Update user
  const user = await prisma.user.update({
    where: { id },
    data,
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
 * Delete user
 */
export async function deleteUser(id) {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Delete user
  await prisma.user.delete({ where: { id } });

  return { message: 'Utilisateur supprimé avec succès' };
}

/**
 * Change user password
 */
export async function changePassword(userId, currentPassword, newPassword) {
  // Get user with password hash
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Mot de passe actuel incorrect');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash }
  });

  return { message: 'Mot de passe modifié avec succès' };
}
