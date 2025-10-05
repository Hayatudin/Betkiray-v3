// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { DatabaseModule } from 'src/database/database.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [DatabaseModule, NotificationsModule, UsersModule],
  providers: [
    ChatGateway,
    ChatService,
  ],
  controllers: [ChatController],
})
export class ChatModule {}