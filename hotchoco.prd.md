
PRODUCT REQUIREMENTS DOCUMENT
HOT CHOCO
_______________________________________________
Virtual Accounting & Consignment Management Assistant
Telegram Bot for Vietnamese SME Fashion & Jewelry Retail
Field	Details
Document Version	1.1.0
Date	27/02/2026
Previous Version	1.0.0 (25/02/2026)
Author	Product Strategy Team
Status	APPROVED FOR DEVELOPMENT
Confidentiality	Internal Use Only
Target Audience	Development Team, QA, DevOps

⚡ CHANGELOG v1.0.0 → v1.1.0 — 5 CRITICAL DIRECTIVES
D1: Supabase from Day 1 — Google Sheets completely removed. NanoID-based SKU generation.
D2: NLP Parsing for intake — 6-step Q&A replaced by single-caption parsing + bulk upload.
D3: Async photo processing — telegram_file_id stored instantly, Supabase upload in background.
D4: Refund/Void flow — /refund command with carry-over deduction. Currency input sanitization.
D5: Anti-fraud attendance — Video Note required (no gallery selfies). Hourly session cleanup cron.
 
Table of Contents
Table of Contents	2
1. Executive Summary	5
1.1 Product Vision	5
1.2 Problem Statement	5
1.3 Target Users	5
1.4 Tech Stack Decision (v1.1 — Supabase-First)	5
2. System Architecture	7
2.1 Architecture Overview	7
2.2 Message Flow Diagram	7
2.3 Background Job Architecture	7
2.4 NLP Intake Flow (Directive 2)	8
2.4.1 Currency Input Sanitizer (Directive 4)	9
2.4.2 NLP Parser Specification	9
2.4.3 Bulk Upload Flow	10
3. Database Schema (Supabase PostgreSQL)	11
3.1 staff	11
3.2 consignors	11
3.3 inventory	12
3.4 sales	13
3.5 refund_adjustments (NEW — Directive 4)	14
3.6 staff_attendance	15
3.7 temp_batches	15
3.8 expenses	16
3.9 settlements	16
3.10 shops (Multi-tenant)	17
3.11 error_logs	18
3.12 Database Migrations & RLS Setup	18
4. Feature Specifications	19
4.1 Authentication & Authorization	19
4.1.1 Auth Flow	19
4.1.2 Permission Matrix	19
4.2 Attendance via Video Note (Directive 5)	19
4.2.1 Trigger Conditions	20
4.2.2 Late Penalty Rules (Configurable via shops.late_rules)	20
4.2.3 Acceptance Criteria	20
4.3 Consignment Inventory Intake (NLP-Powered — Directive 2)	20
4.3.1 Single-Item Intake Flow	20
4.3.2 Bulk Upload Flow	21
4.3.3 Inline Keyboard Payloads	21
4.3.4 Acceptance Criteria	22
4.4 Sales Recording	22
4.4.1 Commission Calculation Engine	22
4.5 Refund / Void Sales (NEW — Directive 4)	23
4.5.1 Refund Flow	23
4.5.2 Refund Transaction Logic	23
4.5.3 Settlement with Carry-Over Deductions	24
4.5.4 Acceptance Criteria	24
4.6 Sales & Financial Reporting	24
4.6.1 /sales — Daily Revenue	24
4.6.2 /bctc — Monthly Financial Report (Owner only)	25
5. Error Handling & Resilience	26
6. Development Phases & Sprint Plan (v1.1)	27
6.1 PHASE 1: Foundation + Core Features (Sprint 1-4)	27
Sprint 1: Infrastructure + Auth (Week 1)	27
Sprint 2: Attendance (Video Note) + Background Jobs (Week 2)	27
Sprint 3: NLP Inventory Intake (Week 3)	28
Sprint 4: Sales + Bulk Upload + Reports (Week 4)	28
6.2 PHASE 2: Feature Completion + Financial Ops (Sprint 5-8)	29
Sprint 5: Refund System + Financial Reports (Week 5)	29
Sprint 6: Settlement System (Week 6)	29
Sprint 7: Exchange Rate + Data Export (Week 7)	30
Sprint 8: QA + Hardening (Week 8)	30
6.3 PHASE 3: Scale + Advanced Features (Sprint 9-12)	30
Sprint 9: Multi-Tenant + Onboarding (Week 9)	30
Sprint 10: AI Analytics (Week 10)	31
Sprint 11: Platform Expansion (Week 11)	31
Sprint 12: Production Hardening (Week 12)	31
7. Timeline Summary	33
8. Testing Strategy	34
8.1 Master Acceptance Criteria Checklist	34
9. Deployment & Infrastructure	36
9.1 Server Requirements	36
9.2 Environment Variables	36
9.3 Deployment Checklist	37
10. Risk Register	38
11. Vietnamese Business Terms Glossary	39
12. Appendices	40
12.1 Bot Command Reference	40
12.2 Supabase Table Overview	40

 
1. Executive Summary
1.1 Product Vision
Hot Choco is a virtual accounting and consignment management assistant that runs entirely inside Telegram. It is purpose-built for Vietnamese SME fashion and jewelry retail stores operating under the consignment model — where they receive goods from multiple suppliers (local brands, individuals), sell them, and split commissions.
The product replaces the current workflow of Excel spreadsheets + paper notebooks + Zalo group chats with a single, unified chat interface that any employee can use without training.
1.2 Problem Statement
⚠️ CORE PROBLEM
No POS software in Vietnam (KiotViet, Sapo, Nhanh.vn) supports consignment natively.
Consignment shops must track: item ownership per supplier, sliding commission rates, consignment period expiry, multi-party settlement.
48.8% of Vietnamese SMEs have tried digital tools but abandoned them due to complexity (MPI/USAID 2023).
Current workaround: Excel + manual notebooks + Zalo groups = data loss, errors, no real-time visibility.
1.3 Target Users
Role	Description	Primary Actions
Owner (Mai)	Shop owner/manager. Full access to all data and settings.	View reports, manage consignors, approve inventory, configure commissions, run settlements, process refunds
Staff	Sales employees (2-4 per shop). Limited access.	Clock in/out via video note, record sales, receive consignment items via photo+caption, query daily revenue
Consignor	External suppliers who deposit items for sale. No direct system access (Phase 3).	Receive periodic settlement reports via Telegram (future)
1.4 Tech Stack Decision (v1.1 — Supabase-First)
⚡ DIRECTIVE 1: Google Sheets completely removed from architecture
All data lives in Supabase (PostgreSQL) from Sprint 1.
No migration path needed — we start with production-grade infrastructure.
Row-Level Security (RLS) enforces multi-tenant data isolation from Day 1.
Supabase Storage replaces Google Drive for all file storage.
Layer	Technology	Rationale
UI / Frontend	Telegram Bot API	Zero-install, chat-based UX, inline keyboards, photo/video note support. Zalo expansion in Phase 3.
Logic / Backend	n8n (self-hosted, queue mode)	Visual workflow builder, 400+ integrations, webhook-native. Queue mode from Day 1 for async jobs.
Database	Supabase (PostgreSQL 15+)	ACID transactions, row-level security, realtime subscriptions, free tier (500MB). No race conditions.
File Storage	Supabase Storage + CDN	S3-compatible, integrated auth, auto CDN. Free tier 1GB.
AI / NLP	LLM API (Claude/GPT via n8n HTTP node) OR Regex parser	Parses single-caption inventory intake. Fallback to regex if LLM unavailable.
Background Jobs	n8n sub-workflows (async trigger)	Photo upload, session cleanup, daily reports run asynchronously without blocking user.
Hosting	VPS (Hetzner/Contabo) + Docker Compose	$5-10/mo. n8n + Redis (for queue mode) + optional Supabase self-host later.
 
