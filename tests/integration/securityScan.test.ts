import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('security baseline', () => {
  it('does not hardcode live token values in .env.example', () => {
    const envExample = readFileSync('.env.example', 'utf8');
    expect(envExample).not.toMatch(/\b\d{8,}:[A-Za-z0-9_-]{20,}\b/);
    expect(envExample).toContain('replace-me');
  });
});
