import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';

jest.mock('bcryptjs');

type PrismaMock = {
  user: { findUnique: jest.Mock; create: jest.Mock };
  organization: { create: jest.Mock };
  membership: { create: jest.Mock };
  refreshToken: {
    create: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaMock;
  let jwt: { sign: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      organization: { create: jest.fn() },
      membership: { create: jest.fn() },
      refreshToken: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
      $transaction: jest.fn((cb: (tx: PrismaMock) => Promise<unknown>) => cb(prisma)),
    };
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    service = new AuthService(prisma as unknown as PrismaService, jwt as unknown as JwtService);
  });

  describe('register', () => {
    it('rejects registration when the email is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register({
          email: 'taken@example.com',
          password: 'password123',
          name: 'Test',
          organizationName: 'Acme',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates the user, organization, and an OWNER membership together', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({ id: 'user-1', email: 'a@b.com', name: 'Test' });
      prisma.organization.create.mockResolvedValue({ id: 'org-1', name: 'Acme', slug: 'acme-xyz' });

      const result = await service.register({
        email: 'a@b.com',
        password: 'password123',
        name: 'Test',
        organizationName: 'Acme',
      });

      expect(prisma.membership.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', organizationId: 'org-1', role: 'OWNER' },
      });
      expect(result.user).toEqual({ id: 'user-1', email: 'a@b.com', name: 'Test' });
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('login', () => {
    it('rejects an unknown email without revealing that it does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'nope@example.com', password: 'x' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects an incorrect password', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'a@b.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('issues tokens on correct credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        name: 'Test',
        passwordHash: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'a@b.com', password: 'correct' });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rejects a refresh token that does not exist or is expired/revoked', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.refresh('some-token')).rejects.toThrow(UnauthorizedException);
    });

    it('revokes the old token and issues a brand new one (rotation)', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        user: { id: 'user-1', email: 'a@b.com', name: 'Test' },
      });

      const result = await service.refresh('valid-token');

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revoked: true },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalled(); // the new token
      expect(result.accessToken).toBe('signed.jwt.token');
    });
  });
});
