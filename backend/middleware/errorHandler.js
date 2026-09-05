/**
 * Centralized Express error-handling middleware
 */
export default function errorHandler(err, req, res, next) {
  console.error('❌ Server Error Encountered:', {
    message: err.message,
    method: req.method,
    url: req.originalUrl,
  });

  const statusCode =
    err.status || err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
