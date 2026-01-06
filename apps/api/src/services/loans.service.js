/**
 * @fileoverview Loans service - Business logic for loan management
 *
 * This service handles the complete loan workflow including:
 * - Creating and managing loans
 * - Adding/removing loan lines (asset items and stock items)
 * - Digital signature uploads (pickup and return)
 * - Loan status management and closure
 * - Stock quantity and asset status synchronization
 */

import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { deleteSignatureFile, deleteSignatureFiles } from '../utils/fileUtils.js';
import { saveBase64Image } from '../utils/saveBase64Image.js';
import { findOneOrFail } from '../utils/prismaHelpers.js';
import { logCreate, logUpdate, logDelete } from '../utils/auditHelpers.js';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get all loans with optional filters
 *
 * @param {Object} filters - Optional filters for querying loans
 * @param {string} [filters.status] - Filter by loan status (OPEN/CLOSED)
 * @param {string} [filters.employeeId] - Filter by employee ID
 * @returns {Promise<Array>} Array of loan objects with employee, creator, and line details
 *
 * @example
 * // Get all open loans
 * const openLoans = await getAllLoans({ status: 'OPEN' });
 *
 * // Get all loans for a specific employee
 * const employeeLoans = await getAllLoans({ employeeId: 'cuid123' });
 */
export async function getAllLoans(filters = {}) {
  const { status, employeeId } = filters;

  // Build dynamic WHERE clause based on provided filters
  const where = {
    deletedAt: null  // Exclude soft-deleted loans
  };

  if (status) {
    where.status = status;
  }

  if (employeeId) {
    where.employeeId = employeeId;
  }

  const loans = await prisma.loan.findMany({
    where,
    orderBy: { openedAt: 'desc' },
    include: {
      employee: true,  // Include full employee details
      createdBy: {     // Include user who created the loan
        select: {
          id: true,
          email: true,
          role: true
        }
      },
      lines: {         // Include all loan lines with asset/stock details
        include: {
          assetItem: {
            include: {
              assetModel: true  // Include equipment model information
            }
          },
          stockItem: true
        }
      }
    }
  });

  return loans;
}

/**
 * Get a single loan by ID with full details
 *
 * @param {string} id - The loan ID (CUID format)
 * @returns {Promise<Object>} Loan object with employee, creator, and line details
 * @throws {NotFoundError} If loan doesn't exist
 *
 * @example
 * const loan = await getLoanById('clijrn9ht0000...');
 */
export async function getLoanById(id) {
  const loan = await findOneOrFail('loan', { id }, {
    include: {
      employee: true,
      createdBy: {
        select: {
          id: true,
          email: true,
          role: true
        }
      },
      lines: {
        include: {
          assetItem: {
            include: {
              assetModel: true
            }
          },
          stockItem: true
        }
      }
    },
    errorMessage: 'Prêt non trouvé'
  });

  return loan;
}

/**
 * Create a new loan for an employee
 *
 * Initial loan is created with status OPEN and no lines.
 * Lines must be added separately using addLoanLine().
 *
 * @param {string} employeeId - The employee ID who is borrowing
 * @param {string} createdById - The user ID creating the loan
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Newly created loan object
 * @throws {NotFoundError} If employee doesn't exist
 *
 * @example
 * const loan = await createLoan('employee_cuid', 'user_cuid', req);
 */
export async function createLoan(employeeId, createdById, req) {
  // Validate employee exists before creating loan
  await findOneOrFail('employee', { id: employeeId }, {
    errorMessage: 'Employé non trouvé'
  });

  const loan = await prisma.loan.create({
    data: {
      employeeId,
      createdById,
      status: 'OPEN'  // New loans always start as OPEN
    },
    include: {
      employee: true,
      createdBy: {
        select: {
          id: true,
          email: true,
          role: true
        }
      },
      lines: true
    }
  });

  // Audit trail
  await logCreate('Loan', loan.id, req, { employeeId, status: 'OPEN' });

  return loan;
}

