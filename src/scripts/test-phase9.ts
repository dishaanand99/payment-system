import { PrismaClient } from '@prisma/client';
import { buildDonationQuery } from '../lib/reports/filters';
import { getDashboardSummary } from '../lib/reports/summaries';
import { generateCSV } from '../lib/reports/csv';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Phase 9 Reports & Export Tests ---');

  const testRunId = Date.now().toString();

  // Seed test donations
  const d1 = await prisma.donation.create({
    data: {
      donorName: `Report Test 1 ${testRunId}`,
      amount: 1000,
      donatedAt: new Date(),
      status: 'VERIFIED',
      paymentMethod: 'PAYU',
      transactions: {
          create: {
             source: 'PAYU_WEBHOOK',
             utr: 'UTR_P1_' + testRunId,
             status: 'SUCCESS',
             amount: 1000
          }
      },
      // Note: Data Integrity Test: Adding a Bank Transaction as well. 
      // Prisma `create` allows creating multiple related transactions.
    }
  });

  // Adding Bank Transaction to d1 (Tests Data Integrity - should count as 1 donation)
  await prisma.paymentTransaction.create({
      data: {
          donationId: d1.id,
          source: 'BANK_STATEMENT',
          utr: 'UTR_B1_' + testRunId,
          status: 'SUCCESS',
          amount: 1000
      }
  });

  const d2 = await prisma.donation.create({
    data: {
      donorName: `Report Test 2 ${testRunId}`,
      amount: 2000,
      donatedAt: new Date(Date.now() - 86400000), // 1 day ago
      status: 'PENDING',
      paymentMethod: 'UPI'
    }
  });

  console.log('Seed completed.');

  // TEST 1: No filters
  const allWhere = buildDonationQuery({});
  const allCount = await prisma.donation.count({ where: allWhere });
  console.log(`[TEST 1] No filters count: ${allCount} (Should be >= 2)`);

  // TEST 2: Status filter
  const pendingWhere = buildDonationQuery({ status: 'PENDING' });
  const pendingCount = await prisma.donation.count({ where: pendingWhere });
  console.log(`[TEST 2] Status PENDING count: ${pendingCount} (Should be >= 1)`);

  // TEST 3: Payment Method filter
  const payuWhere = buildDonationQuery({ paymentMethod: 'PAYU' });
  const payuCount = await prisma.donation.count({ where: payuWhere });
  console.log(`[TEST 3] PaymentMethod PAYU count: ${payuCount} (Should be >= 1)`);

  // TEST 4: Trusted Source filter
  const bankWhere = buildDonationQuery({ trustedSource: 'BANK_STATEMENT' });
  const bankCount = await prisma.donation.count({ where: bankWhere });
  console.log(`[TEST 4] TrustedSource BANK count: ${bankCount} (Should be >= 1)`);

  // TEST 5: Donor Search
  const searchWhere = buildDonationQuery({ donorName: testRunId });
  const searchCount = await prisma.donation.count({ where: searchWhere });
  console.log(`[TEST 5] Donor Search count: ${searchCount} (Should be exactly 2)`);

  // TEST 6: UTR Search
  const utrWhere = buildDonationQuery({ utr: 'UTR_P1_' + testRunId });
  const utrCount = await prisma.donation.count({ where: utrWhere });
  console.log(`[TEST 6] UTR Search count: ${utrCount} (Should be exactly 1)`);

  // TEST 7: Data Integrity (Double record aggregation)
  const summary = await getDashboardSummary({ donorName: testRunId });
  console.log(`[TEST 7] Data Integrity Total Donations: ${summary.totalDonations} (Should be 2)`);
  console.log(`[TEST 7] Data Integrity Verified Amount: ${summary.totalVerifiedAmount} (Should be 1000, NOT 2000)`);

  // TEST 8: CSV Export format
  const exportData = await prisma.donation.findMany({
      where: searchWhere,
      include: {
          transactions: true,
          ocrResults: true,
          verificationAttempts: true,
      }
  });
  const csv = generateCSV(exportData);
  if (csv.includes(`Report Test 1 ${testRunId}`) && csv.includes('1000')) {
      console.log(`[TEST 8] CSV Export: Generated correctly with expected data.`);
  } else {
      console.error(`[TEST 8] CSV Export failed to include expected data.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
