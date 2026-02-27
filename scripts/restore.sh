#!/usr/bin/env bash
set -euo pipefail

# Wrapper for Sprint 12 compatibility
DIR="$(cd "$(dirname "$0")" && pwd)"
"$DIR/restore_supabase.sh"
