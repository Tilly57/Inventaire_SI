/** @fileoverview Tableau des utilisateurs avec gestion des roles et actions d'administration */
import { useState, memo, lazy, Suspense } from 'react'
import type { User } from '@/lib/types/models.types'
import { UserRoleLabels } from '@/lib/types/enums.ts'
import { formatDate } from '@/lib/utils/formatters'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Pencil, Trash2 } from 'lucide-react'

// Lazy load dialogs
const UserFormDialog = lazy(() => import('./UserFormDialog').then(m => ({ default: m.UserFormDialog })))
const DeleteUserDialog = lazy(() => import('./DeleteUserDialog').then(m => ({ default: m.DeleteUserDialog })))
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

interface UsersTableProps {
  users: User[]
  currentUserId?: string
}

function UsersTableComponent({ users, currentUserId }: UsersTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const { isMobile } = useMediaQuery()

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive'
      case 'GESTIONNAIRE':
        return 'default'
      default:
        return 'secondary'
    }
  }

  // Vue mobile - Cards empilées
  if (isMobile) {
    if (users.length === 0) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Aucun utilisateur trouvé
        </div>
      )
    }

    return (
      <>
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="p-4 animate-fadeIn">
              <div className="space-y-3">
                {/* En-tête avec nom et rôle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-base">{user.username}</p>
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {UserRoleLabels[user.role]}
                  </Badge>
                </div>

                {/* Informations */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Rôle</span>
                    <p className="font-medium">{UserRoleLabels[user.role]}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Créé le</span>
                    <p className="font-medium">{formatDate(user.createdAt)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingUser(user)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setDeletingUser(user)}
                    disabled={user.id === currentUserId}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Suspense fallback={null}>
          <UserFormDialog
            user={editingUser}
            open={!!editingUser}
            onClose={() => setEditingUser(null)}
          />
        </Suspense>

        <Suspense fallback={null}>
          <DeleteUserDialog
            user={deletingUser}
            open={!!deletingUser}
            onClose={() => setDeletingUser(null)}
          />
        </Suspense>
      </>
    )
  }

  // Vue desktop - Tableau
  return (
    <>
      <div className="overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom d'utilisateur</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Aucun utilisateur trouvé
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {UserRoleLabels[user.role]}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingUser(user)}
                      disabled={user.id === currentUserId}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>

      <Suspense fallback={null}>
        <UserFormDialog
          user={editingUser}
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <DeleteUserDialog
          user={deletingUser}
          open={!!deletingUser}
          onClose={() => setDeletingUser(null)}
        />
      </Suspense>
    </>
  )
}

// Memoized: Prevent unnecessary re-renders - Phase 3.3
export const UsersTable = memo(UsersTableComponent)
