import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { buildDonationQuery } from '@/lib/reports/filters';
import { generateExcelWorkbook } from '@/lib/reports/excel';
import { generateCSV } from '@/lib/reports/csv';
import prisma from '@/lib/prisma';
import { ReportFilters } from '@/lib/reports/types';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';

    const filters: ReportFilters = {
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      status: searchParams.get('status') || undefined,
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      trustedSource: searchParams.get('trustedSource') || undefined,
      donorName: searchParams.get('donorName') || undefined,
      utr: searchParams.get('utr') || undefined,
    };

    const where = buildDonationQuery(filters);

    // Hard limit to prevent memory exhaustion, per Phase 9 rules
    // Real-world might use streams for CSV, but Prisma doesn't natively stream well without batching.
    const MAX_EXPORT_LIMIT = 50000;
    
    const count = await prisma.donation.count({ where });
    if (count > MAX_EXPORT_LIMIT) {
       return NextResponse.json({ error: `Export exceeds maximum safe limit of ${MAX_EXPORT_LIMIT} rows. Please refine your date filters.` }, { status: 400 });
    }

    const donations = await prisma.donation.findMany({
      where,
      orderBy: { donatedAt: 'desc' },
      include: {
        transactions: true,
        ocrResults: true,
        verificationAttempts: true,
      }
    });

    // Audit Log for Export
    await prisma.auditLog.create({
       data: {
         userId: session.userId,
         action: format === 'xlsx' ? 'DONATION_XLSX_EXPORTED' : 'DONATION_CSV_EXPORTED',
         entityType: 'Report',
         entityId: 'export',
         newValues: JSON.stringify({ filters, count: donations.length })
       }
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `ngo-donations-${timestamp}`;

    if (format === 'xlsx') {
       const buffer = generateExcelWorkbook(donations);
       return new NextResponse(buffer as any, {
         status: 200,
         headers: {
           'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
           'Content-Disposition': `attachment; filename="${filename}.xlsx"`
         }
       });
    } else {
       const csv = generateCSV(donations);
       return new NextResponse(csv, {
         status: 200,
         headers: {
           'Content-Type': 'text/csv',
           'Content-Disposition': `attachment; filename="${filename}.csv"`
         }
       });
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to generate export. Please try again.' }, { status: 500 });
  }
}
