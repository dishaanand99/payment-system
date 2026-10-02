import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { NotificationService } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();
    
    const service = new NotificationService();
    const count = await service.getUnreadCount(session.userId, session.role);
    
    return NextResponse.json({ success: true, count });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
