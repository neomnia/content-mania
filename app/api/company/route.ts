import { NextRequest, NextResponse } from 'next/server';
import { db, validateDatabaseUrl } from '@/db';
import { companies } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

/**
 * GET /api/company
 * Fetch current user's company data
 */
export async function GET() {
  try {
    validateDatabaseUrl();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch company data
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, currentUser.companyId),
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Get company error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching company data' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/company
 * Update current user's company data
 */
export async function PUT(request: NextRequest) {
  try {
    validateDatabaseUrl();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only owner can update company info
    if (!currentUser.isOwner) {
      return NextResponse.json(
        { error: 'Only company owners can update company information' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, city, address, vatNumber, phone } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another company
    const existingCompany = await db.query.companies.findFirst({
      where: eq(companies.email, email),
    });

    if (existingCompany && existingCompany.id !== currentUser.companyId) {
      return NextResponse.json(
        { error: 'This email is already used by another company' },
        { status: 409 }
      );
    }

    // Update company
    const [updatedCompany] = await db
      .update(companies)
      .set({
        name,
        email,
        city: city || null,
        address: address || null,
        vatNumber: vatNumber || null,
        phone: phone || null,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, currentUser.companyId))
      .returning();

    return NextResponse.json({
      company: updatedCompany,
      message: 'Company information updated successfully',
    });
  } catch (error) {
    console.error('Update company error:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating company data' },
      { status: 500 }
    );
  }
}
