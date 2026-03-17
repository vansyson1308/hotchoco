/**
 * Google Sheets Adapter — replaces Supabase/PostgreSQL as the data layer.
 * Reads/writes directly to the VJ-Pos Google Spreadsheet.
 *
 * Authentication: Google Service Account with editor access to the spreadsheet.
 * Concurrency: Redis mutex locks for critical write operations.
 */

import { google, type sheets_v4 } from 'googleapis';
import { nanoid } from 'nanoid';
import {
  SHEET_NAMES,
  parseStaffRow,
  parseProductRow,
  productRowToSheetValues,
  parseArtistRow,
  parseOrderRow,
  orderRowToSheetValues,
  parseSettlementRow,
  settlementRowToSheetValues,
  parseRefundAdjRow,
  parseAttendanceRow,
  parseExpenseRow,
  type StaffRow,
  type ProductRow,
  type ArtistRow,
  type OrderRow,
  type SettlementRow,
  type RefundAdjRow,
  type AttendanceRow,
  type ExpenseRow,
  PRODUCT_COLUMNS,
  ORDER_COLUMNS,
  REFUND_ADJ_COLUMNS,
} from './sheetMappers';

// ─── Types ─────────────────────────────────────────────────────────
export interface SaleInput {
  sku: string;
  soldPriceVnd?: number;
  paymentMethod: string;
  staffId: string;
  customerName?: string;
  customerPhone?: string;
  idempotencyKey?: string;
}

export interface SettlementInput {
  consignorCode: string;
  periodStart: string;
  periodEnd: string;
}

export interface RefundInput {
  sku: string;
  reason: string;
}

export interface InventoryInput {
  name: string;
  brand: string;
  category: string;
  price: number;
  cost: number;
  quantity?: number;
  imageUrl?: string;
  consignorCode?: string;
  intakePrice?: number;
  conditionNote?: string;
  material?: string;
  telegramFileId?: string;
  receivedBy?: string;
  commissionRate?: number;
}

export interface MutexLock {
  acquire(key: string, ttlMs: number): Promise<boolean>;
  release(key: string): Promise<void>;
}

// ─── Adapter Class ─────────────────────────────────────────────────
export class GoogleSheetsAdapter {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;

