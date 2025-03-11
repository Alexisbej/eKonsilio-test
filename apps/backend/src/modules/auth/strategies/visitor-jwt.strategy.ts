import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class VisitorJwtStrategy extends PassportStrategy(
  Strategy,
  'visitor-jwt',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.visitor_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret',
    });
  }

  validate(payload: any) {
    return {
      userId: payload.sub,
      role: 'VISITOR',
      temporaryToken: payload.token,
    };
  }
}
