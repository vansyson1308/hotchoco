const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

function toVNParts(input: Date): Record<string, number> {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: VN_TIMEZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const parts = formatter.formatToParts(input);
  const result: Record<string, number> = {};
  for (const part of parts) {
    if (part.type === 'literal') continue;
    result[part.type] = Number(part.value);
  }
  return result;
}

export function getVNDateKey(input: Date): string {
  const p = toVNParts(input);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function getVNMinutesFromMidnight(input: Date): number {
  const p = toVNParts(input);
  return p.hour * 60 + p.minute;
}

export function isWithinAttendanceWindow(input: Date): boolean {
  const mins = getVNMinutesFromMidnight(input);
  const start = 6 * 60;
  const end = 12 * 60;
  return mins >= start && mins <= end;
}
