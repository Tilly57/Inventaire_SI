import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Employee } from '@/lib/types/models.types'
import { createEmployeeSchema, updateEmployeeSchema } from '@/lib/schemas/employees.schema'
import type { CreateEmployeeFormData, UpdateEmployeeFormData } from '@/lib/schemas/employees.schema'
import { useCreateEmployee, useUpdateEmployee } from '@/lib/hooks/useEmployees'
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
import { Button } from '@/components/ui/button'

interface EmployeeFormDialogProps {
  employee?: Employee | null
  open: boolean
  onClose: () => void
}

export function EmployeeFormDialog({ employee, open, onClose }: EmployeeFormDialogProps) {
  const isEdit = !!employee
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()

  const form = useForm<CreateEmployeeFormData | UpdateEmployeeFormData>({
    resolver: zodResolver(isEdit ? updateEmployeeSchema : createEmployeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      dept: '',
    },
  })

  useEffect(() => {
    if (employee) {
      form.reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        dept: employee.dept || '',
      })
    } else {
      form.reset({
        firstName: '',
        lastName: '',
        email: '',
        dept: '',
      })
    }
  }, [employee, form])

  const onSubmit = async (data: CreateEmployeeFormData | UpdateEmployeeFormData) => {
    try {
      if (isEdit && employee) {
        await updateEmployee.mutateAsync({ id: employee.id, data: data as UpdateEmployeeFormData })
      } else {
        await createEmployee.mutateAsync(data as CreateEmployeeFormData)
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
            {isEdit ? 'Modifier l\'employé' : 'Créer un employé'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifiez les informations de l\'employé'
              : 'Ajoutez un nouvel employé dans le système'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jean.dupont@exemple.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dept"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Département (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Informatique" {...field} value={field.value || ''} />
                  </FormControl>
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
                disabled={createEmployee.isPending || updateEmployee.isPending}
              >
                {createEmployee.isPending || updateEmployee.isPending
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
