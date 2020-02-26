import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';

import { Polls } from '../priceFeeder/types';
import logger from '../logger';

import createRouter from './routes';

const app = express();
const port = process.env.PORT || 3000;
const { API_KEY } = process.env;

interface AppConfig {
  polls: Polls;
}

const label = 'Api';

const apiKeyGuard = (req: Request, res: Response, next: NextFunction) => {
  const { api_key: apiKey } = req.query;
  if (apiKey === API_KEY) {
    next();
    return;
  }

  res.status(400).send({ error: 'Invalid api key.' });
};

const startApi = (config: AppConfig) => {
  try {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    if (API_KEY == null) {
      throw new Error('API_KEY not set.');
    }

    app.use(apiKeyGuard);

    const { polls } = config;
    app.use('/api/v1', createRouter(polls));

    app.listen(port, () => logger.info({ label, message: 'Api server running...' }));
  } catch (err) {
    logger.error({ label, message: `Starting api server failed: ${err}` });
  }
};

export default startApi;
