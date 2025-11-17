import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'
  
  if (isMaintenanceMode && path !== '/(errors)/maintenance') {
    return NextResponse.redirect(new URL('/(errors)/maintenance', request.url))
  }

  // If we're in maintenance page but maintenance mode is off, redirect to home
  if (!isMaintenanceMode && path === '/(errors)/maintenance') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
