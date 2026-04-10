import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtUserDto } from '../dto/jwt-user.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_TOKEN || 'secret',
    });
  }

  validate(payload: JwtUserDto) {
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  }
}
