import { PayUConfig } from './types';

// For development/testing, we fallback to dummy values if not provided.
// In production, an error should be thrown if secrets are missing.

export const payuConfig: PayUConfig = {
  merchantKey: process.env.PAYU_MERCHANT_KEY || 'gtKFFx', // Test Key
  merchantSalt: process.env.PAYU_MERCHANT_SALT || 'eCwWELxi', // Test Salt
  environment: (process.env.PAYU_ENVIRONMENT as 'TEST' | 'PRODUCTION') || 'TEST',
  baseUrl: process.env.PAYU_ENVIRONMENT === 'PRODUCTION' 
    ? 'https://secure.payu.in/_payment' 
    : 'https://test.payu.in/_payment',
  successUrl: process.env.PAYU_SUCCESS_URL || 'http://localhost:3000/donate/success',
  failureUrl: process.env.PAYU_FAILURE_URL || 'http://localhost:3000/donate/failure',
};
