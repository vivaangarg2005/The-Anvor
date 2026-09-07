# Product Requirements & Technical Planning Document

## 1. Product Vision
The goal is to build a premium, trustworthy, and fast ecommerce platform that provides a seamless shopping experience. While the initial catalog is focused on purses and handbags, the platform must feel like a high-end fashion boutique. It should accomplish three things:
1. **Customer Trust:** Through modern aesthetics, fast load times, and secure payment processing.
2. **Ease of Use:** Frictionless browsing, clear product details, and a seamless guest-to-logged-in transition during checkout.
3. **Scalability:** An underlying architecture that allows the business to expand into wallets, accessories, or other fashion items without rewriting the system.

## 2. Target Users
* **Guest Customer:** Can browse products, search, view details, and manage a local cart. Cannot checkout without creating an account.
* **Registered Customer:** Can maintain a persistent cart, manage multiple shipping addresses, securely checkout, view past orders, and track active order statuses.
* **Admin / Store Owner:** Can manage the product catalog (add/edit/deactivate), monitor inventory, view customer details, process orders, and view high-level sales metrics via a secure dashboard.

## 3. Complete Customer Journey
* **Discovery:** User lands on the homepage (showcasing new arrivals/categories) -> Browses catalog -> Uses text search or category filters.
* **Consideration:** Clicks a product -> Views high-quality image gallery, price, stock status, and dynamic attributes (color/material) -> Adds to cart.
* **Guest Cart:** Continues browsing, modifies quantities. Data is saved in the browser (`localStorage`).
* **Authentication:** User proceeds to checkout -> Prompted to Login/Register -> Upon success, the guest cart is seamlessly merged with their DB cart.
* **Checkout:** User selects/enters a delivery address -> Reviews order summary (backend recalculates prices/shipping) -> Clicks "Pay".
* **Payment:** Razorpay modal opens -> User completes payment -> Redirected to order confirmation page.
* **Post-Purchase:** User receives order confirmation (UI + Email) -> Tracks status from profile page.

**Edge Cases Handled:**
* **Payment Fails/Cancelled:** Order is marked as `PAYMENT_FAILED`. User is redirected to a "Try Again" page; items remain in the cart.
* **Out of Stock at Checkout:** Backend validates inventory before generating the payment order. If out of stock, user is notified and the item is flagged in the cart.
* **Leaving Checkout:** Cart is preserved. The user can resume later.

