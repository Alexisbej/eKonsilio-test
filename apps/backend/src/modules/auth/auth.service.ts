import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async validateOrCreateUser(profile: any) {
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (user) {
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { email: profile.email },
          data: { googleId: profile.googleId, name: profile.name },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          googleId: profile.googleId,
          // Use non-null assertion since tenantId is required
          tenantId: process.env.DEFAULT_TENANT_ID!,
          role: 'VISITOR', // using literal string for UserRole
        },
      });
    }
    return user;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
