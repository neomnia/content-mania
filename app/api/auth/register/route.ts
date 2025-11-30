import { type NextRequest, NextResponse } from "next/server"
import { db, validateDatabaseUrl } from "@/db"
import { users, companies, roles, userRoles } from "@/db/schema"
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Registration API called")

    try {
      validateDatabaseUrl()
      console.log("[v0] Database URL validated successfully")
    } catch (dbError) {
      console.error("[v0] Database URL validation failed:", dbError)
      return NextResponse.json({ error: "Database configuration error. Please contact support." }, { status: 500 })
    }

    const body = await request.json()
    const { email, password } = body

    console.log("[v0] Registration request for email:", email)

    // Validate required fields
    if (!email || !password) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing required fields: email, password" }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      console.log("[v0] Password too short")
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Check if user already exists
    try {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      })

      if (existingUser) {
        console.log("[v0] User already exists")
        return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
      }
      console.log("[v0] User does not exist, proceeding with registration")
    } catch (dbError) {
      console.error("[v0] Database query error checking existing user:", dbError)
      return NextResponse.json({ error: "Database error. Please try again later." }, { status: 500 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)
    console.log("[v0] Password hashed successfully")

    // Extract name from email temporarily
    const emailPrefix = email.split("@")[0]
    const firstName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
    const lastName = "User"

    let company
    try {
      ;[company] = await db
        .insert(companies)
        .values({
          name: `${firstName}'s Company`,
          email: email,
        })
        .returning()
      console.log("[v0] Company created successfully:", company.id)
    } catch (dbError) {
      console.error("[v0] Error creating company:", dbError)
      return NextResponse.json({ error: "Failed to create company. Please try again." }, { status: 500 })
    }

    let newUser
    try {
      ;[newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          companyId: company.id,
          isActive: true,
        })
        .returning()
      console.log("[v0] User created successfully:", newUser.id)
    } catch (dbError) {
      console.error("[v0] Error creating user:", dbError)
      return NextResponse.json({ error: "Failed to create user account. Please try again." }, { status: 500 })
    }

    // Assign writer role (full company access)
    let writerRole
    try {
      writerRole = await db.query.roles.findFirst({
        where: eq(roles.name, "writer"),
      })

      if (!writerRole) {
        console.log("[v0] Writer role not found in database")
        // Don't fail the registration if role assignment fails
        console.log("[v0] Continuing without role assignment")
      } else {
        console.log("[v0] Writer role found:", writerRole.id)
      }
    } catch (dbError) {
      console.error("[v0] Error with writer role:", dbError)
      // Don't fail the registration if role assignment fails
      console.log("[v0] Continuing without role assignment")
    }

    if (writerRole) {
      try {
        await db.insert(userRoles).values({
          userId: newUser.id,
          roleId: writerRole.id,
        })
        console.log("[v0] Writer role assigned to user")
      } catch (dbError) {
        console.error("[v0] Error assigning role to user:", dbError)
        // Don't fail the registration
        console.log("[v0] Continuing without role assignment")
      }
    }

    // Create JWT token
    const token = createToken({
      userId: newUser.id,
      email: newUser.email,
      companyId: newUser.companyId || undefined,
      roles: writerRole ? ["writer"] : [],
      permissions: writerRole ? ["read", "write", "invite", "manage_users"] : [],
    })
    console.log("[v0] JWT token created")

    // Set auth cookie
    await setAuthCookie(token)
    console.log("[v0] Auth cookie set")

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
        },
        roles: writerRole ? ["writer"] : [],
        permissions: writerRole ? ["read", "write", "invite", "manage_users"] : [],
      },
      message: "Account created successfully. Please complete your profile.",
    })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    console.error("[v0] Error name:", error instanceof Error ? error.name : "Unknown")
    console.error("[v0] Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      { error: "An unexpected error occurred during registration. Please try again." },
      { status: 500 },
    )
  }
}
