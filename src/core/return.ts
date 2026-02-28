export type ReturnGuardResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export function validateReturnStatus(currentStatus: string): ReturnGuardResult {
  const status = currentStatus.toUpperCase();

  if (status === 'RETURNED') {
    return { ok: true, message: 'Món hàng đã ở trạng thái RETURNED trước đó.' };
  }

  if (status === 'SOLD') {
    return { ok: false, message: 'Không thể /return SKU đã bán. Dùng /refund nếu cần hoàn.' };
  }

  if (status !== 'AVAILABLE' && status !== 'RESERVED') {
    return { ok: false, message: `Không thể /return ở trạng thái ${status}.` };
  }

  return { ok: true, message: 'Có thể trả hàng cho nhà ký gửi.' };
}

export function buildReturnItemSQL(): string {
  return [
    'update public.inventory',
    "set status = 'RETURNED',",
    "    returned_at = coalesce(returned_at, timezone('utc', now())),",
    "    updated_at = timezone('utc', now())",
    'where shop_id = $1::uuid and sku = $2',
    "  and status in ('AVAILABLE','RESERVED','RETURNED')",
    'returning id, sku, status;'
  ].join(' ');
}
