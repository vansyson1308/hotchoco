const CATEGORY_MAP: Record<string, string> = {
  ring: 'RING',
  nhan: 'RING',
  'nhẫn': 'RING',
  necklace: 'NECKLACE',
  'day chuyen': 'NECKLACE',
  'dây chuyền': 'NECKLACE',
  bracelet: 'BRACELET',
  'vong tay': 'BRACELET',
  'vòng tay': 'BRACELET',
  earring: 'EARRING',
  'bong tai': 'EARRING',
  'bông tai': 'EARRING',
  brooch: 'BROOCH',
  'ghim cai ao': 'BROOCH',
  other: 'OTHER',
  khac: 'OTHER',
  khác: 'OTHER'
};

const CATEGORY_PREFIX: Record<string, string> = {
  RING: 'RI',
  NECKLACE: 'NE',
  BRACELET: 'BR',
  EARRING: 'EA',
  BROOCH: 'BO',
  OTHER: 'OT'
};

export function toCategoryCode(raw: string): string {
  const key = raw.trim().toLowerCase();
  const code = CATEGORY_MAP[key];

  if (!code) {
    throw new Error(`Danh mục không được hỗ trợ: ${raw}`);
  }

  return code;
}

export function toCategoryPrefix(categoryCode: string): string {
  const prefix = CATEGORY_PREFIX[categoryCode.trim().toUpperCase()];
  if (!prefix) {
    throw new Error(`Không tìm thấy prefix cho category: ${categoryCode}`);
  }
  return prefix;
}
