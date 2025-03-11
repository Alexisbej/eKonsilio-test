import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(cookieParser());

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: [
      configService.get<string>('FRONTEND_URL'),
      configService.get<string>('VISITOR_URL'),
    ],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
}

void bootstrap();
