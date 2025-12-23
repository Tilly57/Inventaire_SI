/**
 * Authentication controllers - HTTP handlers
 */
import { asyncHandler } from '../middleware/asyncHandler.js';
import { register as registerService, login as loginService, getCurrentUser } from '../services/auth.service.js';
import { generateAccessToken, verifyRefreshToken } from '../utils/jwt.js';

/**
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const user = await registerService(email, password, role);

  res.status(201).json({
    success: true,
    data: user
  });
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { accessToken, refreshToken, user } = await loginService(email, password);

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    data: {
      accessToken,
      user
    }
  });
});

/**
 * POST /api/auth/refresh
 */
export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: 'Refresh token manquant'
    });
  }

  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // Get user info
  const user = await getCurrentUser(payload.userId);

  // Generate new access token
  const accessToken = generateAccessToken(user.id, user.email, user.role);

  res.json({
    success: true,
    data: {
      accessToken,
      user
    }
  });
});

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    data: { message: 'Déconnexion réussie' }
  });
});

/**
 * GET /api/auth/me
 */
export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.userId);

  res.json({
    success: true,
    data: user
  });
});
