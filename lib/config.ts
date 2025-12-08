import { db } from "@/db"
import { platformConfig } from "@/db/schema"

export interface PlatformConfigData {
  siteName: string
  logo: string | null
  authEnabled: boolean
  maintenanceMode: boolean
  gtmCode?: string
  customHeaderCode?: string
  customFooterCode?: string
  seoSettings?: any
  socialLinks?: any
}

// Re-export for convenience
export type { PlatformConfigData as PlatformConfig }

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
      authEnabled: configMap['auth_enabled'] === 'true',
      maintenanceMode: configMap['maintenance_mode'] === 'true' || configMap['maintenance_mode'] === true,
      gtmCode: configMap['gtm_code'] || null,
      customHeaderCode: configMap['custom_header_code'] || null,
      customFooterCode: configMap['custom_footer_code'] || null,
      seoSettings: configMap['seo_settings'] || null,
      socialLinks: configMap['social_links'] || null
    }
  } catch (error) {
    console.error("Failed to fetch platform config:", error)
    return {
      siteName: 'NeoSaaS',
      logo: null,
      authEnabled: true,
      maintenanceMode: false,
      gtmCode: null,
      customHeaderCode: null,
      customFooterCode: null,
      seoSettings: null,
      socialLinks: null
    }
  }
}
