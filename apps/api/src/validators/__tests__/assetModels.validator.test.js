/**
 * @fileoverview Tests for asset model validation schemas
 *
 * Tests cover:
 * - createAssetModelSchema: required fields, max lengths
 * - updateAssetModelSchema: all fields optional
 * - batchDeleteAssetModelsSchema: array of CUIDs with min/max constraints
 * - Edge cases and error messages
 */

import { describe, it, expect } from '@jest/globals';
import {
  createAssetModelSchema,
  updateAssetModelSchema,
  batchDeleteAssetModelsSchema
} from '../assetModels.validator.js';

const VALID_CUID = 'cjld2cyuq0000t3rmniod1foy';
const VALID_CUID_2 = 'cjld2cyuq0001t3rmniod1foz';

describe('AssetModel Validators', () => {
  // ============================================
  // createAssetModelSchema Tests
  // ============================================

  describe('createAssetModelSchema', () => {
    describe('Donnees valides', () => {
      it('devrait accepter un modele avec tous les champs remplis', () => {
        const data = {
          type: 'Ordinateur portable',
          brand: 'Dell',
          modelName: 'Latitude 5520'
        };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter un type a la limite de 100 caracteres', () => {
        const data = {
          type: 'T'.repeat(100),
          brand: 'Dell',
          modelName: 'Latitude'
        };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter une marque a la limite de 100 caracteres', () => {
        const data = {
          type: 'PC',
          brand: 'B'.repeat(100),
          modelName: 'Latitude'
        };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter un modelName a la limite de 200 caracteres', () => {
        const data = {
          type: 'PC',
          brand: 'Dell',
          modelName: 'M'.repeat(200)
        };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter des champs avec un seul caractere', () => {
        const data = {
          type: 'A',
          brand: 'B',
          modelName: 'C'
        };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Champs requis manquants', () => {
      it('devrait rejeter un objet sans type', () => {
        const data = { brand: 'Dell', modelName: 'Latitude' };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un objet sans brand', () => {
        const data = { type: 'PC', modelName: 'Latitude' };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un objet sans modelName', () => {
        const data = { type: 'PC', brand: 'Dell' };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un objet vide', () => {
        const result = createAssetModelSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un type vide', () => {
        const data = { type: '', brand: 'Dell', modelName: 'Latitude' };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('Type requis');
      });

      it('devrait rejeter une marque vide', () => {
        const data = { type: 'PC', brand: '', modelName: 'Latitude' };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('Marque requise');
      });

      it('devrait rejeter un modelName vide', () => {
        const data = { type: 'PC', brand: 'Dell', modelName: '' };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('Nom du modèle requis');
      });
    });

    describe('Depassement de longueur maximale', () => {
      it('devrait rejeter un type de plus de 100 caracteres', () => {
        const data = {
          type: 'T'.repeat(101),
          brand: 'Dell',
          modelName: 'Latitude'
        };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('100 caractères');
      });

      it('devrait rejeter une marque de plus de 100 caracteres', () => {
        const data = {
          type: 'PC',
          brand: 'B'.repeat(101),
          modelName: 'Latitude'
        };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('100 caractères');
      });

      it('devrait rejeter un modelName de plus de 200 caracteres', () => {
        const data = {
          type: 'PC',
          brand: 'Dell',
          modelName: 'M'.repeat(201)
        };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('200 caractères');
      });
    });

    describe('Cas limites', () => {
      it('devrait rejeter un input null', () => {
        const result = createAssetModelSchema.safeParse(null);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un input undefined', () => {
        const result = createAssetModelSchema.safeParse(undefined);
        expect(result.success).toBe(false);
      });

      it('devrait accepter des champs avec des caracteres speciaux', () => {
        const data = {
          type: 'Ecran 27"',
          brand: "Hewlett-Packard (HP)",
          modelName: 'EliteDisplay E273q - 27"'
        };

        const result = createAssetModelSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================
  // updateAssetModelSchema Tests
  // ============================================

  describe('updateAssetModelSchema', () => {
    it('devrait accepter une mise a jour complete', () => {
      const data = {
        type: 'Moniteur',
        brand: 'LG',
        modelName: 'UltraWide 34'
      };

      const result = updateAssetModelSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait accepter un objet vide', () => {
      const result = updateAssetModelSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('devrait accepter une mise a jour partielle (un seul champ)', () => {
      const result = updateAssetModelSchema.safeParse({ brand: 'Samsung' });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un type vide quand fourni', () => {
      const result = updateAssetModelSchema.safeParse({ type: '' });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une marque vide quand fourni', () => {
      const result = updateAssetModelSchema.safeParse({ brand: '' });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un modelName vide quand fourni', () => {
      const result = updateAssetModelSchema.safeParse({ modelName: '' });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un type depassant 100 caracteres', () => {
      const result = updateAssetModelSchema.safeParse({ type: 'T'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // batchDeleteAssetModelsSchema Tests
  // ============================================

  describe('batchDeleteAssetModelsSchema', () => {
    it('devrait accepter un tableau avec un seul CUID', () => {
      const data = { modelIds: [VALID_CUID] };

      const result = batchDeleteAssetModelsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait accepter un tableau avec plusieurs CUIDs', () => {
      const data = { modelIds: [VALID_CUID, VALID_CUID_2] };

      const result = batchDeleteAssetModelsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait accepter un tableau avec 100 CUIDs (maximum)', () => {
      const cuidList = Array.from({ length: 100 }, (_, i) =>
        `cjld2cyuq${String(i).padStart(4, '0')}t3rmniod1foy`
      );
      const data = { modelIds: cuidList };

      const result = batchDeleteAssetModelsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un tableau vide', () => {
      const data = { modelIds: [] };

      const result = batchDeleteAssetModelsSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Au moins un modèle');
    });

    it('devrait rejeter un tableau de plus de 100 elements', () => {
      const cuidList = Array.from({ length: 101 }, (_, i) =>
        `cjld2cyuq${String(i).padStart(4, '0')}t3rmniod1foy`
      );
      const data = { modelIds: cuidList };

      const result = batchDeleteAssetModelsSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('100 modèles');
    });

    it('devrait rejeter un tableau avec des IDs non-CUID', () => {
      const data = { modelIds: ['not-a-cuid'] };

      const result = batchDeleteAssetModelsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un tableau avec des UUIDs', () => {
      const data = { modelIds: ['550e8400-e29b-41d4-a716-446655440000'] };

      const result = batchDeleteAssetModelsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter sans la propriete modelIds', () => {
      const result = batchDeleteAssetModelsSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('devrait rejeter si modelIds n\'est pas un tableau', () => {
      const data = { modelIds: VALID_CUID };

      const result = batchDeleteAssetModelsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter si un element du tableau est invalide', () => {
      const data = { modelIds: [VALID_CUID, 'invalide', VALID_CUID_2] };

      const result = batchDeleteAssetModelsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
