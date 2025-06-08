import { Body, Controller, HttpCode, HttpStatus, Post, Res, ValidationPipe} from "@nestjs/common";
import { AuthDto, ResetPasswordDto, ForgotPasswordDto } from "src/dto";
import { UsePipes } from "@nestjs/common";
import { AuthService } from "src/services/auth.service";
import { Response } from "express";

@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) {}
    @HttpCode(HttpStatus.CREATED)

    @Post('signup')
    @UsePipes(new ValidationPipe({ whitelist: true })) // Remove campos não definidos no DTO
    signup(@Body() dto: AuthDto) {
    return this.authService.signup(dto);
    }

    @HttpCode(HttpStatus.ACCEPTED)
    @Post("signin")
    async signin(@Body() dto: AuthDto, @Res({ passthrough: true }) res: Response) {
        return this.authService.signin(dto, res);
    }

    @HttpCode(HttpStatus.OK)
    @Post("signout")
    signout(@Res({ passthrough: true }) res: Response) {
        return this.authService.signout(res);
    }
    @Post('forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }
}