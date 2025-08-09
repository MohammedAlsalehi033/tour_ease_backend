import { injectable } from 'tsyringe';
import firebaseServices from '../services/firebase-admin';
const { db } = firebaseServices;
export interface NotificationPayload {
  title: string;
  body: string;
}
const { messaging } = firebaseServices;

@injectable()

export class FirebaseNotifier {



  public async sendNotification(fcmToken: string, payload: NotificationPayload): Promise<void> {
    if (!fcmToken) {
      console.error("FCM token was null or empty. Aborting send.");
      return;
    }

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      token: fcmToken,
    };

    try {
      console.log(`Attempting to send notification to token: ${fcmToken}`);
      const response = await messaging.send(message);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending Firebase notification:', error);
      
      // If the token is invalid, it should be removed from your database.
      if (error.code === 'messaging/registration-token-not-registered') {
          console.error(`FCM token ${fcmToken} is no longer valid and should be removed.`);
      }
    }
  }
}
