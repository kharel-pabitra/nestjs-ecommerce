// import Stripe from 'stripe';
import type Stripe from 'stripe';
import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  BadRequestException,
} from '@nestjs/common';

import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { StripeService } from './stripe.service';

import { OrderService } from 'src/order/order.service';

@Controller('stripe')
export class StripeController {
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
    const stripe = this.stripeService.getStripeInstance();

    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err}`);
    }

    const paymentIntent = event.data.object as any;

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.orderService.markOrderPaid(paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        await this.orderService.markOrderFailed(paymentIntent.id);
        break;

      case 'payment_intent.canceled':
        await this.orderService.markOrderFailed(paymentIntent.id);
        break;
    }

    return { received: true };
  }
}
