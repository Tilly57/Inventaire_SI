/**
 * JWT utility functions
 */
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { UnauthorizedError } from './errors.js';

/**
 * Generate access token
 */
export function generateAccessToken(userId, email, role) {
  return jwt.sign(
    { userId, email, role },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessExpiresIn }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpiresIn }
  );
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, jwtConfig.accessSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token expiré');
    }
    throw new UnauthorizedError('Token invalide');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, jwtConfig.refreshSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Refresh token expiré');
    }
    throw new UnauthorizedError('Refresh token invalide');
  }
}