2. System Architecture
2.1 Architecture Overview
The system follows a single-entry-point architecture. ALL Telegram messages flow through ONE webhook endpoint into ONE master n8n workflow. A Router node dispatches to appropriate handlers. Background jobs (photo upload, cleanup cron) run as separate n8n sub-workflows triggered asynchronously.
✅ CRITICAL ARCHITECTURE RULES
1. ONLY ONE Telegram Trigger per bot. Never create multiple workflows listening to the same bot.
2. ALL data in Supabase PostgreSQL. No Google Sheets. No n8n staticData. No RAM state.
3. Photo processing is ASYNC: store telegram_file_id instantly, upload to Supabase Storage in background.
4. Attendance requires VIDEO NOTE (round video), NOT photo. Rejects gallery photos.
5. Every workflow branch has try/catch. Users always get Vietnamese error messages.
2.2 Message Flow Diagram
MASTER WORKFLOW — MESSAGE ROUTING
[Telegram User] → [Telegram API] → [n8n Webhook (SINGLE endpoint)]
    │
    ├─ [Auth Guard] → Query staff table by telegram_user_id → BLOCK if unauthorized
    │
    ├─ [Router Node] → Branch by message type + content:
    │    ├─ VIDEO NOTE (round video) → [Attendance Flow]
    │    ├─ PHOTO with active receive session → [NLP Intake Flow]
    │    ├─ PHOTO without session + has caption → [Quick Intake: auto /receive + parse]
    │    ├─ /receive command → [Start Receive Session]
    │    ├─ /done command → [End Receive Session + Commit Batch]
    │    ├─ /sell {SKU} → [Sales Recording Flow]
    │    ├─ /refund {sale_id|SKU} → [Refund/Void Flow] (D4)
    │    ├─ /sales, /status → [Sales Report Flow]
    │    ├─ /ks → [Consignor Report Flow]
    │    ├─ /bctc → [Financial Report Flow] (Owner only)
    │    ├─ /settle → [Settlement Flow] (Owner only)
    │    ├─ Callback query → [Inline Keyboard Handler]
    │    └─ Other text → [Default Handler / Help]
    │
    └─ [Error Handler (try/catch)] → Log to error_logs table + notify admin + friendly user message
2.3 Background Job Architecture
ASYNC SUB-WORKFLOWS (D3 + D5)
BG-01: Photo Upload Worker
  Trigger: Called by main workflow after storing telegram_file_id
  Action: Download photo from Telegram API → Upload to Supabase Storage → Update inventory.storage_url
  Retry: 3 attempts with exponential backoff. On final failure, mark photo_status = FAILED.

BG-02: Session Cleanup Cron (runs every 1 hour)
  Trigger: n8n Schedule Trigger, every 60 minutes
  Action: SELECT from temp_batches WHERE status = 'ACTIVE' AND updated_at < NOW() - INTERVAL '2 hours'
  Result: Mark as CANCELLED, notify staff via Telegram: "Phiên nhập hàng đã hết hạn."

BG-03: Daily Report Scheduler (runs at 21:00 VN time)
  Trigger: n8n Schedule Trigger, daily at 21:00 Asia/Ho_Chi_Minh
  Action: Generate daily summary → Send to owner via Telegram

BG-04: Consignment Expiry Check (runs daily at 08:00)
  Trigger: n8n Schedule Trigger, daily at 08:00
  Action: Find items expiring in 3 days → Alert owner
2.4 NLP Intake Flow (Directive 2)
The 6-step Q&A flow is replaced by single-caption NLP parsing. This reduces intake time from ~2 minutes/item to ~15 seconds/item.
NLP INTAKE FLOW — SINGLE CAPTION PARSING
STEP 1: Staff sends photo(s) with caption. Examples of valid captions:
  "Nhẫn, Trang, 350k, 5 cái"
  "Dây chuyền bạc - Minh Thu - 1.2tr - 1"
  "Vòng tay, shop ABC, 450000, 3"

STEP 2: NLP Parser extracts entities (LLM or Regex):
  category: "Đây chuyền" → NECKLACE
  consignor: "Minh Thu"
  price: "1.2tr" → 1200000 (D4: currency sanitizer)
  quantity: 1

STEP 3: Bot sends SINGLE confirmation message:
  "✅ Đã nhận: Dây chuyền bạc | KG: Minh Thu | Giá: 1,200,000đ | SL: 1 | SKU: NC-2502-A7X9"
  [Inline Keyboard: [✅ Xác nhận] [✏ Sửa] [❌ Hủy]]

STEP 4: On confirm → Insert to inventory table. Trigger BG-01 (photo upload).
         On edit → Show field selection keyboard. Staff corrects ONE field.
         On cancel → Discard temp record.

FALLBACK: If caption is missing or unparseable:
  Bot asks: "Vui lòng gửi kèm caption (VD: Nhẫn, Trang, 350k, 5)"
2.4.1 Currency Input Sanitizer (Directive 4)
ALL monetary inputs must pass through the sanitizer before database insertion:
Raw Input	Parsed Value (integer VND)	Rule Applied
350k	350000	Multiply by 1000 when suffix k/K
350K	350000	Case-insensitive k
1.2tr	1200000	Multiply by 1000000 when suffix tr/TR/triệu
350.000	350000	Remove dots as thousand separators
350,000	350000	Remove commas as thousand separators
350 000	350000	Remove spaces as thousand separators
350000	350000	Already integer
1,2tr	1200000	Comma as decimal + triệu suffix
abc	ERROR	Non-numeric → ask user to re-enter
SANITIZER PSEUDOCODE
function sanitizeVND(raw: string): number | null {
  let s = raw.trim().toLowerCase();
  let multiplier = 1;
  if (s.endsWith('tr') || s.endsWith('triệu')) { multiplier = 1_000_000; s = s.replace(/tr(iệu)?$/i, ''); }
  else if (s.endsWith('k')) { multiplier = 1_000; s = s.replace(/k$/i, ''); }
  s = s.replace(/[\s.,]/g, (match, offset, str) => {
    // Keep last separator if it's a decimal, remove rest as thousand seps
    return '';  // Simplified: remove all separators after extracting multiplier
  });
  const num = parseFloat(s);
  if (isNaN(num)) return null;
  return Math.round(num * multiplier);
}
2.4.2 NLP Parser Specification
Parser Type	When to Use	Implementation
Regex Parser (Primary)	Default for structured captions like "Cat, Name, Price, Qty"	Split by comma/dash. Match category against Vietnamese keyword map. Apply sanitizeVND to price field.
LLM Parser (Fallback)	When regex fails to extract all 4 fields	Send caption to Claude/GPT with structured output prompt. Parse JSON response. Cost: ~$0.001/call.
Category keyword map for regex parser:
Vietnamese Keywords	Mapped Category	SKU Prefix
nhẫn, nhan, ring	RING	RC
dây chuyền, day chuyen, necklace, dc	NECKLACE	NC
vòng tay, vong tay, bracelet, vt	BRACELET	BR
hoa tai, bông tai, earring, ht, bt	EARRING	ER
trâm cài, tram cai, brooch	BROOCH	BO
khác, other, khac	OTHER	OT
2.4.3 Bulk Upload Flow
For receiving large batches (e.g., 50 items from one Thai supplier), staff can send multiple photos in one Telegram media group:
Step	Action	Details
1	Staff sends /receive with batch context	"/receive Trang, Nhẫn, 350k" → Sets session defaults: consignor=Trang, category=RING, price=350K
2	Staff sends album of photos (media group)	Telegram sends these as separate messages with same media_group_id
3	Bot groups by media_group_id	Waits 2 seconds after last photo in group to collect all. Each photo gets session defaults.
4	Bot confirms entire batch	"✅ Đã nhận 15 ảnh | Nhẫn | KG: Trang | 350,000đ/cái" [✅ Xác nhận tất cả] [❌ Hủy]
5	On confirm: batch insert	All 15 items inserted with unique NanoID SKUs. BG-01 queued for each photo.
6	Individual override	Any photo can have its own caption to override defaults. VD: Photo 3 caption "DC, 500k" → this one = Necklace, 500K
 
