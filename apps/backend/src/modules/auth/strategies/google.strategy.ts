import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  StrategyOptions,
  VerifyCallback,
} from 'passport-google-oauth20';
import { AuthService } from '../services/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const options: StrategyOptions = {
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') ?? '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') ?? '',
      scope: ['email', 'profile'],
    };

    if (!options.clientID || !options.clientSecret || !options.callbackURL) {
      throw new Error('Missing required Google OAuth configuration');
    }

    super(options);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    try {
      this.logger.debug(
        `Google authentication attempt for profile ID: ${profile?.id}`,
      );

      if (!profile) {
        throw new Error('Google profile is undefined');
      }

      const { id, emails } = profile;

      if (!emails || !emails.length) {
        throw new Error('No email found in Google profile');
      }

      const userProfile = {
        email: emails[0].value,
        name: profile.displayName || emails[0].value || 'Google User',
        googleId: id,
      };

      const user = await this.authService.validateOrCreateUser(userProfile);
      done(null, user);
    } catch (error) {
      this.logger.error(
        `Error in Google strategy validation: ${error.message}`,
        error.stack,
      );
      done(error, false);
    }
  }
}
