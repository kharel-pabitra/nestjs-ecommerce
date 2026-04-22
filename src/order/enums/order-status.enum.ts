export enum OrderStatus {
  PENDING = 'pending', // created, stock reserved
  PAID = 'paid', // confirmed
  FAILED = 'failed', // payment failed
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled', // manually cancelled
  EXPIRED = 'expired', //checkout abandoned
  RETURNED = 'returned',
}
