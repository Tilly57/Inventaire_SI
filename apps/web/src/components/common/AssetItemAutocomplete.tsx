/**
 * @fileoverview Asset item autocomplete component
 *
 * Provides typeahead search for asset items by asset tag or serial number
 */

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2, Package, Check } from 'lucide-react'
import { autocompleteAssetItems, type AutocompleteAssetItem } from '@/lib/api/search.api'
import { cn } from '@/lib/utils'

interface AssetItemAutocompleteProps {
  value?: AutocompleteAssetItem | null
  onSelect: (item: AutocompleteAssetItem | null) => void
  placeholder?: string
  disabled?: boolean
  availableOnly?: boolean
  className?: string
}

export function AssetItemAutocomplete({
  value,
  onSelect,
  placeholder = 'Rechercher un équipement...',
  disabled = false,
  availableOnly = true,
  className,
}: AssetItemAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch autocomplete results
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['autocompleteAssetItems', query, availableOnly],
    queryFn: () => autocompleteAssetItems(query, 10, availableOnly),
    enabled: query.length >= 2,
    staleTime: 60000, // Cache 1 minute
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSelect = (item: AutocompleteAssetItem) => {
    onSelect(item)
    setQuery(item.assetTag)
    setIsOpen(false)
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      EN_STOCK: { label: 'En stock', className: 'bg-green-100 text-green-800' },
      PRETE: { label: 'Prêté', className: 'bg-blue-100 text-blue-800' },
      HS: { label: 'Hors service', className: 'bg-red-100 text-red-800' },
      REPARATION: { label: 'Réparation', className: 'bg-yellow-100 text-yellow-800' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: 'bg-gray-100 text-gray-800',
    }

    return (
      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', config.className)}>
        {config.label}
      </span>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value ? value.assetTag : query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            if (value) onSelect(null) // Clear selection when typing
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          disabled={disabled}
          className={cn(
            'w-full pl-10 pr-10 py-2 rounded-lg border',
            'focus:outline-none focus:ring-2 focus:ring-[#EE2722] focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200'
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.length >= 2 && !value && (
        <div
          className={cn(
            'absolute top-full mt-1 w-full',
            'bg-white border border-gray-200 rounded-lg shadow-lg',
            'max-h-64 overflow-y-auto z-50'
          )}
        >
          {isLoading ? (
            <div className="p-3 text-center text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Recherche...
            </div>
          ) : items.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">
              Aucun équipement trouvé
              {availableOnly && <div className="text-xs mt-1">(en stock uniquement)</div>}
            </div>
          ) : (
            <div className="py-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={cn(
                    'w-full text-left px-3 py-2',
                    'hover:bg-gray-100 transition-colors duration-150',
                    'flex items-start gap-3'
                  )}
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#EE2722]/10 flex items-center justify-center mt-0.5">
                    <Package className="h-4 w-4 text-[#EE2722]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {item.assetTag} - {item.assetModel.brand} {item.assetModel.modelName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {item.assetModel.type}
                      {item.serial && ` • SN: ${item.serial}`}
                    </div>
                    <div className="mt-1">{getStatusBadge(item.status)}</div>
                  </div>
                  {value?.id === item.id && (
                    <Check className="h-4 w-4 text-[#EE2722] flex-shrink-0 mt-1" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
