import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { RateLimitGuard } from '../../../common/guards/rate-limit.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CreateVisitorSessionSchema } from '../dto/auth.dto';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(
    new RateLimitGuard({ windowMs: 60 * 1000, max: 10 }),
    AuthGuard('google'),
  )
  googleAuth() {
    // This method is intentionally empty as it's handled by the AuthGuard
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: { user: unknown },
    @Res() res: Response,
  ) {
    try {
      const { access_token } = await this.authService.login(req.user);
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';

      return res.redirect(
        `${frontendUrl}/auth/google/callback?token=${access_token}`,
      );
    } catch (error) {
      this.logger.error(
        `Error in Google auth callback: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return res.redirect(
        `${this.configService.get<string>('FRONTEND_URL')}/auth/error?message=Authentication failed`,
      );
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: { user: { userId: string } }) {
    try {
      const user = await this.authService.getUserProfile(req.user.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(
        `Error retrieving user profile: ${(error as Error).message}`,
        (error as Error).stack,
      );
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to retrieve user profile');
    }
  }

  @Post('visitor')
  @UseGuards(new RateLimitGuard({ windowMs: 60 * 1000, max: 20 }))
  async createVisitorSession(
    @Body(new ZodValidationPipe(CreateVisitorSessionSchema))
    body: { tenantId: string },
    @Res() res: Response,
  ) {
    try {
      const { tenantId } = body;

      const { token, userId } =
        await this.authService.createVisitorSession(tenantId);

      const isProduction =
        this.configService.get<string>('NODE_ENV') === 'production';

      res.cookie('visitor_token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.json({ userId, token });
    } catch (error) {
      this.logger.error(
        `Error creating visitor session: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new BadRequestException('Failed to create visitor session');
    }
  }

  @Get('visitor/profile')
  @UseGuards(AuthGuard('visitor-jwt'))
  async getVisitorProfile(@Req() req: { user: unknown }) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not found');
      }
      return req.user;
    } catch (error) {
      this.logger.error(
        `Error retrieving visitor profile: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new UnauthorizedException('Failed to retrieve visitor profile');
    }
  }
}
