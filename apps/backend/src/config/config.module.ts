import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),

  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('3000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  JWT_SECRET: z.string(),
  JWT_EXPIRATION: z.string().default('1d'),
  VISITOR_JWT_SECRET: z.string(),
  VISITOR_JWT_EXPIRATION: z.string().default('7d'),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z
    .string()
    .default('http://localhost:3000/auth/google/callback'),

  FRONTEND_URL: z.string().default('http://localhost:3000'),
  VISITOR_URL: z.string().default('http://localhost:3002'),
});

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        try {
          return envSchema.parse(config);
        } catch (error) {
          if (error instanceof Error && 'errors' in error) {
            const zodError = error as { errors: unknown };
            console.error('Environment validation failed:', zodError.errors);
          } else {
            console.error('Environment validation failed:', error);
          }
          throw new Error('Environment validation failed');
        }
      },
    }),
  ],
})
export class ConfigModule {}
