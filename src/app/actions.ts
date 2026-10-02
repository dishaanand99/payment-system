"use server";
import { createDonation } from "@/lib/services/donations";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession, requireAuth } from "@/lib/auth/session";
import { redirect } from "next/navigation";

import { checkDuplicateUTR } from "@/lib/services/donations";
import { saveScreenshot } from "@/lib/services/storage";
import { NotificationService } from "@/lib/notifications";

export async function submitDonationAction(prevState: any, formData: FormData) {
  try {
    const fullName = formData.get("fullName") as string;
    const mobile = formData.get("mobile") as string;
    const email = formData.get("email") as string;
    const amountStr = formData.get("amount") as string;
    const method = formData.get("method") as string;
    const utr = formData.get("utr") as string;
    const pan = formData.get("pan") as string;
    const address = formData.get("address") as string;
    const screenshot = formData.get("screenshot") as File;
    const consent = formData.get("consent");

    if (!fullName || fullName.length < 2) return { success: false, message: "Valid full name is required." };
    if (!mobile || mobile.length < 10) return { success: false, message: "Valid mobile number is required." };
    
    const amount = Number(amountStr);
    if (!amount || amount <= 0 || amount > 1000000) return { success: false, message: "Invalid donation amount." };
    
    if (!['UPI', 'Google Pay', 'Paytm', 'Bank Transfer', 'PayU'].includes(method)) {
      return { success: false, message: "Unsupported payment method." };
    }

    if (!consent) return { success: false, message: "Consent is required." };

    if (utr) {
      if (utr.length < 4) return { success: false, message: "Invalid UTR format." };
      const isDuplicate = await checkDuplicateUTR(utr);
      if (isDuplicate) return { success: false, message: "This transaction reference has already been submitted." };
    }

    let paymentScreenshotPath = null;
    if (screenshot && screenshot.size > 0) {
      const saveResult = await saveScreenshot(screenshot);
      if (!saveResult.success) {
        return { success: false, message: saveResult.error || "Failed to upload screenshot." };
      }
      paymentScreenshotPath = saveResult.path;
    }

    const data = { fullName, mobile, email, amount, method, utr, pan, address, paymentScreenshotPath };
    const donation = await createDonation(data);

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'DONATION_CREATED',
        entityType: 'Donation',
        entityId: donation.id,
      }
    });

    const notifService = new NotificationService();
    await notifService.triggerNewDonation(donation.id, donation.amount, donation.paymentMethod);


    if (paymentScreenshotPath) {
      await prisma.auditLog.create({
        data: {
          action: 'SCREENSHOT_UPLOADED',
          entityType: 'Donation',
          entityId: donation.id,
        }
      });
    }

    revalidatePath("/admin/donations");
    revalidatePath("/admin");
    return { success: true, message: "Donation submitted successfully." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to submit donation." };
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Invalid email or password.' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: 'Invalid email or password.' };
  }

  if (!user.isActive) {
    return { error: 'Your account is currently inactive.' };
  }

  await createSession({
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  // Log successful login
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
    }
  });

  redirect('/admin');
}

export async function logoutAction() {
  const sessionCookie = require('next/headers').cookies; // Wait, actually just call deleteSession
  await deleteSession();
  redirect('/admin/login');
}

export async function createUserAction(prevState: any, formData: FormData) {
  const session = await requireAuth();
  if (session.role !== 'SUPER_ADMIN') {
    return { error: 'Unauthorized to create users.' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  if (!name || !email || !password || !role) {
    return { error: 'All fields are required.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'Email already exists.' };
  }

  const { hashPassword } = await import('@/lib/auth/password');
  const passwordHash = await hashPassword(password);

  const newUser = await prisma.user.create({
    data: { name, email, role, passwordHash }
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser.id,
    }
  });

  redirect('/admin/users');
}

export async function toggleUserStatusAction(userId: string, formData?: FormData) {
  const session = await requireAuth();
  if (session.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized.');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found.');

  if (user.role === 'SUPER_ADMIN' && user.isActive) {
    const activeSuperAdmins = await prisma.user.count({
      where: { role: 'SUPER_ADMIN', isActive: true }
    });
    if (activeSuperAdmins <= 1) {
      throw new Error('Cannot deactivate the last active SUPER_ADMIN.');
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive }
  });

  revalidatePath('/admin/users');
}

