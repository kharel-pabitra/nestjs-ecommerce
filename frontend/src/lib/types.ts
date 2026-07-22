// Matches src/common/enums/user-role.enum.ts on the backend (lowercase values)
export type UserRole = 'customer' | 'seller';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}
