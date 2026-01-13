/**
 * Employees routes - ADMIN and GESTIONNAIRE
 */
import express from 'express';
import { getAllEmployees, getEmployeeById, createEmployee, bulkCreateEmployees, updateEmployee, deleteEmployee } from '../controllers/employees.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireManager } from '../middleware/rbac.js';
import { validate } from '../middleware/validateRequest.js';
import { createEmployeeSchema, bulkCreateEmployeesSchema, updateEmployeeSchema } from '../validators/employees.validator.js';

const router = express.Router();

// All employee routes require authentication and ADMIN or GESTIONNAIRE role
router.use(requireAuth, requireManager);

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Obtenir la liste de tous les employés
 *     tags: [Employees]
 *     description: |
 *       Retourne tous les employés avec pagination optionnelle.
 *       Supporte les filtres de recherche et tri.
 *       **Cached 10min** - Invalidé après mutations.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche dans nom, prénom, email, département
 *       - in: query
 *         name: dept
 *         schema:
 *           type: string
 *         description: Filtrer par département
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Champ de tri
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordre de tri
 *     responses:
 *       200:
 *         description: Liste des employés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       dept:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       _count:
 *                         type: object
 *                         properties:
 *                           loans:
 *                             type: integer
 *                             description: Nombre de prêts
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', getAllEmployees);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Obtenir les détails d'un employé
 *     tags: [Employees]
 *     description: Retourne un employé avec ses 10 derniers prêts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'employé (CUID)
 *     responses:
 *       200:
 *         description: Détails de l'employé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 dept:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 loans:
 *                   type: array
 *                   description: 10 prêts les plus récents
 *                   items:
 *                     type: object
 *                 _count:
 *                   type: object
 *                   properties:
 *                     loans:
 *                       type: integer
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id', getEmployeeById);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Créer un nouvel employé
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Jean
 *               lastName:
 *                 type: string
 *                 example: Dupont
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jean.dupont@groupetilly.com
 *               dept:
 *                 type: string
 *                 example: Woippy
 *     responses:
 *       201:
 *         description: Employé créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 dept:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email déjà utilisé
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', validate(createEmployeeSchema), createEmployee);

/**
 * @swagger
 * /api/employees/bulk:
 *   post:
 *     summary: Créer plusieurs employés en masse
 *     tags: [Employees]
 *     description: Permet d'importer plusieurs employés en une seule requête
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employees
 *             properties:
 *               employees:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - firstName
 *                     - lastName
 *                     - email
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: Jean
 *                     lastName:
 *                       type: string
 *                       example: Dupont
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: jean.dupont@groupetilly.com
 *                     dept:
 *                       type: string
 *                       example: Woippy
 *     responses:
 *       201:
 *         description: Employés créés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 15 employés créés avec succès
 *                 count:
 *                   type: integer
 *                   example: 15
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Un ou plusieurs emails déjà utilisés
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/bulk', validate(bulkCreateEmployeesSchema), bulkCreateEmployees);

/**
 * @swagger
 * /api/employees/{id}:
 *   patch:
 *     summary: Mettre à jour un employé
 *     tags: [Employees]
 *     description: Mise à jour partielle des informations d'un employé
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'employé (CUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Jean
 *               lastName:
 *                 type: string
 *                 example: Dupont
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jean.dupont@groupetilly.com
 *               dept:
 *                 type: string
 *                 example: Metz
 *     responses:
 *       200:
 *         description: Employé mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 dept:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Email déjà utilisé par un autre employé
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/:id', validate(updateEmployeeSchema), updateEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Supprimer un employé
 *     tags: [Employees]
 *     description: Suppression d'un employé (attention aux prêts associés)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'employé (CUID)
 *     responses:
 *       200:
 *         description: Employé supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employé supprimé avec succès
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         description: Impossible de supprimer (prêts en cours)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:id', deleteEmployee);

export default router;
