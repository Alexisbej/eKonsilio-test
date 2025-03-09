import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_jwt_secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [WebsocketGateway, PrismaService],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
