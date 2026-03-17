import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import { sanitizeVND } from '../../../src/core/sanitizeVND';
import {
  InventoryCreateSchema,
  InventoryUpdateSchema,
  SaleCreateSchema,
  PaginationSchema,
} from '../../../src/core/validation';
import { logger, createCorrelationId } from '../../../src/core/logger';
import { apiRequestDuration, apiRequestsTotal, getMetrics } from '../../../src/core/metrics';
import type { GoogleSheetsAdapter } from '../../../src/adapters/googleSheets';
import { createSheetsAdapter } from '../../../src/adapters/googleSheets';

// ─── Adapter singleton ─────────────────────────────────────────────
let adapter: GoogleSheetsAdapter;

function getAdapter(): GoogleSheetsAdapter {
  if (!adapter) {
    adapter = createSheetsAdapter();
  }
  return adapter;
}

// ─── Types ─────────────────────────────────────────────────────────
interface AuthenticatedRequest extends Request {
  shopId: string;
  correlationId: string;
}

// ─── Auth middleware ────────────────────────────────────────────────
async function apiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'missing_api_key' });
    return;
  }

  // Simple API key validation via env var (single-shop system)
  const expectedKey = process.env.POS_API_KEY ?? '';
  if (!expectedKey) {
    // Fallback: SHA256 hash comparison against HC_Config
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const storedHash = await getAdapter().getConfig('api_key_hash');
    if (!storedHash || hash !== storedHash) {
      res.status(401).json({ error: 'invalid_api_key' });
      return;
    }
  } else if (token !== expectedKey) {
    res.status(401).json({ error: 'invalid_api_key' });
    return;
  }

  (req as unknown as AuthenticatedRequest).shopId = 'default';
  (req as unknown as AuthenticatedRequest).correlationId = createCorrelationId();
  next();
}

// ─── Metrics middleware ────────────────────────────────────────────
function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e9;
    const route = req.route?.path ?? req.path;
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    apiRequestDuration.observe(labels, durationMs);
    apiRequestsTotal.inc(labels);
  });
  next();
}

// ─── Error handler ─────────────────────────────────────────────────
function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const correlationId = (req as unknown as AuthenticatedRequest).correlationId ?? 'unknown';
  logger.error({ err, correlationId, path: req.path, method: req.method }, 'Unhandled API error');
  res.status(500).json({ error: 'internal_error', correlationId });
}

// ─── App Builder ───────────────────────────────────────────────────
export function buildApp(injectedAdapter?: GoogleSheetsAdapter) {
  if (injectedAdapter) adapter = injectedAdapter;

  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? false, methods: ['GET', 'POST', 'PATCH', 'DELETE'] }));
  app.use(express.json({ limit: '1mb' }));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'rate_limited', message: 'Too many requests' },
    }),
  );
  app.use(metricsMiddleware);

  // ─── Public endpoints ──────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), backend: 'google-sheets' });
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(await getMetrics());
  });

  // ─── Authenticated endpoints ───────────────────────────────────
  app.use(apiKeyAuth);

  // GET /inventory — paginated product list
  app.get('/inventory', async (req, res) => {
    const pagination = PaginationSchema.parse(req.query);
    const result = await getAdapter().getInventoryPaginated(pagination.cursor, pagination.limit);
    res.json(result);
  });

  // POST /inventory — create product
  app.post('/inventory', async (req, res) => {
    const body = InventoryCreateSchema.parse(req.body);
    const intakePrice = sanitizeVND(body.intake_price_vnd);
    const salePrice = sanitizeVND(body.sale_price_vnd);

    const product = await getAdapter().insertProduct({
      name: body.sku, // Use SKU as name for hotchoco compatibility
      brand: body.consignor_id ?? '',
      category: body.category,
      price: salePrice,
      cost: intakePrice,
      consignorCode: body.consignor_id,
      intakePrice,
      commissionRate: body.commission_rate,
    });
    res.status(201).json(product);
  });

  // PATCH /inventory/:sku — update product
  app.patch('/inventory/:sku', async (req, res) => {
    const body = InventoryUpdateSchema.parse(req.body);
    const updates: Record<string, unknown> = {};
    if (body.category) updates.category = body.category;
    if (body.sale_price_vnd) updates.price = sanitizeVND(body.sale_price_vnd);

    const product = await getAdapter().updateProduct(req.params.sku, updates);
    if (!product) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json(product);
  });

  // DELETE /inventory/:sku — delete product
  app.delete('/inventory/:sku', async (req, res) => {
    const deleted = await getAdapter().deleteProduct(req.params.sku);
    if (!deleted) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.status(204).send();
  });

  // POST /sales — record a sale (with mutex lock)
  app.post('/sales', async (req, res) => {
    const body = SaleCreateSchema.parse(req.body);
    try {
      const order = await getAdapter().recordSale({
        sku: body.sku,
        soldPriceVnd: body.sold_price_vnd ? sanitizeVND(body.sold_price_vnd) : undefined,
        paymentMethod: body.payment_method ?? 'CASH',
        staffId: (req as unknown as AuthenticatedRequest).shopId,
      });
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof Error && error.message === 'INVENTORY_UNAVAILABLE') {
        res.status(409).json({ error: 'inventory_unavailable' });
        return;
      }
      throw error;
    }
  });

  // POST /settlement — run settlement for a consignor
  app.post('/settlement', async (req, res) => {
    const { consignor_code, period_start, period_end } = req.body;
    if (!consignor_code) {
      res.status(400).json({ error: 'consignor_code is required' });
      return;
    }
    const settlement = await getAdapter().applySettlement({
      consignorCode: consignor_code,
      periodStart: period_start ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      periodEnd: period_end ?? new Date().toISOString().substring(0, 10),
    });
    if (!settlement) {
      res.status(404).json({ error: 'no_unsettled_sales' });
      return;
    }
    res.status(201).json(settlement);
  });

  // POST /refund — process a refund
  app.post('/refund', async (req, res) => {
    const { sku, reason } = req.body;
    if (!sku) {
      res.status(400).json({ error: 'sku is required' });
      return;
    }
    const result = await getAdapter().processRefund({ sku, reason: reason ?? '' });
    if (!result.refundedOrder) {
      res.status(404).json({ error: 'no_completed_sale_found' });
      return;
    }
    res.json(result);
  });

  // GET /reports/daily — daily sales summary
  app.get('/reports/daily', async (req, res) => {
    const dateStr = (req.query.date as string) ?? new Date().toISOString().substring(0, 10);
    const summary = await getAdapter().getDailySalesSummary(dateStr);
    res.json(summary);
  });

  // GET /reports/monthly — monthly BCTC
  app.get('/reports/monthly', async (req, res) => {
    const yearMonth = (req.query.month as string) ?? new Date().toISOString().substring(0, 7).replace('-', '');
    const report = await getAdapter().getMonthlyBCTC(yearMonth);
    res.json(report);
  });

  app.use(errorHandler);

  return app;
}
