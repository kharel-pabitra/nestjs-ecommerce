import Stripe from 'stripe';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class StripeService {
  private stripe: Stripe.Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2026-03-25.dahlia', // use stable/latest from dashboard
    });
  }

  getStripeInstance(): Stripe.Stripe {
    return this.stripe;
  }

  async createPaymentIntent(orderId: string, amount: number) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        metadata: {
          orderId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (err) {
      console.log('error', err);
      throw new InternalServerErrorException();
    }
  }
}
