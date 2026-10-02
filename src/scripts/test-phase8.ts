import { PrismaClient } from '@prisma/client';
import { generatePaymentHash } from '../lib/payu/hash';
import { payuConfig } from '../lib/payu/config';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data for Phase 8 PayU Webhooks...');

  const testRunId = Date.now();

  const d1 = await prisma.donation.create({
    data: {
      donorName: `Phase8 PayU Test 1 (Valid) ${testRunId}`,
      amount: 5000,
      donatedAt: new Date(),
      status: 'PENDING'
    }
  });

  const d2 = await prisma.donation.create({
    data: {
      donorName: `Phase8 PayU Test 2 (Amt Mismatch) ${testRunId}`,
      amount: 5000,
      donatedAt: new Date(),
      status: 'PENDING'
    }
  });

  const d3 = await prisma.donation.create({
    data: {
      donorName: `Phase8 PayU Test 3 (Fails) ${testRunId}`,
      amount: 2000,
      donatedAt: new Date(),
      status: 'PENDING'
    }
  });

  console.log('Donations created.');

  // Helper to trigger webhook
  const triggerWebhook = async (payload: any, testName: string) => {
    try {
      const res = await fetch('http://localhost:3000/api/payu/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log(`[${testName}] Status: ${res.status} ${await res.text()}`);
    } catch (e: any) {
      console.log(`[${testName}] Failed to call API: ${e.message}`);
    }
  };

  const createHash = (txnid: string, amount: string, status: string) => {
    const expectedHashString = `${payuConfig.merchantSalt}|${status}|||||||||||noreply@ngo.org|Donor|Donation|${amount}|${txnid}|${payuConfig.merchantKey}`;
    return crypto.createHash('sha512').update(expectedHashString).digest('hex');
  };

  // TEST 1: Valid successful PayU callback
  await triggerWebhook({
     txnid: d1.id,
     amount: '5000.00',
     status: 'success',
     mihpayid: 'PAYU' + Date.now(),
     bank_ref_num: 'UTR' + testRunId,
     email: 'noreply@ngo.org',
     firstname: 'Donor',
     productinfo: 'Donation',
     key: payuConfig.merchantKey,
     hash: createHash(d1.id, '5000.00', 'success')
  }, 'TEST 1: Valid Callback');

  // TEST 2: Amount mismatch
  await triggerWebhook({
     txnid: d2.id,
     amount: '4000.00',
     status: 'success',
     mihpayid: 'PAYU' + (Date.now() + 1),
     bank_ref_num: 'UTR888222',
     email: 'noreply@ngo.org',
     firstname: 'Donor',
     productinfo: 'Donation',
     key: payuConfig.merchantKey,
     hash: createHash(d2.id, '4000.00', 'success')
  }, 'TEST 2: Amount Mismatch');

  // TEST 3: Invalid signature
  await triggerWebhook({
     txnid: d3.id,
     amount: '2000.00',
     status: 'success',
     mihpayid: 'PAYU' + (Date.now() + 2),
     bank_ref_num: 'UTR888333',
     email: 'noreply@ngo.org',
     firstname: 'Donor',
     productinfo: 'Donation',
     key: payuConfig.merchantKey,
     hash: 'invalid_hash_string_123'
  }, 'TEST 3: Invalid Signature');
  
  // TEST 4: Unknown/Pending Status
  await triggerWebhook({
     txnid: d3.id,
     amount: '2000.00',
     status: 'pending',
     mihpayid: 'PAYU' + (Date.now() + 3),
     bank_ref_num: 'UTR888333',
     email: 'noreply@ngo.org',
     firstname: 'Donor',
     productinfo: 'Donation',
     key: payuConfig.merchantKey,
     hash: createHash(d3.id, '2000.00', 'pending')
  }, 'TEST 4: Unknown/Pending Status');

  // TEST 5: Wrong Merchant Key
  await triggerWebhook({
     txnid: d3.id,
     amount: '2000.00',
     status: 'success',
     mihpayid: 'PAYU' + (Date.now() + 4),
     bank_ref_num: 'UTR888333',
     email: 'noreply@ngo.org',
     firstname: 'Donor',
     productinfo: 'Donation',
     key: 'wrong_key',
     hash: createHash(d3.id, '2000.00', 'success')
  }, 'TEST 5: Wrong Merchant Key');

  // TEST 6: Failed payment
  await triggerWebhook({
     txnid: d3.id,
     amount: '2000.00',
     status: 'failure',
     mihpayid: 'PAYU' + (Date.now() + 5),
     bank_ref_num: 'UTR888333',
     email: 'noreply@ngo.org',
     firstname: 'Donor',
     productinfo: 'Donation',
     key: payuConfig.merchantKey,
     hash: createHash(d3.id, '2000.00', 'failure')
  }, 'TEST 6: Failed Payment');

  // TEST 7: Browser Redirect (Should not verify immediately)
  const txnid7 = d3.id;
  const browserPayload = {
     txnid: txnid7,
     amount: '2000.00',
     status: 'success',
     mihpayid: 'PAYU' + (Date.now() + 6),
     bank_ref_num: 'UTR_B' + testRunId,
     email: 'noreply@ngo.org',
     firstname: 'Donor',
     productinfo: 'Donation',
     key: payuConfig.merchantKey,
     hash: createHash(txnid7, '2000.00', 'success'),
     source: 'BROWSER_REDIRECT'
  };
  await triggerWebhook(browserPayload, 'TEST 7: Browser Redirect');

  // TEST 8: Valid webhook followed by Duplicate
  const duplicatePayload = {
     txnid: d3.id,
     amount: '2000.00',
     status: 'success',
     mihpayid: 'PAYU' + (Date.now() + 7),
     bank_ref_num: 'UTR_C' + testRunId,
     email: 'noreply@ngo.org',
     firstname: 'Donor',
     productinfo: 'Donation',
     key: payuConfig.merchantKey,
     hash: createHash(d3.id, '2000.00', 'success')
  };
  await triggerWebhook(duplicatePayload, 'TEST 8A: Valid webhook');
  await triggerWebhook(duplicatePayload, 'TEST 8B: Duplicate webhook');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
