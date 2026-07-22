import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name, role } = createUserDto;

    this.logger.log(`Registration attempt for email: ${email}`);

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn(`Registration failed. Email already exists: ${email}`);
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      name,
      email,
      role,
      password: hashedPassword,
    });
    const savedUser = await this.userRepository.save(user);

    this.logger.log(`User created successfully: ${savedUser.id}`);

    return savedUser;
  }

  async updateAvatar(userId: string, avatar: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`Update failed. User Not Found: ${userId}`);
      throw new NotFoundException('User not found');
    }
    user.avatar = avatar;
    const savedUser = await this.userRepository.save(user);

    this.logger.log(`User Avatar updated successfully: ${savedUser.id}`);

    return savedUser;
  }
}
