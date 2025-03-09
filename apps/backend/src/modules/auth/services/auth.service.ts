import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

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
          tenantId: process.env.DEFAULT_TENANT_ID!,
          role: 'AGENT',
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

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        googleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async createVisitorSession(tenantId: string) {
    const visitorUser = await this.prisma.user.create({
      data: {
        email: null,
        role: 'VISITOR',
        tenantId,
        temporaryToken: uuidv4(),
      },
    });

    const payload = {
      sub: visitorUser.id,
      role: 'VISITOR',
      token: visitorUser.temporaryToken,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      userId: visitorUser.id,
      token,
    };
  }

  async validateVisitorToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub, temporaryToken: payload.token },
      });

      if (!user) return null;
      return user;
    } catch (error) {
      return null;
    }
  }
}
