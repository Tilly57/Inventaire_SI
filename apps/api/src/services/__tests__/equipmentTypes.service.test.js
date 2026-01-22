/**
 * Unit Tests for EquipmentTypes Service
 *
 * Tests for equipment types management business logic:
 * - CRUD operations (create, read, update, delete)
 * - Name uniqueness validation
 * - Trim whitespace from names
 * - Prevent deletion when type is used by AssetModels
 * - Error handling (NotFoundError, ValidationError)
 */

import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import * as equipmentTypesService from '../equipmentTypes.service.js';
import {
  cleanDatabase,
  disconnectDatabase,
  getPrismaClient
} from '../../__tests__/utils/testUtils.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';

describe('EquipmentTypes Service - getAllEquipmentTypes()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should return empty array when no equipment types exist', async () => {
    const types = await equipmentTypesService.getAllEquipmentTypes();

    expect(types).toEqual([]);
    expect(types).toHaveLength(0);
  });

  test('should return all equipment types ordered by name', async () => {
    const prisma = getPrismaClient();

    // Create equipment types in random order
    await prisma.equipmentType.create({ data: { name: 'Laptop' } });
    await prisma.equipmentType.create({ data: { name: 'Monitor' } });
    await prisma.equipmentType.create({ data: { name: 'Accessory' } });

    const types = await equipmentTypesService.getAllEquipmentTypes();

    expect(types).toHaveLength(3);
    // Ordered alphabetically by name
    expect(types[0].name).toBe('Accessory');
    expect(types[1].name).toBe('Laptop');
    expect(types[2].name).toBe('Monitor');
  });

  test('should return all fields for each equipment type', async () => {
    const prisma = getPrismaClient();
    await prisma.equipmentType.create({ data: { name: 'Server' } });

    const types = await equipmentTypesService.getAllEquipmentTypes();

    expect(types[0]).toHaveProperty('id');
    expect(types[0]).toHaveProperty('name');
    expect(types[0]).toHaveProperty('createdAt');
    expect(types[0]).toHaveProperty('updatedAt');
  });
});

describe('EquipmentTypes Service - getEquipmentTypeById()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should return equipment type by ID', async () => {
    const prisma = getPrismaClient();
    const created = await prisma.equipmentType.create({
      data: { name: 'Keyboard' }
    });

    const type = await equipmentTypesService.getEquipmentTypeById(created.id);

    expect(type).toBeDefined();
    expect(type.id).toBe(created.id);
    expect(type.name).toBe('Keyboard');
  });

  test('should throw NotFoundError if equipment type does not exist', async () => {
    await expect(
      equipmentTypesService.getEquipmentTypeById('non-existent-id')
    ).rejects.toThrow(NotFoundError);

    await expect(
      equipmentTypesService.getEquipmentTypeById('non-existent-id')
    ).rejects.toThrow('Type d\'équipement non trouvé');
  });
});

describe('EquipmentTypes Service - createEquipmentType()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should create a new equipment type', async () => {
    const data = { name: 'Desktop' };

    const type = await equipmentTypesService.createEquipmentType(data);

    expect(type).toBeDefined();
    expect(type.name).toBe('Desktop');
    expect(type.id).toBeDefined();
    expect(type.createdAt).toBeDefined();
  });

  test('should trim whitespace from name', async () => {
    const data = { name: '  Printer  ' };

    const type = await equipmentTypesService.createEquipmentType(data);

    expect(type.name).toBe('Printer');
  });

  test('should throw ValidationError if name already exists', async () => {
    const data = { name: 'Mouse' };

    await equipmentTypesService.createEquipmentType(data);

    await expect(
      equipmentTypesService.createEquipmentType(data)
    ).rejects.toThrow(ValidationError);

    await expect(
      equipmentTypesService.createEquipmentType(data)
    ).rejects.toThrow('Un type avec ce nom existe déjà');
  });

  test('should treat names as case-sensitive (allow different cases)', async () => {
    // Create type with lowercase
    const lower = await equipmentTypesService.createEquipmentType({ name: 'laptop' });

    // Creating with different case should succeed (PostgreSQL/Prisma is case-sensitive)
    const upper = await equipmentTypesService.createEquipmentType({ name: 'Laptop' });

    expect(lower.name).toBe('laptop');
    expect(upper.name).toBe('Laptop');
    expect(lower.id).not.toBe(upper.id); // Different records
  });
});

