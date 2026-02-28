export interface SetupCommandInput {
  secret: string;
  shopCode: string;
  shopName: string;
  ownerName: string;
  timezone: string;
  defaultCommissionRate: number;
}

export interface SetupState {
  step: 'VALIDATE_SECRET' | 'VALIDATE_INPUT' | 'READY_TO_CREATE';
  data?: SetupCommandInput;
}

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function parseSetupCommand(text: string): SetupCommandInput {
  const payload = text.trim().replace(/^\/setup\s+/i, '');
  const [secret, shopCodeRaw, ...rest] = payload.split(/\s+/);
  if (!secret || !shopCodeRaw || rest.length === 0) {
    throw new Error('Cú pháp: /setup <SETUP_SECRET> <SHOP_CODE> <shop_name>|<owner_name>|<timezone>|<default_commission_rate>');
  }

  const compact = rest.join(' ');
  const fields = compact.split('|').map((x) => x.trim());
  if (fields.length !== 4 || fields.some((x) => !x)) {
    throw new Error('Thiếu thông tin onboarding. Cần: shop_name|owner_name|timezone|default_commission_rate');
  }

  const [shopName, ownerName, timezone, commissionRaw] = fields;
  if (!isValidTimezone(timezone)) {
    throw new Error('Timezone không hợp lệ. Ví dụ: Asia/Ho_Chi_Minh');
  }

  const defaultCommissionRate = Number(commissionRaw.replace(',', '.'));
  if (!Number.isFinite(defaultCommissionRate) || defaultCommissionRate < 0 || defaultCommissionRate > 100) {
    throw new Error('Mức commission mặc định phải trong khoảng 0..100');
  }

  const shopCode = shopCodeRaw.toUpperCase();
  if (!/^[A-Z0-9_-]{3,20}$/.test(shopCode)) {
    throw new Error('SHOP_CODE chỉ gồm chữ hoa, số, _, -, độ dài 3..20');
  }

  return {
    secret,
    shopCode,
    shopName,
    ownerName,
    timezone,
    defaultCommissionRate
  };
}

export function advanceSetupState(text: string, expectedSecret: string): SetupState {
  const parsed = parseSetupCommand(text);
  if (parsed.secret !== expectedSecret) {
    return { step: 'VALIDATE_SECRET', data: parsed };
  }
  return { step: 'READY_TO_CREATE', data: parsed };
}

export function buildSetupTransactionSQL(): string {
  return [
    'begin;',
    "with ins_shop as (",
    "  insert into public.shops (code, name, timezone, default_commission_rate, late_rules, settings)",
    "  values ($1, $2, $3, $4::numeric, coalesce($5::jsonb, '{}'::jsonb), coalesce($6::jsonb, '{}'::jsonb))",
    '  returning id',
    '), ins_owner as (',
    "  insert into public.staff (shop_id, telegram_user_id, full_name, role, is_active)",
    "  select id, $7::bigint, $8, 'OWNER', true from ins_shop",
    '  returning id, shop_id',
    '), seed_sub as (',
    '  insert into public.subscriptions (shop_id, plan_code, status, period_start, period_end)',
    "  select shop_id, 'FREE', 'ACTIVE', (timezone('utc', now()))::date, ((timezone('utc', now()))::date + interval '30 day')::date",
    '  from ins_owner',
    '  returning id',
    ')',
    'select (select id from ins_shop) as shop_id, (select id from ins_owner) as owner_id, (select id from seed_sub) as subscription_id;',
    'commit;'
  ].join(' ');
}

export function ensureShopCodeAvailable(shopCode: string, existingCodes: string[]): void {
  const found = existingCodes.some((code) => code.toUpperCase() === shopCode.toUpperCase());
  if (found) {
    throw new Error('SHOP_CODE đã tồn tại, vui lòng chọn mã khác');
  }
}
