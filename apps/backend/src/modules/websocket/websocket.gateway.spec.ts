import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import { PrismaService } from '../../../prisma/prisma.service';
import { WebsocketGateway } from './websocket.gateway';

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  const mockSocket = {
    id: 'test-socket-id',
    handshake: {
      headers: {},
      auth: {},
    },
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
  } as unknown as Socket;

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'AGENT',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketGateway,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn().mockReturnValue({ sub: mockUser.id }),
            sign: jest.fn().mockReturnValue('mock-token'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue(mockUser),
            },
            message: {
              create: jest.fn().mockImplementation((data) => ({
                id: 'test-message-id',
                ...data.data,
                createdAt: new Date(),
              })),
            },
            conversation: {
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    gateway = module.get<WebsocketGateway>(WebsocketGateway);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
    gateway.server = mockServer as any;
  });

  describe('handleConnection', () => {
    it('should successfully connect with valid auth token in cookie', async () => {
      const mockSocketWithCookie = {
        ...mockSocket,
        handshake: {
          headers: {
            cookie: 'auth_token=valid-token',
          },
          auth: {},
        },
      } as unknown as Socket;

      await gateway.handleConnection(mockSocketWithCookie);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(mockSocketWithCookie.join).toHaveBeenCalledWith(
        `user:${mockUser.id}`,
      );
      expect(mockSocketWithCookie.join).toHaveBeenCalledWith('agents');
    });

    it('should successfully connect with valid visitor token', async () => {
      const mockSocketWithVisitor = {
        ...mockSocket,
        handshake: {
          headers: {
            cookie: 'visitor_token=valid-visitor-token',
          },
          auth: {},
        },
      } as unknown as Socket;

      await gateway.handleConnection(mockSocketWithVisitor);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-visitor-token');
      expect(mockSocketWithVisitor.join).toHaveBeenCalledWith(
        `user:${mockUser.id}`,
      );
    });

    it('should disconnect when no valid token is provided', async () => {
      const mockSocketNoToken = {
        ...mockSocket,
        handshake: {
          headers: {},
          auth: {},
        },
      } as unknown as Socket;

      await gateway.handleConnection(mockSocketNoToken);

      expect(mockSocketNoToken.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should clean up user socket mappings on disconnect', () => {
      gateway['socketUserMap'].set(mockSocket.id, mockUser.id);
      gateway['userSocketMap'].set(mockUser.id, [mockSocket.id]);

      gateway.handleDisconnect(mockSocket);

      expect(gateway['socketUserMap'].has(mockSocket.id)).toBeFalsy();
      expect(gateway['userSocketMap'].has(mockUser.id)).toBeFalsy();
    });
  });

  describe('handleJoinConversation', () => {
    it('should join a conversation room', () => {
      const result = gateway.handleJoinConversation(mockSocket, {
        conversationId: 'test-conv-id',
      });

      expect(mockSocket.join).toHaveBeenCalledWith('conversation:test-conv-id');
      expect(result).toEqual({ success: true });
    });
  });

  describe('handleLeaveConversation', () => {
    it('should leave a conversation room', () => {
      const result = gateway.handleLeaveConversation(mockSocket, {
        conversationId: 'test-conv-id',
      });

      expect(mockSocket.leave).toHaveBeenCalledWith(
        'conversation:test-conv-id',
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('handleSendMessage', () => {
    it('should successfully send a message to a conversation', async () => {
      gateway['socketUserMap'].set(mockSocket.id, mockUser.id);

      const messageData = {
        conversationId: 'test-conv-id',
        content: 'Hello, world!',
      };

      const result = await gateway.handleSendMessage(mockSocket, messageData);

      expect(prismaService.message.create).toHaveBeenCalledWith({
        data: {
          content: messageData.content,
          conversationId: messageData.conversationId,
          userId: mockUser.id,
        },
        include: {
          user: true,
        },
      });

      expect(mockServer.to).toHaveBeenCalledWith(
        `conversation:${messageData.conversationId}`,
      );
      expect(mockServer.emit).toHaveBeenCalled();
      expect(result.success).toBeTruthy();
    });

    it('should handle invalid message data', async () => {
      const result = await gateway.handleSendMessage(mockSocket, {
        conversationId: '',
        content: '',
      });

      expect(result.success).toBeFalsy();
      expect(result.error).toBe('Invalid message data');
    });
  });

  describe('Notification Methods', () => {
    it('should notify agent of new conversation', () => {
      gateway.notifyAgentNewConversation('agent-id', 'conv-id');

      expect(mockServer.to).toHaveBeenCalledWith('user:agent-id');
      expect(mockServer.emit).toHaveBeenCalledWith('new_conversation', {
        conversationId: 'conv-id',
      });
    });

    it('should notify agent of closed conversation', () => {
      gateway.notifyConversationClosed('agent-id', 'conv-id');

      expect(mockServer.to).toHaveBeenCalledWith('user:agent-id');
      expect(mockServer.emit).toHaveBeenCalledWith('conversation_closed', {
        conversationId: 'conv-id',
      });
    });

    it('should notify agent of resolved conversation', () => {
      gateway.notifyConversationResolved('agent-id', 'conv-id');

      expect(mockServer.to).toHaveBeenCalledWith('user:agent-id');
      expect(mockServer.emit).toHaveBeenCalledWith('conversation_resolved', {
        conversationId: 'conv-id',
      });
    });
  });
});
