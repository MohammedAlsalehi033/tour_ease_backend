import { injectable } from 'tsyringe';
import firebaseServices from '../services/firebase-admin';
import { prisma } from './prismaClient';

export interface NotificationPayload {
  title: string;
  body: string;
  type?: string; // optional categorization, e.g. OFFER, CHAT, BOOKING
}

const { messaging } = firebaseServices;

@injectable()
export class FirebaseNotifier {
  public async sendNotification(userId: string, payload: NotificationPayload): Promise<void> {
    // Persist notification record first (visible in notification center even if no tokens)
    try {
      await prisma.notification.create({
        data: {
          userId,
          message: `${payload.title}: ${payload.body}`,
          type: payload.type ?? 'PUSH',
        },
      });
    } catch (persistError) {
      // Log and continue with push attempt
      console.error('Error persisting notification:', persistError);
    }

    const fcmTokens = (await this.getFCMFromUserId(userId)) ?? [];

    const messages = fcmTokens.map(token => ({
      notification: {
        title: payload.title,
        body: payload.body,
      },
      token,
    }));

    if (messages.length === 0) {
      return;
    }

    try {
      await messaging.sendEach(messages);
    } catch (error) {
      console.error('Error sending Firebase notification:', error);
    }
  }

  private async getFCMFromUserId(userId: string): Promise<string[]> {
    const userFCM = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmTokens: true },
    });

    const allTokens = userFCM?.fcmTokens || [];
    return [...new Set(allTokens)] as string[];
  }
}
