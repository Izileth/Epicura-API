import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { CartService } from 'src/services/cart.service';
import { AddItemDto, UpdateItemDto, CartSessionDto, CartResponseDto } from 'src/dto';
import { JwtGuard } from 'src/guard';

import { RequestWithUser } from 'src/interfaces/user-interface';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @ApiOperation({ summary: 'Get or create cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved/created', type: CartResponseDto })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get()
  async getOrCreateCart(
    @Req() req: RequestWithUser,
    @Query() cartSessionDto: CartSessionDto,
  ): Promise<CartResponseDto> {
    // Extrair user-id do header manualmente
    const headerUserId = req.headers['user-id'] as string;
    
    // SOLUÇÃO TEMPORÁRIA: Decodificar JWT manualmente se req.user não estiver disponível
    let userId = req.user?.id || headerUserId;
    
    if (!userId && req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        // Decodificar o payload do JWT (apenas a parte do payload, sem verificar assinatura)
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
        userId = payload.sub; // 'sub' é geralmente o user ID no JWT
        console.log('JWT Payload decoded:', payload);
      } catch (error) {
        console.error('Error decoding JWT:', error);
      }
    }
    
    const sessionId = cartSessionDto.sessionId;

    console.log('Debug - Final userId:', userId);
    //console.log('Debug - sessionId:', sessionId);
    console.log('Debug - req.user:', req.user);
    //console.log('Debug - header user-id:', headerUserId);

    // Se ainda não tiver userId, criar um sessionId temporário
    if (!userId && !sessionId) {
      const tempSessionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Creating temporary session ID:', tempSessionId);
      return this.cartService.getOrCreateCart(undefined, tempSessionId);
    }

    return this.cartService.getOrCreateCart(userId, sessionId);
  }

  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('items')
  async addItem(
    @Req() req: RequestWithUser,
    @Body() addItemDto: AddItemDto,
  ): Promise<CartResponseDto> {
      console.log('Received DTO:', addItemDto);
  console.log('Type of productId:', typeof addItemDto.productId);
  console.log('Type of quantity:', typeof addItemDto.quantity)
    const cart = await this.cartService.getOrCreateCart(req.user.id);
    await this.cartService.addItemToCart(cart.id, addItemDto);
    return this.cartService.getOrCreateCart(req.user.id);
  }

  @ApiOperation({ summary: 'Update cart item' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Put('items/:itemId')
  async updateItem(
    @Req() req: RequestWithUser,
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.cartService.getOrCreateCart(req.user.id);
    await this.cartService.updateCartItem(cart.id, itemId, updateItemDto);
    return this.cartService.getOrCreateCart(req.user.id);
  }

  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed' })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Delete('items/:itemId')
  async removeItem(
    @Req() req: RequestWithUser,
    @Param('itemId') itemId: string,
  ): Promise<CartResponseDto> {
    const cart = await this.cartService.getOrCreateCart(req.user.id);
    await this.cartService.removeItemFromCart(cart.id, itemId);
    return this.cartService.getOrCreateCart(req.user.id);
  }

  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Delete('clear')
  async clearCart(@Req() req: RequestWithUser): Promise<CartResponseDto> {
    const cart = await this.cartService.getOrCreateCart(req.user.id);
    await this.cartService.clearCart(cart.id);
    return this.cartService.getOrCreateCart(req.user.id);
  }

  @ApiOperation({ summary: 'Merge session cart with user cart' })
  @ApiResponse({ status: 200, description: 'Carts merged', type: CartResponseDto })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('merge')
  async mergeCarts(
    @Req() req: RequestWithUser,
    @Query() cartSessionDto: CartSessionDto,
    ): Promise<CartResponseDto> {
    if (!cartSessionDto.sessionId) {
        throw new Error('Session ID is required');
    }
    return this.cartService.mergeCarts(req.user.id, cartSessionDto.sessionId);
  }

  @ApiOperation({ summary: 'Get cart total' })
  @ApiResponse({ status: 200, description: 'Cart total calculated', type: Number })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('total')
  async getTotal(@Req() req: RequestWithUser): Promise<{ total: number }> {
    const cart = await this.cartService.getOrCreateCart(req.user.id);
    const total = await this.cartService.getCartTotal(cart.id);
    return { total };
  }
}