# Release Audit (Beta-ready hardening pass)

## Beta-ready criteria
- Core flows have no obvious blocking defects.
- New developer can bootstrap via docs.
- Tests and smoke commands are defined and executable.
- Workflows and migrations are versioned and referenced.
- Security/ops docs cover rotation, backup, restore, incident response.

## Issues found and fixed
1. **Missing explicit troubleshooting doc**
   - Path: `docs/troubleshooting.md` (new)
   - Fix: Added actionable failure-mode playbook.

2. **Backup/restore guidance scattered**
   - Path: `docs/backup_restore.md` (new)
   - Fix: Added single operational procedure with post-restore checks.

3. **POS API runtime deps not explicit in package**
   - Path: `package.json`
   - Fix: Added `express` + `pg` dependencies for reproducible local boot.

4. **README lacked explicit manual smoke checklist for all core commands**
   - Path: `README.md`
   - Fix: Added end-to-end smoke checklist including owner/batch/background checks.

5. **Runbook lacked direct troubleshooting cross-reference**
   - Path: `docs/runbook.md`
   - Fix: Added references to troubleshooting and backup/restore docs.
