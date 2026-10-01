const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');

const app = express();


app.use(express.json()); 
app.use(cookieParser()); 

const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:3000'];


app.use(cors({
  origin: (origin, callback) => {
    
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, 
}));


app.use((req, res, next) => {
  const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  
  if (methods.includes(req.method)) {
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return next();
    }

    
    let origin = req.headers.origin;
    if (!origin && req.headers.referer) {
      try {
        const refererUrl = new URL(req.headers.referer);
        origin = refererUrl.origin;
      } catch (e) {
        
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
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');


app.use('/api/health', healthRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);


app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});


app.use(errorHandler);

module.exports = app;
