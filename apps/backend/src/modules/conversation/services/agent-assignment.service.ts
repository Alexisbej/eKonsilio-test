import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class AgentAssignmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Assigns the most appropriate agent to a conversation based on
   * skills, availability, and current workload
   */
  async assignAgentToConversation(
    conversationId: string,
    requiredSkills: string[] = [],
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { tenant: true },
    });

    if (!conversation) {
      throw new Error(`Conversation with ID ${conversationId} not found`);
    }

    const availableAgents = await this.prisma.user.findMany({
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

    if (availableAgents.length === 0) {
      console.log('No available agents found');
      return null;
    }

    const scoredAgents = availableAgents.map((agent) => {
      const skillMatchScore = this.calculateSkillMatchScore(
        agent.skills,
        requiredSkills,
      );

      const currentWorkload = agent.assignedConversations.length;
      const workloadScore = 1 - currentWorkload / agent.maxWorkload;

      const totalScore = skillMatchScore * 0.6 + workloadScore * 0.4;

      return {
        ...agent,
        score: totalScore,
        currentWorkload,
      };
    });

    scoredAgents.sort((a, b) => b.score - a.score);

    const selectedAgent = scoredAgents[0];

    if (selectedAgent) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          agentId: selectedAgent.id,
          status: 'ACTIVE',
        },
      });

      return selectedAgent;
    }

    return null;
  }

  /**
   * Calculate how well an agent's skills match the required skills
   * Returns a score between 0 and 1
   */
  private calculateSkillMatchScore(
    agentSkills: string[],
    requiredSkills: string[],
  ): number {
    if (requiredSkills.length === 0) return 1;

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
    return this.prisma.user.update({
      where: { id: agentId },
      data: { isAvailable },
    });
  }

  /**
   * Update agent skills
   */
  async updateAgentSkills(agentId: string, skills: string[]) {
    return this.prisma.user.update({
      where: { id: agentId },
      data: { skills },
    });
  }

  /**
   * Update agent maximum workload
   */
  async updateAgentMaxWorkload(agentId: string, maxWorkload: number) {
    return this.prisma.user.update({
      where: { id: agentId },
      data: { maxWorkload },
    });
  }
}