/**
 * Add a line (item) to an existing loan
 *
 * Can add either an asset item (unique equipment) or stock item (consumables).
 * Automatically handles:
 * - Asset status updates (EN_STOCK → PRETE)
 * - Stock quantity decrements
 * - Transaction atomicity for data consistency
 *
 * @param {string} loanId - The loan ID to add line to
 * @param {Object} data - Line data
 * @param {string} [data.assetItemId] - Asset item ID (for unique equipment)
 * @param {string} [data.stockItemId] - Stock item ID (for consumables)
 * @param {number} [data.quantity] - Quantity (for stock items, default 1)
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Created loan line with item details
 * @throws {NotFoundError} If loan, asset, or stock item not found
 * @throws {ValidationError} If loan is closed, item unavailable, or insufficient stock
 *
 * @example
 * // Add an asset item (laptop)
 * await addLoanLine('loan123', { assetItemId: 'asset456' }, req);
 *
 * // Add stock items (3 HDMI cables)
 * await addLoanLine('loan123', { stockItemId: 'stock789', quantity: 3 }, req);
 */
export async function addLoanLine(loanId, data, req) {
  // Check if loan exists and is open
  const loan = await findOneOrFail('loan', { id: loanId }, {
    errorMessage: 'Prêt non trouvé'
  });

  if (loan.deletedAt) {
    throw new ValidationError('Impossible de modifier un prêt supprimé');
  }
  if (loan.status === 'CLOSED') {
    throw new ValidationError('Impossible d\'ajouter des articles à un prêt fermé');
  }

  // Validate that either assetItemId or stockItemId is provided (but not both)
  if (!data.assetItemId && !data.stockItemId) {
    throw new ValidationError('Vous devez spécifier soit un article d\'équipement soit un article de stock');
  }

  // Handle Asset Item (unique equipment like laptops, monitors)
  if (data.assetItemId) {
    const assetItem = await findOneOrFail('assetItem', { id: data.assetItemId }, {
      errorMessage: 'Article d\'équipement non trouvé'
    });

    // Verify asset is available for loan
    if (assetItem.status !== 'EN_STOCK') {
      throw new ValidationError('Cet article n\'est pas disponible');
    }

    // Use transaction to ensure atomicity:
    // Both loan line creation AND asset status update must succeed
    const [loanLine] = await prisma.$transaction([
      prisma.loanLine.create({
        data: {
          loanId,
          assetItemId: data.assetItemId,
          quantity: 1  // Asset items always have quantity of 1
        },
        include: {
          assetItem: {
            include: {
              assetModel: true
            }
          }
        }
      }),
      prisma.assetItem.update({
        where: { id: data.assetItemId },
        data: { status: 'PRETE' }  // Mark asset as loaned
      })
    ]);

    // Audit trail
    await logUpdate('Loan', loanId, req, {}, { action: 'ADD_ASSET_LINE', assetItemId: data.assetItemId });

    return loanLine;
  }

  // Handle Stock Item (consumables like cables, adapters)
  if (data.stockItemId) {
    const stockItem = await findOneOrFail('stockItem', { id: data.stockItemId }, {
      errorMessage: 'Article de stock non trouvé'
    });

    const quantity = data.quantity || 1;

    // Verify sufficient quantity available (total - loaned)
    const available = stockItem.quantity - (stockItem.loaned || 0);
    if (available < quantity) {
      throw new ValidationError(`Quantité insuffisante en stock (disponible: ${available})`);
    }

    // Use transaction to ensure atomicity:
    // Both loan line creation AND stock update must succeed
    const [loanLine] = await prisma.$transaction([
      prisma.loanLine.create({
        data: {
          loanId,
          stockItemId: data.stockItemId,
          quantity
        },
        include: {
          stockItem: true
        }
      }),
      prisma.stockItem.update({
        where: { id: data.stockItemId },
        data: {
          loaned: (stockItem.loaned || 0) + quantity  // Only increment loaned, quantity stays the same
        }
      })
    ]);

    // Audit trail
    await logUpdate('Loan', loanId, req, {}, { action: 'ADD_STOCK_LINE', stockItemId: data.stockItemId, quantity });

    return loanLine;
  }
}

