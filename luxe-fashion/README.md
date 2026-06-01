# Luxe Fashion — Production E-Commerce Platform

A full-stack, production-ready e-commerce platform for a premium clothing brand, built with Next.js 14, Express, PostgreSQL, and Prisma.

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Frontend    | Next.js 14 (App Router), React 18, TypeScript  |
| Styling     | Tailwind CSS, Framer Motion                    |
| State       | Zustand (cart/wishlist), TanStack Query        |
| Backend     | Node.js, Express, TypeScript                   |
| Database    | PostgreSQL 16, Prisma ORM                      |
| Auth        | JWT (access + refresh tokens), bcrypt          |
| Uploads     | Cloudinary (images)                            |
| Payments    | Stripe, PayPal, Cash on Delivery               |
| Email       | Nodemailer (SMTP/Gmail)                        |
| Deployment  | Vercel (frontend), Railway (backend + DB)      |
| Docker      | Full docker-compose for self-hosting           |

---

## Project Structure

```
luxe-fashion/
├── backend/                    # Express API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (18 models)
│   │   ├── seed.ts             # Seed data (products, users, coupons)
│   │   └── migrations/         # SQL migrations
│   ├── src/
│   │   ├── controllers/        # Business logic
│   │   ├── middleware/         # Auth, error handling
│   │   ├── routes/             # API routes
│   │   ├── services/           # Email, payments, Cloudinary
│   │   └── server.ts           # Express app entry point
│   ├── Dockerfile
│   └── railway.toml
│
├── frontend/                   # Next.js app
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   │   ├── admin/          # Admin dashboard (8 sections)
│   │   │   ├── auth/           # Login, register, forgot/reset password
│   │   │   ├── product/[slug]/ # Product detail page
│   │   │   ├── shop/           # Shop with filters
│   │   │   ├── checkout/       # Multi-step checkout
│   │   │   ├── profile/        # User account
│   │   │   ├── order-tracking/ # Track orders
│   │   │   └── ...             # About, contact, FAQ, etc.
│   │   ├── components/
│   │   │   ├── admin/          # Admin UI components
│   │   │   ├── home/           # Homepage sections
│   │   │   ├── layout/         # Navbar, footer, search
│   │   │   ├── providers/      # Auth, Query providers
│   │   │   └── shop/           # Cart, product cards, quick view
│   │   ├── lib/api.ts          # All API client functions
│   │   └── store/index.ts      # Zustand stores
│   ├── Dockerfile
│   └── vercel.json
│
├── nginx/nginx.conf            # Production reverse proxy
├── docker-compose.yml          # Production stack
├── docker-compose.dev.yml      # Dev stack (DB only)
└── .env.example
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 16 (or Docker)

### 1. Clone and install

```bash
git clone https://github.com/your-org/luxe-fashion.git
cd luxe-fashion

# Backend
cd backend && cp .env.example .env
npm install

# Frontend
cd ../frontend && cp .env.example .env.local
npm install
```

### 2. Configure environment

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://luxe:luxepassword@localhost:5432/luxe_fashion"
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-other-secret-here
# Add Cloudinary, Stripe, PayPal, SMTP when ready
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start the database

```bash
# Option A: Docker
docker run -d --name luxe_postgres \
  -e POSTGRES_USER=luxe \
  -e POSTGRES_PASSWORD=luxepassword \
  -e POSTGRES_DB=luxe_fashion \
  -p 5432:5432 postgres:16-alpine

# Option B: Local PostgreSQL
createdb luxe_fashion
```

### 4. Run migrations and seed

```bash
cd backend
npm run db:migrate     # Run migrations
npm run db:generate    # Generate Prisma client
npm run db:seed        # Seed demo data
```

Seed creates:
- **Admin:** `admin@luxefashion.com` / `Admin@123`
- **Customer:** `demo@luxefashion.com` / `User@123`
- 8 products, 6 categories, 4 coupons, banners

### 5. Start development servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

Open http://localhost:3000

---

## Docker (Self-hosted Production)

```bash
# 1. Copy and fill environment variables
cp .env.example .env
# Edit .env with your real values

# 2. Build and start everything
docker compose up -d --build

