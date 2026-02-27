import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('POS API contract', () => {
  const appTs = readFileSync('services/pos-api/src/app.ts', 'utf8');
  const openapi = readFileSync('services/pos-api/openapi.yaml', 'utf8');

  it('defines inventory CRUD and create sale endpoints in service code', () => {
    expect(appTs).toContain("app.get('/inventory'");
    expect(appTs).toContain("app.post('/inventory'");
    expect(appTs).toContain("app.patch('/inventory/:sku'");
    expect(appTs).toContain("app.delete('/inventory/:sku'");
    expect(appTs).toContain("app.post('/sales'");
  });

  it('enforces bearer api key and shop scoping', () => {
    expect(appTs).toContain('authorization');
    expect(appTs).toContain('public.api_keys');
    expect(appTs).toContain('shop_id = $1::uuid');
  });

  it('openapi includes required paths', () => {
    expect(openapi).toContain('/inventory');
    expect(openapi).toContain('/inventory/{sku}');
    expect(openapi).toContain('/sales');
    expect(openapi).toContain('bearerAuth');
  });
});
