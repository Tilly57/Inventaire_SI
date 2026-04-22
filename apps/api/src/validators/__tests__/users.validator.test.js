/**
 * @fileoverview Tests for user validation schemas
 *
 * Tests cover:
 * - createUserSchema: email, password (passwordSchema from auth), role enum
 * - updateUserSchema: optional email and role
 * - changePasswordSchema: required currentPassword, newPassword with passwordSchema
 * - Edge cases and error messages
 */

import { describe, it, expect } from '@jest/globals';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema
} from '../users.validator.js';

const VALID_ROLES = ['ADMIN', 'GESTIONNAIRE', 'LECTURE'];
const STRONG_PASSWORD = 'SecureP@ss1';

describe('User Validators', () => {
  // ============================================
  // createUserSchema Tests
  // ============================================

  describe('createUserSchema', () => {
    describe('Donnees valides', () => {
      it('devrait accepter un utilisateur avec tous les champs valides', () => {
        const data = {
          email: 'admin@example.com',
          password: STRONG_PASSWORD,
          role: 'ADMIN'
        };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter tous les roles valides', () => {
        VALID_ROLES.forEach(role => {
          const data = {
            email: 'user@example.com',
            password: STRONG_PASSWORD,
            role
          };

          const result = createUserSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('devrait accepter differents formats d\'email valides', () => {
        const validEmails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.com',
          'user@sub.example.com'
        ];

        validEmails.forEach(email => {
          const data = { email, password: STRONG_PASSWORD, role: 'LECTURE' };

          const result = createUserSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('Champs requis manquants', () => {
      it('devrait rejeter un objet vide', () => {
        const result = createUserSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('devrait rejeter sans email', () => {
        const data = { password: STRONG_PASSWORD, role: 'ADMIN' };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter sans password', () => {
        const data = { email: 'user@example.com', role: 'ADMIN' };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter sans role', () => {
        const data = { email: 'user@example.com', password: STRONG_PASSWORD };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('Formats invalides', () => {
      it('devrait rejeter un email invalide', () => {
        const data = {
          email: 'pas-un-email',
          password: STRONG_PASSWORD,
          role: 'ADMIN'
        };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('Email invalide');
      });

      it('devrait rejeter un email sans @', () => {
        const data = {
          email: 'userexample.com',
          password: STRONG_PASSWORD,
          role: 'ADMIN'
        };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un email vide', () => {
        const data = {
          email: '',
          password: STRONG_PASSWORD,
          role: 'ADMIN'
        };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un role invalide', () => {
        const data = {
          email: 'user@example.com',
          password: STRONG_PASSWORD,
          role: 'SUPERADMIN'
        };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un role en minuscules', () => {
        const data = {
          email: 'user@example.com',
          password: STRONG_PASSWORD,
          role: 'admin'
        };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('Validation du mot de passe (passwordSchema)', () => {
      it('devrait rejeter un mot de passe trop court', () => {
        const data = {
          email: 'user@example.com',
          password: 'Ab1!',
          role: 'ADMIN'
        };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('au moins 8 caractères');
      });

      it('devrait rejeter un mot de passe trop long', () => {
        const data = {
          email: 'user@example.com',
          password: 'A1!' + 'x'.repeat(126), // 129 chars
          role: 'ADMIN'
        };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un mot de passe sans majuscule', () => {
        const data = {
          email: 'user@example.com',
          password: 'password123!',
          role: 'ADMIN'
        };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('majuscule');
      });

      it('devrait rejeter un mot de passe sans minuscule', () => {
        const data = {
          email: 'user@example.com',
          password: 'PASSWORD123!',
          role: 'ADMIN'
        };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('minuscule');
      });

      it('devrait rejeter un mot de passe sans chiffre', () => {
        const data = {
          email: 'user@example.com',
          password: 'Password!abc',
          role: 'ADMIN'
        };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('chiffre');
      });

      it('devrait rejeter un mot de passe sans caractere special', () => {
        const data = {
          email: 'user@example.com',
          password: 'Password123',
          role: 'ADMIN'
        };

        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('spécial');
      });
    });

    describe('Cas limites', () => {
      it('devrait rejeter un input null', () => {
        const result = createUserSchema.safeParse(null);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un input undefined', () => {
        const result = createUserSchema.safeParse(undefined);
        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================
  // updateUserSchema Tests
  // ============================================

  describe('updateUserSchema', () => {
    it('devrait accepter une mise a jour complete', () => {
      const data = {
        email: 'new@example.com',
        role: 'GESTIONNAIRE'
      };

      const result = updateUserSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait accepter un objet vide (aucune modification)', () => {
      const result = updateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('devrait accepter uniquement l\'email', () => {
      const result = updateUserSchema.safeParse({ email: 'new@example.com' });
      expect(result.success).toBe(true);
    });

    it('devrait accepter uniquement le role', () => {
      const result = updateUserSchema.safeParse({ role: 'LECTURE' });
      expect(result.success).toBe(true);
    });

    it('devrait accepter tous les roles valides', () => {
      VALID_ROLES.forEach(role => {
        const result = updateUserSchema.safeParse({ role });
        expect(result.success).toBe(true);
      });
    });

    it('devrait rejeter un email invalide quand fourni', () => {
      const result = updateUserSchema.safeParse({ email: 'invalide' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Email invalide');
    });

    it('devrait rejeter un role invalide quand fourni', () => {
      const result = updateUserSchema.safeParse({ role: 'SUPERADMIN' });
      expect(result.success).toBe(false);
    });

    it('devrait ne pas inclure de champ password', () => {
      // updateUserSchema n'a pas de champ password - il est ignore
      const data = {
        email: 'new@example.com',
        password: 'ShouldBeIgnored123!'
      };

      const result = updateUserSchema.safeParse(data);
      expect(result.success).toBe(true);
      // Le champ password devrait etre ignore (non valide dans ce schema)
    });
  });

  // ============================================
  // changePasswordSchema Tests
  // ============================================

  describe('changePasswordSchema', () => {
    describe('Donnees valides', () => {
      it('devrait accepter un changement de mot de passe valide', () => {
        const data = {
          currentPassword: 'AncienP@ss1',
          newPassword: 'NouveauP@ss2'
        };

        const result = changePasswordSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter n\'importe quel mot de passe actuel (pas de validation)', () => {
        const data = {
          currentPassword: 'weak',
          newPassword: 'NouveauP@ss2'
        };

        const result = changePasswordSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait permettre le meme mot de passe ancien et nouveau (logique metier)', () => {
        const data = {
          currentPassword: 'MemeP@ss1',
          newPassword: 'MemeP@ss1'
        };

        const result = changePasswordSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Champs requis manquants', () => {
      it('devrait rejeter sans currentPassword', () => {
        const data = { newPassword: 'NouveauP@ss2' };

        const result = changePasswordSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter sans newPassword', () => {
        const data = { currentPassword: 'AncienP@ss1' };

        const result = changePasswordSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un objet vide', () => {
        const result = changePasswordSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });

    describe('Contraintes', () => {
      it('devrait rejeter un currentPassword vide', () => {
        const data = {
          currentPassword: '',
          newPassword: 'NouveauP@ss2'
        };

        const result = changePasswordSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('Mot de passe actuel requis');
      });

      it('devrait rejeter un newPassword faible', () => {
        const data = {
          currentPassword: 'AncienP@ss1',
          newPassword: 'faible'
        };

        const result = changePasswordSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un newPassword sans majuscule', () => {
        const data = {
          currentPassword: 'AncienP@ss1',
          newPassword: 'password123!'
        };

        const result = changePasswordSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('majuscule');
      });

      it('devrait rejeter un newPassword sans caractere special', () => {
        const data = {
          currentPassword: 'AncienP@ss1',
          newPassword: 'Password123'
        };

        const result = changePasswordSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('spécial');
      });
    });

    describe('Cas limites', () => {
      it('devrait rejeter un input null', () => {
        const result = changePasswordSchema.safeParse(null);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un input undefined', () => {
        const result = changePasswordSchema.safeParse(undefined);
        expect(result.success).toBe(false);
      });
    });
  });
});
