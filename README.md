Core backend setup
Built REST API using NestJS
Modular architecture (User, Auth, Product, Order, Stripe modules)
Clean separation of concerns (controllers, services, DTOs)

Authentication & Authorization
JWT-based authentication system
Refresh token flow using HTTP-only cookies
Role-based access control (RBAC)
CUSTOMER
SELLER
Guards + decorators (@Roles, JwtAuthGuard, RolesGuard)

Validation & DTOs
DTO-based request validation
Built-in NestJS validation pipes
Request sanitization using whitelist and forbidNonWhitelisted
Strong typing for request payloads

Product system
CRUD operations for products
Seller-only restrictions for creation/update/delete
Product stock tracking (unitsInStock)

Order system (core business logic)
Order creation with multiple products
Transaction-based order creation (TypeORM transaction)
Automatic stock deduction on order creation
Order status lifecycle:
PENDING → PAID → SHIPPED → DELIVERED → CANCELLED
Role-based order updates:
Customer: cancel / return
Seller: ship / deliver
