import { Body, Controller, Get, Patch, Req, UseGuards, Delete } from '@nestjs/common';
import { User } from 'generated/prisma';
import { GetUser } from 'src/decorator';
import { EditUserDto } from 'src/dto';
import { JwtGuard } from 'src/guard';
import { UserService } from 'src/services/user.service';
    


@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
    constructor(private userService: UserService){}

    @Get('me')
    async getMe(@GetUser() user: User) {
        // Remover campos sensíveis antes de retornar
        const { hash, role, isActive, ...safeUser } = user;
        return safeUser;
    }

    @Patch()
    editUser(
        @GetUser('id') userId: string, 
        @Body() dto: EditUserDto
    ) {
        return this.userService.editUser(userId, dto);
    }

    @Delete()
    deleteUser(
        @GetUser('id') userId: string
    ) {
        return this.userService.deleteUser(userId);
    }
}