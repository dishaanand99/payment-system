import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { NotificationService } from '@/lib/notifications';

export async function POST(_req: NextRequest) {
  try {
    const session = await requireAuth();
    
    const service = new NotificationService();
    await service.markAllAsRead(session.userId, session.role);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
