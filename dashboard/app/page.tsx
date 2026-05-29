import SummaryCard from '@/components/SummaryCard'
import StatusBadge from '@/components/StatusBadge'
import { getTransactions, getTransactionsSummary } from '@/lib/api'
import { formatRupiah, formatTanggalSingkat, getSourceLabel, getMemberColor } from '@/lib/format'

export default async function OverviewPage() {
  let summary = { total_family: 0, transaction_count: 0, per_user: [] }
  let transactions = []
  
  try {
    const [summaryResult, transactionsResult] = await Promise.all([
      getTransactionsSummary(),
      getTransactions()
    ])

    if (summaryResult?.success) summary = summaryResult.data
    if (transactionsResult?.success) transactions = transactionsResult.data || []
  } catch (error) {
    console.error("Failed to fetch overview data:", error)
    // Akan gracefully fallback ke state kosong / nol
  }

  const recentTransactions = transactions.slice(0, 5)
  const activeMembers = summary.per_user.filter((u: any) => u.is_active).length

  // Hitung maksimal total untuk progress bar
  const maxTotal = summary.per_user.length > 0 
    ? Math.max(...summary.per_user.map((u: any) => u.total))
    : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <p className="text-slate-500 mb-1">Berikut adalah ringkasan keuangan Anda bulan ini.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {summary.per_user.length > 0 ? (
          summary.per_user.map((user: any, index: number) => {
            const colorClasses = [
              { bg: 'bg-blue-100', text: 'text-blue-600' },
              { bg: 'bg-violet-100', text: 'text-violet-600' },
              { bg: 'bg-teal-100', text: 'text-teal-600' },
              { bg: 'bg-rose-100', text: 'text-rose-600' },
              { bg: 'bg-amber-100', text: 'text-amber-600' },
            ];
            const color = colorClasses[index % colorClasses.length];

            return (
              <SummaryCard
                key={user.user_id}
                title={`Pengeluaran ${user.name}`}
                value={`Rp ${formatRupiah(user.total)}`}
                description={`${user.transaction_count} transaksi bulan ini`}
                icon={
                  <div className={`${color.bg} ${color.text} rounded-xl p-2.5`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                }
              />
            )
          })
        ) : (
          <div className="col-span-full">
            <p className="text-slate-500 text-sm">Belum ada data anggota keluarga.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Left Column (Transactions) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Transaksi Terbaru</h2>
                <p className="text-sm text-slate-500 mt-1">Catatan pengeluaran terbaru dari Telegram bot dan OCR struk.</p>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                    <th className="px-6 py-4">TANGGAL</th>
                    <th className="px-6 py-4">ANGGOTA</th>
                    <th className="px-6 py-4">DESKRIPSI</th>
                    <th className="px-6 py-4">SUMBER</th>
                    <th className="px-6 py-4">NOMINAL</th>
                    <th className="px-6 py-4">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        Belum ada transaksi bulan ini.
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((item: any) => (
                      <tr key={item.id} className="table-row-hover group">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                          {formatTanggalSingkat(item.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-slate-900">{item.users?.name || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-700 block truncate max-w-[150px] md:max-w-[200px]" title={item.description}>
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
                          <StatusBadge source={item.source} status="Dikonfirmasi" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Menampilkan {recentTransactions.length} dari {summary.transaction_count}
              </span>
              <div className="flex gap-2">
                <button disabled className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-400 bg-slate-50 cursor-not-allowed">
                  Sebelumnya
                </button>
                <button className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Members & Reports) */}
        <div className="space-y-6">
          {/* Members Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Pengeluaran per Anggota</h3>
            
            <div className="space-y-5">
              {summary.per_user.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Belum ada anggota yang tercatat.</p>
              ) : (
                summary.per_user.map((user: any, index: number) => {
                  const percentage = maxTotal > 0 ? (user.total / maxTotal) * 100 : 0
                  const color = getMemberColor(index)
                  
                  return (
                    <div key={user.user_id}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-slate-700">{user.name}</span>
                        <span className="text-sm font-bold text-slate-900">Rp {formatRupiah(user.total)}</span>
                      </div>
                      <div className={`h-2.5 w-full rounded-full ${color.light} overflow-hidden`}>
                        <div 
                          className={`h-full rounded-full ${color.bar} progress-bar`}
                          style={{ width: `${Math.max(percentage, 2)}%` }} // min 2% so it's visible
                        ></div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Reports Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Laporan</h3>
              <a href="/laporan" className="text-sm font-medium text-violet-600 hover:text-violet-700 hover:underline">
                Lihat Semua
              </a>
            </div>

            <div className="space-y-3">
              {/* Dummy reports for UI layout matching the screenshot */}
              {[
                { title: 'Laporan September 2023', date: 'Dihasilkan 1 Okt' },
                { title: 'Laporan Agustus 2023', date: 'Dihasilkan 1 Sep' }
              ].map((report, i) => (
                <div key={i} className="flex items-center p-3 border border-slate-100 rounded-xl hover:border-violet-200 hover:bg-violet-50/50 transition-colors group cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-violet-700 transition-colors">
                      {report.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{report.date}</p>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-slate-600 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}