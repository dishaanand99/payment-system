import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Basic connectivity check, do not expose internal DB metadata or paths
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Return safe generic error
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
