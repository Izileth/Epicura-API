import { IsInt, Min, IsOptional, IsString } from 'class-validator';

export class UpdateItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}