import { RequestContext } from './request-context';

describe('RequestContext', () => {
  describe('negative cases', () => {
    it('returns empty string when no context is set', () => {
      expect(RequestContext.getTraceId()).toBe('');
    });
  });

  describe('positive cases', () => {
    it('returns traceId set via run', (done) => {
      RequestContext.run('abc-123', () => {
        expect(RequestContext.getTraceId()).toBe('abc-123');
        done();
      });
    });

    it('isolates context per run call', (done) => {
      let inner = '';

      RequestContext.run('outer', () => {
        RequestContext.run('inner', () => {
          inner = RequestContext.getTraceId();
        });

        expect(RequestContext.getTraceId()).toBe('outer');
        expect(inner).toBe('inner');
        done();
      });
    });

    it('returns empty string outside run callback', (done) => {
      RequestContext.run('temp', () => {
        expect(RequestContext.getTraceId()).toBe('temp');
        done();
      });

      expect(RequestContext.getTraceId()).toBe('');
    });
  });
});
