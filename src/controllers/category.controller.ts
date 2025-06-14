
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  Query,
  Put
} from '@nestjs/common';

import { JwtGuard } from 'src/guard';
import { CategoryService } from 'src/services/category.service';

import { CreateCategoryDto, UpdateCategoryDto, CategoryFilterDto } from '../dto';

@UseGuards(JwtGuard)
@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Post()
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoryService.createCategory(dto);
  }

  @Get()
  async getAllCategories(
    @Query() filters: CategoryFilterDto
  ) {
    return this.categoryService.getAllCategories(filters);
  }

  @Get(':id')
  getCategoryById(@Param('id') categoryId: string) {
    return this.categoryService.getCategoryById(categoryId);
  }

  @Put(':id')
  updateCategory(
    @Param('id') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategory(categoryId, dto);
  }

  @Delete(':id')
  deleteCategory(@Param('id') categoryId: string) {
    return this.categoryService.deleteCategory(categoryId);
  }
}