// src/dto/category.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';


export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'imageUrl deve ser uma URL válida' })
  imageUrl?: string;
}