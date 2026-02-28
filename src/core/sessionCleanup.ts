export interface SessionCleanupQueryInput {
  staleAfterHours?: number;
}

export function buildSessionCleanupQuery(input: SessionCleanupQueryInput = {}): string {
  const staleAfter = input.staleAfterHours ?? 2;
  return [
    'update public.temp_batches',
    "set status = 'CANCELLED', updated_at = timezone('utc', now())",
    "where status = 'ACTIVE'",
    `and updated_at < timezone('utc', now()) - interval '${staleAfter} hours'`,
    'returning id, shop_id, staff_id;'
  ].join(' ');
}
