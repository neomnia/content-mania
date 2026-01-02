import { Client } from 'lago-javascript-client';
import { db } from '@/db';
import { platformConfig } from '@/db/schema';
import { inArray } from 'drizzle-orm';

export async function getLagoClient() {
  const configs = await db.select().from(platformConfig).where(
    inArray(platformConfig.key, ['lago_api_key', 'lago_api_key_test', 'lago_api_url', 'lago_mode'])
  );

  const configMap = configs.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string | null>);

  const mode = configMap['lago_mode'] || 'production';
  const apiKey = mode === 'test' 
    ? (configMap['lago_api_key_test'] || process.env.LAGO_API_KEY_TEST)
    : (configMap['lago_api_key'] || process.env.LAGO_API_KEY);
    
  const apiUrl = configMap['lago_api_url'] || process.env.LAGO_API_URL || "https://api.getlago.com/v1";

  if (!apiKey) {
    throw new Error(`Lago API Key is not configured for ${mode} mode`);
  }

  return Client(apiKey, {
    baseUrl: apiUrl,
  });
}
