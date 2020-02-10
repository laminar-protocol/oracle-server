import { Router } from 'express';

import { PollKind } from '../../priceFeeder/types';
import Poll from '../controllers/polls';

const createPollRouter = (pollers: PollKind[]): Router => {
  const poll = new Poll(pollers);
  const pollRouter = Router();

  pollRouter.get('/', poll.get);
  pollRouter.patch('/', poll.patch);

  return pollRouter;
};

export default createPollRouter;
