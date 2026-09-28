import {
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity.js';
import { ROLES_KEY } from './roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: vi.fn(),
  } as unknown as Reflector;
  const configService = {
    get: vi.fn(),
  } as unknown as ConfigService;
  const usersRepository = {
    save: vi.fn((savedUser: User) => Promise.resolve(savedUser)),
  } as unknown as Repository<User>;
  const user = {
    id: 1,
    email: 'Admin@Example.com',
    role: UserRole.EMPLOYEE,
  } as User;
  const context = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
  const guard = new RolesGuard(reflector, configService, usersRepository);

  beforeEach(() => {
    user.email = 'Admin@Example.com';
    user.role = UserRole.EMPLOYEE;
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([UserRole.ADMIN]);
    vi.mocked(configService.get).mockReturnValue(
      'admin@example.com, other@example.com',
    );
    vi.mocked(usersRepository.save).mockClear();
  });

  it('persists admin promotion before checking roles', async () => {
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(user.role).toBe(UserRole.ADMIN);
    expect(usersRepository.save).toHaveBeenCalledWith(user);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('rejects a user whose email is not allowlisted', async () => {
    user.email = 'employee@example.com';

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('Insufficient permissions.'),
    );
    expect(user.role).toBe(UserRole.EMPLOYEE);
    expect(usersRepository.save).not.toHaveBeenCalled();
  });
});