const PROXY_BASE = '/api/proxy'

async function proxyFetch(path, options = {}) {
  const res = await fetch(`${PROXY_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

export async function fetchSummary(params = {}) {
  const search = new URLSearchParams(params).toString()
  return proxyFetch(`/transactions/summary${search ? '?' + search : ''}`)
}

export async function fetchTransactions(params = {}) {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
  const search = new URLSearchParams(filtered).toString()
  return proxyFetch(`/transactions${search ? '?' + search : ''}`)
}

export async function deleteTransaction(id) {
  return proxyFetch(`/transactions/${id}`, { method: 'DELETE' })
}

export async function createTransaction(data) {
  return proxyFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function fetchUsers() {
  return proxyFetch('/users')
}

export async function createUser(data) {
  return proxyFetch('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function fetchReports() {
  return proxyFetch('/reports')
}

export async function fetchReportByPeriod(period) {
  return proxyFetch(`/reports/${period}`)
}

export async function generateReport(options = {}) {
  return proxyFetch('/reports/generate', {
    method: 'POST',
    body: JSON.stringify(options)
  })
}
