# The Anvor

A premium ecommerce platform for handbags and purses — built with a modern, API-first architecture designed for web and future mobile apps.

---

## Tech Stack

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Frontend   | Next.js 16 (App Router), React 19, Tailwind CSS 4   |
| Backend    | Node.js, Express 5, REST API                        |
| Database   | MongoDB (Mongoose 9)                                |
| Payments   | Razorpay (Test Mode)                                |
| Auth       | JWT in HttpOnly cookies, OTP-based login (bcrypt)   |
| Language   | TypeScript (client), JavaScript (server)            |

---

## Architecture

```text
┌─────────────────────┐
│   Next.js Client    │  Port 3000
│   (App Router/SSR)  │
└────────┬────────────┘
         │  REST API  (HttpOnly JWT Cookie)
         ▼
┌─────────────────────┐
│   Express Server    │  Port 5000
│   (API-first JSON)  │
└────────┬────────────┘
         │
    ┌────┴────┐
    ▼         ▼
 MongoDB   Razorpay
```

- **Server-authoritative:** All pricing, stock validation, and payment verification happen exclusively on the backend.
- **API-first:** The backend only speaks JSON — no HTML rendering — so the same API can power a mobile app.
- **Secure by default:** JWT stored in HttpOnly cookies (immune to XSS), Razorpay signatures verified via HMAC-SHA256 server-side.

---

## Features

### Customer
- **OTP-Based Authentication** — Passwordless login using email OTP, session managed via HttpOnly JWT cookies.
- **Product Catalog** — Dynamic product pages with categories, pricing, and stock status.
- **Shopping Cart** — Guest cart (localStorage) + authenticated cart (MongoDB), with automatic merge on login.
- **Address Book** — Save, edit, and select from multiple shipping addresses during checkout.
- **Checkout & Payments** — Razorpay-powered payment flow with backend-calculated totals and cryptographic signature verification.
- **Order History** — View past orders, order details, and payment status.
- **Payment Retry** — Pending orders display a "Pay Now" button to re-initiate payment without creating duplicate orders.

### Security
- Passwords hashed with `bcrypt`.
- Rate limiting on auth and payment endpoints via `express-rate-limit`.
- Backend-verified Razorpay HMAC-SHA256 signatures — client never controls pricing.
- CORS restricted to the frontend origin.

---

## Project Structure

```
The-Anvor/
├── client/                          # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── page.tsx             # Homepage
│       │   ├── layout.tsx           # Root layout + providers
│       │   ├── globals.css          # Global styles
│       │   ├── login/               # OTP login page
│       │   ├── products/            # Product listing & detail pages
│       │   ├── cart/                # Cart page
│       │   ├── checkout/            # Checkout flow
│       │   ├── order-success/       # Post-payment confirmation
│       │   └── account/             # Profile, addresses, order history
│       ├── components/
│       │   ├── Header.tsx           # Sticky header with frosted glass effect
│       │   ├── AddToCartForm.tsx     # Product detail add-to-cart
│       │   ├── ProductCardCartControl.tsx  # Cart controls on product cards
│       │   ├── AddressBook.tsx      # Address CRUD component
│       │   └── PaymentRetryButton.tsx  # Re-initiate payment for pending orders
│       ├── context/
│       │   └── CartContext.tsx       # Cart state management
│       └── lib/                     # API helpers, utilities
│
├── server/                          # Express backend
│   └── src/
│       ├── server.js                # Entry point
│       ├── app.js                   # Express app setup (CORS, routes, middleware)
│       ├── seed.js                  # Database seeder
│       ├── config/                  # DB connection config
│       ├── models/
│       │   ├── User.js
│       │   ├── Product.js
│       │   ├── Category.js
│       │   ├── Cart.js
│       │   ├── Order.js
│       │   ├── Address.js
│       │   └── OtpRecord.js
│       ├── controllers/
│       │   ├── authController.js    # OTP send/verify, JWT issuance
│       │   ├── productController.js
│       │   ├── categoryController.js
│       │   ├── cartController.js
│       │   ├── addressController.js
│       │   ├── orderController.js   # Order creation (server-authoritative)
│       │   └── paymentController.js # Razorpay order creation & verification
│       ├── services/                # Business logic layer
│       ├── routes/                  # Express route definitions
│       ├── middleware/              # Auth, error handling
│       ├── providers/               # Razorpay instance
│       └── utils/                   # Helpers
│
└── product_requirements_document.md  # Full PRD
```

