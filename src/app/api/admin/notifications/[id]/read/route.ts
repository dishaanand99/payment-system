import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { NotificationService } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    
    const service = new NotificationService();
    const success = await service.markAsRead(id, session.userId, session.role);
    
    if (!success) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
