import express from 'express';
import bodyParser from 'body-parser';

import { Polls } from '../priceFeeder/types';
import logger from '../logger';

import createRoute from './routes';

const app = express();
const port = 3000;

interface AppConfig {
  polls: Polls;
}

const loggerLabel = 'App';

const startApi = (config: AppConfig) => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  const { polls } = config;
  app.use('/api/v1', createRoute(polls));

  app.listen(port, () => logger.info({ label: loggerLabel, message: 'app running...' }));
};

export default startApi;
