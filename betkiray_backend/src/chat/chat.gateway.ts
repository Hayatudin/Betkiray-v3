import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string; senderId: string; content: string },
  ): Promise<void> {
    this.logger.log(`[sendMessage] Received payload: ${JSON.stringify(payload)}`);

    try {
      const { chatId, senderId, content } = payload;
      const message = await this.chatService.createMessage(chatId, senderId, content);

      const roomName = `chat_${chatId}`;
      this.server.to(roomName).emit('receiveMessage', message);
      this.logger.log(`Broadcasted message to room: ${roomName}`);

      const participants = await this.chatService.getChatParticipants(chatId);
      const recipients = participants.filter(p => p.userId !== senderId);

      for (const recipient of recipients) {
        const recipientUser = await this.usersService.findById(recipient.userId);
        if (recipientUser?.pushToken) {
          this.logger.log(`Sending push notification to user ${recipient.userId}`);
          await this.notificationsService.sendPushNotification(
            recipientUser.pushToken,
            `New message from ${message.sender.name}`,
            message.content,
            { chatId: chatId }
          );
        } else {
          this.logger.log(`User ${recipient.userId} has no push token. No notification sent.`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to handle message: ${error.message}`, error.stack);
      client.emit('error', 'Failed to send message.');
    }
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatId: string,
  ): void {
    const roomName = `chat_${chatId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room: ${roomName}`);
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}