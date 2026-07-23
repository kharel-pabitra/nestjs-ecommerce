# API Console

An internal tool for your NestJS ecommerce backend — every route from your
controllers is listed on the left, click one to get a form built from its DTO,
fire the request, and see the raw response. No storefront, no assumptions
about routes that don't exist yet.

## Setup

```bash
npm install
cp .env.example .env   # fill in VITE_API_URL and VITE_STRIPE_PUBLISHABLE_KEY
npm run dev
```

Runs at http://localhost:5173. Enable CORS with credentials on the backend:

```ts
// app.enableCors({ origin: 'http://localhost:5173', credentials: true });
```

## How it works

- **`src/data/routes.ts`** — the single source of truth. Every route is an
  object: method, path, auth/role requirements, and the body/path fields
  built from your DTOs. Add or edit a route here and its form, its sidebar
  entry, and its listing on the home page all update automatically.
- **`src/lib/callApi.ts`** — takes a route + form values, builds the URL
  (substituting `:id` etc.) and the JSON body, and calls it through the
  shared axios instance in `src/lib/api.ts`.
- **`src/lib/api.ts`** — attaches the access token to every request and
  retries once through `/auth/refresh` on a 401 (your refresh token cookie
  is sent automatically via `withCredentials`).
- **Auth in the sidebar**: signing in via the `Login` route stores the
  returned `accessToken` in memory and decodes `userId/email/role` out of it
  — that's what drives the 🔒 locks and the "requires seller" warnings you'll
  see on other routes.
- **Stripe**: `Create payment intent` is a plain API call like any other, but
  since actually charging a card needs Stripe.js (not just your API), a
  success response with a `clientSecret` reveals a small Stripe Card Element
  underneath so you can complete the test payment end-to-end.

## Things worth knowing

- **No `/auth/logout` route exists on the backend** (only `login` and
  `refresh` are in your `AuthController`). The console's "Sign out" entry
  just clears local state — it won't invalidate the `refreshToken` cookie
  server-side. Add a real endpoint if you want that.
- Every route, field, and validation hint (`min 6 characters`, `optional`,
  etc.) was pulled straight from the controllers and DTOs you shared —
  `CreateUserDto`, `CreateProductDto`, `UpdateProductDto`, `CreateOrderDto`.
  If a DTO changes, update the matching entry in `src/data/routes.ts`.
- Role checks (`customer`/`seller`) mirror your `@Roles()` decorators, and
  match your JWT's lowercase role values.
