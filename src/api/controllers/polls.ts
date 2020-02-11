import { Request, Response } from 'express';

import { Polls, PollKind } from '../../priceFeeder/types';

export default class PollsController {
  private polls: Polls;

  constructor(polls: Polls) {
    this.polls = polls;
  }

  private summary = (): any => ({
    polls: Array.from(this.polls.values()).map((p) => p.summary()),
  });

  private guardNotFound = (req: Request, res: Response): PollKind | null => {
    const { poll: key } = req.params;
    const poll = this.polls.get(key);

    if (poll == null) {
      res.status(404).send({ error: `Poll ${key} not found.` });
      return null;
    }

    return poll;
  }

  private guardInvalidAction = (req: Request, res: Response): string | null => {
    const action = req.body && req.body.action;
    if (action === 'start' || action === 'stop') {
      return action;
    }

    res.status(400).send({ error: 'Invalid action.' });
    return null;
  }

  public get = (req: Request, res: Response) => {
    res.send(this.summary());
  }

  public patch = (req: Request, res: Response) => {
    const action = this.guardInvalidAction(req, res);
    if (action == null) {
      return;
    }

    if (action === 'start') {
      this.polls.forEach((p) => p.start());
    }
    if (action === 'stop') {
      this.polls.forEach((p) => p.stop());
    }

    this.get(req, res);
  }

  public getOne = (req: Request, res: Response) => {
    const poll = this.guardNotFound(req, res);
    if (poll == null) {
      return;
    }

    res.send(poll.summary());
  }

  public patchOne = (req: Request, res: Response) => {
    const poll = this.guardNotFound(req, res);
    if (poll == null) {
      return;
    }

    const action = this.guardInvalidAction(req, res);
    if (action == null) {
      return;
    }

    if (action === 'start') {
      poll.start();
    }
    if (action === 'stop') {
      poll.stop();
    }

    res.send(poll.summary());
  }
}
