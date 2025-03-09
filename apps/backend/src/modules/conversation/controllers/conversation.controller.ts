import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConversationStatus } from '@prisma/client';
import { Roles } from '../../auth/guards/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { AgentAssignmentService } from '../services/agent-assignment.service';
import { ConversationService } from '../services/conversation.service';

@Controller('conversations')
export class ConversationController {
  constructor(
    private conversationService: ConversationService,
    private agentAssignmentService: AgentAssignmentService,
  ) {}

  @Post()
  async createConversation(
    @Body()
    data: {
      userId: string;
      tenantId: string;
      title?: string;
      metadata?: any;
      requiredSkills?: string[];
    },
  ) {
    return this.conversationService.createConversation(data);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getConversation(@Param('id') id: string) {
    return this.conversationService.getConversation(id);
  }

  @Get('agent/:agentId/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'AGENT')
  async getAllAgentConversations(
    @Param('agentId') agentId: string,
    @Query('status') status?: ConversationStatus,
  ) {
    try {
      return this.conversationService.getAllAgentConversations(agentId, status);
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Failed to retrieve user conversations');
    }
  }

  @Put(':id/resolve')
  @UseGuards(AuthGuard('visitor-jwt'))
  async resolveConversation(@Param('id') id: string) {
    return this.conversationService.markConversationAsResolved(id);
  }

  @Get('agent/:agentId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'AGENT')
  async getAgentConversations(@Param('agentId') agentId: string) {
    return this.conversationService.getAgentConversations(agentId);
  }

  @Put(':id/reassign')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async reassignConversation(
    @Param('id') id: string,
    @Body() data: { requiredSkills?: string[] },
  ) {
    return this.conversationService.reassignConversation(
      id,
      data.requiredSkills,
    );
  }

  @Put(':id/close')
  @UseGuards(AuthGuard('jwt'))
  async closeConversation(@Param('id') id: string) {
    return this.conversationService.markConversationAsResolved(id);
  }

  @Put('agents/:id/availability')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'AGENT')
  async updateAgentAvailability(
    @Param('id') id: string,
    @Body() data: { isAvailable: boolean },
  ) {
    return this.agentAssignmentService.updateAgentAvailability(
      id,
      data.isAvailable,
    );
  }

  @Put('agents/:id/skills')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async updateAgentSkills(
    @Param('id') id: string,
    @Body() data: { skills: string[] },
  ) {
    return this.agentAssignmentService.updateAgentSkills(id, data.skills);
  }

  @Put('agents/:id/workload')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async updateAgentMaxWorkload(
    @Param('id') id: string,
    @Body() data: { maxWorkload: number },
  ) {
    return this.agentAssignmentService.updateAgentMaxWorkload(
      id,
      data.maxWorkload,
    );
  }
}
