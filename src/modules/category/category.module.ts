import { Module } from '@nestjs/common';

import { CategoryController } from 'src/controllers/category.controller';
import { CategoryService } from 'src/services/category.service';

@Module({
  imports: [],
  controllers: [
    // ... outros controllers
    CategoryController,
  ],
  providers: [
    // ... outros providers
    CategoryService,
  ],
})
export class CategoryModule {}
