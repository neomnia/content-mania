import { NextRequest, NextResponse } from 'next/server';
import { db, validateDatabaseUrl } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

/**
 * PUT /api/profile
 * Update current user's profile information
 */
export async function PUT(request: NextRequest) {
  try {
    validateDatabaseUrl();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, address, city, postalCode, country } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Update user profile
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName,
        lastName,
        phone: phone || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.userId))
      .returning();

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating profile' },
      { status: 500 }
    );
  }
}
