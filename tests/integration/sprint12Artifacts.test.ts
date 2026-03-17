import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('sprint 12 production-readiness artifacts', () => {
  it('contains production compose with n8n and pos-api services', () => {
    const yml = readFileSync('infra/docker-compose.prod.yml', 'utf8');
    expect(yml).toContain('n8n:');
    expect(yml).toContain('pos-api:');
    expect(yml).toContain('GOOGLE_SHEETS_SPREADSHEET_ID');
  });

  it('contains self-host supabase option files', () => {
    expect(existsSync('infra/supabase-selfhost/docker-compose.yml')).toBe(true);
    expect(existsSync('infra/supabase-selfhost/README.md')).toBe(true);
  });

  it('contains pdpd/security/runbook/dr docs', () => {
    expect(existsSync('docs/pdpd_technical_assessment.md')).toBe(true);
    expect(existsSync('docs/security_controls.md')).toBe(true);
    expect(existsSync('docs/runbook.md')).toBe(true);
    expect(existsSync('docs/dr_drill.md')).toBe(true);
  });

  it('contains smoke and loadtest scripts', () => {
    const pkg = readFileSync('package.json', 'utf8');
    expect(pkg).toContain('loadtest:50shops');
    expect(pkg).toContain('"smoke"');
    expect(existsSync('tools/loadtest/run_loadtest_50shops.ts')).toBe(true);
  });
});
