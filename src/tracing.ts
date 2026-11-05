import type { TextMapPropagator } from '@opentelemetry/api';
import type { Sampler, SpanProcessor } from '@opentelemetry/sdk-trace';

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor, ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace';
import { getOtlpTracesEndpoint } from '@sentry/node';

import packageJson from '../package.json';
import { TRACES_SAMPLE_RATE } from './modules/sentry/sentry.constants';

let sdk: NodeSDK | undefined;

export const isTracingEnabled = (): boolean => Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);

// Express 5 routes through the `router` package, which the express instrumentation already covers. The router
// instrumentation would add a second span and one response `finish` listener per middleware layer, exceeding Node's
// default of 10 and logging MaxListenersExceededWarning on every request.
export const duplicateRoutingInstrumentation = { '@opentelemetry/instrumentation-router': { enabled: false } };

// W3C `traceparent` and `baggage`. Sentry 11 leaves propagation to the OpenTelemetry propagator when OTel owns tracing.
export const createPropagator = (): TextMapPropagator =>
  new CompositePropagator({ propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()] });

// Sentry no longer samples OTel spans; with Sentry on, the same rate it used before applies here (root spans only,
// children follow their parent). Without Sentry, every trace goes to Tempo, as before.
export const createSampler = (sentryDsn?: string): Sampler | undefined =>
  sentryDsn ? new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(TRACES_SAMPLE_RATE) }) : undefined;

// Sentry 11 receives OpenTelemetry spans over OTLP; errors are linked to them by openTelemetryIntegration().
export const createSpanProcessors = (sentryDsn?: string): SpanProcessor[] => {
  const sentryEndpoint = sentryDsn ? getOtlpTracesEndpoint(sentryDsn) : undefined;

  return [
    new BatchSpanProcessor({ exporter: new OTLPTraceExporter() }),
    ...(sentryEndpoint ? [new BatchSpanProcessor({ exporter: new OTLPTraceExporter(sentryEndpoint) })] : []),
  ];
};

/**
 * Starts the single global OpenTelemetry TracerProvider (NodeSDK). No-op without OTEL_EXPORTER_OTLP_ENDPOINT.
 * Spans go to the OTLP endpoint (Tempo) and, when Sentry is active, to Sentry's OTLP endpoint as well. Sentry is
 * initialised without a traces sample rate in this mode, so its own instrumentation records no spans of its own.
 */
export const startTracing = (sentryDsn?: string): void => {
  if (sdk || !isTracingEnabled()) return;

  const version = process.env.APP_VERSION || packageJson.version;
  // Tempo only ingests traces; keep the SDK from posting metrics/logs to the same endpoint.
  process.env.OTEL_METRICS_EXPORTER ??= 'none';
  process.env.OTEL_LOGS_EXPORTER ??= 'none';
  process.env.OTEL_RESOURCE_ATTRIBUTES ??= `service.version=${version}`;

  sdk = new NodeSDK({
    instrumentations: [
      getNodeAutoInstrumentations({
        ...duplicateRoutingInstrumentation,
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
    sampler: createSampler(sentryDsn),
    serviceName: process.env.APP_NAME || packageJson.name,
    spanProcessors: createSpanProcessors(sentryDsn),
    textMapPropagator: createPropagator(),
  });

  sdk.start();
};

// Flushes buffered spans; called from ShutdownService after the drain and in-flight phases.
export const shutdownTracing = async (): Promise<void> => {
  const current = sdk;
  sdk = undefined;

  await current?.shutdown();
};
