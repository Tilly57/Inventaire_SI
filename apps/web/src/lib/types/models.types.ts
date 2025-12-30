import { UserRole, AssetStatus, LoanStatus } from './enums'

// User types
export interface User {
  id: string
  email: string
  username: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface UserWithPassword extends User {
  password: string
}

export interface CreateUserDto {
  email: string
  username: string
  password: string
  role: UserRole
}

export interface UpdateUserDto {
  email?: string
  username?: string
  role?: UserRole
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

// Employee types
export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  dept: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateEmployeeDto {
  firstName: string
  lastName: string
  email: string
  dept?: string
}

export interface UpdateEmployeeDto {
  firstName?: string
  lastName?: string
  email?: string
  dept?: string | null
}

// Equipment Type types
export interface EquipmentType {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface CreateEquipmentTypeDto {
  name: string
}

export interface UpdateEquipmentTypeDto {
  name?: string
}

// Asset Model types
export interface AssetModel {
  id: string
  type: string
  brand: string
  modelName: string
  createdAt: string
  updatedAt: string
  _count?: {
    items: number
  }
}

export interface CreateAssetModelDto {
  type: string
  brand: string
  modelName: string
  quantity?: number
}

export interface UpdateAssetModelDto {
  type?: string
  brand?: string
  modelName?: string
  quantity?: number
}

// Asset Item types
export interface AssetItem {
  id: string
  assetTag: string
  serial: string | null
  status: AssetStatus
  notes: string | null
  assetModelId: string
  createdAt: string
  updatedAt: string
  assetModel?: AssetModel
}

export interface CreateAssetItemDto {
  assetTag: string
  serial?: string
  status?: AssetStatus
  notes?: string
  assetModelId: string
}

export interface UpdateAssetItemDto {
  assetTag?: string
  serial?: string | null
  status?: AssetStatus
  notes?: string | null
  assetModelId?: string
}

export interface CreateBulkAssetItemsDto {
  assetModelId: string
  tagPrefix: string
  quantity: number
  status?: AssetStatus
  notes?: string
}

export interface BulkCreationPreview {
  tags: string[]
  conflicts: string[]
  startNumber: number
}

// Stock Item types
export interface StockItem {
  id: string
  assetModelId: string
  quantity: number
  loaned: number
  notes: string | null
  createdAt: string
  updatedAt: string
  assetModel?: AssetModel
}

export interface CreateStockItemDto {
  assetModelId: string
  quantity: number
  notes?: string
}

export interface UpdateStockItemDto {
  assetModelId?: string
  quantity?: number
  notes?: string | null
}

// Loan types
export interface LoanLine {
  id: string
  loanId: string
  assetItemId: string | null
  stockItemId: string | null
  quantity: number
  addedAt: string
  createdAt: string
  assetItem?: AssetItem
  stockItem?: StockItem
}

export interface Loan {
  id: string
  employeeId: string
  status: LoanStatus
  pickupSignatureUrl: string | null
  pickupSignedAt: string | null
  returnSignatureUrl: string | null
  returnSignedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
  employee?: Employee
  lines?: LoanLine[]
}

export interface CreateLoanDto {
  employeeId: string
}

export interface AddLoanLineDto {
  assetItemId?: string
  stockItemId?: string
  quantity?: number
}

// Authentication types
export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  username: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Dashboard stats types
export interface DashboardStats {
  totalEmployees: number
  totalAssets: number
  activeLoans: number
  loanedAssets: number
}

// Low stock alert item (unified type for StockItem and grouped AssetItem)
export interface LowStockAlertItem {
  id: string
  assetModelId: string
  assetModel?: AssetModel
  availableQuantity: number // For StockItem: quantity - loaned, For AssetItem: count of EN_STOCK items
  itemType: 'stock' | 'asset' // Distinguish between StockItem and grouped AssetItem
}
