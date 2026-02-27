import { describe, expect, it } from 'vitest';
import { advanceSetupState, ensureShopCodeAvailable, parseSetupCommand } from '../src/core/setupFlow';

describe('setup parser validation', () => {
  it('parses a valid setup payload', () => {
    const out = parseSetupCommand('/setup sec HOTCHOCO Shop Hot|Alice|Asia/Ho_Chi_Minh|25');
    expect(out.shopCode).toBe('HOTCHOCO');
    expect(out.defaultCommissionRate).toBe(25);
  });

  it('rejects invalid timezone', () => {
    expect(() => parseSetupCommand('/setup sec HOT Shop|Alice|Mars/Nowhere|20')).toThrow(/Timezone/);
  });

  it('marks wrong secret as not ready', () => {
    const state = advanceSetupState('/setup bad HOT Shop|Alice|Asia/Ho_Chi_Minh|20', 'good');
    expect(state.step).toBe('VALIDATE_SECRET');
  });

  it('rejects duplicate shop code', () => {
    expect(() => ensureShopCodeAvailable('HOT', ['HOT', 'ABC'])).toThrow(/đã tồn tại/);
  });
});
