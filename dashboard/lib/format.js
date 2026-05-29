export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID').format(amount || 0)
}

export function formatTanggal(dateString) {
  if (!dateString) return '-'

  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export function formatTanggalLengkap(dateString) {
  if (!dateString) return '-'

  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

export function formatTanggalSingkat(dateString) {
  if (!dateString) return '-'

  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short'
  })
}

export function formatBulan(period) {
  if (!period) return '-'

  const [year, month] = period.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)

  return date.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  })
}

export function formatPeriod(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function getSourceLabel(source) {
  const labels = {
    text: 'Text',
    photo: 'Receipt OCR',
    manual: 'Manual'
  }
  return labels[source] || source || '-'
}

export function getSourceColor(source) {
  const colors = {
    text: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    photo: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
    manual: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' }
  }
  return colors[source] || { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-500' }
}

const memberColors = [
  { bar: 'bg-blue-500', light: 'bg-blue-100' },
  { bar: 'bg-violet-500', light: 'bg-violet-100' },
  { bar: 'bg-teal-500', light: 'bg-teal-100' },
  { bar: 'bg-rose-500', light: 'bg-rose-100' },
  { bar: 'bg-amber-500', light: 'bg-amber-100' },
  { bar: 'bg-emerald-500', light: 'bg-emerald-100' },
]

export function getMemberColor(index) {
  return memberColors[index % memberColors.length]
}

const chartColors = ['#3B82F6', '#8B5CF6', '#14B8A6', '#F43F5E', '#F59E0B', '#10B981']

export function getChartColor(index) {
  return chartColors[index % chartColors.length]
}