import './globals.css'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import MobileNav from '@/components/MobileNav'

export const metadata = {
  title: 'RynFinance Dashboard',
  description: 'Dashboard rekap keuangan RynFinance modern'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="bg-[#F8FAFC] text-slate-900">
        {/* We need to handle login page layout separately in its own file using Next.js route groups if needed, 
            but for MVP we'll conditionally hide sidebar/topbar if it's the login route. Since we can't easily 
            access pathname in Server Component layout, we'll use a client wrapper for the main layout. */}
        <div className="flex h-screen overflow-hidden">
          {/* Desktop Sidebar */}
          <Sidebar />
          
          {/* Main content wrapper */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <TopBar />
            
            {/* Mobile Navigation */}
            <MobileNav />
            
            <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
              <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}