# 3. Run migrations (first time only)
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
```

Services:
- Frontend:  http://localhost:3000
- Backend:   http://localhost:5000
- Nginx:     http://localhost:80 (production profile only)

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Set these environment variables in the Vercel dashboard:
```
NEXT_PUBLIC_API_URL          = https://your-api.railway.app/api
NEXT_PUBLIC_APP_URL          = https://luxefashion.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
NEXT_PUBLIC_PAYPAL_CLIENT_ID = your_paypal_client_id
```

### Backend + Database → Railway

1. Create a new Railway project
2. Add a **PostgreSQL** database plugin
3. Add a **new service** from GitHub, pointing to `/backend`
4. Railway auto-detects `railway.toml` and uses the Dockerfile
5. Set all environment variables from `backend/.env.example`
6. Set `DATABASE_URL` to the Railway PostgreSQL connection string

After first deploy:
```bash
railway run npm run db:migrate
railway run npm run db:seed
```

---

## Manual Setup Required

### 1. Cloudinary (image uploads)
1. Create account at cloudinary.com
2. Copy **Cloud Name**, **API Key**, **API Secret**
3. Add to `backend/.env`

### 2. Stripe (card payments)
1. Create account at stripe.com
2. Get publishable + secret keys from dashboard
3. For webhooks: `stripe listen --forward-to localhost:5000/api/payments/stripe/webhook`
4. Copy webhook signing secret
5. Add to both `backend/.env` and `frontend/.env.local`

### 3. PayPal (PayPal payments)
1. Create app at developer.paypal.com
2. Get Client ID and Secret from sandbox
3. Add to both backend and frontend env files
4. Switch `PAYPAL_BASE_URL` to `https://api-m.paypal.com` for production

### 4. Email (Gmail SMTP)
1. Enable 2FA on your Gmail account
2. Generate an App Password: myaccount.google.com/apppasswords
3. Use the app password (not your real password) in `SMTP_PASS`

### 5. After first seed: set ADMIN_USER_ID
```bash
# Get the admin user ID from the database
cd backend && npx prisma studio
# Copy the ID of admin@luxefashion.com
# Add to backend/.env: ADMIN_USER_ID=clxxxxxxx
```

---

## API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint                              | Auth     | Description              |
|--------|---------------------------------------|----------|--------------------------|
| POST   | /auth/register                        | None     | Register user            |
| POST   | /auth/login                           | None     | Login                    |
| POST   | /auth/refresh                         | None     | Refresh tokens           |
| GET    | /auth/me                              | User     | Current user             |
| POST   | /auth/forgot-password                 | None     | Send reset email         |
| POST   | /auth/reset-password                  | None     | Reset password           |
| GET    | /products                             | None     | List products (filtered) |
| GET    | /products/:slug                       | None     | Product detail           |
| POST   | /products                             | Admin    | Create product           |
| PUT    | /products/:id                         | Admin    | Update product           |
| DELETE | /products/:id                         | Admin    | Delete product           |
| GET    | /categories                           | None     | All categories           |
| POST   | /orders                               | Optional | Create order             |
| GET    | /orders/my-orders                     | User     | My orders                |
| GET    | /orders/track?orderNumber=&email=     | None     | Track order              |
| GET    | /orders                               | Admin    | All orders               |
| PATCH  | /orders/:id/status                    | Admin    | Update order status      |
| GET    | /cart                                 | User     | Get cart                 |
| POST   | /cart                                 | User     | Add to cart              |
| GET    | /wishlist                             | User     | Get wishlist             |
| POST   | /wishlist                             | User     | Add to wishlist          |
| POST   | /coupons/validate                     | None     | Validate coupon          |
| POST   | /upload                               | Admin    | Upload images            |
| POST   | /payments/stripe/create-intent        | User     | Create Stripe intent     |
| POST   | /payments/stripe/webhook              | None     | Stripe webhook           |
| POST   | /payments/paypal/create-order         | User     | Create PayPal order      |
| POST   | /payments/paypal/capture              | User     | Capture PayPal payment   |
| GET    | /analytics/dashboard                  | Admin    | Dashboard stats          |
| GET    | /analytics/sales                      | Admin    | Sales report             |
| GET    | /admin/users                          | Admin    | All customers            |
| GET    | /admin/inventory                      | Admin    | Low stock variants       |
| GET    | /admin/reviews                        | Admin    | All reviews (moderation) |

---

## Features Checklist

### Customer Features
- [x] Browse products with filtering, sorting, pagination
- [x] Product detail page with image gallery, variants, reviews
- [x] Quick view modal
- [x] Search overlay with live results
- [x] Cart (persistent, local + server sync)
- [x] Wishlist (persistent)
- [x] Multi-step checkout
- [x] Coupon/discount codes
- [x] Cash on delivery + Stripe + PayPal
- [x] Guest checkout
- [x] Order tracking
- [x] Email notifications (order confirmation, status updates)
- [x] User account (orders, wishlist, addresses, profile)
- [x] Dark / light mode
- [x] Mobile-responsive design
- [x] SEO (meta tags, sitemap, robots.txt)

### Admin Features
- [x] Dashboard with KPIs and charts
- [x] Product management (CRUD, images, variants)
- [x] Category management
- [x] Order management (view, update status, tracking)
- [x] Customer management
- [x] Inventory management (low-stock alerts, stock updates)
- [x] Coupon management
- [x] Review moderation
- [x] Banner management
- [x] Sales analytics

---

## Default Credentials (seed data)

| Role     | Email                      | Password   |
|----------|---------------------------|------------|
| Admin    | admin@luxefashion.com     | Admin@123  |
| Customer | demo@luxefashion.com      | User@123   |

**Change these before going to production.**

---

## License

MIT — free to use for personal and commercial projects.
