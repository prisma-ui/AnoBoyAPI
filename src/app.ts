import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { apiRoutes } from './routes';
import { rateLimiter } from './middlewares/rateLimiter';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { swaggerSpec } from './docs/swagger';
import { logger } from './utils/logger';

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: config.cors.allowedOrigins === '*' ? '*' : config.cors.allowedOrigins.split(','),
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Compression & parsing
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.nodeEnv !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

// Rate limiting
app.use('/api', rateLimiter);

// Health check (no rate limit)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Swagger UI
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Anoboy API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// API routes
app.use('/api', apiRoutes);

// 404 & error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
