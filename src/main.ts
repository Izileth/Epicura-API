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
    origin: 'https://epicura-crush.vercel.app',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
  });

  app.get('/test', (req, res) => {
    res.json({ 
      message: 'API Working Correctly!',
      endpoints: {
        auth: '/auth',
        users: '/user',
        product: '/product',
        cart: '/cart',
        category: '/category',
        resend: '/resend'
      },  
      environment: process.env.NODE_ENV,
      allowedOrigins
    });
  });

  await app.listen(process.env.PORT ?? 4141);
}
bootstrap();
