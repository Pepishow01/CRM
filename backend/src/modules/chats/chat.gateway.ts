import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://crmpepi.experienciadeviajes.com'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.config.get('jwt.secret'),
      });

      client.data.userId = payload.sub;
      client.data.role = payload.role;
      client.join(`user:${payload.sub}`);

      if (payload.role === 'admin') {
        client.join('admins');
      }

      this.logger.log(`Usuario ${payload.sub} conectado`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Socket ${client.id} desconectado`);
  }

  async emitNewMessage(data: {
    chatId: string;
    message: any;
    contact: any;
    assignedTo: string | null;
  }): Promise<void> {
    const eventData = {
      chatId: data.chatId,
      message: data.message,
      contact: data.contact,
    };

    if (data.assignedTo) {
      this.server.to(`user:${data.assignedTo}`).emit('chat:new-message', eventData);
    }

    this.server.to('admins').emit('chat:new-message', eventData);

    if (!data.assignedTo) {
      this.server.emit('chat:unassigned-message', eventData);
    }
  }

  @SubscribeMessage('chat:join')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ): void {
    client.join(`chat:${data.chatId}`);
  }

  @SubscribeMessage('chat:leave')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ): void {
    client.leave(`chat:${data.chatId}`);
  }
}