import { injectable } from 'tsyringe';
import firebaseServices from '../services/firebase-admin';
import { PrismaClient } from '@prisma/client';
import { prisma } from './prismaClient';
const { db } = firebaseServices;
export interface NotificationPayload {
  title: string;
  body: string;
}
const { messaging } = firebaseServices;

@injectable()

export class FirebaseNotifier {



  public async sendNotification(userId: string, payload: NotificationPayload): Promise<void> {
    console.log("this function is activiated")
    const fcmTokens = await this.getFCMFromUserId(userId) ?? [];
    



    const messages  = fcmTokens.map(token => ({
      notification: {
        title: payload.title,
        body: payload.body,
      },
      token: token,
    }));

    try {
      const response = await messaging.sendEach(messages);
    } catch (error) {
      console.error('Error sending Firebase notification:', error);
      
      // If the token is invalid, it should be removed from your database.
      if (error.code === 'messaging/registration-token-not-registered') {
          console.error(`FCM token ${fcmToken} is no longer valid and should be removed.`);
      }
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
