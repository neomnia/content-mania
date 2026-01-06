import { Client } from 'lago-javascript-client';
import { db } from '@/db';
import { platformConfig } from '@/db/schema';
import { inArray } from 'drizzle-orm';

export type LagoMode = 'production' | 'test' | 'dev';

export interface LagoConfig {
  mode: LagoMode;
  apiKey: string | null;
  apiUrl: string;
  isEnabled: boolean;
}

/**
 * Get the current Lago configuration
 * - production: Full Lago integration with production API key
 * - test: Lago is called but with test API key
 * - dev: No Lago calls at all - completely bypassed for local development
 */
export async function getLagoConfig(): Promise<LagoConfig> {
  const configs = await db.select().from(platformConfig).where(
    inArray(platformConfig.key, ['lago_api_key', 'lago_api_key_test', 'lago_api_url', 'lago_mode'])
  );

  const configMap = configs.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string | null>);

  // Priority: DB config > ENV var > default
  const mode = (configMap['lago_mode'] || process.env.LAGO_MODE || 'dev') as LagoMode;

  // In dev mode, Lago is completely disabled
  if (mode === 'dev') {
    console.log('[Lago] 🔧 DEV mode - Lago is completely bypassed');
    return {
      mode: 'dev',
      apiKey: null,
      apiUrl: '',
      isEnabled: false
    };
  }

  const apiKey = mode === 'test'
    ? (configMap['lago_api_key_test'] || process.env.LAGO_API_KEY_TEST)
    : (configMap['lago_api_key'] || process.env.LAGO_API_KEY);

  const apiUrl = configMap['lago_api_url'] || process.env.LAGO_API_URL || "https://api.getlago.com/v1";

  return {
    mode,
    apiKey: apiKey || null,
    apiUrl,
    isEnabled: !!apiKey
  };
}

/**
 * Get the Lago client instance
 * Returns null in dev mode or if not configured
 */
export async function getLagoClient() {
  const config = await getLagoConfig();

  // In dev mode, don't create a client
  if (config.mode === 'dev') {
    console.log('[Lago] 🔧 DEV mode - No Lago client created');
    throw new Error('Lago is disabled in DEV mode');
  }

  if (!config.apiKey) {
    throw new Error(`Lago API Key is not configured for ${config.mode} mode`);
  }

  console.log(`[Lago] 🔗 Creating client in ${config.mode.toUpperCase()} mode`);

  return Client(config.apiKey, {
    baseUrl: config.apiUrl,
  });
}

/**
 * Check if Lago is enabled
 */
export async function isLagoEnabled(): Promise<boolean> {
  const config = await getLagoConfig();
  return config.isEnabled;
}

/**
 * Get current Lago mode
 */
export async function getLagoMode(): Promise<LagoMode> {
  const config = await getLagoConfig();
  return config.mode;
}
