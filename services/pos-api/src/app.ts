import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import crypto from 'node:crypto';
import { sanitizeVND } from '../../../src/core/sanitizeVND';

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });

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
    [hash]
  );

  if (!rows[0]) {
    res.status(401).json({ error: 'invalid_api_key' });
    return;
  }

  (req as Request & { shopId: string }).shopId = rows[0].shop_id;
  next();
}

export function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(apiKeyAuth);

  app.get('/inventory', async (req, res) => {
    const shopId = (req as Request & { shopId: string }).shopId;
    const { rows } = await pool.query('select * from public.inventory where shop_id = $1::uuid order by created_at desc limit 200', [shopId]);
    res.json(rows);
  });

  app.post('/inventory', async (req, res) => {
    const shopId = (req as Request & { shopId: string }).shopId;
    const amount = sanitizeVND(req.body.sale_price_vnd);
    const { rows } = await pool.query(
      "insert into public.inventory (shop_id, consignor_id, sku, category, intake_price_vnd, sale_price_vnd, commission_rate, status) values ($1::uuid,$2::uuid,$3,$4,$5::bigint,$6::bigint,$7::numeric,'AVAILABLE') returning *",
      [shopId, req.body.consignor_id, req.body.sku, req.body.category, sanitizeVND(req.body.intake_price_vnd), amount, req.body.commission_rate ?? 20]
    );
    res.status(201).json(rows[0]);
  });

  app.patch('/inventory/:sku', async (req, res) => {
    const shopId = (req as Request & { shopId: string }).shopId;
    const { rows } = await pool.query(
      'update public.inventory set category = coalesce($3, category), sale_price_vnd = coalesce($4::bigint, sale_price_vnd), updated_at = timezone(\'utc\', now()) where shop_id = $1::uuid and sku = $2 returning *',
      [shopId, req.params.sku, req.body.category ?? null, req.body.sale_price_vnd ? sanitizeVND(req.body.sale_price_vnd) : null]
    );
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    res.json(rows[0]);
  });

  app.delete('/inventory/:sku', async (req, res) => {
    const shopId = (req as Request & { shopId: string }).shopId;
    const { rowCount } = await pool.query('delete from public.inventory where shop_id = $1::uuid and sku = $2', [shopId, req.params.sku]);
    if (!rowCount) return res.status(404).json({ error: 'not_found' });
    res.status(204).send();
  });

  app.post('/sales', async (req, res) => {
    const shopId = (req as Request & { shopId: string }).shopId;
    const client = await pool.connect();
    try {
      await client.query('begin');
      const inv = await client.query(
        "select id, sku, sale_price_vnd, commission_rate from public.inventory where shop_id = $1::uuid and sku = $2 and status = 'AVAILABLE' for update",
        [shopId, req.body.sku]
      );
      if (!inv.rows[0]) {
        await client.query('rollback');
        return res.status(409).json({ error: 'inventory_unavailable' });
      }

      const soldPrice = sanitizeVND(req.body.sold_price_vnd ?? inv.rows[0].sale_price_vnd);
      const commissionAmount = Math.round((soldPrice * Number(inv.rows[0].commission_rate ?? 0)) / 100);
      const consignorAmount = soldPrice - commissionAmount;

      const sale = await client.query(
        "insert into public.sales (shop_id, inventory_id, sku, sold_price_vnd, commission_amount_vnd, consignor_amount_vnd, status) values ($1::uuid,$2::uuid,$3,$4::bigint,$5::bigint,$6::bigint,'COMPLETED') returning *",
        [shopId, inv.rows[0].id, inv.rows[0].sku, soldPrice, commissionAmount, consignorAmount]
      );
      await client.query("update public.inventory set status='SOLD', sold_at=timezone('utc', now()), updated_at=timezone('utc', now()) where id = $1::uuid", [inv.rows[0].id]);
      await client.query('commit');
      res.status(201).json(sale.rows[0]);
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  });

  return app;
}
