# EBook Backend

REST API for the EBook e-commerce platform, built with Node.js, Express 5, and MongoDB (Mongoose 9).

## Tech Stack

- Node.js / Express 5
- MongoDB / Mongoose 9
- JWT authentication (access + refresh tokens) with bcrypt password hashing
- Stripe (PaymentIntents + webhooks) for payments
- Multer for local product image uploads
- Jest + Supertest + mongodb-memory-server for testing

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string (MongoDB Atlas recommended) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Long random secrets for signing access/refresh tokens |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes (e.g. `1d`, `7d`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (test or live) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret, from the Stripe CLI or Dashboard |
| `CLIENT_URL` | Frontend origin, used for CORS and password reset links |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Global API rate-limit window/threshold |

### 3. Run in development

```bash
npm run dev
```

The API listens on `http://localhost:5000/api/v1`. Health check: `GET /api/v1/health`.

**No MongoDB yet?** Run a throwaway local instance instead of setting up Atlas right away:

```bash
node scripts/dev-mongo.js   # prints a mongodb://127.0.0.1:27117/ebook URI, keeps running
```

Point `MONGO_URI` in `.env` at that URI while it's running. Data is wiped when the process exits — swap in a real Atlas URI before anything needs to persist.

### 4. Seed sample data (optional)

```bash
npm run seed
```

Creates an admin user (`admin@ebook.com` / `Admin@12345`), sample categories, and products. **Change the admin password immediately in any shared environment.**

### 5. Run tests

```bash
npm test              # full suite (uses an in-memory MongoDB, no real DB needed)
npm run test:coverage # with coverage report
```

## Project Structure

```
backend/
├── src/
│   ├── config/       # env, db, multer, stripe setup
│   ├── controllers/  # thin HTTP layer, calls services
│   ├── services/      # business logic
│   ├── routes/        # Express routers
│   ├── middleware/    # auth, validation, rate limiting, error handling
│   ├── models/        # Mongoose schemas
│   ├── validations/   # express-validator rule sets
│   ├── utils/         # ApiError, logger, tokens, etc.
│   └── app.js          # Express app (no listen())
├── tests/              # Jest + Supertest integration tests
├── server.js            # entry point (connects DB, starts listening)
└── package.json
```

## API Overview

All routes are prefixed with `/api/v1`.

| Module | Base path | Auth |
|---|---|---|
| Auth | `/auth` | register/login/logout/refresh/forgot-password/reset-password public, `/me` (GET + PATCH) requires token |
| Categories | `/categories` | reads public, writes admin-only |
| Products | `/products` | reads public, writes admin-only, image upload via `multipart/form-data`; `/products/compare?ids=a,b,c` (2-4 ids) for side-by-side specs |
| Cart | `/cart` | requires login, scoped to the current user; items support optional `selectedColor`/`variantLabel`/`engravingText` |
| Wishlist | `/wishlist` | requires login; `POST /:productId/move-to-cart` moves a saved item into the cart |
| Addresses | `/addresses` | requires login, scoped to the current user; only one address can be `isDefault` at a time |
| Orders | `/orders` | requires login; checkout from the cart, order history |
| Payments | `/payments` | see below — Stripe, eSewa, and Cash on Delivery |
| Reviews | `/reviews` | reads public, create/delete require login (owner or admin) |
| Admin dashboard | `/admin/dashboard` | admin-only |
| Reports | `/reports/orders`, `/reports/products` | admin-only |

Responses follow a consistent envelope: `{ success, message, data?, meta? }` on success, `{ success: false, message, details? }` on error.

Currency is NPR throughout (Payment records and Stripe/eSewa amounts use `npr`/`NPR`). Products also carry display fields for the storefront — `author`, `publisher`, `pages`, `isbn`, `formats[]`, `tags[]` — used by the product detail, shop-filter, and compare views.

### Payments

The storefront checkout offers **eSewa** and **Cash on Delivery**; the Stripe module from an earlier iteration is still implemented and tested but not currently wired into the frontend checkout flow.

| Endpoint | Auth | Notes |
|---|---|---|
| `POST /payments/esewa/initiate` | login | Body `{ orderId }`. Returns `{ gatewayUrl, fields }` — a signed HMAC-SHA256 payload the frontend POSTs as an HTML form directly to eSewa (see `src/services/esewaService.js`). |
| `GET /payments/esewa/success` | none (eSewa redirects the browser here) | Verifies the callback signature, then confirms with eSewa's transaction-status API before marking the order paid. Redirects to the frontend confirmation page. |
| `GET /payments/esewa/failure` | none | eSewa redirects here on a cancelled/failed payment; marks the payment failed and redirects back to the frontend. |
| `POST /payments/cod` | login | Body `{ orderId }`. No gateway involved — moves the order straight to `processing`; `paymentStatus` stays `pending` until cash is collected on delivery. |
| `POST /payments/create-intent` | login | Stripe PaymentIntent (not currently used by the frontend checkout). |
| `POST /payments/webhook` | none (Stripe signature-verified) | Stripe webhook receiver (raw body). |

**eSewa credentials**: `ESEWA_PRODUCT_CODE`/`ESEWA_SECRET_KEY` default to eSewa's own public UAT sandbox values (`EPAYTEST` / the standard RC test secret), which are meant for exactly this kind of integration testing and work against `rc-epay.esewa.com.np` out of the box — no signup needed to test. Swap them for real merchant credentials in `.env` before going live. `SERVER_URL` must be this API's own publicly reachable base URL so eSewa can redirect back to `/payments/esewa/success` and `/payments/esewa/failure`.

## Security

- Helmet secure headers, CORS restricted to `CLIENT_URL`, gzip compression
- bcrypt password hashing, JWT access/refresh tokens, role-based access control
- express-validator on every route accepting input
- Custom in-place NoSQL-injection sanitizer (`src/middleware/sanitize.js`) and HTTP parameter pollution protection (`hpp`)
- Global + auth-specific rate limiting (`express-rate-limit`)
- Centralized error handler that normalizes Mongoose/JWT/Multer errors and hides stack traces outside development

## Deployment

### Option A: Docker

```bash
docker build -t ebook-api .
docker run -p 5000:5000 --env-file .env ebook-api
```

Or with Compose (reads `.env` automatically):

```bash
docker compose up -d --build
```

### Option B: PM2 on a VPS

```bash
npm install -g pm2
npm ci --omit=dev
pm2 start ecosystem.config.js
pm2 save
```

### Option C: Platform-as-a-service (Render, Railway, Fly.io, etc.)

- Build command: `npm ci --omit=dev`
- Start command: `npm start`
- Set all variables from `.env.example` in the platform's environment settings
- Point `MONGO_URI` at a MongoDB Atlas cluster (or the platform's managed Mongo add-on)
- Configure a Stripe webhook endpoint pointing at `https://<your-domain>/api/v1/payments/webhook`, and set `STRIPE_WEBHOOK_SECRET` to the signing secret Stripe gives you for that endpoint

In every case, `NODE_ENV=production` is required for secure cookies and to disable verbose error output.

## Monitoring

- `GET /api/v1/health` returns `200` with a timestamp — wire this into your platform's health check or an external uptime monitor (e.g. UptimeRobot, Better Stack).
- Application logs go through Winston (`src/utils/logger.js`); in production, ship stdout to your platform's log aggregator (Render/Railway logs, or a dedicated service like Better Stack / Datadog) rather than relying on local files.
- Stripe events (payment success/failure) are only reflected in the database via the `/payments/webhook` endpoint — monitor Stripe's Dashboard → Developers → Webhooks for delivery failures.

## Backups

- With MongoDB Atlas, enable Atlas's built-in continuous/cloud backups on the cluster (free tier has limited backup options — upgrade the tier if backups are required for production data).
- For a self-hosted MongoDB, schedule periodic `mongodump` snapshots to off-instance storage (e.g. a daily cron job pushing to S3-compatible storage).
- Uploaded product images live on local disk (`backend/uploads/`) or a Docker volume — back this up separately from the database, or migrate to object storage (e.g. Cloudinary/S3) if the deployment target has an ephemeral filesystem (most PaaS platforms do).
