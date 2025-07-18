import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from 'src/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Inject } from '@nestjs/common';
@Injectable()
export class ProductService {
    constructor(
        private prisma: PrismaService, 
        @Inject('CLOUDINARY') private cloudinary: any
    ){}
        
    getAllProducts() {
        return this.prisma.product.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true
                    }
                },
                category: true // Inclui informações da categoria
            },
            orderBy: {
                createdAt: 'desc' // Ordena por data de criação (opcional)
            }
        });
    }
    getProduct(userId: string) {
        return this.prisma.product.findMany({
            where:{
                userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true
                    }
                },
                category: true
            }
        })
    }

    async getProductById(userId: string | undefined, productId: string) {
        console.log('Searching for product:', { userId, productId }); // Debug
        
        const product = await this.prisma.product.findUnique({
            where: {
                id: productId, // Remove a restrição de userId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true
                    }
                },
                category: true
            }
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }
    
        
    
    async createProduct(
        userId: string, 
        dto: CreateProductDto) {
        if (dto.categoryId) {
            const category = await this.prisma.category.findUnique({
                where: { id: dto.categoryId }
            });
            if (!category) {
                throw new NotFoundException('Category not found');
            }
        }       
        const product = await this.prisma.product.create({
            data: {
                userId,
                ...dto,
                tags: dto.tags || [], 
                imageUrl: dto.imageUrl || null,
                categoryId: dto.categoryId || undefined // Convertendo string vazia para undefined

            },
            
        });

        

        return product;
     }

    async editProductById(
        userId: string,
        productId: string,
        dto: UpdateProductDto
    ) {
        // Estrutura correta para atualização do Prisma
        const updateData = {
            ...dto,
            tags: dto.tags, // Mantém o array de tags
            category: dto.categoryId ? { 
                connect: { id: dto.categoryId } 
            } : { disconnect: true },
            categoryId: undefined // Remove o campo categoryId do DTO
        };

          if (dto.imageUrl) {
            const oldProduct = await this.prisma.product.findUnique({
            where: { id: productId }
            });
            
            if (oldProduct?.imageUrl) {
            await this.deleteImageFromCloudinary(oldProduct.imageUrl);
            }
        }


        delete updateData.categoryId; // Garante a remoção do campo

        return this.prisma.product.update({
            where: { 
                id: productId,
                userId: userId 
            },
            data: updateData
        });
    }
        
    async deleteProductById(
        userId: string,
         productId: string
        ) {
            const product = await this.prisma.product.findUnique({
                where:{
                    id: productId,
                },
            });

            if(!product || product.userId !== userId)
                throw new ForbiddenException(
                    'Acess to resources denied!'
                )    
            await this.prisma.product.delete({
                where:{
                    id: productId,
                },
            });
    }
     
    private async deleteImageFromCloudinary(imageUrl: string) {
    try {
        const publicId = imageUrl
            .split('/')
            .pop()
            ?.split('.')[0] || '';
            
        if (publicId) {
            await this.cloudinary.uploader.destroy(publicId);
        }
        } catch (error) {
        console.error('Error deleting image:', error);
        }
    }
}
