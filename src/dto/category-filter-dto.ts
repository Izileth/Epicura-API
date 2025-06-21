import { IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

export class CategoryFilterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @IsISO8601()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  limit?: number = 10; // Valor padrão

  @IsString()
  @IsOptional()
  cursor?: string; // Último ID recebido

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sortBy?: 'name' | 'createdAt' | 'productCount';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}