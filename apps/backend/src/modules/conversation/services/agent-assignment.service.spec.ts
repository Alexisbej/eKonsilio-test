import { Test, TestingModule } from '@nestjs/testing';
import { ConversationStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AgentAssignmentService } from './agent-assignment.service';

describe('AgentAssignmentService', () => {
  let service: AgentAssignmentService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentAssignmentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AgentAssignmentService>(AgentAssignmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assignAgentToConversation', () => {
    const mockConversation = {
      id: 'conv-123',
      tenantId: 'tenant-1',
      status: ConversationStatus.PENDING,
      title: 'Test Conversation',
      userId: 'user-123',
      agentId: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should assign the most suitable agent based on skills and workload', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          role: UserRole.AGENT,
          skills: ['technical', 'billing'],
          isAvailable: true,
          currentWorkload: 2,
          maxWorkload: 5,
          assignedConversations: [],
        },
        {
          id: 'agent-2',
          role: UserRole.AGENT,
          skills: ['technical'],
          isAvailable: true,
          currentWorkload: 1,
          maxWorkload: 5,
          assignedConversations: [],
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockAgents);
      mockPrismaService.conversation.update.mockResolvedValue({
        ...mockConversation,
        agentId: 'agent-1',
      });
      mockPrismaService.user.update.mockResolvedValue(mockAgents[0]);

      const result = await service.assignAgentToConversation(mockConversation, [
        'technical',
        'billing',
      ]);

      expect(result).toBeDefined();
      expect(result.id).toBe('agent-1');
      expect(mockPrismaService.conversation.update).toHaveBeenCalledWith({
        where: { id: mockConversation.id },
        data: {
          agentId: 'agent-1',
          status: 'ACTIVE',
        },
      });
    });

    it('should return null when no agents are available', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.assignAgentToConversation(mockConversation, [
        'technical',
      ]);

      expect(result).toBeNull();
      expect(mockPrismaService.conversation.update).not.toHaveBeenCalled();
    });

    it('should handle agents at maximum workload', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          role: UserRole.AGENT,
          skills: ['technical'],
          isAvailable: true,
          currentWorkload: 5,
          maxWorkload: 5,
          assignedConversations: [],
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockAgents);

      const result = await service.assignAgentToConversation(mockConversation, [
        'technical',
      ]);

      expect(result).toBeNull();
      expect(mockPrismaService.conversation.update).not.toHaveBeenCalled();
    });

    it('should assign agent with best skill match even with higher workload', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          role: UserRole.AGENT,
          skills: ['technical', 'billing', 'support'],
          isAvailable: true,
          currentWorkload: 3,
          maxWorkload: 5,
          assignedConversations: [],
        },
        {
          id: 'agent-2',
          role: UserRole.AGENT,
          skills: ['technical'],
          isAvailable: true,
          currentWorkload: 1,
          maxWorkload: 5,
          assignedConversations: [],
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockAgents);
      mockPrismaService.conversation.update.mockResolvedValue({
        ...mockConversation,
        agentId: 'agent-1',
      });
      mockPrismaService.user.update.mockResolvedValue(mockAgents[0]);

      const result = await service.assignAgentToConversation(mockConversation, [
        'technical',
        'billing',
        'support',
      ]);

      expect(result).toBeDefined();
      expect(result.id).toBe('agent-1');
    });
  });

  describe('updateAgentAvailability', () => {
    const mockAgent = {
      id: 'agent-1',
      role: UserRole.AGENT,
      isAvailable: true,
    };

    it('should update agent availability status', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockAgent,
        isAvailable: false,
      });

      const result = await service.updateAgentAvailability('agent-1', false);

      expect(result.isAvailable).toBe(false);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: { isAvailable: false },
      });
    });

    it('should throw NotFoundException for non-existent agent', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAgentAvailability('non-existent', true),
      ).rejects.toThrow('Agent with ID non-existent not found');
    });
  });

  describe('updateAgentSkills', () => {
    const mockAgent = {
      id: 'agent-1',
      role: UserRole.AGENT,
      skills: ['technical'],
    };

    it('should update agent skills', async () => {
      const newSkills = ['technical', 'billing', 'support'];
      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockAgent,
        skills: newSkills,
      });

      const result = await service.updateAgentSkills('agent-1', newSkills);

      expect(result.skills).toEqual(newSkills);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: { skills: newSkills },
      });
    });

    it('should throw NotFoundException for non-existent agent', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAgentSkills('non-existent', []),
      ).rejects.toThrow('Agent with ID non-existent not found');
    });
  });

  describe('updateAgentMaxWorkload', () => {
    const mockAgent = {
      id: 'agent-1',
      role: UserRole.AGENT,
      maxWorkload: 5,
    };

    it('should update agent maximum workload', async () => {
      const newMaxWorkload = 8;
      mockPrismaService.user.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockAgent,
        maxWorkload: newMaxWorkload,
      });

      const result = await service.updateAgentMaxWorkload(
        'agent-1',
        newMaxWorkload,
      );

      expect(result.maxWorkload).toBe(newMaxWorkload);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: { maxWorkload: newMaxWorkload },
      });
    });

    it('should throw NotFoundException for non-existent agent', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAgentMaxWorkload('non-existent', 5),
      ).rejects.toThrow('Agent with ID non-existent not found');
    });
  });
});
