'use client'

import { useState, useEffect } from 'react'
import StatusBadge from '@/components/StatusBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { fetchTransactions, fetchUsers, deleteTransaction } from '@/lib/api-client'
import { formatRupiah, formatTanggalLengkap, getSourceLabel } from '@/lib/format'

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    user_id: '',
    date_from: '',
    date_to: ''
  })
  
  // Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [trxRes, usersRes] = await Promise.all([
          fetchTransactions(filters),
          fetchUsers()
        ])
        
        if (trxRes?.success) setTransactions(trxRes.data || [])
        if (usersRes?.success) setUsers(usersRes.data || [])
      } catch (error) {
        console.error("Failed to fetch riwayat data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, []) // Initial load only

  // Apply filters manually when search is clicked
  const handleApplyFilters = async () => {
    setIsLoading(true)
    try {
      const res = await fetchTransactions(filters)
      if (res?.success) setTransactions(res.data || [])
    } catch (error) {
      console.error("Failed to filter transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const confirmDelete = (trx: any) => {
    setTransactionToDelete(trx)
    setIsDeleteModalOpen(true)
  }

  const executeDelete = async () => {
    if (!transactionToDelete) return
    
    setIsDeleting(true)
    try {
      const res = await deleteTransaction(transactionToDelete.id)
      if (res?.success) {
        // Remove from local state
        setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id))
        setIsDeleteModalOpen(false)
        setTransactionToDelete(null)
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error)
      alert("Gagal menghapus transaksi")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Riwayat Transaksi</h1>
        <p className="text-slate-500 mt-1">Daftar lengkap transaksi keluarga beserta filternya.</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Anggota</label>
            <select
              name="user_id"
              value={filters.user_id}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900"
            >
              <option value="">Semua Anggota</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Dari Tanggal</label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Sampai Tanggal</label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900"
            />
          </div>
          
          <div>
            <button
              onClick={handleApplyFilters}
              disabled={isLoading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl px-4 py-2.5 text-sm transition-colors shadow-sm flex items-center justify-center btn-press"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : transactions.length === 0 ? (
          <div className="p-12">
            <EmptyState 
              title="Tidak ada transaksi" 
              description="Belum ada data transaksi yang sesuai dengan filter Anda."
              icon={null}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 font-semibold uppercase bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">TANGGAL</th>
                  <th className="px-6 py-4">ANGGOTA</th>
                  <th className="px-6 py-4">DESKRIPSI</th>
                  <th className="px-6 py-4">SUMBER</th>
                  <th className="px-6 py-4">NOMINAL</th>
                  <th className="px-6 py-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((item: any) => (
                  <tr key={item.id} className="table-row-hover group">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {formatTanggalLengkap(item.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-slate-900">{item.users?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-800">{item.description}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge source={item.source} status="" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">
                        Rp {formatRupiah(item.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => confirmDelete(item)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100"
                        title="Hapus Transaksi"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!isLoading && transactions.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Menampilkan <span className="font-medium text-slate-900">{transactions.length}</span> transaksi
            </span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus"
      >
        <div className="mb-6">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus transaksi <strong>{transactionToDelete?.description}</strong> senilai <strong className="text-slate-900">Rp {transactionToDelete && formatRupiah(transactionToDelete.amount)}</strong>?
          </p>
          <p className="text-sm text-slate-500 mt-2">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            className="px-4 py-2 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={executeDelete}
            disabled={isDeleting}
            className={`px-4 py-2 font-medium text-white rounded-xl transition-colors flex items-center
              ${isDeleting ? 'bg-rose-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 btn-press'}
            `}
          >
            {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
