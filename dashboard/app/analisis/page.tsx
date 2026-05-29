'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell
} from 'recharts'
import LoadingSpinner from '@/components/LoadingSpinner'
import { fetchSummary } from '@/lib/api-client'
import { formatRupiah, getChartColor } from '@/lib/format'

// Helper to format currency for chart axis
const formatYAxis = (tickItem: number) => {
  if (tickItem === 0) return '0'
  return `${(tickItem / 1000).toFixed(0)}k`
}

export default function AnalisisPage() {
  const [summaryData, setSummaryData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchSummary()
        if (res?.success) {
          setSummaryData(res.data)
        }
      } catch (error) {
        console.error("Failed to fetch analytics data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])

  if (isLoading) {
    return <LoadingSpinner />
  }

  // Pre-process data for charts
  const users = summaryData?.per_user || []
  
  // 1. Data for Bar Chart (Total per Member)
  const memberComparisonData = users.map((u: any) => ({
    name: u.name,
    total: u.total,
    count: u.transaction_count
  }))

  // Generate some dummy trend data since backend only provides current month summary
  // In a real app, we would fetch historical data
  const dummyTrendData = [
    { name: 'Jan', Budi: 400000, Siti: 240000, Ayah: 2400000 },
    { name: 'Feb', Budi: 300000, Siti: 139000, Ayah: 2210000 },
    { name: 'Mar', Budi: 200000, Siti: 980000, Ayah: 2290000 },
    { name: 'Apr', Budi: 278000, Siti: 390000, Ayah: 2000000 },
    { name: 'Mei', Budi: 189000, Siti: 480000, Ayah: 2181000 },
    { name: 'Jun', Budi: 239000, Siti: 380000, Ayah: 2500000 },
  ]

  // Stats calculation
  const maxSpender = [...users].sort((a, b) => b.total - a.total)[0]
  const avgTransaction = summaryData?.transaction_count > 0 
    ? Math.round((summaryData?.total_family || 0) / summaryData.transaction_count) 
    : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analisis Keuangan</h1>
        <p className="text-slate-500 mt-1">Grafik dan tren pengeluaran keluarga Anda.</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Pengeluaran Terbesar</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900">{maxSpender?.name || '-'}</p>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Rp {formatRupiah(maxSpender?.total || 0)} bulan ini
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Rata-rata per Transaksi</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900">Rp {formatRupiah(avgTransaction)}</p>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Berdasarkan {summaryData?.transaction_count || 0} transaksi
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Proyeksi Bulan Ini</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900">Rp {formatRupiah((summaryData?.total_family || 0) * 1.2)}</p>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Estimasi akhir bulan
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Perbandingan Anggota</h3>
            <p className="text-sm text-slate-500">Total pengeluaran bulan berjalan</p>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={memberComparisonData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip 
                  formatter={(value) => [`Rp ${formatRupiah(value)}`, 'Total']}
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {
                    memberComparisonData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Tren Pengeluaran</h3>
            <p className="text-sm text-slate-500">Data historis 6 bulan terakhir (Simulasi)</p>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dummyTrendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip 
                  formatter={(value) => [`Rp ${formatRupiah(value)}`]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="Ayah" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Budi" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Siti" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Detailed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Statistik Anggota</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 font-semibold uppercase bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">ANGGOTA</th>
                <th className="px-6 py-4">JML TRANSAKSI</th>
                <th className="px-6 py-4">TOTAL</th>
                <th className="px-6 py-4">RATA-RATA / TRX</th>
                <th className="px-6 py-4">% DARI TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u: any, i: number) => {
                const avg = u.transaction_count > 0 ? u.total / u.transaction_count : 0
                const percent = summaryData && summaryData.total_family > 0 ? (u.total / summaryData.total_family) * 100 : 0
                
                return (
                  <tr key={u.user_id} className="table-row-hover">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: getChartColor(i) }}></div>
                      {u.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {u.transaction_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                      Rp {formatRupiah(u.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      Rp {formatRupiah(Math.round(avg))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {percent.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
