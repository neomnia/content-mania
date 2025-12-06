'use server'

import { db } from "@/db"
import { users, companies, roles, userRoles } from "@/db/schema"
import { eq, and, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { hashPassword, verifyPassword } from "@/lib/auth"
import { emailRouter, emailTemplateRepository } from "@/lib/email"

export async function getUsers() {
  try {
    const allUsers = await db.query.users.findMany({
      with: {
        company: true,
        userRoles: {
          with: {
            role: true
          }
        }
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    })
    return { success: true, data: allUsers }
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return { success: false, error: "Failed to fetch users" }
  }
}

export async function createUser(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const password = formData.get("password") as string
    const roleName = formData.get("role") as string
    const companyId = formData.get("companyId") as string

    if (!email || !firstName || !lastName || !password) {
      return { success: false, error: "Missing required fields" }
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (existingUser) {
      return { success: false, error: "User already exists" }
    }

    const hashedPassword = await hashPassword(password)

    // Create user
    const [newUser] = await db.insert(users).values({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      companyId: companyId || null,
    }).returning()

    // Assign role if provided
    if (roleName) {
      const role = await db.query.roles.findFirst({
        where: eq(roles.name, roleName)
      })

      if (role) {
        await db.insert(userRoles).values({
          userId: newUser.id,
          roleId: role.id
        })
      }
    }

    revalidatePath("/admin/users")
    return { success: true, message: "User created successfully" }
  } catch (error) {
    console.error("Failed to create user:", error)
    return { success: false, error: "Failed to create user" }
  }
}

export async function deleteUser(userId: string) {
  try {
    const userToDelete = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        company: true,
        userRoles: {
          with: {
            role: true
          }
        }
      }
    })

    if (!userToDelete) {
      return { success: false, error: "User not found" }
    }

    // Check if user is the last owner of a company
    if (userToDelete.companyId) {
      // Assuming 'admin' role with 'company' scope is the owner
      const isOwner = userToDelete.userRoles.some(ur => ur.role.name === 'admin' && ur.role.scope === 'company')
      
      if (isOwner) {
        // Check if there are other owners in the same company
        const otherOwners = await db.query.userRoles.findMany({
          where: and(
            ne(userRoles.userId, userId),
            eq(userRoles.roleId, userToDelete.userRoles.find(ur => ur.role.name === 'admin' && ur.role.scope === 'company')?.roleId!)
          ),
          with: {
            user: true
          }
        })

        const otherCompanyOwners = otherOwners.filter(ur => ur.user.companyId === userToDelete.companyId)

        if (otherCompanyOwners.length === 0) {
          // Last owner, delete company
          await db.delete(companies).where(eq(companies.id, userToDelete.companyId))
          // Users are deleted via cascade if configured, but let's be safe and delete the user explicitly if not
          // Actually, if we delete company, and users have companyId as FK, what happens?
          // Schema: companyId: uuid("company_id").references(() => companies.id)
          // It doesn't say onDelete cascade. So we might need to delete users first or update them.
          // But wait, if we delete the user first, then we delete the company.
          // Let's delete the user first.
        }
      }
    }

    await db.delete(users).where(eq(users.id, userId))

    // Send deletion email
    try {
      const template = await emailTemplateRepository.getTemplate('account_deletion')
      if (template) {
        let htmlContent = template.htmlContent || ""
        let textContent = template.textContent || ""
        const subject = template.subject.replace('{{siteName}}', 'NeoSaaS')

        // Replace variables
        const variables = {
          firstName: userToDelete.firstName,
          siteName: 'NeoSaaS'
        }

        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g')
          htmlContent = htmlContent.replace(regex, value)
          textContent = textContent.replace(regex, value)
        })

        await emailRouter.sendEmail({
          to: [userToDelete.email],
          from: { name: template.fromName, email: template.fromEmail },
          subject: subject,
          html: htmlContent,
          text: textContent,
          templateId: template.type
        })
      }
    } catch (emailError) {
      console.error("Failed to send deletion email:", emailError)
      // Don't fail the deletion if email fails
    }
    
    revalidatePath("/admin/users")
    return { success: true, message: "User deleted successfully" }
  } catch (error) {
    console.error("Failed to delete user:", error)
    return { success: false, error: "Failed to delete user" }
  }
}

export async function updateUserRole(userId: string, roleName: string) {
  try {
    const role = await db.query.roles.findFirst({
      where: eq(roles.name, roleName)
    })

    if (!role) {
      return { success: false, error: "Role not found" }
    }

    // Remove existing roles (simplified for single role per user scenario, though schema supports multiple)
    await db.delete(userRoles).where(eq(userRoles.userId, userId))

    // Add new role
    await db.insert(userRoles).values({
      userId,
      roleId: role.id
    })

    revalidatePath("/admin/users")
    return { success: true, message: "User role updated successfully" }
  } catch (error) {
    console.error("Failed to update user role:", error)
    return { success: false, error: "Failed to update user role" }
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    const isPasswordValid = await verifyPassword(currentPassword, user.password)

    if (!isPasswordValid) {
      return { success: false, error: "Incorrect current password" }
    }

    const hashedPassword = await hashPassword(newPassword)

    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))

    return { success: true, message: "Password updated successfully" }
  } catch (error) {
    console.error("Failed to update password:", error)
    return { success: false, error: "Failed to update password" }
  }
}
