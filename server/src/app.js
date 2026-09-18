const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');

const app = express();

// Middleware
app.use(express.json()); // Parse JSON payloads
app.use(cookieParser()); // Parse cookies for future JWT authentication

// CORS configuration for local development
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests only from our Next.js frontend
  credentials: true, // Allow cookies to be sent across origins
}));

// Explicit CSRF / Origin Validation for state-changing methods
app.use((req, res, next) => {
  const allowedOrigin = 'http://localhost:3000';
  const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  // Only validate state-changing methods
  if (methods.includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    // In strict CSRF prevention, missing origin/referer on state-changing methods is usually rejected
    // or strictly compared to the allowed origin
    if (!origin || !origin.startsWith(allowedOrigin)) {
      return res.status(403).json({ success: false, error: 'CSRF Origin Validation Failed' });
    }
  }
  next();
});

const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');

// Mount Routes
app.use('/api/health', healthRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

// Catch-all for undefined routes (404)
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Centralized Error Handling Middleware (must be registered last)
app.use(errorHandler);

module.exports = app;
