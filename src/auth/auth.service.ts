import * as bcrypt from 'bcrypt';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Repository } from 'typeorm';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtUserDto } from './dto/jwt-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      this.logger.warn(`Login failed. Invalid credentials`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      this.logger.warn(`Login failed. Invalid Password`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify<JwtUserDto>(token);

      this.logger.log(`Refresh token accepted for user ${payload.userId}`);

      const newAccessToken = this.jwtService.sign(
        { userId: payload.userId, email: payload.email, role: payload.role },
        { expiresIn: '15m' },
      );

      return {
        accessToken: newAccessToken,
      };
    } catch (err) {
      this.logger.warn('Refresh token validation failed');
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
