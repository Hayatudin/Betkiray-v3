// src/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private readonly expo = new Expo();
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async registerPushToken(userId: string, token: string) {
    this.logger.log(`Registering push token for user ${userId}`);
    return this.databaseService.user.update({
      where: { id: userId },
      data: { pushToken: token },
    });
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
}