/**
 * Remove a line from a loan
 *
 * Automatically reverts:
 * - Asset status (PRETE → EN_STOCK)
 * - Stock quantities (increment back)
 *
 * @param {string} loanId - The loan ID
 * @param {string} lineId - The loan line ID to remove
 * @returns {Promise<Object>} Success message
 * @throws {NotFoundError} If loan or line not found
 * @throws {ValidationError} If loan is closed
 *
 * @example
 * await removeLoanLine('loan123', 'line456');
 */
export async function removeLoanLine(loanId, lineId) {
  // Check if loan exists and is open
  const loan = await findOneOrFail('loan', { id: loanId }, {
    errorMessage: 'Prêt non trouvé'
  });

  if (loan.deletedAt) {
    throw new ValidationError('Impossible de modifier un prêt supprimé');
  }
  if (loan.status === 'CLOSED') {
    throw new ValidationError('Impossible de modifier un prêt fermé');
  }

  // Get loan line with item details
  const loanLine = await prisma.loanLine.findUnique({
    where: { id: lineId },
    include: {
      assetItem: true,
      stockItem: true
    }
  });

  // Verify line exists and belongs to this loan
  if (!loanLine || loanLine.loanId !== loanId) {
    throw new NotFoundError('Ligne de prêt non trouvée');
  }

  // If asset item, restore status to EN_STOCK
  if (loanLine.assetItemId) {
    await prisma.$transaction([
      prisma.loanLine.delete({ where: { id: lineId } }),
      prisma.assetItem.update({
        where: { id: loanLine.assetItemId },
        data: { status: 'EN_STOCK' }  // Mark asset as available again
      })
    ]);
  }

  // If stock item, decrement loaned (quantity stays the same)
  if (loanLine.stockItemId) {
    await prisma.$transaction([
      prisma.loanLine.delete({ where: { id: lineId } }),
      prisma.stockItem.update({
        where: { id: loanLine.stockItemId },
        data: {
          loaned: { decrement: loanLine.quantity }  // Decrement loaned quantity, total quantity unchanged
        }
      })
    ]);
  }

  return { message: 'Ligne de prêt supprimée avec succès' };
}

/**
 * Upload pickup signature for a loan
 *
 * Records the signature image and timestamp when employee
 * picks up/receives the loaned items.
 *
 * @param {string} loanId - The loan ID
 * @param {Object} file - Multer file object containing signature image
 * @param {string} file.filename - Generated filename for the signature
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Updated loan with signature URL
 * @throws {NotFoundError} If loan doesn't exist
 *
 * @example
 * const updatedLoan = await uploadPickupSignature('loan123', req.file, req);
 */
export async function uploadPickupSignature(loanId, fileOrBase64, req) {
  // Check if loan exists
  const loan = await findOneOrFail('loan', { id: loanId }, {
    errorMessage: 'Prêt non trouvé'
  });

  if (loan.deletedAt) {
    throw new ValidationError('Impossible de modifier un prêt supprimé');
  }

  let filename;

  // Check if it's a base64 string or multer file
  if (typeof fileOrBase64 === 'string') {
    // Base64 string - save it to file
    const signaturesDir = process.env.SIGNATURES_DIR || path.join(__dirname, '../../uploads/signatures');
    filename = await saveBase64Image(fileOrBase64, signaturesDir);
  } else if (fileOrBase64 && fileOrBase64.filename) {
    // Multer file object
    filename = fileOrBase64.filename;
  } else {
    throw new ValidationError('Aucune signature fournie');
  }

  // Generate signature URL path (accessible via static file serving)
  const signatureUrl = `/uploads/signatures/${filename}`;

  // Update loan with pickup signature
  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      pickupSignatureUrl: signatureUrl,
      pickupSignedAt: new Date()  // Record exact timestamp
    },
    include: {
      employee: true,
      lines: {
        include: {
          assetItem: {
            include: {
              assetModel: true
            }
          },
          stockItem: true
        }
      }
    }
  });

  // Audit trail
  await logUpdate('Loan', loanId, req, { pickupSignedAt: loan.pickupSignedAt }, { pickupSignedAt: updatedLoan.pickupSignedAt, pickupSignatureUrl: signatureUrl });

  return updatedLoan;
}

