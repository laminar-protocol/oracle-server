import express from 'express';
import bodyParser from 'body-parser';

import { PollKind } from '../priceFeeder/types';
import logger from '../logger';

import createRoute from './routes';

const app = express();
const port = 3000;

interface AppConfig {
  pollers: PollKind[];
}

const loggerLabel = 'App';

const startApp = (config: AppConfig) => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  const { pollers } = config;
  app.use('/api/v1', createRoute(pollers));

  app.listen(port, () => logger.info({ label: loggerLabel, message: 'app running...' }));
};

export default startApp;
