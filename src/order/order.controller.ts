import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './enums/order-status.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtUserDto } from 'src/auth/dto/jwt-user.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  create(@Req() req, @Body() dto: CreateOrderDto) {
    const user = req.user as JwtUserDto;
    return this.orderService.create(user.userId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  findAll() {
    return this.orderService.findAll();
  }

  @Get('me')
  getMyOrders(@Req() req) {
    const user = req.user as JwtUserDto;
    return this.orderService.findAll(user.userId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.SELLER)
  updateStatus(
    @Req() req,
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    const user = req.user as JwtUserDto;
    return this.orderService.updateStatusWithRole(id, status, {
      id: user.userId,
      role: user.role,
    });
  }
}
