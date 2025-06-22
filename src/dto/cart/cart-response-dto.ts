import { CartItem } from "generated/prisma";
export class CartResponseDto {
  id: string;
  userId: string;
  items: CartItem[];
  isActive: boolean;
  total: number;
  expiresAt: Date | null;
}