// src/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private readonly expo = new Expo();
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly databaseService: DatabaseService) { }

  async registerPushToken(userId: string, token: string) {
    this.logger.log(`Registering push token for user ${userId}`);

    // First, clear this token from any other user to avoid unique constraint violation
    // (A device can only belong to one user at a time)
    await this.databaseService.user.updateMany({
      where: { pushToken: token },
      data: { pushToken: null },
    });

    const updatedUser = await this.databaseService.user.update({
      where: { id: userId },
      data: { pushToken: token },
    });
    this.logger.log(`Successfully updated user ${userId} with token. DB Result Token: ${updatedUser.pushToken}`);
    return updatedUser;
  }

  async sendPushNotification(pushToken: string, title: string, body: string, data?: Record<string, unknown>) {
    if (!Expo.isExpoPushToken(pushToken)) {
      this.logger.error(`Push token ${pushToken} is not a valid Expo push token`);
      return;
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      const ticket = await this.expo.sendPushNotificationsAsync([message]);
      this.logger.log('Push notification ticket:', ticket);
    } catch (error) {
      this.logger.error('Error sending push notification:', error);
    }
  }

  async sendTestNotification(userId: string) {
    const user = await this.databaseService.user.findUnique({ where: { id: userId } });
    if (!user || !user.pushToken) {
      throw new Error('User has no push token');
    }

    await this.sendPushNotification(
      user.pushToken,
      'Test Notification',
      'This is a test notification from Betkiray!',
      { test: true },
    );

    return { success: true };
  }
}