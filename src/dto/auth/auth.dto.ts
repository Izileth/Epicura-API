import { IsString, IsInt, IsEmail, IsNotEmpty } from 'class-validator';
export class AuthDto {
    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsString()
    @IsNotEmpty()
    password: string
}