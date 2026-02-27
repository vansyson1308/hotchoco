import { sanitizeVND } from './sanitizeVND';
import { toCategoryCode } from './categoryMap';

export interface ParsedCaption {
  consignorCode: string;
  categoryCode: string;
  intakePriceVnd: number;
  salePriceVnd: number;
}

export interface LlmCaptionParser {
  parseCaptionToJson(caption: string): Promise<Partial<ParsedCaption> | null>;
}

function parseByRegex(caption: string): ParsedCaption {
  const compact = caption.trim();
  const parts = compact.split(/\s*[,\-]\s*/).map((x) => x.trim()).filter(Boolean);

  if (parts.length < 4) {
    throw new Error('Regex parser không đủ 4 trường');
  }

  const [consignorRaw, categoryRaw, intakeRaw, saleRaw] = parts;

  return {
    consignorCode: consignorRaw.toUpperCase(),
    categoryCode: toCategoryCode(categoryRaw),
    intakePriceVnd: sanitizeVND(intakeRaw),
    salePriceVnd: sanitizeVND(saleRaw)
  };
}

function assertCompleteParsed(input: Partial<ParsedCaption> | null): ParsedCaption {
  if (!input?.consignorCode || !input.categoryCode || input.intakePriceVnd === undefined || input.salePriceVnd === undefined) {
    throw new Error('LLM fallback không trả đủ 4 trường');
  }

  return {
    consignorCode: String(input.consignorCode).toUpperCase(),
    categoryCode: toCategoryCode(String(input.categoryCode)),
    intakePriceVnd: sanitizeVND(input.intakePriceVnd),
    salePriceVnd: sanitizeVND(input.salePriceVnd)
  };
}

export async function parseInventoryCaption(
  caption: string,
  llmParser?: LlmCaptionParser
): Promise<ParsedCaption> {
  if (!caption || !caption.trim()) {
    throw new Error('Caption không được để trống');
  }

  try {
    return parseByRegex(caption);
  } catch (regexError) {
    if (!llmParser) {
      throw new Error('Caption không hiểu, vui lòng nhập theo mẫu: <consignor>, <category>, <giá nhập>, <giá bán>');
    }

    const parsed = await llmParser.parseCaptionToJson(caption);
    return assertCompleteParsed(parsed);
  }
}
