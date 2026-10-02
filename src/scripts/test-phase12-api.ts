import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function testPhase12() {
  console.log('--- Phase 12 API Tests ---');

  // 1. Create fake donation via prisma simulating the API output
  // We can just verify constraints. The API itself requires HTTP requests.
  // Instead, we will simulate requests via standard next/server POST.
  
  // Since we cannot easily start next server and fetch locally during the script reliably without 
  // complex port management, we'll test the database fields and assumptions directly,
  // and use a NextRequest mock to test the Route directly.

  try {
    const { POST } = await import('../app/api/public/donations/route');
    
    // Mock NextRequest
    const createMockRequest = (body: Record<string, unknown>, headers: Record<string, string> = {}) => {
      // Use standard Headers and basic URL string for test compatibility
      const req = new NextRequest('http://localhost:3000/api/public/donations', {
        method: 'POST',
        headers: new Headers(headers),
        body: JSON.stringify(body)
      });
      return req;
    };

    // Test 1: Valid Public Donation
    const idempotencyKey1 = randomUUID();
    const req1 = createMockRequest({
      donorName: 'Test API User',
      donorEmail: 'api@example.com',
      amount: 5000,
      paymentMethod: 'UPI',
      source: 'NGO_WEBSITE',
      externalReference: 'WEB-12345'
    }, {
      'idempotency-key': idempotencyKey1,
      'origin': 'https://allowed-ngo-website.org'
    });

    const res1 = await POST(req1);
    const data1 = await res1.json();
    if (!data1.success || data1.status !== 'PENDING') throw new Error('Failed Test 1');
    console.log('[TEST 1 PASS] Valid public donation creation');

    // Test 2: Missing Donor Name
    const req2 = createMockRequest({
      amount: 1000
    });
    const res2 = await POST(req2);
    if (res2.status !== 400) throw new Error('Failed Test 2');
    console.log('[TEST 2 PASS] Missing donor name rejected');

    // Test 3: Zero/Negative Amount
    const req3 = createMockRequest({
      donorName: 'Test API User',
      amount: -500
    });
    const res3 = await POST(req3);
    if (res3.status !== 400) throw new Error('Failed Test 3');
    console.log('[TEST 3 PASS] Negative amount rejected');

    // Test 4: Idempotency
    const req4 = createMockRequest({
      donorName: 'Duplicate User',
      amount: 1000,
    }, {
      'idempotency-key': idempotencyKey1 // reuse key
    });
    const res4 = await POST(req4);
    const data4 = await res4.json();
    if (data4.donationId !== data1.donationId) throw new Error('Failed Test 4');
    console.log('[TEST 4 PASS] Idempotency prevents duplicates');
    
    // Test 5: Client cannot set verified status
    const req5 = createMockRequest({
      donorName: 'Sneaky User',
      amount: 1000,
      status: 'VERIFIED',
      verifiedAmount: 1000
    });
    const res5 = await POST(req5);
    const data5 = await res5.json();
    if (data5.status === 'VERIFIED') throw new Error('Failed Test 5');
    console.log('[TEST 5 PASS] Client cannot set VERIFIED status');

    // Clean up
    await prisma.donation.deleteMany({
      where: {
        donorName: {
          in: ['Test API User', 'Sneaky User']
        }
      }
    });

    console.log('--- End of Phase 12 Tests ---');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPhase12();
