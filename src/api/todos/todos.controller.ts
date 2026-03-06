import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import type { UserInterface } from '../../shared/interfaces/user.interface';

import { ApiEmpty, ApiErrors, ApiOk, ApiPaginated } from '../../common/decorators/swagger.decorators';
import { User } from '../../common/decorators/user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { DtoValidationErrors } from '../../error-handler/errors/dto-validation.errors';
import { UserNotFoundError } from '../../error-handler/errors/user.errors';
import { TodosService } from '../../features/todos/todos.service';
import { TodosQueryDto } from './dtos/queries/todos-query.dto';
import { CreateTodoDto } from './dtos/requests/create-todo.dto';
import { UpdateTodoDto } from './dtos/requests/update-todo.dto';
import { TodoResponseDto } from './dtos/responses/todo-response.dto';
import { TodosResponseDto } from './dtos/responses/todos-response.dto';

@ApiTags('Todos')
@Controller({
  path: 'todos',
  version: '1',
})
export class TodosController {
  constructor(private readonly todoService: TodosService) {}

  @ApiErrors(DtoValidationErrors)
  @ApiOk(TodoResponseDto, {
    access: true,
    description: 'Create new todo item for user',
    title: 'Create todo',
  })
  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() dto: CreateTodoDto, @User() { userId }: UserInterface): Promise<TodoResponseDto> {
    const created = await this.todoService.create(userId, dto);

    return plainToInstance(TodoResponseDto, created, {
      excludeExtraneousValues: true,
    });
  }

  @ApiPaginated(TodoResponseDto, {
    access: true,
    description: 'Get all todo items for user',
    title: 'Find All Todos',
  })
  @Get()
  @UseGuards(AuthGuard)
  async findAll(@User() { userId }: UserInterface, @Query() queryDto: TodosQueryDto): Promise<TodosResponseDto> {
    const todos = await this.todoService.findAll(userId, queryDto);

    return plainToInstance(TodosResponseDto, todos, {
      excludeExtraneousValues: true,
    });
  }

  @ApiErrors(DtoValidationErrors, UserNotFoundError)
  @ApiOk(TodoResponseDto, {
    access: true,
    description: 'Get todo item for user',
    title: 'Find One Todo',
  })
  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string): Promise<TodoResponseDto> {
    const todo = await this.todoService.findOne(id);

    return plainToInstance(TodoResponseDto, todo, {
      excludeExtraneousValues: true,
    });
  }

  @ApiEmpty({
    access: true,
    description: 'Todo was successfully deleted',
    title: 'Remove Todo',
  })
  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string): Promise<void> {
    await this.todoService.remove(id);
  }

  @ApiErrors(DtoValidationErrors, UserNotFoundError)
  @ApiOk(TodoResponseDto, {
    access: true,
    description: 'Update todo item for user',
    title: 'Update Todo',
  })
  @Patch(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateTodoDto): Promise<TodoResponseDto> {
    const todo = await this.todoService.update(id, dto);

    return plainToInstance(TodoResponseDto, todo, {
      excludeExtraneousValues: true,
    });
  }
}
