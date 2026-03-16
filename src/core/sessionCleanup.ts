export interface SessionCleanupQueryInput {
  staleAfterHours?: number;
}

export function buildSessionCleanupQuery(input: SessionCleanupQueryInput = {}): { sql: string; params: number[] } {
  const staleAfter = Math.max(1, Math.min(72, Math.round(input.staleAfterHours ?? 2)));
  return {
    sql: [
      'update public.temp_batches',
      "set status = 'CANCELLED', updated_at = timezone('utc', now())",
      "where status = 'ACTIVE'",
      "and updated_at < timezone('utc', now()) - make_interval(hours => $1)",
      'returning id, shop_id, staff_id;',
    ].join(' '),
    params: [staleAfter],
  };
}
