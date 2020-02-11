import express from 'express';
import bodyParser from 'body-parser';

import { Polls } from '../priceFeeder/types';
import logger from '../logger';

import createRouter from './routes';

const app = express();
const port = 3000;

interface AppConfig {
  polls: Polls;
}

const loggerLabel = 'Api';

const startApi = (config: AppConfig) => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  const { polls } = config;
  app.use('/api/v1', createRouter(polls));

  app.listen(port, () => logger.info({ label: loggerLabel, message: 'Api server running...' }));
};

export default startApi;