describe('EquipmentTypes Service - updateEquipmentType()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should update equipment type name', async () => {
    const prisma = getPrismaClient();
    const created = await prisma.equipmentType.create({
      data: { name: 'OldName' }
    });

    const updated = await equipmentTypesService.updateEquipmentType(created.id, {
      name: 'NewName'
    });

    expect(updated.name).toBe('NewName');
    expect(updated.id).toBe(created.id);
  });

  test('should trim whitespace from updated name', async () => {
    const prisma = getPrismaClient();
    const created = await prisma.equipmentType.create({
      data: { name: 'OldName' }
    });

    const updated = await equipmentTypesService.updateEquipmentType(created.id, {
      name: '  TrimmedName  '
    });

    expect(updated.name).toBe('TrimmedName');
  });

  test('should throw NotFoundError if equipment type does not exist', async () => {
    await expect(
      equipmentTypesService.updateEquipmentType('non-existent-id', { name: 'Test' })
    ).rejects.toThrow(NotFoundError);

    await expect(
      equipmentTypesService.updateEquipmentType('non-existent-id', { name: 'Test' })
    ).rejects.toThrow('Type d\'équipement non trouvé');
  });

  test('should throw ValidationError if new name already exists', async () => {
    const prisma = getPrismaClient();

    const type1 = await prisma.equipmentType.create({ data: { name: 'Type1' } });
    await prisma.equipmentType.create({ data: { name: 'Type2' } });

    await expect(
      equipmentTypesService.updateEquipmentType(type1.id, { name: 'Type2' })
    ).rejects.toThrow(ValidationError);

    await expect(
      equipmentTypesService.updateEquipmentType(type1.id, { name: 'Type2' })
    ).rejects.toThrow('Un type avec ce nom existe déjà');
  });

  test('should allow updating to same name (no conflict)', async () => {
    const prisma = getPrismaClient();
    const created = await prisma.equipmentType.create({
      data: { name: 'SameName' }
    });

    // Updating to same name should work (no duplicate check needed)
    const updated = await equipmentTypesService.updateEquipmentType(created.id, {
      name: 'SameName'
    });

    expect(updated.name).toBe('SameName');
  });

  test('should not update if no name provided', async () => {
    const prisma = getPrismaClient();
    const created = await prisma.equipmentType.create({
      data: { name: 'OriginalName' }
    });

    const updated = await equipmentTypesService.updateEquipmentType(created.id, {});

    expect(updated.name).toBe('OriginalName');
  });
});

describe('EquipmentTypes Service - deleteEquipmentType()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should delete equipment type successfully', async () => {
    const prisma = getPrismaClient();
    const created = await prisma.equipmentType.create({
      data: { name: 'ToDelete' }
    });

    const deleted = await equipmentTypesService.deleteEquipmentType(created.id);

    expect(deleted.id).toBe(created.id);
    expect(deleted.name).toBe('ToDelete');

    // Verify it's actually deleted
    const found = await prisma.equipmentType.findUnique({
      where: { id: created.id }
    });
    expect(found).toBeNull();
  });

  test('should throw NotFoundError if equipment type does not exist', async () => {
    await expect(
      equipmentTypesService.deleteEquipmentType('non-existent-id')
    ).rejects.toThrow(NotFoundError);

    await expect(
      equipmentTypesService.deleteEquipmentType('non-existent-id')
    ).rejects.toThrow('Type d\'équipement non trouvé');
  });

  test('should throw ValidationError if type is used by AssetModels', async () => {
    const prisma = getPrismaClient();

    // Create equipment type
    const equipType = await prisma.equipmentType.create({
      data: { name: 'InUseType' }
    });

    // Create AssetModel that uses this type
    await prisma.assetModel.create({
      data: {
        type: 'InUseType',
        brand: 'TestBrand',
        modelName: 'TestModel'
      }
    });

    await expect(
      equipmentTypesService.deleteEquipmentType(equipType.id)
    ).rejects.toThrow(ValidationError);

    await expect(
      equipmentTypesService.deleteEquipmentType(equipType.id)
    ).rejects.toThrow(/Impossible de supprimer ce type.*1 modèle/);
  });

  test('should include count in error message when type is in use', async () => {
    const prisma = getPrismaClient();

    const equipType = await prisma.equipmentType.create({
      data: { name: 'PopularType' }
    });

    // Create multiple AssetModels using this type
    await prisma.assetModel.create({
      data: { type: 'PopularType', brand: 'Brand1', modelName: 'Model1' }
    });
    await prisma.assetModel.create({
      data: { type: 'PopularType', brand: 'Brand2', modelName: 'Model2' }
    });
    await prisma.assetModel.create({
      data: { type: 'PopularType', brand: 'Brand3', modelName: 'Model3' }
    });

    await expect(
      equipmentTypesService.deleteEquipmentType(equipType.id)
    ).rejects.toThrow(/3 modèle\(s\)/);
  });

  test('should allow deletion if type is not used by any AssetModels', async () => {
    const prisma = getPrismaClient();

    const equipType = await prisma.equipmentType.create({
      data: { name: 'UnusedType' }
    });

    // Create AssetModel with a different type
    await prisma.assetModel.create({
      data: { type: 'DifferentType', brand: 'Brand', modelName: 'Model' }
    });

    // Deletion should succeed
    const deleted = await equipmentTypesService.deleteEquipmentType(equipType.id);

    expect(deleted.name).toBe('UnusedType');
  });
});
