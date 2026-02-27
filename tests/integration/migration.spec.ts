import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('migration bootstrap coverage', () => {
  const sql001 = readFileSync('supabase/migrations/001_init.sql', 'utf-8');
  const sql002 = readFileSync('supabase/migrations/002_attendance_bg.sql', 'utf-8');
  const sql003 = readFileSync('supabase/migrations/003_inventory_photo_status.sql', 'utf-8');
  const sql004 = readFileSync('supabase/migrations/004_sales_bulk.sql', 'utf-8');
  const sql005 = readFileSync('supabase/migrations/005_refund_settlement.sql', 'utf-8');
  const sql006 = readFileSync('supabase/migrations/006_expense_bctc_bg03.sql', 'utf-8');
  const sql007 = readFileSync('supabase/migrations/007_settlement_return_expiry.sql', 'utf-8');
  const sql008 = readFileSync('supabase/migrations/008_fx_export_consignor.sql', 'utf-8');
  const sql009 = readFileSync('supabase/migrations/009_rls_hardening.sql', 'utf-8');
  const sql010 = readFileSync('supabase/migrations/010_multi_tenant_onboarding_billing.sql', 'utf-8');
  const sql011 = readFileSync('supabase/migrations/011_analytics.sql', 'utf-8');
  const sql012 = readFileSync('supabase/migrations/012_platform_expansion.sql', 'utf-8');

  it('contains required tables for PRD core scope', () => {
    expect(sql001).toContain('create table if not exists public.inventory');
    expect(sql001).toContain('create table if not exists public.sales');
    expect(sql001).toContain('create table if not exists public.refund_adjustments');
    expect(sql001).toContain('create table if not exists public.error_logs');
  });

  it('contains attendance dedupe and clock-out enhancements', () => {
    expect(sql002).toContain('clock_out_time');
    expect(sql002).toContain('create unique index if not exists uq_staff_attendance_staff_date');
  });

  it('contains inventory photo status compatibility fields', () => {
    expect(sql003).toContain('add column if not exists photo_status');
    expect(sql003).toContain('add column if not exists storage_url');
  });

  it('contains sales + bulk support fields', () => {
    expect(sql004).toContain('commission_type');
    expect(sql004).toContain('payment_method');
    expect(sql004).toContain('create table if not exists public.temp_batch_items');
  });

  it('contains refund + settlement indexes and carry-over field', () => {
    expect(sql005).toContain('idx_sales_refund_lookup');
    expect(sql005).toContain('idx_refund_adjustments_pending_settlement');
    expect(sql005).toContain('add column if not exists carry_over_vnd');
  });

  it('contains expense index and recorded_by compatibility', () => {
    expect(sql006).toContain('add column if not exists recorded_by');
    expect(sql006).toContain('idx_expenses_shop_date');
  });

  it('contains return/expiry compatibility fields and index', () => {
    expect(sql007).toContain("add value if not exists 'RESERVED'");
    expect(sql007).toContain('add column if not exists expiry_date');
    expect(sql007).toContain('add column if not exists returned_at');
    expect(sql007).toContain('idx_inventory_expiry_status');
  });

  it('contains fx/export/consignor compatibility fields', () => {
    expect(sql008).toContain('add column if not exists exchange_rates');
    expect(sql008).toContain('add column if not exists default_commission_rate');
    expect(sql008).toContain('currency_default');
  });

  it('contains RLS hardening with with-check policies', () => {
    expect(sql009).toContain('current_shop_id');
    expect(sql009).toContain('with check (shop_id = public.current_shop_id())');
    expect(sql009).toContain('shop_isolation_error_logs');
  });

  it('contains sprint 9 onboarding + billing tables', () => {
    expect(sql010).toContain('create table if not exists public.plans');
    expect(sql010).toContain('create table if not exists public.subscriptions');
    expect(sql010).toContain('create table if not exists public.usage_counters_daily');
    expect(sql010).toContain("current_setting('app.current_shop_id'");
  });

  it('contains sprint 10 analytics tables and indexes', () => {
    expect(sql011).toContain('create table if not exists public.analytics_snapshots');
    expect(sql011).toContain('idx_sales_created_at');
    expect(sql011).toContain('shop_isolation_analytics_snapshots');
  });

  it('contains sprint 11 platform expansion tables', () => {
    expect(sql012).toContain('create table if not exists public.api_keys');
    expect(sql012).toContain('create table if not exists public.consignor_users');
    expect(sql012).toContain('shop_isolation_api_keys');
    expect(sql012).toContain('shop_isolation_consignor_users');
  });
});
