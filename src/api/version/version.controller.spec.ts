import { Test } from '@nestjs/testing';

import { VersionService } from '../../modules/version/version.service';
import { VersionController } from './version.controller';

describe('VersionController', () => {
  let controller: VersionController;
  let versionService: { getVersion: jest.Mock };

  beforeEach(async () => {
    versionService = {
      getVersion: jest.fn().mockReturnValue('1.2.3'),
    };

    const module = await Test.createTestingModule({
      controllers: [VersionController],
      providers: [{ provide: VersionService, useValue: versionService }],
    }).compile();

    controller = module.get(VersionController);
  });

  describe('negative cases', () => {
    it('passes an error of the version service through', () => {
      const error = new Error('no version');
      versionService.getVersion.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.check()).toThrow(error);
    });
  });

  describe('positive cases', () => {
    it('check returns version object', () => {
      const result = controller.check();

      expect(result).toEqual({ version: '1.2.3' });
      expect(versionService.getVersion).toHaveBeenCalled();
    });
  });
});
