import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const correctPassword = process.env.DASHBOARD_PASSWORD

    if (!correctPassword) {
      return NextResponse.json(
        { message: 'DASHBOARD_PASSWORD belum di-set di .env.local' },
        { status: 500 }
      )
    }

    if (password === correctPassword) {
      // Set session cookie
      const cookieStore = await cookies()
      cookieStore.set('rynfinance-session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/'
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { message: 'Password salah' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('rynfinance-session')
  
  return NextResponse.json({ success: true })
}
