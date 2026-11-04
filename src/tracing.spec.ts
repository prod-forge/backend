import { createSentryAwarePropagator, duplicateRoutingInstrumentation, isTracingEnabled } from './tracing';

describe('tracing', () => {
  const original = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  afterEach(() => {
    if (original === undefined) delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    else process.env.OTEL_EXPORTER_OTLP_ENDPOINT = original;
  });

  describe('negative cases', () => {
    it('is disabled without OTEL_EXPORTER_OTLP_ENDPOINT', () => {
      delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

      expect(isTracingEnabled()).toBe(false);
    });
  });

  describe('positive cases', () => {
    it('is enabled when OTEL_EXPORTER_OTLP_ENDPOINT is set', () => {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://tempo:4318';

      expect(isTracingEnabled()).toBe(true);
    });

    it('disables the router instrumentation that adds a finish listener per middleware layer', () => {
      expect(duplicateRoutingInstrumentation).toEqual({ '@opentelemetry/instrumentation-router': { enabled: false } });
    });

    it('propagates both W3C traceparent and sentry-trace', () => {
      const fields = createSentryAwarePropagator().fields();

      expect(fields).toEqual(expect.arrayContaining(['traceparent', 'sentry-trace', 'baggage']));
    });
  });
});
