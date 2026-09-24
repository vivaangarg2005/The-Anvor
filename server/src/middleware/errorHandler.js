const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Only log actual server errors (500s) to the console, not routine 400 validation errors
  if (statusCode >= 500) {
    console.error(err.stack);
  }

  // Handle Mongoose Validation Error (e.g. missing required fields)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Handle Mongoose CastError (e.g. Invalid ObjectId format passed in URL)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle MongoDB Duplicate Key Error (Code 11000) (e.g. duplicate SKU or Slug)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered for '${field}'. Please use another value.`;
  }

  // In production, mask generic 500 errors to prevent leaking internal paths or DB schema details
  if (process.env.NODE_ENV !== 'development' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  // Do not send stack traces in production for security
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
