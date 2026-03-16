import { z } from 'zod/v4';

// ─── Telegram Update Schema ───────────────────────────────
export const TelegramUserSchema = z.object({
  id: z.union([z.number(), z.string()]),
  first_name: z.string().optional(),
});

export const TelegramChatSchema = z.object({
  id: z.union([z.number(), z.string()]),
});

export const TelegramPhotoSchema = z.object({
  file_id: z.string().min(1),
});

export const TelegramVideoNoteSchema = z.object({
  file_id: z.string().min(1),
});

export const TelegramMessageSchema = z.object({
  text: z.string().optional(),
  chat: TelegramChatSchema.optional(),
  from: TelegramUserSchema.optional(),
  photo: z.array(TelegramPhotoSchema).optional(),
  video_note: TelegramVideoNoteSchema.optional(),
});

export const TelegramUpdateSchema = z.object({
  message: TelegramMessageSchema.optional(),
});

// ─── POS API Schemas ──────────────────────────────────────
export const InventoryCreateSchema = z.object({
  consignor_id: z.string().uuid(),
  sku: z.string().min(1).max(50),
  category: z.string().min(1).max(30),
  intake_price_vnd: z.union([z.number().int().nonnegative(), z.string().min(1)]),
  sale_price_vnd: z.union([z.number().int().nonnegative(), z.string().min(1)]),
  commission_rate: z.number().min(0).max(100).optional().default(20),
});

export const InventoryUpdateSchema = z.object({
  category: z.string().min(1).max(30).optional(),
  sale_price_vnd: z.union([z.number().int().nonnegative(), z.string().min(1)]).optional(),
});

export const SaleCreateSchema = z.object({
  sku: z.string().min(1).max(50),
  sold_price_vnd: z.union([z.number().int().nonnegative(), z.string().min(1)]).optional(),
});

export const SkuParamSchema = z.object({
  sku: z.string().min(1).max(50),
});

// ─── Query Schemas ────────────────────────────────────────
export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

// ─── Helper ───────────────────────────────────────────────
export function validateOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

export function validateSafe<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: z.prettifyError(result.error) };
}
