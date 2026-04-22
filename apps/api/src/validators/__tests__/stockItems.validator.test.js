/**
 * @fileoverview Tests for stock item validation schemas
 *
 * Tests cover:
 * - createStockItemSchema: required assetModelId, optional quantity/notes
 * - updateStockItemSchema: all fields optional
 * - adjustQuantitySchema: required integer quantity (can be negative)
 * - Edge cases and error messages
 */

import { describe, it, expect } from '@jest/globals';
import {
  createStockItemSchema,
  updateStockItemSchema,
  adjustQuantitySchema
} from '../stockItems.validator.js';

describe('StockItem Validators', () => {
  // ============================================
  // createStockItemSchema Tests
  // ============================================

  describe('createStockItemSchema', () => {
    describe('Donnees valides', () => {
      it('devrait accepter un stock item avec tous les champs', () => {
        const data = {
          assetModelId: 'model-123',
          quantity: 50,
          notes: 'Stock initial de cables HDMI'
        };

        const result = createStockItemSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter un stock item avec seulement assetModelId', () => {
        const data = { assetModelId: 'model-123' };

        const result = createStockItemSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter une quantite de 0', () => {
        const data = {
          assetModelId: 'model-123',
          quantity: 0
        };

        const result = createStockItemSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter une grande quantite', () => {
        const data = {
          assetModelId: 'model-123',
          quantity: 999999
        };

        const result = createStockItemSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter notes comme null', () => {
        const data = {
          assetModelId: 'model-123',
          notes: null
        };

        const result = createStockItemSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('devrait accepter des notes a la limite de 1000 caracteres', () => {
        const data = {
          assetModelId: 'model-123',
          notes: 'N'.repeat(1000)
        };

        const result = createStockItemSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('Champs requis manquants', () => {
      it('devrait rejeter un objet vide', () => {
        const result = createStockItemSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('devrait rejeter sans assetModelId', () => {
        const data = { quantity: 10 };

        const result = createStockItemSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un assetModelId vide', () => {
        const data = { assetModelId: '' };

        const result = createStockItemSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('ID du modèle requis');
      });
    });

    describe('Contraintes de valeurs', () => {
      it('devrait rejeter une quantite negative', () => {
        const data = {
          assetModelId: 'model-123',
          quantity: -1
        };

        const result = createStockItemSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('positive');
      });

      it('devrait rejeter une quantite decimale', () => {
        const data = {
          assetModelId: 'model-123',
          quantity: 10.5
        };

        const result = createStockItemSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter des notes de plus de 1000 caracteres', () => {
        const data = {
          assetModelId: 'model-123',
          notes: 'N'.repeat(1001)
        };

        const result = createStockItemSchema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toContain('1000 caractères');
      });
    });

    describe('Cas limites', () => {
      it('devrait rejeter un input null', () => {
        const result = createStockItemSchema.safeParse(null);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un input undefined', () => {
        const result = createStockItemSchema.safeParse(undefined);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter une quantite string', () => {
        const data = {
          assetModelId: 'model-123',
          quantity: '10'
        };

        const result = createStockItemSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================
  // updateStockItemSchema Tests
  // ============================================

  describe('updateStockItemSchema', () => {
    it('devrait accepter une mise a jour complete', () => {
      const data = {
        assetModelId: 'model-456',
        quantity: 25,
        notes: 'Stock mis a jour'
      };

      const result = updateStockItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('devrait accepter un objet vide', () => {
      const result = updateStockItemSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('devrait accepter une mise a jour partielle (quantite seule)', () => {
      const result = updateStockItemSchema.safeParse({ quantity: 100 });
      expect(result.success).toBe(true);
    });

    it('devrait accepter une mise a jour partielle (notes seules)', () => {
      const result = updateStockItemSchema.safeParse({ notes: 'Mise a jour' });
      expect(result.success).toBe(true);
    });

    it('devrait accepter null pour notes', () => {
      const result = updateStockItemSchema.safeParse({ notes: null });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un assetModelId vide quand fourni', () => {
      const result = updateStockItemSchema.safeParse({ assetModelId: '' });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter une quantite negative quand fournie', () => {
      const result = updateStockItemSchema.safeParse({ quantity: -5 });
      expect(result.success).toBe(false);
    });

    it('devrait rejeter des notes trop longues quand fournies', () => {
      const result = updateStockItemSchema.safeParse({ notes: 'N'.repeat(1001) });
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // adjustQuantitySchema Tests
  // ============================================

  describe('adjustQuantitySchema', () => {
    describe('Donnees valides', () => {
      it('devrait accepter une quantite positive', () => {
        const result = adjustQuantitySchema.safeParse({ quantity: 10 });
        expect(result.success).toBe(true);
      });

      it('devrait accepter une quantite negative (retrait de stock)', () => {
        const result = adjustQuantitySchema.safeParse({ quantity: -5 });
        expect(result.success).toBe(true);
      });

      it('devrait accepter une quantite de 0', () => {
        const result = adjustQuantitySchema.safeParse({ quantity: 0 });
        expect(result.success).toBe(true);
      });

      it('devrait accepter une grande quantite positive', () => {
        const result = adjustQuantitySchema.safeParse({ quantity: 999999 });
        expect(result.success).toBe(true);
      });

      it('devrait accepter une grande quantite negative', () => {
        const result = adjustQuantitySchema.safeParse({ quantity: -999999 });
        expect(result.success).toBe(true);
      });
    });

    describe('Champs requis manquants', () => {
      it('devrait rejeter un objet vide', () => {
        const result = adjustQuantitySchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });

    describe('Formats invalides', () => {
      it('devrait rejeter une quantite decimale', () => {
        const result = adjustQuantitySchema.safeParse({ quantity: 3.14 });
        expect(result.success).toBe(false);
      });

      it('devrait rejeter une quantite string', () => {
        const result = adjustQuantitySchema.safeParse({ quantity: '10' });
        expect(result.success).toBe(false);
      });

      it('devrait rejeter une quantite null', () => {
        const result = adjustQuantitySchema.safeParse({ quantity: null });
        expect(result.success).toBe(false);
      });

      it('devrait rejeter une quantite boolean', () => {
        const result = adjustQuantitySchema.safeParse({ quantity: true });
        expect(result.success).toBe(false);
      });
    });

    describe('Cas limites', () => {
      it('devrait rejeter un input null', () => {
        const result = adjustQuantitySchema.safeParse(null);
        expect(result.success).toBe(false);
      });

      it('devrait rejeter un input undefined', () => {
        const result = adjustQuantitySchema.safeParse(undefined);
        expect(result.success).toBe(false);
      });
    });
  });
});
