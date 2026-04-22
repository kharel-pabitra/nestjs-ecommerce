import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
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

  private validateTransition(current: OrderStatus, next: OrderStatus) {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [
        OrderStatus.PAID,
        OrderStatus.CANCELLED,
        OrderStatus.FAILED,
        OrderStatus.EXPIRED,
      ],
      [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
      [OrderStatus.FAILED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.RETURNED]: [],
      [OrderStatus.EXPIRED]: [],
    };

    if (!transitions[current]?.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition from ${current} to ${next}`,
      );
    }
  }

  private async updateOrderStatus(
    manager: EntityManager,
    order: Order,
    newStatus: OrderStatus,
  ): Promise<Order> {
    this.validateTransition(order.status, newStatus);

    // STOCK LOGIC
    if (
      newStatus === OrderStatus.CANCELLED ||
      newStatus === OrderStatus.FAILED ||
      newStatus === OrderStatus.EXPIRED
    ) {
      for (const item of order.items) {
        const product = item.product;

        if (order.status === OrderStatus.PAID) {
          product.unitsInStock += item.quantity;
        } else {
          product.unitsReserved -= item.quantity;
        }

        if (product.unitsReserved < 0) {
          throw new Error('Reserved stock below zero');
        }

        await manager.save(product);
      }
    }

    if (newStatus === OrderStatus.PAID) {
      for (const item of order.items) {
        const product = item.product;

        product.unitsReserved -= item.quantity;
        product.unitsInStock -= item.quantity;

        if (product.unitsReserved < 0 || product.unitsInStock < 0) {
          throw new Error('Stock inconsistency detected');
        }

        await manager.save(product);
      }
    }

    order.status = newStatus;
    return manager.save(order);
  }

  private async findOrderWithLockById(manager: EntityManager, orderId: string) {
    const order = await manager.findOne(Order, {
      where: { id: orderId },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
  private async findOrderWithLockByPaymentIntent(
    manager: EntityManager,
    paymentIntentId: string,
  ) {
    const order = await manager.findOne(Order, {
      where: { paymentIntentId },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      let totalPrice = 0;
      const orderItems: OrderItem[] = [];

      for (const item of dto.orderItems) {
        const product = await manager.findOne(Product, {
          where: { id: item.product },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(`Product not found`);
        }

        if (product.unitsInStock - product.unitsReserved < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}`,
          );
        }

        product.unitsReserved += item.quantity;
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

  //customer order status
  async cancelOrderByCustomer(userId: string, orderId: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.findOrderWithLockById(manager, orderId);

      if (order.user.id !== userId) {
        throw new BadRequestException('Unauthorized');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Cannot cancel after processing');
      }

      return this.updateOrderStatus(manager, order, OrderStatus.CANCELLED);
    });
  }

  async returnOrderByCustomer(userId: string, orderId: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.findOrderWithLockById(manager, orderId);

      if (order.user.id !== userId) {
        throw new BadRequestException('Unauthorized');
      }

      if (order.status !== OrderStatus.DELIVERED) {
        throw new BadRequestException('Only delivered orders can be returned');
      }

      return this.updateOrderStatus(manager, order, OrderStatus.RETURNED);
    });
  }

  //seller status updates
  async markOrderShipped(orderId: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.findOrderWithLockById(manager, orderId);

      return this.updateOrderStatus(manager, order, OrderStatus.SHIPPED);
    });
  }

  async markOrderDelivered(orderId: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.findOrderWithLockById(manager, orderId);

      return this.updateOrderStatus(manager, order, OrderStatus.DELIVERED);
    });
  }

  //stripe order
  async validateOrderForPayment(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException('Order Not found.');

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order already processed');
    }

    return order;
  }

  async attachPaymentIntent(orderId: string, paymentIntentId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');

    order.paymentIntentId = paymentIntentId;
    return this.orderRepository.save(order);
  }

  async markOrderPaid(paymentIntentId: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.findOrderWithLockByPaymentIntent(
        manager,
        paymentIntentId,
      );

      if (order.status === OrderStatus.PAID) return order;

      return this.updateOrderStatus(manager, order, OrderStatus.PAID);
    });
  }

  async markOrderFailed(paymentIntentId: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.findOrderWithLockByPaymentIntent(
        manager,
        paymentIntentId,
      );

      if (order.status === OrderStatus.FAILED) return order;

      return this.updateOrderStatus(manager, order, OrderStatus.FAILED);
    });
  }

  async cancelExpiredOrder(orderId: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.findOrderWithLockById(manager, orderId);

      if (order.status !== OrderStatus.PENDING) return;

      return this.updateOrderStatus(manager, order, OrderStatus.EXPIRED);
    });
  }
}
