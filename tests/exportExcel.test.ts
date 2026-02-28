import { describe, expect, it } from 'vitest';
import { buildExportWorkbook } from '../src/core/exportExcel';

describe('export workbook schema', () => {
  it('contains Sales, Inventory, Attendance sheets and headers', () => {
    const wb = buildExportWorkbook({
      dateFrom: '2026-02-01',
      dateTo: '2026-02-28',
      salesRows: [{ sku: 'RI-2602-ABCD', sold_at: '2026-02-10', sold_price_vnd: 1000000, payment_method: 'CASH', status: 'COMPLETED' }],
      inventoryRows: [{ sku: 'RI-2602-ABCD', category: 'RING', status: 'AVAILABLE', intake_price_vnd: 500000, sale_price_vnd: 1000000 }],
      attendanceRows: [{ staff_id: 'st1', attendance_date: '2026-02-10', clock_in_time: '08:59', clock_out_time: '18:00', penalty_vnd: 0 }]
    });

    expect(wb.sheets.map((s) => s.name)).toEqual(['Sales', 'Inventory', 'Attendance']);
    expect(wb.sheets[0].headers).toContain('SKU');
  });
});
