import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = neon(process.env.DATABASE_URL);

async function resetDatabase() {
  console.log('🗑️  Resetting database (dropping all tables)...');

  try {
    // Get all tables in public schema
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
    `;

    if (tables.length === 0) {
      console.log('  ℹ️  Database is already empty');
    } else {
      // Disable triggers/constraints temporarily if needed, but CASCADE handles most
      for (const table of tables) {
        const tableName = table.table_name;
        console.log(`  🔥 Dropping table: ${tableName}`);
        // Use sql as a function call is deprecated, but for dynamic table names we need a workaround
        // We can't use tagged template for table name identifier easily with this driver
        // Trying to use the raw query execution if possible, or just constructing the query
        // The error message suggested sql.query
        await (sql as any).query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
      }
    }

    // Drop custom types/enums if any (like 'role')
    try {
      await sql`DROP TYPE IF EXISTS role CASCADE`;
      console.log('  🔥 Dropped type: role');
    } catch (e) {
      // Ignore if doesn't exist
    }

    console.log('✅ Database reset complete. Ready for schema push.');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();
