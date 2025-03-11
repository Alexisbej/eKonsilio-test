import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Conversation, UserRole } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class AgentAssignmentService {
  private readonly logger = new Logger(AgentAssignmentService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Assigns the most appropriate agent to a conversation based on
   * skills, availability, and current workload
   */
  async assignAgentToConversation(
    conversation: Conversation,
    requiredSkills: string[] = [],
    tx?: any,
  ) {
    try {
      if (!conversation) {
        throw new NotFoundException(`Conversation not found`);
      }

      const prisma = tx || this.prisma;

      const availableAgents = await prisma.user.findMany({
        where: {
          role: UserRole.AGENT,
          tenantId: conversation.tenantId,
          isAvailable: true,
        },
        include: {
          assignedConversations: {
            where: {
              status: { in: ['PENDING', 'ACTIVE'] },
            },
          },
        },
      });

      if (!availableAgents.length) {
        this.logger.log('No available agents found');
        return null;
      }

      const availableAgentsWithCapacity = availableAgents.filter(
        (agent) => agent.currentWorkload < agent.maxWorkload,
      );

      if (!availableAgentsWithCapacity.length) {
        this.logger.log('No agents with available capacity found');
        return null;
      }

      const scoredAgents = availableAgentsWithCapacity.map((agent) => {
        const agentSkills = Array.isArray(agent.skills) ? agent.skills : [];

        const skillMatchScore = this.calculateSkillMatchScore(
          agentSkills,
          requiredSkills,
        );

        const workloadScore = 1 - agent.currentWorkload / agent.maxWorkload;
        const totalScore = skillMatchScore * 0.6 + workloadScore * 0.4;

        return {
          ...agent,
          score: totalScore,
        };
      });

      scoredAgents.sort((a, b) => b.score - a.score);
      const selectedAgent = scoredAgents[0];

      if (selectedAgent) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            agentId: selectedAgent.id,
            status: 'ACTIVE',
          },
        });

        await prisma.user.update({
          where: { id: selectedAgent.id },
          data: {
            currentWorkload: selectedAgent.currentWorkload + 1,
          },
        });

        return selectedAgent;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error assigning agent to conversation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate how well an agent's skills match the required skills
   * Returns a score between 0 and 1
   */
  private calculateSkillMatchScore(
    agentSkills: string[],
    requiredSkills: string[],
  ): number {
    if (!requiredSkills.length) return 1;
    if (!agentSkills.length) return 0;

    let matchCount = 0;
    for (const skill of requiredSkills) {
      if (agentSkills.includes(skill)) {
        matchCount++;
      }
    }

    return matchCount / requiredSkills.length;
  }

  /**
   * Update agent availability
   */
  async updateAgentAvailability(agentId: string, isAvailable: boolean) {
    try {
      const agent = await this.prisma.user.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new NotFoundException(`Agent with ID ${agentId} not found`);
      }

      return this.prisma.user.update({
        where: { id: agentId },
        data: { isAvailable },
      });
    } catch (error) {
      this.logger.error(
        `Error updating agent availability: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update agent skills
   */
  async updateAgentSkills(agentId: string, skills: string[]) {
    try {
      const agent = await this.prisma.user.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new NotFoundException(`Agent with ID ${agentId} not found`);
      }

      return this.prisma.user.update({
        where: { id: agentId },
        data: { skills },
      });
    } catch (error) {
      this.logger.error(
        `Error updating agent skills: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update agent maximum workload
   */
  async updateAgentMaxWorkload(agentId: string, maxWorkload: number) {
    try {
      const agent = await this.prisma.user.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new NotFoundException(`Agent with ID ${agentId} not found`);
      }

      return this.prisma.user.update({
        where: { id: agentId },
        data: { maxWorkload },
      });
    } catch (error) {
      this.logger.error(
        `Error updating agent workload: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
