import { Injectable, Logger, LoggerService } from '@nestjs/common';

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

interface LogPayload {
  message: string;
  context?: string;
  action?: string;
  trace?: string;
  meta?: Record<string, any>;
}

@Injectable()
export class AppLogger implements LoggerService {
  private logger = new Logger('APP');

  private isProd = process.env.NODE_ENV === 'production';

  private format(level: LogLevel, payload: LogPayload) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message: payload.message,
      context: payload.context || 'APP',
      action: payload.action || 'UNKNOWN',
      ...(payload.meta && { meta: payload.meta }),
      ...(payload.trace && { trace: payload.trace }),
    };
  }

  log(message: any, context?: string) {
    const log = this.format('log', { message, context });
    this.logger.log(JSON.stringify(log));
  }

  warn(message: any, context?: string) {
    const log = this.format('warn', { message, context });
    this.logger.warn(JSON.stringify(log));
  }

  error(message: any, trace?: string, context?: string) {
    const log = this.format('error', {
      message,
      trace,
      context,
    });
    this.logger.error(JSON.stringify(log));
  }

  debug(message: any, context?: string) {
    if (this.isProd) return;

    const log = this.format('debug', { message, context });
    this.logger.debug(JSON.stringify(log));
  }

  verbose(message: any, context?: string) {
    if (this.isProd) return;

    const log = this.format('verbose', { message, context });
    this.logger.verbose(JSON.stringify(log));
  }
}
