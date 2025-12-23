/**
 * Loans service - Business logic for loan management
 */
import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get all loans with filters
 */
export async function getAllLoans(filters = {}) {
  const { status, employeeId } = filters;

  const where = {};

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
  });

  return loans;
}

/**
 * Get loan by ID
 */
export async function getLoanById(id) {
  const loan = await prisma.loan.findUnique({
    where: { id },
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
  });

  if (!loan) {
    throw new NotFoundError('Prêt non trouvé');
  }

  return loan;
}

/**
 * Create new loan
 */
export async function createLoan(employeeId, createdById) {
  // Check if employee exists
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw new NotFoundError('Employé non trouvé');
  }

  const loan = await prisma.loan.create({
    data: {
      employeeId,
      createdById,
      status: 'OPEN'
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

  return loan;
}

/**
 * Add line to loan
 */
export async function addLoanLine(loanId, data) {
  // Check if loan exists and is open
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan) {
    throw new NotFoundError('Prêt non trouvé');
  }
  if (loan.status === 'CLOSED') {
    throw new ValidationError('Impossible d\'ajouter des articles à un prêt fermé');
  }

  // Validate that either assetItemId or stockItemId is provided
  if (!data.assetItemId && !data.stockItemId) {
    throw new ValidationError('Vous devez spécifier soit un article d\'équipement soit un article de stock');
  }

  // If asset item, check availability and update status
  if (data.assetItemId) {
    const assetItem = await prisma.assetItem.findUnique({ where: { id: data.assetItemId } });
    if (!assetItem) {
      throw new NotFoundError('Article d\'équipement non trouvé');
    }
    if (assetItem.status !== 'EN_STOCK') {
      throw new ValidationError('Cet article n\'est pas disponible');
    }

    // Create loan line and update asset status in transaction
    const [loanLine] = await prisma.$transaction([
      prisma.loanLine.create({
        data: {
          loanId,
          assetItemId: data.assetItemId,
          quantity: 1
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
        data: { status: 'PRETE' }
      })
    ]);

    return loanLine;
  }

  // If stock item, check quantity and decrement
  if (data.stockItemId) {
    const stockItem = await prisma.stockItem.findUnique({ where: { id: data.stockItemId } });
    if (!stockItem) {
      throw new NotFoundError('Article de stock non trouvé');
    }

    const quantity = data.quantity || 1;
    if (stockItem.quantity < quantity) {
      throw new ValidationError('Quantité insuffisante en stock');
    }

    // Create loan line and decrement stock in transaction
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
        data: { quantity: stockItem.quantity - quantity }
      })
    ]);

    return loanLine;
  }
}

/**
 * Remove line from loan
 */
export async function removeLoanLine(loanId, lineId) {
  // Check if loan exists and is open
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan) {
    throw new NotFoundError('Prêt non trouvé');
  }
  if (loan.status === 'CLOSED') {
    throw new ValidationError('Impossible de modifier un prêt fermé');
  }

  // Get loan line
  const loanLine = await prisma.loanLine.findUnique({
    where: { id: lineId },
    include: {
      assetItem: true,
      stockItem: true
    }
  });

  if (!loanLine || loanLine.loanId !== loanId) {
    throw new NotFoundError('Ligne de prêt non trouvée');
  }

  // If asset item, update status back to EN_STOCK
  if (loanLine.assetItemId) {
    await prisma.$transaction([
      prisma.loanLine.delete({ where: { id: lineId } }),
      prisma.assetItem.update({
        where: { id: loanLine.assetItemId },
        data: { status: 'EN_STOCK' }
      })
    ]);
  }

  // If stock item, increment quantity back
  if (loanLine.stockItemId) {
    await prisma.$transaction([
      prisma.loanLine.delete({ where: { id: lineId } }),
      prisma.stockItem.update({
        where: { id: loanLine.stockItemId },
        data: { quantity: { increment: loanLine.quantity } }
      })
    ]);
  }

  return { message: 'Ligne de prêt supprimée avec succès' };
}

/**
 * Upload pickup signature
 */
export async function uploadPickupSignature(loanId, file) {
  // Check if loan exists
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan) {
    throw new NotFoundError('Prêt non trouvé');
  }

  // Generate signature URL
  const signatureUrl = `/uploads/signatures/${file.filename}`;

  // Update loan with pickup signature
  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      pickupSignatureUrl: signatureUrl,
      pickupSignedAt: new Date()
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

  return updatedLoan;
}

/**
 * Upload return signature
 */
export async function uploadReturnSignature(loanId, file) {
  // Check if loan exists
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan) {
    throw new NotFoundError('Prêt non trouvé');
  }

  // Generate signature URL
  const signatureUrl = `/uploads/signatures/${file.filename}`;

  // Update loan with return signature
  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      returnSignatureUrl: signatureUrl,
      returnSignedAt: new Date()
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

  return updatedLoan;
}

/**
 * Close loan
 */
export async function closeLoan(loanId) {
  // Check if loan exists
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      lines: {
        include: {
          assetItem: true
        }
      }
    }
  });

  if (!loan) {
    throw new NotFoundError('Prêt non trouvé');
  }

  if (loan.status === 'CLOSED') {
    throw new ValidationError('Ce prêt est déjà fermé');
  }

  // Update loan status and asset items statuses in transaction
  const assetItemUpdates = loan.lines
    .filter(line => line.assetItemId)
    .map(line =>
      prisma.assetItem.update({
        where: { id: line.assetItemId },
        data: { status: 'EN_STOCK' }
      })
    );

  const [updatedLoan] = await prisma.$transaction([
    prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'CLOSED',
        closedAt: new Date()
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
    ...assetItemUpdates
  ]);

  return updatedLoan;
}

/**
 * Delete loan
 */
export async function deleteLoan(loanId) {
  // Check if loan exists
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

  // Can only delete OPEN loans without signatures
  if (loan.status === 'CLOSED') {
    throw new ValidationError('Impossible de supprimer un prêt fermé');
  }

  if (loan.pickupSignatureUrl || loan.returnSignatureUrl) {
    throw new ValidationError('Impossible de supprimer un prêt avec des signatures');
  }

  // Revert asset statuses and stock quantities in transaction
  const updates = [];

  for (const line of loan.lines) {
    if (line.assetItemId) {
      updates.push(
        prisma.assetItem.update({
          where: { id: line.assetItemId },
          data: { status: 'EN_STOCK' }
        })
      );
    }
    if (line.stockItemId) {
      updates.push(
        prisma.stockItem.update({
          where: { id: line.stockItemId },
          data: { quantity: { increment: line.quantity } }
        })
      );
    }
  }

  await prisma.$transaction([
    prisma.loan.delete({ where: { id: loanId } }),
    ...updates
  ]);

  return { message: 'Prêt supprimé avec succès' };
}
