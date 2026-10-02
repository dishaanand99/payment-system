import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data for Phase 7...');

  // Reset previously created test donations if any to avoid conflicts
  await prisma.donation.deleteMany({
    where: { donorName: { startsWith: 'Phase7 Test' } }
  });

  // TEST 1: Exact Match
  await prisma.donation.create({
    data: {
      donorName: 'Phase7 Test 1',
      amount: 5000,
      utr: 'UTR000000001',
      donatedAt: new Date('2026-10-01'),
      status: 'PENDING'
    }
  });

  // TEST 2: Wrong Amount
  await prisma.donation.create({
    data: {
      donorName: 'Phase7 Test 2',
      amount: 5000,
      utr: 'UTR000000002',
      donatedAt: new Date('2026-10-01'),
      status: 'PENDING'
    }
  });

  // TEST 3: Duplicate UTR (Already Verified Donation)
  await prisma.donation.create({
    data: {
      donorName: 'Phase7 Test 3A (Verified)',
      amount: 5000,
      utr: 'UTR000000003',
      donatedAt: new Date('2026-10-01'),
      status: 'VERIFIED'
    }
  });
  // Removed Test 3B as UTR is unique

  // TEST 9: Multiple donations with same amount/date, no UTR
  await prisma.donation.create({
    data: {
      donorName: 'Phase7 Test 9A',
      amount: 7777,
      donatedAt: new Date('2026-10-01'),
      status: 'PENDING'
    }
  });
  await prisma.donation.create({
    data: {
      donorName: 'Phase7 Test 9B',
      amount: 7777,
      donatedAt: new Date('2026-10-01'),
      status: 'PENDING'
    }
  });

  // Generate CSV File
  const csvLines = [
    'Date,Description,Reference,Credit,Debit,Balance',
    '01-10-2026,Test 1 Exact,UTR000000001,5000,,10000', // Matches Test 1
    '01-10-2026,Test 2 Wrong Amt,UTR000000002,4000,,14000', // Matches Test 2 but wrong amount -> NEEDS_MANUAL_REVIEW
    '01-10-2026,Test 3 Dup,UTR000000003,5000,,19000', // Matches Test 3B but 3A is VERIFIED -> DUPLICATE
    '01-10-2026,Test 4 Debit,, ,1000,18000', // Debit -> Ignored
    'InvalidDate,Test 5 Invalid Date,,5000,,23000', // Invalid -> Failed row
    '01-10-2026,Test 6 Invalid Amt,,Invalid,,23000', // Invalid -> Failed row
    '01-10-2026,Test 8 Unmatched,UTR000000008,5000,,28000', // Unmatched -> UNMATCHED
    '01-10-2026,Test 9 Multiple No UTR,,7777,,35777', // Matches 9A and 9B -> UNMATCHED (because length !== 1)
  ];

  const csvPath = path.join(process.cwd(), 'phase7-test-statement.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');

  console.log(`Seeded donations and generated CSV at ${csvPath}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
