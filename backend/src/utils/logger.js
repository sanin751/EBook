const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp, stack }) => (
        `${timestamp} [${level}]: ${stack || message}`
      ))
    ),
  })],
  silent: process.env.NODE_ENV === 'test',
});

module.exports = logger;
