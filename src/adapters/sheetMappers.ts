/**
 * Google Sheets column mappings and row ↔ TypeScript type converters.
 * Each sheet has a COLUMNS constant mapping field names → 0-based column indices.
 */

// ─── Admin_Staff Sheet ─────────────────────────────────────────────
export const STAFF_COLUMNS = {
  ID: 0,
  Name: 1,
  Role: 2,
  PIN: 3,
  Active: 4,
  Telegram_User_ID: 5,
} as const;

export interface StaffRow {
  id: string;
  name: string;
  role: 'OWNER' | 'MGR' | 'STAFF';
  pin: string;
  active: boolean;
  telegramUserId: string;
}

export function parseStaffRow(row: string[]): StaffRow {
  return {
    id: row[STAFF_COLUMNS.ID] ?? '',
    name: row[STAFF_COLUMNS.Name] ?? '',
    role: (row[STAFF_COLUMNS.Role] as StaffRow['role']) ?? 'STAFF',
    pin: row[STAFF_COLUMNS.PIN] ?? '',
    active: (row[STAFF_COLUMNS.Active] ?? 'TRUE').toUpperCase() === 'TRUE',
    telegramUserId: row[STAFF_COLUMNS.Telegram_User_ID] ?? '',
  };
}

// ─── Admin_Products Sheet ──────────────────────────────────────────
export const PRODUCT_COLUMNS = {
  Product_ID: 0,
  Name: 1,
  Brand: 2,
  Category: 3,
  Price: 4,
  Cost: 5,
  Quantity: 6,
  Image_URL: 7,
  Status: 8,
  // Hotchoco extended columns
  Consignor_Code: 9,
  Intake_Price: 10,
  Condition_Note: 11,
  Material: 12,
  Telegram_File_ID: 13,
  Received_By: 14,
  Sold_At: 15,
  Days_Consigned: 16,
  Commission_Rate: 17,
  Created_At: 18,
  Version: 19,
} as const;

export interface ProductRow {
  productId: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  imageUrl: string;
  status: string;
  consignorCode: string;
  intakePrice: number;
  conditionNote: string;
  material: string;
  telegramFileId: string;
  receivedBy: string;
  soldAt: string;
  daysConsigned: number;
  commissionRate: number;
  createdAt: string;
  version: number;
}

export function parseProductRow(row: string[]): ProductRow {
  return {
    productId: row[PRODUCT_COLUMNS.Product_ID] ?? '',
    name: row[PRODUCT_COLUMNS.Name] ?? '',
    brand: row[PRODUCT_COLUMNS.Brand] ?? '',
    category: row[PRODUCT_COLUMNS.Category] ?? '',
    price: Number(row[PRODUCT_COLUMNS.Price]) || 0,
    cost: Number(row[PRODUCT_COLUMNS.Cost]) || 0,
    quantity: Number(row[PRODUCT_COLUMNS.Quantity]) || 0,
    imageUrl: row[PRODUCT_COLUMNS.Image_URL] ?? '',
    status: row[PRODUCT_COLUMNS.Status] ?? 'AVAILABLE',
    consignorCode: row[PRODUCT_COLUMNS.Consignor_Code] ?? '',
    intakePrice: Number(row[PRODUCT_COLUMNS.Intake_Price]) || 0,
    conditionNote: row[PRODUCT_COLUMNS.Condition_Note] ?? '',
    material: row[PRODUCT_COLUMNS.Material] ?? '',
    telegramFileId: row[PRODUCT_COLUMNS.Telegram_File_ID] ?? '',
    receivedBy: row[PRODUCT_COLUMNS.Received_By] ?? '',
    soldAt: row[PRODUCT_COLUMNS.Sold_At] ?? '',
    daysConsigned: Number(row[PRODUCT_COLUMNS.Days_Consigned]) || 0,
    commissionRate: Number(row[PRODUCT_COLUMNS.Commission_Rate]) || 0,
    createdAt: row[PRODUCT_COLUMNS.Created_At] ?? '',
    version: Number(row[PRODUCT_COLUMNS.Version]) || 1,
  };
}

