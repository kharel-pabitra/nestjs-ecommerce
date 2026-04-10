import {
  IsNotEmpty,
  IsEmail,
  Length,
  IsString,
  MaxLength,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserRole } from 'src/common/enums/user-role.enum';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Name should not be empty' })
  @IsString()
  @MinLength(3, {
    message: 'Name is too short',
  })
  @MaxLength(500, {
    message: 'Name is too long',
  })
  name: string;

  @IsNotEmpty({ message: 'Email must not be empty' })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @IsNotEmpty({ message: 'Password must not be empty' })
  @Length(6)
  password: string;

  @IsOptional()
  @IsEnum([UserRole.CUSTOMER, UserRole.SELLER], {
    message: 'Role must be customer or seller',
  })
  role?: UserRole.CUSTOMER | UserRole.SELLER;
}