/**
 * Upload return signature for a loan
 *
 * Records the signature image and timestamp when employee
 * returns the loaned items.
 *
 * @param {string} loanId - The loan ID
 * @param {Object} file - Multer file object containing signature image
 * @param {string} file.filename - Generated filename for the signature
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Updated loan with signature URL
 * @throws {NotFoundError} If loan doesn't exist
 *
 * @example
 * const updatedLoan = await uploadReturnSignature('loan123', req.file, req);
 */
export async function uploadReturnSignature(loanId, fileOrBase64, req) {
  // Check if loan exists
  const loan = await findOneOrFail('loan', { id: loanId }, {
    errorMessage: 'Prêt non trouvé'
  });

  if (loan.deletedAt) {
    throw new ValidationError('Impossible de modifier un prêt supprimé');
  }

  let filename;

  // Check if it's a base64 string or multer file
  if (typeof fileOrBase64 === 'string') {
    // Base64 string - save it to file
    const signaturesDir = process.env.SIGNATURES_DIR || path.join(__dirname, '../../uploads/signatures');
    filename = await saveBase64Image(fileOrBase64, signaturesDir);
  } else if (fileOrBase64 && fileOrBase64.filename) {
    // Multer file object
    filename = fileOrBase64.filename;
  } else {
    throw new ValidationError('Aucune signature fournie');
  }

  // Generate signature URL path
  const signatureUrl = `/uploads/signatures/${filename}`;

  // Update loan with return signature
  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      returnSignatureUrl: signatureUrl,
      returnSignedAt: new Date()  // Record exact timestamp
    },
    include: {
      employee: true,
      lines: {
        include: {
          assetItem: {
            include: {
              assetModel: true
            }
          },
          stockItem: true
        }
      }
    }
  });

  // Audit trail
  await logUpdate('Loan', loanId, req, { returnSignedAt: loan.returnSignedAt }, { returnSignedAt: updatedLoan.returnSignedAt, returnSignatureUrl: signatureUrl });

  return updatedLoan;
}

/**
 * Close a loan transaction
 *
 * Marks the loan as CLOSED and restores all asset items to EN_STOCK status.
 * Stock items are NOT restored (they were consumed).
 * This is the final step in the loan workflow.
 *
 * @param {string} loanId - The loan ID to close
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Updated closed loan
 * @throws {NotFoundError} If loan doesn't exist
 * @throws {ValidationError} If loan is already closed
 *
 * @example
 * const closedLoan = await closeLoan('loan123', req);
 */
export async function closeLoan(loanId, req) {
  // Get loan with lines to process asset and stock updates
  const loan = await findOneOrFail('loan', { id: loanId }, {
    include: {
      lines: {
        include: {
          assetItem: true,
          stockItem: true
        }
      }
    },
    errorMessage: 'Prêt non trouvé'
  });

  if (loan.deletedAt) {
    throw new ValidationError('Impossible de modifier un prêt supprimé');
  }

  if (loan.status === 'CLOSED') {
    throw new ValidationError('Ce prêt est déjà fermé');
  }

  // Prepare asset status updates for all loaned equipment
  const assetItemUpdates = loan.lines
    .filter(line => line.assetItemId)  // Only process asset items
    .map(line =>
      prisma.assetItem.update({
        where: { id: line.assetItemId },
        data: { status: 'EN_STOCK' }  // Mark assets as available again
      })
    );

  // Prepare stock item updates to decrement loaned counter
  // Note: Stock quantity is NOT restored (items were consumed)
  // But loaned counter must be decremented since loan is closed
  const stockItemUpdates = loan.lines
    .filter(line => line.stockItemId)  // Only process stock items
    .map(line =>
      prisma.stockItem.update({
        where: { id: line.stockItemId },
        data: {
          loaned: { decrement: line.quantity }  // Decrement loaned counter
        }
      })
    );

  // Use transaction to ensure atomicity:
  // Loan closure and ALL asset/stock updates must succeed together
  const [updatedLoan] = await prisma.$transaction([
    prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'CLOSED',
        closedAt: new Date()  // Record closure timestamp
      },
      include: {
        employee: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        lines: {
          include: {
            assetItem: {
              include: {
                assetModel: true
              }
            },
            stockItem: true
          }
        }
      }
    }),
    ...assetItemUpdates,  // Execute all asset updates in same transaction
    ...stockItemUpdates   // Execute all stock updates in same transaction
  ]);

  // Audit trail
  await logUpdate('Loan', loanId, req, { status: loan.status, closedAt: loan.closedAt }, { status: 'CLOSED', closedAt: updatedLoan.closedAt });

  return updatedLoan;
}

