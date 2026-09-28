import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { UserRole } from '../users/entities/user.entity.js';
import { ROLES_KEY } from './roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const adminEmails = this.configService
      .get<string>('ADMIN_EMAILS', '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.includes(user.email?.toLowerCase())) {
      user.role = UserRole.ADMIN;
      await this.usersRepository.save(user);
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions.');
    }

    return true;
  }
}
