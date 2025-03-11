import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string(),

  // Server
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('3000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Auth
  JWT_SECRET: z.string(),
  JWT_EXPIRATION: z.string().default('1d'),
  VISITOR_JWT_SECRET: z.string(),
  VISITOR_JWT_EXPIRATION: z.string().default('7d'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z
    .string()
    .default('http://localhost:3000/auth/google/callback'),

  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        try {
          return envSchema.parse(config);
        } catch (error) {
          console.error('Environment validation failed:', error.errors);
          throw new Error('Environment validation failed');
        }
      },
    }),
  ],
})
export class ConfigModule {}
