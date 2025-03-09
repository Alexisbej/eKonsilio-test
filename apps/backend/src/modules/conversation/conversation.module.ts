import { Module } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { ConversationController } from './controllers/conversation.controller';
import { AgentAssignmentService } from './services/agent-assignment.service';
import { ConversationService } from './services/conversation.service';

@Module({
  imports: [WebsocketModule],
  controllers: [ConversationController],
  providers: [ConversationService, AgentAssignmentService, PrismaService],
  exports: [ConversationService, AgentAssignmentService],
})
export class ConversationModule {}
