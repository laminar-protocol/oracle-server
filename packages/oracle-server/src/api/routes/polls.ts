import { Router } from 'express';

import { Polls } from '../../priceFeeder/types';
import PollsController from '../controllers/polls';

const createPollsRouter = (polls: Polls): Router => {
  const pollsController = new PollsController(polls);
  const pollsRouter = Router({ mergeParams: true });

  pollsRouter.get('/', pollsController.get);
  pollsRouter.get('/:poll', pollsController.getOne);
  pollsRouter.patch('/', pollsController.patch);
  pollsRouter.patch('/:poll', pollsController.patchOne);

  return pollsRouter;
};

export default createPollsRouter;
