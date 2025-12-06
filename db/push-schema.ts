import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local', override: true });

// Remove unsupported query parameters
const dbUrl = process.env.DATABASE_URL!.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '');
const sql = neon(dbUrl);

async function pushSchema() {
  console.log('Creating database schema...');

  try {
    // =============================================================================
    // 1. DROP OLD SCHEMA (if exists from previous version)
    // =============================================================================

    console.log('🧹 Cleaning up old schema (if exists)...');

    // Drop old tables in correct order (respecting foreign keys)
    await sql`DROP TABLE IF EXISTS page_permissions CASCADE;`;
    await sql`DROP TABLE IF EXISTS platform_config CASCADE;`;
    await sql`DROP TABLE IF EXISTS system_logs CASCADE;`;
    await sql`DROP TABLE IF EXISTS order_items CASCADE;`;
    await sql`DROP TABLE IF EXISTS orders CASCADE;`;
    await sql`DROP TABLE IF EXISTS user_api_key_usage CASCADE;`;
    await sql`DROP TABLE IF EXISTS user_api_keys CASCADE;`;
    await sql`DROP TABLE IF EXISTS email_events CASCADE;`;
    await sql`DROP TABLE IF EXISTS email_statistics CASCADE;`;
    await sql`DROP TABLE IF EXISTS email_history CASCADE;`;
    await sql`DROP TABLE IF EXISTS email_templates CASCADE;`;
    await sql`DROP TABLE IF EXISTS email_provider_configs CASCADE;`;
    await sql`DROP TABLE IF EXISTS user_invitations CASCADE;`;
    await sql`DROP TABLE IF EXISTS role_permissions CASCADE;`;
    await sql`DROP TABLE IF EXISTS user_roles CASCADE;`;
    await sql`DROP TABLE IF EXISTS permissions CASCADE;`;
    await sql`DROP TABLE IF EXISTS roles CASCADE;`;
    await sql`DROP TABLE IF EXISTS users CASCADE;`;
    await sql`DROP TABLE IF EXISTS companies CASCADE;`;
    await sql`DROP TABLE IF EXISTS saas_admins CASCADE;`; // Old admin table (replaced by unified users)
    console.log('  ✓ Old tables dropped (if existed)');

    // Drop old enum if it exists
    await sql`DROP TYPE IF EXISTS role CASCADE;`;
    console.log('  ✓ Old role enum dropped (if existed)');

    // =============================================================================
    // 2. CREATE COMPANIES TABLE
    // =============================================================================

    console.log('\n📊 Creating companies table...');

    await sql`
      CREATE TABLE companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        city TEXT,
        address TEXT,
        zip_code TEXT,
        siret TEXT,
        vat_number TEXT,
        phone TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ companies table created');

    // =============================================================================
    // 3. CREATE UNIFIED USERS TABLE
    // =============================================================================

    console.log('\n📊 Creating unified users table...');

    await sql`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        city TEXT,
        postal_code TEXT,
        country TEXT,
        position TEXT,
        profile_image TEXT,
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ users table created (unified for customers and admins)');

    // =============================================================================
    // 4. CREATE ROLES & PERMISSIONS TABLES (WITH SCOPE)
    // =============================================================================

    console.log('\n📊 Creating roles & permissions tables...');

    await sql`
      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        scope TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ roles table created (with company/platform scope)');

    await sql`
      CREATE TABLE permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        scope TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ permissions table created (with company/platform scope)');

    await sql`
      CREATE TABLE user_roles (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
        PRIMARY KEY (user_id, role_id)
      );
    `;
    console.log('  ✓ user_roles table created');

    await sql`
      CREATE TABLE role_permissions (
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        PRIMARY KEY (role_id, permission_id)
      );
    `;
    console.log('  ✓ role_permissions table created');

    // =============================================================================
    // 5. CREATE INDEXES FOR PERFORMANCE
    // =============================================================================

    console.log('\n🔍 Creating indexes...');

    await sql`CREATE INDEX idx_companies_email ON companies(email);`;
    await sql`CREATE INDEX idx_users_email ON users(email);`;
    await sql`CREATE INDEX idx_users_company_id ON users(company_id);`;
    await sql`CREATE INDEX idx_users_is_active ON users(is_active);`;
    await sql`CREATE INDEX idx_roles_name ON roles(name);`;
    await sql`CREATE INDEX idx_roles_scope ON roles(scope);`;
    await sql`CREATE INDEX idx_permissions_name ON permissions(name);`;
    await sql`CREATE INDEX idx_permissions_scope ON permissions(scope);`;
    await sql`CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);`;
    await sql`CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);`;
    await sql`CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);`;
    await sql`CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);`;
    console.log('  ✓ All indexes created');

    // =============================================================================
    // 6. SEED DEFAULT ROLES (COMPANY + PLATFORM SCOPES)
    // =============================================================================

    console.log('\n🌱 Seeding default roles...');

    // Check if roles already exist
    const existingRoles = await sql`SELECT COUNT(*) as count FROM roles;`;

    if (existingRoles[0].count === '0' || existingRoles[0].count === 0) {
      // Insert company-scoped roles
      await sql`
        INSERT INTO roles (name, scope, description) VALUES
          ('reader', 'company', 'Read-only access to company data'),
          ('writer', 'company', 'Read and write access to company data')
        ON CONFLICT (name) DO NOTHING;
      `;
      console.log('  ✓ Company roles seeded (reader, writer)');

      // Insert platform-scoped roles
      await sql`
        INSERT INTO roles (name, scope, description) VALUES
          ('admin', 'platform', 'Platform administrator - can manage companies and users'),
          ('super_admin', 'platform', 'Super administrator - full platform access including admin management')
        ON CONFLICT (name) DO NOTHING;
      `;
      console.log('  ✓ Platform roles seeded (admin, super_admin)');
    } else {
      console.log('  ℹ️  Roles already exist, skipping seed');
    }

    // =============================================================================
    // 7. SEED DEFAULT PERMISSIONS (COMPANY + PLATFORM SCOPES)
    // =============================================================================

    console.log('\n🌱 Seeding default permissions...');

    const existingPermissions = await sql`SELECT COUNT(*) as count FROM permissions;`;

    if (existingPermissions[0].count === '0' || existingPermissions[0].count === 0) {
      // Company-scoped permissions
      await sql`
        INSERT INTO permissions (name, scope, description) VALUES
          ('read', 'company', 'View company data and analytics'),
          ('write', 'company', 'Create and update company data'),
          ('invite', 'company', 'Invite new users to the company'),
          ('manage_users', 'company', 'Manage users within the company')
        ON CONFLICT (name) DO NOTHING;
      `;
      console.log('  ✓ Company permissions seeded (read, write, invite, manage_users)');

      // Platform-scoped permissions
      await sql`
        INSERT INTO permissions (name, scope, description) VALUES
          ('manage_platform', 'platform', 'Manage platform settings and features'),
          ('manage_companies', 'platform', 'View and manage all companies'),
          ('manage_all_users', 'platform', 'Manage any user on the platform'),
          ('manage_admins', 'platform', 'Create and manage other administrators'),
          ('manage_emails', 'platform', 'Configure email providers and templates'),
          ('view_analytics', 'platform', 'Access platform-wide analytics and statistics')
        ON CONFLICT (name) DO NOTHING;
      `;
      console.log('  ✓ Platform permissions seeded (manage_platform, manage_companies, etc.)');
    } else {
      console.log('  ℹ️  Permissions already exist, skipping seed');
    }

    // =============================================================================
    // 8. ASSIGN PERMISSIONS TO ROLES
    // =============================================================================

    console.log('\n🔗 Assigning permissions to roles...');

    const existingRolePermissions = await sql`SELECT COUNT(*) as count FROM role_permissions;`;

    if (existingRolePermissions[0].count === '0' || existingRolePermissions[0].count === 0) {
      // COMPANY ROLES

      // Reader gets read only
      await sql`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'reader' AND r.scope = 'company'
          AND p.name = 'read' AND p.scope = 'company'
        ON CONFLICT DO NOTHING;
      `;
      console.log('  ✓ Reader role: read');

      // Writer gets read + write + invite + manage_users (full company access)
      await sql`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'writer' AND r.scope = 'company'
          AND p.scope = 'company'
        ON CONFLICT DO NOTHING;
      `;
      console.log('  ✓ Writer role: all company permissions');

      // PLATFORM ROLES

      // Admin gets all platform permissions except manage_admins
      await sql`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'admin' AND r.scope = 'platform'
          AND p.scope = 'platform' AND p.name != 'manage_admins'
        ON CONFLICT DO NOTHING;
      `;
      console.log('  ✓ Admin role: platform permissions (except manage_admins)');

      // Super Admin gets ALL platform permissions
      await sql`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'super_admin' AND r.scope = 'platform'
          AND p.scope = 'platform'
        ON CONFLICT DO NOTHING;
      `;
      console.log('  ✓ Super Admin role: all platform permissions');
    } else {
      console.log('  ℹ️  Role permissions already assigned, skipping');
    }

    // =============================================================================
    // 9. SEED PROVISORY SUPER ADMIN
    // =============================================================================

    console.log('\n👤 Creating provisory super admin...');

    const existingSuperAdmin = await sql`SELECT COUNT(*) as count FROM users WHERE email = 'admin@exemple.com';`;

    if (existingSuperAdmin[0].count === '0' || existingSuperAdmin[0].count === 0) {
      const hashedPassword = await bcrypt.hash('admin', 10);

      // Create super admin user (no company_id - platform admin)
      await sql`
        INSERT INTO users (email, password, first_name, last_name, company_id, is_active)
        VALUES ('admin@exemple.com', ${hashedPassword}, 'Super', 'Admin', NULL, true)
        ON CONFLICT (email) DO NOTHING;
      `;

      // Assign super_admin role
      await sql`
        INSERT INTO user_roles (user_id, role_id)
        SELECT u.id, r.id
        FROM users u
        CROSS JOIN roles r
        WHERE u.email = 'admin@exemple.com' AND r.name = 'super_admin'
        ON CONFLICT DO NOTHING;
      `;

      console.log('  ✓ Provisory super admin created');
      console.log('  📧 Email: admin@exemple.com');
      console.log('  🔑 Password: admin');
      console.log('  👑 Role: super_admin (platform scope)');
      console.log('  ⚠️  IMPORTANT: Change this password after first login!');
    } else {
      console.log('  ℹ️  Super admin already exists, skipping');
    }

    // =============================================================================
    // 10. CREATE USER INVITATIONS TABLE
    // =============================================================================

    console.log('\n📊 Creating user invitations table...');

    await sql`
      CREATE TABLE user_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id),
        invited_by UUID REFERENCES users(id),
        token TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        accepted_at TIMESTAMP
      );
    `;
    console.log('  ✓ user_invitations table created');

    await sql`CREATE INDEX idx_user_invitations_email ON user_invitations(email);`;
    await sql`CREATE INDEX idx_user_invitations_token ON user_invitations(token);`;
    await sql`CREATE INDEX idx_user_invitations_status ON user_invitations(status);`;

    // =============================================================================
    // 11. CREATE EMAIL SYSTEM TABLES
    // =============================================================================

    console.log('\n📧 Creating email system tables...');

    await sql`
      CREATE TABLE email_provider_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider TEXT NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        is_default BOOLEAN DEFAULT FALSE NOT NULL,
        config JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ email_provider_configs table created');

    await sql`
      CREATE TABLE email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        from_name TEXT NOT NULL,
        from_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        html_content TEXT,
        text_content TEXT,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        provider TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ email_templates table created');

    await sql`
      CREATE TABLE email_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider TEXT NOT NULL,
        template_type TEXT,
        message_id TEXT,
        "from" TEXT NOT NULL,
        "to" JSONB NOT NULL,
        cc JSONB,
        bcc JSONB,
        subject TEXT NOT NULL,
        html_content TEXT,
        text_content TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT,
        tags JSONB,
        metadata JSONB,
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ email_history table created');

    await sql`
      CREATE TABLE email_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email_history_id UUID REFERENCES email_history(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        message_id TEXT,
        event_type TEXT NOT NULL,
        event_data JSONB,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ email_events table created');

    await sql`
      CREATE TABLE email_statistics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date TIMESTAMP NOT NULL,
        provider TEXT NOT NULL,
        total_sent INTEGER DEFAULT 0 NOT NULL,
        total_delivered INTEGER DEFAULT 0 NOT NULL,
        total_failed INTEGER DEFAULT 0 NOT NULL,
        total_bounced INTEGER DEFAULT 0 NOT NULL,
        total_opened INTEGER DEFAULT 0 NOT NULL,
        total_clicked INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ email_statistics table created');

    // =============================================================================
    // SYSTEM LOGS
    // =============================================================================

    console.log('\n📜 Creating system logs table...');

    await sql`
      CREATE TABLE system_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category TEXT NOT NULL,
        level TEXT NOT NULL DEFAULT 'info',
        message TEXT NOT NULL,
        metadata JSONB,
        user_id UUID REFERENCES users(id),
        resource_id TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ system_logs table created');

    await sql`CREATE INDEX idx_system_logs_category ON system_logs(category);`;
    await sql`CREATE INDEX idx_system_logs_level ON system_logs(level);`;
    await sql`CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);`;

    // =============================================================================
    // 12. CREATE USER API KEYS TABLES
    // =============================================================================

    console.log('\n🔑 Creating user API keys tables...');

    await sql`
      CREATE TABLE user_api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        key_hash VARCHAR(255) NOT NULL UNIQUE,
        key_prefix VARCHAR(10) NOT NULL,
        permissions JSONB DEFAULT '[]'::jsonb NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        expires_at TIMESTAMP,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ user_api_keys table created');

    await sql`CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);`;
    await sql`CREATE INDEX idx_user_api_keys_key_hash ON user_api_keys(key_hash);`;
    await sql`CREATE INDEX idx_user_api_keys_is_active ON user_api_keys(is_active);`;

    await sql`
      CREATE TABLE user_api_key_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        api_key_id UUID NOT NULL REFERENCES user_api_keys(id) ON DELETE CASCADE,
        endpoint VARCHAR(500) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code VARCHAR(3) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        response_time VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ user_api_key_usage table created');

    await sql`CREATE INDEX idx_user_api_key_usage_api_key_id ON user_api_key_usage(api_key_id);`;
    await sql`CREATE INDEX idx_user_api_key_usage_created_at ON user_api_key_usage(created_at);`;

    // =============================================================================
    // 13. CREATE ORDERS & PURCHASES TABLES
    // =============================================================================

    console.log('\n🛒 Creating orders & purchases tables...');

    await sql`
      CREATE TABLE orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_number VARCHAR(50) NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        total_amount INTEGER NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        payment_method VARCHAR(50),
        payment_status TEXT NOT NULL DEFAULT 'pending',
        payment_intent_id VARCHAR(255),
        paid_at TIMESTAMP,
        notes TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ orders table created');

    await sql`CREATE INDEX idx_orders_user_id ON orders(user_id);`;
    await sql`CREATE INDEX idx_orders_order_number ON orders(order_number);`;
    await sql`CREATE INDEX idx_orders_status ON orders(status);`;
    await sql`CREATE INDEX idx_orders_payment_status ON orders(payment_status);`;
    await sql`CREATE INDEX idx_orders_created_at ON orders(created_at);`;

    await sql`
      CREATE TABLE order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        item_type VARCHAR(50) NOT NULL,
        item_id VARCHAR(100),
        item_name VARCHAR(255) NOT NULL,
        item_description TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price INTEGER NOT NULL,
        total_price INTEGER NOT NULL,
        delivery_time VARCHAR(100),
        delivery_status TEXT DEFAULT 'pending',
        delivered_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ order_items table created');

    await sql`CREATE INDEX idx_order_items_order_id ON order_items(order_id);`;
    await sql`CREATE INDEX idx_order_items_item_type ON order_items(item_type);`;
    await sql`CREATE INDEX idx_order_items_delivery_status ON order_items(delivery_status);`;

    // =============================================================================
    // 14. CREATE SERVICE API CONFIGS TABLES (Third-Party Service Integration)
    // =============================================================================

    console.log('\n🔧 Creating service API configs tables...');

    await sql`
      CREATE TABLE IF NOT EXISTS service_api_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_name TEXT NOT NULL,
        service_type TEXT NOT NULL,
        environment TEXT NOT NULL DEFAULT 'production',
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        is_default BOOLEAN DEFAULT FALSE NOT NULL,
        config JSONB NOT NULL,
        metadata JSONB,
        last_tested_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ service_api_configs table created');

    await sql`CREATE INDEX IF NOT EXISTS idx_service_api_configs_service_name ON service_api_configs(service_name);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_service_api_configs_environment ON service_api_configs(environment);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_service_api_configs_is_active ON service_api_configs(is_active);`;

    await sql`
      CREATE TABLE IF NOT EXISTS service_api_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        config_id UUID NOT NULL REFERENCES service_api_configs(id) ON DELETE CASCADE,
        service_name TEXT NOT NULL,
        operation VARCHAR(255) NOT NULL,
        status TEXT NOT NULL,
        status_code VARCHAR(10),
        request_data JSONB,
        response_data JSONB,
        error_message TEXT,
        response_time INTEGER,
        cost_estimate INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ service_api_usage table created');

    await sql`CREATE INDEX IF NOT EXISTS idx_service_api_usage_config_id ON service_api_usage(config_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_service_api_usage_service_name ON service_api_usage(service_name);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_service_api_usage_created_at ON service_api_usage(created_at);`;

    // =============================================================================
    // 16. CREATE PAGE PERMISSIONS TABLE
    // =============================================================================

    console.log('\n📄 Creating page permissions table...');

    await sql`
      CREATE TABLE IF NOT EXISTS page_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        path TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        access TEXT NOT NULL DEFAULT 'public',
        "group" TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ page_permissions table created');

    await sql`CREATE INDEX IF NOT EXISTS idx_page_permissions_path ON page_permissions(path);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_page_permissions_access ON page_permissions(access);`;

    // =============================================================================
    // 17. CREATE PLATFORM CONFIG TABLE
    // =============================================================================

    console.log('\n⚙️ Creating platform config table...');

    await sql`
      CREATE TABLE IF NOT EXISTS platform_config (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ platform_config table created');

    // =============================================================================
    // 18. VERIFICATION
    // =============================================================================

    console.log('\n✅ Schema pushed successfully!');
    console.log('\n📊 Database Summary:');

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log(`  Tables created: ${tables.length}`);
    tables.forEach((t: any) => console.log(`    - ${t.table_name}`));

    const rolesCount = await sql`SELECT COUNT(*) as count FROM roles;`;
    const permissionsCount = await sql`SELECT COUNT(*) as count FROM permissions;`;
    const rolePermissionsCount = await sql`SELECT COUNT(*) as count FROM role_permissions;`;

    console.log(`\n  Roles: ${rolesCount[0].count}`);
    console.log(`  Permissions: ${permissionsCount[0].count}`);
    console.log(`  Role-Permission mappings: ${rolePermissionsCount[0].count}`);

  } catch (error) {
    console.error('❌ Error pushing schema:', error);
    process.exit(1);
  }
}

pushSchema();
