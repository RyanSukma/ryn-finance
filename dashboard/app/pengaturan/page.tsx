'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import Modal from '@/components/Modal'
import { fetchUsers, createUser } from '@/lib/api-client'

export default function PengaturanPage() {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', telegram_id: '' })
  const [formError, setFormError] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const res = await fetchUsers()
      if (res?.success) {
        setUsers(res.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    
    if (!formData.name || !formData.telegram_id) {
      setFormError('Semua kolom wajib diisi')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createUser({
        name: formData.name,
        telegram_id: parseInt(formData.telegram_id, 10),
        is_active: true,
        is_admin: false
      })
      
      if (res?.success) {
        setIsModalOpen(false)
        setFormData({ name: '', telegram_id: '' })
        loadData() // Reload users
      } else {
        setFormError(res?.message || 'Gagal menambahkan anggota')
      }
    } catch (error) {
      console.error("Failed to create user:", error)
      setFormError('Terjadi kesalahan server')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan</h1>
        <p className="text-slate-500 mt-1">Kelola anggota keluarga dan konfigurasi sistem RynFinance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column - User Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Anggota Keluarga (Whitelist)</h3>
                <p className="text-sm text-slate-500 mt-1">Hanya Telegram ID yang terdaftar di sini yang bisa berinteraksi dengan bot.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 bg-violet-50 text-violet-700 hover:bg-violet-100 font-medium rounded-xl text-sm transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Tambah Anggota
              </button>
            </div>
            
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 font-semibold uppercase bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">NAMA</th>
                      <th className="px-6 py-4">TELEGRAM ID</th>
                      <th className="px-6 py-4">STATUS</th>
                      <th className="px-6 py-4">ROLE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Belum ada anggota terdaftar</td>
                      </tr>
                    ) : (
                      users.map((user: any) => (
                        <tr key={user.id} className="table-row-hover group">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-600">
                            {user.telegram_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.is_active ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                Non-aktif
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.is_admin ? (
                              <span className="text-violet-600 font-semibold flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Admin
                              </span>
                            ) : (
                              <span className="text-slate-500">Anggota</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column - System Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Informasi Sistem</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Status Koneksi API</p>
                <div className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 badge-pulse"></span>
                  <span className="text-sm font-medium text-emerald-700">Terhubung</span>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Versi Aplikasi</p>
                <p className="text-sm text-slate-900 font-medium">v1.0.0 (MVP)</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Mode Autentikasi</p>
                <p className="text-sm text-slate-900 font-medium">Dashboard Password</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
              <button 
                onClick={async () => {
                  try {
                    await fetch('/api/auth', { method: 'DELETE' });
                    window.location.href = '/login';
                  } catch(e) {}
                }}
                className="w-full px-4 py-2.5 border border-rose-200 text-rose-600 font-medium rounded-xl hover:bg-rose-50 transition-colors flex items-center justify-center text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Keluar Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Anggota Whitelist"
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="mb-4 bg-rose-50 text-rose-600 text-sm p-3 rounded-xl border border-rose-100">
              {formError}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Panggilan</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Contoh: Ayah, Ibu, Budi"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telegram ID</label>
              <input
                type="number"
                name="telegram_id"
                value={formData.telegram_id}
                onChange={handleChange}
                placeholder="Contoh: 123456789"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-900"
              />
              <p className="text-xs text-slate-500 mt-1">Dapatkan Telegram ID dari bot @userinfobot</p>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 font-medium text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2.5 font-medium text-sm text-white rounded-xl transition-colors flex items-center
                ${isSubmitting ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 btn-press'}
              `}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Anggota'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
