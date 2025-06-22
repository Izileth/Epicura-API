import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductController } from 'src/controllers/product.controller';
import { ProductService } from 'src/services/product.service';
import { CloudinaryModule } from '../clouldnary/clouldnary.module';
@Module({
    imports: [PrismaModule, CloudinaryModule],
    controllers: [ProductController],
    providers: [ProductService],
    exports: [ProductService], 
})
export class ProductsModule {}