3. Database Schema (Supabase PostgreSQL)
⚡ DIRECTIVE 1: All tables in Supabase PostgreSQL from Sprint 1
Every table uses proper PostgreSQL types, constraints, indexes, and foreign keys.
Row-Level Security (RLS) enabled on ALL tables: WHERE shop_id = auth.jwt()->>'shop_id'
UUIDs for primary keys (uuid_generate_v4()). NanoID for human-readable SKUs.
ACID transactions protect against race conditions. No data loss on concurrent writes.
All timestamps in UTC. Application layer converts to Asia/Ho_Chi_Minh for display.
3.1 staff
Column	Type	Constraints	Description
id	UUID	PK, DEFAULT uuid_generate_v4()	Primary key
shop_id	UUID	FK → shops.id, NOT NULL	Multi-tenant isolation
telegram_user_id	BIGINT	UNIQUE, NOT NULL	Telegram user ID for auth
full_name	TEXT	NOT NULL	Employee full name
role	TEXT	NOT NULL, CHECK IN ('OWNER','MANAGER','STAFF')	Access level
phone	TEXT		Contact phone
hourly_rate	INTEGER	DEFAULT 0	VND per hour
status	TEXT	NOT NULL, DEFAULT 'ACTIVE', CHECK IN ('ACTIVE','INACTIVE')	Employment status
created_at	TIMESTAMPTZ	NOT NULL, DEFAULT NOW()	
updated_at	TIMESTAMPTZ	NOT NULL, DEFAULT NOW()	Auto-updated via trigger
3.2 consignors
Column	Type	Constraints	Description
id	UUID	PK, DEFAULT uuid_generate_v4()	Primary key
shop_id	UUID	FK → shops.id, NOT NULL	Multi-tenant
name	TEXT	NOT NULL	Business or personal name
contact_phone	TEXT		Phone number
contact_telegram	BIGINT		For future notifications
commission_type	TEXT	NOT NULL, CHECK IN ('FIXED','SLIDING')	Commission model
commission_rate_fixed	NUMERIC(4,3)	CHECK >= 0 AND <= 1	Fixed rate (e.g., 0.300)
commission_sliding_rules	JSONB		[{"days":5,"rate":0.30},{"days":11,"rate":0.40}]
currency_default	TEXT	DEFAULT 'VND'	VND or THB for Thai imports
bank_account	TEXT		For settlement transfers
status	TEXT	NOT NULL, DEFAULT 'ACTIVE'	
created_at	TIMESTAMPTZ	DEFAULT NOW()	
3.3 inventory
⚡ DIRECTIVE 1: SKU uses NanoID + PostgreSQL SEQUENCE
Format: {CAT_PREFIX}-{YYMM}-{NANOID_4CHARS}  e.g., RC-2502-A7X9
NanoID alphabet: 0123456789ABCDEFGHJKLMNPQRSTUVWXYZ (no I, O to avoid confusion)
Generated in application layer (n8n Code node) using nanoid(4) with custom alphabet.
Uniqueness guaranteed by UNIQUE constraint on sku column. On rare collision: regenerate.
No sequential patterns → cannot guess next SKU → better security.
Column	Type	Constraints	Description
id	UUID	PK, DEFAULT uuid_generate_v4()	Internal ID
shop_id	UUID	FK → shops.id, NOT NULL	Multi-tenant
sku	TEXT	UNIQUE, NOT NULL	Human-readable code: RC-2502-A7X9
consignor_id	UUID	FK → consignors.id, NOT NULL	Item owner
category	TEXT	NOT NULL, CHECK IN ('RING','NECKLACE','BRACELET','EARRING','BROOCH','OTHER')	Product type
description	TEXT		Free-text item description
price_vnd	BIGINT	NOT NULL, CHECK > 0	Selling price in VND (sanitized integer)
cost_vnd	BIGINT		Cost/wholesale price
currency_original	TEXT	DEFAULT 'VND'	Original currency if imported
price_original	NUMERIC(12,2)		Original price in foreign currency
exchange_rate	NUMERIC(10,4)		Exchange rate used
shipping_allocated	BIGINT	DEFAULT 0	Allocated shipping cost VND
telegram_file_id	TEXT		D3: Stored instantly for fast display
storage_url	TEXT		D3: Supabase Storage URL (filled by BG-01)
photo_status	TEXT	DEFAULT 'PENDING', CHECK IN ('PENDING','UPLOADED','FAILED')	D3: Background upload status
status	TEXT	NOT NULL, DEFAULT 'AVAILABLE', CHECK IN ('AVAILABLE','RESERVED','SOLD','RETURNED','EXPIRED','REFUNDED')	Inventory status
consigned_at	TIMESTAMPTZ	NOT NULL, DEFAULT NOW()	When item was received
expiry_date	DATE		Consignment expiry
sold_at	TIMESTAMPTZ		When sold
received_by	UUID	FK → staff.id	Staff who received
sold_by	UUID	FK → staff.id	Staff who sold
batch_id	UUID	FK → temp_batches.id	Batch reference
created_at	TIMESTAMPTZ	DEFAULT NOW()	
Indexes:
Index	Columns	Purpose
idx_inventory_shop_status	shop_id, status	Fast lookup of available items per shop
idx_inventory_consignor	consignor_id, status	Consignor settlement queries
idx_inventory_sku	sku	SKU lookup (already UNIQUE)
idx_inventory_expiry	expiry_date WHERE status = 'AVAILABLE'	Expiry check cron
3.4 sales
Column	Type	Constraints	Description
id	UUID	PK, DEFAULT uuid_generate_v4()	Primary key
shop_id	UUID	FK, NOT NULL	Multi-tenant
sku	TEXT	FK → inventory.sku, NOT NULL	Sold item
inventory_id	UUID	FK → inventory.id, NOT NULL	Direct reference
consignor_id	UUID	FK, NOT NULL	Denormalized for fast queries
sold_by	UUID	FK → staff.id, NOT NULL	Who sold
sale_price	BIGINT	NOT NULL	Actual selling price
discount_amount	BIGINT	DEFAULT 0	Discount applied
payment_method	TEXT	NOT NULL, CHECK IN ('CASH','TRANSFER','MOMO','ZALOPAY','CARD')	
commission_rate	NUMERIC(4,3)	NOT NULL	Rate at time of sale
commission_amount	BIGINT	NOT NULL	Shop commission VND
consignor_payout	BIGINT	NOT NULL	Owed to consignor
days_consigned	INTEGER	NOT NULL	For sliding rate audit
status	TEXT	DEFAULT 'COMPLETED', CHECK IN ('COMPLETED','REFUNDED','VOID')	D4: Sale status
refunded_at	TIMESTAMPTZ		D4: When refund processed
refund_reason	TEXT		D4: Refund reason
settled	BOOLEAN	DEFAULT FALSE	Has consignor been paid?
settlement_id	UUID	FK → settlements.id	Settlement reference
sale_date	TIMESTAMPTZ	NOT NULL, DEFAULT NOW()	
3.5 refund_adjustments (NEW — Directive 4)
Tracks carry-over deductions when a refund is processed AFTER the sale was already settled.
Column	Type	Constraints	Description
id	UUID	PK, DEFAULT uuid_generate_v4()	
shop_id	UUID	FK, NOT NULL	
sale_id	UUID	FK → sales.id, NOT NULL	The refunded sale
consignor_id	UUID	FK → consignors.id, NOT NULL	Whose payout is adjusted
original_settlement_id	UUID	FK → settlements.id	The settlement that already paid this sale
commission_clawback	BIGINT	NOT NULL	Shop commission to return (negative revenue)
payout_clawback	BIGINT	NOT NULL	Consignor payout already paid (to deduct next cycle)
status	TEXT	DEFAULT 'PENDING', CHECK IN ('PENDING','APPLIED','WRITTEN_OFF')	APPLIED = deducted in next settlement
applied_settlement_id	UUID	FK → settlements.id	The future settlement that absorbs this
created_at	TIMESTAMPTZ	DEFAULT NOW()	
3.6 staff_attendance
⚡ DIRECTIVE 5: Video Note required, not photo
Telegram Video Note = round video, max 60 seconds, recorded live from camera.
Cannot be sent from gallery → prevents selfie fraud (sending old photos).
We store telegram_file_id of the video note. Background job uploads to Supabase Storage.
Column	Type	Constraints	Description
id	UUID	PK, DEFAULT uuid_generate_v4()	
shop_id	UUID	FK, NOT NULL	
staff_id	UUID	FK → staff.id, NOT NULL	
date	DATE	NOT NULL	Attendance date
clock_in_time	TIMESTAMPTZ	NOT NULL	Actual clock-in
clock_out_time	TIMESTAMPTZ		Null = still working
video_note_file_id	TEXT	NOT NULL	D5: Telegram video note file_id
video_storage_url	TEXT		Supabase Storage URL (BG job)
late_minutes	INTEGER	NOT NULL, DEFAULT 0	Minutes late
penalty_vnd	BIGINT	NOT NULL, DEFAULT 0	Late penalty
penalty_rule	TEXT		ON_TIME / LATE_MINOR / LATE_MAJOR / LATE_CRITICAL
notes	TEXT		Staff notes
UNIQUE		(staff_id, date)	Prevents duplicate clock-in
3.7 temp_batches
⚡ DIRECTIVE 5: Hourly cleanup cron cancels stale sessions
BG-02 runs every 60 minutes: UPDATE temp_batches SET status='CANCELLED' WHERE status='ACTIVE' AND updated_at < NOW() - INTERVAL '2 hours'
Staff is notified via Telegram when their session is auto-cancelled.
Column	Type	Constraints	Description
id	UUID	PK, DEFAULT uuid_generate_v4()	
shop_id	UUID	FK, NOT NULL	
staff_id	UUID	FK → staff.id, NOT NULL	
telegram_chat_id	BIGINT	NOT NULL	For bot responses
status	TEXT	NOT NULL, DEFAULT 'ACTIVE', CHECK IN ('ACTIVE','COMPLETED','CANCELLED')	
default_consignor	TEXT		Bulk upload default
default_category	TEXT		Bulk upload default
default_price	BIGINT		Bulk upload default
items_json	JSONB	DEFAULT '[]'::jsonb	Array of pending items
item_count	INTEGER	DEFAULT 0	Running count
started_at	TIMESTAMPTZ	DEFAULT NOW()	
updated_at	TIMESTAMPTZ	DEFAULT NOW()	Auto-updated trigger
3.8 expenses
Column	Type	Constraints	Description
id	UUID	PK	
shop_id	UUID	FK, NOT NULL	
date	DATE	NOT NULL	
category	TEXT	NOT NULL, CHECK IN ('RENT','UTILITIES','SALARY','SHIPPING','SUPPLIES','TAX','OTHER')	
description	TEXT	NOT NULL	
amount_vnd	BIGINT	NOT NULL, CHECK > 0	Sanitized integer
recorded_by	UUID	FK → staff.id	
receipt_file_id	TEXT		Telegram file_id of receipt photo
receipt_storage_url	TEXT		Supabase Storage URL
created_at	TIMESTAMPTZ	DEFAULT NOW()	
3.9 settlements
Column	Type	Constraints	Description
id	UUID	PK	
shop_id	UUID	FK, NOT NULL	
consignor_id	UUID	FK, NOT NULL	
period_start	DATE	NOT NULL	
period_end	DATE	NOT NULL	
total_sales	BIGINT	NOT NULL	
total_commission	BIGINT	NOT NULL	
total_payout	BIGINT	NOT NULL	Gross payout before deductions
refund_deductions	BIGINT	DEFAULT 0	D4: Carry-over from refund_adjustments
net_payout	BIGINT	NOT NULL	total_payout - refund_deductions
items_sold_count	INTEGER	NOT NULL	
items_returned_count	INTEGER	DEFAULT 0	
status	TEXT	DEFAULT 'PENDING', CHECK IN ('PENDING','PAID','DISPUTED')	
paid_date	TIMESTAMPTZ		
payment_reference	TEXT		Bank transfer ref
created_at	TIMESTAMPTZ	DEFAULT NOW()	
3.10 shops (Multi-tenant)
Column	Type	Constraints	Description
id	UUID	PK	
name	TEXT	NOT NULL	Shop display name
owner_telegram_id	BIGINT	NOT NULL	Owner Telegram ID
timezone	TEXT	DEFAULT 'Asia/Ho_Chi_Minh'	
late_rules	JSONB	DEFAULT '[{"after_minutes":5,"penalty":30000},{"after_minutes":30,"penalty":100000},{"after_minutes":60,"penalty":200000}]'	Configurable penalty tiers
default_commission_rate	NUMERIC(4,3)	DEFAULT 0.300	Default for new consignors
consignment_period_days	INTEGER	DEFAULT 30	Default expiry period
exchange_rates	JSONB	DEFAULT '{"THB":650}'	Manual exchange rates
created_at	TIMESTAMPTZ	DEFAULT NOW()	
3.11 error_logs
Column	Type	Constraints	Description
id	UUID	PK	
shop_id	UUID		Null if auth failed
telegram_user_id	BIGINT		
error_type	TEXT	NOT NULL	AUTH_FAILED, API_ERROR, PARSE_ERROR, etc.
error_message	TEXT	NOT NULL	Full error details
context	JSONB		Request payload, workflow state
created_at	TIMESTAMPTZ	DEFAULT NOW()	
3.12 Database Migrations & RLS Setup
SUPABASE SETUP SQL (Sprint 1, Day 1)
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security on ALL tables
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
-- ... (all tables)

