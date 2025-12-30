/**
 * @fileoverview ResponsiveTable - Tableau adaptatif mobile/desktop
 *
 * Affiche un tableau standard sur desktop (>= md)
 * et une vue en cards empilées sur mobile (< md)
 *
 * Features:
 * - Vue tableau pour grands écrans
 * - Vue cards pour mobile
 * - Scroll horizontal avec indicateurs visuels
 * - Configurable via props
 * - Support actions par ligne
 *
 * @example
 * <ResponsiveTable
 *   columns={[
 *     { key: 'name', label: 'Nom', mobileLabel: 'Nom' },
 *     { key: 'email', label: 'Email', mobileLabel: 'Email' },
 *   ]}
 *   data={items}
 *   renderCell={(item, column) => item[column.key]}
 *   renderMobileCard={(item) => <MobileCard item={item} />}
 * />
 */

import { ReactNode } from 'react';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/**
 * Définition d'une colonne du tableau
 */
export interface ResponsiveTableColumn<T = any> {
  /** Clé unique de la colonne */
  key: string;
  /** Label affiché dans l'en-tête (desktop) */
  label: string;
  /** Label affiché en mobile (optionnel, utilise label par défaut) */
  mobileLabel?: string;
  /** Classe CSS pour la cellule */
  className?: string;
  /** Classe CSS pour l'en-tête */
  headerClassName?: string;
  /** Si vrai, masque cette colonne en mobile */
  hideOnMobile?: boolean;
}

/**
 * Props du composant ResponsiveTable
 */
export interface ResponsiveTableProps<T = any> {
  /** Colonnes du tableau */
  columns: ResponsiveTableColumn<T>[];
  /** Données à afficher */
  data: T[];
  /** Fonction pour rendre une cellule (vue desktop) */
  renderCell: (item: T, column: ResponsiveTableColumn<T>, index: number) => ReactNode;
  /** Fonction pour rendre une card mobile (optionnel, utilise rendu par défaut) */
  renderMobileCard?: (item: T, index: number) => ReactNode;
  /** Message si aucune donnée */
  emptyMessage?: string;
  /** Classe CSS pour le conteneur */
  className?: string;
  /** Si vrai, active le scroll horizontal sur mobile */
  enableHorizontalScroll?: boolean;
}

/**
 * Composant ResponsiveTable
 *
 * Tableau qui s'adapte automatiquement entre vue desktop (tableau)
 * et vue mobile (cards empilées).
 *
 * @template T Type des éléments de données
 */
export function ResponsiveTable<T = any>({
  columns,
  data,
  renderCell,
  renderMobileCard,
  emptyMessage = 'Aucune donnée à afficher',
  className = '',
  enableHorizontalScroll = true,
}: ResponsiveTableProps<T>) {
  const { isMobile } = useMediaQuery();

  // Si aucune donnée
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Vue mobile - Cards empilées
  if (isMobile && renderMobileCard) {
    return (
      <div className={`space-y-3 ${className}`}>
        {data.map((item, index) => (
          <div key={index} className="animate-fadeIn">
            {renderMobileCard(item, index)}
          </div>
        ))}
      </div>
    );
  }

  // Vue mobile - Rendu par défaut (tableau avec colonnes essentielles)
  if (isMobile && !renderMobileCard) {
    const visibleColumns = columns.filter((col) => !col.hideOnMobile);

    return (
      <div className={`space-y-3 ${className}`}>
        {data.map((item, index) => (
          <Card key={index} className="p-4 space-y-2 animate-fadeIn">
            {visibleColumns.map((column) => (
              <div key={column.key} className="flex justify-between items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                  {column.mobileLabel || column.label}
                </span>
                <span className="text-sm flex-1 text-right">
                  {renderCell(item, column, index)}
                </span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    );
  }

  // Vue desktop - Tableau standard
  const tableContent = (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key} className={column.headerClassName}>
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={index} className="animate-fadeIn">
            {columns.map((column) => (
              <TableCell key={column.key} className={column.className}>
                {renderCell(item, column, index)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  // Avec scroll horizontal si activé
  if (enableHorizontalScroll) {
    return (
      <div className={`relative ${className}`}>
        <div className="overflow-x-auto">
          {tableContent}
        </div>
      </div>
    );
  }

  return <div className={className}>{tableContent}</div>;
}

/**
 * Composant MobileCard par défaut pour un affichage simple
 *
 * Utilisé quand renderMobileCard n'est pas fourni.
 * Affiche les colonnes visibles en format clé-valeur.
 */
export function DefaultMobileCard<T>({
  item,
  columns,
  renderCell,
  index,
}: {
  item: T;
  columns: ResponsiveTableColumn<T>[];
  renderCell: (item: T, column: ResponsiveTableColumn<T>, index: number) => ReactNode;
  index: number;
}) {
  const visibleColumns = columns.filter((col) => !col.hideOnMobile);

  return (
    <Card className="p-4 space-y-2">
      {visibleColumns.map((column) => (
        <div key={column.key} className="flex justify-between items-start gap-2">
          <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
            {column.mobileLabel || column.label}
          </span>
          <span className="text-sm flex-1 text-right">
            {renderCell(item, column, index)}
          </span>
        </div>
      ))}
    </Card>
  );
}
