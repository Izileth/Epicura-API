import { Body, Controller, HttpCode, HttpStatus, Post, Res, ValidationPipe , ForbiddenException, Req } from "@nestjs/common";
import { AuthDto, ResetPasswordDto, ForgotPasswordDto } from "src/dto";
import { UsePipes } from "@nestjs/common";
import { AuthService } from "src/services/auth.service";
import { Response } from "express";
import { ConfigService } from "@nestjs/config";


import { RequestWithCookies } from "src/interfaces/request.interface";
import { RefreshTokenDto } from "src/dto/refresh.token-dto";
@Controller("auth")
export class AuthController {
    constructor(
        private authService: AuthService,
        private config: ConfigService
    ) {}
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
    // Systen of Redefinition of Usrer Password
    @Post('forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

     
    @Post('forgot-password-test') // Rota específica para testes
    async forgotPasswordTest(@Body() dto: ForgotPasswordDto) {
        if (this.config.get('NODE_ENV') !== 'development') {
        throw new ForbiddenException('Esta rota só está disponível em desenvolvimento');
        }

        const { token } = await this.authService.generatePasswordResetToken(dto.email);
        return { 
        message: 'Token de redefinição (APENAS PARA TESTES)',
        token, // Token retornado diretamente (não fazer isso em produção!)
        resetLink: `${this.config.get('FRONTEND_URL')}/reset-password?token=${token}`,
        };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Req() req: RequestWithCookies,
        @Res({ passthrough: true }) res: Response,
        @Body() body: RefreshTokenDto
        ) {
        return this.authService.refreshTokens(req, res, body);
    }
}