import { Body, Controller, Post, Patch, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtUserDto } from 'src/auth/dto/jwt-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('/register')
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/avatar')
  updateAvatar(@Req() req, @Body('avatar') avatar: string) {
    const user = req.user as JwtUserDto;
    return this.userService.updateAvatar(user.userId, avatar);
  }
}
