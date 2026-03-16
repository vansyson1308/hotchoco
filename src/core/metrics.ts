import client from 'prom-client';

// Collect default Node.js metrics (memory, CPU, event loop)
client.collectDefaultMetrics({ prefix: 'hotchoco_' });

// ─── Business Metrics ─────────────────────────────────────

export const salesTotal = new client.Counter({
  name: 'hotchoco_sales_total',
  help: 'Total number of completed sales',
  labelNames: ['shop_id', 'payment_method'] as const,
});

export const refundsTotal = new client.Counter({
  name: 'hotchoco_refunds_total',
  help: 'Total number of refunds processed',
  labelNames: ['shop_id'] as const,
});

export const settlementsTotal = new client.Counter({
  name: 'hotchoco_settlements_total',
  help: 'Total number of settlements completed',
  labelNames: ['shop_id'] as const,
});

export const settlementDuration = new client.Histogram({
  name: 'hotchoco_settlement_duration_seconds',
  help: 'Settlement processing time in seconds',
  labelNames: ['shop_id'] as const,
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const activeShops = new client.Gauge({
  name: 'hotchoco_active_shops',
  help: 'Number of active shops',
});

// ─── API Metrics ──────────────────────────────────────────

export const apiRequestDuration = new client.Histogram({
  name: 'hotchoco_api_request_duration_seconds',
  help: 'API request processing time in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

export const apiRequestsTotal = new client.Counter({
  name: 'hotchoco_api_requests_total',
  help: 'Total API requests',
  labelNames: ['method', 'route', 'status_code'] as const,
});

// ─── Error Metrics ────────────────────────────────────────

export const errorsTotal = new client.Counter({
  name: 'hotchoco_errors_total',
  help: 'Total errors by type',
  labelNames: ['error_code', 'workflow'] as const,
});

// ─── Export registry for /metrics endpoint ────────────────

export const metricsRegistry = client.register;

export async function getMetrics(): Promise<string> {
  return metricsRegistry.metrics();
}
