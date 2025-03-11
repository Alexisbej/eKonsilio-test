import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConversationStatus } from '@prisma/client';
import { AgentAssignmentService } from '../services/agent-assignment.service';
import { ConversationService } from '../services/conversation.service';
import { ConversationController } from './conversation.controller';

describe('ConversationController', () => {
  let controller: ConversationController;
  let conversationService: jest.Mocked<ConversationService>;
  let agentAssignmentService: jest.Mocked<AgentAssignmentService>;

  const mockConversationService = {
    createConversation: jest.fn(),
    getConversation: jest.fn(),
    getAllAgentConversations: jest.fn(),
    getAgentConversations: jest.fn(),
    reassignConversation: jest.fn(),
    markConversationAsResolved: jest.fn(),
  };

  const mockAgentAssignmentService = {
    updateAgentAvailability: jest.fn(),
    updateAgentSkills: jest.fn(),
    updateAgentMaxWorkload: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationController],
      providers: [
        {
          provide: ConversationService,
          useValue: mockConversationService,
        },
        {
          provide: AgentAssignmentService,
          useValue: mockAgentAssignmentService,
        },
      ],
    }).compile();

    controller = module.get<ConversationController>(ConversationController);
    conversationService = module.get(ConversationService);
    agentAssignmentService = module.get(AgentAssignmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    const createConversationDto = {
      userId: 'user-123',
      tenantId: 'tenant-123',
      title: 'Test Conversation',
      requiredSkills: ['support', 'technical'],
      metadata: { priority: 'high' },
    };

    it('should create a new conversation successfully', async () => {
      const expectedResult = {
        id: 'conv-123',
        ...createConversationDto,
        status: ConversationStatus.PENDING,
      };
      mockConversationService.createConversation.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.createConversation(createConversationDto);

      expect(result).toEqual(expectedResult);
      expect(conversationService.createConversation).toHaveBeenCalledWith(
        createConversationDto,
      );
    });

    it('should handle errors during conversation creation', async () => {
      const error = new Error('Database error');
      mockConversationService.createConversation.mockRejectedValue(error);

      await expect(
        controller.createConversation(createConversationDto),
      ).rejects.toThrow(error);
    });
  });

  describe('getConversation', () => {
    const conversationId = 'conv-123';

    it('should retrieve a conversation by id', async () => {
      const expectedConversation = {
        id: conversationId,
        title: 'Test Conversation',
        status: ConversationStatus.ACTIVE,
      };
      mockConversationService.getConversation.mockResolvedValue(
        expectedConversation,
      );

      const result = await controller.getConversation(conversationId);

      expect(result).toEqual(expectedConversation);
      expect(conversationService.getConversation).toHaveBeenCalledWith(
        conversationId,
      );
    });

    it('should handle conversation not found', async () => {
      mockConversationService.getConversation.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(controller.getConversation(conversationId)).rejects.toThrow(
        'Not found',
      );
    });
  });

  describe('getAllAgentConversations', () => {
    const agentId = 'agent-123';
    const mockPagination = { page: '1', limit: '20' };

    it('should retrieve all agent conversations with pagination', async () => {
      const expectedResult = {
        conversations: [
          { id: 'conv-1', status: ConversationStatus.ACTIVE },
          { id: 'conv-2', status: ConversationStatus.PENDING },
        ],
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };
      mockConversationService.getAllAgentConversations.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getAllAgentConversations(
        agentId,
        ConversationStatus.ACTIVE,
        mockPagination.page,
        mockPagination.limit,
      );

      expect(result).toEqual(expectedResult);
      expect(conversationService.getAllAgentConversations).toHaveBeenCalledWith(
        agentId,
        ConversationStatus.ACTIVE,
        1,
        20,
      );
    });

    it('should handle invalid pagination parameters', async () => {
      await expect(
        controller.getAllAgentConversations(agentId, undefined, '-1', '0'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateAgentAvailability', () => {
    const agentId = 'agent-123';
    const availabilityData = { isAvailable: true };

    it('should update agent availability successfully', async () => {
      const expectedResult = { id: agentId, ...availabilityData };
      mockAgentAssignmentService.updateAgentAvailability.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.updateAgentAvailability(
        agentId,
        availabilityData,
      );

      expect(result).toEqual(expectedResult);
      expect(
        agentAssignmentService.updateAgentAvailability,
      ).toHaveBeenCalledWith(agentId, availabilityData.isAvailable);
    });

    it('should handle errors during availability update', async () => {
      mockAgentAssignmentService.updateAgentAvailability.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        controller.updateAgentAvailability(agentId, availabilityData),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('reassignConversation', () => {
    const conversationId = 'conv-123';
    const reassignData = { requiredSkills: ['technical', 'billing'] };

    it('should reassign conversation successfully', async () => {
      const expectedResult = { id: 'agent-456', name: 'New Agent' };
      mockConversationService.reassignConversation.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.reassignConversation(
        conversationId,
        reassignData,
      );

      expect(result).toEqual(expectedResult);
      expect(conversationService.reassignConversation).toHaveBeenCalledWith(
        conversationId,
        reassignData.requiredSkills,
      );
    });

    it('should handle reassignment failure', async () => {
      mockConversationService.reassignConversation.mockRejectedValue(
        new Error('Reassignment failed'),
      );

      await expect(
        controller.reassignConversation(conversationId, reassignData),
      ).rejects.toThrow('Reassignment failed');
    });
  });

  describe('resolveConversation', () => {
    const conversationId = 'conv-123';

    it('should resolve conversation successfully', async () => {
      const expectedResult = {
        id: conversationId,
        status: ConversationStatus.CLOSED,
      };
      mockConversationService.markConversationAsResolved.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.resolveConversation(conversationId);

      expect(result).toEqual(expectedResult);
      expect(
        conversationService.markConversationAsResolved,
      ).toHaveBeenCalledWith(conversationId);
    });

    it('should handle resolution failure', async () => {
      mockConversationService.markConversationAsResolved.mockRejectedValue(
        new Error('Resolution failed'),
      );

      await expect(
        controller.resolveConversation(conversationId),
      ).rejects.toThrow('Resolution failed');
    });
  });
});
