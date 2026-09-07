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

// Mount Routes
app.use('/api/health', healthRoutes);

// Catch-all for undefined routes (404)
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Centralized Error Handling Middleware (must be registered last)
app.use(errorHandler);

module.exports = app;
