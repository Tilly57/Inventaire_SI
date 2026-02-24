/**
 * @fileoverview Employee autocomplete component
 *
 * Provides typeahead search for employees by name or email
 */

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2, User, Check } from 'lucide-react'
import { autocompleteEmployees, type AutocompleteEmployee } from '@/lib/api/search.api'
import { cn } from '@/lib/utils'

interface EmployeeAutocompleteProps {
  value?: AutocompleteEmployee | null
  onSelect: (employee: AutocompleteEmployee | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function EmployeeAutocomplete({
  value,
  onSelect,
  placeholder = 'Rechercher un employé...',
  disabled = false,
  className,
}: EmployeeAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch autocomplete results
  const { data, isLoading } = useQuery<AutocompleteEmployee[]>({
    queryKey: ['autocompleteEmployees', query],
    queryFn: () => autocompleteEmployees(query, 10),
    enabled: query.length >= 2,
    staleTime: 60000, // Cache 1 minute
  })

  const employees = (data ?? []) as AutocompleteEmployee[]

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

  const handleSelect = (employee: AutocompleteEmployee) => {
    onSelect(employee)
    setQuery(`${employee.lastName} ${employee.firstName}`)
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
          value={value ? `${value.lastName} ${value.firstName}` : query}
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
          ) : employees.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">Aucun employé trouvé</div>
          ) : (
            <div className="py-1">
              {employees.map((employee: AutocompleteEmployee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => handleSelect(employee)}
                  className={cn(
                    'w-full text-left px-3 py-2',
                    'hover:bg-gray-100 transition-colors duration-150',
                    'flex items-center gap-3'
                  )}
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#EE2722]/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-[#EE2722]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {employee.lastName} {employee.firstName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {employee.email} • {employee.dept}
                    </div>
                  </div>
                  {value?.id === employee.id && (
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
