import { UserRole } from 'src/common/enums/user-role.enum';

export type JwtUserDto = {
  userId: string;
  email: string;
  role: UserRole;
};
