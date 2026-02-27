import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('release readiness contracts', () => {
  it('package scripts expose test:all and smoke', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.scripts['test:all']).toBeTypeOf('string');
    expect(pkg.scripts.smoke).toBeTypeOf('string');
  });

  it('pos api dependencies are present', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.dependencies.express).toBeDefined();
    expect(pkg.dependencies.pg).toBeDefined();
  });

  it('required operational docs exist', () => {
    expect(existsSync('docs/runbook.md')).toBe(true);
    expect(existsSync('docs/troubleshooting.md')).toBe(true);
    expect(existsSync('docs/backup_restore.md')).toBe(true);
    expect(existsSync('docs/pdpd_technical_assessment.md')).toBe(true);
  });
});
