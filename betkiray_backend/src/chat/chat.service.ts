import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ChatService {
  constructor(private readonly databaseService: DatabaseService) {}

  // Find an existing chat between two users or create a new one
  async getOrCreateChat(user1Id: string, user2Id: string) {
    // Find a chat where both users are participants
    const existingChat = await this.databaseService.chat.findFirst({
      where: {
        participants: {
          every: {
            userId: { in: [user1Id, user2Id] },
          },
        },
      },
      select: { id: true }
    });

    if (existingChat) {
      return existingChat;
    }

    // If no chat exists, create a new one and add both users as participants
    const newChat = await this.databaseService.chat.create({
      data: {
        participants: {
          create: [{ userId: user1Id }, { userId: user2Id }],
        },
      },
    });
    return newChat;
  }
  
  // Create a new message in a chat
  async createMessage(chatId: string, senderId: string, content: string) {
    return this.databaseService.message.create({
      data: {
        chatId,
        senderId,
        content,
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      }
    });
  }

  // Get all chats for a specific user
  async getChatsForUser(userId: string) {
    return this.databaseService.chat.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get only the last message for the chat list preview
        },
      },
    });
  }
  
  // Get all messages for a specific chat
  async getMessagesForChat(chatId: string) {
    const chat = await this.databaseService.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
        throw new NotFoundException(`Chat with ID ${chatId} not found.`);
    }
    return this.databaseService.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' }, // Oldest messages first
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
      },
    });
  }
}