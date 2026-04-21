# E-commerce Backend API (NestJS)

This project is a backend API built using NestJS to simulate a real-world e-commerce system. It focuses on authentication, role-based access control, order management, and payment processing using Stripe.

## Features

- Authentication using JWT and refresh tokens
- Role-based authorization (Customer / Seller)
- Product management (CRUD)
- Order system with stock handling and transactional safety
- Stripe payment integration using Payment Intents
- Webhook handling for payment confirmation
- Secure server-side price calculation
- DTO validation and request sanitization

## Tech Stack

- NestJS
- PostgreSQL
- TypeORM
- Stripe API
- JWT Authentication

## Key Concepts Learned

- Modular backend architecture
- REST API design
- Database transactions
- Payment integration with Stripe
- Webhook handling and event processing
- Role-based access control

## Payment Flow

1. User creates order
2. Backend calculates total price
3. Stripe Payment Intent is created
4. User completes payment
5. Stripe webhook confirms payment
6. Order status updated to PAID
