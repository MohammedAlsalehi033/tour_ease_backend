import { injectable } from 'tsyringe';
import firebaseServices from '../services/firebase-admin';
import { prisma } from './prismaClient';

export interface NotificationPayload {
  title: string;
  body: string;
  type?: string; // optional categorization, e.g. OFFER, CHAT, BOOKING, ADMIN, REQUEST
  data?: Record<string, any>; // additional payload data for deep linking or context
  priority?: 'normal' | 'high'; // notification priority
  actionRequired?: boolean; // whether user action is required
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

    // Build the FCM message with enhanced data
    const messages = fcmTokens.map(token => ({
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        type: payload.type ?? 'PUSH',
        timestamp: new Date().toISOString(),
        actionRequired: payload.actionRequired ? 'true' : 'false',
        ...(payload.data ? Object.fromEntries(
          Object.entries(payload.data).map(([k, v]) => [k, String(v)])
        ) : {})
      },
      android: {
        priority: (payload.priority === 'high' ? 'high' : 'normal') as 'high' | 'normal',
        notification: {
          channelId: payload.type?.toLowerCase() || 'general',
          priority: (payload.priority === 'high' ? 'high' : 'default') as 'high' | 'default',
          tag: payload.type?.toLowerCase(),
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body
            },
            category: payload.type?.toLowerCase(),
            'content-available': payload.actionRequired ? 1 : 0
          }
        }
      },
      token,
    }));

    if (messages.length === 0) {
      return;
    }

    try {
      const response = await messaging.sendEach(messages);
      
      // Log results for monitoring
      const successCount = response.responses.filter(r => r.success).length;
      const failureCount = response.responses.length - successCount;
      
      if (failureCount > 0) {
        console.warn(`Notification sending: ${successCount} succeeded, ${failureCount} failed for user ${userId}`);
      }
      
    } catch (error) {
      console.error('Error sending Firebase notification:', error);
    }
  }

  /**
   * Send notification with contextual information for better user experience
   */
  public async sendContextualNotification(
    userId: string,
    notificationType: string,
    context: {
      title: string;
      body: string;
      entityId?: string | number;
      entityType?: string;
      actionUrl?: string;
      priority?: 'normal' | 'high';
      actionRequired?: boolean;
      relatedUserId?: string;
      relatedUserName?: string;
    }
  ): Promise<void> {
    const payload: NotificationPayload = {
      title: context.title,
      body: context.body,
      type: notificationType,
      priority: context.priority || 'normal',
      actionRequired: context.actionRequired || false,
      data: {
        ...(context.entityId && { entityId: String(context.entityId) }),
        ...(context.entityType && { entityType: context.entityType }),
        ...(context.actionUrl && { actionUrl: context.actionUrl }),
        ...(context.relatedUserId && { relatedUserId: context.relatedUserId }),
        ...(context.relatedUserName && { relatedUserName: context.relatedUserName }),
      }
    };

    await this.sendNotification(userId, payload);
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
