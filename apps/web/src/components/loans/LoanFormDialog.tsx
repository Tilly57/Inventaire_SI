import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createLoanSchema } from '@/lib/schemas/loans.schema'
import type { CreateLoanFormData } from '@/lib/schemas/loans.schema'
import { useCreateLoan } from '@/lib/hooks/useLoans'
import { useEmployees } from '@/lib/hooks/useEmployees'
import { useQueryClient } from '@tanstack/react-query'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { formatFullNameLastFirst } from '@/lib/utils/formatters'

interface LoanFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: (loanId: string) => void
}

export function LoanFormDialog({ open, onClose, onSuccess }: LoanFormDialogProps) {
  const createLoan = useCreateLoan()
  const { data: employees } = useEmployees()
  const queryClient = useQueryClient()

  // Sort employees alphabetically by last name
  const employeesList = Array.isArray(employees)
    ? [...employees].sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'))
    : []

  const form = useForm<CreateLoanFormData>({
    resolver: zodResolver(createLoanSchema),
    defaultValues: {
      employeeId: '',
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({ employeeId: '' })
    }
  }, [open, form])

  const onSubmit = async (data: CreateLoanFormData) => {
    try {
      const loan = await createLoan.mutateAsync(data)

      // Set loan in cache immediately before navigation
      queryClient.setQueryData(['loans', loan.id], loan)

      onClose()
      if (onSuccess && loan.id) {
        onSuccess(loan.id)
      }
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un prêt</DialogTitle>
          <DialogDescription>
            Sélectionnez un employé pour créer un nouveau prêt
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employé *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un employé" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employeesList.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {formatFullNameLastFirst(employee.firstName, employee.lastName)}
                          {employee.email && ` (${employee.email})`}
                        </SelectItem>
                      ))}
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
              <Button type="submit" disabled={createLoan.isPending}>
                {createLoan.isPending ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