-- RLS Policy: Users can only access their shop's data
CREATE POLICY shop_isolation ON inventory
  USING (shop_id = current_setting('app.current_shop_id')::uuid);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ... (all tables with updated_at)
 
4. Feature Specifications
Each feature: User Story, Trigger, Flow, Acceptance Criteria, Edge Cases.
4.1 Authentication & Authorization
USER STORY
As an owner, I want only authorized staff to use the bot, so that sensitive business data is protected.
4.1.1 Auth Flow
Step	Action	Details
1	Message received	Extract telegram_user_id from update object
2	DB query	SELECT id, shop_id, role, full_name, status FROM staff WHERE telegram_user_id = $1 AND status = 'ACTIVE'
3a	FOUND	Attach staff context (id, shop_id, role, name) to message. SET app.current_shop_id for RLS.
3b	NOT FOUND	Send: "🚫 Bạn không có quyền sử dụng bot này." Log to error_logs. STOP.
4	Permission check	Validate staff.role against command permission matrix
4.1.2 Permission Matrix
Command	OWNER	MANAGER	STAFF
/receive, /done (inventory)	✅	✅	✅
Video Note (attendance)	✅	✅	✅
/sell (record sale)	✅	✅	✅
/sales (daily revenue)	✅	✅	✅
/refund (D4: void sale)	✅	✅	❌
/ks (consignor report)	✅	✅	❌
/bctc (financial report)	✅	❌	❌
/settle (run settlement)	✅	❌	❌
/expense (record expense)	✅	✅	❌
/addstaff, /removestaff	✅	❌	❌
/settings, /setrate	✅	❌	❌
/export (export data)	✅	✅	❌
4.2 Attendance via Video Note (Directive 5)
⚡ ANTI-FRAUD: Video Note replaces Selfie Photo
Telegram Video Note (round video message) CANNOT be sent from gallery.
It must be recorded live from the camera, preventing photo fraud.
Trigger: message.video_note exists (NOT message.photo).
Regular photos are NO LONGER valid for attendance.
4.2.1 Trigger Conditions
Condition	Check
Message type	message.video_note exists (round video, NOT regular video or photo)
No active receive session	temp_batches has no ACTIVE session for this staff_id
Not already clocked in today	No staff_attendance record for staff_id + today's date
Within valid window	Between 06:00 and 12:00 Asia/Ho_Chi_Minh
4.2.2 Late Penalty Rules (Configurable via shops.late_rules)
Time Window	Penalty	Rule Name	Extra Action
Before 09:05	0 VND	ON_TIME	None
09:05 – 09:29	30,000 VND	LATE_MINOR	None
09:30 – 10:00	100,000 VND	LATE_MAJOR	None
After 10:00	200,000 VND	LATE_CRITICAL	Auto-notify owner via Telegram
4.2.3 Acceptance Criteria
ID	Criterion
ATT-01	ONLY video_note messages trigger attendance. Regular photos do NOT.
ATT-02	Video note file_id stored instantly. BG job uploads to Supabase Storage.
ATT-03	Penalty calculated correctly for all 4 time tiers
ATT-04	Record written to staff_attendance with UNIQUE(staff_id, date) constraint
ATT-05	Bot responds: name, time, penalty, encouraging message
ATT-06	Duplicate attempt returns: "Đã chấm công hôm nay rồi!"
ATT-07	Clock-out via /out updates clock_out_time
ATT-08	LATE_CRITICAL auto-sends notification to shop owner
4.3 Consignment Inventory Intake (NLP-Powered — Directive 2)
USER STORY
As a staff member, I want to receive consignment items by sending a photo with a short caption,
so that items are cataloged in seconds without answering multiple bot questions.
4.3.1 Single-Item Intake Flow
Step	User Action	Bot Response	Backend
1	Send photo + caption: "Nhẫn, Trang, 350k, 5"	(processing...)	Parse caption: category=RING, consignor=Trang, price=350000, qty=5
2	(auto)	"✅ Nhẫn | KG: Trang | 350,000đ x5 | SKU: RC-2502-A7X9 → RC-2502-B3K1" [✅][✏][❌]	Generate 5 NanoID SKUs. Store telegram_file_id. Create pending records.
3a	Tap ✅	"Đã lưu 5 món vào kho!"	INSERT 5 rows to inventory. Queue BG-01 for photo upload.
3b	Tap ✏	"Sửa gì? [Loại] [Người KG] [Giá] [SL]"	Show field selection keyboard
3c	Tap ❌	"Hủy nhập món này."	Discard pending records
4.3.2 Bulk Upload Flow
Step	User	Bot	Backend
1	/receive Trang, Nhẫn, 350k	"📦 Session started. Defaults: Nhẫn | Trang | 350k. Send photos!"	Create temp_batch with defaults
2	Send album of 15 photos	(collecting...)	Group by media_group_id. Wait 2s after last.
3	(auto)	"Đã nhận 15 ảnh | Nhẫn | Trang | 350k/cái" [✅ Tất cả][❌ Hủy]	15 pending records with session defaults
4	✅ Confirm	"✅ Batch hoàn tất! 15 món. SKU: RC-2502-A7X9 → RC-2502-P8M2"	Batch INSERT. Queue 15 BG-01 jobs.
5	/done	"Session đóng. Tổng: 15 món | 5,250,000đ"	Mark temp_batch COMPLETED.
4.3.3 Inline Keyboard Payloads
CONFIRMATION KEYBOARD
{"inline_keyboard": [[
  {"text": "✅ Xác nhận", "callback_data": "inv_ok_RC2502A7X9"},
  {"text": "✏ Sửa", "callback_data": "inv_ed_RC2502A7X9"},
  {"text": "❌ Hủy", "callback_data": "inv_no_RC2502A7X9"}
]]}

