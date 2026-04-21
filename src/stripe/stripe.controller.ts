import Stripe from 'stripe';
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

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    console.log('🔥 WEBHOOK HIT');
    const stripe = this.stripeService.getStripeInstance();
    console.log('🔐 Signature present:', !!sig);

    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string,
      );

      console.log('➡️ Event type:', event.type);
      console.log('➡️ Event ID:', event.id);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;

      console.log('💰 PaymentIntent ID:', paymentIntent.id);
      console.log('📦 Metadata:', paymentIntent.metadata);
      const orderId = paymentIntent.metadata?.orderId;

      await this.orderService.markOrderPaid(orderId as string);
      console.log('💰 Order marked as PAID:', orderId);
    }

    return { received: true };
  }
}