export function productRowToSheetValues(p: Partial<ProductRow>): string[] {
  return [
    p.productId ?? '',
    p.name ?? '',
    p.brand ?? '',
    p.category ?? '',
    String(p.price ?? 0),
    String(p.cost ?? 0),
    String(p.quantity ?? 0),
    p.imageUrl ?? '',
    p.status ?? 'AVAILABLE',
    p.consignorCode ?? '',
    String(p.intakePrice ?? 0),
    p.conditionNote ?? '',
    p.material ?? '',
    p.telegramFileId ?? '',
    p.receivedBy ?? '',
    p.soldAt ?? '',
    String(p.daysConsigned ?? 0),
    String(p.commissionRate ?? 0),
    p.createdAt ?? new Date().toISOString(),
    String(p.version ?? 1),
  ];
}

// ─── Admin_Artists (Consignors) Sheet ──────────────────────────────
export const ARTIST_COLUMNS = {
  Artist_ID: 0,
  Name: 1,
  Commission_Rate: 2,
  Active: 3,
  // Hotchoco extended columns
  Commission_Type: 4,
  Payout_Cycle_Days: 5,
  Sliding_Rules: 6,
} as const;

export interface ArtistRow {
  artistId: string;
  name: string;
  commissionRate: number;
  active: boolean;
  commissionType: 'FIXED' | 'SLIDING';
  payoutCycleDays: number;
  slidingRules: string;
}

export function parseArtistRow(row: string[]): ArtistRow {
  return {
    artistId: row[ARTIST_COLUMNS.Artist_ID] ?? '',
    name: row[ARTIST_COLUMNS.Name] ?? '',
    commissionRate: Number(row[ARTIST_COLUMNS.Commission_Rate]) || 0,
    active: (row[ARTIST_COLUMNS.Active] ?? 'TRUE').toUpperCase() === 'TRUE',
    commissionType: (row[ARTIST_COLUMNS.Commission_Type] as 'FIXED' | 'SLIDING') ?? 'FIXED',
    payoutCycleDays: Number(row[ARTIST_COLUMNS.Payout_Cycle_Days]) || 30,
    slidingRules: row[ARTIST_COLUMNS.Sliding_Rules] ?? '[]',
  };
}

// ─── Orders Sheet ──────────────────────────────────────────────────
export const ORDER_COLUMNS = {
  Order_ID: 0,
  Customer_Name: 1,
  Customer_Phone: 2,
  Total: 3,
  Status: 4,
  Payment_Status: 5,
  Payment_Method: 6,
  Created_At: 7,
  Staff_ID: 8,
  Notes: 9,
  // Hotchoco extended columns
  SKU: 10,
  Product_ID: 11,
  Commission_Amount: 12,
  Consignor_Amount: 13,
  Consignor_Code: 14,
  Settlement_ID: 15,
  Refunded_At: 16,
  Refund_Reason: 17,
  Idempotency_Key: 18,
  Version: 19,
} as const;

export interface OrderRow {
  orderId: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  staffId: string;
  notes: string;
  sku: string;
  productId: string;
  commissionAmount: number;
  consignorAmount: number;
  consignorCode: string;
  settlementId: string;
  refundedAt: string;
  refundReason: string;
  idempotencyKey: string;
  version: number;
}

export function parseOrderRow(row: string[]): OrderRow {
  return {
    orderId: row[ORDER_COLUMNS.Order_ID] ?? '',
    customerName: row[ORDER_COLUMNS.Customer_Name] ?? '',
    customerPhone: row[ORDER_COLUMNS.Customer_Phone] ?? '',
    total: Number(row[ORDER_COLUMNS.Total]) || 0,
    status: row[ORDER_COLUMNS.Status] ?? 'ACTIVE',
    paymentStatus: row[ORDER_COLUMNS.Payment_Status] ?? '',
    paymentMethod: row[ORDER_COLUMNS.Payment_Method] ?? '',
    createdAt: row[ORDER_COLUMNS.Created_At] ?? '',
    staffId: row[ORDER_COLUMNS.Staff_ID] ?? '',
    notes: row[ORDER_COLUMNS.Notes] ?? '',
    sku: row[ORDER_COLUMNS.SKU] ?? '',
    productId: row[ORDER_COLUMNS.Product_ID] ?? '',
    commissionAmount: Number(row[ORDER_COLUMNS.Commission_Amount]) || 0,
    consignorAmount: Number(row[ORDER_COLUMNS.Consignor_Amount]) || 0,
    consignorCode: row[ORDER_COLUMNS.Consignor_Code] ?? '',
    settlementId: row[ORDER_COLUMNS.Settlement_ID] ?? '',
    refundedAt: row[ORDER_COLUMNS.Refunded_At] ?? '',
    refundReason: row[ORDER_COLUMNS.Refund_Reason] ?? '',
    idempotencyKey: row[ORDER_COLUMNS.Idempotency_Key] ?? '',
    version: Number(row[ORDER_COLUMNS.Version]) || 1,
  };
}