/**
 * Soft delete a loan (mark as deleted with timestamp)
 *
 * Marks the loan as deleted instead of removing it from the database.
 * Automatically reverts all asset statuses and stock quantities.
 * Keeps signatures and loan lines for full traceability.
 *
 * @param {string} loanId - The loan ID to soft delete
 * @param {string} userId - The ID of the user performing the deletion
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Success message
 * @throws {NotFoundError} If loan doesn't exist
 * @throws {ValidationError} If loan is already deleted
 *
 * @example
 * await deleteLoan('loan123', 'user456', req);
 */
export async function deleteLoan(loanId, userId, req) {
  // Get loan with lines to process reversions
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      lines: {
        include: {
          assetItem: true,
          stockItem: true
        }
      }
    }
  });

  if (!loan) {
    throw new NotFoundError('Prêt non trouvé');
  }

  if (loan.deletedAt) {
    throw new ValidationError('Ce prêt est déjà supprimé');
  }

  // Prepare reversion updates for all loaned items
  const updates = [];

  for (const line of loan.lines) {
    // Restore asset status
    if (line.assetItemId) {
      updates.push(
        prisma.assetItem.update({
          where: { id: line.assetItemId },
          data: { status: 'EN_STOCK' }
        })
      );
    }

    // Decrement loaned (quantity stays unchanged)
    if (line.stockItemId) {
      updates.push(
        prisma.stockItem.update({
          where: { id: line.stockItemId },
          data: {
            loaned: { decrement: line.quantity }  // Only decrement loaned, total quantity unchanged
          }
        })
      );
    }
  }

  // Use transaction to ensure atomicity:
  // Soft delete loan and ALL reversions must succeed together
  await prisma.$transaction([
    // Mark loan as deleted (soft delete)
    prisma.loan.update({
      where: { id: loanId },
      data: {
        deletedAt: new Date(),
        deletedById: userId
      }
    }),
    // Revert all asset/stock statuses
    ...updates
  ]);

  // Audit trail
  await logDelete('Loan', loanId, req, { status: loan.status, deletedAt: loan.deletedAt });

  // NOTE: We keep signatures and loan lines for full traceability
  return { message: 'Prêt supprimé avec succès' };
}

/**
 * Soft delete multiple loans in batch (ADMIN only)
 *
 * Marks multiple loans as deleted in a single atomic transaction, reverting all
 * associated asset statuses and stock quantities. Keeps signatures and loan lines
 * for full traceability.
 *
 * @param {string[]} loanIds - Array of loan IDs to soft delete
 * @param {string} userId - The ID of the user performing the deletion
 * @returns {Promise<{ deletedCount: number, message: string }>}
 * @throws {ValidationError} If loanIds array is empty
 * @throws {NotFoundError} If no loans found with provided IDs
 *
 * @example
 * const result = await batchDeleteLoans(['id1', 'id2', 'id3'], 'user456');
 * // result = { deletedCount: 3, message: '3 prêt(s) supprimé(s) avec succès' }
 */
