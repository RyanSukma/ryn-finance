import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('rynfinance-session')
  const { pathname } = request.nextUrl

  const isLoginPage = pathname === '/login'
  const isAuthApi = pathname.startsWith('/api/auth')
  const isStaticAsset = pathname.startsWith('/_next') || pathname.startsWith('/favicon')

  // Allow static assets and auth API through
  if (isStaticAsset || isAuthApi) {
    return NextResponse.next()
  }

  // Redirect authenticated users away from login page
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Allow login page through
  if (isLoginPage) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
