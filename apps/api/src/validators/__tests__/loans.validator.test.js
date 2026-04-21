/**
 * @fileoverview Tests for loan validation schemas
 *
 * Tests cover:
 * - createLoanSchema: required employeeId with max length
 * - addLoanLineSchema: optional fields with refine (assetItemId OR stockItemId)
 * - batchDeleteLoansSchema: array of CUIDs with min/max constraints
 * - Edge cases and error messages
 */

import { describe, it, expect } from '@jest/globals';
import {
  createLoanSchema,
  addLoanLineSchema,
  batchDeleteLoansSchema
} from '../loans.validator.js';

const VALID_CUID = 'cjld2cyuq0000t3rmniod1foy';
const VALID_CUID_2 = 'cjld2cyuq0001t3rmniod1foz';

describe('Loan Validators', () => {
  // ============================================
  // createLoanSchema Tests
  // ============================================

  describe('createLoanSchema', () => {
    describe('Donnees valides', () => {
      it('devrait accepter un employeeId valide', () => {
        const result = createLoanSchema.safeParse({ employeeId: VALID_CUID });
        expect(result.success).toBe(true);
      });

      it('devrait accepter un employeeId court', () => {
        const result = createLoanSchema.safeParse({ employeeId: 'e1' });
        expect(result.success).toBe(true);
      });

      it('devrait accepter un employeeId a la limite de 30 caracteres', () => {
        const result = createLoanSchema.safeParse({ employeeId: 'A'.repeat(30) });
        expect(result.success).toBe(true);
      });
    });

    describe('Champs requis manquants', () => {
      it('devrait rejeter un objet vide', () => {
        const result = createLoanSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un employeeId vide', () => {
        const result = createLoanSchema.safeParse({ employeeId: '' });
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain("ID de l'employé requis");
      });
    });

    describe('Contraintes de longueur', () => {
      it('devrait rejeter un employeeId de plus de 30 caracteres', () => {
        const result = createLoanSchema.safeParse({ employeeId: 'A'.repeat(31) });
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('ID invalide');
      });
    });

    describe('Cas limites', () => {
      it('devrait rejeter un input null', () => {
        const result = createLoanSchema.safeParse(null);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un input undefined', () => {
        const result = createLoanSchema.safeParse(undefined);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un employeeId numerique', () => {
        const result = createLoanSchema.safeParse({ employeeId: 123 });
        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================
  // addLoanLineSchema Tests
  // ============================================

  describe('addLoanLineSchema', () => {
    describe('Donnees valides', () => {
      it('devrait accepter une ligne avec un assetItemId', () => {
        const data = { assetItemId: 'asset-123' };

        const result = addLoanLineSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter une ligne avec un stockItemId', () => {
        const data = { stockItemId: 'stock-456' };

        const result = addLoanLineSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter une ligne avec stockItemId et quantity', () => {
        const data = {
          stockItemId: 'stock-456',
          quantity: 5
        };

        const result = addLoanLineSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter une ligne avec les deux IDs fournis', () => {
        const data = {
          assetItemId: 'asset-123',
          stockItemId: 'stock-456'
        };

        const result = addLoanLineSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter assetItemId avec stockItemId null', () => {
        const data = {
          assetItemId: 'asset-123',
          stockItemId: null
        };

        const result = addLoanLineSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter stockItemId avec assetItemId null', () => {
        const data = {
          assetItemId: null,
          stockItemId: 'stock-456'
        };

        const result = addLoanLineSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter une quantite minimale de 1', () => {
        const data = {
          stockItemId: 'stock-456',
          quantity: 1
        };

        const result = addLoanLineSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Refine: au moins un ID requis', () => {
      it('devrait rejeter une ligne sans assetItemId ni stockItemId', () => {
        const result = addLoanLineSchema.safeParse({});
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain(
          'soit un article d\'équipement soit un article de stock'
        );
      });

      it('devrait rejeter une ligne avec les deux IDs a null', () => {
        const data = {
          assetItemId: null,
          stockItemId: null
        };

        const result = addLoanLineSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain(
          'soit un article d\'équipement soit un article de stock'
        );
      });
    });

    describe('Contraintes de quantite', () => {
      it('devrait rejeter une quantite de 0', () => {
        const data = {
          stockItemId: 'stock-456',
          quantity: 0
        };

        const result = addLoanLineSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('au moins 1');
      });

      it('devrait rejeter une quantite negative', () => {
        const data = {
          stockItemId: 'stock-456',
          quantity: -3
        };

        const result = addLoanLineSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter une quantite decimale', () => {
        const data = {
          stockItemId: 'stock-456',
          quantity: 2.5
        };

        const result = addLoanLineSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('Cas limites', () => {
      it('devrait rejeter un input null', () => {
        const result = addLoanLineSchema.safeParse(null);
        expect(result.success).toBe(false);
      });

      it('devrait accepter une ligne sans quantity (optionnelle)', () => {
        const data = { assetItemId: 'asset-123' };

        const result = addLoanLineSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter une grande quantite', () => {
        const data = {
          stockItemId: 'stock-456',
          quantity: 9999
        };

        const result = addLoanLineSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================
  // batchDeleteLoansSchema Tests
  // ============================================

  describe('batchDeleteLoansSchema', () => {
    it('devrait accepter un tableau avec un seul CUID', () => {
      const data = { loanIds: [VALID_CUID] };

      const result = batchDeleteLoansSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait accepter un tableau avec plusieurs CUIDs', () => {
      const data = { loanIds: [VALID_CUID, VALID_CUID_2] };

      const result = batchDeleteLoansSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait accepter un tableau avec 100 CUIDs (maximum)', () => {
      const cuidList = Array.from({ length: 100 }, (_, i) =>
        `cjld2cyuq${String(i).padStart(4, '0')}t3rmniod1foy`
      );
      const data = { loanIds: cuidList };

      const result = batchDeleteLoansSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un tableau vide', () => {
      const data = { loanIds: [] };

      const result = batchDeleteLoansSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Au moins un prêt');
    });

    it('devrait rejeter un tableau de plus de 100 elements', () => {
      const cuidList = Array.from({ length: 101 }, (_, i) =>
        `cjld2cyuq${String(i).padStart(4, '0')}t3rmniod1foy`
      );
      const data = { loanIds: cuidList };

      const result = batchDeleteLoansSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('100 prêts');
    });

    it('devrait rejeter un tableau avec des IDs non-CUID', () => {
      const data = { loanIds: ['not-a-cuid'] };

      const result = batchDeleteLoansSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter sans la propriete loanIds', () => {
      const result = batchDeleteLoansSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('devrait rejeter si loanIds n\'est pas un tableau', () => {
      const data = { loanIds: VALID_CUID };

      const result = batchDeleteLoansSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter si un element du tableau est invalide', () => {
      const data = { loanIds: [VALID_CUID, '123', VALID_CUID_2] };

      const result = batchDeleteLoansSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
