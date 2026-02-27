import { sanitizeVND } from './sanitizeVND';

export type ExpenseCategory = 'RENT' | 'SALARY' | 'SHIPPING' | 'UTILITIES' | 'OTHER';

export interface ParsedExpenseCommand {
  category: ExpenseCategory;
  amountVnd: number;
  note: string | null;
}

const CATEGORY_MAP: Record<string, ExpenseCategory> = {
  rent: 'RENT',
  thue: 'RENT',
  salary: 'SALARY',
  luong: 'SALARY',
  shipping: 'SHIPPING',
  vc: 'SHIPPING',
  utilities: 'UTILITIES',
  diennuoc: 'UTILITIES',
  other: 'OTHER',
  khac: 'OTHER'
};

function normalizeCategory(raw: string): ExpenseCategory {
  const key = raw.trim().toLowerCase();
  const mapped = CATEGORY_MAP[key];
  if (!mapped) {
    throw new Error('Danh mục chi phí không hợp lệ. Dùng: RENT | SALARY | SHIPPING | UTILITIES | OTHER');
  }
  return mapped;
}

export function parseExpenseCommand(text: string): ParsedExpenseCommand {
  const parts = text.trim().split(/\s+/);
  if (parts.length < 3 || parts[0].toLowerCase() !== '/expense') {
    throw new Error('Cú pháp đúng: /expense <category> <amount> [note...]');
  }

  const category = normalizeCategory(parts[1]);
  const amountVnd = sanitizeVND(parts[2]);
  const note = parts.slice(3).join(' ').trim() || null;

  return { category, amountVnd, note };
}
