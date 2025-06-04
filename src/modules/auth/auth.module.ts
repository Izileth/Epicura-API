import { Module } from "@nestjs/common";
import { AuthController } from "src/controllers/auth.controller";
import { AuthService } from "src/services/auth.service";

import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailerModule } from "@nestjs-modules/mailer";
import { PrismaService } from "src/prisma/prisma.service";
import { JwtStrategy } from "src/strategies/jwt.strategy";
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }), 
        MailerModule,
        JwtModule.registerAsync({
        imports: [ConfigModule],
        useFactory: async (config: ConfigService) => ({
            secret: config.get<string>('JWT_SECRET'),
            signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION') }
        }),
        inject: [ConfigService]
        })
    ],
    controllers: [AuthController],
    providers: [AuthService, PrismaService, JwtStrategy]
})
export class AuthModule {}


