import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'generated/prisma';

export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest() as { user?: User };
    
    // Verificação se o user existe
    if (!request.user) {
      return data ? undefined : undefined;
    }
    
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);