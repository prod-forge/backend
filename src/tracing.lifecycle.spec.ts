const sdkStart = jest.fn();
const sdkShutdown = jest.fn().mockResolvedValue(undefined);

jest.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: jest.fn().mockImplementation(() => ({ shutdown: sdkShutdown, start: sdkStart })),
}));

jest.mock('@opentelemetry/auto-instrumentations-node', () => ({
  getNodeAutoInstrumentations: jest.fn((config: object) => ({ config })),
}));

import { NodeSDK } from '@opentelemetry/sdk-node';

import { shutdownTracing, startTracing } from './tracing';

const OTEL_ENV = [
  'APP_NAME',
  'APP_VERSION',
  'OTEL_EXPORTER_OTLP_ENDPOINT',
  'OTEL_LOGS_EXPORTER',
  'OTEL_METRICS_EXPORTER',
  'OTEL_RESOURCE_ATTRIBUTES',
] as const;

type SdkOptions = {
  instrumentations: { config: Record<string, unknown> }[];
  sampler?: unknown;
  serviceName: string;
  spanProcessors: unknown[];
};

const sdkOptions = (): SdkOptions => jest.mocked(NodeSDK).mock.calls[0][0] as unknown as SdkOptions;

describe('startTracing and shutdownTracing', () => {
  const saved = Object.fromEntries(OTEL_ENV.map((name) => [name, process.env[name]]));

  beforeEach(() => {
    OTEL_ENV.forEach((name) => delete process.env[name]);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await shutdownTracing();
    OTEL_ENV.forEach((name) => {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    });
  });

  describe('negative cases', () => {
    it('does not start the SDK without OTEL_EXPORTER_OTLP_ENDPOINT', () => {
      startTracing();

      expect(NodeSDK).not.toHaveBeenCalled();
      expect(process.env.OTEL_METRICS_EXPORTER).toBeUndefined();
    });

    it('starts the SDK only once', () => {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://tempo:4318';

      startTracing();
      startTracing();

      expect(NodeSDK).toHaveBeenCalledTimes(1);
      expect(sdkStart).toHaveBeenCalledTimes(1);
    });

    it('does nothing on shutdown when tracing was never started', async () => {
      await shutdownTracing();

      expect(sdkShutdown).not.toHaveBeenCalled();
    });

    it('keeps OTEL_* values that are already set', () => {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://tempo:4318';
      process.env.OTEL_METRICS_EXPORTER = 'otlp';
      process.env.OTEL_RESOURCE_ATTRIBUTES = 'service.version=custom';

      startTracing();

      expect(process.env.OTEL_METRICS_EXPORTER).toBe('otlp');
      expect(process.env.OTEL_RESOURCE_ATTRIBUTES).toBe('service.version=custom');
    });
  });

  describe('positive cases', () => {
    it('starts the SDK with metric and log exporters off and the app version as a resource attribute', () => {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://tempo:4318';
      process.env.APP_VERSION = '9.9.9';

      startTracing();

      expect(sdkStart).toHaveBeenCalledTimes(1);
      expect(process.env.OTEL_METRICS_EXPORTER).toBe('none');
      expect(process.env.OTEL_LOGS_EXPORTER).toBe('none');
      expect(process.env.OTEL_RESOURCE_ATTRIBUTES).toBe('service.version=9.9.9');
    });

    it('disables the router and fs instrumentations', () => {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://tempo:4318';

      startTracing();

      expect(sdkOptions().instrumentations[0].config).toEqual({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-router': { enabled: false },
      });
    });

    it('uses APP_NAME as the service name', () => {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://tempo:4318';
      process.env.APP_NAME = 'todo-api';

      startTracing();

      expect(sdkOptions().serviceName).toBe('todo-api');
    });

    it('samples and exports to Sentry as well when a DSN is given', () => {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://tempo:4318';

      startTracing('https://public@o1.ingest.sentry.example/42');

      expect(sdkOptions().sampler).toBeDefined();
      expect(sdkOptions().spanProcessors).toHaveLength(2);
    });

    it('flushes spans on shutdown and allows a new start afterwards', async () => {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://tempo:4318';
      startTracing();

      await shutdownTracing();
      startTracing();

      expect(sdkShutdown).toHaveBeenCalledTimes(1);
      expect(NodeSDK).toHaveBeenCalledTimes(2);
    });
  });
});
