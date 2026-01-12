import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement (priorité : .env.local > .env)
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Utiliser DATABASE_URL_UNPOOLED pour les migrations si disponible (connexion directe sans PgBouncer)
// Sinon utiliser DATABASE_URL standard
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL ou DATABASE_URL_UNPOOLED doit être défini dans .env ou .env.local');
}

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
} satisfies Config;
