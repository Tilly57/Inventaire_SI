/**
 * @fileoverview Users management hooks with React Query
 *
 * Provides CRUD operations for system users with automatic caching,
 * cache invalidation, and toast notifications.
 *
 * System users are admins/managers who access the application,
 * NOT employees who borrow equipment.
 *
 * Features:
 * - Automatic cache management via React Query
 * - Optimistic UI updates with cache invalidation
 * - Toast notifications for user feedback
 * - Error handling with user-friendly messages
 *
 * All mutation hooks require ADMIN role on backend.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllUsersApi,
  getUserApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
  changePasswordApi,
} from '@/lib/api/users.api'
import type {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
} from '@/lib/types/models.types'
import { useToast } from '@/lib/hooks/use-toast'
import { getErrorMessage } from '@/lib/utils/getErrorMessage'

/**
 * Hook to fetch all system users
 *
 * Returns cached list of users with automatic background refetching.
 * Cache key: ['users']
 *
 * @returns React Query result object
 * @returns {User[] | undefined} data - Array of users (without passwords)
 * @returns {boolean} isLoading - Whether initial fetch is in progress
 * @returns {boolean} isError - Whether fetch failed
 *
 * @example
 * function UsersListPage() {
 *   const { data: users = [], isLoading } = useUsers();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return <UserTable users={users} />;
 * }
 */
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getAllUsersApi,
    staleTime: 30_000,
  })
}

/**
 * Hook to fetch single user by ID
 *
 * Only fetches when ID is provided (enabled: !!id).
 * Cache key: ['users', id]
 *
 * @param id - User ID to fetch
 * @returns React Query result object
 * @returns {User | undefined} data - User object (without password)
 *
 * @example
 * function UserDetailsPage({ userId }) {
 *   const { data: user, isLoading } = useUser(userId);
 *
 *   if (isLoading) return <Spinner />;
 *   if (!user) return <NotFound />;
 *
 *   return <UserDetails user={user} />;
 * }
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => getUserApi(id),
    staleTime: 30_000,
    enabled: !!id,
  })
}

/**
 * Hook to create new system user
 *
 * On success:
 * - Invalidates users cache (triggers refetch)
 * - Shows success toast
 *
 * On error:
 * - Shows error toast with API message
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * function CreateUserForm() {
 *   const createUser = useCreateUser();
 *
 *   const handleSubmit = (data) => {
 *     createUser.mutate(data, {
 *       onSuccess: () => navigate('/users')
 *     });
 *   };
 *
 *   return (
 *     <Form onSubmit={handleSubmit}>
 *       <Input name="email" />
 *       <Input name="password" type="password" />
 *       <Select name="role" />
 *       <Button disabled={createUser.isPending}>Create</Button>
 *     </Form>
 *   );
 * }
 */
export function useCreateUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateUserDto) => createUserApi(data),
    onSuccess: async () => {
      // Invalidate users cache
      await queryClient.resetQueries({ queryKey: ['users'] })

      // Show success notification
      toast({
        title: 'Utilisateur créé',
        description: 'L\'utilisateur a été créé avec succès',
      })
    },
    onError: (error: unknown) => {
      // Show error notification with API message
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de créer l\'utilisateur'),
      })
    },
  })
}

/**
 * Hook to update existing user
 *
 * Updates user email and/or role (not password - use useChangePassword for that).
 *
 * On success:
 * - Invalidates users cache
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function EditUserDialog({ user }) {
 *   const updateUser = useUpdateUser();
 *
 *   const handleSubmit = (data) => {
 *     updateUser.mutate(
 *       { id: user.id, data },
 *       { onSuccess: () => onClose() }
 *     );
 *   };
 * }
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      updateUserApi(id, data),
    onSuccess: async () => {
      await queryClient.resetQueries({ queryKey: ['users'] })
      toast({
        title: 'Utilisateur modifié',
        description: 'L\'utilisateur a été modifié avec succès',
      })
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de modifier l\'utilisateur'),
      })
    },
  })
}

/**
 * Hook to delete user
 *
 * Permanently removes user from system.
 * No cascading restrictions.
 *
 * On success:
 * - Invalidates users cache
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function UserRow({ user }) {
 *   const deleteUser = useDeleteUser();
 *
 *   const handleDelete = () => {
 *     if (confirm('Delete user?')) {
 *       deleteUser.mutate(user.id);
 *     }
 *   };
 *
 *   return (
 *     <tr>
 *       <td>{user.email}</td>
 *       <td><Button onClick={handleDelete}>Delete</Button></td>
 *     </tr>
 *   );
 * }
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteUserApi(id),
    onSuccess: async () => {
      await queryClient.resetQueries({ queryKey: ['users'] })
      toast({
        title: 'Utilisateur supprimé',
        description: 'L\'utilisateur a été supprimé avec succès',
      })
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de supprimer l\'utilisateur'),
      })
    },
  })
}

/**
 * Hook to change user password
 *
 * Requires current password for verification.
 * Does NOT invalidate cache (no visible data change).
 *
 * On success:
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function ChangePasswordForm({ userId }) {
 *   const changePassword = useChangePassword();
 *
 *   const handleSubmit = (data) => {
 *     changePassword.mutate(
 *       { id: userId, data },
 *       { onSuccess: () => resetForm() }
 *     );
 *   };
 *
 *   return (
 *     <Form onSubmit={handleSubmit}>
 *       <Input name="currentPassword" type="password" />
 *       <Input name="newPassword" type="password" />
 *       <Button disabled={changePassword.isPending}>Change</Button>
 *     </Form>
 *   );
 * }
 */
export function useChangePassword() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangePasswordDto }) =>
      changePasswordApi(id, data),
    onSuccess: () => {
      toast({
        title: 'Mot de passe modifié',
        description: 'Le mot de passe a été modifié avec succès',
      })
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de modifier le mot de passe'),
      })
    },
  })
}
