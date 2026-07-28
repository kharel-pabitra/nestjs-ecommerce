import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
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
  private readonly logger = new Logger(OrderService.name);
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
      this.logger.warn(`Invalid status transition: ${current} -> ${next}`);
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
    const updatedOrder = await manager.save(order);

    this.logger.log(
      `Order ${updatedOrder.id} status updated to ${updatedOrder.status}`,
    );

    return updatedOrder;
  }

  private async findOrderWithLockById(manager: EntityManager, orderId: string) {
    const order = await manager.findOne(Order, {
      where: { id: orderId },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) {
      this.logger.warn(`Order not found: ${orderId}`);
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
      this.logger.warn(
        `Order not found for payment intent: ${paymentIntentId}`,
      );
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      let totalPrice = 0;
      const orderItems: OrderItem[] = [];
      this.logger.log(
        `Creating order for user ${userId} with ${dto.orderItems.length} item(s)`,
      );

      for (const item of dto.orderItems) {
        const product = await manager.findOne(Product, {
          where: { id: item.product },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(`Product not found`);
        }

        this.logger.log(
          `Reserving ${item.quantity} unit(s) of product ${product.id}`,
        );

        if (product.unitsInStock - product.unitsReserved < item.quantity) {
          this.logger.warn(
            `Insufficient stock for product ${product.id}. Requested=${item.quantity}, Available=${product.unitsInStock - product.unitsReserved}`,
          );

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

      this.logger.log(
        `Order ${savedOrder.id} created successfully. Total: ${totalPrice}`,
      );

      return savedOrder;
    });
  }

  async findAll(userId?: string): Promise<Order[]> {
    this.logger.log(
      userId ? `Fetching orders for user ${userId}` : 'Fetching all orders',
    );

    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.user', 'user');

    if (userId) {
      query.where('user.id = :userId', { userId });
    }

    const orders = await query.getMany();

    this.logger.log(`Retrieved ${orders.length} order(s)`);

    return orders;
  }

  //customer order status
  async cancelOrderByCustomer(userId: string, orderId: string) {
    return this.dataSource.transaction(async (manager) => {
      this.logger.log(
        `User ${userId} requested cancellation of order ${orderId}`,
      );

      const order = await this.findOrderWithLockById(manager, orderId);

      if (order.user.id !== userId) {
        this.logger.warn(
          `Unauthorized cancellation attempt by user ${userId} for order ${orderId}`,
        );

        throw new BadRequestException('Unauthorized');
      }

      if (order.status !== OrderStatus.PENDING) {
        this.logger.warn(
          `Cannot cancel order ${orderId} because status is ${order.status}`,
        );

        throw new BadRequestException('Cannot cancel after processing');
      }

      return this.updateOrderStatus(manager, order, OrderStatus.CANCELLED);
    });
  }

  async returnOrderByCustomer(userId: string, orderId: string) {
    return this.dataSource.transaction(async (manager) => {
      this.logger.log(`User ${userId} requested return for order ${orderId}`);

      const order = await this.findOrderWithLockById(manager, orderId);

      if (order.user.id !== userId) {
        this.logger.warn(
          `Return denied for order ${orderId}. Status: ${order.status}`,
        );

        throw new BadRequestException('Unauthorized');
      }

      if (order.status !== OrderStatus.DELIVERED) {
        this.logger.warn(
          `Return denied for order ${orderId}. Status: ${order.status}`,
        );

        throw new BadRequestException('Only delivered orders can be returned');
      }

      return this.updateOrderStatus(manager, order, OrderStatus.RETURNED);
    });
  }

  //seller status updates
  async markOrderShipped(orderId: string) {
    return this.dataSource.transaction(async (manager) => {
      this.logger.log(`Marking order ${orderId} as SHIPPED`);

      const order = await this.findOrderWithLockById(manager, orderId);

      return this.updateOrderStatus(manager, order, OrderStatus.SHIPPED);
    });
  }

  async markOrderDelivered(orderId: string) {
    this.logger.log(`Marking order ${orderId} as DELIVERED`);

    return this.dataSource.transaction(async (manager) => {
      const order = await this.findOrderWithLockById(manager, orderId);

      return this.updateOrderStatus(manager, order, OrderStatus.DELIVERED);
    });
  }

  //stripe order
  async validateOrderForPayment(orderId: string): Promise<Order> {
    this.logger.log(`Validating order ${orderId} for payment`);

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      this.logger.warn(`Payment validation failed. Order ${orderId} not found`);
      throw new NotFoundException('Order Not found.');
    }

    if (order.status !== OrderStatus.PENDING) {
      this.logger.warn(
        `Payment attempted for processed order ${orderId}. Status=${order.status}`,
      );

      throw new BadRequestException('Order already processed');
    }

    return order;
  }

  async attachPaymentIntent(orderId: string, paymentIntentId: string) {
    this.logger.log(
      `Attaching payment intent ${paymentIntentId} to order ${orderId}`,
    );

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      this.logger.warn(
        `payment intent attachment failed. Order ${orderId} not found`,
      );
      throw new NotFoundException('Order not found');
    }

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
      this.logger.log(
        `Payment succeeded for payment intent ${paymentIntentId}`,
      );

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
      this.logger.log(`Expiring order ${orderId}`);

      const order = await this.findOrderWithLockById(manager, orderId);

      if (order.status !== OrderStatus.PENDING) {
        this.logger.log(
          `Skipping expiration for order ${orderId}. Current status: ${order.status}`,
        );
        return;
      }

      return this.updateOrderStatus(manager, order, OrderStatus.EXPIRED);
    });
  }
}
