/**
 * @fileoverview Export Service - Génération fichiers Excel
 *
 * Ce service fournit des fonctions d'export Excel pour:
 * - Employés (avec filtres nom, département)
 * - Équipements (modèles et articles, avec filtres statut, type)
 * - Stock (avec filtres quantité faible)
 * - Prêts (avec filtres statut, dates)
 * - Dashboard complet (multi-feuilles)
 *
 * Features:
 * - Export avec filtres appliqués
 * - Templates personnalisables (colonnes, en-têtes)
 * - Export multi-feuilles (workbook complet)
 * - Formatage automatique (dates, nombres, statuts)
 */

import XLSX from 'xlsx'
import prisma from '../config/database.js'

/**
 * Export employés vers Excel
 *
 * @param {Object} filters - Filtres optionnels
 * @param {string} filters.search - Recherche nom/prénom/email
 * @param {string} filters.dept - Filtrer par département
 * @returns {Buffer} Fichier Excel en buffer
 */
export async function exportEmployees(filters = {}) {
  const { search, dept } = filters

  const where = {
    deletedAt: null,
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(dept && { dept: { contains: dept, mode: 'insensitive' } }),
  }

  const employees = await prisma.employee.findMany({
    where,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: {
      lastName: true,
      firstName: true,
      email: true,
      dept: true,
      createdAt: true,
    },
  })

  // Préparer données pour Excel
  const data = employees.map((emp) => ({
    Nom: emp.lastName,
    Prénom: emp.firstName,
    Email: emp.email,
    Département: emp.dept || 'N/A',
    'Date création': formatDate(emp.createdAt),
  }))

  // Créer workbook
  const worksheet = XLSX.utils.json_to_sheet(data)

  // Auto-size colonnes
  const colWidths = [
    { wch: 20 }, // Nom
    { wch: 20 }, // Prénom
    { wch: 30 }, // Email
    { wch: 20 }, // Département
    { wch: 15 }, // Date
  ]
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employés')

  // Générer buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

/**
 * Export modèles d'équipements vers Excel
 *
 * @param {Object} filters - Filtres optionnels
 * @param {string} filters.type - Filtrer par type d'équipement
 * @param {string} filters.brand - Filtrer par marque
 * @returns {Buffer} Fichier Excel en buffer
 */
export async function exportAssetModels(filters = {}) {
  const { type, brand } = filters

  const where = {
    deletedAt: null,
    ...(type && { type: { contains: type, mode: 'insensitive' } }),
    ...(brand && { brand: { contains: brand, mode: 'insensitive' } }),
  }

  const models = await prisma.assetModel.findMany({
    where,
    orderBy: [{ type: 'asc' }, { brand: 'asc' }],
    select: {
      type: true,
      brand: true,
      modelName: true,
      createdAt: true,
      _count: {
        select: {
          assetItems: true,
        },
      },
    },
  })

  const data = models.map((model) => ({
    Type: model.type,
    Marque: model.brand,
    Modèle: model.modelName,
    'Nombre articles': model._count.assetItems,
    'Date création': formatDate(model.createdAt),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Modèles')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

/**
 * Export articles d'équipement vers Excel
 *
 * @param {Object} filters - Filtres optionnels
 * @param {string} filters.status - Filtrer par statut (EN_STOCK, PRETE, HS, REPARATION)
 * @param {string} filters.type - Filtrer par type d'équipement
 * @param {string} filters.assetModelId - Filtrer par modèle spécifique
 * @returns {Buffer} Fichier Excel en buffer
 */
export async function exportAssetItems(filters = {}) {
  const { status, type, assetModelId } = filters

  const where = {
    deletedAt: null,
    ...(status && { status }),
    ...(assetModelId && { assetModelId }),
    ...(type && {
      assetModel: {
        type: { contains: type, mode: 'insensitive' },
      },
    }),
  }

  const items = await prisma.assetItem.findMany({
    where,
    orderBy: { assetTag: 'asc' },
    include: {
      assetModel: {
        select: {
          type: true,
          brand: true,
          modelName: true,
        },
      },
    },
  })

  const statusLabels = {
    EN_STOCK: 'En stock',
    PRETE: 'Prêté',
    HS: 'Hors service',
    REPARATION: 'En réparation',
  }

  const data = items.map((item) => ({
    'Tag Asset': item.assetTag,
    'Numéro série': item.serial || 'N/A',
    Type: item.assetModel.type,
    Marque: item.assetModel.brand,
    Modèle: item.assetModel.modelName,
    Statut: statusLabels[item.status],
    Notes: item.notes || '',
    'Date création': formatDate(item.createdAt),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 30 },
    { wch: 15 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Équipements')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

/**
 * Export articles de stock vers Excel
 *
 * @param {Object} filters - Filtres optionnels
 * @param {boolean} filters.lowStock - Afficher seulement stock bas (quantité < 5)
 * @returns {Buffer} Fichier Excel en buffer
 */
export async function exportStockItems(filters = {}) {
  const { lowStock } = filters

  const where = {
    deletedAt: null,
    ...(lowStock && { quantity: { lt: 5 } }),
  }

  const items = await prisma.stockItem.findMany({
    where,
    orderBy: { quantity: 'asc' },
    include: {
      assetModel: {
        select: {
          type: true,
          brand: true,
          modelName: true,
        },
      },
    },
  })

  const data = items.map((item) => ({
    Type: item.assetModel.type,
    Marque: item.assetModel.brand,
    Modèle: item.assetModel.modelName,
    'Quantité disponible': item.quantity,
    'Quantité prêtée': item.loaned,
    'Quantité totale': item.quantity + item.loaned,
    'Date création': formatDate(item.createdAt),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

/**
 * Export prêts vers Excel
 *
 * @param {Object} filters - Filtres optionnels
 * @param {string} filters.status - Filtrer par statut (OPEN, CLOSED)
 * @param {string} filters.employeeId - Filtrer par employé
 * @param {Date} filters.startDate - Date début
 * @param {Date} filters.endDate - Date fin
 * @returns {Buffer} Fichier Excel en buffer
 */
export async function exportLoans(filters = {}) {
  const { status, employeeId, startDate, endDate } = filters

  const where = {
    deletedAt: null,
    ...(status && { status }),
    ...(employeeId && { employeeId }),
    ...(startDate &&
      endDate && {
        openedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
  }

  const loans = await prisma.loan.findMany({
    where,
    orderBy: { openedAt: 'desc' },
    select: {
      id: true,
      status: true,
      openedAt: true,
      closedAt: true,
      employee: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      lines: {
        select: {
          quantity: true,
          assetItem: {
            select: {
              assetTag: true,
              assetModel: {
                select: {
                  type: true,
                },
              },
            },
          },
          stockItem: {
            select: {
              assetModel: {
                select: {
                  modelName: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const statusLabels = {
    OPEN: 'Ouvert',
    CLOSED: 'Fermé',
  }

  const data = loans.map((loan) => {
    // Calculer articles prêtés
    const items = loan.lines.map((line) => {
      if (line.assetItem) {
        return `${line.assetItem.assetModel.type} ${line.assetItem.assetTag}`
      } else if (line.stockItem) {
        return `${line.stockItem.assetModel.modelName} (x${line.quantity})`
      }
      return 'N/A'
    })

    return {
      'ID Prêt': loan.id.slice(0, 8),
      Employé: `${loan.employee.firstName} ${loan.employee.lastName}`,
      Email: loan.employee.email,
      'Articles prêtés': items.join(', '),
      'Nombre articles': loan.lines.length,
      Statut: statusLabels[loan.status],
      'Date ouverture': formatDate(loan.openedAt),
      'Date fermeture': loan.closedAt ? formatDate(loan.closedAt) : 'N/A',
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 30 },
    { wch: 50 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Prêts')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

/**
 * Export dashboard complet (multi-feuilles)
 *
 * Génère un workbook avec plusieurs feuilles:
 * - Vue d'ensemble (statistiques)
 * - Employés
 * - Équipements
 * - Stock
 * - Prêts actifs
 *
 * @returns {Buffer} Fichier Excel en buffer avec multi-feuilles
 */
export async function exportDashboard() {
  const workbook = XLSX.utils.book_new()

  // 1. Feuille Vue d'ensemble
  const stats = await prisma.$queryRaw`
    SELECT * FROM dashboard_stats
  `
  const statsData = [
    { Statistique: 'Total Employés', Valeur: stats[0]?.total_employees || 0 },
    { Statistique: 'Total Équipements', Valeur: stats[0]?.total_assets || 0 },
    {
      Statistique: 'Équipements Disponibles',
      Valeur: stats[0]?.available_assets || 0,
    },
    { Statistique: 'Prêts Actifs', Valeur: stats[0]?.active_loans || 0 },
    { Statistique: 'Stock Bas', Valeur: stats[0]?.low_stock_items || 0 },
    {
      Statistique: 'Dernière mise à jour',
      Valeur: formatDate(stats[0]?.last_updated || new Date()),
    },
  ]
  const statsSheet = XLSX.utils.json_to_sheet(statsData)
  statsSheet['!cols'] = [{ wch: 30 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(workbook, statsSheet, 'Vue d\'ensemble')

  // 2. Feuille Employés
  const employees = await prisma.employee.findMany({
    where: { deletedAt: null },
    orderBy: [{ lastName: 'asc' }],
    select: {
      lastName: true,
      firstName: true,
      email: true,
      dept: true,
    },
  })
  const empData = employees.map((e) => ({
    Nom: e.lastName,
    Prénom: e.firstName,
    Email: e.email,
    Département: e.dept || 'N/A',
  }))
  const empSheet = XLSX.utils.json_to_sheet(empData)
  empSheet['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(workbook, empSheet, 'Employés')

  // 3. Feuille Équipements
  const assets = await prisma.assetItem.findMany({
    where: { deletedAt: null },
    orderBy: { assetTag: 'asc' },
    include: {
      assetModel: {
        select: {
          type: true,
          brand: true,
          modelName: true,
        },
      },
    },
  })
  const statusLabels = {
    EN_STOCK: 'En stock',
    PRETE: 'Prêté',
    HS: 'Hors service',
    REPARATION: 'En réparation',
  }
  const assetsData = assets.map((a) => ({
    Tag: a.assetTag,
    Type: a.assetModel.type,
    Marque: a.assetModel.brand,
    Modèle: a.assetModel.modelName,
    Statut: statusLabels[a.status],
  }))
  const assetsSheet = XLSX.utils.json_to_sheet(assetsData)
  assetsSheet['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
  ]
  XLSX.utils.book_append_sheet(workbook, assetsSheet, 'Équipements')

  // 4. Feuille Stock
  const stock = await prisma.stockItem.findMany({
    where: { deletedAt: null },
    orderBy: { quantity: 'asc' },
    include: {
      assetModel: {
        select: {
          type: true,
          brand: true,
          modelName: true,
        },
      },
    },
  })
  const stockData = stock.map((s) => ({
    Type: s.assetModel.type,
    Marque: s.assetModel.brand,
    Modèle: s.assetModel.modelName,
    'Qté Dispo': s.quantity,
    'Qté Prêtée': s.loaned,
  }))
  const stockSheet = XLSX.utils.json_to_sheet(stockData)
  stockSheet['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(workbook, stockSheet, 'Stock')

  // 5. Feuille Prêts Actifs
  const loans = await prisma.loan.findMany({
    where: { status: 'OPEN', deletedAt: null },
    orderBy: { openedAt: 'desc' },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: { lines: true }  // Phase 3.5: Count instead of fetching all lines
      }
    },
  })
  const loansData = loans.map((l) => ({
    'ID Prêt': l.id.slice(0, 8),
    Employé: `${l.employee.firstName} ${l.employee.lastName}`,
    'Nb Articles': l._count.lines,
    'Date Ouverture': formatDate(l.openedAt),
  }))
  const loansSheet = XLSX.utils.json_to_sheet(loansData)
  loansSheet['!cols'] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 12 },
    { wch: 15 },
  ]
  XLSX.utils.book_append_sheet(workbook, loansSheet, 'Prêts Actifs')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

/**
 * Utilitaire: formater date pour Excel
 * @private
 */
function formatDate(date) {
  if (!date) return 'N/A'
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default {
  exportEmployees,
  exportAssetModels,
  exportAssetItems,
  exportStockItems,
  exportLoans,
  exportDashboard,
}
