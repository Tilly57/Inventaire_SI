/**
 * Equipment Types Service
 *
 * Business logic for managing equipment types (CRUD operations)
 */
import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Get all equipment types
 *
 * @returns {Promise<Array>} Array of equipment types ordered by name
 */
export async function getAllEquipmentTypes() {
  const types = await prisma.equipmentType.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  return types;
}

/**
 * Get equipment type by ID
 *
 * @param {string} id - Equipment type ID
 * @returns {Promise<Object>} Equipment type object
 * @throws {NotFoundError} If equipment type not found
 */
export async function getEquipmentTypeById(id) {
  const type = await prisma.equipmentType.findUnique({
    where: { id }
  });

  if (!type) {
    throw new NotFoundError('Type d\'équipement non trouvé');
  }

  return type;
}

/**
 * Create a new equipment type
 *
 * @param {Object} data - Equipment type data
 * @param {string} data.name - Type name
 * @returns {Promise<Object>} Created equipment type
 * @throws {ValidationError} If name already exists
 */
export async function createEquipmentType(data) {
  const { name } = data;

  // Check if name already exists
  const existing = await prisma.equipmentType.findUnique({
    where: { name }
  });

  if (existing) {
    throw new ValidationError('Un type avec ce nom existe déjà');
  }

  const type = await prisma.equipmentType.create({
    data: {
      name: name.trim()
    }
  });

  return type;
}

/**
 * Update an equipment type
 *
 * @param {string} id - Equipment type ID
 * @param {Object} data - Updated equipment type data
 * @param {string} [data.name] - New type name
 * @returns {Promise<Object>} Updated equipment type
 * @throws {NotFoundError} If equipment type not found
 * @throws {ValidationError} If new name already exists
 */
export async function updateEquipmentType(id, data) {
  const { name } = data;

  // Check if type exists
  const existingType = await prisma.equipmentType.findUnique({
    where: { id }
  });

  if (!existingType) {
    throw new NotFoundError('Type d\'équipement non trouvé');
  }

  // If name is being updated, check for uniqueness
  if (name && name !== existingType.name) {
    const nameExists = await prisma.equipmentType.findUnique({
      where: { name: name.trim() }
    });

    if (nameExists) {
      throw new ValidationError('Un type avec ce nom existe déjà');
    }
  }

  const updatedType = await prisma.equipmentType.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() })
    }
  });

  return updatedType;
}

/**
 * Delete an equipment type
 *
 * Protection: Cannot delete if type is used by any AssetModels
 *
 * @param {string} id - Equipment type ID
 * @returns {Promise<Object>} Deleted equipment type
 * @throws {NotFoundError} If equipment type not found
 * @throws {ValidationError} If type is in use by asset models
 */
export async function deleteEquipmentType(id) {
  // Check if type exists
  const existingType = await prisma.equipmentType.findUnique({
    where: { id }
  });

  if (!existingType) {
    throw new NotFoundError('Type d\'équipement non trouvé');
  }

  // Check if type is used by any AssetModels
  const usageCount = await prisma.assetModel.count({
    where: {
      type: existingType.name
    }
  });

  if (usageCount > 0) {
    throw new ValidationError(
      `Impossible de supprimer ce type : il est utilisé par ${usageCount} modèle(s) d'équipement`
    );
  }

  // Delete the type
  const deletedType = await prisma.equipmentType.delete({
    where: { id }
  });

  return deletedType;
}