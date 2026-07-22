import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { Request } from 'express';
import { JwtUserDto } from 'src/auth/dto/jwt-user.dto';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );
    this.logger.log(`Required roles: ${requiredRoles?.join(', ') ?? 'none'}`);

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<Request>();

    const user = request.user as JwtUserDto;
    this.logger.log(`Current user role: ${user?.role ?? 'none'}`);

    if (!user) {
      this.logger.warn('No authenticated user found');
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
