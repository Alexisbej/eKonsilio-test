import { z } from 'zod';

export const CreateVisitorSessionSchema = z.object({
  tenantId: z.string().uuid(),
});

export type CreateVisitorSessionDto = z.infer<
  typeof CreateVisitorSessionSchema
>;

export const UserProfileSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  googleId: z.string().optional(),
});

export type UserProfileDto = z.infer<typeof UserProfileSchema>;
