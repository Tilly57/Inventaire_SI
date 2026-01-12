/**
 * @fileoverview Search API endpoints
 *
 * Provides functions for global search and autocomplete functionality
 */

import { apiClient } from './client'

export interface GlobalSearchResult {
  employees: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    dept: string
    rank: number
  }>
  assetItems: Array<{
    id: string
    assetTag: string
    serial: string
    status: string
    type: string
    brand: string
    modelName: string
    rank: number
  }>
  assetModels: Array<{
    id: string
    type: string
    brand: string
    modelName: string
    rank: number
  }>
  stockItems: Array<{
    id: string
    quantity: number
    loaned: number
    notes: string
    type: string
    brand: string
    modelName: string
    rank: number
  }>
}

export interface AutocompleteEmployee {
  id: string
  firstName: string
  lastName: string
  email: string
  dept: string
}

export interface AutocompleteAssetItem {
  id: string
  assetTag: string
  serial: string
  status: string
  assetModel: {
    type: string
    brand: string
    modelName: string
  }
}

export interface AutocompleteAssetModel {
  id: string
  type: string
  brand: string
  modelName: string
}

/**
 * Global search across all entities
 *
 * @param query - Search query string (minimum 2 characters)
 * @param limit - Maximum results per category (default: 10, max: 50)
 * @returns Search results grouped by category
 */
export const globalSearch = async (query: string, limit: number = 10): Promise<GlobalSearchResult> => {
  const response = await apiClient.get<{ success: boolean; data: GlobalSearchResult }>('/search', {
    params: { q: query, limit },
  })
  return response.data.data
}

/**
 * Autocomplete employees by name or email
 *
 * @param query - Search query string (minimum 2 characters)
 * @param limit - Maximum results (default: 10, max: 20)
 * @returns Matching employees
 */
export const autocompleteEmployees = async (
  query: string,
  limit: number = 10
): Promise<AutocompleteEmployee[]> => {
  const response = await apiClient.get<{ success: boolean; data: AutocompleteEmployee[] }>(
    '/search/autocomplete/employees',
    {
      params: { q: query, limit },
    }
  )
  return response.data.data
}

/**
 * Autocomplete asset items
 *
 * @param query - Search query string (minimum 2 characters)
 * @param limit - Maximum results (default: 10, max: 20)
 * @param availableOnly - Only show EN_STOCK items (default: true)
 * @returns Matching asset items with model info
 */
export const autocompleteAssetItems = async (
  query: string,
  limit: number = 10,
  availableOnly: boolean = true
): Promise<AutocompleteAssetItem[]> => {
  const response = await apiClient.get<{ success: boolean; data: AutocompleteAssetItem[] }>(
    '/search/autocomplete/asset-items',
    {
      params: { q: query, limit, availableOnly },
    }
  )
  return response.data.data
}

/**
 * Autocomplete asset models
 *
 * @param query - Search query string (minimum 2 characters)
 * @param limit - Maximum results (default: 10, max: 20)
 * @returns Matching asset models
 */
export const autocompleteAssetModels = async (
  query: string,
  limit: number = 10
): Promise<AutocompleteAssetModel[]> => {
  const response = await apiClient.get<{ success: boolean; data: AutocompleteAssetModel[] }>(
    '/search/autocomplete/asset-models',
    {
      params: { q: query, limit },
    }
  )
  return response.data.data
}
