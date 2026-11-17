import { PartialType } from '@nestjs/swagger';

import { CreateTodoDto } from './create-todo.dto';

// skipNullProperties:false makes PartialType opt fields out only for undefined,
// not null. CreateTodoDto already gates completed/title on value !== undefined,
// so a PATCH with null for either is validated (and rejected) instead of
// reaching Prisma as a 500. The nullable description keeps its @IsOptional().
export class UpdateTodoDto extends PartialType(CreateTodoDto, { skipNullProperties: false }) {}
