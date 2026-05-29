import { cookies } from 'next/headers'

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
const API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY

export async function apiFetch(path, options = {}) {
  if (!API_URL) {
    throw new Error('API_URL belum diatur di .env.local')
  }

  if (!API_KEY) {
    throw new Error('API_KEY belum diatur di .env.local')
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...(options.headers || {})
    },
    cache: 'no-store'
  })

  let result
  try {
    result = await response.json()
  } catch (error) {
    throw new Error('Response dari API bukan JSON yang valid')
  }

  if (!response.ok) {
    throw new Error(result.message || 'Gagal mengambil data dari API')
  }

  return result
}

// === Server-Side API Functions ===

export async function getTransactionsFiltered(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.user_id) searchParams.append('user_id', params.user_id)
  if (params.date_from) searchParams.append('date_from', params.date_from)
  if (params.date_to) searchParams.append('date_to', params.date_to)
  
  const qs = searchParams.toString()
  return apiFetch(`/api/v1/transactions${qs ? `?${qs}` : ''}`)
}

export async function getTransactions() {
  return getTransactionsFiltered()
}

export async function getTransactionsSummary(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.date_from) searchParams.append('date_from', params.date_from)
  if (params.date_to) searchParams.append('date_to', params.date_to)
  
  const qs = searchParams.toString()
  return apiFetch(`/api/v1/transactions/summary${qs ? `?${qs}` : ''}`)
}

export async function getUsers() {
  return apiFetch('/api/v1/users')
}

export async function getReports() {
  return apiFetch('/api/v1/reports')
}

export async function getReportByPeriod(period) {
  return apiFetch(`/api/v1/reports/${period}`)
}

export async function deleteTransaction(id) {
  return apiFetch(`/api/v1/transactions/${id}`, {
    method: 'DELETE'
  })
}

// === Auth Utilities ===

export async function checkAuth() {
  const cookieStore = await cookies()
  const session = cookieStore.get('rynfinance-session')
  
  if (!session || session.value !== 'authenticated') {
    return false
  }
  return true
}