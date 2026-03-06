import { Controller, Get } from '@nestjs/common';

import { VersionService } from '../../modules/version/version.service';

@Controller('version')
export class VersionController {
  constructor(private versionService: VersionService) {}

  @Get()
  check(): { version: string } {
    return {
      version: this.versionService.getVersion(),
    };
  }
}
