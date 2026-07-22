import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const authStatus = super.canActivate(context);
    this.logger.log(`JWT authentication attempt Status: ${!!authStatus}`);
    return authStatus;
  }
}
