#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'node:fs';
import net from 'node:net';

const requiredFiles = [
  '.env',
  'n8n/workflows/master.json',
  'infra/docker-compose.yml',
  'supabase/migrations/001_init.sql'
];

const requiredEnv = [
  'TELEGRAM_BOT_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_DB_URL',
  'WEBHOOK_URL'
];

function ok(msg) { console.log(`✅ ${msg}`); }
function bad(msg) { console.log(`❌ ${msg}`); }
function warn(msg) { console.log(`⚠️  ${msg}`); }

function parseEnv(filePath) {
  const out = {};
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const [k, ...rest] = t.split('=');
    out[k] = rest.join('=').trim();
  }
  return out;
}

function checkPort(host, port, timeout = 1200) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    const finish = (result) => {
      if (!done) {
        done = true;
        socket.destroy();
        resolve(result);
      }
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

async function main() {
  console.log('=== HOT CHOCO Doctor / Preflight ===');

  let hasError = false;

  for (const file of requiredFiles) {
    if (fs.existsSync(file)) ok(`Tìm thấy file: ${file}`);
    else { bad(`Thiếu file: ${file}`); hasError = true; }
  }

  if (!fs.existsSync('.env')) {
    bad('Thiếu .env. Hãy copy từ .env.example trước.');
    process.exit(1);
  }

  const env = parseEnv('.env');

  for (const key of requiredEnv) {
    const val = env[key];
    if (!val || val === 'replace-me' || val.includes('change-this')) {
      bad(`Biến ${key} chưa điền đúng trong .env`);
      hasError = true;
    } else {
      ok(`Biến ${key} đã có giá trị`);
    }
  }

  if (env.SUPABASE_URL && !/^https:\/\//.test(env.SUPABASE_URL)) {
    warn('SUPABASE_URL nên bắt đầu bằng https://');
  }

  if (env.WEBHOOK_URL && !/^https:\/\//.test(env.WEBHOOK_URL)) {
    warn('WEBHOOK_URL chưa phải HTTPS. Telegram webhook thường yêu cầu HTTPS public URL.');
  }

  const n8nUp = await checkPort('127.0.0.1', 5678);
  if (n8nUp) ok('Port n8n (5678) đang mở.');
  else warn('Không kết nối được n8n port 5678. Có thể docker chưa chạy.');

  const redisUp = await checkPort('127.0.0.1', 6379);
  if (redisUp) ok('Port Redis (6379) đang mở.');
  else warn('Không kết nối được Redis port 6379.');

  if (hasError) {
    bad('Preflight có lỗi. Vui lòng sửa các mục ❌ rồi chạy lại.');
    process.exit(1);
  }

  ok('Preflight hoàn tất. Bạn có thể tiếp tục import workflow và test Telegram.');
}

main();
