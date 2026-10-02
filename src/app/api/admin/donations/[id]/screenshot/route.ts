import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { canViewDonation, Role } from '@/lib/auth/permissions';
import prisma from '@/lib/prisma';
import { createReadStream, existsSync } from 'fs';
import { stat } from 'fs/promises';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (!session || !canViewDonation(session.role as Role)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const donation = await prisma.donation.findUnique({
      where: { id },
      select: { paymentScreenshotPath: true }
    });

    if (!donation || !donation.paymentScreenshotPath) {
      return new NextResponse('Screenshot not found', { status: 404 });
    }

    const filePath = donation.paymentScreenshotPath;

    if (!existsSync(filePath)) {
      return new NextResponse('Screenshot file not found on disk', { status: 404 });
    }

    const fileStat = await stat(filePath);
    const fileStream = createReadStream(filePath) as any;

    let contentType = 'image/jpeg';
    if (filePath.endsWith('.png')) contentType = 'image/png';
    else if (filePath.endsWith('.webp')) contentType = 'image/webp';

    return new NextResponse(fileStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStat.size.toString(),
      },
    });
  } catch (error) {
    console.error('Screenshot retrieval error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
