// src/services/category.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateCategoryDto, UpdateCategoryDto } from 'src/dto';

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

    return this.prisma.category.create({
      data: dto,
    });
  }

  async getAllCategories() {
    return this.prisma.category.findMany({
      include: {
        products: true,
      },
    });
  }

  async getCategoryById(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { products: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    try {
      return await this.prisma.category.update({
        where: { id: categoryId },
        data: dto,
      });
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