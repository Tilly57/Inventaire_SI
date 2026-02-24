/** @fileoverview Dialogue de creation/edition d'un utilisateur avec validation Zod */
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { User } from '@/lib/types/models.types'
import { UserRole } from '@/lib/types/enums.ts'
import { createUserSchema, updateUserSchema } from '@/lib/schemas/users.schema'
import type { CreateUserFormData, UpdateUserFormData } from '@/lib/schemas/users.schema'
import { useCreateUser, useUpdateUser } from '@/lib/hooks/useUsers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface UserFormDialogProps {
  user?: User | null
  open: boolean
  onClose: () => void
}

export function UserFormDialog({ user, open, onClose }: UserFormDialogProps) {
  const isEdit = !!user
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const form = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      role: UserRole.LECTURE,
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        username: user.username,
        role: user.role,
      })
    } else {
      form.reset({
        email: '',
        username: '',
        password: '',
        role: UserRole.LECTURE,
      })
    }
  }, [user, form])

  const onSubmit = async (data: CreateUserFormData | UpdateUserFormData) => {
    try {
      if (isEdit && user) {
        await updateUser.mutateAsync({ id: user.id, data: data as UpdateUserFormData })
      } else {
        await createUser.mutateAsync(data as CreateUserFormData)
      }
      onClose()
    } catch (error) {
      // Error handled by mutation hooks
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifiez les informations de l\'utilisateur'
              : 'Créez un nouvel utilisateur avec un rôle spécifique'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemple.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom d'utilisateur</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.ADMIN}>Administrateur</SelectItem>
                      <SelectItem value={UserRole.GESTIONNAIRE}>Gestionnaire</SelectItem>
                      <SelectItem value={UserRole.LECTURE}>Lecture seule</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createUser.isPending || updateUser.isPending}
              >
                {createUser.isPending || updateUser.isPending
                  ? 'Enregistrement...'
                  : isEdit
                  ? 'Modifier'
                  : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
