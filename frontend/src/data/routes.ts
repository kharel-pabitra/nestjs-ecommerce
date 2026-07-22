import type { FieldDef } from './fieldTypes';
import type { UserRole } from '../lib/types';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface ApiRouteDef {
  id: string;
  group: 'Auth' | 'User' | 'Product' | 'Orders' | 'Stripe';
  method: HttpMethod;
  path: string; // ':param' segments are path params
  summary: string;
  auth: boolean;
  roles?: UserRole[]; // if set, only these roles may call it
  pathParams?: FieldDef[];
  bodyFields?: FieldDef[];
  /** Marks routes the console gives special handling beyond "call it and show JSON" */
  special?: 'login' | 'refresh' | 'register' | 'stripe-intent';
  note?: string;
}

export const ROUTES: ApiRouteDef[] = [
  // ── Auth ──────────────────────────────────────────────
  {
    id: 'auth.login',
    group: 'Auth',
    method: 'POST',
    path: '/auth/login',
    summary: 'Sign in',
    auth: false,
    special: 'login',
    bodyFields: [
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ],
    note: 'Sets the refreshToken HTTP-only cookie. The response accessToken is stored in this console automatically.',
  },
  {
    id: 'auth.refresh',
    group: 'Auth',
    method: 'POST',
    path: '/auth/refresh',
    summary: 'Refresh access token',
    auth: false,
    special: 'refresh',
    note: 'Uses the refreshToken cookie (sent automatically) — no body needed.',
  },
  {
    id: 'auth.logout',
    group: 'Auth',
    method: 'POST',
    path: '/auth/logout',
    summary: 'Sign out',
    auth: false,
    note: 'There is no /auth/logout route in the backend yet — this just clears the session in this console. Add a real endpoint on the backend to also clear the refreshToken cookie server-side.',
  },

  // ── User ──────────────────────────────────────────────
  {
    id: 'user.register',
    group: 'User',
    method: 'POST',
    path: '/user/register',
    summary: 'Register',
    auth: false,
    special: 'register',
    bodyFields: [
      { name: 'name', label: 'Name', type: 'text', required: true, helpText: '3–500 characters' },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true, helpText: 'min 6 characters' },
      {
        name: 'role',
        label: 'Role',
        type: 'enum',
        enumOptions: ['customer', 'seller'],
        helpText: 'optional — defaults to customer',
      },
    ],
  },
  {
    id: 'user.avatar',
    group: 'User',
    method: 'PATCH',
    path: '/user/avatar',
    summary: 'Update avatar',
    auth: true,
    bodyFields: [
      { name: 'avatar', label: 'Avatar URL', type: 'text', required: true },
    ],
  },

  // ── Product ───────────────────────────────────────────
  {
    id: 'product.list',
    group: 'Product',
    method: 'GET',
    path: '/product',
    summary: 'List all products',
    auth: false,
  },
  {
    id: 'product.get',
    group: 'Product',
    method: 'GET',
    path: '/product/:id',
    summary: 'Get one product',
    auth: false,
    pathParams: [{ name: 'id', label: 'Product ID', type: 'uuid', required: true }],
  },
  {
    id: 'product.create',
    group: 'Product',
    method: 'POST',
    path: '/product',
    summary: 'Create product',
    auth: true,
    roles: ['seller'],
    bodyFields: [
      { name: 'name', label: 'Name', type: 'text', required: true, helpText: '2–500 characters' },
      { name: 'price', label: 'Price', type: 'number', required: true, min: 0 },
      { name: 'unitsInStock', label: 'Units in stock', type: 'int', required: true, min: 0 },
    ],
  },
  {
    id: 'product.update',
    group: 'Product',
    method: 'PATCH',
    path: '/product/:id',
    summary: 'Update product',
    auth: true,
    roles: ['seller'],
    pathParams: [{ name: 'id', label: 'Product ID', type: 'uuid', required: true }],
    bodyFields: [
      { name: 'name', label: 'Name', type: 'text', helpText: 'optional' },
      { name: 'price', label: 'Price', type: 'number', min: 0, helpText: 'optional' },
      { name: 'unitsInStock', label: 'Units in stock', type: 'int', min: 0, helpText: 'optional' },
    ],
  },
  {
    id: 'product.images.add',
    group: 'Product',
    method: 'PATCH',
    path: '/product/:id/images',
    summary: 'Add images',
    auth: true,
    roles: ['seller'],
    pathParams: [{ name: 'id', label: 'Product ID', type: 'uuid', required: true }],
    bodyFields: [{ name: 'images', label: 'Image URLs', type: 'string-array', required: true }],
  },
  {
    id: 'product.images.remove',
    group: 'Product',
    method: 'PATCH',
    path: '/product/:id/images/remove',
    summary: 'Remove images',
    auth: true,
    roles: ['seller'],
    pathParams: [{ name: 'id', label: 'Product ID', type: 'uuid', required: true }],
    bodyFields: [{ name: 'images', label: 'Image URLs to remove', type: 'string-array', required: true }],
  },
  {
    id: 'product.delete',
    group: 'Product',
    method: 'DELETE',
    path: '/product/:id',
    summary: 'Delete product',
    auth: true,
    roles: ['seller'],
    pathParams: [{ name: 'id', label: 'Product ID', type: 'uuid', required: true }],
  },

  // ── Orders ────────────────────────────────────────────
  {
    id: 'order.create',
    group: 'Orders',
    method: 'POST',
    path: '/orders',
    summary: 'Create order',
    auth: true,
    roles: ['customer'],
    bodyFields: [
      { name: 'orderItems', label: 'Order items', type: 'order-items', required: true },
    ],
  },
  {
    id: 'order.all',
    group: 'Orders',
    method: 'GET',
    path: '/orders',
    summary: 'List all orders',
    auth: true,
    roles: ['seller'],
  },
  {
    id: 'order.mine',
    group: 'Orders',
    method: 'GET',
    path: '/orders/me',
    summary: 'My orders',
    auth: true,
  },
  {
    id: 'order.cancel',
    group: 'Orders',
    method: 'PATCH',
    path: '/orders/:id/cancel',
    summary: 'Cancel order',
    auth: true,
    roles: ['customer'],
    pathParams: [{ name: 'id', label: 'Order ID', type: 'uuid', required: true }],
  },
  {
    id: 'order.return',
    group: 'Orders',
    method: 'PATCH',
    path: '/orders/:id/return',
    summary: 'Return order',
    auth: true,
    roles: ['customer'],
    pathParams: [{ name: 'id', label: 'Order ID', type: 'uuid', required: true }],
  },
  {
    id: 'order.ship',
    group: 'Orders',
    method: 'PATCH',
    path: '/orders/:id/ship',
    summary: 'Mark shipped',
    auth: true,
    roles: ['seller'],
    pathParams: [{ name: 'id', label: 'Order ID', type: 'uuid', required: true }],
  },
  {
    id: 'order.deliver',
    group: 'Orders',
    method: 'PATCH',
    path: '/orders/:id/deliver',
    summary: 'Mark delivered',
    auth: true,
    roles: ['seller'],
    pathParams: [{ name: 'id', label: 'Order ID', type: 'uuid', required: true }],
  },

  // ── Stripe ────────────────────────────────────────────
  {
    id: 'stripe.createIntent',
    group: 'Stripe',
    method: 'POST',
    path: '/stripe/create-payment-intent',
    summary: 'Create payment intent',
    auth: false,
    special: 'stripe-intent',
    bodyFields: [{ name: 'orderId', label: 'Order ID', type: 'uuid', required: true }],
    note: 'Not guarded on the backend, but the order must exist and be payable. On success this console shows a card form to actually confirm the test payment.',
  },
];

export const GROUPS = ['Auth', 'User', 'Product', 'Orders', 'Stripe'] as const;
