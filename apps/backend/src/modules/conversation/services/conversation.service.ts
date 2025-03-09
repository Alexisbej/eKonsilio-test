import { Injectable } from '@nestjs/common';
import { ConversationStatus } from '@prisma/client';
import { WebsocketGateway } from 'src/modules/websocket/websocket.gateway';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AgentAssignmentService } from './agent-assignment.service';

@Injectable()
export class ConversationService {
  constructor(
    private prisma: PrismaService,
    private agentAssignmentService: AgentAssignmentService,
    private websocketGateway: WebsocketGateway,
  ) {}

  async createConversation(data: {
    userId: string;
    tenantId: string;
    title?: string;
    metadata?: any;
    requiredSkills?: string[];
  }) {
    const conversation = await this.prisma.conversation.create({
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
        conversation.id,
        data.requiredSkills,
      );

    if (assignedAgent) {
      this.websocketGateway.notifyAgentNewConversation(
        assignedAgent.id,
        conversation.id,
      );
    }

    return this.prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        user: true,
        agent: true,
      },
    });
  }

  async getAllAgentConversations(agentId: string, status?: ConversationStatus) {
    const whereClause: any = {
      agentId,
    };

    if (status) {
      whereClause.status = status;
    }

    return this.prisma.conversation.findMany({
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
    });
  }

  async getConversation(id: string) {
    return this.prisma.conversation.findUnique({
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
  }

  async reassignConversation(
    conversationId: string,
    requiredSkills: string[] = [],
  ) {
    const newAgent =
      await this.agentAssignmentService.assignAgentToConversation(
        conversationId,
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
  }

  async markConversationAsResolved(conversationId: string) {
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
    }

    return updatedConversation;
  }

  async getAgentConversations(agentId: string) {
    return this.prisma.conversation.findMany({
      where: {
        agentId,
        status: {
          in: [ConversationStatus.PENDING, ConversationStatus.ACTIVE],
        },
      },
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
    });
  }
}
