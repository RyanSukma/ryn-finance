const API_URL = process.env.API_URL
const API_KEY = process.env.API_KEY

function getApiBaseUrl() {
  if (!API_URL) {
    throw new Error('API_URL belum diatur di environment variable.')
  }

  return API_URL.replace(/\/$/, '')
}

function getApiKey() {
  if (!API_KEY) {
    throw new Error('API_KEY belum diatur di environment variable.')
  }

  return API_KEY
}

export async function apiFetch(path, options = {}) {
  const baseUrl = getApiBaseUrl()
  const apiKey = getApiKey()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const url = `${baseUrl}${cleanPath}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...(options.headers || {})
    },
    cache: 'no-store'
  })

  let result

  try {
    result = await response.json()
  } catch (error) {
    console.error('API response bukan JSON:', {
      url,
      status: response.status
    })

    throw new Error('Response dari API bukan JSON yang valid.')
  }

  if (!response.ok) {
    console.error('API ERROR:', {
      url,
      status: response.status,
      result
    })

    throw new Error(result.message || 'Gagal mengambil data dari API.')
  }

  return result
}

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