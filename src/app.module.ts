import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProductsModule } from './modules/products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
import { CategoryModule } from './modules/category/category.module';
import { CloudinaryModule } from './modules/clouldnary/clouldnary.module';

@Module({
  imports: [AuthModule, UserModule, ProductsModule, PrismaModule, CategoryModule, CloudinaryModule],
  controllers: [UserController, ProductController],
  providers: [UserService, ProductService],
})

export class AppModule {}
