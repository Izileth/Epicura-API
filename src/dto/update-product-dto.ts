import { IsNotEmpty, IsOptional, isString, IsString, IsNumber, IsArray, IsBoolean } from "class-validator"

export class UpdateProductDto {
    @IsString()
    @IsOptional()
    title?: string

    @IsString()
    @IsOptional()
    description?: string
    
    @IsString()
    @IsOptional()
    imageUrl?: string
 

      
    @IsNumber()
    @IsOptional()
    price: number;

    @IsString()
    @IsOptional()
    link?: string

    @IsString()
    @IsOptional()
    //@IsNotEmpty()
    category?: string

    
        
    @IsString()
    @IsOptional()
    categoryId?: string;


    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

       
    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean; // Corrigir typo (isAvaliable → isAvailable)
}