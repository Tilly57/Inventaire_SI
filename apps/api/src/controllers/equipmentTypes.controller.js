/**
 * Equipment Types Controller
 *
 * HTTP request handlers for equipment types endpoints
 */
import * as equipmentTypesService from '../services/equipmentTypes.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * GET /api/equipment-types
 * Get all equipment types
 */
export const getAllTypes = asyncHandler(async (req, res) => {
  const types = await equipmentTypesService.getAllEquipmentTypes();

  res.json({
    success: true,
    data: types
  });
});

/**
 * GET /api/equipment-types/:id
 * Get equipment type by ID
 */
export const getTypeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const type = await equipmentTypesService.getEquipmentTypeById(id);

  res.json({
    success: true,
    data: type
  });
});

/**
 * POST /api/equipment-types
 * Create a new equipment type
 */
export const createType = asyncHandler(async (req, res) => {
  const type = await equipmentTypesService.createEquipmentType(req.body);

  res.status(201).json({
    success: true,
    data: type,
    message: 'Type d\'équipement créé avec succès'
  });
});

/**
 * PATCH /api/equipment-types/:id
 * Update an equipment type
 */
export const updateType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const type = await equipmentTypesService.updateEquipmentType(id, req.body);

  res.json({
    success: true,
    data: type,
    message: 'Type d\'équipement modifié avec succès'
  });
});

/**
 * DELETE /api/equipment-types/:id
 * Delete an equipment type
 */
export const deleteType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await equipmentTypesService.deleteEquipmentType(id);

  res.json({
    success: true,
    message: 'Type d\'équipement supprimé avec succès'
  });
});