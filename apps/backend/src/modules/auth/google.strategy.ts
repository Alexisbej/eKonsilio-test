import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    try {
      this.logger.log(`Google profile received: ${JSON.stringify(profile)}`);

      if (!profile) {
        throw new Error('Google profile is undefined');
      }

      const { id, emails } = profile;

      if (!emails || !emails.length) {
        throw new Error('No email found in Google profile');
      }

      const userProfile = {
        email: emails[0].value,
        name: emails[0].value || 'Google User', // Fallback name if displayName is missing
        googleId: id,
      };

      const user = await this.authService.validateOrCreateUser(userProfile);
      done(null, user);
    } catch (error) {
      this.logger.error(
        `Error in Google strategy validation: ${error.message}`,
      );
      done(error, false);
    }
  }
}
