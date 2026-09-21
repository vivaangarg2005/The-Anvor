const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');

const app = express();

// Middleware
app.use(express.json()); // Parse JSON payloads
app.use(cookieParser()); // Parse cookies for future JWT authentication

const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookies to be sent across origins
}));

// Explicit CSRF / Origin Validation for state-changing methods
app.use((req, res, next) => {
  const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  // Only validate state-changing methods
  if (methods.includes(req.method)) {
    // Mobile apps using Bearer tokens are not vulnerable to browser-based CSRF
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return next();
    }

    // For browser clients using cookies, enforce strict Origin/Referer matching
    let origin = req.headers.origin;
    if (!origin && req.headers.referer) {
      try {
        const refererUrl = new URL(req.headers.referer);
        origin = refererUrl.origin;
      } catch (e) {
        // invalid referer URL
      }
    }

    if (!origin || !allowedOrigins.includes(origin)) {
      return res.status(403).json({ success: false, error: 'CSRF Origin Validation Failed' });
    }
  }
  next();
});

const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const addressRoutes = require('./routes/addressRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Mount Routes
app.use('/api/health', healthRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);

// Catch-all for undefined routes (404)
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Centralized Error Handling Middleware (must be registered last)
app.use(errorHandler);

module.exports = app;
