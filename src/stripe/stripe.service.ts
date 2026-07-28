import Stripe from 'stripe';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe.Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2026-03-25.dahlia', // use stable/latest from dashboard
    });
    this.logger.log('Stripe service initialized');
  }

  getStripeInstance(): Stripe.Stripe {
    return this.stripe;
  }

  async createPaymentIntent(orderId: string, amount: number) {
    this.logger.log(
      `Creating payment intent for order ${orderId}. Amount: ${amount}`,
    );
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        metadata: {
          orderId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      this.logger.log(
        `Payment intent ${paymentIntent.id} created for order ${orderId}`,
      );

      return paymentIntent;
    } catch (err) {
      this.logger.error(
        `Failed to create payment intent for order ${orderId}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException();
    }
  }
}
