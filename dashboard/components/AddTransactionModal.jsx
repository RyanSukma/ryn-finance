'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import { fetchUsers, createTransaction } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

export default function AddTransactionModal({ isOpen, onClose, onSuccess }) {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    user_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (isOpen) {
      loadUsers()
      // Reset form
      setFormData(prev => ({
        ...prev,
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      }))
    }
  }, [isOpen])

  const loadUsers = async () => {
    try {
      const res = await fetchUsers()
      if (res?.success) {
        setUsers(res.data || [])
        if (res.data && res.data.length > 0 && !formData.user_id) {
          setFormData(prev => ({ ...prev, user_id: res.data[0].id }))
        }
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.user_id || !formData.amount || !formData.description || !formData.date) {
      alert('Mohon lengkapi semua data')
      return
    }

    setIsLoading(true)
    try {
      // Combine date with current time to maintain consistent format
      const now = new Date()
      const timeStr = now.toISOString().split('T')[1]
      const created_at = `${formData.date}T${timeStr}`
      
      const payload = {
        user_id: formData.user_id,
        amount: parseInt(formData.amount),
        description: formData.description,
        source: 'manual',
        created_at
      }

      const res = await createTransaction(payload)
      if (res?.success) {
        onClose()
        if (onSuccess) onSuccess()
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to add transaction:', error)
      alert('Gagal menambahkan transaksi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Transaksi Manual">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Anggota</label>
          <select
            name="user_id"
            value={formData.user_id}
            onChange={handleChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900"
            required
          >
            <option value="" disabled>Pilih Anggota</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Contoh: Bensin, Makan Siang"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Contoh: 50000"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900"
            required
            min="0"
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 font-medium text-white rounded-xl transition-colors flex items-center
              ${isLoading ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 btn-press'}
            `}
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
