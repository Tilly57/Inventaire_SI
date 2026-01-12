/**
 * @fileoverview Asset model autocomplete component
 *
 * Provides typeahead search for asset models by type, brand, or model name
 */

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2, Layers, Check } from 'lucide-react'
import { autocompleteAssetModels, type AutocompleteAssetModel } from '@/lib/api/search.api'
import { cn } from '@/lib/utils'

interface AssetModelAutocompleteProps {
  value?: AutocompleteAssetModel | null
  onSelect: (model: AutocompleteAssetModel | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function AssetModelAutocomplete({
  value,
  onSelect,
  placeholder = 'Rechercher un modèle...',
  disabled = false,
  className,
}: AssetModelAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch autocomplete results
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['autocompleteAssetModels', query],
    queryFn: () => autocompleteAssetModels(query, 10),
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

  const handleSelect = (model: AutocompleteAssetModel) => {
    onSelect(model)
    setQuery(`${model.brand} ${model.modelName}`)
    setIsOpen(false)
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
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
          value={value ? `${value.brand} ${value.modelName}` : query}
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
          ) : models.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">Aucun modèle trouvé</div>
          ) : (
            <div className="py-1">
              {models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelect(model)}
                  className={cn(
                    'w-full text-left px-3 py-2',
                    'hover:bg-gray-100 transition-colors duration-150',
                    'flex items-center gap-3'
                  )}
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#EE2722]/10 flex items-center justify-center">
                    <Layers className="h-4 w-4 text-[#EE2722]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {model.brand} {model.modelName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{model.type}</div>
                  </div>
                  {value?.id === model.id && (
                    <Check className="h-4 w-4 text-[#EE2722] flex-shrink-0" />
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
