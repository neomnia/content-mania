import { type NextRequest, NextResponse } from "next/server"
import { db, validateDatabaseUrl } from "@/db"
import { users, userRoles, roles, rolePermissions, permissions, userInvitations } from "@/db/schema"
import { getCurrentUser } from "@/lib/auth"
import { eq, and } from "drizzle-orm"
import crypto from "crypto"

/**
 * POST /api/users/invite
 * Invite a new user to the company
 */
export async function POST(request: NextRequest) {
  try {
    validateDatabaseUrl()
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const hasInvitePermission = await db
      .select({ permissionName: permissions.name })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(and(eq(userRoles.userId, currentUser.userId), eq(permissions.name, "invite")))
      .limit(1)

    if (hasInvitePermission.length === 0) {
      return NextResponse.json({ error: "You do not have permission to invite users" }, { status: 403 })
    }

    const body = await request.json()
    const { email, role: roleName } = body

    // Validate fields
    if (!email || !roleName) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 })
    }

    // Validate role
    if (!["owner", "editor", "viewer"].includes(roleName)) {
      return NextResponse.json({ error: "Invalid role. Must be owner, editor, or viewer" }, { status: 400 })
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
    }

    const roleData = await db.query.roles.findFirst({
      where: eq(roles.name, roleName),
    })

    if (!roleData) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    const [invitation] = await db
      .insert(userInvitations)
      .values({
        email,
        companyId: currentUser.companyId,
        roleId: roleData.id,
        invitedBy: currentUser.userId,
        token,
        status: "pending",
        expiresAt,
      })
      .returning()

    console.log(`[v0] Invitation created for ${email} with token: ${token}`)

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
      message: "Invitation sent successfully",
    })
  } catch (error) {
    console.error("Invite user error:", error)
    return NextResponse.json({ error: "An error occurred while inviting the user" }, { status: 500 })
  }
}
