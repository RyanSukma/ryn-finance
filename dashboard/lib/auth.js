import { cookies } from 'next/headers'

export async function checkAuth() {
    const cookieStore = await cookies()

    const session =
        cookieStore.get('rynfinance_session') ||
        cookieStore.get('rynfinance-session')

    if (!session || session.value !== 'authenticated') {
        return false
    }

    return true
}