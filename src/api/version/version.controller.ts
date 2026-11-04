import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';
import { VersionService } from '../../modules/version/version.service';

@Controller('version')
@Public()
@SkipThrottle()
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  @Get()
  check(): { version: string } {
    return {
      version: this.versionService.getVersion(),
    };
  }
}
