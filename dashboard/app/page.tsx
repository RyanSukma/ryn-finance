export const dynamic = 'force-dynamic'

import SummaryCard from '@/components/SummaryCard'
import StatusBadge from '@/components/StatusBadge'
import MonthPicker from '@/components/MonthPicker'
import { Suspense } from 'react'
import { getReports, getTransactionsFiltered, getTransactionsSummary } from '@/lib/api'
import {
  formatRupiah,
  formatTanggalSingkat,
  getSourceLabel,
  getMemberColor
} from '@/lib/format'

type SummaryUser = {
  user_id: string
  name: string
  telegram_id?: number
  is_active?: boolean
  is_admin?: boolean
  total: number
  transaction_count: number
}

type SummaryData = {
  total_family: number
  transaction_count: number
  per_user: SummaryUser[]
}

type Transaction = {
  id: string
  user_id: string
  amount: number
  description: string
  source: string
  photo_url?: string | null
  created_at: string
  users?: {
    id: string
    name: string
    telegram_id?: number
  } | null
}

type Report = {
  id: string
  user_id?: string
  period: string
  total_amount: number
  pdf_url: string
  generated_at?: string
  sent_at?: string | null
  users?: {
    id: string
    name: string
    telegram_id?: number
  } | null
}

export default async function OverviewPage(props: any) {
  const searchParams = (await props.searchParams) || {};
  const monthParam = searchParams.month as string;
  
  let dateFrom, dateTo;
  if (monthParam) {
    const [year, month] = monthParam.split('-');
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    dateFrom = `${year}-${month}-01`;
    dateTo = `${year}-${month}-${lastDay}`;
  } else {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    dateFrom = `${year}-${month}-01`;
    dateTo = `${year}-${month}-${lastDay}`;
  }

  let summary: SummaryData = {
    total_family: 0,
    transaction_count: 0,
    per_user: []
  }

  let transactions: Transaction[] = []
  let reports: Report[] = []
  let fetchError = ''

  try {
    const [summaryResult, transactionsResult, reportsResult] = await Promise.all([
      getTransactionsSummary({ date_from: dateFrom, date_to: dateTo }),
      getTransactionsFiltered({ date_from: dateFrom, date_to: dateTo }),
      getReports()
    ])

    if (summaryResult?.success) {
      summary = summaryResult.data
    }

    if (transactionsResult?.success) {
      transactions = transactionsResult.data || []
    }

    if (reportsResult?.success) {
      reports = reportsResult.data || []
    }
  } catch (error: any) {
    console.error('Failed to fetch overview data:', error)
    fetchError = error.message || 'Gagal mengambil data dari backend.'
  }

  const recentTransactions = transactions.slice(0, 5)
  const recentReports = reports.slice(0, 2)

  const maxTotal =
    summary.per_user.length > 0
      ? Math.max(...summary.per_user.map((user) => user.total), 1)
      : 1

  return (
    <div className="space-y-6 animate-fade-in">
      {fetchError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <p className="font-bold">Gagal mengambil data dashboard.</p>
          <p className="mt-1">{fetchError}</p>
          <p className="mt-2 text-xs">
            Cek API_URL dan API_KEY di Vercel Environment Variables, lalu lakukan redeploy.
          </p>
        </div>
      ) : null}

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-slate-500 mb-1">
            Berikut adalah ringkasan keuangan Anda.
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-40 bg-slate-100 rounded-lg animate-pulse" />}>
          <MonthPicker />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {summary.per_user.length > 0 ? (
          summary.per_user.map((user, index) => {
            const colorClasses = [
              { bg: 'bg-blue-100', text: 'text-blue-600' },
              { bg: 'bg-violet-100', text: 'text-violet-600' },
              { bg: 'bg-teal-100', text: 'text-teal-600' },
              { bg: 'bg-rose-100', text: 'text-rose-600' },
              { bg: 'bg-amber-100', text: 'text-amber-600' }
            ]

            const color = colorClasses[index % colorClasses.length]

            return (
              <SummaryCard
                key={user.user_id}
                title={`Pengeluaran ${user.name}`}
                value={`Rp ${formatRupiah(user.total)}`}
                description={`${user.transaction_count} transaksi periode ini`}
                icon={
                  <div className={`${color.bg} ${color.text} rounded-xl p-2.5`}>
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                }
              />
            )
          })
        ) : (
          <div className="col-span-full">
            <p className="text-slate-500 text-sm">
              Belum ada data anggota keluarga.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Transaksi Terbaru
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Catatan pengeluaran terbaru dari Telegram bot dan OCR struk.
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all w-full sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 font-semibold uppercase bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Anggota</th>
                    <th className="px-6 py-4">Deskripsi</th>
                    <th className="px-6 py-4">Sumber</th>
                    <th className="px-6 py-4">Nominal</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        Belum ada transaksi pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((item) => (
                      <tr key={item.id} className="table-row-hover group">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                          {formatTanggalSingkat(item.created_at)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-slate-900">
                            {item.users?.name || '-'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className="text-slate-700 block truncate max-w-[150px] md:max-w-[200px]"
                            title={item.description}
                          >
                            {item.description}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                          {getSourceLabel(item.source)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900">
                            Rp {formatRupiah(item.amount)}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge
                            source={item.source}
                            status="Dikonfirmasi"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Menampilkan {recentTransactions.length} dari{' '}
                {summary.transaction_count}
              </span>

              <div className="flex gap-2">
                <button
                  disabled
                  className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-400 bg-slate-50 cursor-not-allowed"
                >
                  Sebelumnya
                </button>

                <a
                  href="/riwayat"
                  className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Selanjutnya
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">
              Pengeluaran per Anggota
            </h3>

            <div className="space-y-5">
              {summary.per_user.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Belum ada anggota yang tercatat.
                </p>
              ) : (
                summary.per_user.map((user, index) => {
                  const percentage =
                    maxTotal > 0 ? (user.total / maxTotal) * 100 : 0

                  const color = getMemberColor(index)

                  return (
                    <div key={user.user_id}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          {user.name}
                        </span>

                        <span className="text-sm font-bold text-slate-900">
                          Rp {formatRupiah(user.total)}
                        </span>
                      </div>

                      <div
                        className={`h-2.5 w-full rounded-full ${color.light} overflow-hidden`}
                      >
                        <div
                          className={`h-full rounded-full ${color.bar} progress-bar`}
                          style={{
                            width: `${Math.max(percentage, 2)}%`
                          }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Laporan</h3>

              <a
                href="/laporan"
                className="text-sm font-medium text-violet-600 hover:text-violet-700 hover:underline"
              >
                Lihat Semua
              </a>
            </div>

            <div className="space-y-3">
              {recentReports.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Belum ada laporan yang dibuat.
                </p>
              ) : (
                recentReports.map((report) => (
                  <a
                    key={report.id}
                    href={report.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center p-3 border border-slate-100 rounded-xl hover:border-violet-200 hover:bg-violet-50/50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                      <svg
                        className="w-6 h-6 text-rose-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>

                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-violet-700 transition-colors">
                        Laporan {report.period}
                      </p>

                      <p className="text-xs text-slate-500 truncate">
                        {report.users?.name || 'RynFinance'}
                      </p>
                    </div>

                    <span className="p-2 text-slate-400 group-hover:text-slate-600 shrink-0">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </span>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}