const app = require('./src/app');
const connectDB = require('./src/config/database');
const { connectRedis, client: redisClient } = require('./src/config/redis');
const logger = require('./src/utils/logger');
const config = require('./src/config/config');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Connect to database
connectDB();

// Connect to Redis (optional — app will still run if Redis is unavailable)
connectRedis();

// Start server
const server = app.listen(config.port, config.host, () => {
  logger.info(`Server running in ${config.env} mode on ${config.host}:${config.port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    try {
      if (redisClient && redisClient.isOpen) await redisClient.disconnect();
      logger.info('Redis client disconnected');
    } catch (err) {
      logger.error('Error disconnecting Redis client', err);
    }
    logger.info('Process terminated!');
  });
});
