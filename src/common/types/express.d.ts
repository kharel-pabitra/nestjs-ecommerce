import { JwtUserDto } from 'src/auth/dto/jwt-user.dto';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserDto;
    }
  }
}
