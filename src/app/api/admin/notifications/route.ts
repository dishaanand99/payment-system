import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { NotificationService } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    
    const url = new URL(req.url);
    const skip = parseInt(url.searchParams.get('skip') || '0', 10);
    const take = parseInt(url.searchParams.get('take') || '20', 10);

    const service = new NotificationService();
    const notifications = await service.getUserNotifications(session.userId, session.role, skip, take);
    
    return NextResponse.json({ success: true, notifications });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
