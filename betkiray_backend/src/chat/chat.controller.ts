import { Controller, Get, Param, ParseIntPipe, UseGuards, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';

@UseGuards(AuthGuard('jwt'))
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Get all chat conversations for the logged-in user
  @Get()
  getChatsForUser(@GetUser() user: User) {
    return this.chatService.getChatsForUser(user.id);
  }
  
  // Get the message history for a specific chat
  @Get(':id/messages')
  getMessagesForChat(@Param('id') id: string) {
    return this.chatService.getMessagesForChat(id);
  }

  // Endpoint to start a new chat (or get the existing one)
  @Post('initiate')
  initiateChat(@GetUser() user: User, @Body('recipientId') recipientId: string) {
    return this.chatService.getOrCreateChat(user.id, recipientId);
  }
}