import { NextResponse } from 'next/server'

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
const API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return handleProxy(request, resolvedParams.path)
}

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return handleProxy(request, resolvedParams.path)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  return handleProxy(request, resolvedParams.path)
}

async function handleProxy(request: Request, pathArray: string[]) {
  if (!API_URL || !API_KEY) {
    return NextResponse.json(
      { message: 'Backend URL atau API Key belum diatur.' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  const targetPath = `/api/v1/${pathArray.join('/')}${queryString ? `?${queryString}` : ''}`
  
  try {
    const init: RequestInit = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.text()
      if (body) {
        init.body = body
      }
    }

    const response = await fetch(`${API_URL}${targetPath}`, init)
    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { message: 'Gagal menghubungi backend server.' },
      { status: 500 }
    )
  }
}
