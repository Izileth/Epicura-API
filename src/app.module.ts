import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProductsModule } from './modules/products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { ProductController } from './controllers/product.controller';
import { CartModule } from './modules/cart/cart.module';
import { CartController } from './controllers/cart.controller';
import { CartService } from './services/cart.service';
import { ProductService } from './services/product.service';
import { CategoryModule } from './modules/category/category.module';
import { CloudinaryModule } from './modules/clouldnary/clouldnary.module';
import { JwtModule } from '@nestjs/jwt';
import { TestController } from './controllers/test.controller';
@Module({
  imports: [AuthModule, UserModule, ProductsModule, PrismaModule, CategoryModule, CartModule, CloudinaryModule, JwtModule],
  controllers: [UserController, ProductController, CartController, TestController],
  providers: [UserService, ProductService, CartService],
})

export class AppModule {}
