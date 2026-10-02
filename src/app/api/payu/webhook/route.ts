import { NextRequest, NextResponse } from 'next/server';
import { PayUService } from '@/lib/payu/service';
import { PayUCallbackPayload } from '@/lib/payu/types';

// Webhooks are usually POST requests from PayU
export async function POST(req: NextRequest) {
  try {
    // PayU often sends form-urlencoded data for webhooks
    const contentType = req.headers.get('content-type') || '';
    let payload: Record<string, string> = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });
    } else if (contentType.includes('application/json')) {
      payload = await req.json();
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    const service = new PayUService();
    const result = await service.processCallback(payload as unknown as PayUCallbackPayload);

    // PayU expects a 200 OK
    return NextResponse.json({ status: 'success', processed: true }, { status: 200 });

  } catch (error: unknown) {
    console.error('PayU Webhook Error:', error);

    // Do NOT expose detailed errors in webhook response to potential attackers,
    // just return 400 or 500 depending on the nature.
    if (error instanceof Error && error.message === 'Invalid signature') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
