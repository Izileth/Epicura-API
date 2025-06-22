import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddItemDto, UpdateItemDto, CartResponseDto } from 'src/dto';
import { CART_EXPIRATION_DAYS } from 'src/constants/cart.constants';
import { ProductService } from './product.service';
import type { CartItem } from 'generated/prisma';
import type { Product } from 'generated/prisma';
interface ValidatedCart {
  id: string;
  userId: string;
  // adicione outras propriedades que validateCart retorna
}

interface CartItemWithProduct extends CartItem {
  product: Product;
}

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private productService: ProductService,
  ) {}

  private calculateExpirationDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + CART_EXPIRATION_DAYS);
    return date;
  }


  
  async getOrCreateCart(userId: string, sessionId?: string): Promise<any> {
    const where = userId ? { userId, isActive: true } : { sessionId, isActive: true };

    let cart = await this.prisma.cart.findFirst({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    if (userId === undefined) {
        throw new Error('User ID is required');
    }


    if (!cart) {
        cart = await this.prisma.cart.create({
        data: {
            userId,
            sessionId: userId ? undefined : sessionId,
            expiresAt: this.calculateExpirationDate(),
        },
        include: {
            items: {
            include: {
                product: true,
            },
            },
        },
        });
    }

    return this.formatCartResponse(cart);
  }

  async addItemToCart(cartId: string, itemData: AddItemDto): Promise<CartItemWithProduct> {
    const cart = await this.validateCart(cartId);
    
    const product = await this.productService.getProductById(
      cart.userId,
      itemData.productId
    );

    if (!product.isAvailable) {
      throw new BadRequestException('Product is not available');
    }

    // Verifica se o item já existe no carrinho
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId: itemData.productId,
      },
    });

    if (existingItem) {
      // Atualiza a quantidade se o item já existir
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + itemData.quantity,
          notes: itemData.notes || existingItem.notes,
        },
        include: { product: true },
      });
    }

    // Cria um novo item no carrinho
    return this.prisma.cartItem.create({
      data: {
        cartId,
        productId: itemData.productId,
        quantity: itemData.quantity,
        priceAtAdd: product.price,
        notes: itemData.notes,
      },
      include: { product: true },
    });
  }

  async updateCartItem(cartId: string, itemId: string, updateData: UpdateItemDto): Promise<any> {
    await this.validateCart(cartId);
    
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId, cartId },
    });

    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: updateData,
      include: { product: true },
    });
  }

  async removeItemFromCart(cartId: string, itemId: string): Promise<void> {
    await this.validateCart(cartId);
    
    try {
      await this.prisma.cartItem.delete({
        where: { id: itemId, cartId },
      });
    } catch (error) {
      throw new NotFoundException('Item not found in cart');
    }
  }

  async clearCart(cartId: string): Promise<void> {
    await this.validateCart(cartId);
    
    await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }

  async mergeCarts(userId: string, sessionId: string): Promise<any> {
    const sessionCart = await this.prisma.cart.findFirst({
      where: { sessionId, isActive: true },
      include: { items: true },
    });

    if (!sessionCart) {
      return this.getOrCreateCart(userId);
    }

    const userCart = await this.getOrCreateCart(userId);

    // Transferir itens do carrinho de sessão para o carrinho do usuário
    for (const item of sessionCart.items) {
      await this.addItemToCart(userCart.id, {
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes || undefined,
      });
    }

    // Desativar o carrinho de sessão
    await this.prisma.cart.update({
      where: { id: sessionCart.id },
      data: { isActive: false },
    });

    return this.getOrCreateCart(userId);
  }

  async getCartTotal(cartId: string): Promise<number> {
    await this.validateCart(cartId);
    
    const items = await this.prisma.cartItem.findMany({
      where: { cartId },
      include: { product: true },
    });

    return items.reduce((total, item) => {
      return total + (item.priceAtAdd * item.quantity);
    }, 0);
  }

  async deactivateCart(cartId: string): Promise<any> {
    return this.prisma.cart.update({
      where: { id: cartId },
      data: { isActive: false },
    });
  }
  
  async validateCart(cartId: string): Promise<ValidatedCart> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId }
    });
    
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    
    return cart;
  }

  private formatCartResponse(cart: any): CartResponseDto {
    const total = cart.items.reduce((sum: number, item: any) => {
      return sum + (item.priceAtAdd * item.quantity);
    }, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items: cart.items,
      isActive: cart.isActive,
      total,
      expiresAt: cart.expiresAt,
    };
  }
}