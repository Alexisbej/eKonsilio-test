import { Test, TestingModule } from '@nestjs/testing';
import { ConversationStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WebsocketGateway } from '../../websocket/websocket.gateway';
import { AgentAssignmentService } from './agent-assignment.service';
import { ConversationService } from './conversation.service';

describe('ConversationService', () => {
  let service: ConversationService;

  const mockPrismaService = {
    conversation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockAgentAssignmentService = {
    assignAgentToConversation: jest.fn(),
  };

  const mockWebsocketGateway = {
    notifyAgentNewConversation: jest.fn(),
    notifyConversationResolved: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AgentAssignmentService,
          useValue: mockAgentAssignmentService,
        },
        {
          provide: WebsocketGateway,
          useValue: mockWebsocketGateway,
        },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    const createConversationDto = {
      userId: 'user-123',
      tenantId: 'tenant-123',
      title: 'Support Request',
      requiredSkills: ['technical', 'billing'],
      metadata: { priority: 'high' },
    };

    const mockUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
    };

    const mockAgent = {
      id: 'agent-123',
      name: 'Agent Smith',
      skills: ['technical', 'billing'],
    };

    const mockConversation = {
      id: 'conv-123',
      userId: 'user-123',
      tenantId: 'tenant-123',
      title: 'Support Request',
      status: ConversationStatus.PENDING,
      metadata: '{"priority":"high"}',
      user: mockUser,
    };

    it('should create a new conversation and assign an agent successfully', async () => {
      mockPrismaService.conversation.create.mockResolvedValueOnce(
        mockConversation,
      );
      mockAgentAssignmentService.assignAgentToConversation.mockResolvedValueOnce(
        mockAgent,
      );
      mockPrismaService.conversation.findUnique.mockResolvedValueOnce({
        ...mockConversation,
        agent: mockAgent,
      });

      const result = await service.createConversation(createConversationDto);

      expect(mockPrismaService.conversation.create).toHaveBeenCalledWith({
        data: {
          userId: createConversationDto.userId,
          tenantId: createConversationDto.tenantId,
          title: createConversationDto.title,
          metadata: JSON.stringify(createConversationDto.metadata),
          status: ConversationStatus.PENDING,
        },
        include: {
          user: true,
        },
      });

      expect(
        mockAgentAssignmentService.assignAgentToConversation,
      ).toHaveBeenCalledWith(
        mockConversation,
        createConversationDto.requiredSkills,
        mockPrismaService,
      );

      expect(
        mockWebsocketGateway.notifyAgentNewConversation,
      ).toHaveBeenCalledWith(mockAgent.id, mockConversation.id);

      expect(result).toEqual({
        ...mockConversation,
        agent: mockAgent,
      });
    });

    it('should create a conversation without an agent when none are available', async () => {
      mockPrismaService.conversation.create.mockResolvedValueOnce(
        mockConversation,
      );
      mockAgentAssignmentService.assignAgentToConversation.mockResolvedValueOnce(
        null,
      );
      mockPrismaService.conversation.findUnique.mockResolvedValueOnce(
        mockConversation,
      );

      const result = await service.createConversation(createConversationDto);

      expect(
        mockWebsocketGateway.notifyAgentNewConversation,
      ).not.toHaveBeenCalled();
      expect(result).toEqual(mockConversation);
    });

    it('should handle database errors during conversation creation', async () => {
      const error = new Error('Database connection failed');
      mockPrismaService.conversation.create.mockRejectedValueOnce(error);

      await expect(
        service.createConversation(createConversationDto),
      ).rejects.toThrow(error);
    });
  });

  describe('getConversation', () => {
    const conversationId = 'conv-123';
    const mockConversation = {
      id: conversationId,
      title: 'Support Request',
      status: ConversationStatus.ACTIVE,
      user: { id: 'user-123', name: 'John Doe' },
      agent: { id: 'agent-123', name: 'Agent Smith' },
      messages: [
        {
          id: 'msg-1',
          content: 'Hello, I need help',
          userId: 'user-123',
          createdAt: new Date(),
          user: { id: 'user-123', name: 'John Doe' },
        },
      ],
    };

    it('should retrieve a conversation with all related data', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValueOnce(
        mockConversation,
      );

      const result = await service.getConversation(conversationId);

      expect(mockPrismaService.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: conversationId },
        include: {
          user: true,
          agent: true,
          messages: {
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      expect(result).toEqual(mockConversation);
    });

    it('should throw NotFoundException when conversation is not found', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValueOnce(null);

      await expect(service.getConversation(conversationId)).rejects.toThrow(
        `Conversation with ID ${conversationId} not found`,
      );
    });
  });

  describe('markConversationAsResolved', () => {
    const conversationId = 'conv-123';
    const mockConversation = {
      id: conversationId,
      status: ConversationStatus.ACTIVE,
      agent: { id: 'agent-123', currentWorkload: 2 },
    };

    it('should mark a conversation as resolved and notify the agent', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValueOnce(
        mockConversation,
      );
      mockPrismaService.conversation.update.mockResolvedValueOnce({
        ...mockConversation,
        status: ConversationStatus.CLOSED,
      });
      mockPrismaService.user.update.mockResolvedValueOnce({
        id: mockConversation.agent.id,
        currentWorkload: mockConversation.agent.currentWorkload - 1,
      });

      const result = await service.markConversationAsResolved(conversationId);

      expect(mockPrismaService.conversation.update).toHaveBeenCalledWith({
        where: { id: conversationId },
        data: { status: ConversationStatus.CLOSED },
        include: { agent: true },
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockConversation.agent.id },
        data: {
          currentWorkload: mockConversation.agent.currentWorkload - 1,
        },
      });

      expect(
        mockWebsocketGateway.notifyConversationResolved,
      ).toHaveBeenCalledWith(mockConversation.agent.id, conversationId);

      expect(result.status).toBe(ConversationStatus.CLOSED);
    });

    it('should throw NotFoundException when conversation does not exist', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.markConversationAsResolved(conversationId),
      ).rejects.toThrow(`Conversation with ID ${conversationId} not found`);
    });
  });
});
