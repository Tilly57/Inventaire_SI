import { UserRole, AssetStatus, LoanStatus, AssetType } from './enums'

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

// Asset Model types
export interface AssetModel {
  id: string
  type: AssetType
  brand: string
  modelName: string
  createdAt: string
  updatedAt: string
  _count?: {
    items: number
  }
}

export interface CreateAssetModelDto {
  type: AssetType
  brand: string
  modelName: string
}

export interface UpdateAssetModelDto {
  type?: AssetType
  brand?: string
  modelName?: string
}

// Asset Item types
export interface AssetItem {
  id: string
  assetTag: string
  serialNumber: string | null
  status: AssetStatus
  notes: string | null
  modelId: string
  createdAt: string
  updatedAt: string
  assetModel?: AssetModel
}

export interface CreateAssetItemDto {
  assetTag: string
  serialNumber?: string
  status?: AssetStatus
  notes?: string
  assetModelId: string
}

export interface UpdateAssetItemDto {
  assetTag?: string
  serialNumber?: string | null
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