export function orderRowToSheetValues(o: Partial<OrderRow>): string[] {
  return [
    o.orderId ?? '',
    o.customerName ?? '',
    o.customerPhone ?? '',
    String(o.total ?? 0),
    o.status ?? 'ACTIVE',
    o.paymentStatus ?? '',
    o.paymentMethod ?? '',
    o.createdAt ?? new Date().toISOString(),
    o.staffId ?? '',
    o.notes ?? '',
    o.sku ?? '',
    o.productId ?? '',
    String(o.commissionAmount ?? 0),
    String(o.consignorAmount ?? 0),
    o.consignorCode ?? '',
    o.settlementId ?? '',
    o.refundedAt ?? '',
    o.refundReason ?? '',
    o.idempotencyKey ?? '',
    String(o.version ?? 1),
  ];
}

// ─── HC_Settlements Sheet ──────────────────────────────────────────
export const SETTLEMENT_COLUMNS = {
  Settlement_ID: 0,
  Consignor_Code: 1,
  Period_Start: 2,
  Period_End: 3,
  Gross_Sales: 4,
  Commission_Total: 5,
  Refund_Deductions: 6,
  Net_Payout: 7,
  Status: 8,
  Created_At: 9,
} as const;

export interface SettlementRow {
  settlementId: string;
  consignorCode: string;
  periodStart: string;
  periodEnd: string;
  grossSales: number;
  commissionTotal: number;
  refundDeductions: number;
  netPayout: number;
  status: string;
  createdAt: string;
}

export function parseSettlementRow(row: string[]): SettlementRow {
  return {
    settlementId: row[SETTLEMENT_COLUMNS.Settlement_ID] ?? '',
    consignorCode: row[SETTLEMENT_COLUMNS.Consignor_Code] ?? '',
    periodStart: row[SETTLEMENT_COLUMNS.Period_Start] ?? '',
    periodEnd: row[SETTLEMENT_COLUMNS.Period_End] ?? '',
    grossSales: Number(row[SETTLEMENT_COLUMNS.Gross_Sales]) || 0,
    commissionTotal: Number(row[SETTLEMENT_COLUMNS.Commission_Total]) || 0,
    refundDeductions: Number(row[SETTLEMENT_COLUMNS.Refund_Deductions]) || 0,
    netPayout: Number(row[SETTLEMENT_COLUMNS.Net_Payout]) || 0,
    status: row[SETTLEMENT_COLUMNS.Status] ?? '',
    createdAt: row[SETTLEMENT_COLUMNS.Created_At] ?? '',
  };
}

export function settlementRowToSheetValues(s: Partial<SettlementRow>): string[] {
  return [
    s.settlementId ?? '',
    s.consignorCode ?? '',
    s.periodStart ?? '',
    s.periodEnd ?? '',
    String(s.grossSales ?? 0),
    String(s.commissionTotal ?? 0),
    String(s.refundDeductions ?? 0),
    String(s.netPayout ?? 0),
    s.status ?? 'COMPLETED',
    s.createdAt ?? new Date().toISOString(),
  ];
}

// ─── HC_Refund_Adj Sheet ───────────────────────────────────────────
export const REFUND_ADJ_COLUMNS = {
  ID: 0,
  Order_ID: 1,
  Consignor_Code: 2,
  Amount: 3,
  Status: 4,
  Settlement_ID: 5,
  Note: 6,
  Created_At: 7,
} as const;

export interface RefundAdjRow {
  id: string;
  orderId: string;
  consignorCode: string;
  amount: number;
  status: string;
  settlementId: string;
  note: string;
  createdAt: string;
}

