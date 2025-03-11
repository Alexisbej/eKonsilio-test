import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({ access_token: 'mock-access-token' }),
    getUserProfile: jest.fn().mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'AGENT',
    }),
    createVisitorSession: jest.fn().mockResolvedValue({
      token: 'visitor-token',
      userId: 'visitor-123',
    }),
    validateOrCreateUser: jest.fn().mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      role: 'AGENT',
    }),
    validateVisitorToken: jest.fn().mockResolvedValue({
      id: 'visitor-123',
      role: 'VISITOR',
    }),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockResponse = {
    redirect: jest.fn(),
    cookie: jest.fn(),
    json: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('googleAuthRedirect', () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockRequest = { user: mockUser };

    it('should successfully redirect with access token', async function () {
      const mockToken = 'mock-access-token';
      mockAuthService.login.mockResolvedValue({ access_token: mockToken });
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      await controller.googleAuthRedirect(mockRequest, mockResponse);

      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        `http://localhost:3000/auth/google/callback?token=${mockToken}`,
      );
    });

    it('should handle authentication failure', async function () {
      mockAuthService.login.mockRejectedValue(new Error('Auth failed'));
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      await controller.googleAuthRedirect(mockRequest, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/error?message=Authentication failed',
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getProfile', () => {
    const mockUserId = '1';
    const mockRequest = { user: { userId: mockUserId } };

    it('should return user profile successfully', async function () {
      const mockProfile = {
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
      };
      mockAuthService.getUserProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile(mockRequest);

      expect(mockAuthService.getUserProfile).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockProfile);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockAuthService.getUserProfile.mockResolvedValue(null);

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
      expect(mockAuthService.getUserProfile).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle service errors', async function () {
      mockAuthService.getUserProfile.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        new UnauthorizedException('Failed to retrieve user profile'),
      );
      expect(mockAuthService.getUserProfile).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('createVisitorSession', () => {
    const mockTenantId = 'tenant-123';
    const mockBody = { tenantId: mockTenantId };

    it('should create visitor session successfully', async () => {
      const mockSession = {
        token: 'visitor-token',
        userId: 'visitor-123',
      };
      mockAuthService.createVisitorSession.mockResolvedValue(mockSession);
      mockConfigService.get.mockReturnValue('development');

      await controller.createVisitorSession(mockBody, mockResponse);

      expect(mockAuthService.createVisitorSession).toHaveBeenCalledWith(
        mockTenantId,
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'visitor_token',
        mockSession.token,
        expect.any(Object),
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        userId: mockSession.userId,
        token: mockSession.token,
      });
    });

    it('should handle session creation failure', async () => {
      mockAuthService.createVisitorSession.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(
        controller.createVisitorSession(mockBody, mockResponse),
      ).rejects.toThrow(
        new BadRequestException('Failed to create visitor session'),
      );
      expect(mockAuthService.createVisitorSession).toHaveBeenCalledWith(
        mockTenantId,
      );
    });

    it('should set secure cookie options in production', async () => {
      const mockSession = {
        token: 'visitor-token',
        userId: 'visitor-123',
      };
      mockAuthService.createVisitorSession.mockResolvedValue(mockSession);
      mockConfigService.get.mockReturnValue('production');

      await controller.createVisitorSession(mockBody, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'visitor_token',
        mockSession.token,
        expect.objectContaining({
          secure: true,
          sameSite: 'none',
        }),
      );
    });
  });

  describe('getVisitorProfile', () => {
    const mockVisitorUser = {
      id: 'visitor-123',
      role: 'VISITOR',
    };
    const mockRequest = { user: mockVisitorUser };

    it('should return visitor profile successfully', async () => {
      const result = await controller.getVisitorProfile(mockRequest);
      expect(result).toEqual(mockVisitorUser);
    });

    it('should handle profile retrieval error', async () => {
      const mockErrorRequest = {
        user: null,
      };

      await expect(async () =>
        controller.getVisitorProfile(mockErrorRequest),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
