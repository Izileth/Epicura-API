import { Request } from 'express';
import type { User } from 'generated/prisma';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}