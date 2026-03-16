import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import crypto from 'node:crypto';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { sanitizeVND } from '../../../src/core/sanitizeVND';
import {
  InventoryCreateSchema,
  InventoryUpdateSchema,
  SaleCreateSchema,
  PaginationSchema,
} from '../../../src/core/validation';
import { logger, createCorrelationId } from '../../../src/core/logger';
import { apiRequestDuration, apiRequestsTotal, getMetrics } from '../../../src/core/metrics';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

interface AuthenticatedRequest extends Request {
  shopId: string;
  correlationId: string;
}

async function apiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'missing_api_key' });
    return;
  }

  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const { rows } = await pool.query(
    "select shop_id from public.api_keys where key_hash = $1 and status = 'ACTIVE' limit 1",
    [hash],
  );

  if (!rows[0]) {
    res.status(401).json({ error: 'invalid_api_key' });
    return;
  }

  (req as unknown as AuthenticatedRequest).shopId = rows[0].shop_id;
  (req as unknown as AuthenticatedRequest).correlationId = createCorrelationId();
  next();
}

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

function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const correlationId = (req as unknown as AuthenticatedRequest).correlationId ?? 'unknown';
  logger.error({ err, correlationId, path: req.path, method: req.method }, 'Unhandled API error');
  res.status(500).json({ error: 'internal_error', correlationId });
}

export function buildApp() {
  const app = express();

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

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(await getMetrics());
  });

  app.use(apiKeyAuth);

  app.get('/inventory', async (req, res) => {
    const shopId = (req as unknown as AuthenticatedRequest).shopId;
    const pagination = PaginationSchema.parse(req.query);

    let query = 'select * from public.inventory where shop_id = $1::uuid';
    const params: (string | number)[] = [shopId];

    if (pagination.cursor) {
      params.push(pagination.cursor);
      query += ` and created_at < (select created_at from public.inventory where id = $${params.length}::uuid)`;
    }

    params.push(pagination.limit + 1);
    query += ` order by created_at desc limit $${params.length}`;

    const { rows } = await pool.query(query, params);
    const hasMore = rows.length > pagination.limit;
    const data = hasMore ? rows.slice(0, pagination.limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1].id : undefined;

    res.json({ data, cursor: nextCursor, hasMore });
  });

  app.post('/inventory', async (req, res) => {
    const shopId = (req as unknown as AuthenticatedRequest).shopId;
    const body = InventoryCreateSchema.parse(req.body);
    const intakePrice = sanitizeVND(body.intake_price_vnd);
    const salePrice = sanitizeVND(body.sale_price_vnd);

    const { rows } = await pool.query(
      "insert into public.inventory (shop_id, consignor_id, sku, category, intake_price_vnd, sale_price_vnd, commission_rate, status) values ($1::uuid,$2::uuid,$3,$4,$5::bigint,$6::bigint,$7::numeric,'AVAILABLE') returning *",
      [shopId, body.consignor_id, body.sku, body.category, intakePrice, salePrice, body.commission_rate],
    );
    res.status(201).json(rows[0]);
  });

  app.patch('/inventory/:sku', async (req, res) => {
    const shopId = (req as unknown as AuthenticatedRequest).shopId;
    const body = InventoryUpdateSchema.parse(req.body);

    const { rows } = await pool.query(
      "update public.inventory set category = coalesce($3, category), sale_price_vnd = coalesce($4::bigint, sale_price_vnd), updated_at = timezone('utc', now()) where shop_id = $1::uuid and sku = $2 returning *",
      [shopId, req.params.sku, body.category ?? null, body.sale_price_vnd ? sanitizeVND(body.sale_price_vnd) : null],
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json(rows[0]);
  });

  app.delete('/inventory/:sku', async (req, res) => {
    const shopId = (req as unknown as AuthenticatedRequest).shopId;
    const { rowCount } = await pool.query('delete from public.inventory where shop_id = $1::uuid and sku = $2', [
      shopId,
      req.params.sku,
    ]);
    if (!rowCount) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.status(204).send();
  });

  app.post('/sales', async (req, res) => {
    const shopId = (req as unknown as AuthenticatedRequest).shopId;
    const body = SaleCreateSchema.parse(req.body);
    const client = await pool.connect();
    try {
      await client.query('begin');
      const inv = await client.query(
        "select id, sku, sale_price_vnd, commission_rate from public.inventory where shop_id = $1::uuid and sku = $2 and status = 'AVAILABLE' for update",
        [shopId, body.sku],
      );
      if (!inv.rows[0]) {
        await client.query('rollback');
        res.status(409).json({ error: 'inventory_unavailable' });
        return;
      }

      const soldPrice = sanitizeVND(body.sold_price_vnd ?? inv.rows[0].sale_price_vnd);
      const commissionAmount = Math.round((soldPrice * Number(inv.rows[0].commission_rate ?? 0)) / 100);
      const consignorAmount = soldPrice - commissionAmount;

      const sale = await client.query(
        "insert into public.sales (shop_id, inventory_id, sku, sold_price_vnd, commission_amount_vnd, consignor_amount_vnd, status) values ($1::uuid,$2::uuid,$3,$4::bigint,$5::bigint,$6::bigint,'COMPLETED') returning *",
        [shopId, inv.rows[0].id, inv.rows[0].sku, soldPrice, commissionAmount, consignorAmount],
      );
      await client.query(
        "update public.inventory set status='SOLD', sold_at=timezone('utc', now()), updated_at=timezone('utc', now()) where id = $1::uuid",
        [inv.rows[0].id],
      );
      await client.query('commit');
      res.status(201).json(sale.rows[0]);
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  });

  app.use(errorHandler);

  return app;
}
