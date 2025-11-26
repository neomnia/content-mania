import { pgTable, text, timestamp, uuid, boolean, primaryKey } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// =============================================================================
// BACKEND ADMINS (SaaS Platform Administrators)
// =============================================================================

/**
 * SaaS Admins - Administrators who manage the platform itself
 * These users have access to the backend/admin panel
 */
export const saasAdmins = pgTable("saas_admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed with bcrypt
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// =============================================================================
// FRONTEND USERS (SaaS Customers)
// =============================================================================

/**
 * Companies - Customer organizations using the SaaS platform
 */
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  city: text("city"),
  address: text("address"),
  vatNumber: text("vat_number"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

/**
 * Users - Frontend users (customers) belonging to companies
 * The first user created for a company becomes the owner
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed with bcrypt
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country"),
  profileImage: text("profile_image"), // Path to profile image in public/profiles
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  isOwner: boolean("is_owner").default(false).notNull(), // Company owner (creator)
  isActive: boolean("is_active").default(true).notNull(), // Can be deactivated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// =============================================================================
// ROLES & PERMISSIONS SYSTEM
// =============================================================================

/**
 * Roles - Predefined roles for users
 * - owner: Full access, can invite and manage all users
 * - editor: Can read and write data
 * - viewer: Read-only access
 */
export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(), // 'owner', 'editor', 'viewer'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Permissions - Granular permissions that can be assigned to roles
 * - read: View data
 * - write: Create/update data
 * - invite: Invite new users to company
 * - manage_users: Manage users within company (activate/deactivate, change roles)
 */
export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(), // 'read', 'write', 'invite', 'manage_users'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * User Roles - Many-to-many relationship between users and roles
 * A user can have multiple roles within their company
 */
export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
  }),
)

/**
 * Role Permissions - Many-to-many relationship between roles and permissions
 * Defines what permissions each role has
 */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    permissionId: uuid("permission_id")
      .references(() => permissions.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  }),
)

// =============================================================================
// USER INVITATIONS
// =============================================================================

/**
 * User Invitations - Track pending invitations
 * Invitations are sent and must be accepted before user is created
 */
export const userInvitations = pgTable("user_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  companyId: uuid("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  roleId: uuid("role_id")
    .references(() => roles.id)
    .notNull(),
  invitedBy: uuid("invited_by").references(() => users.id), // Who sent the invitation
  token: text("token").notNull().unique(), // Unique token for accepting invitation
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'expired'
  expiresAt: timestamp("expires_at").notNull(), // Invitations expire after 7 days
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
})

// =============================================================================
// RELATIONS
// =============================================================================

export const saasAdminsRelations = relations(saasAdmins, () => ({}))

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  userRoles: many(userRoles),
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}))

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}))

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}))

export const userInvitationsRelations = relations(userInvitations, ({ one }) => ({
  company: one(companies, {
    fields: [userInvitations.companyId],
    references: [companies.id],
  }),
  role: one(roles, {
    fields: [userInvitations.roleId],
    references: [roles.id],
  }),
  invitedByUser: one(users, {
    fields: [userInvitations.invitedBy],
    references: [users.id],
  }),
}))

// =============================================================================
// TYPES
// =============================================================================

export type SaasAdmin = typeof saasAdmins.$inferSelect
export type NewSaasAdmin = typeof saasAdmins.$inferInsert

export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert

export type Permission = typeof permissions.$inferSelect
export type NewPermission = typeof permissions.$inferInsert

export type UserRole = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert

export type RolePermission = typeof rolePermissions.$inferSelect
export type NewRolePermission = typeof rolePermissions.$inferInsert

export type UserInvitation = typeof userInvitations.$inferSelect
export type NewUserInvitation = typeof userInvitations.$inferInsert
