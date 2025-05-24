import { ForbiddenException, Injectable } from "@nestjs/common";
import { AuthDto } from "src/dto";
import { PrismaService } from "src/prisma/prisma.service";
import * as argon from 'argon2'
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService
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
}
