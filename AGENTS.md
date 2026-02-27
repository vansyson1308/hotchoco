# AGENTS.md — HOT CHOCO Repository Guidelines

Scope: entire repository.

## Engineering standards
- PRD `hotchoco.prd.md` is authoritative; do not implement conflicting behavior.
- Supabase is the only state system. Never use RAM/static in-memory state for business data.
- Enforce deterministic/idempotent operations where practical.
- Use ACID DB transactions for sale/refund financial writes.
- Sanitize all currency values via `sanitizeVND` before persistence.

## Workflow architecture rules
- Exactly **one** Telegram Trigger in the bot architecture.
- Master workflow routes to all features/background jobs.
- Media handling is async: save Telegram `file_id` immediately, upload in background, track status.
- Attendance accepts Telegram Video Note only (reject gallery photos).
- All workflow branches must log errors to `error_logs` and return Vietnamese-friendly user messages.

## Code style and structure
- Keep parsing logic isolated in `src/core` and unit-tested.
- Keep DB access patterns consistent and explicit.
- Avoid dead code and commented-out logic.

## Test policy
- Required unit tests: `sanitizeVND`, SKU generator, category mapping, caption parser.
- Add integration tests for key DB queries when query code is introduced.
- Add E2E fixture-based router tests when routing layer is introduced.

## Commit style
- Use Conventional Commit prefixes (`feat:`, `chore:`, `test:`, `docs:`).
- Keep commits focused and reviewable (prefer one deliverable per commit when feasible).
