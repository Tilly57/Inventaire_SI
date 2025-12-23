// Enums matching backend Prisma schema

export enum UserRole {
  ADMIN = 'ADMIN',
  GESTIONNAIRE = 'GESTIONNAIRE',
  LECTURE = 'LECTURE',
}

export enum AssetStatus {
  EN_STOCK = 'EN_STOCK',
  PRETE = 'PRETE',
  HS = 'HS',
  REPARATION = 'REPARATION',
}

export enum LoanStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum AssetType {
  LAPTOP = 'LAPTOP',
  DESKTOP = 'DESKTOP',
  MONITOR = 'MONITOR',
  KEYBOARD = 'KEYBOARD',
  MOUSE = 'MOUSE',
  HEADSET = 'HEADSET',
  WEBCAM = 'WEBCAM',
  DOCK = 'DOCK',
  CABLE = 'CABLE',
  ADAPTER = 'ADAPTER',
  OTHER = 'OTHER',
}

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
