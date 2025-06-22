import { Module } from '@nestjs/common';
import { CartService } from 'src/services/cart.service';
import { CartController } from 'src/controllers/cart.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [PrismaModule, ProductsModule, AuthModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}