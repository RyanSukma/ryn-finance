export default function StatusBadge({ status = '', source = '' }) {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200'
  let label = status || source

  if (source === 'text') {
    colorClass = 'bg-blue-50 text-blue-700 border-blue-200'
    label = 'Text'
  } else if (source === 'photo') {
    colorClass = 'bg-violet-50 text-violet-700 border-violet-200'
    label = 'Receipt OCR'
  } else if (source === 'manual') {
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200'
    label = 'Manual'
  }

  // If explicit status provided overrides source color logic
  if (status === 'Dikonfirmasi') {
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  } else if (status === 'Pending') {
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200'
  } else if (status === 'Gagal') {
    colorClass = 'bg-rose-50 text-rose-700 border-rose-200'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {label}
    </span>
  )
}
