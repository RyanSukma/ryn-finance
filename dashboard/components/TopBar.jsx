'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import AddTransactionModal from './AddTransactionModal'

export default function TopBar() {
  const router = useRouter()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="h-[72px] bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex-1 flex items-center max-w-xl">
        {/* Search */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 transition-shadow placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center ml-6 space-x-3">
        {/* Add Transaction Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm mr-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Manual
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors relative badge-pulse">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Help */}
        <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-slate-200 mx-2"></div>

        {/* User Dropdown Trigger */}
        <div className="relative group">
          <button className="flex items-center focus:outline-none">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-200">
              <img src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff" alt="User avatar" className="w-full h-full object-cover" />
            </div>
          </button>
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-900">Admin Account</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-slate-50 flex items-center transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => {
          // You could trigger a global refresh or state update here if needed
          // router.refresh() is already called in the modal
        }}
      />
    </header>
  )
}
