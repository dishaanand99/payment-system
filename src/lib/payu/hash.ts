import crypto from 'crypto';
import { payuConfig } from './config';
import { PayUPaymentInitiation, PayUCallbackPayload } from './types';

/**
 * Request Hash Formula:
 * sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 */
export function generatePaymentHash(data: PayUPaymentInitiation): string {
  const hashString = `${payuConfig.merchantKey}|${data.txnid}|${data.amount}|${data.productinfo}|${data.firstname}|${data.email}|||||||||||${payuConfig.merchantSalt}`;
  return crypto.createHash('sha512').update(hashString).digest('hex');
}

/**
 * Response Hash Formula:
 * sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 *
 * If udf fields are empty, they are just empty strings between pipes.
 */
export function verifyCallbackHash(payload: PayUCallbackPayload): boolean {
  if (!payload.hash) return false;

  const udf1 = payload.udf1 || '';
  const udf2 = payload.udf2 || '';
  const udf3 = payload.udf3 || '';
  const udf4 = payload.udf4 || '';
  const udf5 = payload.udf5 || '';

  const expectedHashString = payload.additionalCharges 
    ? `${payload.additionalCharges}|${payuConfig.merchantSalt}|${payload.status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${payload.email}|${payload.firstname}|${payload.productinfo}|${payload.amount}|${payload.txnid}|${payuConfig.merchantKey}`
    : `${payuConfig.merchantSalt}|${payload.status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${payload.email}|${payload.firstname}|${payload.productinfo}|${payload.amount}|${payload.txnid}|${payuConfig.merchantKey}`;
  
  const expectedHash = crypto.createHash('sha512').update(expectedHashString).digest('hex');

  // Case-insensitive comparison just in case
  return expectedHash.toLowerCase() === payload.hash.toLowerCase();
}
