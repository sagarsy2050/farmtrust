// Exports FarmTrust's real orders into the two CSV shapes the
// reconciliation/ notebook expects (data/raw/bank_statement.csv,
// data/raw/ledger_transactions.csv), replacing its bundled sample data so
// the actual matching/EDA/KPI pipeline runs against this app's own money.
//
// Run from anywhere: node server/scripts/export-reconciliation.js
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.resolve(__dirname, '../../reconciliation/data/raw');

// db.js resolves DB_PATH (and dotenv resolves .env) relative to
// process.cwd(), not to this file's location - so "run from anywhere" would
// otherwise silently open/create a throwaway DB wherever the caller's shell
// happened to be, instead of server/farmtrust.db. Anchor both explicitly to
// this script's own directory before db.js is ever loaded (a dynamic import
// below, so this setup runs first - a static top-level import would already
// have opened the DB by the time any code following it could run).
dotenv.config({ path: path.join(SERVER_DIR, '.env') });
process.env.DB_PATH = process.env.DB_PATH
  ? path.resolve(SERVER_DIR, process.env.DB_PATH)
  : path.join(SERVER_DIR, 'farmtrust.db');

const { db } = await import('../src/db.js');

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function writeCsv(filePath, header, rows) {
  const lines = [header.join(','), ...rows.map(r => r.map(csvEscape).join(','))];
  fs.writeFileSync(filePath, lines.join('\n') + '\n');
}

async function fetchStripeChargesAsBankRows(orders) {
  // Real bank-side data: Stripe's own record of what was actually charged,
  // independent of FarmTrust's local orders table - this is what makes
  // reconciliation meaningful instead of a table diffed against itself.
  const key = process.env.STRIPE_SECRET_KEY;
  const rows = [];
  for (const o of orders) {
    if (!o.stripe_payment_intent) continue;
    const res = await fetch(`https://api.stripe.com/v1/payment_intents/${o.stripe_payment_intent}`, {
      headers: { Authorization: `Bearer ${key}`, 'Stripe-Version': process.env.STRIPE_VERSION || '2025-10-29.clover' },
    });
    if (!res.ok) continue;
    const pi = await res.json();
    rows.push([
      `BANK-${pi.id}`,
      new Date(pi.created * 1000).toISOString().slice(0, 10),
      (pi.amount_received / 100).toFixed(2),
      o.order_number || o.id,
      `Stripe charge for order ${o.order_number || o.id}`,
      'STRIPE_ACCOUNT',
      pi.status === 'succeeded' ? 'CREDIT' : 'DEBIT',
    ]);
  }
  return rows;
}

function main() {
  const orders = db.prepare(`SELECT * FROM orders WHERE payment_status IN ('paid','refunded') ORDER BY created_date`).all();

  const ledgerHeader = ['transaction_id', 'date', 'amount', 'reference', 'description', 'bank_account', 'transaction_type', 'gl_account', 'posted_by'];
  const ledgerRows = orders.map(o => [
    `LEDG-${o.id}`,
    (o.created_date || '').slice(0, 10),
    o.total,
    o.order_number || o.id,
    `FarmTrust order ${o.order_number || o.id} - ${o.farmer_name || ''}`,
    'FARMTRUST_PLATFORM',
    o.payment_status === 'refunded' ? 'CREDIT' : 'DEBIT', // ledger records revenue owed OUT to the farmer as a debit against the platform account
    o.farmer_id,
    'FARMTRUST_SYSTEM',
  ]);
  writeCsv(path.join(OUT_DIR, 'ledger_transactions.csv'), ledgerHeader, ledgerRows);

  const bankHeader = ['transaction_id', 'date', 'amount', 'reference', 'description', 'bank_account', 'transaction_type'];
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_xxx');

  const finish = (bankRows, source) => {
    writeCsv(path.join(OUT_DIR, 'bank_statement.csv'), bankHeader, bankRows);
    console.log(JSON.stringify({ orders: orders.length, ledgerRows: ledgerRows.length, bankRows: bankRows.length, bankSource: source }, null, 2));
  };

  if (stripeConfigured) {
    fetchStripeChargesAsBankRows(orders).then(rows => finish(rows, 'stripe'));
  } else {
    // No independent bank connection configured on this machine: mirror the
    // paid orders themselves so the pipeline can still be exercised
    // end-to-end locally. IMPORTANT - this is NOT real reconciliation data.
    // Every row here comes from the exact same `orders` table as the ledger
    // side above, so it will match 100%, every time, by construction. Set
    // STRIPE_SECRET_KEY and re-run for a genuine bank-vs-ledger comparison.
    const bankRows = orders.map(o => [
      `BANK-${o.stripe_session_id || o.id}`,
      (o.updated_date || o.created_date || '').slice(0, 10),
      o.total,
      o.order_number || o.id,
      `Payment for order ${o.order_number || o.id}`,
      'FARMTRUST_MOCK_BANK',
      o.payment_status === 'refunded' ? 'DEBIT' : 'CREDIT',
    ]);
    finish(bankRows, 'mock (no STRIPE_SECRET_KEY set - see script header comment)');
  }
}

main();
