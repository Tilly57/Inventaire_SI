/**
 * @fileoverview Tests for asset item validation schemas
 *
 * Tests cover:
 * - createAssetItemSchema: required/optional fields, enum status, formats
 * - updateAssetItemSchema: all fields optional
 * - updateStatusSchema: required enum validation
 * - createAssetItemsBulkSchema: bulk creation with constraints
 * - bulkPreviewSchema: preview parameters
 * - Edge cases and error messages
 */

import { describe, it, expect } from '@jest/globals';
import {
  createAssetItemSchema,
  updateAssetItemSchema,
  updateStatusSchema,
  createAssetItemsBulkSchema,
  bulkPreviewSchema
} from '../assetItems.validator.js';

const VALID_STATUSES = ['EN_STOCK', 'PRETE', 'HS', 'REPARATION'];
const VALID_MODEL_CUID = 'cjld2cyuq0000t3rmniod1foy';
const VALID_MODEL_CUID_2 = 'cjld2cyuq0001t3rmniod1foz';

describe('AssetItem Validators', () => {
  // ============================================
  // createAssetItemSchema Tests
  // ============================================

  describe('createAssetItemSchema', () => {
    describe('Donnees valides', () => {
      it('devrait accepter un asset item avec tous les champs', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          assetTag: 'TAG-001',
          serial: 'SN-12345',
          status: 'EN_STOCK',
          notes: 'Neuf, sous garantie'
        };

        const result = createAssetItemSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter un asset item avec seulement assetModelId', () => {
        const data = { assetModelId: VALID_MODEL_CUID };

        const result = createAssetItemSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter les champs optionnels comme null', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          assetTag: null,
          serial: null,
          notes: null
        };

        const result = createAssetItemSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter tous les statuts valides', () => {
        VALID_STATUSES.forEach(status => {
          const data = { assetModelId: VALID_MODEL_CUID, status };

          const result = createAssetItemSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('devrait accepter un assetTag a la limite de 100 caracteres', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          assetTag: 'T'.repeat(100)
        };

        const result = createAssetItemSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter un serial a la limite de 100 caracteres', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          serial: 'S'.repeat(100)
        };

        const result = createAssetItemSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter des notes a la limite de 1000 caracteres', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          notes: 'N'.repeat(1000)
        };

        const result = createAssetItemSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Champs requis manquants', () => {
      it('devrait rejeter un objet sans assetModelId', () => {
        const data = { assetTag: 'TAG-001' };

        const result = createAssetItemSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un assetModelId vide', () => {
        const data = { assetModelId: '' };

        const result = createAssetItemSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('ID du modèle invalide');
      });

      it('devrait rejeter un objet vide', () => {
        const result = createAssetItemSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });

    describe('Depassement de longueur maximale', () => {
      it('devrait rejeter un assetTag de plus de 100 caracteres', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          assetTag: 'T'.repeat(101)
        };

        const result = createAssetItemSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('100 caractères');
      });

      it('devrait rejeter un serial de plus de 100 caracteres', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          serial: 'S'.repeat(101)
        };

        const result = createAssetItemSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('100 caractères');
      });

      it('devrait rejeter des notes de plus de 1000 caracteres', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          notes: 'N'.repeat(1001)
        };

        const result = createAssetItemSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('1000 caractères');
      });
    });

    describe('Valeurs enum invalides', () => {
      it('devrait rejeter un statut invalide', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          status: 'INVALIDE'
        };

        const result = createAssetItemSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un statut en minuscules', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          status: 'en_stock'
        };

        const result = createAssetItemSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('Cas limites', () => {
      it('devrait rejeter un input null', () => {
        const result = createAssetItemSchema.safeParse(null);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un input undefined', () => {
        const result = createAssetItemSchema.safeParse(undefined);
        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================
  // updateAssetItemSchema Tests
  // ============================================

  describe('updateAssetItemSchema', () => {
    it('devrait accepter une mise a jour complete', () => {
      const data = {
        assetModelId: VALID_MODEL_CUID_2,
        assetTag: 'TAG-002',
        serial: 'SN-67890',
        status: 'REPARATION',
        notes: 'En reparation'
      };

      const result = updateAssetItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait accepter un objet vide', () => {
      const result = updateAssetItemSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('devrait accepter une mise a jour partielle', () => {
      const result = updateAssetItemSchema.safeParse({ status: 'HS' });
      expect(result.success).toBe(true);
    });

    it('devrait accepter null pour les champs nullable', () => {
      const data = { assetTag: null, serial: null, notes: null };

      const result = updateAssetItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un assetModelId vide quand fourni', () => {
      const result = updateAssetItemSchema.safeParse({ assetModelId: '' });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un statut invalide', () => {
      const result = updateAssetItemSchema.safeParse({ status: 'PERDU' });
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // updateStatusSchema Tests
  // ============================================

  describe('updateStatusSchema', () => {
    it('devrait accepter tous les statuts valides', () => {
      VALID_STATUSES.forEach(status => {
        const result = updateStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('devrait rejeter un objet sans status', () => {
      const result = updateStatusSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un statut invalide', () => {
      const result = updateStatusSchema.safeParse({ status: 'DISPONIBLE' });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un statut vide', () => {
      const result = updateStatusSchema.safeParse({ status: '' });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un statut numerique', () => {
      const result = updateStatusSchema.safeParse({ status: 1 });
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // createAssetItemsBulkSchema Tests
  // ============================================

  describe('createAssetItemsBulkSchema', () => {
    describe('Donnees valides', () => {
      it('devrait accepter des donnees bulk completes', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          tagPrefix: 'PC-',
          quantity: 10,
          status: 'EN_STOCK',
          notes: 'Lot de PCs'
        };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter avec seulement les champs requis', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          tagPrefix: 'PC-',
          quantity: 1
        };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter la quantite minimale (1)', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          tagPrefix: 'PC-',
          quantity: 1
        };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter la quantite maximale (100)', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          tagPrefix: 'PC-',
          quantity: 100
        };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter un tagPrefix a la limite de 20 caracteres', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          tagPrefix: 'P'.repeat(20),
          quantity: 5
        };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter notes comme null', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          tagPrefix: 'PC-',
          quantity: 5,
          notes: null
        };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Champs requis manquants', () => {
      it('devrait rejeter sans assetModelId', () => {
        const data = { tagPrefix: 'PC-', quantity: 5 };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter sans tagPrefix', () => {
        const data = { assetModelId: VALID_MODEL_CUID, quantity: 5 };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter sans quantity', () => {
        const data = { assetModelId: VALID_MODEL_CUID, tagPrefix: 'PC-' };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un assetModelId vide', () => {
        const data = { assetModelId: '', tagPrefix: 'PC-', quantity: 5 };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('ID du modèle invalide');
      });

      it('devrait rejeter un tagPrefix vide', () => {
        const data = { assetModelId: VALID_MODEL_CUID, tagPrefix: '', quantity: 5 };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('préfixe du tag est requis');
      });
    });

    describe('Contraintes de valeurs', () => {
      it('devrait rejeter une quantite de 0', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          tagPrefix: 'PC-',
          quantity: 0
        };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('au moins 1');
      });

      it('devrait rejeter une quantite negative', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          tagPrefix: 'PC-',
          quantity: -5
        };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter une quantite superieure a 100', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          tagPrefix: 'PC-',
          quantity: 101
        };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('100');
      });

      it('devrait rejeter une quantite decimale', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          tagPrefix: 'PC-',
          quantity: 5.5
        };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('entier');
      });

      it('devrait rejeter un tagPrefix de plus de 20 caracteres', () => {
        const data = {
          assetModelId: VALID_MODEL_CUID,
          tagPrefix: 'P'.repeat(21),
          quantity: 5
        };

        const result = createAssetItemsBulkSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('20 caractères');
      });
    });
  });

  // ============================================
  // bulkPreviewSchema Tests
  // ============================================

  describe('bulkPreviewSchema', () => {
    it('devrait accepter des donnees valides', () => {
      const data = { tagPrefix: 'PC-', quantity: 10 };

      const result = bulkPreviewSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait accepter la quantite minimale (1)', () => {
      const data = { tagPrefix: 'A', quantity: 1 };

      const result = bulkPreviewSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait accepter la quantite maximale (100)', () => {
      const data = { tagPrefix: 'A', quantity: 100 };

      const result = bulkPreviewSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter sans tagPrefix', () => {
      const data = { quantity: 10 };

      const result = bulkPreviewSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter sans quantity', () => {
      const data = { tagPrefix: 'PC-' };

      const result = bulkPreviewSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un tagPrefix vide', () => {
      const data = { tagPrefix: '', quantity: 10 };

      const result = bulkPreviewSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une quantite de 0', () => {
      const data = { tagPrefix: 'PC-', quantity: 0 };

      const result = bulkPreviewSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une quantite superieure a 100', () => {
      const data = { tagPrefix: 'PC-', quantity: 101 };

      const result = bulkPreviewSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une quantite decimale', () => {
      const data = { tagPrefix: 'PC-', quantity: 3.14 };

      const result = bulkPreviewSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
