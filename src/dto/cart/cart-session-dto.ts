import { IsOptional, IsString } from 'class-validator';

export class CartSessionDto {
  @IsOptional()
  @IsString()
  sessionId?: string;
}