import { BatchSpanProcessor, ParentBasedSampler } from '@opentelemetry/sdk-trace';

import {
  createPropagator,
  createSampler,
  createSpanProcessors,
  duplicateRoutingInstrumentation,
  isTracingEnabled,
} from './tracing';

const SENTRY_DSN = 'https://public@o1.ingest.sentry.example/42';

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

    it('keeps the SDK default sampler without Sentry, so every trace reaches Tempo', () => {
      expect(createSampler()).toBeUndefined();
    });

    it('exports only to the OTLP endpoint without Sentry', () => {
      expect(createSpanProcessors()).toHaveLength(1);
    });

    it('skips the Sentry exporter when the DSN cannot be parsed', () => {
      expect(createSpanProcessors('not-a-dsn')).toHaveLength(1);
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

    it('propagates W3C traceparent and baggage', () => {
      expect(createPropagator().fields()).toEqual(expect.arrayContaining(['traceparent', 'baggage']));
    });

    it('samples root traces with the Sentry rate when Sentry is active', () => {
      expect(createSampler(SENTRY_DSN)).toBeInstanceOf(ParentBasedSampler);
      expect(createSampler(SENTRY_DSN)?.toString()).toContain('0.2');
    });

    it('also exports to Sentry over OTLP when Sentry is active', () => {
      const processors = createSpanProcessors(SENTRY_DSN);

      expect(processors).toHaveLength(2);
      processors.forEach((processor) => expect(processor).toBeInstanceOf(BatchSpanProcessor));
    });
  });
});
