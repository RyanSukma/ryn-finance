'use client'

import { useState, useEffect } from 'react'
import EmptyState from '@/components/EmptyState'
import LoadingSpinner from '@/components/LoadingSpinner'
import { fetchReports, generateReport } from '@/lib/api-client'
import { formatBulan, formatTanggalLengkap } from '@/lib/format'

export default function LaporanPage() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const res = await fetchReports()
      if (res?.success) {
        setReports(res.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleGenerateManual = async () => {
    setIsGenerating(true)
    try {
      // Simulate API call for now (as the backend PDF generation might need setup)
      // const res = await generateReport({ mode: 'current-month', send_to_telegram: false })
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Simulasi: Laporan berhasil digenerate! (Fungsi ini memerlukan backend PDF generator yang aktif)')
      loadData()
    } catch (error) {
      console.error("Failed to generate report:", error)
      alert('Gagal menggenerate laporan')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan Bulanan</h1>
          <p className="text-slate-500 mt-1">Arsip laporan rekapitulasi keuangan yang telah dibuat.</p>
        </div>
        
        <button
          onClick={handleGenerateManual}
          disabled={isGenerating}
          className={`inline-flex items-center justify-center px-4 py-2.5 font-medium rounded-xl text-sm transition-all shadow-sm
            ${isGenerating 
              ? 'bg-violet-400 text-white cursor-not-allowed' 
              : 'bg-violet-600 text-white hover:bg-violet-700 btn-press'}
          `}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memproses...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Manual
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <LoadingSpinner />
        ) : reports.length === 0 ? (
          <div className="p-12">
            <EmptyState 
              title="Belum Ada Laporan" 
              description="Sistem akan otomatis menggenerate laporan PDF setiap akhir bulan, atau gunakan tombol Generate Manual."
              icon={
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {reports.map((report: any) => (
              <div key={report.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow group flex flex-col h-full bg-slate-50 hover:bg-white hover:border-violet-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {report.sent_at ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                      Terkirim
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                      Belum Dikirim
                    </span>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-violet-700 transition-colors">
                    Laporan {formatBulan(report.period)}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Dibuat {formatTanggalLengkap(report.generated_at)}
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Total</p>
                    <p className="font-bold text-slate-900">Rp {(report.total_amount || 0).toLocaleString('id-ID')}</p>
                  </div>
                  <a 
                    href={report.pdf_url || '#'}
                    target="_blank"
                    className={`inline-flex p-2 rounded-lg transition-colors ${
                      report.pdf_url 
                        ? 'text-violet-600 hover:bg-violet-100 bg-violet-50' 
                        : 'text-slate-400 bg-slate-100 cursor-not-allowed'
                    }`}
                    title={report.pdf_url ? "Unduh PDF" : "PDF belum tersedia"}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
