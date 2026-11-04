import type { TextMapPropagator } from '@opentelemetry/api';
import type { NodeClient } from '@sentry/node';

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { CompositePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK, tracing } from '@opentelemetry/sdk-node';
import { SentryContextManager } from '@sentry/node';
import { SentryPropagator, SentrySampler, SentrySpanProcessor } from '@sentry/opentelemetry';

import packageJson from '../package.json';

let sdk: NodeSDK | undefined;

export const isTracingEnabled = (): boolean => Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);

// Sentry registers its own instrumentation for these when it owns the OpenTelemetry setup;
// enabling them twice would patch the same modules and duplicate spans.
const sentryInstrumented = {
  '@opentelemetry/instrumentation-express': { enabled: false },
  '@opentelemetry/instrumentation-http': { enabled: false },
  '@opentelemetry/instrumentation-ioredis': { enabled: false },
  '@opentelemetry/instrumentation-pg': { enabled: false },
};

// Express 5 routes through the `router` package, which the express instrumentation already covers. The router
// instrumentation would add a second span and one response `finish` listener per middleware layer, exceeding Node's
// default of 10 and logging MaxListenersExceededWarning on every request.
export const duplicateRoutingInstrumentation = { '@opentelemetry/instrumentation-router': { enabled: false } };

// Accepts and emits both W3C `traceparent` and Sentry's `sentry-trace`/`baggage`.
export const createSentryAwarePropagator = (): TextMapPropagator =>
  new CompositePropagator({ propagators: [new W3CTraceContextPropagator(), new SentryPropagator()] });

/**
 * Starts the single global OpenTelemetry TracerProvider (NodeSDK). No-op without OTEL_EXPORTER_OTLP_ENDPOINT.
 * When Sentry is active it must be initialised with `skipOpenTelemetrySetup: true`; Sentry's span processor,
 * sampler, propagator and context manager are then plugged into this SDK so both share one provider.
 */
export const startTracing = (sentryClient?: NodeClient): void => {
  if (sdk || !isTracingEnabled()) return;

  const version = process.env.APP_VERSION || packageJson.version;
  // Tempo only ingests traces; keep the SDK from posting metrics/logs to the same endpoint.
  process.env.OTEL_METRICS_EXPORTER ??= 'none';
  process.env.OTEL_LOGS_EXPORTER ??= 'none';
  process.env.OTEL_RESOURCE_ATTRIBUTES ??= `service.version=${version}`;

  sdk = new NodeSDK({
    ...(sentryClient && {
      contextManager: new SentryContextManager(),
      sampler: new SentrySampler(sentryClient),
      textMapPropagator: createSentryAwarePropagator(),
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        ...duplicateRoutingInstrumentation,
        '@opentelemetry/instrumentation-fs': { enabled: false },
        ...(sentryClient && sentryInstrumented),
      }),
    ],
    serviceName: process.env.APP_NAME || packageJson.name,
    spanProcessors: [
      ...(sentryClient ? [new SentrySpanProcessor()] : []),
      new tracing.BatchSpanProcessor(new OTLPTraceExporter()),
    ],
  });

  sdk.start();
};

// Flushes buffered spans; called from ShutdownService after the drain and in-flight phases.
export const shutdownTracing = async (): Promise<void> => {
  const current = sdk;
  sdk = undefined;

  await current?.shutdown();
};
