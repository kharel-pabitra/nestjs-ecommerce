# 🛒 Ecommerce Backend API (NestJS)

## 📌 Overview

This is a RESTful ecommerce backend built with **NestJS + TypeORM + PostgreSQL**.

It supports:

- User authentication (JWT + refresh tokens)
- Role-based authorization (Customer / Seller)
- Product management
- Order processing with stock reservation
- Stripe payment integration (PaymentIntents + Webhooks)

---

## ⚙️ Tech Stack

- NestJS
- PostgreSQL
- TypeORM
- JWT (Access + Refresh tokens)
- Stripe API
- bcrypt (password hashing)
- class-validator (DTO validation)

---

## 🔐 Authentication System

### Login Flow

1. User logs in with email/password
2. Password is verified using `bcrypt.compare`
3. System generates:
   - **Access Token (15 min)**
   - **Refresh Token (7 days)**

---

### Token Storage

| Token         | Storage                       |
| ------------- | ----------------------------- |
| Access Token  | Client (Authorization header) |
| Refresh Token | HTTP-only cookie              |

---

### JWT Payload

```json
{
  "userId": "string",
  "email": "string",
  "role": "CUSTOMER | SELLER"
}
```

---

### Token Refresh

- Endpoint: `/auth/refresh`
- Reads refresh token from cookie
- Issues new access token
- Invalid token → 401 Unauthorized

---

## 👤 User Module

### POST `/user/register`

Registers a new user.

#### Rules:

- Email must be unique
- Password is hashed using bcrypt (salt rounds = 10)
- Default role = CUSTOMER

---

## 🛍 Product Module

### Public Routes

#### GET `/product`

Returns all products

#### GET `/product/:id`

Returns single product

---

### Protected Routes (SELLER only)

Requires:

```
Authorization: Bearer <access_token>
```

#### POST `/product`

Create product

#### PATCH `/product/:id`

Update product

#### DELETE `/product/:id`

Delete product

---

### Product Entity Rules

- `unitsInStock` → available stock
- `unitsReserved` → locked during pending orders

---

## 📦 Order System

### Order Flow

1. Customer places order
2. Stock is reserved immediately
3. Order status = `PENDING`
4. Payment initiated via Stripe
5. Webhook confirms payment

---

### Order Status Lifecycle

```
PENDING
  → PAID
  → SHIPPED
  → DELIVERED
  → RETURNED
```

#### Alternative paths:

- PENDING → CANCELLED
- PENDING → FAILED
- PENDING → EXPIRED

---

### Stock Logic

#### On order creation:

- `unitsReserved += quantity`

#### On payment success:

- `unitsReserved -= quantity`
- `unitsInStock -= quantity`

#### On cancel/failure:

- Reserved stock is released

---

## 💳 Stripe Payment System

### POST `/stripe/create-payment-intent`

- Input: `orderId`
- Output: `clientSecret`

#### Behavior:

- Converts order total to cents
- Creates Stripe PaymentIntent
- Stores `paymentIntentId` in order

---

### POST `/stripe/webhook`

Stripe events handled:

| Event                         | Action            |
| ----------------------------- | ----------------- |
| payment_intent.succeeded      | Mark order PAID   |
| payment_intent.payment_failed | Mark order FAILED |
| payment_intent.canceled       | Mark order FAILED |

👉 Webhook is **source of truth**

---

## 🧾 Business Rules

- Only SELLER can manage products
- Only authenticated users can place orders
- Orders are immutable after PAID
- Stock is reserved before payment
- PaymentIntent is unique per order (no reuse)
- Only owner can cancel their order

---

## 🔒 Security

- JWT authentication
- Role-based guards (`JwtAuthGuard`, `RolesGuard`)
- Password hashing using bcrypt
- HTTP-only cookies for refresh tokens
- Stripe webhook signature verification

---

## ⚠️ Error Handling

| Error | Meaning                                   |
| ----- | ----------------------------------------- |
| 401   | Invalid auth / token                      |
| 400   | Invalid request / business rule violation |
| 404   | Resource not found                        |

---

## 🌍 Environment Variables

```
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_TOKEN=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 📌 Known Limitations (Learning Project)

- No admin dashboard
- No product categories
- No cart system
- No refunds system
- No multi-currency support

---

## 🧠 Key Design Decisions

- Stock reservation prevents overselling
- Stripe webhook ensures payment accuracy
- Orders use database transactions
- PaymentIntent is one-to-one with order

---

## 🧪 Test Client (Stripe + Order Flow)

A minimal test client is provided to demonstrate full Stripe payment lifecycle including webhook-driven state updates.

**Features:**

- Add products to cart
- Create order via API
- Enter card details using Stripe Elements
- Complete payment
- Trigger Stripe webhook events

### How to use

- Start backend server
- Open test.html in browser **Notes: Replace hardcoded token with a valid access token**
- Add product IDs and quantities
- Click Create Order
- Enter test card details:
- 4242 4242 4242 4242
- Any future date
- Any CVC
- Click Pay Now

## 🚀 Summary

This backend is a **production-inspired ecommerce system** focused on:

- Correct order state transitions
- Safe stock handling
- Secure authentication/authorisation
- Real-world Stripe integration pattern
