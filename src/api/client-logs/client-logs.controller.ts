import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiErrors } from '../../common/decorators/swagger.decorators';
import { InternalServerError } from '../../error-handler/errors/common.errors';
import { DtoValidationErrors } from '../../error-handler/errors/dto-validation.errors';
import { ClientLogsService } from '../../features/client-logs/client-logs.service';
import { MobileLogDto } from './dtos/mobile-log.dto';
import { WebLogDto } from './dtos/web-log.dto';

@ApiTags('Client Logs')
@Controller({
  path: 'client-logs',
  version: '1',
})
export class ClientLogsController {
  constructor(private readonly clientLogsService: ClientLogsService) {}

  @ApiBody({ type: MobileLogDto })
  @ApiErrors(DtoValidationErrors, InternalServerError)
  @ApiOperation({ summary: 'Ingest mobile client logs' })
  @ApiResponse({ description: 'Logs accepted', status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('mobile')
  postMobileLogs(@Body() dto: MobileLogDto): void {
    this.clientLogsService.processMobileLog(dto);
  }

  @ApiBody({ type: WebLogDto })
  @ApiErrors(DtoValidationErrors, InternalServerError)
  @ApiOperation({ summary: 'Ingest web client logs' })
  @ApiResponse({ description: 'Logs accepted', status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('web')
  postWebLogs(@Body() dto: WebLogDto): void {
    this.clientLogsService.processWebLog(dto);
  }
}
