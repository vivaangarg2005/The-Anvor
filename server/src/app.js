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
