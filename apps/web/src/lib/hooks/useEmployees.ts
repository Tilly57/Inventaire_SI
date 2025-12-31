/**
 * @fileoverview Employees management hooks with React Query
 *
 * Provides CRUD operations for employees with automatic caching,
 * cache invalidation, and toast notifications.
 *
 * Employees are end-users who borrow equipment, NOT system users.
 * See useUsers.ts for system user management.
 *
 * Features:
 * - Automatic cache management via React Query
 * - Optimistic UI updates with cache invalidation and refetch
 * - Toast notifications for user feedback
 * - Error handling with user-friendly messages
 *
 * Deletion restriction: Employees with loan history cannot be deleted.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllEmployeesApi,
  getEmployeeApi,
  createEmployeeApi,
  updateEmployeeApi,
  deleteEmployeeApi,
} from '@/lib/api/employees.api'
import type {
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '@/lib/types/models.types'
import { useToast } from '@/lib/hooks/use-toast'

/**
 * Hook to fetch all employees
 *
 * Returns cached list of employees with loan counts.
 * Cache key: ['employees']
 *
 * @returns React Query result object
 * @returns {Employee[] | undefined} data - Array of employees with _count.loans
 * @returns {boolean} isLoading - Whether initial fetch is in progress
 * @returns {boolean} isError - Whether fetch failed
 *
 * @example
 * function EmployeesListPage() {
 *   const { data: employees = [], isLoading } = useEmployees();
 *
 *   return (
 *     <Table>
 *       {employees.map(emp => (
 *         <Row key={emp.id}>
 *           <Cell>{emp.firstName} {emp.lastName}</Cell>
 *           <Cell>{emp._count.loans} loans</Cell>
 *         </Row>
 *       ))}
 *     </Table>
 *   );
 * }
 */
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: getAllEmployeesApi,
  })
}

/**
 * Hook to fetch single employee by ID
 *
 * Returns employee with recent loan history (up to 10 loans).
 * Only fetches when ID is provided.
 * Cache key: ['employees', id]
 *
 * @param id - Employee ID to fetch
 * @returns React Query result object
 * @returns {Employee | undefined} data - Employee with loans array
 *
 * @example
 * function EmployeeDetailsPage({ employeeId }) {
 *   const { data: employee, isLoading } = useEmployee(employeeId);
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       <h1>{employee.firstName} {employee.lastName}</h1>
 *       <LoanHistory loans={employee.loans} />
 *     </div>
 *   );
 * }
 */
export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => getEmployeeApi(id),
    enabled: !!id,
  })
}

/**
 * Hook to create new employee
 *
 * On success:
 * - Invalidates employees cache
 * - Refetches employees list
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function CreateEmployeeForm() {
 *   const createEmployee = useCreateEmployee();
 *
 *   const handleSubmit = (data) => {
 *     createEmployee.mutate(data, {
 *       onSuccess: () => navigate('/employees')
 *     });
 *   };
 *
 *   return (
 *     <Form onSubmit={handleSubmit}>
 *       <Input name="firstName" />
 *       <Input name="lastName" />
 *       <Input name="email" />
 *       <Input name="dept" placeholder="Department/Agency" />
 *       <Button disabled={createEmployee.isPending}>Create</Button>
 *     </Form>
 *   );
 * }
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateEmployeeDto) => createEmployeeApi(data),
    onSuccess: async () => {
      // Invalidate all related queries (no refetch needed - invalidate triggers automatic refetch)
      await queryClient.invalidateQueries({ queryKey: ['employees'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      toast({
        title: 'Employé créé',
        description: 'L\'employé a été créé avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de créer l\'employé',
      })
    },
  })
}

/**
 * Hook to update existing employee
 *
 * Updates employee information (name, email, department).
 *
 * On success:
 * - Invalidates and refetches employees cache
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function EditEmployeeDialog({ employee }) {
 *   const updateEmployee = useUpdateEmployee();
 *
 *   const handleSubmit = (data) => {
 *     updateEmployee.mutate(
 *       { id: employee.id, data },
 *       { onSuccess: () => onClose() }
 *     );
 *   };
 * }
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDto }) =>
      updateEmployeeApi(id, data),
    onSuccess: async () => {
      // Invalidate all related queries (no refetch needed - invalidate triggers automatic refetch)
      await queryClient.invalidateQueries({ queryKey: ['employees'] })

      toast({
        title: 'Employé modifié',
        description: 'L\'employé a été modifié avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de modifier l\'employé',
      })
    },
  })
}

/**
 * Hook to delete employee
 *
 * IMPORTANT: Employees with ANY loan history cannot be deleted.
 * Backend will return ValidationError if employee has loans.
 *
 * On success:
 * - Invalidates and refetches employees cache
 * - Shows success toast
 *
 * On error (e.g., has loan history):
 * - Shows detailed error message from API
 *
 * @returns Mutation object
 *
 * @example
 * function EmployeeRow({ employee }) {
 *   const deleteEmployee = useDeleteEmployee();
 *
 *   const handleDelete = () => {
 *     if (confirm(`Delete ${employee.firstName}?`)) {
 *       deleteEmployee.mutate(employee.id);
 *     }
 *   };
 *
 *   return (
 *     <tr>
 *       <td>{employee.firstName} {employee.lastName}</td>
 *       <td>{employee._count.loans} loans</td>
 *       <td>
 *         <Button
 *           onClick={handleDelete}
 *           disabled={employee._count.loans > 0}
 *         >
 *           Delete
 *         </Button>
 *       </td>
 *     </tr>
 *   );
 * }
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteEmployeeApi(id),
    onSuccess: async () => {
      // Invalidate all related queries (no refetch needed - invalidate triggers automatic refetch)
      await queryClient.invalidateQueries({ queryKey: ['employees'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      toast({
        title: 'Employé supprimé',
        description: 'L\'employé a été supprimé avec succès',
      })
    },
    onError: (error: any) => {
      // Error message explains why deletion failed (e.g., has loan history)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de supprimer l\'employé',
      })
    },
  })
}
