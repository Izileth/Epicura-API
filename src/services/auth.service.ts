import { ForbiddenException, Injectable, NotFoundException, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { AuthDto, ForgotPasswordDto, ResetPasswordDto } from "src/dto";
import { PrismaService } from "src/prisma/prisma.service";
import * as argon from 'argon2'
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";

import { ResendService } from "./resend.service";

import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
        //private mailerService: MailerService,
        private readonly resendService: ResendService,
    ) {}

    async signup(dto: AuthDto) {
        const hash = await argon.hash(dto.password);
        
        try {
            
            const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                hash
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
            });
            return user;

        } catch (error) {
            if (error.code === "P2002") {
                console.log(error);
                throw new ForbiddenException("Email already in use");
            }
            throw new InternalServerErrorException("Erro ao criar usuário");
        }
    }

    async signin(dto: AuthDto, res: Response) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });

        if (!user) throw new ForbiddenException("Credential Invalid!");
         
        if (!user || !user.isActive) { 
            throw new UnauthorizedException("Credenciais inválidas");
        }

        const pwMatches = await argon.verify(user.hash, dto.password);
        if (!pwMatches) throw new ForbiddenException("Credential Incorrect!");

        const token = await this.jwt.signAsync(
            { sub: user.id, email: user.email },
            {
                expiresIn: this.config.get("JWT_EXPIRATION"),
                secret: this.config.get("JWT_SECRET"),
            }
        );

        res.cookie("access_token", token, {
            httpOnly: true,
            secure: this.config.get("NODE_ENV") === "production",
            sameSite: "strict",
            maxAge: 3600 * 1000, // 1 hora
            path: "/",
        });

        return { 
            access_token: token,
            data: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isActive: user.isActive,

            }
         };
    }

    signout(res: Response) {
        res.clearCookie("access_token");
        return { message: "Logout realizado com sucesso" };
    }
     
    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
        });

        if (!user) {
        return { message: 'Se o email existir, um link de recuperação será enviado' };
        }

        const resetToken = uuidv4();
        const resetTokenExpires = new Date(Date.now() + 2 * 60 * 60 * 1000);

        await this.prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken,
            resetTokenExpires,
        },
        });

        const resetLink = `${this.config.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
        
        await this.resendService.sendPasswordResetEmail(
        user.email,
        user.firstName || 'Usuário',
        resetLink
        );

        return { message: 'Link de recuperação enviado para seu email' };
    }

    async resetPassword(dto: ResetPasswordDto) {
        const whereCondition = dto.token
            ? { resetToken: dto.token, resetTokenExpires: { gt: new Date() } }
            : { resetCode: dto.code, resetCodeExpires: { gt: new Date() } };

        const user = await this.prisma.user.findFirst({ where: whereCondition });

        if (!user) throw new NotFoundException('Token/código inválido ou expirado');

        const hash = await argon.hash(dto.newPassword);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
            hash,
            resetToken: null,
            resetTokenExpires: null,
            resetCode: null,
            resetCodeExpires: null,
            },
        });

        return { message: 'Senha redefinida com sucesso' };
    }
      
    async generatePasswordResetToken(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new NotFoundException('Usuário não encontrado');

        const resetToken = uuidv4();
        const resetTokenExpires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas

        await this.prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpires },
        });

        return { token: resetToken };
    }
     // Método alternativo com código numérico (opcional)

    async generateResetCode(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new NotFoundException('Usuário não encontrado');

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        await this.prisma.user.update({
            where: { id: user.id },
            data: { 
            resetCode,
            resetCodeExpires,
            resetToken: null, // Limpa token anterior
            resetTokenExpires: null 
            },
        });

        return { code: resetCode };
    }
}