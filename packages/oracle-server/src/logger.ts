import { createLogger, format, transports } from 'winston';
import Transport from 'winston-transport';
import { IncomingWebhook } from '@slack/webhook';
import { LEVEL, MESSAGE } from 'triple-beam';

class SlackLogger extends Transport {
  webhook: IncomingWebhook

  constructor() {
    super();
    this.webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
  }

  async log(info: any, callback: any) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const level = info[LEVEL];
    switch (level) {
      case 'info':
      case 'error':
      case 'warn':
        await this.webhook.send({
          text: info[MESSAGE]
        });
        break;
    }

    callback();
  }
}

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
  if (process.env.SLACK_WEBHOOK_URL) {
    logger.add(new SlackLogger());
  }
  return logger;
};

const logger = newLogger();

export default logger;
