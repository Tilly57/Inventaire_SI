/**
 * Equipment Types Table Component
 *
 * Displays a list of equipment types with actions to edit and delete
 * Only visible to ADMIN users
 */
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEquipmentTypes } from '@/lib/hooks/useEquipmentTypes';
import { EquipmentTypeFormDialog } from './EquipmentTypeFormDialog';
import { DeleteEquipmentTypeDialog } from './DeleteEquipmentTypeDialog';
import type { EquipmentType } from '@/lib/types/models.types';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

export function EquipmentTypesTable() {
  const { data: equipmentTypes, isLoading } = useEquipmentTypes();
  const [editingType, setEditingType] = useState<EquipmentType | null>(null);
  const [deletingType, setDeletingType] = useState<EquipmentType | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { isMobile } = useMediaQuery();

  const handleCreate = () => {
    setEditingType(null);
    setIsFormOpen(true);
  };

  const handleEdit = (type: EquipmentType) => {
    setEditingType(type);
    setIsFormOpen(true);
  };

  const handleDelete = (type: EquipmentType) => {
    setDeletingType(type);
    setIsDeleteOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingType(null);
  };

  const handleDeleteClose = () => {
    setIsDeleteOpen(false);
    setDeletingType(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Types d'équipement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vue mobile - Cards empilées
  if (isMobile) {
    return (
      <>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Types d'équipement</CardTitle>
            <Button onClick={handleCreate}>
              Nouveau type
            </Button>
          </CardHeader>
          <CardContent>
            {!equipmentTypes || equipmentTypes.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Aucun type d'équipement</p>
              </div>
            ) : (
              <div className="space-y-3">
                {equipmentTypes.map((type) => (
                  <Card key={type.id} className="p-4 animate-fadeIn">
                    <div className="space-y-3">
                      {/* En-tête avec nom */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-base">{type.name}</p>
                        </div>
                      </div>

                      {/* Informations */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Nom</span>
                          <p className="font-medium">{type.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Créé le</span>
                          <p className="font-medium">
                            {new Date(type.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(type)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDelete(type)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <EquipmentTypeFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onClose={handleFormClose}
          equipmentType={editingType}
        />

        <DeleteEquipmentTypeDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onClose={handleDeleteClose}
          equipmentType={deletingType}
        />
      </>
    );
  }

  // Vue desktop - Tableau
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Types d'équipement</CardTitle>
          <Button onClick={handleCreate}>
            Nouveau type
          </Button>
        </CardHeader>
        <CardContent>
          {!equipmentTypes || equipmentTypes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Aucun type d'équipement</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipmentTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>
                      {new Date(type.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(type)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <EquipmentTypeFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onClose={handleFormClose}
        equipmentType={editingType}
      />

      <DeleteEquipmentTypeDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onClose={handleDeleteClose}
        equipmentType={deletingType}
      />
    </>
  );
}
