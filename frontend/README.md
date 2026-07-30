# EBook Frontend

React + Vite storefront for EBook, styled to match the EBook Figma design (deep plum/burgundy palette, warm cream backgrounds).

## Tech Stack

- React 19 + Vite, React Router
- Tailwind CSS v4 (CSS-first theme in `src/index.css`)
- Axios (with access/refresh token handling + auto-retry on 401)
- React Hook Form + Yup
- React Toastify

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base path. Defaults to `/api/v1`, proxied to `http://localhost:5000` in dev (see `vite.config.js`) |

### 3. Run the backend first

This app expects the EBook backend running at `http://localhost:5000` (see `../backend/README.md`). The dev server proxies `/api/v1` and `/uploads` to it automatically.

### 4. Run in development

```bash
npm run dev
```

Opens at `http://localhost:5173`.

## Project Structure

```
frontend/
├── src/
│   ├── assets/
│   ├── components/    # ui/ (Button, Input, Badge...), layout/ (Navbar, Footer), product/, checkout/
│   ├── pages/          # one file/folder per route; auth/, checkout/, account/
│   ├── layouts/         # MainLayout, AuthLayout, AccountLayout
│   ├── routes/           # ProtectedRoute
│   ├── context/           # AuthContext, CartContext, WishlistContext, CompareContext
│   ├── services/           # one file per backend resource, all built on apiClient.js
│   ├── hooks/
│   ├── utils/               # formatCurrency, getErrorMessage, colorSwatches, cleanParams, tokenStore
│   ├── App.jsx
│   └── main.jsx
├── .env
└── vite.config.js
```

## Auth model

Access tokens live in `sessionStorage` (via `utils/tokenStore.js`) and are attached to every request by `services/apiClient.js`. The refresh token is an httpOnly cookie set by the backend; on a 401, the API client transparently calls `POST /auth/refresh` once and retries the original request. `AuthContext` bootstraps the session on load (tries a silent refresh if no access token is cached yet).

## Notable pages

- **Product detail** (`/products/:id`) — a format picker, edition selector, and an optional gift message field are captured as `selectedFormat`/`variantLabel`/`giftMessage` on the cart item and carried through to the order (cosmetic only — they don't affect price or stock).
- **Compare** (`/compare?ids=a,b,...`) — reads 2-4 product ids from the URL (selected via checkboxes on the Shop page, tracked client-side in `CompareContext`/`sessionStorage`) and fetches them in one request via `/products/compare`.
- **Checkout** — `/checkout/shipping` creates the order immediately (decrementing stock), then `/checkout/payment` offers eSewa or Cash on Delivery. eSewa builds a signed form and submits it directly to eSewa's gateway (browser navigates away); their sandbox redirects back to `/checkout/confirmation/:orderId?payment=success|failed`, which the confirmation page reads to show a retry option on failure. COD skips the gateway entirely and moves the order straight to `processing`.
- **Account** (`/account`, `/account/orders`, `/account/settings`) — Settings includes real address CRUD and a profile name update; Two-Factor Authentication is shown as a disabled "Coming Soon" toggle and isn't backed by anything (not in scope for this build).
- **Collections / Our Story / Journal** — Collections pulls live categories (genres) and tag-filtered "value" collections (Bestseller/Award Winner/New Arrival) from the API; Our Story and Journal are static brand/content pages (no CMS — Journal's "Read More" is intentionally a stub, there's no article detail page).

## Scripts

```bash
npm run dev       # start dev server
npm run build     # production build
npm run preview   # preview the production build locally
npm run lint       # eslint
```