EDIT FIELD KEYBOARD (shown after tapping ✏):
{"inline_keyboard": [[
  {"text": "📦 Loại", "callback_data": "edf_cat_RC2502A7X9"},
  {"text": "👤 KG", "callback_data": "edf_con_RC2502A7X9"},
  {"text": "💰 Giá", "callback_data": "edf_prc_RC2502A7X9"},
  {"text": "🔢 SL", "callback_data": "edf_qty_RC2502A7X9"}
]]}

CATEGORY SELECTION (when editing category):
{"inline_keyboard": [
  [{"text":"💍 Nhẫn","callback_data":"cat_RING"},{"text":"📿 DC","callback_data":"cat_NECKLACE"}],
  [{"text":"💫 VT","callback_data":"cat_BRACELET"},{"text":"✨ HT","callback_data":"cat_EARRING"}],
  [{"text":"🌟 Trâm","callback_data":"cat_BROOCH"},{"text":"📦 Khác","callback_data":"cat_OTHER"}]
]}

CRITICAL: callback_data ≤ 64 bytes. answerCallbackQuery within 10 seconds.
4.3.4 Acceptance Criteria
ID	Criterion
INV-01	Photo + valid caption (4 fields) → parsed + confirmation in ≤3 seconds
INV-02	Currency sanitizer correctly parses all formats: 350k, 1.2tr, 350.000, 350000
INV-03	SKU generated as NanoID: {CAT}-{YYMM}-{4CHARS}, UNIQUE constraint enforced
INV-04	telegram_file_id stored INSTANTLY. storage_url filled by BG-01 asynchronously
INV-05	Inline confirmation keyboard renders: [✅][✏][❌]
INV-06	✏ Edit flow allows correcting any single field without re-entering everything
INV-07	Bulk upload: /receive with defaults → album of photos → batch confirm
INV-08	media_group_id grouping waits 2s after last photo before processing
INV-09	Missing/unparseable caption → bot asks for caption with example format
INV-10	Consignor fuzzy matching: existing name matched at 70%+ similarity auto-suggested
INV-11	Thai import: if consignor.currency_default=THB, price parsed as THB → VND conversion
INV-12	Session survives n8n restart (state in Supabase, not RAM)
4.4 Sales Recording
Step	User	Bot	Backend
1	/sell RC-2502-A7X9	"Nhẫn | Trang | 350,000đ | Tồn 3 ngày" [✅ Bán][❌]	SELECT from inventory WHERE sku AND status='AVAILABLE'
2	✅ Bán	"Thanh toán? [Tiền mặt][CK][MoMo][ZaloPay]"	Wait for payment selection
3	Tap CASH	"✅ Bán! Hoa hồng: 105,000đ (30%). Trả KG: 245,000đ"	BEGIN TX: INSERT sale + UPDATE inventory.status='SOLD' COMMIT
4.4.1 Commission Calculation Engine
COMMISSION PSEUDOCODE (unchanged from v1.0)
function calcCommission(sale_price, consigned_at, sold_at, consignor) {
  const days = daysBetween(consigned_at, sold_at);
  let rate;
  if (consignor.commission_type === 'FIXED') {
    rate = consignor.commission_rate_fixed;
  } else {
    const rules = consignor.commission_sliding_rules;
    rate = rules[rules.length - 1].rate;
    for (const rule of rules) { if (days <= rule.days) { rate = rule.rate; break; } }
  }
  return { rate, commission: Math.round(sale_price * rate), payout: sale_price - Math.round(sale_price * rate), days };
}
4.5 Refund / Void Sales (NEW — Directive 4)
USER STORY
As an owner/manager, I want to process refunds when a customer returns an item,
so that inventory is restored, daily revenue is corrected, and consignor settlements are accurately adjusted.
4.5.1 Refund Flow
Step	User	Bot	Backend
1	/refund RC-2502-A7X9	"Tìm thấy: Đơn #sale_xxx | 350,000đ | 25/02 | Lý do?"	Lookup sale by SKU, status=COMPLETED
2	"Khách đổi ý"	"⚠ Xác nhận hoàn trả? Sale đã quyết toán: CÓ" [✅ Hoàn trả][❌]	Check if sale.settled = TRUE
3	✅	"✅ Đã hoàn trả! Hàng về kho. Khấu trừ KG: 245,000đ kỳ sau."	See transaction logic below
4.5.2 Refund Transaction Logic
REFUND TRANSACTION (PostgreSQL)
BEGIN;

-- 1. Mark sale as refunded
UPDATE sales SET status = 'REFUNDED', refunded_at = NOW(), refund_reason = $reason WHERE id = $sale_id;

-- 2. Restore inventory
UPDATE inventory SET status = 'AVAILABLE', sold_at = NULL, sold_by = NULL WHERE sku = $sku;

-- 3. Handle settlement adjustment
IF sale.settled = TRUE THEN
  -- Sale was already paid to consignor. Create carry-over deduction.
  INSERT INTO refund_adjustments (shop_id, sale_id, consignor_id, original_settlement_id,
    commission_clawback, payout_clawback, status)
  VALUES ($shop_id, $sale_id, $consignor_id, sale.settlement_id,
    sale.commission_amount, sale.consignor_payout, 'PENDING');
END IF;

-- If sale.settled = FALSE: simply removing it from next settlement is sufficient.
-- The settlement query will skip REFUNDED sales.

COMMIT;
4.5.3 Settlement with Carry-Over Deductions
When generating a new settlement, the system must account for pending refund_adjustments:
SETTLEMENT CALCULATION WITH DEDUCTIONS
-- Calculate gross payout from current period sales
gross_payout = SUM(consignor_payout) FROM sales WHERE consignor_id = $cid AND settled = FALSE AND status = 'COMPLETED';

-- Get pending refund deductions
deductions = SUM(payout_clawback) FROM refund_adjustments WHERE consignor_id = $cid AND status = 'PENDING';

-- Net payout
net_payout = gross_payout - deductions;