## 4. Complete Admin Journey
* **Authentication:** Admin logs in via a protected route -> Navigates to Dashboard (shows today's sales, pending orders).
* **Catalog Management:** Navigates to Products -> Clicks "Add Product" -> Uploads images, sets price, SKU, stock, and flexible attributes -> Saves.
* **Order Fulfillment:** Receives new order alert -> Views order details (items, shipping address) -> Packages item -> Updates status to `SHIPPED` (adding tracking info).
* **Completion:** Updates status to `DELIVERED` when the carrier confirms delivery.

## 5. Feature List
### V1 — Required for launch
* Product catalog (listing, details, categories).
* Authentication (JWT-based Login/Register).
* Shopping Cart (Guest & Authenticated).
* Checkout with Razorpay integration.
* Order management & tracking for users.
* Basic Admin panel (Manage products, categories, orders).
* Cloudinary/S3 integration for image hosting.
* Responsive mobile-first UI.

### V1.1 — Useful shortly after launch
* Product reviews and ratings.
* Wishlist functionality.
* Advanced filtering (by color, material, price range).
* Basic email notifications (SendGrid/AWS SES).

### V2 — Future features
* Discount codes and coupons.
* Returns/Refund portal.
* Guest checkout (if the business model shifts).
* Recommended products / "Customers also bought".

### Not recommended initially
* Multi-currency / International shipping (stick to domestic first for tax/shipping simplicity).
* AI Chatbots (distraction from core UX).
* Complex loyalty point systems (overengineering for a new startup).

## 6. Website Pages
### Public Pages
* **Home:** Hero banner, featured categories, new arrivals.
* **Shop / Category:** Grid of products, filters sidebar, sorting options.
* **Product Detail Page (PDP):** Image gallery, price, description, attributes, "Add to Cart".
* **Cart:** List of items, quantity toggles, price summary, "Proceed to Checkout".
* **Auth:** Login & Register pages.
* **Static:** About Us, Contact, Terms, Privacy Policy, Returns.

### Customer / Account Pages
* **Profile:** Update name, password.
* **Address Book:** Add, edit, delete shipping addresses.
* **Order History:** List of past and current orders.
* **Order Details:** Specifics of a single order, tracking link, invoice download.

### Checkout Pages
* **Checkout / Shipping:** Select or add an address.
* **Order Review:** Final price breakdown (subtotal, tax, shipping). Payment initiation.
* **Order Confirmation:** Success message, order ID, estimated delivery.

### Admin Pages
* **Dashboard:** High-level metrics.
* **Product List:** Data table of products (searchable).
* **Add/Edit Product:** Form for product data and image uploads.
* **Order List:** Data table of orders with status filters.
* **Order Details:** Update order status, view customer info.
* **Category Management:** Add/edit categories.

## 7. User Permissions
| Action | Guest | Customer | Admin |
| :--- | :---: | :---: | :---: |
| Browse products | ✅ | ✅ | ✅ |
| Manage Guest Cart | ✅ | ❌ | ❌ |
| Manage DB Cart | ❌ | ✅ | ✅ |
| Checkout | ❌ | ✅ | ❌ |
| View own orders | ❌ | ✅ | ❌ |
| Manage addresses | ❌ | ✅ | ❌ |
| Manage products | ❌ | ❌ | ✅ |
| Manage all orders | ❌ | ❌ | ✅ |
| View all users | ❌ | ❌ | ✅ |

## 8. Core Data Entities
* **User:** `_id`, `name`, `email`, `password` (hashed), `role` (user/admin).
* **Product:** `_id`, `name`, `slug`, `description`, `price`, `images`, `category_id`, `stock`, `sku`, `isActive`, `attributes` (flexible key-value).
* **Category:** `_id`, `name`, `slug`, `description`.
* **Cart:** `_id`, `user_id`, `items` (array of `product_id`, `quantity`, `price_at_addition`). *(Note: Can also be embedded in User for V1).*
* **Order:** `_id`, `user_id`, `items`, `shippingAddress`, `paymentInfo` (Razorpay order/payment IDs), `subtotal`, `shippingPrice`, `totalPrice`, `status`, `createdAt`.
* **Address:** Handled as an array embedded inside the `User` document for V1 to reduce joins.

*(Excluded for V1: Review, Coupon, Wishlist to maintain simplicity and speed to market).*

## 9. Product Requirements
To future-proof the database for non-purse items, we will use a flexible schema design.
Fixed fields will include universal ecommerce data: `name`, `price`, `stock`, `sku`, `images`.
For category-specific details (color, material, dimensions, compartments, closure type), we will use a flexible `attributes` field (e.g., an array of key-value pairs or a Map in MongoDB).
* **Why?** When the store adds "Backpacks", they can simply add an attribute `laptop_sleeve: true` without altering the database schema.
*(For V1, we will not implement complex SKU-level variants (like different sizes having different prices). We will treat different colors/sizes as distinct products or simple attributes if price is identical, to avoid massive complexity).*

## 10. Cart Requirements
* **Guest Users:** Cart is maintained in the browser (`localStorage`). It holds `productId` and `quantity`.
* **Logged-in Users:** Cart is maintained in the MongoDB `Cart` collection (or `User` document).
* **Transition (Merging):** When a guest logs in, the frontend sends the local cart to the backend. The backend iterates through local items, adds them to the DB cart (incrementing quantities if the item already exists), and then the frontend clears `localStorage`.
* **Validation:** Cart prices are dynamic. When the user views the cart, the backend fetches the *current* price and stock of the products from the DB. If a product becomes unavailable, it is flagged with a warning in the UI.

## 11. Checkout Requirements
* **Step 1:** User selects an address (saved) or adds a new one.
* **Step 2:** Backend calculates final order summary: `(Sum of Item Prices) + Shipping + Taxes`. The frontend NEVER calculates the final price to send to Razorpay.
* **Step 3:** Backend verifies that all items in the cart have sufficient `stock`.
* **Step 4:** Backend creates an Order in the DB with status `PENDING_PAYMENT`.
* **Step 5:** Backend calls Razorpay API to generate a `razorpay_order_id`.
* **Step 6:** Frontend receives the `razorpay_order_id` and opens the checkout modal.
* **Duplicate Prevention:** The user's cart is not cleared until payment is successful. If payment fails, the `PENDING_PAYMENT` order remains, but cart is intact to try again.

## 12. Razorpay Payment Architecture
**High-Level Flow:**
1. Frontend requests checkout.
2. Backend calculates total and calls Razorpay to create an Order. Returns `order_id` to Frontend.
3. Frontend injects Razorpay script, opens payment modal with `order_id`.
4. User pays. Razorpay returns `razorpay_payment_id` and `razorpay_signature` to Frontend.
5. Frontend sends these to Backend for verification.
6. **CRITICAL:** Backend uses its secret key to hash the IDs and verifies the signature matches. If valid, Backend marks Order as `PAID`, reduces stock, and clears user Cart.
7. Webhook fallback: Razorpay webhook hits Backend to confirm payment asynchronously (handles edge cases where user closes browser before Step 5).

**Why frontend cannot be trusted:** A malicious user could edit frontend JS to change the order total to ₹1. The backend must be the single source of truth for pricing and validation. API keys (Razorpay Secret) live exclusively in backend environment variables.

## 13. Order Lifecycle
We must separate **Payment Status** from **Order Status**.
* **Payment Statuses:** `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`.
* **Order Statuses (V1):** `PENDING_PAYMENT`, `PROCESSING` (Paid, waiting to ship), `SHIPPED`, `DELIVERED`, `CANCELLED`.
* **Order Statuses (Future):** `RETURN_REQUESTED`, `RETURNED`.

## 14. Inventory Requirements
* **Stock Quantity:** Integer field on the Product document.
* **Validation:** Checked when item added to cart, viewed in cart, and immediately before generating Razorpay order.
* **Reducing Stock:** Occurs strictly AFTER the payment signature is verified as successful.
* **Race Conditions:** To prevent overselling (two users buying the last purse at the same exact second), the backend will use MongoDB atomic operators (`$inc: { stock: -quantity }`) combined with a query condition `{ stock: { $gte: quantity } }`. If this fails, the transaction is aborted, and the user is refunded/notified.

## 15. Search, Filtering and Sorting
* **V1:** Basic text search via MongoDB regex or text index on `name` and `description`. Filtering by `category_id`. Sorting by Price (High/Low) and Newest.
* **V2:** Filtering by dynamic attributes (Color, Material) requires more complex aggregation pipelines and UI components.

## 16. Customer Experience (UX)
* **Loading States:** UI skeletons for product grids to prevent layout shift.
* **Empty States:** Beautiful illustrations/text when cart or order history is empty.
* **Error Handling:** Graceful toast notifications (not `alert()` boxes) for network errors.
* **Image Gallery:** High-res images with hover-to-zoom for detailed purse inspection.
* **Trust Indicators:** Padlock icons on checkout, clear display of Razorpay secure payments, easy access to return policies.

## 17. Security Requirements
* **Auth:** Passwords hashed with `bcrypt`. JWTs used for session management.
* **Token Storage:** Store JWT in an `HttpOnly`, `Secure` cookie to prevent XSS attacks from reading the token.
* **Validation:** All incoming API payloads validated strictly using a schema library (like `Zod`).
* **Protection:** Express `helmet` for HTTP headers. `express-rate-limit` to prevent brute force on login/payment endpoints.
* **Data Sanitization:** Prevent NoSQL injection by sanitizing req.body/req.query using `mongo-sanitize`.
* **Admin:** Admin routes protected by a middleware checking `user.role === 'admin'`.

## 18. SEO Requirements
Because this is a real business, SEO is crucial.
* **React vs Next.js Tradeoff:** A standard React app (Vite/CRA) is a Single Page Application. Crawlers struggle to index dynamic product pages quickly. **Recommendation:** Since you want to learn full-stack and build a real business, standard React is fine for learning, but **Next.js (App Router)** is the industry standard for ecommerce SEO (SSR/SSG). *We will stick to React (Vite) as requested by your stack, but utilize `react-helmet` to dynamically inject metadata (Title, Description, Canonical URLs) for products.*
* **Features:** Descriptive URLs (`/product/red-leather-tote`), alt tags on all images, semantic HTML5 (`<main>`, `<article>`).

## 19. Mobile App Considerations (API-First)
To ensure the backend works seamlessly with a future React Native app:
* **JSON Only:** The backend will never render HTML/EJS views. It exclusively consumes and produces JSON.
* **Stateless:** No server-side sessions (`express-session`). JWTs ensure the mobile app can authenticate exactly like the web app.
* **Separation of Concerns:** Formatting dates or currency happens on the frontend. The backend sends raw data (e.g., price in lowest denomination, ISO date strings).

## 20. Analytics
* **V1:** Integrate Google Analytics (GA4) or standard Meta Pixel for basic page views.
* **Future:** Track specific events: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`.

## 21. Testing Strategy
* **Unit Tests (Backend):** Test complex logic (price calculation, cart merging) using Jest.
* **API Tests:** Test authentication flows, checkout validation, and permissions using Postman or Supertest.
* **Frontend Tests:** Component tests for the Cart and Checkout buttons.
* **Manual E2E:** Thoroughly test the Razorpay Test mode flow (Success, Failure, Cancellation).

## 22. Deployment Architecture
* **Frontend:** Deployed to Vercel (free, blazing fast CDN, auto-CI/CD from GitHub).
* **Backend:** Deployed to Render or Railway (Node.js environment).
* **Database:** MongoDB Atlas (M0 Free cluster for V1, easily scalable).
* **Images:** Uploaded to Cloudinary via backend, URLs saved to MongoDB.
* **Security:** HTTPS enforced everywhere. Environment variables managed in hosting dashboards.

## 23. Suggested Project Development Order
1. **Milestone 1: Backend Foundation & Auth.** Set up Express, MongoDB connection, User models, JWT auth routes. *(Learn: REST APIs, Auth flow, DB modeling).*
2. **Milestone 2: Catalog Management.** Build Product/Category schemas, Admin CRUD routes, Image upload to Cloudinary. *(Learn: File uploads, complex schemas).*
3. **Milestone 3: Frontend Foundation.** Set up React, Tailwind, React Router, Auth Context. Connect login/register to backend. *(Learn: State management, routing).*
4. **Milestone 4: Public Shop UI.** Build Homepage, Product Listing, Product Details, Search/Filter UI. *(Learn: Data fetching, UI/UX).*
5. **Milestone 5: Cart System.** Implement Guest Cart (localStorage), Auth Cart (DB), and merging logic. *(Learn: Browser storage, complex state).*
6. **Milestone 6: Checkout & Payments.** Integrate Razorpay, Order creation, webhook verification. *(Learn: 3rd party APIs, security, transactions).*
7. **Milestone 7: Admin Dashboard & Profiles.** Order fulfillment flows, user profiles. *(Learn: Protected routing, data visualization).*
8. **Milestone 8: Polish & Deploy.** Testing, SEO tags, Vercel/Render deployment.

## 24. V1 Definition (Launch Readiness Checklist)
The application is "V1 Ready" when:
* [ ] A user can securely register, login, and stay authenticated.
* [ ] The product catalog loads dynamically from the database.
* [ ] Cart accurately adds, removes, and calculates totals (and merges guest to logged-in).
* [ ] Checkout successfully processes a Razorpay test payment and verifies the signature securely on the backend.
* [ ] Stock is accurately decreased upon successful payment, and overselling is prevented.
* [ ] Admin can add products (with images) and update order statuses.
* [ ] Site is fully responsive on mobile devices.
* [ ] Environment variables are secure and deployment environments are isolated.

## 25. Questions for the Startup Owner
Before development or at specific stages, clarify these business rules:

### Must decide before development
* **Categories:** Are we absolutely starting with only purses, or should the DB immediately accommodate shoes/clothes (which require complex variant matrices like Size x Color)?
* **Shipping Locations:** Are we shipping PAN-India only? (Simplifies address forms and logic).
* **Payment Gateways:** Confirm Razorpay is the only gateway. Do we need Cash on Delivery (COD)? (COD requires different order status flows).

### Can decide during development
* **Shipping Charges:** Flat rate? Free over ₹X amount? (Needed for checkout calculations).
* **Taxes:** Are product prices inclusive of GST, or calculated at checkout?
* **Branding:** Colors, typography, logo assets for UI styling.

### Can decide after V1
* Return/Refund policies and workflows.
* Customer support integrations (help desk/chat).
* Advanced analytics tracking.

---

# Architecture & Requirements Summary
**Stack:** React (Vite) + TailwindCSS, Node.js + Express, MongoDB + Mongoose.
**Architecture:** API-First JSON REST backend. JWT authentication in HttpOnly cookies. Mobile-ready.
**Integrations:** Razorpay for payments, Cloudinary/AWS for image storage.
**Key Directives:**
1. Backend is the single source of truth for all pricing, stock, and payment validation.
2. Database must use a flexible attribute pattern to easily transition from purses to other categories.
3. Keep V1 focused strictly on browsing, cart merging, secure checkout, and basic admin fulfillment.
4. Prioritize clean UI, fast load times, and robust security practices over complex, non-essential features.
