import { Router } from 'express';

import { Polls } from '../../priceFeeder/types';
import createPollRouter from './polls';

const createRouter = (polls: Polls): Router => {
  const router = Router();
  router.use('/polls', createPollRouter(polls));

  return router;
};

export default createRouter;
