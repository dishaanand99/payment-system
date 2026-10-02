import prisma from '@/lib/prisma';

export async function getDashboardStats() {
  const [totalDonations, verified, pending, reviewRequired, rejected, duplicate, totalAmount, verifiedAmount] = await Promise.all([
    prisma.donation.count(),
    prisma.donation.count({ where: { status: 'VERIFIED' } }),
    prisma.donation.count({ where: { status: 'PENDING' } }),
    prisma.donation.count({ where: { status: 'NEEDS_MANUAL_REVIEW' } }),
    prisma.donation.count({ where: { status: 'REJECTED' } }),
    prisma.donation.count({ where: { status: 'DUPLICATE' } }),
    prisma.donation.aggregate({ _sum: { amount: true } }),
    prisma.donation.aggregate({ where: { status: 'VERIFIED' }, _sum: { amount: true } })
  ]);

  return {
    totalDonations,
    verified,
    pending,
    reviewRequired,
    rejected,
    duplicate,
    totalDonationAmount: totalAmount._sum.amount || 0,
    verifiedAmount: verifiedAmount._sum.amount || 0,
  };
}

export async function getDonations(limit?: number, search?: string, status?: string) {
  const where: any = {};
  
  if (search) {
    where.OR = [
      { id: { contains: search } },
      { donorName: { contains: search } },
      { donorEmail: { contains: search } },
      { donorPhone: { contains: search } },
      { utr: { contains: search } },
    ];
  }
  
  if (status) {
    where.status = status;
  }

  return prisma.donation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      ocrResults: true,
    }
  });
}

export async function getDonationById(id: string) {
  return prisma.donation.findUnique({
    where: { id },
    include: {
      ocrResults: true,
      transactions: true,
      notes: { include: { author: true } },
      verificationAttempts: { include: { verifier: true } }
    }
  });
}

export async function checkDuplicateUTR(utr: string) {
  if (!utr) return false;
  const existing = await prisma.donation.findUnique({ where: { utr } });
  return !!existing;
}

export async function createDonation(data: any) {
  try {
    return await prisma.donation.create({
      data: {
        donorName: data.fullName,
        donorPhone: data.mobile,
        donorEmail: data.email,
        donorPan: data.pan,
        donorAddress: data.address,
        amount: Number(data.amount),
        paymentMethod: data.method,
        utr: data.utr || null,
        paymentScreenshotPath: data.paymentScreenshotPath,
        status: 'PENDING'
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('A donation with this UTR already exists. Duplicate submission prevented.');
    }
    throw error;
  }
}
