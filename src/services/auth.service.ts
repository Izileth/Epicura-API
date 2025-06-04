import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuthDto, ForgotPasswordDto, ResetPasswordDto } from "src/dto";
import { PrismaService } from "src/prisma/prisma.service";
import * as argon from 'argon2'
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import {MailerService} from "@nestjs-modules/mailer"
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
        private mailerService: MailerService,
    ) {}

    async signup(dto: AuthDto) {
        const hash = await argon.hash(dto.password);

        try {
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    hash,
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
                throw new ForbiddenException("Credentials Taken");
            }
            throw error;
        }
    }

    async signin(dto: AuthDto, res: Response) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });

        if (!user) throw new ForbiddenException("Credential Invalid!");

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

        return { access_token: token };
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
        // Não revele que o email não existe por questões de segurança
        return { message: 'Se o email existir, um link de recuperação será enviado' };
        }

        // Gerar token e expiração
        const resetToken = uuidv4();
        const resetTokenExpires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas em milissegundo

        await this.prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken,
            resetTokenExpires,
        },
        });
          
        await this.mailerService.sendMail({
        to: user.email,
        subject: 'Recuperação de Senha',
        template: 'forgot-password', // Crie este template
        context: {
            name: user.firstName || 'Usuário',
            resetLink: `${this.config.get('FRONTEND_URL')}/reset-password?token=${resetToken}`,
        },
        });

        return { message: 'Link de recuperação enviado para seu email' };
    }    

    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.prisma.user.findFirst({
        where: {
            resetToken: dto.token,
            resetTokenExpires: { gt: new Date() }, // Token ainda não expirou
        },
        });

        if (!user) {
        throw new NotFoundException('Token inválido ou expirado');
        }

        const hash = await argon.hash(dto.newPassword);

        await this.prisma.user.update({
        where: { id: user.id },
        data: {
            hash,
            resetToken: null,
            resetTokenExpires: null,
        },
        });

        return { message: 'Senha alterada com sucesso' };
    }



}