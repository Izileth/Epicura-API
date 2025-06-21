// src/services/category.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma';
import { CreateCategoryDto, UpdateCategoryDto, CategoryFilterDto } from 'src/dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}
 
    
  async createCategory(dto: CreateCategoryDto) {
    // Verificar se a categoria já existe
    const existingCategory = await this.prisma.category.findUnique({
      where: { name: dto.name },
    });

    if (existingCategory) {
      throw new ConflictException('Category already exists');
    }

    // MUDANÇA: Incluir products para calcular productCount
    const category = await this.prisma.category.create({
      data: dto,
      include: {
        products: true,
      },
    });

    // MUDANÇA: Retornar com productCount
    return {
      ...category,
      productCount: category.products.length,
    };
  }
  async getAllCategories(filters: CategoryFilterDto) {
    const where: Prisma.CategoryWhereInput = {};

    // Filtro por nome
    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    // Filtro por data
    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        gte: filters.startDate ? new Date(filters.startDate) : undefined,
        lte: filters.endDate ? new Date(filters.endDate) : undefined,
      };
    }

    // Paginação por cursor
    if (filters.cursor) {
      where.id = {
        gt: filters.cursor,
      };
    }

    const categories = await this.prisma.category.findMany({
      where,
      take: filters.limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        products: true,
      },
    });

    // Determinar se há mais resultados
    let nextCursor: string | null = null;
    if (categories.length === filters.limit) {
      nextCursor = categories[categories.length - 1].id;
    }

    // MUDANÇA: Adicionar productCount para cada categoria
    const categoriesWithCount = categories.map(category => ({
      ...category,
      productCount: category.products.length,
    }));

    return {
      data: categoriesWithCount, // MUDANÇA: Usar categoriesWithCount em vez de categories
      pagination: {
        nextCursor,
        hasMore: !!nextCursor,
      },
    };
  }

  async getCategoryById(categoryId: string) {
  const category = await this.prisma.category.findUnique({
      where: { id: categoryId },

      include: { 
      products: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          category: true,
        },
      },
    },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // MUDANÇA: Retornar com productCount
    return {
      data:{ 
         ...category,
         productCount: category.products.length,
      }
    };
  }
  
  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    try {
      // MUDANÇA: Incluir products para calcular productCount
      const updatedCategory = await this.prisma.category.update({
        where: { id: categoryId },
        data: dto,
        include: {
          products: true,
        },
      });

      // MUDANÇA: Retornar com productCount
      return {
        ...updatedCategory,
        productCount: updatedCategory.products.length,
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Category not found');
      }
      throw error;
    }
  }
  async deleteCategory(categoryId: string) {
    // Verificar se existem produtos associados
    const products = await this.prisma.product.findMany({
      where: { categoryId },
    });

    if (products.length > 0) {
      throw new ConflictException(
        'Cannot delete category with associated products',
      );
    }

    try {
      return await this.prisma.category.delete({
        where: { id: categoryId },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Category not found');
      }
      throw error;
    }
  }
}