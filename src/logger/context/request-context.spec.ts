import { RequestContext } from './request-context';

describe('RequestContext', () => {
  describe('negative cases', () => {
    it('returns empty string when no context is set', () => {
      expect(RequestContext.getTraceId()).toBe('');
    });
  });

  describe('positive cases', () => {
    it('returns traceId set via run', () => {
      let traceId = '';

      RequestContext.run('abc-123', () => {
        traceId = RequestContext.getTraceId();
      });

      expect(traceId).toBe('abc-123');
    });

    it('isolates context per run call', () => {
      let inner = '';
      let outer = '';

      RequestContext.run('outer', () => {
        RequestContext.run('inner', () => {
          inner = RequestContext.getTraceId();
        });
        outer = RequestContext.getTraceId();
      });

      expect(outer).toBe('outer');
      expect(inner).toBe('inner');
    });

    it('returns empty string outside run callback', () => {
      let inside = '';

      RequestContext.run('temp', () => {
        inside = RequestContext.getTraceId();
      });

      expect(inside).toBe('temp');
      expect(RequestContext.getTraceId()).toBe('');
    });
  });
});
