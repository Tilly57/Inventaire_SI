/**
 * @fileoverview Application-wide constants
 *
 * This module provides:
 * - JWT token expiration times
 * - Security settings (bcrypt rounds)
 * - File upload constraints (size, types)
 * - Pagination defaults
 * - Enum values for roles, statuses, etc.
 *
 * These constants should match:
 * - Prisma schema enums (UserRole, AssetStatus, LoanStatus)
 * - Frontend constants (apps/web/src/lib/utils/constants.ts)
 */

// ==================== JWT Token Configuration ====================

/**
 * Access token expiration time
 *
 * Short-lived (15 minutes) to limit exposure if token is compromised.
 * Frontend automatically refreshes using refresh token before expiry.
 *
 * @constant {string}
 */
export const JWT_ACCESS_TOKEN_EXPIRES_IN = '15m';

/**
 * Refresh token expiration time
 *
 * Long-lived (7 days) to reduce login frequency while maintaining security.
 * Stored in httpOnly cookie to prevent XSS attacks.
 *
 * @constant {string}
 */
export const JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';

// ==================== Security Configuration ====================

/**
 * Bcrypt salt rounds for password hashing
 *
 * Value of 10 provides good balance between security and performance.
 * Higher values (12-14) increase security but slow down hashing significantly.
 *
 * @constant {number}
 */
export const BCRYPT_SALT_ROUNDS = 10;

// ==================== File Upload Constraints ====================

/**
 * Maximum file size for uploads (5MB)
 *
 * Applied to signature images in loan pickups/returns.
 * Prevents DoS attacks and excessive storage usage.
 *
 * @constant {number}
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Allowed MIME types for file uploads
 *
 * Restricts uploads to PNG and JPEG images only.
 * Used by multer middleware for signature validation.
 *
 * @constant {string[]}
 */
export const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

/**
 * Allowed file extensions for uploads
 *
 * Backup validation in case MIME type check is bypassed.
 * Checked after multer processes the file.
 *
 * @constant {string[]}
 */
export const ALLOWED_FILE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

// ==================== Pagination Configuration ====================

/**
 * Default page number when not specified
 *
 * @constant {number}
 */
export const DEFAULT_PAGE = 1;

/**
 * Default number of items per page
 *
 * Balances between UX (fewer requests) and performance (smaller payloads).
 *
 * @constant {number}
 */
export const DEFAULT_LIMIT = 20;

/**
 * Maximum items per page
 *
 * Prevents clients from requesting excessive data in a single request.
 * Protects against DoS attacks via large limit values.
 *
 * @constant {number}
 */
export const MAX_LIMIT = 100;

// ==================== User Roles (must match Prisma enum) ====================

/**
 * User role constants
 *
 * Must match UserRole enum in Prisma schema.
 *
 * @constant {Object}
 * @property {string} ADMIN - Full system access (user management, all CRUD)
 * @property {string} GESTIONNAIRE - Manager access (employees, assets, loans)
 * @property {string} LECTURE - Read-only access (view-only permissions)
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  GESTIONNAIRE: 'GESTIONNAIRE',
  LECTURE: 'LECTURE'
};

// ==================== Asset Statuses (must match Prisma enum) ====================

/**
 * Asset item status constants
 *
 * Must match AssetStatus enum in Prisma schema.
 * Tracks physical state and location of equipment.
 *
 * @constant {Object}
 * @property {string} EN_STOCK - Available in inventory, can be loaned
 * @property {string} PRETE - Currently loaned to an employee
 * @property {string} HS - Out of service, needs replacement
 * @property {string} REPARATION - Under repair, temporarily unavailable
 */
export const ASSET_STATUS = {
  EN_STOCK: 'EN_STOCK',
  PRETE: 'PRETE',
  HS: 'HS',
  REPARATION: 'REPARATION'
};

// ==================== Loan Statuses (must match Prisma enum) ====================

/**
 * Loan status constants
 *
 * Must match LoanStatus enum in Prisma schema.
 * Tracks lifecycle of equipment loans.
 *
 * @constant {Object}
 * @property {string} OPEN - Loan is active, equipment still with employee
 * @property {string} CLOSED - Loan completed, equipment returned and signed off
 */
export const LOAN_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED'
};
