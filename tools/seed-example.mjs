#!/usr/bin/env node
/* EXAMPLE DATA ONLY. Every company, person, email and number below is fictional.
   Usage:
     node tools/seed-example.mjs --local       Adds the example deals to ./seed-data.js (root copy, local runs only).
                                               Then serve locally; on first sign-in with an empty Firestore the app
                                               uploads this seed, or use Admin > Reload seed.
     node tools/seed-example.mjs --firestore   Writes the example state straight to Firestore workspace/main
                                               (needs: cd functions && npm install, plus
                                               gcloud auth application-default login, and GCLOUD_PROJECT=your-project-id).
   public/seed-data.js (what Hosting serves) never contains deals. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SEED = path.join(ROOT, 'seed-data.js');
const now = new Date().toISOString();
const days = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

const companies = [
  ['Zephyrine Trail Goods', 'Marla Quenby'], ['Thimbleroot Kitchenware', 'Devin Arkwell'],
  ['Vellichor Medical (Example)', 'Lena Brightwater'], ['Pemberwick Toys', 'Sam Thistlewood'],
  ['Quillfeather Pet Supply', 'Priya Ashcombe'], ['Orrinvale Audio Labs', 'Tom Wexley'],
  ['Brindlecove Marine Parts', 'Grace Holloway-Fenn'], ['Larkspire Baby Co.', 'Omar Venturelli'],
];
// [companyIdx, title, stage, quotedValue]
const deals = [
  [0, 'Silicone bottle sleeve', 'cold-leads', 0],
  [1, 'Heat-safe trivet', 'inbound-jotform', 0],
  [2, 'Grip cover prototype', 'needs-quotation', 0],
  [3, 'Teether ring set', 'design-prototyping-quote-sent', 4200],
  [4, 'Collapsible pet bowl', 'follow-up-negotiation', 6800],
  [5, 'Earbud tip kit', 'won-awaiting-payment', 3500],
  [6, 'Rubber hatch gasket', 'design-in-progress', 9100],
  [7, 'Bottle nipple v2', 'prototyping-in-progress', 5400],
  [0, 'Cap tether, 2-cavity mold', 'tooling-production-quoted', 18500],
  [2, 'Grip cover production run', 'production-po-received', 27000],
  [4, 'Lick mat first articles', 'first-articles', 12000],
  [1, 'Spatula head QC lot', 'qc', 8800],
];

const exampleDeals = deals.map(([ci, title, stage, val], i) => {
  const [company, contact] = companies[ci];
  const slug = contact.toLowerCase().replace(/[^a-z]+/g, '.');
  return {
    id: 'example-' + (i + 1), company, title, stage,
    contactName: contact, contactEmail: slug + '@example.com', contactPhone: '555-0100',
    nextFollowUp: days(3 + i), notes: [{ id: 'n-example-' + (i + 1), text: 'EXAMPLE DATA. Fictional deal for training.', createdAt: now }],
    timeline: [], files: [], source: 'Example data',
    values: val ? { quoted: val } : {},
    createdAt: now, updatedAt: now, lastActivityAt: now,
  };
});

function readSeed() {
  const src = fs.readFileSync(SEED, 'utf8');
  return JSON.parse(src.slice(src.indexOf('=') + 1).trim().replace(/;\s*$/, ''));
}

const mode = process.argv[2];
const seed = readSeed();
seed.deals = exampleDeals;
if (mode === '--local') {
  fs.writeFileSync(SEED, '/* Root seed with EXAMPLE DATA (fictional). Written by tools/seed-example.mjs. */\nwindow.MATRIX_SEED = ' + JSON.stringify(seed, null, 1) + ';\n');
  console.log('wrote', exampleDeals.length, 'example deals for', companies.length, 'companies to seed-data.js');
} else if (mode === '--firestore') {
  const require = createRequire(path.join(ROOT, 'functions', 'package.json'));
  const admin = require('firebase-admin');
  admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT });
  const ref = admin.firestore().doc('workspace/main');
  if ((await ref.get()).exists && !process.argv.includes('--force')) {
    console.error('workspace/main already exists. Re-run with --force to replace it.'); process.exit(1);
  }
  await ref.set({ state: seed, updatedAt: now, updatedBy: 'seed-example' });
  console.log('wrote example state to workspace/main');
} else {
  console.log('usage: node tools/seed-example.mjs --local | --firestore [--force]'); process.exit(1);
}
