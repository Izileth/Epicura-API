import { Module } from "@nestjs/common";
import { AuthController } from "src/controllers/auth.controller";
import { AuthService } from "src/services/auth.service";

@Module({
    controllers: [AuthController],
    providers: [AuthService],
})

export class AuthModule {}
