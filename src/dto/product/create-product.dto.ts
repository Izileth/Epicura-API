import { IsArray, IsBoolean, IsNumber, IsString, IsNotEmpty, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;
    
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    price: number;

    @IsString()
    @IsNotEmpty()
    link: string;

    @IsString()
    @IsOptional()
    categoryId?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    isAvailable?: boolean;
}