export async function batchDeleteLoans(loanIds, userId) {
  if (!loanIds || loanIds.length === 0) {
    throw new ValidationError('Au moins un prêt doit être sélectionné');
  }

  // 1. Fetch all non-deleted loans with their lines
  const loans = await prisma.loan.findMany({
    where: {
      id: { in: loanIds },
      deletedAt: null  // Only process non-deleted loans
    },
    include: {
      lines: {
        include: {
          assetItem: true,
          stockItem: true
        }
      }
    }
  });

  if (loans.length === 0) {
    throw new NotFoundError('Aucun prêt trouvé avec les IDs fournis');
  }

  // 2. Build update operations for assets and stock
  const updates = [];

  loans.forEach(loan => {
    loan.lines.forEach(line => {
      // Revert asset item status to EN_STOCK
      if (line.assetItemId) {
        updates.push(
          prisma.assetItem.update({
            where: { id: line.assetItemId },
            data: { status: 'EN_STOCK' }
          })
        );
      }

      // Restore stock item quantity and decrement loaned
      if (line.stockItemId) {
        updates.push(
          prisma.stockItem.update({
            where: { id: line.stockItemId },
            data: {
              quantity: { increment: line.quantity },
              loaned: { decrement: line.quantity }
            }
          })
        );
      }
    });
  });

  const actualLoanIds = loans.map(l => l.id);

  // 3. Execute all operations in a single transaction
  await prisma.$transaction([
    // Mark all loans as deleted (soft delete)
    prisma.loan.updateMany({
      where: { id: { in: actualLoanIds } },
      data: {
        deletedAt: new Date(),
        deletedById: userId
      }
    }),
    // Revert all asset/stock statuses
    ...updates
  ]);

  // NOTE: We keep signatures and loan lines for full traceability
  return {
    deletedCount: loans.length,
    message: `${loans.length} prêt(s) supprimé(s) avec succès`
  };
}

/**
 * Delete pickup signature (ADMIN only)
 *
 * Removes the pickup signature from a loan. Only allowed for ADMIN users.
 *
 * @param {string} loanId - Loan ID
 * @returns {Promise<Loan>} Updated loan without pickup signature
 * @throws {NotFoundError} If loan doesn't exist
 * @throws {ValidationError} If loan is deleted
 */
export async function deletePickupSignature(loanId) {
  const loan = await findOneOrFail('loan', { id: loanId }, {
    errorMessage: 'Prêt non trouvé'
  });

  if (loan.deletedAt) {
    throw new ValidationError('Impossible de modifier un prêt supprimé');
  }

  // Delete signature file if it exists
  if (loan.pickupSignatureUrl) {
    const signaturesDir = process.env.SIGNATURES_DIR || path.join(__dirname, '../../uploads/signatures');
    const filename = path.basename(loan.pickupSignatureUrl);
    const filepath = path.join(signaturesDir, filename);

    try {
      await fs.unlink(filepath);
    } catch (err) {
      // File might not exist, ignore error
      logger.warn(`Could not delete signature file: ${filepath}`);
    }
  }

  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      pickupSignatureUrl: null,
      pickupSignedAt: null
    },
    include: {
      employee: true,
      lines: {
        include: {
          assetItem: { include: { assetModel: true } },
          stockItem: { include: { assetModel: true } }
        }
      }
    }
  });

  return updatedLoan;
}

/**
 * Delete return signature (ADMIN only)
 *
 * Removes the return signature from a loan. Only allowed for ADMIN users.
 *
 * @param {string} loanId - Loan ID
 * @returns {Promise<Loan>} Updated loan without return signature
 * @throws {NotFoundError} If loan doesn't exist
 * @throws {ValidationError} If loan is deleted
 */
export async function deleteReturnSignature(loanId) {
  const loan = await findOneOrFail('loan', { id: loanId }, {
    errorMessage: 'Prêt non trouvé'
  });

  if (loan.deletedAt) {
    throw new ValidationError('Impossible de modifier un prêt supprimé');
  }

  // Delete signature file if it exists
  if (loan.returnSignatureUrl) {
    const signaturesDir = process.env.SIGNATURES_DIR || path.join(__dirname, '../../uploads/signatures');
    const filename = path.basename(loan.returnSignatureUrl);
    const filepath = path.join(signaturesDir, filename);

    try {
      await fs.unlink(filepath);
    } catch (err) {
      // File might not exist, ignore error
      logger.warn(`Could not delete signature file: ${filepath}`);
    }
  }

  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      returnSignatureUrl: null,
      returnSignedAt: null
    },
    include: {
      employee: true,
      lines: {
        include: {
          assetItem: { include: { assetModel: true } },
          stockItem: { include: { assetModel: true } }
        }
      }
    }
  });

  return updatedLoan;
}
