import {
  Body,
  Controller,
  Post,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }

  @Post('/refresh')
  refresh(@Req() req: Request) {
    const refreshToken = req.cookies?.refreshToken;

    console.log('*****refresh token cookie', req.cookies);

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    return this.authService.refreshToken(refreshToken as string);
  }
}
