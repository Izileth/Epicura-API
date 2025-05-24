// src/dto/category.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;
}