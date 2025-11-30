import { NextRequest, NextResponse } from 'next/server';
import { db, validateDatabaseUrl } from '@/db';
import { users, userRoles, roles, rolePermissions, permissions } from '@/db/schema';
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    validateDatabaseUrl();
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact your company administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user roles
    const userRolesData = await db
      .select({
        roleName: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id));

    const userRoleNames = userRolesData.map(r => r.roleName);

    // Get user permissions (via roles)
    const userPermissionsData = await db
      .select({
        permissionName: permissions.name,
      })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, user.id));

    const userPermissionNames = [...new Set(userPermissionsData.map(p => p.permissionName))];

    // Create JWT token
    const token = createToken({
      userId: user.id,
      email: user.email,
      companyId: user.companyId || undefined, // null for platform admins
      roles: userRoleNames,
      permissions: userPermissionNames,
    });

    // Set auth cookie
    await setAuthCookie(token);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        roles: userRoleNames,
        permissions: userPermissionNames,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
