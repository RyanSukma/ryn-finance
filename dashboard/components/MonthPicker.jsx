'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function MonthPicker() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const monthParam = searchParams.get('month')
    if (monthParam) {
      const [year, month] = monthParam.split('-')
      // Note: month is 1-indexed in param, but 0-indexed in Date constructor
      setCurrentDate(new Date(parseInt(year), parseInt(month) - 1, 1))
    } else {
      setCurrentDate(new Date())
    }
  }, [searchParams])

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    updateUrl(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    updateUrl(newDate)
  }

  const updateUrl = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    router.push(`/?month=${year}-${month}`)
  }

  const formatMonth = (date) => {
    return date.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePrevMonth}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
        aria-label="Bulan sebelumnya"
      >
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="font-semibold text-slate-800 min-w-[140px] text-center">
        {formatMonth(currentDate)}
      </span>
      <button
        onClick={handleNextMonth}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
        aria-label="Bulan selanjutnya"
      >
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
