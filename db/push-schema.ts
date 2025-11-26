import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

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
    await sql`DROP TABLE IF EXISTS role_permissions CASCADE;`;
    await sql`DROP TABLE IF EXISTS user_roles CASCADE;`;
    await sql`DROP TABLE IF EXISTS permissions CASCADE;`;
    await sql`DROP TABLE IF EXISTS roles CASCADE;`;
    await sql`DROP TABLE IF EXISTS users CASCADE;`;
    await sql`DROP TABLE IF EXISTS companies CASCADE;`;
    await sql`DROP TABLE IF EXISTS saas_admins CASCADE;`;
    console.log('  ✓ Old tables dropped (if existed)');

    // Drop old enum if it exists
    await sql`DROP TYPE IF EXISTS role CASCADE;`;
    console.log('  ✓ Old role enum dropped (if existed)');

    // =============================================================================
    // 2. CREATE BACKEND ADMINS TABLE
    // =============================================================================

    console.log('\n📊 Creating backend tables...');

    await sql`
      CREATE TABLE saas_admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ saas_admins table created');

    await sql`CREATE INDEX idx_saas_admins_email ON saas_admins(email);`;

    // =============================================================================
    // 3. CREATE FRONTEND USER TABLES
    // =============================================================================

    console.log('\n📊 Creating frontend user tables...');

    await sql`
      CREATE TABLE companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        city TEXT,
        address TEXT,
        vat_number TEXT,
        phone TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ companies table created');

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
        profile_image TEXT,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        is_owner BOOLEAN DEFAULT FALSE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ users table created');

    // =============================================================================
    // 4. CREATE ROLES & PERMISSIONS TABLES
    // =============================================================================

    console.log('\n📊 Creating roles & permissions tables...');

    await sql`
      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ roles table created');

    await sql`
      CREATE TABLE permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('  ✓ permissions table created');

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
    await sql`CREATE INDEX idx_users_is_owner ON users(is_owner);`;
    await sql`CREATE INDEX idx_users_is_active ON users(is_active);`;
    await sql`CREATE INDEX idx_roles_name ON roles(name);`;
    await sql`CREATE INDEX idx_permissions_name ON permissions(name);`;
    await sql`CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);`;
    await sql`CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);`;
    await sql`CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);`;
    await sql`CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);`;
    console.log('  ✓ All indexes created');

    // =============================================================================
    // 6. SEED DEFAULT ROLES
    // =============================================================================

    console.log('\n🌱 Seeding default roles...');

    // Check if roles already exist
    const existingRoles = await sql`SELECT COUNT(*) as count FROM roles;`;

    if (existingRoles[0].count === '0' || existingRoles[0].count === 0) {
      // Insert default roles
      await sql`
        INSERT INTO roles (name, description) VALUES
          ('owner', 'Company owner with full access - can invite and manage all users'),
          ('editor', 'Can read and write data within the company'),
          ('viewer', 'Read-only access to company data')
        ON CONFLICT (name) DO NOTHING;
      `;
      console.log('  ✓ Default roles seeded (owner, editor, viewer)');
    } else {
      console.log('  ℹ️  Roles already exist, skipping seed');
    }

    // =============================================================================
    // 7. SEED DEFAULT PERMISSIONS
    // =============================================================================

    console.log('\n🌱 Seeding default permissions...');

    const existingPermissions = await sql`SELECT COUNT(*) as count FROM permissions;`;

    if (existingPermissions[0].count === '0' || existingPermissions[0].count === 0) {
      await sql`
        INSERT INTO permissions (name, description) VALUES
          ('read', 'View company data and analytics'),
          ('write', 'Create and update company data'),
          ('invite', 'Invite new users to the company'),
          ('manage_users', 'Manage users within the company (activate/deactivate, change roles)')
        ON CONFLICT (name) DO NOTHING;
      `;
      console.log('  ✓ Default permissions seeded (read, write, invite, manage_users)');
    } else {
      console.log('  ℹ️  Permissions already exist, skipping seed');
    }

    // =============================================================================
    // 8. ASSIGN PERMISSIONS TO ROLES
    // =============================================================================

    console.log('\n🔗 Assigning permissions to roles...');

    const existingRolePermissions = await sql`SELECT COUNT(*) as count FROM role_permissions;`;

    if (existingRolePermissions[0].count === '0' || existingRolePermissions[0].count === 0) {
      // Owner gets all permissions
      await sql`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'owner'
        ON CONFLICT DO NOTHING;
      `;
      console.log('  ✓ Owner role: all permissions');

      // Editor gets read + write
      await sql`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'editor' AND p.name IN ('read', 'write')
        ON CONFLICT DO NOTHING;
      `;
      console.log('  ✓ Editor role: read, write');

      // Viewer gets read only
      await sql`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'viewer' AND p.name = 'read'
        ON CONFLICT DO NOTHING;
      `;
      console.log('  ✓ Viewer role: read');
    } else {
      console.log('  ℹ️  Role permissions already assigned, skipping');
    }

    // =============================================================================
    // 9. VERIFICATION
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
