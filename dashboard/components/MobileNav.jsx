'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { name: 'Overview', href: '/' },
  { name: 'Riwayat Transaksi', href: '/riwayat' },
  { name: 'Analisis', href: '/analisis' },
  { name: 'Laporan', href: '/laporan' },
  { name: 'Pengaturan', href: '/pengaturan' }
]

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="md:hidden">
      {/* Mobile Top Header (replaces standard TopBar on small screens if needed, or works alongside it) */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between shadow-sm relative z-30">
        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
          RynFinance
        </h1>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-500 rounded-lg hover:bg-slate-100"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          
          <div className="relative flex flex-col w-64 max-w-sm h-full bg-white shadow-xl animate-slide-in-left">
            <div className="px-6 py-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Menu</h2>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      isActive 
                        ? 'bg-violet-50 text-violet-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            
            <div className="p-4 border-t border-slate-100">
              <button className="w-full px-4 py-2 text-rose-600 font-medium text-left hover:bg-rose-50 rounded-xl transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
