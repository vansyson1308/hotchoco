/**
 * Google Sheets Schema Setup Script
 *
 * Adds new sheets and columns to the VJ-Pos spreadsheet
 * for Hotchoco bot integration.
 *
 * Usage:
 *   GOOGLE_SHEETS_SPREADSHEET_ID=xxx node tools/setup-sheets.ts
 *
 * Prerequisites:
 *   - Service account credentials configured
 *   - Service account has Editor access to the spreadsheet
 */

import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
if (!SPREADSHEET_ID) {
  console.error('❌ GOOGLE_SHEETS_SPREADSHEET_ID environment variable is required');
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  ...(process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? { credentials: JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'base64').toString()) }
    : {}),
});

const sheets = google.sheets({ version: 'v4', auth });

// ─── New sheets to create ──────────────────────────────────────────
const NEW_SHEETS = [
  {
    title: 'HC_Settlements',
    headers: [
      'Settlement_ID',
      'Consignor_Code',
      'Period_Start',
      'Period_End',
      'Gross_Sales',
      'Commission_Total',
      'Refund_Deductions',
      'Net_Payout',
      'Status',
      'Created_At',
    ],
  },
  {
    title: 'HC_Refund_Adj',
    headers: ['ID', 'Order_ID', 'Consignor_Code', 'Amount', 'Status', 'Settlement_ID', 'Note', 'Created_At'],
  },
  {
    title: 'HC_Attendance',
    headers: ['ID', 'Staff_ID', 'Video_File_ID', 'Check_At', 'Late_Minutes', 'Penalty', 'Created_At'],
  },
  {
    title: 'HC_Expenses',
    headers: ['ID', 'Staff_ID', 'Date', 'Category', 'Amount', 'Note', 'Created_At'],
  },
  {
    title: 'HC_Temp_Batches',
    headers: ['ID', 'Staff_ID', 'Defaults_JSON', 'Status', 'Expires_At', 'Created_At'],
  },
  {
    title: 'HC_Config',
    headers: ['Key', 'Value'],
  },
];

// ─── Extra columns for existing sheets ─────────────────────────────
const EXTRA_COLUMNS: Record<string, string[]> = {
  Admin_Staff: ['Telegram_User_ID'],
  Admin_Products: [
    'Consignor_Code',
    'Intake_Price',
    'Condition_Note',
    'Material',
    'Telegram_File_ID',
    'Received_By',
    'Sold_At',
    'Days_Consigned',
    'Commission_Rate',
    'Created_At',
    'Version',
  ],
  Admin_Artists: ['Commission_Type', 'Payout_Cycle_Days', 'Sliding_Rules'],
  Orders: [
    'SKU',
    'Product_ID',
    'Commission_Amount',
    'Consignor_Amount',
    'Consignor_Code',
    'Settlement_ID',
    'Refunded_At',
    'Refund_Reason',
    'Idempotency_Key',
    'Version',
  ],
};

async function run() {
  console.log('🔧 Hotchoco × VJ-Pos Google Sheets Schema Setup');
  console.log('═'.repeat(50));

  // Get existing sheets
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties.title',
  });
  const existingSheets = new Set(meta.data.sheets?.map((s) => s.properties?.title) ?? []);
  console.log(`📊 Existing sheets: ${[...existingSheets].join(', ')}`);

  // 1. Create new sheets
  console.log('\n📝 Creating new Hotchoco sheets...');
  for (const sheet of NEW_SHEETS) {
    if (existingSheets.has(sheet.title)) {
      console.log(`  ⏭ ${sheet.title} already exists, skipping`);
      continue;
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheet.title } } }],
      },
    });

    // Add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheet.title}!A1:${String.fromCharCode(65 + sheet.headers.length - 1)}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [sheet.headers] },
    });

    console.log(`  ✅ Created ${sheet.title} with ${sheet.headers.length} columns`);
  }

  // 2. Add extra columns to existing sheets
  console.log('\n📝 Adding Hotchoco columns to existing sheets...');
  for (const [sheetName, newColumns] of Object.entries(EXTRA_COLUMNS)) {
    if (!existingSheets.has(sheetName)) {
      console.log(`  ⚠ ${sheetName} not found, skipping column additions`);
      continue;
    }

    // Read existing headers
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!1:1`,
    });
    const existingHeaders = (headerRes.data.values?.[0] as string[]) ?? [];

    const columnsToAdd = newColumns.filter((col) => !existingHeaders.includes(col));
    if (columnsToAdd.length === 0) {
      console.log(`  ⏭ ${sheetName} already has all Hotchoco columns`);
      continue;
    }

    // Append new column headers
    const startCol = String.fromCharCode(65 + existingHeaders.length);
    const endCol = String.fromCharCode(65 + existingHeaders.length + columnsToAdd.length - 1);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${startCol}1:${endCol}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [columnsToAdd] },
    });

    console.log(`  ✅ Added ${columnsToAdd.length} columns to ${sheetName}: ${columnsToAdd.join(', ')}`);
  }

  // 3. Add default config values
  console.log('\n📝 Setting default Hotchoco config...');
  const configDefaults = [
    ['timezone', 'Asia/Ho_Chi_Minh'],
    ['currency', 'VND'],
    ['late_penalty_per_minute', '5000'],
    ['default_commission_rate', '30'],
    ['payout_cycle_days', '30'],
  ];

  const existingConfig = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'HC_Config!A2:B100',
  });
  const existingKeys = new Set((existingConfig.data.values ?? []).map((r: string[]) => r[0]));

  const newConfigs = configDefaults.filter(([key]) => !existingKeys.has(key));
  if (newConfigs.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'HC_Config!A:B',
      valueInputOption: 'RAW',
      requestBody: { values: newConfigs },
    });
    console.log(`  ✅ Added ${newConfigs.length} default config entries`);
  } else {
    console.log('  ⏭ All config defaults already set');
  }

  console.log('\n✅ Schema setup complete!');
  console.log('📌 Next steps:');
  console.log('   1. Add Telegram_User_ID for each staff member in Admin_Staff');
  console.log('   2. Or use /link <PIN> command in Telegram to auto-link');
}

run().catch((err) => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
