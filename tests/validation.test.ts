import { describe, it, expect } from 'vitest';
import {
  InventoryCreateSchema,
  InventoryUpdateSchema,
  SaleCreateSchema,
  PaginationSchema,
  TelegramUpdateSchema,
  validateOrThrow,
  validateSafe,
} from '../src/core/validation.js';

describe('Zod Validation Schemas', () => {
  describe('InventoryCreateSchema', () => {
    it('accepts valid inventory input', () => {
      const input = {
        consignor_id: '550e8400-e29b-41d4-a716-446655440000',
        sku: 'RING-ABC123',
        category: 'RING',
        intake_price_vnd: 500000,
        sale_price_vnd: 700000,
        commission_rate: 15,
      };
      const result = InventoryCreateSchema.parse(input);
      expect(result.sku).toBe('RING-ABC123');
      expect(result.commission_rate).toBe(15);
    });

    it('defaults commission_rate to 20', () => {
      const input = {
        consignor_id: '550e8400-e29b-41d4-a716-446655440000',
        sku: 'RING-ABC123',
        category: 'RING',
        intake_price_vnd: 500000,
        sale_price_vnd: 700000,
      };
      const result = InventoryCreateSchema.parse(input);
      expect(result.commission_rate).toBe(20);
    });

    it('accepts string price values', () => {
      const input = {
        consignor_id: '550e8400-e29b-41d4-a716-446655440000',
        sku: 'RING-ABC123',
        category: 'RING',
        intake_price_vnd: '500k',
        sale_price_vnd: '700k',
      };
      const result = InventoryCreateSchema.parse(input);
      expect(result.intake_price_vnd).toBe('500k');
    });

    it('rejects empty consignor_id', () => {
      const input = {
        consignor_id: '',
        sku: 'RING-ABC123',
        category: 'RING',
        intake_price_vnd: 500000,
        sale_price_vnd: 700000,
      };
      expect(() => InventoryCreateSchema.parse(input)).toThrow();
    });

    it('rejects empty SKU', () => {
      const input = {
        consignor_id: '550e8400-e29b-41d4-a716-446655440000',
        sku: '',
        category: 'RING',
        intake_price_vnd: 500000,
        sale_price_vnd: 700000,
      };
      expect(() => InventoryCreateSchema.parse(input)).toThrow();
    });

    it('rejects commission_rate > 100', () => {
      const input = {
        consignor_id: '550e8400-e29b-41d4-a716-446655440000',
        sku: 'RING-ABC123',
        category: 'RING',
        intake_price_vnd: 500000,
        sale_price_vnd: 700000,
        commission_rate: 150,
      };
      expect(() => InventoryCreateSchema.parse(input)).toThrow();
    });
  });

  describe('InventoryUpdateSchema', () => {
    it('accepts partial update', () => {
      const result = InventoryUpdateSchema.parse({ category: 'NECKLACE' });
      expect(result.category).toBe('NECKLACE');
      expect(result.sale_price_vnd).toBeUndefined();
    });

    it('accepts empty object', () => {
      const result = InventoryUpdateSchema.parse({});
      expect(result).toEqual({});
    });
  });

  describe('SaleCreateSchema', () => {
    it('accepts valid sale input', () => {
      const result = SaleCreateSchema.parse({ sku: 'RING-ABC123' });
      expect(result.sku).toBe('RING-ABC123');
    });

    it('accepts optional sold_price_vnd', () => {
      const result = SaleCreateSchema.parse({ sku: 'RING-ABC123', sold_price_vnd: 800000 });
      expect(result.sold_price_vnd).toBe(800000);
    });
  });

  describe('PaginationSchema', () => {
    it('defaults limit to 50', () => {
      const result = PaginationSchema.parse({});
      expect(result.limit).toBe(50);
    });

    it('coerces string limit', () => {
      const result = PaginationSchema.parse({ limit: '25' });
      expect(result.limit).toBe(25);
    });

    it('clamps limit to 200', () => {
      expect(() => PaginationSchema.parse({ limit: '500' })).toThrow();
    });

    it('accepts cursor', () => {
      const result = PaginationSchema.parse({ cursor: 'abc123' });
      expect(result.cursor).toBe('abc123');
    });
  });

  describe('TelegramUpdateSchema', () => {
    it('accepts valid telegram update', () => {
      const update = {
        message: {
          text: '/sell RING-001',
          chat: { id: 12345 },
          from: { id: 67890, first_name: 'Test' },
        },
      };
      const result = TelegramUpdateSchema.parse(update);
      expect(result.message?.text).toBe('/sell RING-001');
    });

    it('accepts update with photo', () => {
      const update = {
        message: {
          chat: { id: 12345 },
          from: { id: 67890 },
          photo: [{ file_id: 'abc123' }],
        },
      };
      const result = TelegramUpdateSchema.parse(update);
      expect(result.message?.photo).toHaveLength(1);
    });

    it('accepts empty update', () => {
      const result = TelegramUpdateSchema.parse({});
      expect(result.message).toBeUndefined();
    });
  });

  describe('validateOrThrow', () => {
    it('returns parsed data on success', () => {
      const result = validateOrThrow(PaginationSchema, { limit: '10' });
      expect(result.limit).toBe(10);
    });

    it('throws on invalid data', () => {
      expect(() => validateOrThrow(PaginationSchema, { limit: 'abc' })).toThrow();
    });
  });

  describe('validateSafe', () => {
    it('returns success result', () => {
      const result = validateSafe(PaginationSchema, { limit: '10' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it('returns error result', () => {
      const result = validateSafe(PaginationSchema, { limit: 'abc' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
});
