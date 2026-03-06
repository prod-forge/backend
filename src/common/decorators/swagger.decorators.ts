import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ReferenceObject, SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import { BaseError } from '../../error-handler/errors/_base.error';
import { ApiErrorDto } from '../../shared/dtos/errors.dto';
import { PaginatedResponseDto, PaginationMetaDto } from '../../shared/dtos/pagination.dto';

type ErrorClass = Type<BaseError<unknown>> & {
  code: string;
  message: string;
  status: number;
};

interface SwaggerOptions {
  access: boolean;
  description: string;
  metaModel?: Type;
  title: string;
}

export const ApiPaginated = <TModel extends Type>(
  model: TModel,
  { access, description, title }: SwaggerOptions,
): ClassDecorator & MethodDecorator => {
  const summary = `${title}${access ? ' 🔒' : ''}`;

  return applyDecorators(
    access ? ApiBearerAuth('access-token') : ApiBearerAuth('none'),
    ApiOperation({ summary }),
    ApiExtraModels(PaginatedResponseDto, PaginationMetaDto, ApiErrorDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: {
                items: { $ref: getSchemaPath(model) },
                type: 'array',
              },

              meta: {
                $ref: getSchemaPath(PaginationMetaDto),
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiOk = <TModel extends Type>(
  model: TModel,
  { access, description, metaModel, title }: SwaggerOptions,
): ClassDecorator & MethodDecorator => {
  const summary = `${title}${access ? ' 🔒' : ''}`;

  const metaSchema = metaModel
    ? {
        oneOf: [{ $ref: getSchemaPath(metaModel) }, { type: 'null' }],
      }
    : null;

  const allOf: (ReferenceObject | SchemaObject)[] = [
    {
      properties: {
        data: { $ref: getSchemaPath(model) },
      },
    },
  ];

  if (metaSchema) {
    allOf.push(metaSchema);
  }

  return applyDecorators(
    access ? ApiBearerAuth('access-token') : ApiBearerAuth('none'),
    ApiOperation({ summary }),
    ApiOkResponse({
      description,
      schema: {
        allOf,
      },
    }),
  );
};

export const ApiEmpty = ({ access, description, title }: SwaggerOptions): ClassDecorator & MethodDecorator => {
  const summary = `${title}${access ? ' 🔒' : ''}`;

  return applyDecorators(
    access ? ApiBearerAuth('access-token') : ApiBearerAuth('none'),
    ApiOperation({ summary }),
    ApiResponse({
      description,
      status: HttpStatus.NO_CONTENT,
    }),
  );
};

export const ApiErrors = (...errors: ErrorClass[]): ClassDecorator & MethodDecorator => {
  const responses = errors.map((ErrorCtor) => {
    const status = ErrorCtor.status ?? 500;

    return ApiResponse({
      description: `${ErrorCtor.code}: ${ErrorCtor.message}`,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiErrorDto) },
          {
            properties: {
              code: { example: ErrorCtor.code },
              message: { example: ErrorCtor.message },
              status: { example: ErrorCtor.status },
            },
          },
        ],
      },
      status,
    });
  });

  return applyDecorators(...responses);
};
