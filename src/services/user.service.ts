
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EditUserDto } from 'src/dto';
import { PrismaService } from 'src/prisma/prisma.service';

import { 
  UnauthorizedException 
} from '@nestjs/common';


@Injectable()
export class UserService {
    constructor(private prisma: PrismaService){}

    async editUser(
        userId: string, // Corrigido para string
        dto: EditUserDto,
    ) {
        // Lista de campos permitidos para edição
        const allowedFields = ['firstName', 'lastName', 'email'];
        const filteredDto = this.filterDto(dto, allowedFields);
        
        if (dto.email) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: dto.email }
            });
            
            if (existingUser && existingUser.id !== userId) {
                throw new ConflictException('Email already in use');
            }
        }

        try {
            return await this.prisma.user.update({
                where: { id: userId },
                data: filteredDto,
            });
        } catch (error) {
            if (error === 'P2025') {
                throw new NotFoundException('User not found');
            }
            throw error;
        }
    }

    async deleteUser(userId: string) {
        try {
            // Exclusão lógica (alternativa à física)
            return await this.prisma.user.update({
                where: { id: userId },
                data: { isActive: false },
            });

            // Para exclusão física:
            //return await this.prisma.user.delete({ where: { id: userId } });
        } catch (error) {
            if (error === 'P2025') {
                throw new NotFoundException('User not found');
            }
            throw error;
        }
    }

    private filterDto(dto: EditUserDto, allowedFields: string[]) {
        return Object.keys(dto)
            .filter(key => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = dto[key];
                return obj;
            }, {});
    }
}