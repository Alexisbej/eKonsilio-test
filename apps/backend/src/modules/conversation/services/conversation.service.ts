import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConversationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WebsocketGateway } from '../../websocket/websocket.gateway';
import { CreateConversationDto } from '../dto/conversation.dto';
import { AgentAssignmentService } from './agent-assignment.service';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private prisma: PrismaService,
    private agentAssignmentService: AgentAssignmentService,
    private websocketGateway: WebsocketGateway,
  ) {}

  async createConversation(data: CreateConversationDto) {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const conversation = await prisma.conversation.create({
          data: {
            userId: data.userId,
            tenantId: data.tenantId,
            title: data.title || 'New Conversation',
            metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
            status: ConversationStatus.PENDING,
          },
          include: {
            user: true,
          },
        });

        const assignedAgent =
          await this.agentAssignmentService.assignAgentToConversation(
            conversation,
            data.requiredSkills,
            prisma,
          );

        if (assignedAgent) {
          this.websocketGateway.notifyAgentNewConversation(
            assignedAgent.id,
            conversation.id,
          );
        }

        return prisma.conversation.findUnique({
          where: { id: conversation.id },
          include: {
            user: true,
            agent: true,
          },
        });
      });
    } catch (error) {
      this.logger.error(
        `Error creating conversation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getAllAgentConversations(
    agentId: string,
    status?: ConversationStatus,
    page = 1,
    limit = 20,
  ) {
    try {
      const skip = (page - 1) * limit;
      const whereClause: Prisma.ConversationWhereInput = { agentId };

      if (status) {
        whereClause.status = status;
      }

      const [conversations, total] = await Promise.all([
        this.prisma.conversation.findMany({
          where: whereClause,
          include: {
            user: true,
            messages: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.conversation.count({ where: whereClause }),
      ]);

      return {
        conversations,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting agent conversations: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getConversation(id: string) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id },
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

      if (!conversation) {
        throw new NotFoundException(`Conversation with ID ${id} not found`);
      }

      return conversation;
    } catch (error) {
      this.logger.error(
        `Error getting conversation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async reassignConversation(
    conversationId: string,
    requiredSkills: string[] = [],
  ) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException(
          `Conversation with ID ${conversationId} not found`,
        );
      }

      const newAgent =
        await this.agentAssignmentService.assignAgentToConversation(
          conversation,
          requiredSkills,
        );

      if (newAgent) {
        this.websocketGateway.notifyAgentNewConversation(
          newAgent.id,
          conversationId,
        );
        return newAgent;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error reassigning conversation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async markConversationAsResolved(conversationId: string) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException(
          `Conversation with ID ${conversationId} not found`,
        );
      }

      const updatedConversation = await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: ConversationStatus.CLOSED,
        },
        include: {
          agent: true,
        },
      });

      if (updatedConversation.agent) {
        this.websocketGateway.notifyConversationResolved(
          updatedConversation.agent.id,
          conversationId,
        );
        await this.prisma.user.update({
          where: { id: updatedConversation.agent.id },
          data: {
            currentWorkload: Math.max(
              updatedConversation.agent.currentWorkload - 1,
              0,
            ),
          },
        });
      }

      return updatedConversation;
    } catch (error) {
      this.logger.error(
        `Error resolving conversation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getAgentConversations(agentId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const whereClause: Prisma.ConversationWhereInput = {
        agentId,
        status: {
          in: [ConversationStatus.PENDING, ConversationStatus.ACTIVE],
        },
      };

      const [conversations, total] = await Promise.all([
        this.prisma.conversation.findMany({
          where: whereClause,
          include: {
            user: true,
            messages: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.conversation.count({ where: whereClause }),
      ]);

      return {
        data: conversations,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting agent conversations: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
