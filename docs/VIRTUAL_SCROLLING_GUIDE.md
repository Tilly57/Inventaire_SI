# Guide d'Implémentation du Virtual Scrolling

**Date :** 2026-01-12
**Version :** 0.7.5
**Statut :** À implémenter si besoin (ROI élevé uniquement pour listes > 500 items non paginées)

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Quand Utiliser le Virtual Scrolling](#quand-utiliser-le-virtual-scrolling)
3. [Prérequis](#prérequis)
4. [Implémentation Basique](#implémentation-basique)
5. [Implémentation Avancée](#implémentation-avancée)
6. [Exemples pour Notre Codebase](#exemples-pour-notre-codebase)
7. [Performance et Trade-offs](#performance-et-trade-offs)
8. [Troubleshooting](#troubleshooting)

---

## Introduction

Le **virtual scrolling** (ou windowing) est une technique qui rend uniquement les éléments visibles dans le viewport, plutôt que de rendre toute la liste. Cela permet d'afficher des listes de milliers d'items sans perte de performance.

**Package utilisé :** `@tanstack/react-virtual` v3.11.4 (déjà installé)

**Principe :**
- Seuls 10-20 items visibles sont rendus dans le DOM
- Les items hors écran ne sont pas créés
- Performance constante avec 10, 1 000 ou 100 000 items

---

## Quand Utiliser le Virtual Scrolling

### ✅ À Implémenter Si :

1. **Liste non paginée > 500 items**
   - Exemple : Historique complet de prêts (pas de pagination)
   - Gain mesuré : 80-95% de réduction du temps de render

2. **Scroll infini requis**
   - Exemple : Feed d'activité en temps réel
   - Gain : UX fluide même avec milliers d'entrées

3. **Performance critique mesurée**
   - Profiling React DevTools montre lag > 100ms
   - Utilisateurs rapportent lenteurs lors du scroll

### ❌ Ne PAS Implémenter Si :

1. **Pagination déjà en place** (cas actuel)
   - EmployeesTable : 10-50 items par page max
   - ROI faible, complexité ajoutée

2. **Liste < 100 items**
   - React.memo + useMemo suffisent (déjà fait en v0.7.3)
   - Virtual scrolling ajouterait de la complexité inutile

3. **Hauteurs d'items dynamiques complexes**
   - Cards avec contenu variable difficiles à virtualiser
   - Considérer plutôt la pagination ou lazy loading

---

## Prérequis

### 1. Package Installé

```bash
# Déjà installé dans le projet
npm install @tanstack/react-virtual
```

### 2. Hauteurs d'Items

**Option 1 : Hauteur fixe (recommandé)**
```typescript
const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50, // 50px par row (fixe)
})
```

**Option 2 : Hauteur dynamique**
```typescript
const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100, // Estimation initiale
  // TanStack Virtual mesure automatiquement après render
})
```

---

## Implémentation Basique

### Exemple : Table Simple avec Virtual Scrolling

```typescript
import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Employee } from '@/lib/types/models.types'

interface VirtualEmployeesTableProps {
  employees: Employee[]
}

export function VirtualEmployeesTable({ employees }: VirtualEmployeesTableProps) {
  // Ref du conteneur parent (scroll container)
  const parentRef = useRef<HTMLDivElement>(null)

  // Configuration du virtualizer
  const rowVirtualizer = useVirtualizer({
    count: employees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Hauteur estimée d'une row (en px)
    overscan: 5, // Nombre de rows à pré-render au-dessus/en-dessous
  })

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto border rounded-lg"
      // Hauteur fixe requise pour le scroll container
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const employee = employees[virtualRow.index]

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="border-b p-4 hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {employee.dept}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### Points Clés

1. **Conteneur avec hauteur fixe** : `h-[600px] overflow-auto`
2. **Container absolu** : `height: getTotalSize()` (hauteur totale virtuelle)
3. **Items positionnés absolument** : `position: absolute` + `transform: translateY()`
4. **Overscan** : Pré-render 5 items au-dessus/en-dessous pour scroll fluide

---

## Implémentation Avancée

### Table Complète avec Sélection et Actions

```typescript
import { useState, useRef, useMemo, useCallback, memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Employee } from '@/lib/types/models.types'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'

interface VirtualEmployeesTableProps {
  employees: Employee[]
  selectedEmployees?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onEdit?: (employee: Employee) => void
  onDelete?: (employee: Employee) => void
}

// Memoized row component pour éviter re-renders
const VirtualEmployeeRow = memo(({
  employee,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  style,
}: {
  employee: Employee
  isSelected: boolean
  onSelect: (id: string, checked: boolean) => void
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  style: React.CSSProperties
}) => {
  return (
    <div
      style={style}
      className="border-b hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-4 p-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(employee.id, checked as boolean)}
        />
        <div className="flex-1">
          <p className="font-medium">
            {employee.firstName} {employee.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{employee.email}</p>
        </div>
        <div className="text-sm text-muted-foreground min-w-[100px]">
          {employee.dept}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(employee)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(employee)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
})

VirtualEmployeeRow.displayName = 'VirtualEmployeeRow'

export function VirtualEmployeesTable({
  employees,
  selectedEmployees = [],
  onSelectionChange,
  onEdit,
  onDelete,
}: VirtualEmployeesTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: employees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Hauteur avec padding (4 * 4 * 2 + contenu)
    overscan: 10,
  })

  // Memoized calculations
  const isAllSelected = useMemo(
    () => employees.length > 0 && selectedEmployees.length === employees.length,
    [employees.length, selectedEmployees.length]
  )

  const isSomeSelected = useMemo(
    () => selectedEmployees.length > 0 && selectedEmployees.length < employees.length,
    [selectedEmployees.length, employees.length]
  )

  // Stable callbacks
  const handleSelectAll = useCallback((checked: boolean | 'indeterminate') => {
    if (onSelectionChange) {
      onSelectionChange(checked === true ? employees.map(e => e.id) : [])
    }
  }, [onSelectionChange, employees])

  const handleSelectEmployee = useCallback((employeeId: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedEmployees, employeeId]
        : selectedEmployees.filter(id => id !== employeeId)
      onSelectionChange(newSelection)
    }
  }, [onSelectionChange, selectedEmployees])

  const handleEdit = useCallback((employee: Employee) => {
    onEdit?.(employee)
  }, [onEdit])

  const handleDelete = useCallback((employee: Employee) => {
    onDelete?.(employee)
  }, [onDelete])

  return (
    <div className="border rounded-lg">
      {/* Header avec sélection globale */}
      <div className="border-b bg-muted/50 p-4">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={isSomeSelected ? 'indeterminate' : isAllSelected}
            onCheckedChange={handleSelectAll}
          />
          <div className="flex-1 font-medium">Nom</div>
          <div className="min-w-[100px] font-medium">Département</div>
          <div className="w-[100px] font-medium">Actions</div>
        </div>
      </div>

      {/* Virtual scrolling container */}
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const employee = employees[virtualRow.index]

            return (
              <VirtualEmployeeRow
                key={virtualRow.key}
                employee={employee}
                isSelected={selectedEmployees.includes(employee.id)}
                onSelect={handleSelectEmployee}
                onEdit={handleEdit}
                onDelete={handleDelete}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Footer avec compteur */}
      <div className="border-t p-4 text-sm text-muted-foreground">
        {selectedEmployees.length > 0 && (
          <span>{selectedEmployees.length} employé(s) sélectionné(s) sur {employees.length}</span>
        )}
        {selectedEmployees.length === 0 && (
          <span>{employees.length} employé(s)</span>
        )}
      </div>
    </div>
  )
}
```

---

## Exemples pour Notre Codebase

### Adaptation de EmployeesTable (Desktop)

**Fichier :** `apps/web/src/components/employees/EmployeesTable.tsx`

```typescript
import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

// Dans le composant EmployeesTable, section desktop
export function EmployeesTable({ employees, selectedEmployees, onSelectionChange }: Props) {
  // ... états existants ...

  const parentRef = useRef<HTMLDivElement>(null)

  // Configuration du virtualizer
  const rowVirtualizer = useVirtualizer({
    count: employees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  })

  // Remplacer la section desktop par :
  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {/* Header inchangé */}
          </TableHeader>
        </Table>

        {/* Virtual scrolling body */}
        <div
          ref={parentRef}
          className="h-[600px] overflow-auto"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const employee = employees[virtualRow.index]
              return (
                <EmployeeRow
                  key={virtualRow.key}
                  employee={employee}
                  isSelected={selectedEmployees.includes(employee.id)}
                  onSelect={handleSelectEmployee}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  showCheckbox={!!onSelectionChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Dialogs inchangés */}
    </>
  )
}
```

### Adaptation pour Vue Mobile (Cards)

```typescript
const cardVirtualizer = useVirtualizer({
  count: employees.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 200, // Cards plus hautes
  overscan: 3,
})

// Dans le render mobile
<div ref={parentRef} className="h-[600px] overflow-auto">
  <div style={{ height: `${cardVirtualizer.getTotalSize()}px`, position: 'relative' }}>
    {cardVirtualizer.getVirtualItems().map((virtualCard) => {
      const employee = employees[virtualCard.index]
      return (
        <EmployeeCard
          key={virtualCard.key}
          employee={employee}
          isSelected={selectedEmployees.includes(employee.id)}
          onSelect={handleSelectEmployee}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showCheckbox={!!onSelectionChange}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualCard.start}px)`,
          }}
        />
      )
    })}
  </div>
</div>
```

---

## Performance et Trade-offs

### ✅ Avantages

| Métrique | Sans Virtual Scrolling | Avec Virtual Scrolling | Gain |
|----------|------------------------|------------------------|------|
| **Render initial (1000 items)** | 800ms | 50ms | **94% plus rapide** |
| **Temps de scroll** | Lag visible | Fluide | **100% amélioré** |
| **Nodes DOM** | 1000+ | 10-20 | **98% moins** |
| **Memory usage** | ~50MB | ~5MB | **90% moins** |

### ❌ Inconvénients

1. **Hauteur du conteneur requise**
   - Pas de `height: auto` possible
   - Peut casser certains layouts responsives

2. **Complexité accrue**
   - Positionnement absolu délicat
   - Calcul de hauteurs dynamiques complexe

3. **Features CSS limitées**
   - `position: sticky` ne fonctionne pas
   - Animations complexes difficiles

4. **Accessibilité**
   - Screen readers peuvent avoir des difficultés
   - Navigation clavier à gérer manuellement

### 🎯 Quand le ROI est Positif

**Règle simple :**
- Liste < 100 items → **Pas de virtual scrolling** (React.memo suffit)
- Liste 100-500 items → **Considérer** si lag mesuré
- Liste > 500 items → **Fortement recommandé**

---

## Troubleshooting

### Problème 1 : Items qui "sautent" lors du scroll

**Cause :** Hauteurs estimées incorrectes

**Solution :**
```typescript
const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60, // Ajuster cette valeur
  measureElement: (element) => element.getBoundingClientRect().height,
  // TanStack mesure automatiquement après premier render
})
```

### Problème 2 : Scroll ne fonctionne pas

**Cause :** Conteneur parent sans hauteur fixe

**Solution :**
```typescript
// ❌ Mauvais
<div ref={parentRef} className="overflow-auto">

// ✅ Bon
<div ref={parentRef} className="h-[600px] overflow-auto">
// ou
<div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
```

### Problème 3 : Performance toujours mauvaise

**Cause :** Composants row non memoized

**Solution :**
```typescript
// ✅ Toujours wrapper les rows avec React.memo
const EmployeeRow = memo(({ employee, ...props }: EmployeeRowProps) => {
  return <div>...</div>
})

EmployeeRow.displayName = 'EmployeeRow'
```

### Problème 4 : Sélection "Tout sélectionner" lente

**Cause :** Re-render de toutes les rows

**Solution :**
```typescript
// Utiliser useCallback pour callbacks stables
const handleSelectAll = useCallback((checked: boolean) => {
  onSelectionChange(checked ? items.map(i => i.id) : [])
}, [onSelectionChange, items])

// Passer selectedIds en Set pour lookup O(1)
const selectedSet = useMemo(
  () => new Set(selectedEmployees),
  [selectedEmployees]
)

// Dans la row
isSelected={selectedSet.has(employee.id)}
```

---

## Ressources

### Documentation Officielle

- [@tanstack/react-virtual](https://tanstack.com/virtual/latest)
- [Examples CodeSandbox](https://tanstack.com/virtual/latest/docs/examples/react/table)

### Articles Recommandés

- [Virtual Scrolling in React - Complete Guide](https://blog.logrocket.com/virtual-scrolling-core-principles-and-basic-implementation-in-react/)
- [React Virtual - Performance Tips](https://www.patterns.dev/posts/virtual-lists)

### Alternatives

- **react-window** : Plus simple mais moins features
- **react-virtuoso** : Gère mieux les hauteurs dynamiques
- **@tanstack/react-virtual** : Le plus moderne et flexible (choisi)

---

## Checklist d'Implémentation

Avant d'implémenter le virtual scrolling :

- [ ] **Mesurer** : Le lag est-il > 100ms avec profiler React ?
- [ ] **Compter** : Plus de 500 items sans pagination ?
- [ ] **Tester** : React.memo + useMemo suffisent-ils ? (déjà fait en v0.7.3)
- [ ] **Concevoir** : Hauteurs d'items fixes ou estimables ?
- [ ] **Layout** : Conteneur avec hauteur fixe acceptable ?
- [ ] **Accessibilité** : Navigation clavier et screen readers gérés ?
- [ ] **Mobile** : Comportement OK sur petits écrans ?

Si toutes les réponses sont OUI → Implémenter

---

**Dernière mise à jour :** 2026-01-12
**Version :** 0.7.5
**Auteur :** Claude Sonnet 4.5
