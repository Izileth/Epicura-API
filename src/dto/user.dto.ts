import { IsEmail, IsOptional, IsString } from "class-validator"


export class EditUserDto {
    @IsEmail()
    @IsOptional()
    email?: string

    @IsString()
    @IsOptional()
    fistName?: string // ERRO DE TYPO AQUI!
    
    @IsString()
    @IsOptional()
    lastName?: string
}