import { Request, Response } from 'express';

import { PollKind } from '../../priceFeeder/types';

export default class Poll {
  private polls: PollKind[];

  constructor(pollers: PollKind[]) {
    this.polls = pollers;
  }

  private summary = (): any => ({
    polls: this.polls.map((p) => p.summary()),
  });

  // poll info
  public get = (req: Request, res: Response) => {
    res.send(this.summary());
  }

  public patch = (req: Request, res: Response) => {
    const { action } = req.body;

    if (action === 'start') {
      this.polls.forEach((p) => p.start());
      this.get(req, res);
      return;
    }

    if (action === 'stop') {
      this.polls.forEach((p) => p.stop());
      this.get(req, res);
      return;
    }

    res.status(400).send({ error: 'Invalid action' });
  }
}
