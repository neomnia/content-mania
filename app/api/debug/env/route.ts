import { NextResponse } from 'next/server';

/**
 * GET /api/debug/env
 *
 * Returns information about environment variables configuration
 * WITHOUT exposing the actual values (for security)
 *
 * Use this to verify that environment variables are properly set on Vercel
 */
export async function GET() {
  return NextResponse.json({
    environment: process.env.NODE_ENV || 'unknown',
    vercel: {
      isVercel: !!process.env.VERCEL,
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || 'not set'
    },
    variables: {
      DATABASE_URL: {
        isDefined: !!process.env.DATABASE_URL,
        isPlaceholder: process.env.DATABASE_URL?.includes('placeholder') || false,
        length: process.env.DATABASE_URL?.length || 0,
        prefix: process.env.DATABASE_URL?.substring(0, 20) || 'not set',
        status: !process.env.DATABASE_URL
          ? '❌ NOT SET'
          : process.env.DATABASE_URL.includes('placeholder')
          ? '⚠️ PLACEHOLDER'
          : '✅ CONFIGURED'
      },
      NEXTAUTH_SECRET: {
        isDefined: !!process.env.NEXTAUTH_SECRET,
        length: process.env.NEXTAUTH_SECRET?.length || 0,
        status: !process.env.NEXTAUTH_SECRET ? '❌ NOT SET' : '✅ CONFIGURED'
      },
      NEXTAUTH_URL: {
        isDefined: !!process.env.NEXTAUTH_URL,
        value: process.env.NEXTAUTH_URL || 'not set',
        status: !process.env.NEXTAUTH_URL ? '⚠️ NOT SET' : '✅ CONFIGURED'
      },
      ADMIN_SECRET_KEY: {
        isDefined: !!process.env.ADMIN_SECRET_KEY,
        length: process.env.ADMIN_SECRET_KEY?.length || 0,
        status: !process.env.ADMIN_SECRET_KEY ? '⚠️ NOT SET' : '✅ CONFIGURED'
      },
      SETUP_SECRET_KEY: {
        isDefined: !!process.env.SETUP_SECRET_KEY,
        length: process.env.SETUP_SECRET_KEY?.length || 0,
        status: !process.env.SETUP_SECRET_KEY ? '⚠️ NOT SET' : '✅ CONFIGURED'
      }
    },
    recommendations: []
  });
}
