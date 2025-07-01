import { Controller, Get } from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get()
  getTest() {
    return {
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
      allowedOrigins: 'https://epicura-crush.vercel.app',
    };
  }
}
