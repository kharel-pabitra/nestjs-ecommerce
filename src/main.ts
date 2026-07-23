import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');

const corsOrigins = ['http://127.0.0.1:5500', 'http://localhost:5173'];

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not in DTO
      forbidNonWhitelisted: true, // throw error if extra props
      transform: true, // auto-transform payloads to DTO class
    }),
  );

  app.use(cookieParser());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: process.env.NODE_ENV === 'development' ? 0 : 86400, // 24 hours in production
  });

  const port = process.env.PORT ?? 3000;

  await app.listen(port, '0.0.0.0');

  logger.log(`Application running on port http://localhost:${port}`);
  logger.log(` CORS enabled for: ${corsOrigins.join(', ')}`);
}

bootstrap();
