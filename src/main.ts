import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ValidationPipe } from '@nestjs/common';

import * as cookieParser from "cookie-parser";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true
  }));


  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:3131', // URL exata do frontend
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
  });

  await app.listen(process.env.PORT ?? 4141);
}
bootstrap();
