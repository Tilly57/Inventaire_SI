/**
 * Loans routes - ADMIN and GESTIONNAIRE
 */
import express from 'express';
import { getAllLoans, getLoanById, createLoan, addLoanLine, removeLoanLine, uploadPickupSignature, uploadReturnSignature, closeLoan, deleteLoan, batchDeleteLoans, deletePickupSignature, deleteReturnSignature } from '../controllers/loans.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireManager, requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validateRequest.js';
import { createLoanSchema, addLoanLineSchema, batchDeleteLoansSchema } from '../validators/loans.validator.js';
import { upload } from '../config/multer.js';

const router = express.Router();

// All loan routes require authentication and ADMIN or GESTIONNAIRE role
router.use(requireAuth, requireManager);

// Batch delete route (ADMIN only) - MUST be before /:id routes
/**
 * @swagger
 * /api/loans/batch-delete:
 *   post:
 *     summary: Supprimer plusieurs prêts en masse
 *     tags: [Loans]
 *     description: |
 *       Suppression en masse de prêts.
 *       **Réservé aux ADMIN uniquement.**
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["clk123", "clk456", "clk789"]
 *                 description: Tableau d'IDs de prêts à supprimer
 *     responses:
 *       200:
 *         description: Prêts supprimés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 3 prêts supprimés avec succès
 *                 count:
 *                   type: integer
 *                   example: 3
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/batch-delete', requireAdmin, validate(batchDeleteLoansSchema), batchDeleteLoans);

/**
 * @swagger
 * /api/loans:
 *   get:
 *     summary: Obtenir la liste de tous les prêts
 *     tags: [Loans]
 *     description: |
 *       Retourne tous les prêts avec pagination optionnelle.
 *       Supporte les filtres de recherche et tri.
 *       **Cached 5min** - Invalidé après mutations.
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
 *         description: Recherche dans nom employé, notes
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED]
 *         description: Filtrer par statut
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Filtrer par employé
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
 *         description: Liste des prêts
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
 *                       employee:
 *                         type: object
 *                         description: Employé emprunteur
 *                       status:
 *                         type: string
 *                         enum: [OPEN, CLOSED]
 *                         example: OPEN
 *                       pickupSignedAt:
 *                         type: string
 *                         format: date-time
 *                       returnSignedAt:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       _count:
 *                         type: object
 *                         properties:
 *                           loanLines:
 *                             type: integer
 *                             description: Nombre d'articles dans le prêt
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', getAllLoans);

/**
 * @swagger
 * /api/loans/{id}:
 *   get:
 *     summary: Obtenir les détails d'un prêt
 *     tags: [Loans]
 *     description: Retourne un prêt avec toutes ses lignes et signatures
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du prêt (CUID)
 *     responses:
 *       200:
 *         description: Détails du prêt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 employee:
 *                   type: object
 *                   description: Employé complet
 *                 status:
 *                   type: string
 *                   enum: [OPEN, CLOSED]
 *                 loanLines:
 *                   type: array
 *                   description: Lignes de prêt (articles/stock)
 *                 pickupSignatureUrl:
 *                   type: string
 *                   example: /uploads/signatures/pickup-123.png
 *                 returnSignatureUrl:
 *                   type: string
 *                   example: /uploads/signatures/return-123.png
 *                 pickupSignedAt:
 *                   type: string
 *                   format: date-time
 *                 returnSignedAt:
 *                   type: string
 *                   format: date-time
 *                 closedAt:
 *                   type: string
 *                   format: date-time
 *                 notes:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/:id', getLoanById);

/**
 * @swagger
 * /api/loans:
 *   post:
 *     summary: Créer un nouveau prêt
 *     tags: [Loans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *             properties:
 *               employeeId:
 *                 type: string
 *                 example: clk123456789
 *                 description: ID de l'employé emprunteur
 *               notes:
 *                 type: string
 *                 example: Prêt pour mission client
 *                 description: Notes additionnelles (optionnel)
 *     responses:
 *       201:
 *         description: Prêt créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 employeeId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: OPEN
 *                 notes:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', validate(createLoanSchema), createLoan);

/**
 * @swagger
 * /api/loans/{id}/lines:
 *   post:
 *     summary: Ajouter une ligne de prêt (article ou stock)
 *     tags: [Loans]
 *     description: |
 *       Ajoute un article ou stock item au prêt.
 *       Pour assetItem: statut doit être EN_STOCK.
 *       Pour stockItem: quantité décrémentée automatiquement.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du prêt (CUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assetItemId:
 *                 type: string
 *                 example: clk123456789
 *                 description: ID d'un article d'équipement (exclusif avec stockItemId)
 *               stockItemId:
 *                 type: string
 *                 example: clk987654321
 *                 description: ID d'un article consommable (exclusif avec assetItemId)
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *                 description: Quantité (requis si stockItemId)
 *     responses:
 *       201:
 *         description: Ligne ajoutée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 loanId:
 *                   type: string
 *                 assetItemId:
 *                   type: string
 *                 stockItemId:
 *                   type: string
 *                 quantity:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Prêt ou article non trouvé
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/:id/lines', validate(addLoanLineSchema), addLoanLine);

/**
 * @swagger
 * /api/loans/{id}/lines/{lineId}:
 *   delete:
 *     summary: Retirer une ligne de prêt
 *     tags: [Loans]
 *     description: |
 *       Supprime une ligne de prêt.
 *       Pour assetItem: statut remis à EN_STOCK.
 *       Pour stockItem: quantité restaurée.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du prêt (CUID)
 *       - in: path
 *         name: lineId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ligne de prêt (CUID)
 *     responses:
 *       200:
 *         description: Ligne retirée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ligne de prêt retirée avec succès
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/:id/lines/:lineId', removeLoanLine);

/**
 * @swagger
 * /api/loans/{id}/pickup-signature:
 *   post:
 *     summary: Upload la signature de retrait (pickup)
 *     tags: [Loans]
 *     description: |
 *       Upload d'une image de signature pour le retrait des équipements.
 *       Format: multipart/form-data avec fichier image.
 *       Accepté: PNG, JPG, JPEG (max 5MB).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du prêt (CUID)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - signature
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Fichier image de la signature
 *     responses:
 *       200:
 *         description: Signature uploadée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Signature de retrait uploadée avec succès
 *                 pickupSignatureUrl:
 *                   type: string
 *                   example: /uploads/signatures/pickup-123.png
 *                 pickupSignedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/:id/pickup-signature', upload.single('signature'), uploadPickupSignature);

/**
 * @swagger
 * /api/loans/{id}/return-signature:
 *   post:
 *     summary: Upload la signature de retour (return)
 *     tags: [Loans]
 *     description: |
 *       Upload d'une image de signature pour le retour des équipements.
 *       Format: multipart/form-data avec fichier image.
 *       Accepté: PNG, JPG, JPEG (max 5MB).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du prêt (CUID)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - signature
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Fichier image de la signature
 *     responses:
 *       200:
 *         description: Signature uploadée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Signature de retour uploadée avec succès
 *                 returnSignatureUrl:
 *                   type: string
 *                   example: /uploads/signatures/return-123.png
 *                 returnSignedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/:id/return-signature', upload.single('signature'), uploadReturnSignature);

/**
 * @swagger
 * /api/loans/{id}/pickup-signature:
 *   delete:
 *     summary: Supprimer la signature de retrait
 *     tags: [Loans]
 *     description: |
 *       Supprime le fichier de signature de retrait et les métadonnées.
 *       **Réservé aux ADMIN uniquement.**
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du prêt (CUID)
 *     responses:
 *       200:
 *         description: Signature supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Signature de retrait supprimée avec succès
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/:id/pickup-signature', requireAdmin, deletePickupSignature);

/**
 * @swagger
 * /api/loans/{id}/return-signature:
 *   delete:
 *     summary: Supprimer la signature de retour
 *     tags: [Loans]
 *     description: |
 *       Supprime le fichier de signature de retour et les métadonnées.
 *       **Réservé aux ADMIN uniquement.**
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du prêt (CUID)
 *     responses:
 *       200:
 *         description: Signature supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Signature de retour supprimée avec succès
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/:id/return-signature', requireAdmin, deleteReturnSignature);

/**
 * @swagger
 * /api/loans/{id}/close:
 *   patch:
 *     summary: Clôturer un prêt
 *     tags: [Loans]
 *     description: |
 *       Ferme un prêt (statut → CLOSED).
 *       Tous les assetItems sont remis en stock automatiquement.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du prêt (CUID)
 *     responses:
 *       200:
 *         description: Prêt clôturé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Prêt clôturé avec succès
 *                 closedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Prêt déjà clôturé
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch('/:id/close', closeLoan);

/**
 * @swagger
 * /api/loans/{id}:
 *   delete:
 *     summary: Supprimer un prêt
 *     tags: [Loans]
 *     description: |
 *       Supprime un prêt et toutes ses lignes.
 *       Articles remis en stock, quantités stock restaurées.
 *       Signatures fichiers supprimés.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du prêt (CUID)
 *     responses:
 *       200:
 *         description: Prêt supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Prêt supprimé avec succès
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/:id', deleteLoan);

export default router;
