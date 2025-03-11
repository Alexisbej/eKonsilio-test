import { ConversationStatus } from '@prisma/client';
import { z } from 'zod';

export const CreateConversationSchema = z.object({
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
  title: z.string().optional(),
  metadata: z.any().optional(),
  requiredSkills: z.array(z.string()).optional(),
});

export type CreateConversationDto = z.infer<typeof CreateConversationSchema>;

export const ReassignConversationSchema = z.object({
  requiredSkills: z.array(z.string()).optional(),
});

export type ReassignConversationDto = z.infer<
  typeof ReassignConversationSchema
>;

export const UpdateAgentAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export type UpdateAgentAvailabilityDto = z.infer<
  typeof UpdateAgentAvailabilitySchema
>;

export const UpdateAgentSkillsSchema = z.object({
  skills: z.array(z.string()),
});

export type UpdateAgentSkillsDto = z.infer<typeof UpdateAgentSkillsSchema>;

export const UpdateAgentWorkloadSchema = z.object({
  maxWorkload: z.number().int().positive(),
});

export type UpdateAgentWorkloadDto = z.infer<typeof UpdateAgentWorkloadSchema>;

export const ConversationStatusSchema = z.nativeEnum(ConversationStatus);
