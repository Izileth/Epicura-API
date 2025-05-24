
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'generated/prisma';
export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => { // Use a tipagem correta
    const request = ctx.switchToHttp().getRequest() as { user: User };
    
    if (data) {
        return request.user[data];
    }
    return request.user;
  },
);
