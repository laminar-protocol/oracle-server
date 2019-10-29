import { createLogger, format, transports } from 'winston';
import envVars from './envVars';

const newLogger = () => {
  const { combine, timestamp, printf } = format;

  const customFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  });

  const logger = createLogger({
    level: 'info',
    format: combine(
      timestamp(),
      customFormat,
    ),
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log`
      // - Write all logs error (and below) to `error.log`.
      //
      new transports.File({ filename: 'error.log', level: 'error' }),
      new transports.File({ filename: 'combined.log' }),
    ]
  });
  if (process.env[envVars.NODE_ENV] !== 'prod') {
    logger.add(new transports.Console());
  }
  return logger;
};

const logger = newLogger();

export default logger;
