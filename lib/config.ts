import { db } from "@/db"
import { platformConfig } from "@/db/schema"

export interface PlatformConfigData {
  siteName: string
  logo: string | null
  authEnabled: boolean
}

export async function getPlatformConfig(): Promise<PlatformConfigData> {
  try {
    const configs = await db.select().from(platformConfig)
    
    const configMap: Record<string, any> = {}
    configs.forEach(c => {
      try {
        configMap[c.key] = JSON.parse(c.value || 'null')
      } catch {
        configMap[c.key] = c.value
      }
    })

    return {
      siteName: configMap['site_name'] || 'NeoSaaS',
      logo: configMap['logo'] || null,
      authEnabled: configMap['auth_enabled'] === 'true'
    }
  } catch (error) {
    console.error("Failed to fetch platform config:", error)
    return {
      siteName: 'NeoSaaS',
      logo: null,
      authEnabled: true
    }
  }
}
