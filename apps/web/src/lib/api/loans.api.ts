import apiClient from './client'
import type {
  Loan,
  CreateLoanDto,
  AddLoanLineDto,
  ApiResponse,
} from '@/lib/types/models.types'

export async function getAllLoansApi(): Promise<Loan[]> {
  const response = await apiClient.get<any>('/loans?limit=1000')
  const data = response.data.data
  return Array.isArray(data) ? data : data.loans || []
}

export async function getLoanApi(id: string): Promise<Loan> {
  const response = await apiClient.get<ApiResponse<Loan>>(`/loans/${id}`)
  return response.data.data
}

export async function createLoanApi(data: CreateLoanDto): Promise<Loan> {
  const response = await apiClient.post<ApiResponse<Loan>>('/loans', data)
  return response.data.data
}

export async function addLoanLineApi(loanId: string, data: AddLoanLineDto): Promise<Loan> {
  const response = await apiClient.post<ApiResponse<Loan>>(`/loans/${loanId}/lines`, data)
  return response.data.data
}

export async function removeLoanLineApi(loanId: string, lineId: string): Promise<Loan> {
  const response = await apiClient.delete<ApiResponse<Loan>>(`/loans/${loanId}/lines/${lineId}`)
  return response.data.data
}

export async function uploadPickupSignatureApi(loanId: string, file: File): Promise<Loan> {
  const formData = new FormData()
  formData.append('signature', file)

  const response = await apiClient.post<ApiResponse<Loan>>(
    `/loans/${loanId}/pickup-signature`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data.data
}

export async function uploadReturnSignatureApi(loanId: string, file: File): Promise<Loan> {
  const formData = new FormData()
  formData.append('signature', file)

  const response = await apiClient.post<ApiResponse<Loan>>(
    `/loans/${loanId}/return-signature`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data.data
}

export async function closeLoanApi(loanId: string): Promise<Loan> {
  const response = await apiClient.patch<ApiResponse<Loan>>(`/loans/${loanId}/close`)
  return response.data.data
}

export async function deleteLoanApi(id: string): Promise<void> {
  await apiClient.delete(`/loans/${id}`)
}
