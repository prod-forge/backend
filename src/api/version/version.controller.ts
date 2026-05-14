import { Controller, Get } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { VersionService } from '../../modules/version/version.service';

@Controller('version')
@Public()
export class VersionController {
  constructor(private versionService: VersionService) {}

  @Get()
  check(): { version: string } {
    return {
      version: this.versionService.getVersion(),
    };
  }
}
