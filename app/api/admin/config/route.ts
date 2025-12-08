import { NextRequest, NextResponse } from 'next/server';
import { db, validateDatabaseUrl } from '@/db';
import { platformConfig } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

/**
 * GET /api/admin/config
 * Retrieve platform configuration
 */
export async function GET() {
  try {
    validateDatabaseUrl();
    const currentUser = await getCurrentUser();

    const isAdmin = currentUser?.roles?.some(role => role === 'admin' || role === 'super_admin');
    if (!currentUser || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const configs = await db.select().from(platformConfig);
    
    // Convert array to object
    const configMap: Record<string, any> = {};
    configs.forEach(c => {
      try {
        // Try to parse JSON if possible, otherwise use string
        configMap[c.key] = JSON.parse(c.value || 'null');
      } catch {
        configMap[c.key] = c.value;
      }
    });

    return NextResponse.json(configMap);
  } catch (error) {
    console.error('Get config error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/config
 * Update platform configuration
 */
export async function POST(request: NextRequest) {
  try {
    validateDatabaseUrl();
    const currentUser = await getCurrentUser();

    const isAdmin = currentUser?.roles?.some(role => role === 'admin' || role === 'super_admin');
    if (!currentUser || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const updates: Record<string, string> = {};

    // Handle logo upload
    const logoFile = formData.get('logo') as File;
    if (logoFile && logoFile.size > 0) {
      // Validate file size (max 2MB)
      if (logoFile.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Logo file size exceeds 2MB limit' },
          { status: 400 }
        );
      }

      // Convert to Base64 SVG
      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${logoFile.type};base64,${buffer.toString('base64')}`;

      // Create SVG container (square 100x100 for logo)
      const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <image href="${base64Image}" width="100" height="100" preserveAspectRatio="xMidYMid contain" />
</svg>`.trim();

      const svgBuffer = Buffer.from(svgContent);
      updates['logo'] = `data:image/svg+xml;base64,${svgBuffer.toString('base64')}`;
    }

    // Handle other fields
    const siteName = formData.get('siteName') as string;
    if (siteName) updates['site_name'] = siteName;

    const authEnabled = formData.get('authEnabled');
    if (authEnabled !== null) updates['auth_enabled'] = authEnabled.toString();

    const maintenanceMode = formData.get('maintenanceMode');
    if (maintenanceMode !== null) updates['maintenance_mode'] = maintenanceMode.toString();

    const customHeaderCode = formData.get('customHeaderCode');
    if (customHeaderCode !== null) updates['custom_header_code'] = customHeaderCode.toString();

    const customFooterCode = formData.get('customFooterCode');
    if (customFooterCode !== null) updates['custom_footer_code'] = customFooterCode.toString();

    const gtmCode = formData.get('gtmCode');
    if (gtmCode !== null) updates['gtm_code'] = gtmCode.toString();

    let seoSettingsStr = formData.get('seoSettings') as string;

    // Handle OG Image upload
    const ogImageFile = formData.get('ogImage') as File;
    if (ogImageFile && ogImageFile.size > 0) {
      if (ogImageFile.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'OG Image size exceeds 2MB limit' },
          { status: 400 }
        );
      }

      const bytes = await ogImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${ogImageFile.type};base64,${buffer.toString('base64')}`;

      // Update seoSettings with the new image
      let seoSettingsObj: any = {};
      try {
        seoSettingsObj = seoSettingsStr ? JSON.parse(seoSettingsStr) : {};
      } catch (e) {
        console.error('Failed to parse seoSettings', e);
      }

      seoSettingsObj.ogImage = base64Image;
      seoSettingsStr = JSON.stringify(seoSettingsObj);
    }

    if (seoSettingsStr !== null) updates['seo_settings'] = seoSettingsStr;

    const socialLinks = formData.get('socialLinks');
    if (socialLinks !== null) updates['social_links'] = socialLinks.toString();

    // Save updates
    for (const [key, value] of Object.entries(updates)) {
      await db
        .insert(platformConfig)
        .values({
          key,
          value,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: platformConfig.key,
          set: {
            value,
            updatedAt: new Date(),
          },
        });
    }

    return NextResponse.json({
      message: 'Configuration updated successfully',
      updates
    });
  } catch (error) {
    console.error('Update config error:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
