import { describe, expect, it } from 'vitest';
import { resolveAttendanceInsertResult } from '../src/core/attendance';

describe('resolveAttendanceInsertResult', () => {
  it('returns success for no error', () => {
    const result = resolveAttendanceInsertResult(null);
    expect(result.ok).toBe(true);
    expect(result.shouldLog).toBe(false);
  });

  it('handles unique conflict as friendly duplicate', () => {
    const result = resolveAttendanceInsertResult({ code: '23505' });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('DUPLICATE_ATTENDANCE');
    expect(result.userMessageVi).toContain('Đã chấm công hôm nay rồi');
    expect(result.shouldLog).toBe(false);
  });

  it('handles generic db errors as loggable', () => {
    const result = resolveAttendanceInsertResult({ code: 'XX000', message: 'boom' });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('DB_ERROR');
    expect(result.shouldLog).toBe(true);
  });
});
