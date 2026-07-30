const app = require('./src/app');
const env = require('./src/config/env');
const { connectDB, disconnectDB } = require('./src/config/db');
const logger = require('./src/utils/logger');

let server;

async function start() {
  await connectDB();
  server = app.listen(env.port, () => {
    logger.info(`EBook API listening on port ${env.port} [${env.nodeEnv}]`);
  });
}

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

async function gracefulShutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start();
