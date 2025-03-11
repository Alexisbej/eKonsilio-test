import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
@Injectable()
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSocketMap = new Map<string, string[]>();
  private socketUserMap = new Map<string, string>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      let token = null;

      if (client.handshake.headers.cookie) {
        const cookies = client.handshake.headers.cookie
          .split(';')
          .reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
          }, {});

        token = cookies['auth_token'];
        if (!token) {
          token = cookies['visitor_token'];
        }
      }

      if (!token) {
        token =
          client.handshake.auth.token ||
          client.handshake.headers.authorization?.split(' ')[1];
      }

      if (!token) {
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;

      this.socketUserMap.set(client.id, userId);

      const userSockets = this.userSocketMap.get(userId) || [];
      userSockets.push(client.id);
      this.userSocketMap.set(userId, userSockets);

      client.join(`user:${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (user && (user.role === 'AGENT' || user.role === 'ADMIN')) {
        client.join('agents');
      }

      console.log(`Client connected: ${client.id} for user ${userId}`);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUserMap.get(client.id);

    if (userId) {
      this.socketUserMap.delete(client.id);

      const userSockets = this.userSocketMap.get(userId) || [];
      const updatedSockets = userSockets.filter(
        (socketId) => socketId !== client.id,
      );

      if (updatedSockets.length > 0) {
        this.userSocketMap.set(userId, updatedSockets);
      } else {
        this.userSocketMap.delete(userId);
      }
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const userId = this.socketUserMap.get(client.id);

    if (!userId || !data.conversationId || !data.content) {
      return { success: false, error: 'Invalid message data' };
    }

    try {
      const message = await this.prisma.message.create({
        data: {
          content: data.content,
          conversationId: data.conversationId,
          userId,
        },
        include: {
          user: true,
        },
      });

      await this.prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      });

      this.server
        .to(`conversation:${data.conversationId}`)
        .emit(`conversation:${data.conversationId}:message`, message);

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  notifyAgentNewConversation(agentId: string, conversationId: string) {
    this.server
      .to(`user:${agentId}`)
      .emit('new_conversation', { conversationId });
  }

  notifyConversationClosed(agentId: string, conversationId: string) {
    this.server
      .to(`user:${agentId}`)
      .emit('conversation_closed', { conversationId });
  }

  notifyConversationResolved(agentId: string, conversationId: string) {
    this.server
      .to(`user:${agentId}`)
      .emit('conversation_resolved', { conversationId });
  }
}
