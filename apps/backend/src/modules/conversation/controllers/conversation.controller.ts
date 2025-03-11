import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConversationStatus } from '@prisma/client';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Roles } from '../../auth/guards/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

import {
  ConversationStatusSchema,
  CreateConversationDto,
  CreateConversationSchema,
  ReassignConversationSchema,
  UpdateAgentAvailabilitySchema,
  UpdateAgentSkillsSchema,
  UpdateAgentWorkloadSchema,
} from '../dto/conversation.dto';
import { AgentAssignmentService } from '../services/agent-assignment.service';
import { ConversationService } from '../services/conversation.service';

@Controller('conversations')
export class ConversationController {
  private readonly logger = new Logger(ConversationController.name);

  constructor(
    private conversationService: ConversationService,
    private agentAssignmentService: AgentAssignmentService,
  ) {}

  @Post()
  async createConversation(
    @Body(new ZodValidationPipe(CreateConversationSchema))
    data: CreateConversationDto,
  ) {
    try {
      return await this.conversationService.createConversation(data);
    } catch (error) {
      this.logger.error(`Error creating conversation: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getConversation(@Param('id') id: string) {
    try {
      return await this.conversationService.getConversation(id);
    } catch (error) {
      this.logger.error(`Error getting conversation: ${error.message}`);
      throw error;
    }
  }

  @Get('agent/:agentId/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'AGENT')
  async getAllAgentConversations(
    @Param('agentId') agentId: string,
    @Query('status', new ZodValidationPipe(ConversationStatusSchema, true))
    status?: ConversationStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 20;

      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        throw new BadRequestException('Invalid pagination parameters');
      }

      return await this.conversationService.getAllAgentConversations(
        agentId,
        status,
        pageNum,
        limitNum,
      );
    } catch (error) {
      this.logger.error(
        `Error retrieving agent conversations: ${error.message}`,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to retrieve user conversations');
    }
  }

  @Put(':id/resolve')
  @UseGuards(AuthGuard('visitor-jwt'))
  async resolveConversation(@Param('id') id: string) {
    try {
      return await this.conversationService.markConversationAsResolved(id);
    } catch (error) {
      this.logger.error(`Error resolving conversation: ${error.message}`);
      throw error;
    }
  }

  @Get('agent/:agentId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'AGENT')
  async getAgentConversations(
    @Param('agentId') agentId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 20;

      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        throw new BadRequestException('Invalid pagination parameters');
      }

      return await this.conversationService.getAgentConversations(
        agentId,
        pageNum,
        limitNum,
      );
    } catch (error) {
      this.logger.error(
        `Error retrieving agent conversations: ${error.message}`,
      );
      throw error;
    }
  }

  @Put(':id/reassign')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async reassignConversation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReassignConversationSchema))
    data: { requiredSkills?: string[] },
  ) {
    try {
      return await this.conversationService.reassignConversation(
        id,
        data.requiredSkills,
      );
    } catch (error) {
      this.logger.error(`Error reassigning conversation: ${error.message}`);
      throw error;
    }
  }

  @Put(':id/close')
  @UseGuards(AuthGuard('jwt'))
  async closeConversation(@Param('id') id: string) {
    return this.resolveConversation(id);
  }

  @Put('agents/:id/availability')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'AGENT')
  async updateAgentAvailability(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAgentAvailabilitySchema))
    data: { isAvailable: boolean },
  ) {
    try {
      return await this.agentAssignmentService.updateAgentAvailability(
        id,
        data.isAvailable,
      );
    } catch (error) {
      this.logger.error(`Error updating agent availability: ${error.message}`);
      throw error;
    }
  }

  @Put('agents/:id/skills')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async updateAgentSkills(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAgentSkillsSchema))
    data: { skills: string[] },
  ) {
    try {
      return await this.agentAssignmentService.updateAgentSkills(
        id,
        data.skills,
      );
    } catch (error) {
      this.logger.error(`Error updating agent skills: ${error.message}`);
      throw error;
    }
  }

  @Put('agents/:id/workload')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async updateAgentMaxWorkload(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAgentWorkloadSchema))
    data: { maxWorkload: number },
  ) {
    try {
      return await this.agentAssignmentService.updateAgentMaxWorkload(
        id,
        data.maxWorkload,
      );
    } catch (error) {
      this.logger.error(`Error updating agent workload: ${error.message}`);
      throw error;
    }
  }
}
