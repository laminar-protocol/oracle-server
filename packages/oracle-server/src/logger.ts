import { createLogger, format, transports } from 'winston';

const newLogger = () => {
  const { combine, timestamp: timestampFormat, printf } = format;

  const customFormat = printf(({ level, label, message, timestamp }) => `${timestamp} ${level}: [${label}] ${message}`);

  const logger = createLogger({
    level: 'info',
    format: combine(
      timestampFormat(),
      customFormat
    ),
    transports: [
      // - Write to all logs with level `info` and below to `combined.log`
      // - Write all logs error (and below) to `error.log`.
      new transports.File({ filename: 'error.log', level: 'error' }),
      new transports.File({ filename: 'combined.log' })
    ]
  });
  if (process.env.CONSOLE_LOG === 'true') {
    logger.add(new transports.Console());
  }
  return logger;
};

const logger = newLogger();

export default logger;
