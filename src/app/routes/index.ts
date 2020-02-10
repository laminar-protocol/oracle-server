import { Router } from 'express';

import { PollKind } from '../../priceFeeder/types';
import createPollRouter from './polls';

const createRoute = (pollers: PollKind[]): Router => {
  const router = Router();
  router.use('/polls', createPollRouter(pollers));

  return router;
};

export default createRoute;
