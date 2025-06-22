import {
    ForbiddenException,
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    UnauthorizedException,
    Req,
    Res,
} from '@nestjs/common';
import {
    AuthDto,
    ForgotPasswordDto,
    ResetPasswordDto,
} from 'src/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

import { ResendService } from './resend.service';

import { v4 as uuidv4 } from 'uuid';

import { RequestWithCookies } from 'src/interfaces/request.interface';
import { RefreshTokenDto } from 'src/dto/token/refresh.token-dto';
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
        const hash = await argon.hash(
            dto.password,
        );

        try {
            const user =
                await this.prisma.user.create({
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
            if (error.code === 'P2002') {
                console.log(error);
                throw new ForbiddenException(
                    'Email already in use',
                );
            }
            throw new InternalServerErrorException(
                'Erro ao criar usuário',
            );
        }
    }

    async signin(dto: AuthDto, res: Response) {
        const user =
            await this.prisma.user.findUnique({
                where: { email: dto.email },
            });

        if (!user || !user.isActive) {
            throw new UnauthorizedException(
                'Credenciais inválidas',
            );
        }

        if (!user)
            throw new ForbiddenException(
                'Credential Invalid!',
            );

        const pwMatches = await argon.verify(
            user.hash,
            dto.password,
        );
        if (!pwMatches)
            throw new ForbiddenException(
                'Credencial Incorreta!',
            );

        const { accessToken, refreshToken } =
            await this.generateTokens(
                user.id,
                user.email,
            );

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure:
                this.config.get('NODE_ENV') ===
                'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutos (access token)
            path: '/',
        });
        res.cookie(
            'refresh_token',
            refreshToken,
            {
                httpOnly: true,
                secure:
                    this.config.get(
                        'NODE_ENV',
                    ) === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias (refresh token)
                path: '/auth/refresh', // Restringe a rota que pode usar o cookie
            },
        );

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            data: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isActive: user.isActive,
            },
        };
    }

    async signout(res: Response) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        return {
            message:
                'Logout realizado com sucesso',
        };
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const user =
            await this.prisma.user.findUnique({
                where: { email: dto.email },
            });

        if (!user) {
            return {
                message:
                    'Se o email existir, um link de recuperação será enviado',
            };
        }

        const resetToken = uuidv4();
        const resetTokenExpires = new Date(
            Date.now() + 2 * 60 * 60 * 1000,
        );

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
            resetLink,
        );

        return {
            message:
                'Link de recuperação enviado para seu email',
        };
    }

    async resetPassword(dto: ResetPasswordDto) {
        const whereCondition = dto.token
            ? {
                  resetToken: dto.token,
                  resetTokenExpires: {
                      gt: new Date(),
                  },
              }
            : {
                  resetCode: dto.code,
                  resetCodeExpires: {
                      gt: new Date(),
                  },
              };

        const user =
            await this.prisma.user.findFirst({
                where: whereCondition,
            });

        if (!user)
            throw new NotFoundException(
                'Token/código inválido ou expirado',
            );

        const hash = await argon.hash(
            dto.newPassword,
        );

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

        return {
            message:
                'Senha redefinida com sucesso',
        };
    }

    async generatePasswordResetToken(
        email: string,
    ) {
        const user =
            await this.prisma.user.findUnique({
                where: { email },
            });
        if (!user)
            throw new NotFoundException(
                'Usuário não encontrado',
            );

        const resetToken = uuidv4();
        const resetTokenExpires = new Date(
            Date.now() + 2 * 60 * 60 * 1000,
        ); // 2 horas

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpires,
            },
        });

        return { token: resetToken };
    }

    async generateResetCode(email: string) {
        const user =
            await this.prisma.user.findUnique({
                where: { email },
            });
        if (!user)
            throw new NotFoundException(
                'Usuário não encontrado',
            );

        const resetCode = Math.floor(
            100000 + Math.random() * 900000,
        ).toString();
        const resetCodeExpires = new Date(
            Date.now() + 15 * 60 * 1000,
        ); // 15 minutos

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetCode,
                resetCodeExpires,
                resetToken: null, // Limpa token anterior
                resetTokenExpires: null,
            },
        });

        return { code: resetCode };
    }

    private async generateTokens(
        userId: string,
        email: string,
    ) {
        const [accessToken, refreshToken] =
            await Promise.all([
                this.jwt.signAsync(
                    { sub: userId, email },
                    {
                        secret: this.config.get(
                            'JWT_SECRET',
                        ),
                        expiresIn: '15m', // Access token curto
                    },
                ),
                this.jwt.signAsync(
                    { sub: userId },
                    {
                        secret: this.config.get(
                            'JWT_REFRESH_SECRET',
                        ),
                        expiresIn: '7d', // Refresh token longo
                    },
                ),
            ]);

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                refreshToken,
                refreshTokenExp: new Date(
                    Date.now() +
                        7 * 24 * 60 * 60 * 1000,
                ),
            },
        });

        return { accessToken, refreshToken };
    }

    async refreshTokens(
        req: RequestWithCookies,
        res: Response,
        body: RefreshTokenDto,
    ) {
        const refreshToken =
            req.cookies?.refresh_token ||
            body.refreshToken;

        if (!refreshToken) {
            throw new ForbiddenException(
                'Refresh token não encontrado',
            );
        }

        const payload =
            await this.jwt.verifyAsync(
                refreshToken,
                {
                    secret: this.config.get(
                        'JWT_REFRESH_SECRET',
                    ),
                },
            );

        const user =
            await this.prisma.user.findFirst({
                where: {
                    id: payload.sub,
                    refreshToken,
                    refreshTokenExp: {
                        gt: new Date(),
                    },
                },
            });

        if (!user) {
            throw new ForbiddenException(
                'Refresh token inválido',
            );
        }

        const {
            accessToken,
            refreshToken: newRefreshToken,
        } = await this.generateTokens(
            user.id,
            user.email,
        );

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure:
                this.config.get('NODE_ENV') ===
                'production',
            maxAge: 15 * 60 * 1000, // 15 minutos
        });

        res.cookie(
            'refresh_token',
            newRefreshToken,
            {
                httpOnly: true,
                secure:
                    this.config.get(
                        'NODE_ENV',
                    ) === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
                path: '/auth/refresh',
            },
        );

        return { access_token: accessToken };
    }
}
