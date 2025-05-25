import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/decorator';
import { CreateProductDto, UpdateProductDto } from 'src/dto';
import { JwtGuard } from 'src/guard';
import { ProductService } from 'src/services/product.service';

import { ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryInterceptor } from 'src/interceptors/clouldnary.interdecptor';

@UseGuards(JwtGuard)
@Controller('product')
export class ProductController {

    constructor(private productService: ProductService) {}
    @Get()
    getProduct(
        @GetUser('id') userId: string,
    ){
        return this.productService.getProduct(
            userId,
        );
    }

    
    @Get(':id')
    getProductById(
        @GetUser('id') userId: string,
        @Param('id', ParseIntPipe) productId: string,
    ){
        return this.productService.getProductById(
            userId,
            productId,
        );
    }

    @Post()
    @UseInterceptors(
    FileInterceptor('image', {
        limits: { fileSize: 1024 * 1024 * 5 } // 5MB
    }),
    CloudinaryInterceptor
    )
    createProduct(
         @UploadedFile(
            new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 5000000 }),
                new FileTypeValidator({ fileType: 'image/*' }),
            ],
            fileIsRequired: false, // Alterar para true se a imagem for obrigatória
            })
        ) file: Express.Multer.File,
        @GetUser('id') userId: string,
        @Body() dto: CreateProductDto,
    ){
        return this.productService.createProduct(
            userId,
            dto,
        );
    }

    @Patch(':id')
    @UseInterceptors(
    FileInterceptor('image'),
    CloudinaryInterceptor
    )
    editProductById(
        @GetUser('id') userId: string, // Alterar para string
        @Param('id') productId: string, // Remover ParseIntPipe
        @Body() dto: UpdateProductDto,
    ) {
        return this.productService.editProductById(
            userId,
            productId, // A ordem estava invertida
            dto,
        );
    }


    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    deleteProductById(
        @GetUser('id') userId: string,
        @Param('id') productId: string,
    ){
        return this.productService.deleteProductById(
            userId,
            productId,
        )
    }
}
