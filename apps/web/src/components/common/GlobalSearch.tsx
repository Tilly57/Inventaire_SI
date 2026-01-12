/**
 * @fileoverview Global search component with dropdown results
 *
 * Provides instant search across employees, asset items, and asset models
 * with keyboard navigation and click-outside handling
 */

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2, User, Package, Layers, Box } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { globalSearch } from '@/lib/api/search.api'
import { cn } from '@/lib/utils'

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Fetch search results
  const { data, isLoading } = useQuery({
    queryKey: ['globalSearch', query],
    queryFn: () => globalSearch(query, 5),
    enabled: query.length >= 2,
    staleTime: 30000, // Cache 30s
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleResultClick = (path: string) => {
    navigate(path)
    setQuery('')
    setIsOpen(false)
  }

  const hasResults =
    data &&
    (data.employees.length > 0 ||
      data.assetItems.length > 0 ||
      data.assetModels.length > 0 ||
      data.stockItems.length > 0)

  return (
    <div ref={searchRef} className="relative hidden md:block w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Rechercher employé, équipement..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className={cn(
            'w-full pl-10 pr-4 py-2 rounded-lg',
            'bg-[#231F20]/50 border border-gray-700',
            'text-white placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-[#EE2722] focus:border-transparent',
            'transition-all duration-200'
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div
          className={cn(
            'absolute top-full mt-2 w-full',
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'rounded-lg shadow-lg max-h-96 overflow-y-auto z-50'
          )}
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Recherche en cours...
            </div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-gray-500">Aucun résultat trouvé</div>
          ) : (
            <>
              {/* Employees Section */}
              {data.employees.length > 0 && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Employés ({data.employees.length})
                  </h3>
                  {data.employees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => handleResultClick(`/employees`)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        'transition-colors duration-150',
                        'flex flex-col gap-0.5'
                      )}
                    >
                      <div className="font-medium text-sm">
                        {emp.lastName} {emp.firstName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {emp.email} • {emp.dept}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Asset Items Section */}
              {data.assetItems.length > 0 && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    Équipements ({data.assetItems.length})
                  </h3>
                  {data.assetItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleResultClick(`/asset-items`)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        'transition-colors duration-150',
                        'flex flex-col gap-0.5'
                      )}
                    >
                      <div className="font-medium text-sm">
                        {item.assetTag} - {item.brand} {item.modelName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.type} • {item.status}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Asset Models Section */}
              {data.assetModels.length > 0 && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                    <Layers className="h-3 w-3" />
                    Modèles ({data.assetModels.length})
                  </h3>
                  {data.assetModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleResultClick(`/asset-models`)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        'transition-colors duration-150'
                      )}
                    >
                      <div className="font-medium text-sm">
                        {model.brand} {model.modelName}
                      </div>
                      <div className="text-xs text-gray-500">{model.type}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Stock Items Section */}
              {data.stockItems.length > 0 && (
                <div className="p-2">
                  <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                    <Box className="h-3 w-3" />
                    Stock ({data.stockItems.length})
                  </h3>
                  {data.stockItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleResultClick(`/stock-items`)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        'transition-colors duration-150',
                        'flex flex-col gap-0.5'
                      )}
                    >
                      <div className="font-medium text-sm">
                        {item.brand} {item.modelName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.type} • Qté: {item.quantity - item.loaned}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
