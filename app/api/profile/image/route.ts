import { NextRequest, NextResponse } from 'next/server';
import { db, validateDatabaseUrl } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/profile/image
 * Upload user profile image
 */
export async function POST(request: NextRequest) {
  try {
    validateDatabaseUrl();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const extension = file.name.split('.').pop();
    const filename = `${currentUser.userId}-${Date.now()}.${extension}`;
    const filepath = join(process.cwd(), 'public', 'profiles', filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Get current user to check for old image
    const user = await db.query.users.findFirst({
      where: eq(users.id, currentUser.userId),
    });

    // Delete old profile image if exists
    if (user?.profileImage) {
      const oldImagePath = join(process.cwd(), 'public', user.profileImage);
      if (existsSync(oldImagePath)) {
        await unlink(oldImagePath).catch(err =>
          console.error('Error deleting old image:', err)
        );
      }
    }

    // Update user with new image path
    const imagePath = `/profiles/${filename}`;
    const [updatedUser] = await db
      .update(users)
      .set({
        profileImage: imagePath,
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.userId))
      .returning();

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Profile image uploaded successfully',
      imagePath,
    });
  } catch (error) {
    console.error('Upload image error:', error);
    return NextResponse.json(
      { error: 'An error occurred while uploading image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/image
 * Delete user profile image
 */
export async function DELETE() {
  try {
    validateDatabaseUrl();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get current user
    const user = await db.query.users.findFirst({
      where: eq(users.id, currentUser.userId),
    });

    if (!user?.profileImage) {
      return NextResponse.json(
        { error: 'No profile image to delete' },
        { status: 400 }
      );
    }

    // Delete image file
    const imagePath = join(process.cwd(), 'public', user.profileImage);
    if (existsSync(imagePath)) {
      await unlink(imagePath).catch(err =>
        console.error('Error deleting image:', err)
      );
    }

    // Update user to remove image path
    const [updatedUser] = await db
      .update(users)
      .set({
        profileImage: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.userId))
      .returning();

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Profile image deleted successfully',
    });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting image' },
      { status: 500 }
    );
  }
}
