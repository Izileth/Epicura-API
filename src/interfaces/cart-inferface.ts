import { Cart, CartItem } from "generated/prisma";
import { AddItemDto, UpdateItemDto } from "src/dto";
export interface ICartService {
  getOrCreateCart(userId: string, sessionId?: string): Promise<Cart>;
  addItemToCart(cartId: string, itemData: AddItemDto): Promise<CartItem>;
  updateCartItem(cartId: string, itemId: string, updateData: UpdateItemDto): Promise<CartItem>;
  removeItemFromCart(cartId: string, itemId: string): Promise<void>;
  clearCart(cartId: string): Promise<void>;
  mergeCarts(userId: string, sessionId: string): Promise<Cart>;
  getCartTotal(cartId: string): Promise<number>;
  deactivateCart(cartId: string): Promise<Cart>;
}