-- If net_payout < 0: carry remaining deduction to next period
-- Mark applied deductions as 'APPLIED' with new settlement_id
4.5.4 Acceptance Criteria
ID	Criterion
REF-01	/refund by SKU finds the most recent COMPLETED sale for that item
REF-02	Bot shows sale details + whether it was already settled
REF-03	On confirm: sale.status = REFUNDED, inventory.status = AVAILABLE (ACID transaction)
REF-04	If settled=TRUE: refund_adjustment created with PENDING status
REF-05	If settled=FALSE: no adjustment needed, sale simply excluded from next settlement
REF-06	Daily revenue report (/sales) shows refunds as negative line items
REF-07	Settlement calculation deducts pending refund_adjustments from net_payout
REF-08	STAFF role CANNOT use /refund (MANAGER+ only)
4.6 Sales & Financial Reporting
4.6.1 /sales — Daily Revenue
BOT RESPONSE FORMAT
📊 DOANH THU 25/02/2026
================================
💰 Tổng: 2,450,000đ (8 món)
🔄 Hoàn trả: -350,000đ (1 món)     ← D4: Refunds shown
💵 Ròng: 2,100,000đ
💳 TM: 1,200k | CK: 500k | MoMo: 400k

👤 THEO NV: Lan 1,500k (5) | Hương 950k (3)
🏢 THEO KG: Trang 1,400k (4) | Local X 700k (2)
4.6.2 /bctc — Monthly Financial Report (Owner only)
BOT RESPONSE FORMAT
📈 TÀI CHÍNH THÁNG 02/2026
================================
💰 Doanh thu: 38,500,000đ
🔄 Hoàn trả: -1,050,000đ
🏦 Hoa hồng giữ: 11,235,000đ
📤 Trả KG: 26,215,000đ

📊 CHI PHÍ: Thuê 8,000k | Lương 6,000k | Ship 1,200k | Khác 350k
📉 Tổng chi: 15,550,000đ

💵 LÃI RÒNG: -4,315,000đ ⚠
 
5. Error Handling & Resilience
⚠️ Every n8n branch MUST have try/catch. No silent failures.
All errors logged to error_logs table in Supabase.
Users ALWAYS receive a Vietnamese message. Never raw error text.
Critical errors (DB down, auth breach) auto-notify owner.
Error Type	Vietnamese Message	Action
Supabase connection failed	"⏳ Hệ thống đang bảo trì, thử lại sau 1 phút."	Retry 3x (1s,2s,4s). Alert owner.
NLP parse failed	"Không hiểu caption. VD: Nhẫn, Trang, 350k, 5"	Log raw caption. Ask user to retry.
SKU collision (NanoID)	(transparent to user, auto-regenerate)	Regenerate NanoID, retry INSERT. Max 3 attempts.
Photo upload BG failed	(user not affected — has telegram_file_id)	Retry 3x. Mark photo_status=FAILED. Owner alert.
Refund on non-existent sale	"❌ Không tìm thấy đơn hàng này."	Log attempted SKU/sale_id.
Duplicate attendance	"Đã chấm công hôm nay rồi!"	UNIQUE constraint catches this.
Unauthorized user	"🚫 Bạn không có quyền sử dụng bot."	Log telegram_user_id.
Permission denied	"🔒 Bạn không có quyền thực hiện lệnh này."	Log user + command.
Unexpected error	"❌ Lỗi hệ thống. Vui lòng thử lại."	Full stack trace to error_logs. Owner alert.
 
