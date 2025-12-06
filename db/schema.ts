import { pgTable, text, timestamp, uuid, boolean, primaryKey, integer, jsonb, varchar } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// =============================================================================
// USERS - Unified User System (Customers and Admins)
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
  zipCode: text("zip_code"),
  siret: text("siret"),
  vatNumber: text("vat_number"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

/**
 * Users - Unified user system for both customers and platform administrators
 * - Company users (customers): Have a companyId and company-level roles (reader, writer)
 * - Platform administrators: No companyId, have platform-level roles (admin, super_admin)
 * - A user can transition from customer to admin by receiving admin roles
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
  position: text("position"),
  profileImage: text("profile_image"), // Path to profile image in public/profiles
  companyId: uuid("company_id").references(() => companies.id), // Nullable - platform admins don't belong to a company
  isActive: boolean("is_active").default(true).notNull(), // Can be deactivated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// =============================================================================
// ROLES & PERMISSIONS SYSTEM
// =============================================================================

/**
 * Roles - Hierarchical role system for both company and platform levels
 *
 * COMPANY SCOPE (users within a company):
 * - reader: Read-only access to company data
 * - writer: Read and write access to company data
 *
 * PLATFORM SCOPE (platform administrators):
 * - admin: Can manage platform features, companies, and users
 * - super_admin: Full platform access, can manage other admins
 */
export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(), // 'reader', 'writer', 'admin', 'super_admin'
  scope: text("scope").notNull(), // 'company' or 'platform'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Permissions - Granular permissions assigned to roles
 *
 * COMPANY PERMISSIONS (for reader, writer roles):
 * - read: View company data
 * - write: Create/update company data
 * - invite: Invite new users to company
 * - manage_users: Manage users within company (activate/deactivate, change roles)
 *
 * PLATFORM PERMISSIONS (for admin, super_admin roles):
 * - manage_platform: Manage platform settings and features
 * - manage_companies: View and manage all companies
 * - manage_all_users: Manage any user on the platform
 * - manage_admins: Create and manage other administrators (super_admin only)
 * - manage_emails: Configure email providers and templates
 * - view_analytics: Access platform-wide analytics and statistics
 */
export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  scope: text("scope").notNull(), // 'company' or 'platform'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * User Roles - Many-to-many relationship between users and roles
 * A user can have multiple roles across both company and platform scopes:
 * - Company-scoped roles (reader, writer): User manages data within their company
 * - Platform-scoped roles (admin, super_admin): User manages the entire platform
 * - A user can be both a company member AND a platform admin simultaneously
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

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
}))

// Note: usersRelations is defined after orders table to include orders relationship

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
// EMAIL SYSTEM - Multi-Provider Transactional Emails
// =============================================================================

/**
 * Email Provider Configs - Store encrypted credentials for email providers
 * Supports AWS SES, Resend, and Scaleway TEM
 */
