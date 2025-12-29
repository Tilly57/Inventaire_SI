// Enums matching backend Prisma schema

export const UserRole = {
  ADMIN: 'ADMIN',
  GESTIONNAIRE: 'GESTIONNAIRE',
  LECTURE: 'LECTURE',
} as const

export type UserRole = typeof UserRole[keyof typeof UserRole]

export const AssetStatus = {
  EN_STOCK: 'EN_STOCK',
  PRETE: 'PRETE',
  HS: 'HS',
  REPARATION: 'REPARATION',
} as const

export type AssetStatus = typeof AssetStatus[keyof typeof AssetStatus]

export const LoanStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const

export type LoanStatus = typeof LoanStatus[keyof typeof LoanStatus]

export const AssetType = {
  LAPTOP: 'LAPTOP',
  DESKTOP: 'DESKTOP',
  MONITOR: 'MONITOR',
  KEYBOARD: 'KEYBOARD',
  MOUSE: 'MOUSE',
  HEADSET: 'HEADSET',
  WEBCAM: 'WEBCAM',
  DOCK: 'DOCK',
  CABLE: 'CABLE',
  ADAPTER: 'ADAPTER',
  OTHER: 'OTHER',
} as const

export type AssetType = typeof AssetType[keyof typeof AssetType]

// Display labels for UI
export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrateur',
  [UserRole.GESTIONNAIRE]: 'Gestionnaire',
  [UserRole.LECTURE]: 'Lecture seule',
}

export const AssetStatusLabels: Record<AssetStatus, string> = {
  [AssetStatus.EN_STOCK]: 'En stock',
  [AssetStatus.PRETE]: 'Prêté',
  [AssetStatus.HS]: 'Hors service',
  [AssetStatus.REPARATION]: 'En réparation',
}

export const LoanStatusLabels: Record<LoanStatus, string> = {
  [LoanStatus.OPEN]: 'Ouvert',
  [LoanStatus.CLOSED]: 'Fermé',
}

export const AssetTypeLabels: Record<AssetType, string> = {
  [AssetType.LAPTOP]: 'Ordinateur portable',
  [AssetType.DESKTOP]: 'Ordinateur fixe',
  [AssetType.MONITOR]: 'Écran',
  [AssetType.KEYBOARD]: 'Clavier',
  [AssetType.MOUSE]: 'Souris',
  [AssetType.HEADSET]: 'Casque audio',
  [AssetType.WEBCAM]: 'Webcam',
  [AssetType.DOCK]: 'Station d\'accueil',
  [AssetType.CABLE]: 'Câble',
  [AssetType.ADAPTER]: 'Adaptateur',
  [AssetType.OTHER]: 'Autre',
}
