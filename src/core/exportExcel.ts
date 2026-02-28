export interface ExportSheet {
  name: string;
  headers: string[];
  rows: Array<Array<string | number | null>>;
}

export interface ExportWorkbook {
  fileName: string;
  sheets: ExportSheet[];
}

export function buildExportWorkbook(params: {
  dateFrom: string;
  dateTo: string;
  salesRows: Array<Record<string, unknown>>;
  inventoryRows: Array<Record<string, unknown>>;
  attendanceRows: Array<Record<string, unknown>>;
}): ExportWorkbook {
  const sales: ExportSheet = {
    name: 'Sales',
    headers: ['SKU', 'Sold At', 'Sold Price VND', 'Payment Method', 'Status'],
    rows: params.salesRows.map((r) => [
      String(r.sku ?? ''),
      String(r.sold_at ?? ''),
      Number(r.sold_price_vnd ?? 0),
      String(r.payment_method ?? ''),
      String(r.status ?? '')
    ])
  };

  const inventory: ExportSheet = {
    name: 'Inventory',
    headers: ['SKU', 'Category', 'Status', 'Intake Price VND', 'Sale Price VND'],
    rows: params.inventoryRows.map((r) => [
      String(r.sku ?? ''),
      String(r.category ?? ''),
      String(r.status ?? ''),
      Number(r.intake_price_vnd ?? 0),
      Number(r.sale_price_vnd ?? 0)
    ])
  };

  const attendance: ExportSheet = {
    name: 'Attendance',
    headers: ['Staff ID', 'Attendance Date', 'Clock In', 'Clock Out', 'Penalty VND'],
    rows: params.attendanceRows.map((r) => [
      String(r.staff_id ?? ''),
      String(r.attendance_date ?? ''),
      String(r.clock_in_time ?? ''),
      String(r.clock_out_time ?? ''),
      Number(r.penalty_vnd ?? 0)
    ])
  };

  return {
    fileName: `hotchoco_export_${params.dateFrom}_${params.dateTo}.xlsx`,
    sheets: [sales, inventory, attendance]
  };
}