  constructor(
    spreadsheetId: string,
    private mutex?: MutexLock,
    auth?: InstanceType<typeof google.auth.GoogleAuth>,
  ) {
    this.spreadsheetId = spreadsheetId;

    const googleAuth =
      auth ??
      new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        ...(process.env.GOOGLE_SERVICE_ACCOUNT_JSON
          ? { credentials: JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'base64').toString()) }
          : {}),
      });

    this.sheets = google.sheets({ version: 'v4', auth: googleAuth });
  }

  // ─── Low-level helpers ───────────────────────────────────────────

  private async getRows(sheetName: string): Promise<string[][]> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A2:ZZ`,
    });
    return (res.data.values as string[][]) ?? [];
  }

  private async appendRow(sheetName: string, values: string[]): Promise<void> {
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:ZZ`,
      valueInputOption: 'RAW',
      requestBody: { values: [values] },
    });
  }

  private async updateCell(sheetName: string, rowIndex: number, colIndex: number, value: string): Promise<void> {
    const col = String.fromCharCode(65 + colIndex);
    const range = `${sheetName}!${col}${rowIndex + 2}`;
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [[value]] },
    });
  }

  private async updateRow(sheetName: string, rowIndex: number, values: string[]): Promise<void> {
    const range = `${sheetName}!A${rowIndex + 2}:${String.fromCharCode(65 + values.length - 1)}${rowIndex + 2}`;
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [values] },
    });
  }

  private async deleteRow(sheetName: string, rowIndex: number): Promise<void> {
    // Get sheet ID first
    const meta = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      fields: 'sheets.properties',
    });
    const sheet = meta.data.sheets?.find((s) => s.properties?.title === sheetName);
    if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) return;

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex + 1, // +1 for header
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    });
  }

  private async batchGetRows(sheetNames: string[]): Promise<Map<string, string[][]>> {
    const ranges = sheetNames.map((name) => `${name}!A2:ZZ`);
    const res = await this.sheets.spreadsheets.values.batchGet({
      spreadsheetId: this.spreadsheetId,
      ranges,
    });
    const result = new Map<string, string[][]>();
    res.data.valueRanges?.forEach((vr, i) => {
      result.set(sheetNames[i], (vr.values as string[][]) ?? []);
    });
    return result;
  }

  // ─── Staff ───────────────────────────────────────────────────────

  async findStaffByTelegramId(telegramUserId: string): Promise<StaffRow | null> {
    const rows = await this.getRows(SHEET_NAMES.STAFF);
    for (const row of rows) {
      const staff = parseStaffRow(row);
      if (staff.telegramUserId === telegramUserId && staff.active) {
        return staff;
      }
    }
    return null;
  }

  async findStaffByPin(pin: string): Promise<StaffRow | null> {
    const rows = await this.getRows(SHEET_NAMES.STAFF);
    for (const row of rows) {
      const staff = parseStaffRow(row);
      if (staff.pin === pin && staff.active) {
        return staff;
      }
    }
    return null;
  }

  async linkTelegramToStaff(pin: string, telegramUserId: string): Promise<StaffRow | null> {
    const rows = await this.getRows(SHEET_NAMES.STAFF);
    for (let i = 0; i < rows.length; i++) {
      const staff = parseStaffRow(rows[i]);
      if (staff.pin === pin && staff.active) {
        await this.updateCell(SHEET_NAMES.STAFF, i, 5, telegramUserId);
        return { ...staff, telegramUserId };
      }
    }
    return null;
  }

  async getAllStaff(): Promise<StaffRow[]> {
    const rows = await this.getRows(SHEET_NAMES.STAFF);
    return rows.map(parseStaffRow).filter((s) => s.active);
  }

  // ─── Products / Inventory ────────────────────────────────────────

  async findProductBySku(sku: string): Promise<{ row: ProductRow; rowIndex: number } | null> {
    const rows = await this.getRows(SHEET_NAMES.PRODUCTS);
    for (let i = 0; i < rows.length; i++) {
      const product = parseProductRow(rows[i]);
      if (product.productId === sku || product.name === sku) {
        return { row: product, rowIndex: i };
      }
    }
    return null;
  }

  async findAvailableProductBySku(sku: string): Promise<{ row: ProductRow; rowIndex: number } | null> {
    const rows = await this.getRows(SHEET_NAMES.PRODUCTS);
    for (let i = 0; i < rows.length; i++) {
      const product = parseProductRow(rows[i]);
      if ((product.productId === sku || product.name === sku) && product.status === 'AVAILABLE') {
        return { row: product, rowIndex: i };
      }
    }
    return null;
  }

  async getAllProducts(statusFilter?: string): Promise<ProductRow[]> {
    const rows = await this.getRows(SHEET_NAMES.PRODUCTS);
    const products = rows.map(parseProductRow);
    if (statusFilter) return products.filter((p) => p.status === statusFilter);
    return products;
  }

  async getInventoryPaginated(
    cursor?: string,
    limit: number = 50,
  ): Promise<{ data: ProductRow[]; nextCursor?: string; hasMore: boolean }> {
    const rows = await this.getRows(SHEET_NAMES.PRODUCTS);
    let products = rows.map(parseProductRow);

    // Sort by createdAt desc
    products.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    if (cursor) {
      const cursorIdx = products.findIndex((p) => p.productId === cursor);
      if (cursorIdx >= 0) products = products.slice(cursorIdx + 1);
    }

    const hasMore = products.length > limit;
    const data = products.slice(0, limit);
    const nextCursor = hasMore ? data[data.length - 1].productId : undefined;

    return { data, nextCursor, hasMore };
  }

  async insertProduct(input: InventoryInput): Promise<ProductRow> {
    const productId = nanoid(10);
    const row: Partial<ProductRow> = {
      productId,
      name: input.name,
      brand: input.brand,
      category: input.category,
      price: input.price,
      cost: input.cost,
      quantity: input.quantity ?? 1,
      imageUrl: input.imageUrl ?? '',
      status: 'AVAILABLE',
      consignorCode: input.consignorCode ?? '',
      intakePrice: input.intakePrice ?? 0,
      conditionNote: input.conditionNote ?? '',
      material: input.material ?? '',
      telegramFileId: input.telegramFileId ?? '',
      receivedBy: input.receivedBy ?? '',
      soldAt: '',
      daysConsigned: 0,
      commissionRate: input.commissionRate ?? 0,
      createdAt: new Date().toISOString(),
      version: 1,
    };
    await this.appendRow(SHEET_NAMES.PRODUCTS, productRowToSheetValues(row));
    return row as ProductRow;
  }

  async updateProductStatus(sku: string, status: string, extraUpdates?: Partial<ProductRow>): Promise<boolean> {
    const found = await this.findProductBySku(sku);
    if (!found) return false;

    const { row, rowIndex } = found;
    const rows = await this.getRows(SHEET_NAMES.PRODUCTS);
    const currentRow = rows[rowIndex];

    currentRow[PRODUCT_COLUMNS.Status] = status;
    if (extraUpdates?.soldAt) currentRow[PRODUCT_COLUMNS.Sold_At] = extraUpdates.soldAt;
    if (extraUpdates?.quantity !== undefined) currentRow[PRODUCT_COLUMNS.Quantity] = String(extraUpdates.quantity);
    currentRow[PRODUCT_COLUMNS.Version] = String(row.version + 1);

    await this.updateRow(SHEET_NAMES.PRODUCTS, rowIndex, currentRow);
    return true;
  }

  async updateProduct(sku: string, updates: Partial<ProductRow>): Promise<ProductRow | null> {
    const found = await this.findProductBySku(sku);
    if (!found) return null;

    const { rowIndex } = found;
    const rows = await this.getRows(SHEET_NAMES.PRODUCTS);
    const currentRow = rows[rowIndex];

    if (updates.category) currentRow[PRODUCT_COLUMNS.Category] = updates.category;
    if (updates.price) currentRow[PRODUCT_COLUMNS.Price] = String(updates.price);
    if (updates.name) currentRow[PRODUCT_COLUMNS.Name] = updates.name;

    await this.updateRow(SHEET_NAMES.PRODUCTS, rowIndex, currentRow);
    return parseProductRow(currentRow);
  }

  async deleteProduct(sku: string): Promise<boolean> {
    const found = await this.findProductBySku(sku);
    if (!found) return false;
    await this.deleteRow(SHEET_NAMES.PRODUCTS, found.rowIndex);
    return true;
  }

  // ─── Consignors / Artists ────────────────────────────────────────

  async findConsignorByCode(code: string): Promise<ArtistRow | null> {
    const rows = await this.getRows(SHEET_NAMES.ARTISTS);
    for (const row of rows) {
      const artist = parseArtistRow(row);
      if (artist.artistId === code && artist.active) return artist;
    }
    return null;
  }

  async getAllConsignors(): Promise<ArtistRow[]> {
    const rows = await this.getRows(SHEET_NAMES.ARTISTS);
    return rows.map(parseArtistRow).filter((a) => a.active);
  }

  async insertConsignor(name: string, commissionRate: number, code?: string): Promise<ArtistRow> {
    const artistId = code ?? nanoid(6).toUpperCase();
    const values = [artistId, name, String(commissionRate), 'TRUE', 'FIXED', '30', '[]'];
    await this.appendRow(SHEET_NAMES.ARTISTS, values);
    return {
      artistId,
      name,
      commissionRate,
      active: true,
      commissionType: 'FIXED',
      payoutCycleDays: 30,
      slidingRules: '[]',
    };
  }

  async updateConsignorRate(code: string, rate: number): Promise<boolean> {
    const rows = await this.getRows(SHEET_NAMES.ARTISTS);
    for (let i = 0; i < rows.length; i++) {
      const artist = parseArtistRow(rows[i]);
      if (artist.artistId === code) {
        await this.updateCell(SHEET_NAMES.ARTISTS, i, 2, String(rate));
        return true;
      }
    }
    return false;
  }

  // ─── Sales / Orders ──────────────────────────────────────────────

  async recordSale(input: SaleInput): Promise<OrderRow> {
    const lockKey = `sale:${input.sku}`;
    if (this.mutex) {
      const acquired = await this.mutex.acquire(lockKey, 10000);
      if (!acquired) throw new Error('RATE_LIMITED: Could not acquire lock for sale recording');
    }

    try {
      // Find available product
      const found = await this.findAvailableProductBySku(input.sku);
      if (!found) throw new Error('INVENTORY_UNAVAILABLE');

      const { row: product, rowIndex } = found;
      const soldPrice = input.soldPriceVnd ?? product.price;
      const commissionAmount = Math.round((soldPrice * product.commissionRate) / 100);
      const consignorAmount = soldPrice - commissionAmount;

      // Check idempotency
      if (input.idempotencyKey) {
        const orders = await this.getRows(SHEET_NAMES.ORDERS);
        const existing = orders.find((r) => parseOrderRow(r).idempotencyKey === input.idempotencyKey);
        if (existing) return parseOrderRow(existing);
      }

      const orderId = `ORD-${nanoid(8)}`;
      const order: Partial<OrderRow> = {
        orderId,
        customerName: input.customerName ?? '',
        customerPhone: input.customerPhone ?? '',
        total: soldPrice,
        status: 'COMPLETED',
        paymentStatus: 'paid',
        paymentMethod: input.paymentMethod,
        createdAt: new Date().toISOString(),
        staffId: input.staffId,
        notes: '',
        sku: input.sku,
        productId: product.productId,
        commissionAmount,
        consignorAmount,
        consignorCode: product.consignorCode,
        settlementId: '',
        refundedAt: '',
        refundReason: '',
        idempotencyKey: input.idempotencyKey ?? '',
        version: 1,
      };

      // Append order and update product status
      await this.appendRow(SHEET_NAMES.ORDERS, orderRowToSheetValues(order));

      // Update product status to SOLD
      const productRows = await this.getRows(SHEET_NAMES.PRODUCTS);
      const currentProductRow = productRows[rowIndex];
      currentProductRow[PRODUCT_COLUMNS.Status] = 'SOLD';
      currentProductRow[PRODUCT_COLUMNS.Sold_At] = new Date().toISOString();
      currentProductRow[PRODUCT_COLUMNS.Version] = String(product.version + 1);
      if (product.quantity > 0) {
        currentProductRow[PRODUCT_COLUMNS.Quantity] = String(product.quantity - 1);
      }
      await this.updateRow(SHEET_NAMES.PRODUCTS, rowIndex, currentProductRow);

      return order as OrderRow;
    } finally {
      if (this.mutex) await this.mutex.release(lockKey);
    }
  }

  async getOrdersBySku(sku: string): Promise<OrderRow[]> {
    const rows = await this.getRows(SHEET_NAMES.ORDERS);
    return rows.map(parseOrderRow).filter((o) => o.sku === sku);
  }

  async getCompletedUnsettledOrders(consignorCode: string): Promise<{ orders: OrderRow[]; rowIndices: number[] }> {
    const rows = await this.getRows(SHEET_NAMES.ORDERS);
    const orders: OrderRow[] = [];
    const rowIndices: number[] = [];
    for (let i = 0; i < rows.length; i++) {
      const order = parseOrderRow(rows[i]);
      if (order.consignorCode === consignorCode && order.status === 'COMPLETED' && !order.settlementId) {
        orders.push(order);
        rowIndices.push(i);
      }
    }
    return { orders, rowIndices };
  }

  async getAllOrders(): Promise<OrderRow[]> {
    const rows = await this.getRows(SHEET_NAMES.ORDERS);
    return rows.map(parseOrderRow);
  }

  async getOrdersByDateRange(startDate: string, endDate: string): Promise<OrderRow[]> {
    const rows = await this.getRows(SHEET_NAMES.ORDERS);
    return rows.map(parseOrderRow).filter((o) => o.createdAt >= startDate && o.createdAt <= endDate);
  }

  async getOrdersByConsignor(consignorCode: string): Promise<OrderRow[]> {
    const rows = await this.getRows(SHEET_NAMES.ORDERS);
    return rows.map(parseOrderRow).filter((o) => o.consignorCode === consignorCode);
  }

  // ─── Refund ──────────────────────────────────────────────────────

  async processRefund(input: RefundInput): Promise<{ refundedOrder: OrderRow | null; adjustmentCreated: boolean }> {
    const lockKey = `refund:${input.sku}`;
    if (this.mutex) {
      const acquired = await this.mutex.acquire(lockKey, 10000);
      if (!acquired) throw new Error('RATE_LIMITED: Could not acquire lock for refund');
    }

    try {
      // Find the most recent completed sale for this SKU
      const orderRows = await this.getRows(SHEET_NAMES.ORDERS);
      let targetIdx = -1;
      let targetOrder: OrderRow | null = null;

      for (let i = orderRows.length - 1; i >= 0; i--) {
        const order = parseOrderRow(orderRows[i]);
        if (order.sku === input.sku && order.status === 'COMPLETED') {
          targetIdx = i;
          targetOrder = order;
          break;
        }
      }

      if (!targetOrder || targetIdx < 0) return { refundedOrder: null, adjustmentCreated: false };

      // Update order status to REFUNDED
      orderRows[targetIdx][ORDER_COLUMNS.Status] = 'REFUNDED';
      orderRows[targetIdx][ORDER_COLUMNS.Refunded_At] = new Date().toISOString();
      orderRows[targetIdx][ORDER_COLUMNS.Refund_Reason] = input.reason;
      orderRows[targetIdx][ORDER_COLUMNS.Version] = String(targetOrder.version + 1);
      await this.updateRow(SHEET_NAMES.ORDERS, targetIdx, orderRows[targetIdx]);

      // Restore product to AVAILABLE
      await this.updateProductStatus(input.sku, 'AVAILABLE', { soldAt: '' });

      // If sale was already settled, create refund adjustment
      let adjustmentCreated = false;
      if (targetOrder.settlementId) {
        const adjId = `ADJ-${nanoid(8)}`;
        const adjValues = [
          adjId,
          targetOrder.orderId,
          targetOrder.consignorCode,
          String(targetOrder.consignorAmount),
          'PENDING',
          '',
          `AUTO REFUND: ${input.reason}`,
          new Date().toISOString(),
        ];
        await this.appendRow(SHEET_NAMES.REFUND_ADJ, adjValues);
        adjustmentCreated = true;
      }

      return { refundedOrder: parseOrderRow(orderRows[targetIdx]), adjustmentCreated };
    } finally {
      if (this.mutex) await this.mutex.release(lockKey);
    }
  }

  // ─── Settlement ──────────────────────────────────────────────────

  async applySettlement(input: SettlementInput): Promise<SettlementRow | null> {
    const lockKey = `settle:${input.consignorCode}`;
    if (this.mutex) {
      const acquired = await this.mutex.acquire(lockKey, 30000);
      if (!acquired) throw new Error('RATE_LIMITED: Could not acquire lock for settlement');
    }

    try {
      // Get unsettled completed orders
      const { orders, rowIndices } = await this.getCompletedUnsettledOrders(input.consignorCode);
      if (orders.length === 0) return null;

      const grossSales = orders.reduce((sum, o) => sum + o.total, 0);
      const commissionTotal = orders.reduce((sum, o) => sum + o.commissionAmount, 0);

      // Get pending refund adjustments
      const adjRows = await this.getRows(SHEET_NAMES.REFUND_ADJ);
      const pendingAdjs: { row: RefundAdjRow; rowIndex: number }[] = [];
      for (let i = 0; i < adjRows.length; i++) {
        const adj = parseRefundAdjRow(adjRows[i]);
        if (adj.consignorCode === input.consignorCode && adj.status === 'PENDING') {
          pendingAdjs.push({ row: adj, rowIndex: i });
        }
      }

      const totalDeduction = pendingAdjs.reduce((sum, a) => sum + a.row.amount, 0);
      const consignorPayout = orders.reduce((sum, o) => sum + o.consignorAmount, 0);
      const appliedDeduction = Math.min(consignorPayout, totalDeduction);
      const netPayout = consignorPayout - appliedDeduction;
      const carryOver = totalDeduction - appliedDeduction;

      // Create settlement record
      const settlementId = `SET-${nanoid(8)}`;
      const settlement: Partial<SettlementRow> = {
        settlementId,
        consignorCode: input.consignorCode,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        grossSales,
        commissionTotal,
        refundDeductions: appliedDeduction,
        netPayout,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
      };
      await this.appendRow(SHEET_NAMES.SETTLEMENTS, settlementRowToSheetValues(settlement));

      // Mark orders as settled
      const allOrderRows = await this.getRows(SHEET_NAMES.ORDERS);
      for (const idx of rowIndices) {
        allOrderRows[idx][ORDER_COLUMNS.Settlement_ID] = settlementId;
        allOrderRows[idx][ORDER_COLUMNS.Version] = String((Number(allOrderRows[idx][ORDER_COLUMNS.Version]) || 1) + 1);
        await this.updateRow(SHEET_NAMES.ORDERS, idx, allOrderRows[idx]);
      }

      // Update refund adjustments
      const allAdjRows = await this.getRows(SHEET_NAMES.REFUND_ADJ);
      for (const { rowIndex } of pendingAdjs) {
        allAdjRows[rowIndex][REFUND_ADJ_COLUMNS.Status] = carryOver > 0 ? 'PENDING' : 'DEDUCTED';
        allAdjRows[rowIndex][REFUND_ADJ_COLUMNS.Settlement_ID] = settlementId;
        allAdjRows[rowIndex][REFUND_ADJ_COLUMNS.Note] =
          (allAdjRows[rowIndex][REFUND_ADJ_COLUMNS.Note] || '') + ' | settled';
        await this.updateRow(SHEET_NAMES.REFUND_ADJ, rowIndex, allAdjRows[rowIndex]);
      }

      return settlement as SettlementRow;
    } finally {
      if (this.mutex) await this.mutex.release(lockKey);
    }
  }

  // ─── Refund Adjustments ──────────────────────────────────────────

  async getPendingAdjustments(consignorCode: string): Promise<RefundAdjRow[]> {
    const rows = await this.getRows(SHEET_NAMES.REFUND_ADJ);
    return rows.map(parseRefundAdjRow).filter((a) => a.consignorCode === consignorCode && a.status === 'PENDING');
  }

  // ─── Settlements ─────────────────────────────────────────────────

  async getSettlementsByConsignor(consignorCode: string): Promise<SettlementRow[]> {
    const rows = await this.getRows(SHEET_NAMES.SETTLEMENTS);
    return rows
      .map(parseSettlementRow)
      .filter((s) => s.consignorCode === consignorCode)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 24);
  }

  // ─── Attendance ──────────────────────────────────────────────────

  async insertAttendance(
    staffId: string,
    videoFileId: string,
    lateMinutes: number,
    penalty: number,
  ): Promise<AttendanceRow> {
    const id = `ATT-${nanoid(8)}`;
    const now = new Date().toISOString();
    const values = [id, staffId, videoFileId, now, String(lateMinutes), String(penalty), now];
    await this.appendRow(SHEET_NAMES.ATTENDANCE, values);
    return { id, staffId, videoFileId, checkAt: now, lateMinutes, penalty, createdAt: now };
  }

  async getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceRow[]> {
    const rows = await this.getRows(SHEET_NAMES.ATTENDANCE);
    return rows.map(parseAttendanceRow).filter((a) => a.checkAt >= startDate && a.checkAt <= endDate);
  }

  // ─── Expenses ────────────────────────────────────────────────────

  async insertExpense(
    staffId: string,
    date: string,
    category: string,
    amount: number,
    note: string,
  ): Promise<ExpenseRow> {
    const id = `EXP-${nanoid(8)}`;
    const now = new Date().toISOString();
    const values = [id, staffId, date, category, String(amount), note, now];
    await this.appendRow(SHEET_NAMES.EXPENSES, values);
    return { id, staffId, date, category, amount, note, createdAt: now };
  }

  async getExpensesByMonth(yearMonth: string): Promise<ExpenseRow[]> {
    const rows = await this.getRows(SHEET_NAMES.EXPENSES);
    return rows.map(parseExpenseRow).filter((e) => e.date.startsWith(yearMonth));
  }

  // ─── Temp Batches ────────────────────────────────────────────────

  async insertTempBatch(staffId: string, defaultsJson: string): Promise<string> {
    const id = `BAT-${nanoid(8)}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours
    await this.appendRow(SHEET_NAMES.TEMP_BATCHES, [id, staffId, defaultsJson, 'ACTIVE', expiresAt, now]);
    return id;
  }

  async cleanupExpiredBatches(): Promise<number> {
    const rows = await this.getRows(SHEET_NAMES.TEMP_BATCHES);
    const now = new Date().toISOString();
    let cleaned = 0;

    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i][3] === 'ACTIVE' && rows[i][4] && rows[i][4] < now) {
        rows[i][3] = 'CANCELLED';
        await this.updateRow(SHEET_NAMES.TEMP_BATCHES, i, rows[i]);
        cleaned++;
      }
    }
    return cleaned;
  }

  // ─── Config ──────────────────────────────────────────────────────

  async getConfig(key: string): Promise<string | null> {
    const rows = await this.getRows(SHEET_NAMES.CONFIG);
    for (const row of rows) {
      if (row[0] === key) return row[1] ?? null;
    }
    return null;
  }

  async setConfig(key: string, value: string): Promise<void> {
    const rows = await this.getRows(SHEET_NAMES.CONFIG);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === key) {
        await this.updateCell(SHEET_NAMES.CONFIG, i, 1, value);
        return;
      }
    }
    await this.appendRow(SHEET_NAMES.CONFIG, [key, value]);
  }

  // ─── Financial Reports ───────────────────────────────────────────

  async getMonthlyBCTC(yearMonth: string): Promise<{
    revenueVnd: number;
    refundsVnd: number;
    commissionKeptVnd: number;
    consignorPayoutVnd: number;
    totalExpenseVnd: number;
    expenseBreakdown: Array<{ category: string; amount: number; note: string }>;
    netProfitVnd: number;
  }> {
    const batch = await this.batchGetRows([SHEET_NAMES.ORDERS, SHEET_NAMES.EXPENSES]);
    const orderRows = batch.get(SHEET_NAMES.ORDERS) ?? [];
    const expenseRows = batch.get(SHEET_NAMES.EXPENSES) ?? [];

    const orders = orderRows.map(parseOrderRow);
    const expenses = expenseRows.map(parseExpenseRow);

    // Filter by month — compare YYYY-MM prefix of createdAt
    const monthOrders = orders.filter(
      (o) => o.createdAt.substring(0, 7) === yearMonth.substring(0, 4) + '-' + yearMonth.substring(4, 6),
    );
    const monthExpenses = expenses.filter(
      (e) => e.date.substring(0, 7) === yearMonth.substring(0, 4) + '-' + yearMonth.substring(4, 6),
    );

    const revenueVnd = monthOrders.filter((o) => o.status === 'COMPLETED').reduce((sum, o) => sum + o.total, 0);
    const refundsVnd = monthOrders.filter((o) => o.status === 'REFUNDED').reduce((sum, o) => sum + o.total, 0) * -1;
    const commissionKeptVnd = monthOrders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.commissionAmount, 0);
    const consignorPayoutVnd = monthOrders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.consignorAmount, 0);
    const totalExpenseVnd = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expenseBreakdown = monthExpenses.map((e) => ({ category: e.category, amount: e.amount, note: e.note }));
    const netProfitVnd = commissionKeptVnd - totalExpenseVnd;

    return {
      revenueVnd,
      refundsVnd,
      commissionKeptVnd,
      consignorPayoutVnd,
      totalExpenseVnd,
      expenseBreakdown,
      netProfitVnd,
    };
  }

  async getDailySalesSummary(dateStr: string): Promise<{
    revenueVnd: number;
    refundsVnd: number;
    commissionKeptVnd: number;
    consignorPayoutVnd: number;
    orderCount: number;
  }> {
    const rows = await this.getRows(SHEET_NAMES.ORDERS);
    const orders = rows.map(parseOrderRow).filter((o) => o.createdAt.substring(0, 10) === dateStr);

    const revenueVnd = orders.filter((o) => o.status === 'COMPLETED').reduce((sum, o) => sum + o.total, 0);
    const refundsVnd = orders.filter((o) => o.status === 'REFUNDED').reduce((sum, o) => sum + o.total, 0) * -1;
    const commissionKeptVnd = orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.commissionAmount, 0);
    const consignorPayoutVnd = orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.consignorAmount, 0);

    return { revenueVnd, refundsVnd, commissionKeptVnd, consignorPayoutVnd, orderCount: orders.length };
  }

  // ─── Expiry Warning ──────────────────────────────────────────────

  async getExpiringProducts(
    daysAhead: number = 3,
  ): Promise<Array<{ sku: string; consignorName: string; expiryDate: string }>> {
    const batch = await this.batchGetRows([SHEET_NAMES.PRODUCTS, SHEET_NAMES.ARTISTS]);
    const products = (batch.get(SHEET_NAMES.PRODUCTS) ?? []).map(parseProductRow);
    const artists = (batch.get(SHEET_NAMES.ARTISTS) ?? []).map(parseArtistRow);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    const targetStr = targetDate.toISOString().substring(0, 10);

    const artistMap = new Map(artists.map((a) => [a.artistId, a.name]));

    return products
      .filter((p) => p.status === 'AVAILABLE' && p.createdAt) // Use createdAt as proxy for expiry if no expiry column
      .map((p) => ({
        sku: p.productId,
        consignorName: artistMap.get(p.consignorCode) ?? 'Unknown',
        expiryDate: targetStr,
      }));
  }

  // ─── Consignor Portal Queries ────────────────────────────────────

  async getConsignorItems(consignorCode: string): Promise<ProductRow[]> {
    const rows = await this.getRows(SHEET_NAMES.PRODUCTS);
    return rows
      .map(parseProductRow)
      .filter((p) => p.consignorCode === consignorCode)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 100);
  }

  async getConsignorSales(consignorCode: string): Promise<OrderRow[]> {
    const rows = await this.getRows(SHEET_NAMES.ORDERS);
    return rows
      .map(parseOrderRow)
      .filter((o) => o.consignorCode === consignorCode)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 100);
  }
}

// ─── Redis Mutex Implementation ────────────────────────────────────
export class RedisMutex implements MutexLock {
  constructor(
    private redis: {
      set: (key: string, value: string, mode: string, ttlMode: string, ttl: number) => Promise<string | null>;
      del: (key: string) => Promise<number>;
    },
  ) {}

  async acquire(key: string, ttlMs: number): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await this.redis.set(lockKey, '1', 'PX', 'NX' as never, ttlMs);
    return result === 'OK';
  }

  async release(key: string): Promise<void> {
    await this.redis.del(`lock:${key}`);
  }
}

// ─── Factory Function ──────────────────────────────────────────────
export function createSheetsAdapter(options?: { spreadsheetId?: string; mutex?: MutexLock }): GoogleSheetsAdapter {
  const spreadsheetId = options?.spreadsheetId ?? process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? '';
  if (!spreadsheetId) throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is required');
  return new GoogleSheetsAdapter(spreadsheetId, options?.mutex);
}
