import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('validateOrCreateUser', () => {
    const mockProfile = {
      email: 'test@example.com',
      name: 'Test User',
      googleId: 'google123',
    };

    it('should update existing user with googleId if not present', async () => {
      const existingUser = {
        id: '1',
        email: mockProfile.email,
        googleId: null,
      };
      const updatedUser = { ...existingUser, googleId: mockProfile.googleId };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.validateOrCreateUser(mockProfile);
      expect(result).toEqual(updatedUser);
    });

    it('should create new user if not exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const newUser = { id: '1', ...mockProfile };
      mockPrismaService.user.create.mockResolvedValue(newUser);

      const result = await service.validateOrCreateUser(mockProfile);
      expect(result).toEqual(newUser);
    });
  });

  describe('login', () => {
    it('should generate access token', async () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'AGENT' };
      const mockToken = 'jwt-token';
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(mockUser);
      expect(result).toEqual({ access_token: mockToken });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile if found', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'AGENT',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserProfile('1');
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserProfile('1')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('createVisitorSession', () => {
    it('should create visitor user and generate token', async () => {
      const mockVisitorUser = {
        id: 'visitor-1',
        role: 'VISITOR',
        temporaryToken: 'temp-token',
      };
      const mockToken = 'jwt-token';

      mockPrismaService.user.create.mockResolvedValue(mockVisitorUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.createVisitorSession('tenant-1');
      expect(result).toEqual({
        userId: mockVisitorUser.id,
        token: mockToken,
      });
    });
  });

  describe('validateVisitorToken', () => {
    it('should return user if token is valid', async () => {
      const mockPayload = { sub: 'visitor-1', token: 'temp-token' };
      const mockUser = { id: 'visitor-1', temporaryToken: 'temp-token' };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateVisitorToken('valid-token');
      expect(result).toEqual(mockUser);
    });

    it('should return null if token verification fails', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.validateVisitorToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      const mockPayload = { sub: 'visitor-1', token: 'temp-token' };
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateVisitorToken('valid-token');
      expect(result).toBeNull();
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
