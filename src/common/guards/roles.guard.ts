import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { Request } from 'express';
import { JwtUserDto } from 'src/auth/dto/jwt-user.dto';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<Request>();

    const user = request.user as JwtUserDto;

    if (!user) return false;

    return requiredRoles.includes(user.role);
  }
}
