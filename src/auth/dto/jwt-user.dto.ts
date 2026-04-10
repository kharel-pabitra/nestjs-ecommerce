import { UserRole } from 'src/common/enums/user-role.enum';

export type JwtUserDto = {
  userId: number;
  email: string;
  role: UserRole;
};
