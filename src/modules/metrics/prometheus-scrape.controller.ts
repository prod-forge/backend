import type { Response } from 'express';

import { Controller, Get, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrometheusController } from '@willsoto/nestjs-prometheus';

import { Public } from '../../common/decorators/public.decorator';

@Controller()
@Public()
@SkipThrottle()
export class PrometheusScrapeController extends PrometheusController {
  @Get()
  override index(@Res({ passthrough: true }) response: Response): Promise<string> {
    return super.index(response);
  }
}
