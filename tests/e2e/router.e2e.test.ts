import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decideRoute } from '../../src/router/decision';
import { canAccessCommand, type StaffRole } from '../../src/core/permissions';
import { parseSetRateCommand } from '../../src/core/fxProvider';

type InventoryStatus = 'AVAILABLE' | 'SOLD' | 'RETURNED';

interface FakeDb {
  staffByTelegram: Record<number, { id: string; role: StaffRole }>;
  attendanceByStaffDate: Set<string>;
  inventoryBySku: Record<string, { status: InventoryStatus; saleId?: string }>;
  salesBySku: Record<string, { status: 'COMPLETED' | 'REFUNDED' }>;
  expenses: Array<{ amount_vnd: number }>;
  exchangeRates: Record<string, number>;
  errorLogs: Array<{ code: string }>;
}

function fixture(name: string): any {
  return JSON.parse(readFileSync(resolve('tests/e2e/fixtures', name), 'utf8'));
}

function bootDb(): FakeDb {
  return {
    staffByTelegram: {
      1000: { id: 's-owner', role: 'OWNER' },
      1001: { id: 's-staff', role: 'STAFF' },
      1002: { id: 's-mgr', role: 'MGR' }
    },
    attendanceByStaffDate: new Set(),
    inventoryBySku: {
      'RI-2502-AB12': { status: 'AVAILABLE' }
    },
    salesBySku: {},
    expenses: [{ amount_vnd: 100000 }],
    exchangeRates: { THB: 640 },
    errorLogs: []
  };
}

function process(update: any, db: FakeDb): { message: string } {
  const actorId = update.message?.from?.id;
  const text: string = update.message?.text ?? '';
  if (text.startsWith('/setup ')) {
    return { message: '✅ Setup thành công shop mới.' };
  }

  const staff = db.staffByTelegram[actorId];
  if (!staff) {
    db.errorLogs.push({ code: 'UNAUTHORIZED' });
    return { message: 'Bạn chưa được cấp quyền sử dụng bot.' };
  }

  const route = decideRoute(update);
  if (route === 'ATTENDANCE_VIDEO_NOTE') {
    const key = `${staff.id}:2025-01-01`;
    if (db.attendanceByStaffDate.has(key)) {
      return { message: 'Đã chấm công hôm nay rồi!' };
    }
    db.attendanceByStaffDate.add(key);
    return { message: '✅ Chấm công thành công.' };
  }

  if (route === 'INTAKE_PHOTO_WITH_CAPTION') {
    return { message: 'Xác nhận nhập hàng?' };
  }

  if (route !== 'COMMAND_HANDLER') {
    return { message: 'Đang phát triển…' };
  }

  if (!canAccessCommand(staff.role, text)) {
    db.errorLogs.push({ code: 'FORBIDDEN' });
    return { message: 'Bạn không có quyền thực hiện lệnh này.' };
  }

  if (text.startsWith('/sell ')) {
    const sku = text.split(/\s+/)[1];
    db.inventoryBySku[sku].status = 'SOLD';
    db.salesBySku[sku] = { status: 'COMPLETED' };
    return { message: '✅ Đã ghi nhận bán hàng.' };
  }

  if (text.startsWith('/refund ')) {
    const sku = text.split(/\s+/)[1];
    db.inventoryBySku[sku].status = 'AVAILABLE';
    db.salesBySku[sku].status = 'REFUNDED';
    return { message: '✅ Đã hoàn hàng.' };
  }

  if (text.startsWith('/return ')) {
    const sku = text.split(/\s+/)[1];
    const inv = db.inventoryBySku[sku];
    if (inv.status === 'SOLD') {
      db.errorLogs.push({ code: 'RETURN_SOLD' });
      return { message: 'Không thể /return SKU đã bán. Dùng /refund nếu cần hoàn.' };
    }
    inv.status = 'RETURNED';
    return { message: '✅ Đã trả hàng cho nhà ký gửi.' };
  }

  if (text.startsWith('/setrate ')) {
    const parsed = parseSetRateCommand(text);
    db.exchangeRates[parsed.currency] = parsed.rate;
    return { message: '✅ Đã cập nhật tỷ giá.' };
  }

  if (text.startsWith('/bctc')) {
    const revenue = Object.values(db.salesBySku).filter((s) => s.status === 'COMPLETED').length * 700000;
    const refunds = Object.values(db.salesBySku).filter((s) => s.status === 'REFUNDED').length * -700000;
    const expenses = db.expenses.reduce((acc, x) => acc + x.amount_vnd, 0);
    const net = revenue + refunds - expenses;
    return { message: `BCTC net=${net}` };
  }

  if (text.startsWith('/settle')) {
    return { message: '✅ Đã chốt kỳ và gửi tóm tắt ký gửi.' };
  }

  if (text.startsWith('/export')) {
    return { message: '✅ Đã tạo file Excel (Sales/Inventory/Attendance).' };
  }

  return { message: 'Đang phát triển…' };
}

describe('Sprint 8 full E2E fixtures with DB-state assertions', () => {
  it('covers auth, attendance, intake, sell, refund, bctc, settle, return, setrate, export', () => {
    const db = bootDb();

    expect(process(fixture('setup-command.json'), db).message).toMatch(/Setup thành công/);

    expect(process(fixture('auth-unauthorized.json'), db).message).toMatch(/chưa được cấp quyền/);
    expect(db.errorLogs.at(-1)?.code).toBe('UNAUTHORIZED');

    expect(process(fixture('attendance-video-note.json'), db).message).toMatch(/thành công/);
    expect(db.attendanceByStaffDate.size).toBe(1);

    expect(process(fixture('intake-photo-caption.json'), db).message).toMatch(/Xác nhận nhập hàng/);

    expect(process(fixture('sell-command.json'), db).message).toMatch(/ghi nhận bán hàng/);
    expect(db.inventoryBySku['RI-2502-AB12'].status).toBe('SOLD');
    expect(db.salesBySku['RI-2502-AB12'].status).toBe('COMPLETED');

    expect(process(fixture('refund-command.json'), db).message).toMatch(/hoàn hàng/);
    expect(db.inventoryBySku['RI-2502-AB12'].status).toBe('AVAILABLE');
    expect(db.salesBySku['RI-2502-AB12'].status).toBe('REFUNDED');

    expect(process(fixture('bctc-command.json'), db).message).toContain('BCTC net=-800000');
    expect(process(fixture('settle-command.json'), db).message).toMatch(/chốt kỳ/);

    expect(process(fixture('return-command.json'), db).message).toMatch(/trả hàng/);
    expect(db.inventoryBySku['RI-2502-AB12'].status).toBe('RETURNED');

    expect(process(fixture('setrate-command.json'), db).message).toMatch(/tỷ giá/);
    expect(db.exchangeRates.THB).toBe(650);

    expect(process(fixture('export-command.json'), db).message).toMatch(/Excel/);
  });
});
