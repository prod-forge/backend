import { RequestContext } from './request-context';

describe('RequestContext', () => {
  describe('negative cases', () => {
    it('returns empty string when no context is set', () => {
      expect(RequestContext.getTraceId()).toBe('');
    });

    it('returns zero query count when no context is set', () => {
      expect(RequestContext.getQueryCount()).toBe(0);
    });

    it('ignores incrementQueryCount when no context is set', () => {
      expect(() => RequestContext.incrementQueryCount()).not.toThrow();
      expect(RequestContext.getQueryCount()).toBe(0);
    });
  });

  describe('positive cases', () => {
    it('counts queries per run call', () => {
      let first = 0;
      let second = 0;

      RequestContext.run('a', () => {
        RequestContext.incrementQueryCount();
        RequestContext.incrementQueryCount();
        first = RequestContext.getQueryCount();
      });
      RequestContext.run('b', () => {
        RequestContext.incrementQueryCount();
        second = RequestContext.getQueryCount();
      });

      expect(first).toBe(2);
      expect(second).toBe(1);
    });

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
