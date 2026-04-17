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
import Stripe from 'stripe';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-payment-intent')
  async createPaymentIntent(@Body() body: { orderId: string; amount: number }) {
    const paymentIntent = await this.stripeService.createPaymentIntent(
      body.orderId,
      body.amount,
    );

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  @Post('webhook')
  handleWebhook(
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

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;

      const orderId = paymentIntent.metadata?.orderId;

      console.log('✅ Payment success for order:', orderId);
    }

    return { received: true };
  }
}
