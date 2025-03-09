import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const { access_token } = await this.authService.login(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(
      `${frontendUrl}/auth/google/callback?token=${access_token}`,
    );
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req) {
    try {
      const user = await this.authService.getUserProfile(req.user.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return user; // Return the complete user object from the service
    } catch (error) {
      throw new UnauthorizedException('Failed to retrieve user profile');
    }
  }

  @Post('visitor')
  async createVisitorSession(
    @Body() body: { tenantId: string },
    @Res() res: Response,
  ) {
    const { tenantId } = body;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID is required');
    }

    const { token, userId } =
      await this.authService.createVisitorSession(tenantId);

    res.cookie('visitor_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({ userId });
  }

  @Get('visitor/profile')
  @UseGuards(AuthGuard('visitor-jwt'))
  getVisitorProfile(@Req() req) {
    return req.user;
  }
}
