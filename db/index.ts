import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Use a placeholder during build time, will throw at runtime if not set
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@placeholder/placeholder';

// Only validate at runtime when actually accessing the database
function validateDatabaseUrl() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    throw new Error('DATABASE_URL environment variable is not set. Please configure it in your environment variables.');
  }
}

// Create the database client
const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });

// Export validation function to be called before database operations
export { validateDatabaseUrl };
