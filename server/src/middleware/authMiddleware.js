




const jwt = require('jsonwebtoken');
const authConfig = require('../config/authConfig');




const requireAuth = (req, res, next) => {
  let token;

  
  if (req.cookies && req.cookies[authConfig.cookie.name]) {
    token = req.cookies[authConfig.cookie.name];
  }

  
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, authConfig.jwt.secret);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
};




const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Admin access required.' });
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
};
