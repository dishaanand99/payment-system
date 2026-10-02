import prisma from '../prisma';
import { CreateNotificationParams } from './types';
import { Notification } from '@prisma/client';

export class NotificationRepository {
  async create(data: CreateNotificationParams): Promise<Notification | null> {
    try {
      // If idempotencyKey is provided, check if it already exists
      if (data.idempotencyKey) {
        const existing = await prisma.notification.findUnique({
          where: { idempotencyKey: data.idempotencyKey }
        });
        if (existing) {
          return existing; // Already processed
        }
      }

      return await prisma.notification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          priority: data.priority,
          recipientRole: data.recipientRole,
          recipientUserId: data.recipientUserId,
          donationId: data.donationId,
          bankTransactionId: data.bankTransactionId,
          paymentGatewayTransactionId: data.paymentGatewayTransactionId,
          idempotencyKey: data.idempotencyKey
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  async findForUser(userId: string, role: string, skip: number = 0, take: number = 20) {
    return await prisma.notification.findMany({
      where: {
        OR: [
          { recipientUserId: userId },
          { recipientRole: role },
          // SUPER_ADMIN gets ADMIN and VERIFIER notifications as well per rules if not restricted
          ...(role === 'SUPER_ADMIN' ? [{ recipientRole: 'ADMIN' }, { recipientRole: 'VERIFIER' }] : []),
          ...(role === 'ADMIN' ? [{ recipientRole: 'VERIFIER' }] : []), // Admin sees verifier notifications
        ]
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });
  }

  async countUnreadForUser(userId: string, role: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        isRead: false,
        OR: [
          { recipientUserId: userId },
          { recipientRole: role },
          ...(role === 'SUPER_ADMIN' ? [{ recipientRole: 'ADMIN' }, { recipientRole: 'VERIFIER' }] : []),
          ...(role === 'ADMIN' ? [{ recipientRole: 'VERIFIER' }] : []),
        ]
      }
    });
  }

  async markAsRead(notificationId: string, userId: string, role: string): Promise<boolean> {
    // Note: We ideally should check if the user is authorized to read it.
    // Given the role inheritance, it's safe to update if the OR clause matches.
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        OR: [
          { recipientUserId: userId },
          { recipientRole: role },
          ...(role === 'SUPER_ADMIN' ? [{ recipientRole: 'ADMIN' }, { recipientRole: 'VERIFIER' }] : []),
          ...(role === 'ADMIN' ? [{ recipientRole: 'VERIFIER' }] : []),
        ]
      }
    });

    if (!notification) return false;

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() }
    });
    return true;
  }

  async markAllAsRead(userId: string, role: string): Promise<void> {
    const notifications = await prisma.notification.findMany({
      where: {
        isRead: false,
        OR: [
          { recipientUserId: userId },
          { recipientRole: role },
          ...(role === 'SUPER_ADMIN' ? [{ recipientRole: 'ADMIN' }, { recipientRole: 'VERIFIER' }] : []),
          ...(role === 'ADMIN' ? [{ recipientRole: 'VERIFIER' }] : []),
        ]
      },
      select: { id: true }
    });

    const ids = notifications.map(n => n.id);
    if (ids.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: ids } },
        data: { isRead: true, readAt: new Date() }
      });
    }
  }
}
