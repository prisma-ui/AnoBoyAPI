import { app } from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { getRedisClient } from './config/redis';

const PORT = config.port;

async function bootstrap(): Promise<void> {
  // Attempt Redis connection (non-blocking)
  getRedisClient();

  const server = app.listen(PORT, () => {
    logger.info(`Anoboy API running on http://localhost:${PORT}`);
    logger.info(`Swagger UI available at http://localhost:${PORT}/swagger`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
  });
}

bootstrap();