---

## Getting Started

### Prerequisites
- **Node.js** v18+
- **npm**
- **MongoDB** — running locally (`mongod`) or via [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/The-Anvor.git
cd The-Anvor
```

### 2. Install Dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Configure Environment Variables

**`server/.env`**
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/anvor
JWT_SECRET=your_jwt_secret_here
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

**`client/.env.local`**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

> **⚠️ Never commit real secrets.** The Razorpay Key Secret must remain server-side only.

### 4. Seed the Database (Optional)
```bash
cd server
node src/seed.js
```

### 5. Run the Application

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Endpoints

| Method | Endpoint                        | Auth     | Description                        |
| ------ | ------------------------------- | -------- | ---------------------------------- |
| POST   | `/api/auth/send-otp`            | Public   | Send OTP to email                  |
| POST   | `/api/auth/verify-otp`          | Public   | Verify OTP and issue JWT cookie    |
| POST   | `/api/auth/logout`              | Public   | Clear auth cookie                  |
| GET    | `/api/auth/me`                  | Required | Get current user                   |
| GET    | `/api/products`                 | Public   | List all products                  |
| GET    | `/api/products/:slug`           | Public   | Get product by slug                |
| GET    | `/api/categories`               | Public   | List all categories                |
| GET    | `/api/cart`                     | Required | Get user's cart                    |
| POST   | `/api/cart`                     | Required | Add/update cart item               |
| DELETE | `/api/cart/:productId`          | Required | Remove item from cart              |
| POST   | `/api/cart/merge`               | Required | Merge guest cart into user cart     |
| GET    | `/api/addresses`                | Required | List user's addresses              |
| POST   | `/api/addresses`                | Required | Add a new address                  |
| PUT    | `/api/addresses/:id`            | Required | Update an address                  |
| DELETE | `/api/addresses/:id`            | Required | Delete an address                  |
| POST   | `/api/orders`                   | Required | Create a new order                 |
| GET    | `/api/orders`                   | Required | List user's orders                 |
| GET    | `/api/orders/:id`               | Required | Get order details                  |
| POST   | `/api/orders/:id/create-payment`| Required | Create Razorpay payment order      |
| POST   | `/api/orders/:id/verify-payment`| Required | Verify Razorpay signature & update |
| GET    | `/api/health`                   | Public   | Health check                       |

---

## Payment Testing (Razorpay Test Mode)

The application uses Razorpay in **Test Mode**. No real money is charged.

### How to Test
1. Complete the checkout flow and click **Place Order**.
2. In the Razorpay modal, select **UPI**.
3. Enter the VPA: `success@razorpay`
4. Click **Pay**.

The backend will verify the cryptographic signature and mark the order as **PAID**.

### Test Credentials Reference
| Method     | Value                | Result  |
| ---------- | -------------------- | ------- |
| UPI VPA    | `success@razorpay`   | Success |
| UPI VPA    | `failure@razorpay`   | Failure |

> **Note:** International/Axis test cards may fail in Razorpay Test Mode. UPI is the most reliable test method.

---

## Development Roadmap

| Day | Milestone                        | Status |
| --- | -------------------------------- | ------ |
| 1   | Project Foundation & Setup       | ✅      |
| 2   | Authentication (OTP + JWT)       | ✅      |
| 3   | Product Catalog & Categories     | ✅      |
| 4   | Shopping Cart (Guest + Auth)     | ✅      |
| 5   | Address Book                     | ✅      |
| 6   | Homepage & Product UI            | ✅      |
| 7   | Order System (Server-Authoritative) | ✅   |
| 8   | Razorpay Payment Integration     | ✅      |
| 9   | Admin Dashboard                  | 🔲      |
| 10  | Polish, SEO & Deployment         | 🔲      |

---

## License

This project is proprietary. All rights reserved.
