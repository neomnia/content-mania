import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Try to get full user profile from database
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.userId)
    })

    if (dbUser) {
      return NextResponse.json({
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        phone: dbUser.phone,
        company: dbUser.companyId, // Or fetch company name if needed
        avatarUrl: dbUser.avatarUrl,
      })
    }

    // Fallback to JWT data if user not in DB
    return NextResponse.json({
      id: user.userId,
      email: user.email,
      firstName: '',
      lastName: '',
      phone: '',
      company: user.companyId,
      avatarUrl: '',
    })
  } catch (error) {
    console.error('[API /user/profile] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
