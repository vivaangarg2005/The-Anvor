const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Default error structure
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Do not send stack traces in production for security
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
