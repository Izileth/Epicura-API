import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe,  Post, Put, UseGuards } from '@nestjs/common';
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
    @Get('all')
    getAllProducts() {
        return this.productService.getAllProducts();
    }

    @Get()
    getProduct(
        @GetUser('id') userId: string,
    ){
        console.log('Fetching products for user:', userId); // Para debug
        return this.productService.getProduct(
            userId,
        );
    }
    
    @Get(':id')
    async getProductById(
        @GetUser('id') userId: string,
        @Param('id') productId: string, 
    ){
        console.log('Controller - Getting product by ID:', { userId, productId }); // Debug
        
        try {
            const product = await this.productService.getProductById(userId, productId);
            console.log('Controller - Product found:', product ? 'Yes' : 'No'); // Debug
            return product;
        } catch (error) {
            console.error('Controller - Error getting product:', error.message);
            throw error;
        }
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

    @Put(':id')
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
