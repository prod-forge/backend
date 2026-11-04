import type { NextFunction, Request, Response } from 'express';

const METRICS_PATH = /^\/(?:api\/)?metrics(?:\/|$)/i;

// Metrics are public inside the VPC only. The ALB always appends X-Forwarded-For, while Prometheus and the
// compose stack scrape the task directly without it, so a metrics request carrying the header came from the internet.
// The regex is case-insensitive because Express routing is, while the ALB listener rule is not.
export const metricsGateMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (METRICS_PATH.test(req.path) && req.headers['x-forwarded-for'] !== undefined) {
    res.status(404).end();

    return;
  }

  next();
};
