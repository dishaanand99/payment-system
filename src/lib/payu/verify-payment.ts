import { payuConfig } from './config';
import crypto from 'crypto';

export interface PayUVerificationResponse {
  status: number;
  msg: string;
  transaction_details: Record<string, {
    mihpayid: string;
    request_id: string;
    bank_ref_num: string;
    amt: string;
    txnid: string;
    additional_charges: string;
    productinfo: string;
    firstname: string;
    bankcode: string;
    udf1: string;
    udf3: string;
    udf4: string;
    udf5: string;
    field2: string;
    field9: string;
    error_code: string;
    addedon: string;
    payment_source: string;
    card_type: string;
    error_Message: string;
    net_amount_debit: string;
    disc: string;
    mode: string;
    PG_TYPE: string;
    card_no: string;
    name_on_card: string;
    udf2: string;
    status: string;
    unmappedstatus: string;
    Merchant_UTR: string | null;
    Settled_At: string;
  }>;
}

export async function verifyPayUTxn(txnid: string): Promise<PayUVerificationResponse | null> {
  const command = 'verify_payment';
  
  // Hash formula: sha512(key|command|var1|salt)
  const hashString = `${payuConfig.merchantKey}|${command}|${txnid}|${payuConfig.merchantSalt}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');

  const endpoint = payuConfig.environment === 'PRODUCTION' 
      ? 'https://info.payu.in/merchant/postservice.php?form=2'
      : 'https://test.payu.in/merchant/postservice.php?form=2';

  const params = new URLSearchParams();
  params.append('key', payuConfig.merchantKey);
  params.append('hash', hash);
  params.append('var1', txnid);
  params.append('command', command);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json() as PayUVerificationResponse;
    return data;
  } catch (err) {
    console.error('PayU Verification API Error:', err);
    return null;
  }
}