export function parseRefundAdjRow(row: string[]): RefundAdjRow {
  return {
    id: row[REFUND_ADJ_COLUMNS.ID] ?? '',
    orderId: row[REFUND_ADJ_COLUMNS.Order_ID] ?? '',
    consignorCode: row[REFUND_ADJ_COLUMNS.Consignor_Code] ?? '',
    amount: Number(row[REFUND_ADJ_COLUMNS.Amount]) || 0,
    status: row[REFUND_ADJ_COLUMNS.Status] ?? 'PENDING',
    settlementId: row[REFUND_ADJ_COLUMNS.Settlement_ID] ?? '',
    note: row[REFUND_ADJ_COLUMNS.Note] ?? '',
    createdAt: row[REFUND_ADJ_COLUMNS.Created_At] ?? '',
  };
}

// ─── HC_Attendance Sheet ───────────────────────────────────────────
export const ATTENDANCE_COLUMNS = {
  ID: 0,
  Staff_ID: 1,
  Video_File_ID: 2,
  Check_At: 3,
  Late_Minutes: 4,
  Penalty: 5,
  Created_At: 6,
} as const;

export interface AttendanceRow {
  id: string;
  staffId: string;
  videoFileId: string;
  checkAt: string;
  lateMinutes: number;
  penalty: number;
  createdAt: string;
}

export function parseAttendanceRow(row: string[]): AttendanceRow {
  return {
    id: row[ATTENDANCE_COLUMNS.ID] ?? '',
    staffId: row[ATTENDANCE_COLUMNS.Staff_ID] ?? '',
    videoFileId: row[ATTENDANCE_COLUMNS.Video_File_ID] ?? '',
    checkAt: row[ATTENDANCE_COLUMNS.Check_At] ?? '',
    lateMinutes: Number(row[ATTENDANCE_COLUMNS.Late_Minutes]) || 0,
    penalty: Number(row[ATTENDANCE_COLUMNS.Penalty]) || 0,
    createdAt: row[ATTENDANCE_COLUMNS.Created_At] ?? '',
  };
}

// ─── HC_Expenses Sheet ─────────────────────────────────────────────
export const EXPENSE_COLUMNS = {
  ID: 0,
  Staff_ID: 1,
  Date: 2,
  Category: 3,
  Amount: 4,
  Note: 5,
  Created_At: 6,
} as const;

export interface ExpenseRow {
  id: string;
  staffId: string;
  date: string;
  category: string;
  amount: number;
  note: string;
  createdAt: string;
}

export function parseExpenseRow(row: string[]): ExpenseRow {
  return {
    id: row[EXPENSE_COLUMNS.ID] ?? '',
    staffId: row[EXPENSE_COLUMNS.Staff_ID] ?? '',
    date: row[EXPENSE_COLUMNS.Date] ?? '',
    category: row[EXPENSE_COLUMNS.Category] ?? '',
    amount: Number(row[EXPENSE_COLUMNS.Amount]) || 0,
    note: row[EXPENSE_COLUMNS.Note] ?? '',
    createdAt: row[EXPENSE_COLUMNS.Created_At] ?? '',
  };
}

// ─── HC_Temp_Batches Sheet ─────────────────────────────────────────
export const TEMP_BATCH_COLUMNS = {
  ID: 0,
  Staff_ID: 1,
  Defaults_JSON: 2,
  Status: 3,
  Expires_At: 4,
  Created_At: 5,
} as const;

// ─── HC_Config Sheet ───────────────────────────────────────────────
export const CONFIG_COLUMNS = {
  Key: 0,
  Value: 1,
} as const;

// ─── Sheet Names ───────────────────────────────────────────────────
export const SHEET_NAMES = {
  STAFF: 'Admin_Staff',
  PRODUCTS: 'Admin_Products',
  ARTISTS: 'Admin_Artists',
  ORDERS: 'Orders',
  ORDER_ITEMS: 'Order_Items',
  PAYMENTS: 'Payments',
  STOCK_LOG: 'Admin_Stock_Log',
  SETTLEMENTS: 'HC_Settlements',
  REFUND_ADJ: 'HC_Refund_Adj',
  ATTENDANCE: 'HC_Attendance',
  EXPENSES: 'HC_Expenses',
  TEMP_BATCHES: 'HC_Temp_Batches',
  CONFIG: 'HC_Config',
} as const;
