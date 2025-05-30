import { Body, Controller, HttpCode, HttpStatus, Post, Res} from "@nestjs/common";
import { AuthDto } from "src/dto";
import { AuthService } from "src/services/auth.service";
import { Response } from "express";

@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) {}
    @HttpCode(HttpStatus.CREATED)
    @Post("signup")
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
}