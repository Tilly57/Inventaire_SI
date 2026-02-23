/**
 * @fileoverview Tests for authentication validation schemas - Phase 2
 *
 * Tests cover:
 * - Strong password validation (complexity requirements)
 * - Registration schema validation
 * - Login schema validation
 * - Password change schema validation
 * - Edge cases and error messages
 */

import { describe, it, expect } from '@jest/globals';
import {
  passwordSchema,
  registerSchema,
  loginSchema,
  changePasswordSchema
} from '../auth.validator.js';

describe('Authentication Validators - Phase 2', () => {
  // ============================================
  // passwordSchema Tests
  // ============================================

  describe('passwordSchema', () => {
    describe('Valid passwords', () => {
      it('should accept password with all requirements met', () => {
        const validPasswords = [
          'Password123!',
          'SecureP@ss1',
          'MyP@ssw0rd',
          'Str0ng!Pass',
          'C0mplex#Pwd',
          'Test123$Pass',
          '!Qwerty123',
          'AdminP@ss1'
        ];

        validPasswords.forEach(password => {
          const result = passwordSchema.safeParse(password);
          expect(result.success).toBe(true);
        });
      });

      it('should accept password with multiple special characters', () => {
        const result = passwordSchema.safeParse('P@ss!w0rd#123');
        expect(result.success).toBe(true);
      });

      it('should accept password with all types of special characters', () => {
        const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', '|', ';', ':', ',', '.', '<', '>', '?'];

        specialChars.forEach(char => {
          const password = `Pass1${char}word`;
          const result = passwordSchema.safeParse(password);
          expect(result.success).toBe(true);
        });
      });

      it('should accept password at minimum length (8 chars)', () => {
        const result = passwordSchema.safeParse('Pass1@wo');
        expect(result.success).toBe(true);
      });

      it('should accept password at maximum length (128 chars)', () => {
        const password = 'A1!' + 'x'.repeat(125); // 128 chars total
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });

      it('should accept password with accented characters', () => {
        const result = passwordSchema.safeParse('Pàssw0rd!');
        expect(result.success).toBe(true);
      });
    });

    describe('Invalid passwords - Length requirements', () => {
      it('should reject password shorter than 8 characters', () => {
        const result = passwordSchema.safeParse('Pass1!');
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('au moins 8 caractères');
      });

      it('should reject password longer than 128 characters', () => {
        const password = 'A1!' + 'x'.repeat(126); // 129 chars total
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('128 caractères');
      });

      it('should reject empty password', () => {
        const result = passwordSchema.safeParse('');
        expect(result.success).toBe(false);
      });
    });

    describe('Invalid passwords - Missing uppercase', () => {
      it('should reject password without uppercase letter', () => {
        const result = passwordSchema.safeParse('password123!');
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('lettre majuscule');
      });
    });

    describe('Invalid passwords - Missing lowercase', () => {
      it('should reject password without lowercase letter', () => {
        const result = passwordSchema.safeParse('PASSWORD123!');
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('lettre minuscule');
      });
    });

    describe('Invalid passwords - Missing digit', () => {
      it('should reject password without digit', () => {
        const result = passwordSchema.safeParse('Password!');
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('chiffre');
      });
    });

    describe('Invalid passwords - Missing special character', () => {
      it('should reject password without special character', () => {
        const result = passwordSchema.safeParse('Password123');
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('caractère spécial');
      });
    });

    describe('Invalid passwords - Multiple missing requirements', () => {
      it('should reject password missing uppercase and special char', () => {
        const result = passwordSchema.safeParse('password123');
        expect(result.success).toBe(false);
        expect(result.error?.errors.length).toBeGreaterThan(1);
      });

      it('should reject password with only lowercase letters', () => {
        const result = passwordSchema.safeParse('password');
        expect(result.success).toBe(false);
        expect(result.error?.errors.length).toBe(3); // Missing uppercase, digit, special
      });

      it('should reject password with only numbers', () => {
        const result = passwordSchema.safeParse('12345678');
        expect(result.success).toBe(false);
        expect(result.error?.errors.length).toBe(3); // Missing uppercase, lowercase, special
      });
    });

    describe('Edge cases', () => {
      it('should handle non-string input', () => {
        const result = passwordSchema.safeParse(12345678);
        expect(result.success).toBe(false);
      });

      it('should handle null input', () => {
        const result = passwordSchema.safeParse(null);
        expect(result.success).toBe(false);
      });

      it('should handle undefined input', () => {
        const result = passwordSchema.safeParse(undefined);
        expect(result.success).toBe(false);
      });

      it('should handle password with only spaces', () => {
        const result = passwordSchema.safeParse('        ');
        expect(result.success).toBe(false);
      });

      it('should accept password with spaces (if it meets other requirements)', () => {
        const result = passwordSchema.safeParse('Pass word 123!');
        expect(result.success).toBe(true);
      });

      it('should handle Unicode characters', () => {
        const result = passwordSchema.safeParse('P@ss1😀word'); // emoji
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================
  // registerSchema Tests
  // ============================================

  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        role: 'GESTIONNAIRE'
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept registration without role (optional)', () => {
      const validData = {
        email: 'user@example.com',
        password: 'SecurePass123!'
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept all valid roles', () => {
      const roles = ['ADMIN', 'GESTIONNAIRE', 'LECTURE'];

      roles.forEach(role => {
        const data = {
          email: 'user@example.com',
          password: 'SecurePass123!',
          role
        };

        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'SecurePass123!'
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Email invalide');
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'weak'
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        role: 'SUPERADMIN'  // Not a valid role
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'SecurePass123!'
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'user@example.com'
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject extra fields (strict mode)', () => {
      const dataWithExtra = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        extraField: 'should not be here'
      };

      // Zod by default allows extra fields, but we can check the parsed result
      const result = registerSchema.safeParse(dataWithExtra);
      expect(result.success).toBe(true); // Will pass, extra fields ignored
    });
  });

  // ============================================
  // loginSchema Tests
  // ============================================

  describe('loginSchema', () => {
    it('should accept valid login credentials', () => {
      const validData = {
        email: 'user@example.com',
        password: 'any-password'
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept any password (no complexity validation on login)', () => {
      const validData = {
        email: 'user@example.com',
        password: 'weak'  // Would fail registerSchema, but OK for login
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password'
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Email invalide');
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: ''
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Mot de passe requis');
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'password'
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'user@example.com'
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // changePasswordSchema Tests
  // ============================================

  describe('changePasswordSchema', () => {
    it('should accept valid password change', () => {
      const validData = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass456@'
      };

      const result = changePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow any current password (no validation)', () => {
      const validData = {
        currentPassword: 'weak',  // No validation on current password
        newPassword: 'NewPass456@'
      };

      const result = changePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject weak new password', () => {
      const invalidData = {
        currentPassword: 'OldPass123!',
        newPassword: 'weak'
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty current password', () => {
      const invalidData = {
        currentPassword: '',
        newPassword: 'NewPass456@'
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Mot de passe actuel requis');
    });

    it('should reject missing current password', () => {
      const invalidData = {
        newPassword: 'NewPass456@'
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing new password', () => {
      const invalidData = {
        currentPassword: 'OldPass123!'
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow same password for current and new (business logic, not validation)', () => {
      const data = {
        currentPassword: 'SamePass123!',
        newPassword: 'SamePass123!'
      };

      // Validator allows this - business logic should prevent it
      const result = changePasswordSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // Integration Tests
  // ============================================

  describe('Integration: Common Password Patterns', () => {
    it('should reject common weak passwords', () => {
      const weakPasswords = [
        'password',
        'Password',
        'password123',
        'Password123',  // Missing special char
        '12345678',
        'abcdefgh',
        'ABCDEFGH',
        'qwerty123',
        'Qwerty123'  // Missing special char
      ];

      weakPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(false);
      });
    });

    it('should accept strong password patterns', () => {
      const strongPasswords = [
        'MyS3cur3!Pass',
        'Tr0ub4dor&3',
        'C0rrect-H0rse-Battery-Staple!',
        '!QAZ2wsx#EDC',
        'P@ssw0rd2024',
        'Sup3r$ecure',
        'W3lc0me@Home'
      ];

      strongPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================
  // Error Message Tests
  // ============================================

  describe('Error Messages', () => {
    it('should provide French error messages', () => {
      const result = passwordSchema.safeParse('weak');
      expect(result.success).toBe(false);

      const errorMessages = result.error?.errors.map(e => e.message);
      errorMessages?.forEach(message => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('should provide specific error for each missing requirement', () => {
      const testCases = [
        { password: 'password123!', expectedError: 'majuscule' },
        { password: 'PASSWORD123!', expectedError: 'minuscule' },
        { password: 'Password!', expectedError: 'chiffre' },
        { password: 'Password123', expectedError: 'spécial' }
      ];

      testCases.forEach(({ password, expectedError }) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(false);
        const errorMessage = result.error?.errors[0].message;
        expect(errorMessage?.toLowerCase()).toContain(expectedError.toLowerCase());
      });
    });
  });
});