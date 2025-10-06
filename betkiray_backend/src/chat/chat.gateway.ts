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
  private userSocketMap = new Map<string, string>();

  private emitOnlineUsers() {
    const onlineUserIds = Array.from(this.userSocketMap.keys());
    this.server.emit('onlineUsers', onlineUserIds);
    this.logger.log(`Broadcasted online users: [${onlineUserIds.join(', ')}]`);
  }

  @SubscribeMessage('registerUser')
  handleRegisterUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ): void {
    this.userSocketMap.set(userId, client.id);
    this.emitOnlineUsers();
  }

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
          this.logger.log(`User ${recipient.userId} has no push token.`);
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
    const onlineUserIds = Array.from(this.userSocketMap.keys());
    client.emit('onlineUsers', onlineUserIds);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    let disconnectedUserId: string | null = null;
    for (const [userId, socketId] of this.userSocketMap.entries()) {
      if (socketId === client.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    if (disconnectedUserId) {
      this.userSocketMap.delete(disconnectedUserId);
      this.emitOnlineUsers();
    }
  }
}