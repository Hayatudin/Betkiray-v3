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

// We add a specific port and namespace for clarity, which is good practice.
@WebSocketGateway({
  cors: {
    origin: '*', // This tells Socket.IO to allow all origins, including 'null' from file://
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  // --- Main handler for incoming messages ---
  @SubscribeMessage('sendMessage')
  async handleMessage(
    // Use decorators for cleaner access to client and data
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string; senderId: string; content: string },
  ): Promise<void> {
    
    this.logger.log(`[sendMessage] Client ${client.id} sent payload: ${JSON.stringify(payload)}`);

    try {
      const { chatId, senderId, content } = payload;
      const message = await this.chatService.createMessage(chatId, senderId, content);
      
      const roomName = `chat_${chatId}`;
      this.server.to(roomName).emit('receiveMessage', message);

      this.logger.log(`Broadcasted message to room: ${roomName}`);
    } catch (error) {
      this.logger.error(`Failed to handle message: ${error.message}`, error.stack);
      // Optional: emit an error back to the client
      client.emit('error', 'Failed to send message.');
    }
  }

  // --- Handler for joining a chat room ---
  @SubscribeMessage('joinChat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatId: string,
  ): void {
    const roomName = `chat_${chatId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room: ${roomName}`);
    // Optional: emit a confirmation back to the client
    client.emit('joinedChat', `Successfully joined room ${roomName}`);
  }

  // --- Lifecycle Hooks ---
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    // The client ID is now correctly logged
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}