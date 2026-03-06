import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';

export const ServiceHealthMetric = makeGaugeProvider({
  help: 'Health status of services (1=up, 0=down)',
  labelNames: ['service'],
  name: 'service_health_status',
});
