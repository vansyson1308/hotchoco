#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'node:fs';

const required = [
  'n8n/workflows/master.json',
  'n8n/workflows/healthcheck.json',
  'supabase/migrations/001_init.sql',
  'supabase/migrations/012_platform_expansion.sql'
];

for (const p of required) {
  if (!fs.existsSync(p)) {
    console.error(`missing: ${p}`);
    process.exit(1);
  }
}

console.log('smoke: required files exist');
console.log('smoke: basic restore verification placeholder passed');
