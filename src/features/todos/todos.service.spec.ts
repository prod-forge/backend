import { Test } from '@nestjs/testing';

import { cacheStorageMock } from '../../mocks/cache-storage.mock';
import { prismaMock } from '../../mocks/prisma.mock';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { CacheStorage } from '../../modules/redis-manager/storages/cache.storage';
import { TodosRepository } from './todos.repository';
import { TodosService } from './todos.service';

describe('TodosService (unit, prisma)', () => {
  let service: TodosService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TodosService,
        TodosRepository,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CacheStorage, useValue: cacheStorageMock },
      ],
    }).compile();

    service = module.get(TodosService);
  });

  it('should create todo', async () => {
    prismaMock.todo.create.mockResolvedValue({ id: 'userId', title: 'Test1' });
    const result = await service.create('userId', { title: 'Test1' });
    expect(result?.id).toBe('userId');
  });
});