6. Development Phases & Sprint Plan (v1.1)
3 Phases, 12 Sprints, 1 week each. Total: 12-14 weeks.
🎯 DEV LOOP (unchanged)
1. READ: Sprint goal + acceptance criteria from this PRD
2. BUILD: Implement in n8n + Supabase
3. TEST: Run all acceptance criteria
4. DEMO: 2-minute Loom video
5. SHIP: Staging → Owner tests → Production
6. RETRO: Document learnings, update PRD if needed
6.1 PHASE 1: Foundation + Core Features (Sprint 1-4)
Sprint 1: Infrastructure + Auth (Week 1)
ID	Task	P	Hrs	Acceptance
S1-01	Provision VPS. Docker Compose: n8n (queue mode) + Redis	P0	3h	n8n accessible via HTTPS. Queue mode confirmed.
S1-02	Create Supabase project. Run ALL migration SQL (tables, RLS, triggers, indexes)	P0	4h	All 11 tables created. RLS enabled. Test queries pass.
S1-03	Create master n8n workflow with SINGLE Telegram Trigger	P0	4h	Only 1 webhook. Bot responds to /start.
S1-04	Implement Router node: dispatch by message type (video_note/photo/command/callback/text)	P0	4h	Each type routes correctly.
S1-05	Auth Guard: query staff table, extract context, block unauthorized	P0	4h	Unregistered user blocked. Staff context attached.
S1-06	Permission Matrix enforcement per command	P0	3h	STAFF blocked from /bctc. Owner accesses all.
S1-07	Global try/catch on all branches. Error logged to error_logs table.	P0	3h	Any error → Vietnamese message + DB log.
S1-08	Seed data: insert shop + owner + 2 test staff	P0	1h	Owner can use bot. Test staff verified.
Sprint 1 DoD: Supabase running with all tables. Bot on single webhook. Auth working. Errors handled.
Sprint 2: Attendance (Video Note) + Background Jobs (Week 2)
ID	Task	P	Hrs	Acceptance
S2-01	Video Note detection: message.video_note triggers attendance (NOT photo)	P0	3h	Regular photo does NOT trigger attendance. Video note does.
S2-02	Late penalty calculation (4 tiers from shops.late_rules)	P0	3h	All tiers calculate correctly.
S2-03	Store video_note_file_id instantly. INSERT to staff_attendance.	P0	3h	Record created in <1 second.
S2-04	BG-01: Async photo/video upload sub-workflow	P0	4h	Downloads from Telegram → uploads to Supabase Storage → updates storage_url.
S2-05	Duplicate check: UNIQUE(staff_id, date) constraint handles rejection	P0	2h	Second video note → friendly rejection.
S2-06	LATE_CRITICAL auto-notify owner via Telegram	P1	2h	Owner gets alert.
S2-07	Clock-out /out command	P1	2h	clock_out_time updated.
S2-08	BG-02: Session cleanup cron (every 1 hour)	P0	3h	Stale sessions cancelled after 2 hours. Staff notified.
Sprint 2 DoD: Video Note attendance working. Background jobs running. Hourly cleanup active.
Sprint 3: NLP Inventory Intake (Week 3)
ID	Task	P	Hrs	Acceptance
S3-01	Currency sanitizer function (handles 350k, 1.2tr, 350.000, etc.)	P0	3h	All test cases from Section 2.4.1 pass.
S3-02	Category keyword mapper (Vietnamese → ENUM)	P0	2h	All keywords from Section 2.4.2 map correctly.
S3-03	Regex NLP parser: split caption, extract 4 fields	P0	4h	Structured captions parsed. Partial captions trigger fallback.
S3-04	LLM fallback parser (Claude/GPT via HTTP node)	P1	4h	Unstructured captions parsed via LLM. Structured JSON output.
S3-05	NanoID SKU generator: {CAT}-{YYMM}-{4CHARS}	P0	2h	SKUs unique. Collision auto-retry.
S3-06	Single-item intake: photo+caption → parse → confirm keyboard	P0	6h	End-to-end: photo → confirmation → save. <3 seconds.
S3-07	Inline keyboards: [✅][✏][❌] + edit field selection	P0	4h	All keyboards render. callback_data ≤64 bytes.
S3-08	telegram_file_id stored instantly (D3). BG-01 queued for upload.	P0	3h	photo_status transitions: PENDING → UPLOADED.
S3-09	Consignor fuzzy matching (Levenshtein or trigram)	P2	3h	70%+ match auto-suggested.
Sprint 3 DoD: Single-photo NLP intake working end-to-end. Instant file_id storage. Background upload.
Sprint 4: Sales + Bulk Upload + Reports (Week 4)
ID	Task	P	Hrs	Acceptance
S4-01	/sell {SKU}: lookup + confirmation + payment method + commission calc	P0	6h	Full sale flow. Fixed + sliding commission correct.
S4-02	Sale transaction: INSERT sale + UPDATE inventory atomically	P0	3h	PostgreSQL transaction. No partial writes.
S4-03	Bulk upload: /receive with defaults + album grouping + batch confirm	P0	6h	media_group_id grouped. 15+ photos in one batch.
S4-04	/sales daily revenue report	P0	4h	Format per Section 4.6.1. Refunds shown (D4 prep).
S4-05	/ks consignor report	P1	3h	Items consigned, sold, pending payout per consignor.
S4-06	/help command with role-appropriate commands	P1	2h	Clear Vietnamese help text.
S4-07	Thai import: THB detection + exchange rate conversion + shipping allocation	P1	4h	Per Section 2.4.1 + consignor.currency_default.
Sprint 4 DoD: Sales flow complete. Bulk upload working. Reports live. Thai import handled.
✅ PHASE 1 MILESTONE
All original bugs FIXED: single webhook, Supabase DB, auth, keyboards, error handling.
NEW: NLP intake (D2), async photos (D3), video note attendance (D5), session cleanup cron (D5).
System USABLE for pilot shop (Viet Jewelers). Deploy to production.
6.2 PHASE 2: Feature Completion + Financial Ops (Sprint 5-8)
Sprint 5: Refund System + Financial Reports (Week 5)
ID	Task	P	Hrs	Acceptance
S5-01	/refund {SKU}: lookup sale, show details, confirm, process	P0	6h	Full refund flow per Section 4.5.
S5-02	Refund transaction: UPDATE sale + RESTORE inventory + CREATE adjustment (if settled)	P0	4h	ACID transaction. All REF criteria pass.
S5-03	/sales report shows refunds as negative line items	P0	2h	Refunded amounts subtracted from daily total.
S5-04	/expense command: record expenses via chat	P1	4h	Expense saved to expenses table.
S5-05	/bctc monthly financial report (Owner only)	P0	6h	Format per Section 4.6.2. Includes refund deductions.
S5-06	BG-03: Daily auto-report at 21:00 to owner	P1	3h	Owner receives summary every evening.
Sprint 6: Settlement System (Week 6)
ID	Task	P	Hrs	Acceptance
S6-01	/settle: generate monthly settlement for all consignors	P0	6h	Settlement records created per consignor.
S6-02	Settlement calculation WITH refund_adjustments deductions (D4)	P0	4h	net_payout = gross - deductions. Carry-over if net < 0.
S6-03	Mark sales as settled, refund_adjustments as APPLIED	P0	3h	Status updates atomic.
S6-04	Settlement summary message per consignor	P1	3h	Details: items, commission, gross, deductions, net.
S6-05	BG-04: Consignment expiry warnings (daily 08:00)	P1	3h	Items expiring in 3 days → alert owner.
S6-06	/return {SKU}: mark item RETURNED	P1	3h	Inventory status updated.
Sprint 7: Exchange Rate + Data Export (Week 7)
ID	Task	P	Hrs	Acceptance
S7-01	/setrate THB 650: store in shops.exchange_rates	P0	2h	Rate stored and used for all THB calculations.
S7-02	Exchange rate API integration (fallback to manual)	P2	4h	API provides rate. Falls back to manual.
S7-03	/export: generate Excel summary, send as Telegram document	P1	5h	Excel with Sales, Inventory, Attendance sheets.
S7-04	Photo compression before Supabase upload (>2MB → resize)	P2	3h	Max 1200px width.
S7-05	Consignor auto-create: new name in caption → auto-insert with defaults	P1	3h	New consignor created with shop default commission.
Sprint 8: QA + Hardening (Week 8)
ID	Task	P	Hrs	Acceptance
S8-01	Full E2E testing: all acceptance criteria from Sections 4.x	P0	10h	All criteria checked and passing.
S8-02	Bug fixes from QA	P0	10h	All P0/P1 bugs resolved.
S8-03	Performance testing: 50 concurrent users, 500 tx/day	P0	4h	No timeouts, no 429 errors.
S8-04	Security audit: no hardcoded secrets, RLS tested, token rotation	P0	4h	Audit checklist passed.
S8-05	Monitoring: Uptime Robot + n8n execution alerts	P1	2h	Alerts within 5 minutes.
S8-06	Automated Supabase backup (daily pg_dump)	P1	2h	Backup verified restorable.
✅ PHASE 2 MILESTONE
Feature-complete product with: NLP intake, refunds (D4), settlements with deductions, financial reports.
Ready for 10 beta test shops. All 5 Directives fully implemented.
6.3 PHASE 3: Scale + Advanced Features (Sprint 9-12)
Sprint 9: Multi-Tenant + Onboarding (Week 9)
ID	Task	P	Hrs	Acceptance
S9-01	/setup command: new shop registration flow	P0	6h	New shop created. Owner added. Bot configured.
S9-02	RLS enforcement verification across multiple shops	P0	4h	Shop A cannot see Shop B data.
S9-03	Shop-specific settings: penalty rules, commission defaults, timezone	P1	4h	Settings read from shops table per context.
S9-04	Billing/subscription tracking table + gating	P2	4h	Free tier limits enforced. Upgrade path clear.
Sprint 10: AI Analytics (Week 10)
ID	Task	P	Hrs	Acceptance
S10-01	Sales trend analysis: best-selling categories, peak hours, slow movers	P1	6h	/analytics command shows AI-generated insights.
S10-02	Consignor performance scoring: sell-through rate, avg days to sell	P1	4h	Score per consignor helps owner decide who to work with.
S10-03	Smart pricing suggestions based on sell-through data	P2	4h	Bot suggests: "Ring category sells 40% faster at 300k vs 350k."
S10-04	Anomaly detection: unusual sales patterns, potential theft indicators	P2	6h	Alert owner of statistical outliers.
Sprint 11: Platform Expansion (Week 11)
ID	Task	P	Hrs	Acceptance
S11-01	Abstract bot interface: platform-agnostic message handler	P1	6h	Business logic decoupled from Telegram.
S11-02	Zalo OA / Mini App prototype	P2	8h	Same flows running on Zalo.
S11-03	POS API: REST endpoints for external system integration	P2	6h	CRUD inventory + create sale via API.
S11-04	Consignor read-only portal (Telegram bot or web view)	P2	6h	Consignors check their items and payouts.
Sprint 12: Production Hardening (Week 12)
ID	Task	P	Hrs	Acceptance
S12-01	Load test: 50 shops, 500 tx/day simulation	P0	6h	System stable under load.
S12-02	n8n multi-worker setup for horizontal scaling	P1	4h	Multiple workers processing queue.
S12-03	Self-hosted Supabase option (VN datacenter for PDPD)	P1	6h	Data residency in Vietnam.
S12-04	PDPD compliance assessment + documentation	P0	4h	Ready for 01/07/2026 deadline.
S12-05	Deployment documentation + runbook	P1	4h	New developer can deploy from docs.
S12-06	Disaster recovery drill: restore from backup	P0	3h	Full restore completed in <1 hour.
✅ PHASE 3 MILESTONE
Multi-tenant SaaS ready for Go-to-Market.
AI analytics providing actionable insights.
Platform-agnostic architecture ready for Zalo expansion.
PDPD compliance confirmed before 01/07/2026.
 
7. Timeline Summary
Sprint	Week	Focus	Key Deliverable
S1	Wk 1	Supabase + Auth + Router	All tables live. Auth working. Single webhook.
S2	Wk 2	Attendance (Video Note) + BG Jobs	Video note clock-in. Cron cleanup active.
S3	Wk 3	NLP Inventory Intake	Single-caption parsing. Async photo upload.
S4	Wk 4	Sales + Bulk Upload + Reports	Full sale flow. Thai import. Daily reports.
S5	Wk 5	Refund System + /bctc	Refund with carry-over. Monthly P&L.
S6	Wk 6	Settlements	Consignor payouts with deductions.
S7	Wk 7	Exchange Rate + Export	FX API. Excel export.
S8	Wk 8	QA + Hardening	Feature-complete. Beta-ready.
S9	Wk 9	Multi-Tenant	Shop onboarding. RLS verified.
S10	Wk 10	AI Analytics	Sales insights. Consignor scoring.
S11	Wk 11	Platform Expansion	Zalo prototype. POS API.
S12	Wk 12	Production Hardening	Load tested. PDPD compliant.
 
