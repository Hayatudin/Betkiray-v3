// src/chat/chat.module.ts

import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [
    ChatGateway, // The gateway needs to be here
    ChatService,   // And the service it depends on must ALSO be here
  ],
  controllers: [ChatController],
})
export class ChatModule {}