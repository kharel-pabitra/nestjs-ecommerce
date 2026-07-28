import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { StripeService } from './stripe.service';

import { OrderService } from 'src/order/order.service';

@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);
  constructor(
    private readonly stripeService: StripeService,
    private readonly orderService: OrderService,
  ) {}

  @Post('create-payment-intent')
  async createPaymentIntent(@Body() body: { orderId: string }) {
    const order = await this.orderService.validateOrderForPayment(body.orderId);

    const amount = Math.round(order.totalPrice * 100);

    const paymentIntent = await this.stripeService.createPaymentIntent(
      body.orderId,
      amount,
    );

    await this.orderService.attachPaymentIntent(order.id, paymentIntent.id);

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    this.logger.log('Received Stripe webhook');
    const stripe = this.stripeService.getStripeInstance();

    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string,
      );
      this.logger.log(`Webhook verified successfully: ${event.type}`);
    } catch (err) {
      this.logger.error(
        'Webhook signature verification failed',
        err instanceof Error ? err.stack : String(err),
      );
      throw new BadRequestException(`Webhook Error: ${err}`);
    }

    const paymentIntent = event.data.object as any;

    switch (event.type) {
      case 'payment_intent.succeeded':
        this.logger.log(`Processing successful payment: ${paymentIntent.id}`);

        await this.orderService.markOrderPaid(paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        this.logger.warn(`Processing failed payment: ${paymentIntent.id}`);
        await this.orderService.markOrderFailed(paymentIntent.id);
        break;

      case 'payment_intent.canceled':
        this.logger.warn(`Processing cancelled payment: ${paymentIntent.id}`);
        await this.orderService.markOrderFailed(paymentIntent.id);
        break;
    }

    this.logger.log(`Finished processing webhook: ${event.type}`);

    return { received: true };
  }
}