8. Testing Strategy
Level	What	How	When
Unit	n8n nodes, sanitizer function, NLP parser	Test with mock data in isolated nodes	During each task
Integration	End-to-end flows (intake, sale, refund, settlement)	Test Telegram bot with test account	After each sprint
UAT	Real usage with pilot shop owner	Mai and staff use for daily operations	After Sprint 4 and Sprint 8
Load	Concurrent shops, transactions/day	Simulate 50 shops via n8n test triggers	Sprint 8 and 12
Security	Auth, RLS, token exposure, API keys	Manual audit + pg_dump inspection	Sprint 8 and 12
8.1 Master Acceptance Criteria Checklist
ID	Feature	Criterion	☐
ATT-01	Attendance	ONLY video_note triggers attendance (D5)	⬜
ATT-02	Attendance	Late penalty correct for all 4 tiers	⬜
ATT-03	Attendance	Duplicate rejected by UNIQUE constraint	⬜
ATT-04	Attendance	LATE_CRITICAL notifies owner	⬜
INV-01	Intake	NLP parses caption in ≤3 seconds (D2)	⬜
INV-02	Intake	Currency sanitizer handles all formats (D4)	⬜
INV-03	Intake	NanoID SKU unique (D1)	⬜
INV-04	Intake	telegram_file_id stored instantly (D3)	⬜
INV-05	Intake	Bulk upload groups by media_group_id	⬜
INV-06	Intake	Edit keyboard allows single-field correction	⬜
SAL-01	Sales	Commission calc: Fixed + Sliding correct	⬜
SAL-02	Sales	Sale transaction is ACID (PostgreSQL)	⬜
REF-01	Refund	/refund restores inventory to AVAILABLE (D4)	⬜
REF-02	Refund	Settled sale creates carry-over adjustment (D4)	⬜
REF-03	Refund	Settlement deducts pending adjustments (D4)	⬜
RPT-01	Reports	/sales shows refunds as negative	⬜
RPT-02	Reports	/bctc monthly P&L (Owner only)	⬜
AUTH-01	Auth	Unauthorized blocked. Roles enforced.	⬜
ERR-01	Errors	All errors → Vietnamese message + DB log	⬜
BG-01	Background	Photo upload async, status tracked	⬜
BG-02	Background	Session cleanup cron every 1 hour (D5)	⬜
 
9. Deployment & Infrastructure
9.1 Server Requirements
Component	MVP (1 shop)	Growth (10-50)	Scale (50+)
VPS	2 vCPU, 2GB RAM	2 vCPU, 4GB RAM	4 vCPU, 8GB RAM
Cost	$5-7/mo (Hetzner)	$7.5-15/mo	Dedicated
n8n	Queue mode + Redis	Queue mode + Redis	Multi-worker
Database	Supabase Cloud (Free)	Supabase Pro ($25/mo)	Self-hosted PG (VN)
Storage	Supabase Storage (1GB free)	Supabase Storage (100GB)	S3-compatible (VN)
SSL	Let’s Encrypt	Let’s Encrypt	Cloudflare
Monitoring	Uptime Robot	Grafana	Full APM
9.2 Environment Variables
docker-compose.yml ENV (NO Google Sheets — D1)
# n8n
N8N_HOST=hotchoco.example.com
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://hotchoco.example.com/
N8N_ENCRYPTION_KEY=<random-32-char>
GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
EXECUTIONS_MODE=queue    # D1: Queue mode from Day 1
QUEUE_BULL_REDIS_HOST=redis

# Telegram
TELEGRAM_BOT_TOKEN=<from-@BotFather>

# Supabase (D1: PRIMARY database from Sprint 1)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>
SUPABASE_DB_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# LLM (D2: NLP fallback parser)
LLM_API_KEY=<claude-or-openai-key>
LLM_MODEL=claude-sonnet-4-5-20250929

CRITICAL: NEVER commit .env to git. Use Docker secrets in production.
9.3 Deployment Checklist
#	Action	Verify
1	Provision VPS. Install Docker + Docker Compose.	docker --version 24+
2	Clone repo. Configure .env.	All vars set.
3	docker-compose up -d (n8n + Redis)	n8n UI at https://domain:5678
4	Create Supabase project. Run migration SQL.	All tables + RLS + indexes created.
5	Import n8n workflows (master + 4 background jobs)	All workflows visible.
6	Activate master workflow (sets Telegram webhook)	/start responds.
7	Seed shop + owner + test staff into Supabase	Owner can use all commands.
8	Test: video note attendance → NLP intake → sale → refund → report	All flows pass.
9	Configure Uptime Robot on webhook URL	Alert in <5 min.
10	Enable Supabase daily backup	Backups visible in dashboard.
 
10. Risk Register
ID	Risk	Prob	Impact	Mitigation
R01	Telegram not adopted by VN shop owners	HIGH	HIGH	Platform-agnostic logic (Sprint 11). Zalo expansion. Validate in GTM.
R02	NLP parser misinterprets captions	MED	MED	Regex primary + LLM fallback. Confirmation keyboard catches errors.
R03	Supabase free tier limits (500MB)	MED	LOW	Upgrade to Pro ($25/mo) at ~200 shops. Photo cleanup policy.
R04	PDPD compliance (cross-border data)	MED	HIGH	Self-host Supabase on VN server before 01/07/2026 (Sprint 12).
R05	NanoID collision	VERY LOW	LOW	Auto-retry on UNIQUE violation. 4-char NanoID: 34^4 = 1.3M combinations.
R06	KiotViet/Sapo adds consignment	LOW	HIGH	Chat UX moat. Community. NLP speed advantage.
R07	Video Note UX friction	MED	MED	Clear onboarding. Quick tutorial message. Worth it for anti-fraud.
R08	LLM API cost at scale	LOW	LOW	Regex handles 80%+ of captions. LLM only for ambiguous cases.
 
11. Vietnamese Business Terms Glossary
Tiếng Việt	English	In Hot Choco
Ký gửi	Consignment	Core business model: sell others' goods on commission
Hoa hồng	Commission	Shop's cut from each sale
Nhà ký gửi	Consignor	Person/brand who deposits items
Hoàn trả	Refund	D4: Return item, reverse sale
Khấu trừ kỳ sau	Carry-over deduction	D4: Deduct from next settlement
Quyết toán	Settlement	Monthly payout to consignors
Chấm công	Attendance	D5: Video Note clock-in
Phạt đi muộn	Late penalty	Tiered fines for tardiness
Doanh thu	Revenue	Total sales income
BCTC	Financial report	Monthly P&L summary
Nhẫn / DC / VT / HT	Ring / Necklace / Bracelet / Earring	Jewelry categories
 
12. Appendices
12.1 Bot Command Reference
Command	Description	Role	Phase
/start	Welcome + registration check	Any	1
/help	Show available commands	STAFF+	1
/receive [defaults]	Start intake session (optional defaults for bulk)	STAFF+	1
/done	End intake session, commit batch	STAFF+	1
/sell {SKU}	Record a sale	STAFF+	1
/sales [date range]	Daily/range revenue report	STAFF+	1
/out	Clock out	STAFF+	1
/refund {SKU}	Process refund/void (D4)	MGR+	2
/ks [name]	Consignor report	MGR+	1
/bctc [YYYYMM]	Monthly financial report	OWNER	2
/expense	Record expense	MGR+	2
/settle [name]	Run settlement	OWNER	2
/return {SKU}	Return unsold item	MGR+	2
/setrate {CUR} {rate}	Set exchange rate	OWNER	2
/export	Export to Excel	MGR+	2
/addstaff {id} {name} {role}	Add employee	OWNER	1
/removestaff {id}	Deactivate employee	OWNER	1
/settings	View/edit shop settings	OWNER	2
/setup	New shop onboarding	OWNER	3
/analytics	AI insights (D1 Phase 3)	OWNER	3
12.2 Supabase Table Overview
Table	Purpose	Created
shops	Multi-tenant shop config + settings	Sprint 1
staff	Employee records + Telegram auth	Sprint 1
consignors	Supplier profiles + commission rules	Sprint 1
inventory	All consigned items + status tracking	Sprint 1
sales	Completed (and refunded) transactions	Sprint 1
refund_adjustments	Carry-over deductions for settled refunds (D4)	Sprint 1
staff_attendance	Video Note clock-in/out records (D5)	Sprint 1
temp_batches	Active intake sessions (cleaned hourly — D5)	Sprint 1
expenses	Shop operating expenses	Sprint 1
settlements	Monthly consignor payouts	Sprint 1
error_logs	System error tracking	Sprint 1

_______________________________________________
END OF DOCUMENT
Hot Choco PRD v1.1.0 — Supabase-first. NLP-powered. Anti-fraud. Ship fast.
