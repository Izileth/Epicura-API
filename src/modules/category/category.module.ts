import { Module } from '@nestjs/common';

import { CategoryController } from 'src/controllers/category.controller';
import { CategoryService } from 'src/services/category.service';

@Module({
  imports: [],
  controllers: [
    CategoryController,
  ],
  providers: [
    CategoryService,
  ],
})
export class CategoryModule {}
