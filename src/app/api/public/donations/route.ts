import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In production, configure NGO_WEBSITE_ORIGIN to restrict CORS.
const ALLOWED_ORIGIN = process.env.NGO_WEBSITE_ORIGIN || '*';

function setCorsHeaders(response: NextResponse, origin: string | null) {
  const allowOrigin = ALLOWED_ORIGIN === '*' || origin === ALLOWED_ORIGIN ? (origin || '*') : ALLOWED_ORIGIN;
  response.headers.set('Access-Control-Allow-Origin', allowOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key, Authorization');
  return response;
}

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  return setCorsHeaders(response, req.headers.get('origin'));
}

export async function POST(req: NextRequest) {
  try {
    // 1. Basic CORS protection
    const origin = req.headers.get('origin');
    if (ALLOWED_ORIGIN !== '*' && origin && origin !== ALLOWED_ORIGIN) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Origin not allowed' } }, { status: 403 });
    }

    // 2. Authentication (Optional server-to-server check)
    const authHeader = req.headers.get('authorization');
    const expectedKey = process.env.NGO_API_KEY;
    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } }, { status: 401 });
    }

    // 4. Idempotency Check
    const idempotencyKey = req.headers.get('idempotency-key');
    if (idempotencyKey) {
      const existing = await prisma.donation.findUnique({
        where: { idempotencyKey }
      });
      
      if (existing) {
        // Return existing safe response
        const response = NextResponse.json({
          success: true,
          donationId: existing.id,
          reference: existing.externalReference || existing.id,
          status: existing.status,
          paymentMethod: existing.paymentMethod,
          amount: existing.amount,
          message: 'Returned existing donation for idempotency key'
        });
        return setCorsHeaders(response, origin);
      }
    }

    // 5. Parse and Validate Body
    const body = await req.json();
    const {
      donorName,
      donorEmail,
      donorPhone,
      amount,
      currency,
      paymentMethod,
      donorPan,
      donorAddress,
      source,
      externalReference
    } = body;

    // Validation rules
    if (!donorName || typeof donorName !== 'string' || donorName.trim().length === 0) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid donor name' } }, { status: 400 });
    }
    
    if (donorEmail && (typeof donorEmail !== 'string' || !donorEmail.includes('@'))) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid email' } }, { status: 400 });
    }

    if (donorPhone && typeof donorPhone !== 'string') {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid phone' } }, { status: 400 });
    }

    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount) || amount <= 0 || amount > 10000000) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid amount' } }, { status: 400 });
    }

    if (currency && currency !== 'INR') {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Unsupported currency' } }, { status: 400 });
    }

    const allowedMethods = ['UPI', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'PAYU'];
    if (paymentMethod && !allowedMethods.includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payment method' } }, { status: 400 });
    }

    if (donorPan && (typeof donorPan !== 'string' || donorPan.length > 10)) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid PAN' } }, { status: 400 });
    }
    
    if (externalReference && (typeof externalReference !== 'string' || externalReference.length > 100)) {
       return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid external reference' } }, { status: 400 });
    }

    const safeSource = source === 'NGO_WEBSITE' ? 'NGO_WEBSITE' : 'API';

    // 6. Create Donation in PENDING state (strictly controlled server-side defaults)
    const donation = await prisma.donation.create({
      data: {
        donorName: donorName.trim(),
        donorEmail: donorEmail ? donorEmail.trim() : null,
        donorPhone: donorPhone ? donorPhone.trim() : null,
        amount,
        currency: 'INR',
        paymentMethod: paymentMethod || null,
        donorPan: donorPan ? donorPan.trim() : null,
        donorAddress: donorAddress ? String(donorAddress).slice(0, 500) : null,
        status: 'PENDING',
        source: safeSource,
        externalReference: externalReference ? externalReference.trim() : null,
        idempotencyKey: idempotencyKey || null
      }
    });

    // 7. Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'PUBLIC_DONATION_CREATED',
        entityType: 'Donation',
        entityId: donation.id,
        newValues: JSON.stringify({
          amount,
          source: safeSource,
          idempotencyKey: idempotencyKey || null,
          externalReference: externalReference || null
        }),
        ipAddress: req.headers.get('x-forwarded-for') || 'api',
        userAgent: req.headers.get('user-agent') || 'api'
      }
    });

    const successResponse = NextResponse.json({
      success: true,
      donationId: donation.id,
      reference: donation.externalReference || donation.id,
      status: donation.status,
      paymentMethod: donation.paymentMethod,
      amount: donation.amount
    }, { status: 201 });

    return setCorsHeaders(successResponse, origin);

  } catch (error: unknown) {
    console.error('Public API Error:', error);
    const errorResponse = NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred' } },
      { status: 500 }
    );
    return setCorsHeaders(errorResponse, req.headers.get('origin'));
  }
}
