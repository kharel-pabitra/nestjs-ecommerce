import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './orderItem.entity';
import { Product } from 'src/product/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './enums/order-status.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      let totalPrice = 0;
      const orderItems: OrderItem[] = [];

      for (const item of dto.orderItems) {
        const product = await manager.findOne(Product, {
          where: { id: item.product },
        });

        if (!product) {
          throw new NotFoundException(`Product not found`);
        }

        if (product.unitsInStock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}`,
          );
        }

        product.unitsInStock -= item.quantity;
        await manager.save(product);

        const orderItem = manager.create(OrderItem, {
          product,
          quantity: item.quantity,
          price: product.price,
        });

        totalPrice += product.price * item.quantity;
        orderItems.push(orderItem);
      }

      const order = manager.create(Order, {
        user: { id: userId },
        items: orderItems,
        totalPrice,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await manager.save(order);
      // now attach order to items
      for (const item of orderItems) {
        item.order = savedOrder;
      }

      // save order items explicitly
      await manager.save(OrderItem, orderItems);

      return savedOrder;
    });
  }

  async findAll(userId?: string): Promise<Order[]> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.user', 'user');

    if (userId) {
      query.where('user.id = :userId', { userId });
    }

    return query.getMany();
  }

  async updateStatusWithRole(
    id: string,
    status: OrderStatus,
    user: { id: string; role: string },
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        relations: ['items', 'items.product', 'user'],
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // 👤 CUSTOMER RULES
      if (user.role === 'CUSTOMER') {
        if (order.user.id !== user.id) {
          throw new BadRequestException('Unauthorized');
        }

        const allowedStatuses = [OrderStatus.CANCELLED, OrderStatus.RETURNED];

        if (!allowedStatuses.includes(status)) {
          throw new BadRequestException(
            'Customers can only cancel or return orders',
          );
        }

        // ❗ cannot cancel after shipped
        if (
          status === OrderStatus.CANCELLED &&
          order.status !== OrderStatus.PENDING
        ) {
          throw new BadRequestException(
            'Cannot cancel after order is processed',
          );
        }
      }

      // 🧑‍💼 SELLER RULES
      if (user.role === 'SELLER') {
        const allowedStatuses = [OrderStatus.SHIPPED, OrderStatus.DELIVERED];

        if (!allowedStatuses.includes(status)) {
          throw new BadRequestException('Seller cannot set this status');
        }
      }

      // ✅ restore stock if cancelled
      if (status === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          const product = item.product;
          product.unitsInStock += item.quantity;
          await manager.save(product);
        }
      }

      order.status = status;

      return manager.save(order);
    });
  }
}
