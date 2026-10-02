import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('Seeding demo data...');

  const passHash = await hashPassword('password123');

  // 1. Create Users
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@demo.org' },
    update: { passwordHash: passHash },
    create: { email: 'superadmin@demo.org', name: 'Super Admin', role: 'SUPER_ADMIN', passwordHash: passHash },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.org' },
    update: { passwordHash: passHash },
    create: { email: 'admin@demo.org', name: 'Admin', role: 'ADMIN', passwordHash: passHash },
  });

  const verifier = await prisma.user.upsert({
    where: { email: 'verifier@demo.org' },
    update: { passwordHash: passHash },
    create: { email: 'verifier@demo.org', name: 'Verifier', role: 'VERIFIER', passwordHash: passHash },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@demo.org' },
    update: { passwordHash: passHash },
    create: { email: 'viewer@demo.org', name: 'Viewer', role: 'VIEWER', passwordHash: passHash },
  });

  // 2. Create Donations
  // Delete existing demo data
  await prisma.auditLog.deleteMany({});
  await prisma.oCRResult.deleteMany({});
  await prisma.verificationAttempt.deleteMany({});
  await prisma.paymentTransaction.deleteMany({});
  await prisma.donation.deleteMany({});

  const don1 = await prisma.donation.create({
    data: {
      id: 'DON-000001',
      donorName: 'Rahul Kumar (DEMO)',
      donorEmail: 'rahul@example.com',
      amount: 2500,
      status: 'PENDING',
      paymentMethod: 'UPI',
      utr: 'UTR-DEMO123',
    }
  });

  const don2 = await prisma.donation.create({
    data: {
      id: 'DON-000002',
      donorName: 'Neha Sharma (DEMO)',
      amount: 5000,
      status: 'VERIFIED',
      paymentMethod: 'BANK_TRANSFER',
      utr: 'UTR-DEMO456',
      verifiedById: verifier.id,
      verifiedAt: new Date(),
    }
  });

  const don3 = await prisma.donation.create({
    data: {
      id: 'DON-000003',
      donorName: 'Amit Singh (DEMO)',
      amount: 1000,
      status: 'NEEDS_MANUAL_REVIEW',
      paymentMethod: 'PAYTM',
      utr: 'UTR-DEMO789',
    }
  });

  // 3. Create OCR Result
  await prisma.oCRResult.create({
    data: {
      donationId: don1.id,
      imageUrl: '/mock-image.jpg',
      extractedUtr: 'UTR-DEMO123',
      extractedAmount: 2500,
      confidenceScore: 95.5,
      status: 'SUCCESS',
      rawText: 'Payment Successful UTR UTR-DEMO123 Amount 2500'
    }
  });

  // 4. Create Audit Log
  await prisma.auditLog.create({
    data: {
      userId: verifier.id,
      action: 'DONATION_VERIFIED',
      entityType: 'Donation',
      entityId: don2.id,
    }
  });

  console.log('Demo data seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
