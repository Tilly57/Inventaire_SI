/**
 * Application constants
 */

// JWT Token durations
export const JWT_ACCESS_TOKEN_EXPIRES_IN = '15m';  // 15 minutes
export const JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';  // 7 days

// Bcrypt
export const BCRYPT_SALT_ROUNDS = 10;

// File upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
export const ALLOWED_FILE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

// Pagination
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// User roles
export const ROLES = {
  ADMIN: 'ADMIN',
  GESTIONNAIRE: 'GESTIONNAIRE',
  LECTURE: 'LECTURE'
};

// Asset statuses
export const ASSET_STATUS = {
  EN_STOCK: 'EN_STOCK',
  PRETE: 'PRETE',
  HS: 'HS',
  REPARATION: 'REPARATION'
};

// Loan statuses
export const LOAN_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED'
};
