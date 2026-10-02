export interface PayUConfig {
  merchantKey: string;
  merchantSalt: string;
  environment: 'TEST' | 'PRODUCTION';
  baseUrl: string;
  successUrl: string;
  failureUrl: string;
}

export interface PayUPaymentInitiation {
  txnid: string;
  amount: number;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
}

export interface PayUCallbackPayload {
  mihpayid: string;
  mode: string;
  status: string;
  unmappedstatus: string;
  key: string;
  txnid: string;
  amount: string;
  additionalCharges?: string;
  cardCategory: string;
  discount_code: string;
  net_amount_debit: string;
  addedon: string;
  productinfo: string;
  firstname: string;
  lastname: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  email: string;
  phone: string;
  udf1: string;
  udf2: string;
  udf3: string;
  udf4: string;
  udf5: string;
  hash: string;
  error: string;
  error_Message: string;
  bank_ref_num: string;
  bankcode: string;
  payuMoneyId: string;
}

export type PayUStatus = 'success' | 'failure' | 'pending';
