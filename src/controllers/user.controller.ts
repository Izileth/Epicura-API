import { Body, Controller, Get,  Req, UseGuards, Delete, Put } from '@nestjs/common';
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
    async getMe(@GetUser('id') userId: string) {
        // Buscar o usuário completo do banco de dados
        const user = await this.userService.getUserById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Remover campos sensíveis
        const {  ...safeUser } = user;
        
        return safeUser;
    }



    @Put(':id')
    editUser(
        @GetUser('id') userId: string, 
        @Body() dto: EditUserDto
    ) {
        return this.userService.editUser(
            userId, 
            dto
        );
    }

    @Delete(':id')
    deleteUser(
        @GetUser('id') userId: string
    ) {
        return this.userService.deleteUser(userId);
    }
}