export const emailProviderConfigs = pgTable("email_provider_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: text("provider").notNull().unique(), // 'aws-ses', 'resend', 'scaleway-tem'
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  config: jsonb("config").notNull(), // Encrypted provider-specific configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

/**
 * Email Templates - Store email templates for different types
 */
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull().unique(), // 'register', 'invite', 'delete', 'order', etc.
  name: text("name").notNull(),
  description: text("description"),
  fromName: text("from_name").notNull(),
  fromEmail: text("from_email").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content"),
  textContent: text("text_content"),
  isActive: boolean("is_active").default(true).notNull(),
  provider: text("provider"), // Override default provider for this template
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

/**
 * Email History - Track all sent emails
 */
export const emailHistory = pgTable("email_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: text("provider").notNull(), // Which provider was used
  templateType: text("template_type"), // Template type if template was used
  messageId: text("message_id"), // Provider-specific message ID
  from: text("from").notNull(),
  to: jsonb("to").notNull(), // Array of recipient emails
  cc: jsonb("cc"), // Array of CC emails
  bcc: jsonb("bcc"), // Array of BCC emails
  subject: text("subject").notNull(),
  htmlContent: text("html_content"),
  textContent: text("text_content"),
  status: text("status").notNull().default("pending"), // 'pending', 'sent', 'delivered', 'failed', 'bounced'
  errorMessage: text("error_message"),
  tags: jsonb("tags"), // Array of tags
  metadata: jsonb("metadata"), // Additional metadata (variables used, etc.)
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

/**
 * Email Events - Track email events from webhooks (opens, clicks, bounces, etc.)
 */
export const emailEvents = pgTable("email_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  emailHistoryId: uuid("email_history_id").references(() => emailHistory.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  messageId: text("message_id"),
  eventType: text("event_type").notNull(), // 'opened', 'clicked', 'bounced', 'complained', 'delivered'
  eventData: jsonb("event_data"), // Raw webhook data
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Email Statistics - Aggregated statistics by day
 */
export const emailStatistics = pgTable("email_statistics", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull(),
  provider: text("provider").notNull(),
  totalSent: integer("total_sent").default(0).notNull(),
  totalDelivered: integer("total_delivered").default(0).notNull(),
  totalFailed: integer("total_failed").default(0).notNull(),
  totalBounced: integer("total_bounced").default(0).notNull(),
  totalOpened: integer("total_opened").default(0).notNull(),
  totalClicked: integer("total_clicked").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Email Relations
export const emailTemplatesRelations = relations(emailTemplates, () => ({}))

export const emailHistoryRelations = relations(emailHistory, ({ many, one }) => ({
  events: many(emailEvents),
  template: one(emailTemplates, {
    fields: [emailHistory.templateType],
    references: [emailTemplates.type],
  }),
}))

export const emailEventsRelations = relations(emailEvents, ({ one }) => ({
  emailHistory: one(emailHistory, {
    fields: [emailEvents.emailHistoryId],
    references: [emailHistory.id],
  }),
}))

// =============================================================================
// SERVICE API CONFIGURATIONS - Third-Party Service Integration
// =============================================================================

/**
 * Service API Configs - Centralized storage for third-party service API credentials
 * Supports: Stripe, PayPal, Scaleway (Object Storage, Functions, etc.), Resend, AWS (S3, SES, etc.)
 * All credentials are encrypted using AES-256-GCM before storage
 */
export const serviceApiConfigs = pgTable("service_api_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  serviceName: text("service_name").notNull(), // 'stripe', 'paypal', 'scaleway', 'resend', 'aws'
  serviceType: text("service_type").notNull(), // 'payment', 'email', 'storage', 'compute', etc.
  environment: text("environment").notNull().default("production"), // 'production', 'test', 'sandbox'
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(), // Default config for this service type
  config: jsonb("config").notNull(), // Encrypted service-specific configuration
  metadata: jsonb("metadata"), // Additional service metadata (region, account info, etc.)
  lastTestedAt: timestamp("last_tested_at"), // Last successful connection test
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

/**
 * Service API Usage - Track API calls to third-party services
 */
export const serviceApiUsage = pgTable("service_api_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  configId: uuid("config_id")
    .notNull()
    .references(() => serviceApiConfigs.id, { onDelete: "cascade" }),
  serviceName: text("service_name").notNull(),
  operation: varchar("operation", { length: 255 }).notNull(), // 'create_payment', 'send_email', 'upload_file', etc.
  status: text("status").notNull(), // 'success', 'failed', 'timeout'
  statusCode: varchar("status_code", { length: 10 }), // HTTP status or service-specific code
  requestData: jsonb("request_data"), // Sanitized request data (no sensitive info)
  responseData: jsonb("response_data"), // Sanitized response data
  errorMessage: text("error_message"),
  responseTime: integer("response_time"), // Response time in milliseconds
  costEstimate: integer("cost_estimate"), // Estimated cost in cents (if applicable)
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Service API Relations
export const serviceApiConfigsRelations = relations(serviceApiConfigs, ({ many }) => ({
  usage: many(serviceApiUsage),
}))

export const serviceApiUsageRelations = relations(serviceApiUsage, ({ one }) => ({
  config: one(serviceApiConfigs, {
    fields: [serviceApiUsage.configId],
    references: [serviceApiConfigs.id],
  }),
}))

// =============================================================================
// USER API KEYS - Application API Access Management
// =============================================================================

/**
 * User API Keys - API keys for users to access the application's API
 * These are different from provider API keys (AWS, Scaleway, etc.)
 * Format: sk_live_... or sk_test_...
 */
export const userApiKeys = pgTable("user_api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(), // SHA-256 hash
  keyPrefix: varchar("key_prefix", { length: 10 }).notNull(), // Display prefix (e.g., "sk_live_abc")
  permissions: jsonb("permissions").$type<string[]>().default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

/**
 * User API Key Usage - Track API key usage for analytics and security
 */
export const userApiKeyUsage = pgTable("user_api_key_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  apiKeyId: uuid("api_key_id")
    .notNull()
    .references(() => userApiKeys.id, { onDelete: "cascade" }),
  endpoint: varchar("endpoint", { length: 500 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: varchar("status_code", { length: 3 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  responseTime: varchar("response_time", { length: 50 }), // in ms
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// User API Keys Relations
export const userApiKeysRelations = relations(userApiKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [userApiKeys.userId],
    references: [users.id],
  }),
  usage: many(userApiKeyUsage),
}))

export const userApiKeyUsageRelations = relations(userApiKeyUsage, ({ one }) => ({
  apiKey: one(userApiKeys, {
    fields: [userApiKeyUsage.apiKeyId],
    references: [userApiKeys.id],
  }),
}))

// =============================================================================
// ORDERS & PURCHASES - E-commerce System
// =============================================================================

/**
 * Orders - Customer orders for modules, plans, and services
 * Linked to users table (not companies) for individual purchases
 */
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(), // e.g., "ORD-2024-001234"
  status: text("status").notNull().default("pending"), // pending, processing, completed, cancelled, refunded
  totalAmount: integer("total_amount").notNull(), // Amount in cents (e.g., 29900 for $299.00)
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  paymentMethod: varchar("payment_method", { length: 50 }), // stripe, paypal, bank_transfer, etc.
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed, refunded
  paymentIntentId: varchar("payment_intent_id", { length: 255 }), // Stripe/PayPal transaction ID
  paidAt: timestamp("paid_at"),
  notes: text("notes"), // Customer notes or admin notes
  metadata: jsonb("metadata"), // Additional data (delivery details, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

/**
 * Order Items - Individual items within an order
 * Supports modules, plans, consulting hours, or custom products
 */
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  itemType: varchar("item_type", { length: 50 }).notNull(), // 'module', 'plan', 'consulting', 'custom'
  itemId: varchar("item_id", { length: 100 }), // Reference to module/plan ID (if applicable)
  itemName: varchar("item_name", { length: 255 }).notNull(), // Display name
  itemDescription: text("item_description"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(), // Price per unit in cents
  totalPrice: integer("total_price").notNull(), // quantity * unitPrice in cents
  deliveryTime: varchar("delivery_time", { length: 100 }), // e.g., "48 hours", "2-hour session"
  deliveryStatus: text("delivery_status").default("pending"), // pending, in_progress, delivered, cancelled
  deliveredAt: timestamp("delivered_at"),
  metadata: jsonb("metadata"), // Additional item-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Orders Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  userRoles: many(userRoles),
  orders: many(orders), // User's purchase history
}))

// =============================================================================
// SYSTEM LOGS - Generic System-wide Logging
// =============================================================================

/**
 * System Logs - Generic system-wide logging for all events
 * Categories: 'auth', 'email', 'payment', 'system', 'user', 'admin', etc.
 * Levels: 'info', 'warning', 'error', 'critical'
 */
export const systemLogs = pgTable("system_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: text("category").notNull(),
  level: text("level").notNull().default("info"),
  message: text("message").notNull(),
  metadata: jsonb("metadata"), // Additional context (JSON)
  userId: uuid("user_id").references(() => users.id), // Optional: who triggered the event
  resourceId: text("resource_id"), // Optional: ID of the related resource (e.g., order ID, email ID)
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const systemLogsRelations = relations(systemLogs, ({ one }) => ({
  user: one(users, {
    fields: [systemLogs.userId],
    references: [users.id],
  }),
}))

// =============================================================================
// PAGE PERMISSIONS - Dynamic Page Access Control
// =============================================================================

/**
 * Page Permissions - Dynamic page access control
 */
export const pagePermissions = pgTable("page_permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  path: text("path").notNull().unique(), // e.g., "/dashboard", "/admin"
  name: text("name").notNull(), // Display name
  access: text("access").notNull().default("public"), // 'public', 'user', 'admin', 'super_admin'
  group: text("group").notNull(), // Grouping for UI
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// =============================================================================
// PLATFORM CONFIGURATION
// =============================================================================

/**
 * Platform Configuration - Key-value store for system settings
 */
export const platformConfig = pgTable("platform_config", {
  key: text("key").primaryKey(), // e.g., 'site_name', 'logo', 'auth_enabled'
  value: text("value"), // Stored value (can be JSON)
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// =============================================================================
// TYPES
// =============================================================================

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

export type EmailProviderConfig = typeof emailProviderConfigs.$inferSelect
export type NewEmailProviderConfig = typeof emailProviderConfigs.$inferInsert

export type EmailTemplate = typeof emailTemplates.$inferSelect
export type NewEmailTemplate = typeof emailTemplates.$inferInsert

export type EmailHistory = typeof emailHistory.$inferSelect
export type NewEmailHistory = typeof emailHistory.$inferInsert

export type EmailEvent = typeof emailEvents.$inferSelect
export type NewEmailEvent = typeof emailEvents.$inferInsert

export type EmailStatistic = typeof emailStatistics.$inferSelect
export type NewEmailStatistic = typeof emailStatistics.$inferInsert

export type ServiceApiConfig = typeof serviceApiConfigs.$inferSelect
export type NewServiceApiConfig = typeof serviceApiConfigs.$inferInsert

export type ServiceApiUsage = typeof serviceApiUsage.$inferSelect
export type NewServiceApiUsage = typeof serviceApiUsage.$inferInsert

export type UserApiKey = typeof userApiKeys.$inferSelect
export type NewUserApiKey = typeof userApiKeys.$inferInsert

export type UserApiKeyUsage = typeof userApiKeyUsage.$inferSelect
export type NewUserApiKeyUsage = typeof userApiKeyUsage.$inferInsert

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert

export type SystemLog = typeof systemLogs.$inferSelect
export type NewSystemLog = typeof systemLogs.$inferInsert

export type PagePermission = typeof pagePermissions.$inferSelect
export type NewPagePermission = typeof pagePermissions.$inferInsert

export type PlatformConfig = typeof platformConfig.$inferSelect
export type NewPlatformConfig = typeof platformConfig.$inferInsert

