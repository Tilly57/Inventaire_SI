/**
 * @fileoverview Tests for employee validation schemas
 *
 * Tests cover:
 * - createEmployeeSchema: required fields, optional/nullable fields, formats
 * - updateEmployeeSchema: all fields optional
 * - bulkCreateEmployeesSchema: array validation with min constraint
 * - Edge cases and error messages
 */

import { describe, it, expect } from '@jest/globals';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  bulkCreateEmployeesSchema
} from '../employees.validator.js';

// Valid CUID for testing
const VALID_CUID = 'cjld2cyuq0000t3rmniod1foy';

describe('Employee Validators', () => {
  // ============================================
  // createEmployeeSchema Tests
  // ============================================

  describe('createEmployeeSchema', () => {
    describe('Donnees valides', () => {
      it('devrait accepter un employe avec tous les champs remplis', () => {
        const data = {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@example.com',
          dept: 'Informatique',
          managerId: VALID_CUID
        };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter un employe avec seulement les champs requis', () => {
        const data = {
          firstName: 'Jean',
          lastName: 'Dupont'
        };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter les champs optionnels comme null', () => {
        const data = {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: null,
          dept: null,
          managerId: null
        };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter un prenom et nom a la limite de 100 caracteres', () => {
        const data = {
          firstName: 'A'.repeat(100),
          lastName: 'B'.repeat(100)
        };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter un email a la limite de 255 caracteres', () => {
        const localPart = 'a'.repeat(243); // 243 + @ + example.com = 255
        const data = {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: `${localPart}@example.com`
        };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter un departement a la limite de 100 caracteres', () => {
        const data = {
          firstName: 'Jean',
          lastName: 'Dupont',
          dept: 'D'.repeat(100)
        };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Champs requis manquants', () => {
      it('devrait rejeter un objet sans firstName', () => {
        const data = { lastName: 'Dupont' };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un objet sans lastName', () => {
        const data = { firstName: 'Jean' };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un objet vide', () => {
        const result = createEmployeeSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un firstName vide', () => {
        const data = { firstName: '', lastName: 'Dupont' };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('Prénom requis');
      });

      it('devrait rejeter un lastName vide', () => {
        const data = { firstName: 'Jean', lastName: '' };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('Nom requis');
      });
    });

    describe('Depassement de longueur maximale', () => {
      it('devrait rejeter un firstName de plus de 100 caracteres', () => {
        const data = {
          firstName: 'A'.repeat(101),
          lastName: 'Dupont'
        };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('100 caractères');
      });

      it('devrait rejeter un lastName de plus de 100 caracteres', () => {
        const data = {
          firstName: 'Jean',
          lastName: 'B'.repeat(101)
        };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('100 caractères');
      });

      it('devrait rejeter un email de plus de 255 caracteres', () => {
        const localPart = 'a'.repeat(244);
        const data = {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: `${localPart}@example.com`
        };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('255 caractères');
      });

      it('devrait rejeter un dept de plus de 100 caracteres', () => {
        const data = {
          firstName: 'Jean',
          lastName: 'Dupont',
          dept: 'D'.repeat(101)
        };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('100 caractères');
      });
    });

    describe('Formats invalides', () => {
      it('devrait rejeter un email invalide', () => {
        const data = {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'pas-un-email'
        };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('Email invalide');
      });

      it('devrait rejeter un email sans domaine', () => {
        const data = {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'user@'
        };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un managerId avec format invalide (non-cuid)', () => {
        const data = {
          firstName: 'Jean',
          lastName: 'Dupont',
          managerId: 'not-a-cuid'
        };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('ID manager invalide');
      });

      it('devrait rejeter un managerId UUID au lieu de CUID', () => {
        const data = {
          firstName: 'Jean',
          lastName: 'Dupont',
          managerId: '550e8400-e29b-41d4-a716-446655440000'
        };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('Cas limites', () => {
      it('devrait rejeter un input null', () => {
        const result = createEmployeeSchema.safeParse(null);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un input undefined', () => {
        const result = createEmployeeSchema.safeParse(undefined);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un input non-objet', () => {
        const result = createEmployeeSchema.safeParse('string');
        expect(result.success).toBe(false);
      });

      it('devrait accepter un prenom avec un seul caractere', () => {
        const data = { firstName: 'J', lastName: 'D' };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter un prenom avec des caracteres speciaux', () => {
        const data = { firstName: 'Jean-Pierre', lastName: "O'Brien" };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter un prenom avec des accents', () => {
        const data = { firstName: 'Helene', lastName: 'Lefevre' };

        const result = createEmployeeSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================
  // updateEmployeeSchema Tests
  // ============================================

  describe('updateEmployeeSchema', () => {
    it('devrait accepter une mise a jour complete', () => {
      const data = {
        firstName: 'Pierre',
        lastName: 'Martin',
        email: 'pierre.martin@example.com',
        dept: 'RH',
        managerId: VALID_CUID
      };

      const result = updateEmployeeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait accepter une mise a jour partielle (un seul champ)', () => {
      const result = updateEmployeeSchema.safeParse({ firstName: 'Pierre' });
      expect(result.success).toBe(true);
    });

    it('devrait accepter un objet vide (aucune modification)', () => {
      const result = updateEmployeeSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('devrait accepter null pour les champs nullable', () => {
      const data = {
        email: null,
        dept: null,
        managerId: null
      };

      const result = updateEmployeeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un firstName vide quand fourni', () => {
      const result = updateEmployeeSchema.safeParse({ firstName: '' });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un email invalide quand fourni', () => {
      const result = updateEmployeeSchema.safeParse({ email: 'invalide' });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un managerId invalide quand fourni', () => {
      const result = updateEmployeeSchema.safeParse({ managerId: '123' });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un firstName depassant 100 caracteres', () => {
      const result = updateEmployeeSchema.safeParse({ firstName: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // bulkCreateEmployeesSchema Tests
  // ============================================

  describe('bulkCreateEmployeesSchema', () => {
    it('devrait accepter un tableau avec un seul employe', () => {
      const data = {
        employees: [
          { firstName: 'Jean', lastName: 'Dupont' }
        ]
      };

      const result = bulkCreateEmployeesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait accepter un tableau avec plusieurs employes', () => {
      const data = {
        employees: [
          { firstName: 'Jean', lastName: 'Dupont', email: 'jean@example.com' },
          { firstName: 'Marie', lastName: 'Martin', dept: 'IT' },
          { firstName: 'Pierre', lastName: 'Bernard' }
        ]
      };

      const result = bulkCreateEmployeesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un tableau vide', () => {
      const data = { employees: [] };

      const result = bulkCreateEmployeesSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Au moins un employé requis');
    });

    it('devrait rejeter sans la propriete employees', () => {
      const result = bulkCreateEmployeesSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('devrait rejeter si un employe du tableau est invalide', () => {
      const data = {
        employees: [
          { firstName: 'Jean', lastName: 'Dupont' },
          { firstName: '', lastName: 'Martin' } // firstName vide
        ]
      };

      const result = bulkCreateEmployeesSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter si employees n\'est pas un tableau', () => {
      const data = {
        employees: { firstName: 'Jean', lastName: 'Dupont' }
      };

      const result = bulkCreateEmployeesSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('devrait valider chaque employe individuellement', () => {
      const data = {
        employees: [
          { firstName: 'Jean', lastName: 'Dupont', email: 'invalide' } // email invalide
        ]
      };

      const result = bulkCreateEmployeesSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
