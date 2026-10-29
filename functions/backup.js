/**
 * Matrix CRM: backups (issue #111). Pure logic plus thin Firestore / Storage calls, so the
 * tests can run it against in-memory fakes. Used by nightlyBackup and backupAdmin in index.js.
 *
 * Layout in the private bucket YOUR-PROJECT-ID-backups:
 *   daily/YYYY-MM-DD.json     kept 30 days (lifecycle rule)
 *   monthly/YYYY-MM.json      copy of the first backup of each month, kept 12 months
 * Status doc backups/{YYYY-MM-DD}: { date, status, startedAt, finishedAt, counts, bytes, sha256, file, error }
 */
"use strict";

const crypto = require("crypto");

const BUCKET = "YOUR-PROJECT-ID-backups";
const STATUS_COLLECTION = "backups";
const SNAPSHOT_COLLECTION = "workspaceSnapshots";
const TZ = "America/Los_Angeles";
// Never back up the status docs themselves.
const SKIP_COLLECTIONS = new Set([STATUS_COLLECTION]);
const RESTORE_TARGETS = { main: "workspace/main", staging: "workspace/staging" };
const RESTORE_WORD = "RESTORE";

function sha256Hex(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// Calendar date in Pacific time, so "02:15 PT" and the file name agree.
function pacificDate(d) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d || new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return get("year") + "-" + get("month") + "-" + get("day");
}

function validDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
}

// Firestore values to plain JSON. Timestamps become { __timestamp: iso } so they can come back.
function toJson(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "object") {
    if (typeof v.toDate === "function" && typeof v.seconds === "number") return { __timestamp: v.toDate().toISOString() };
    if (Array.isArray(v)) return v.map(toJson);
    const out = {};
    Object.keys(v).forEach((k) => { if (v[k] !== undefined) out[k] = toJson(v[k]); });
    return out;
  }
  return v;
}

// Firestore JSON back to values. { __timestamp: iso } becomes a Date (stored as a Timestamp).
function fromJson(v) {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(fromJson);
  if (typeof v.__timestamp === "string" && Object.keys(v).length === 1) return new Date(v.__timestamp);
  const out = {};
  Object.keys(v).forEach((k) => { out[k] = fromJson(v[k]); });
  return out;
}

// Every document under a collection and every subcollection under those, recursively. First level
// documents go to `docs`; records below them (the #103 / #114 split: workspace/main/deals/...) go to
// `subdocs`, keyed by full document path.
async function walkCollection(col, docs, subdocs, depth) {
  const snap = await col.get();
  for (const d of snap.docs) {
    const data = toJson(d.data());
    if (depth === 0) docs[d.id] = data;
    else subdocs[d.ref.path] = data;
    if (d.ref && typeof d.ref.listCollections === "function") {
      for (const sub of await d.ref.listCollections()) await walkCollection(sub, docs, subdocs, depth + 1);
    }
  }
}

// Every collection in the database, so new ones are covered without a code change.
// Returns { collections: { col: { docId: data } }, subdocs: { "col/doc/sub/id": data } }.
async function collectAll(db) {
  const collections = {};
  const subdocs = {};
  for (const col of await db.listCollections()) {
    if (SKIP_COLLECTIONS.has(col.id)) continue;
    const docs = {};
    await walkCollection(col, docs, subdocs, 0);
    collections[col.id] = docs;
  }
  return { collections, subdocs };
}

// Counts per top level collection, plus one entry per subcollection path ("workspace/main/deals").
function countsOf(collections, subdocs) {
  const counts = {};
  Object.keys(collections).forEach((c) => { counts[c] = Object.keys(collections[c]).length; });
  Object.keys(subdocs || {}).forEach((p) => {
    const key = p.split("/").slice(0, -1).join("/");
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

// The backup bucket must be private. Checked on every run, in code, not only in BACKUPS.md.
async function assertBucketPrivate(bucket) {
  if (!bucket || typeof bucket.getMetadata !== "function") throw new Error("Cannot read the backup bucket settings. Refusing to write.");
  const [meta] = await bucket.getMetadata();
  const iam = (meta && meta.iamConfiguration) || {};
  if (iam.publicAccessPrevention !== "enforced") throw new Error("Backup bucket is not private: public access prevention is not enforced. Refusing to write.");
  if (!iam.uniformBucketLevelAccess || iam.uniformBucketLevelAccess.enabled !== true) throw new Error("Backup bucket is not private: uniform bucket-level access is off. Refusing to write.");
}

function buildBackupText(date, collections, at, subdocs) {
  return JSON.stringify({ format: "matrix-matrix-backup", version: 2, date, createdAt: at, collections, subdocs: subdocs || {} });
}

// The first successful run in a month also writes the monthly copy.
function monthlyName(date) { return "monthly/" + date.slice(0, 7) + ".json"; }
function dailyName(date) { return "daily/" + date + ".json"; }

/**
 * One backup run. Never throws: a failure is written to backups/{date} with status "failed" so the
 * Admin banner and the 36 h check see it. A failed run never deletes or overwrites an older file.
 */
async function runBackup({ db, bucket, now }) {
  const startedAt = (now || new Date()).toISOString();
  const date = pacificDate(now || new Date());
  const statusRef = db.collection(STATUS_COLLECTION).doc(date);
  try {
    await assertBucketPrivate(bucket);
    const { collections, subdocs } = await collectAll(db);
    const text = buildBackupText(date, collections, startedAt, subdocs);
    const sha = sha256Hex(text);
    const bytes = Buffer.byteLength(text, "utf8");
    const file = dailyName(date);
    await bucket.file(file).save(text, { contentType: "application/json", resumable: false });
    let monthly = null;
    const [monthlyExists] = await bucket.file(monthlyName(date)).exists();
    if (!monthlyExists) {
      await bucket.file(monthlyName(date)).save(text, { contentType: "application/json", resumable: false });
      monthly = monthlyName(date);
    }
    const status = {
      date, status: "ok", startedAt, finishedAt: new Date().toISOString(),
      counts: countsOf(collections, subdocs), bytes, sha256: sha, file, monthly, error: null,
    };
    await statusRef.set(status);
    return status;
  } catch (e) {
    const status = {
      date, status: "failed", startedAt, finishedAt: new Date().toISOString(),
      counts: {}, bytes: 0, sha256: null, file: null, monthly: null, error: String((e && e.message) || e).slice(0, 500),
    };
    try { await statusRef.set(status); } catch (e2) { /* the function log still has it */ }
    return status;
  }
}

// ---- Restore ----

function idOf(x, i) { return x && typeof x === "object" && x.id != null ? String(x.id) : "#" + i; }

// What would change if `next` replaced `cur`. Per top-level key: arrays by record id (added, removed,
// changed), everything else as same / changed. Pure, so the dry run and the tests share it.
function diffStates(cur, next) {
  cur = cur || {};
  next = next || {};
  const keys = Array.from(new Set(Object.keys(cur).concat(Object.keys(next)))).sort();
  const rows = [];
  keys.forEach((k) => {
    const a = cur[k];
    const b = next[k];
    if (Array.isArray(a) || Array.isArray(b)) {
      const A = new Map((Array.isArray(a) ? a : []).map((x, i) => [idOf(x, i), JSON.stringify(x)]));
      const B = new Map((Array.isArray(b) ? b : []).map((x, i) => [idOf(x, i), JSON.stringify(x)]));
      let added = 0; let removed = 0; let changed = 0;
      B.forEach((v, id) => { if (!A.has(id)) added += 1; else if (A.get(id) !== v) changed += 1; });
      A.forEach((v, id) => { if (!B.has(id)) removed += 1; });
      if (added || removed || changed) rows.push({ key: k, kind: "list", before: A.size, after: B.size, added, removed, changed });
    } else if (JSON.stringify(a) !== JSON.stringify(b)) {
      rows.push({ key: k, kind: "value", before: a === undefined ? "(none)" : "changed", after: b === undefined ? "(removed)" : "changed" });
    }
  });
  return { same: rows.length === 0, rows };
}

const RECORD_SOURCE = "workspace/main/";

// Backed-up records below workspace/main, keyed by path relative to it ("deals/abc").
function recordsFromBackup(parsed) {
  const out = {};
  const sub = (parsed && parsed.subdocs) || {};
  Object.keys(sub).forEach((p) => { if (p.indexOf(RECORD_SOURCE) === 0) out[p.slice(RECORD_SOURCE.length)] = sub[p]; });
  return out;
}

// Current records below a document, same relative keys and JSON form as the backup.
async function collectRecords(ref) {
  const all = {};
  if (!ref || typeof ref.listCollections !== "function") return all;
  for (const sub of await ref.listCollections()) await walkCollection(sub, {}, all, 1);
  const out = {};
  Object.keys(all).forEach((p) => { out[p.slice(ref.path.length + 1)] = all[p]; });
  return out;
}

// Per subcollection: what a restore adds, changes, and leaves alone (records newer than the backup).
function diffRecords(cur, next) {
  const rows = {};
  const row = (rel) => {
    const c = rel.split("/").slice(0, -1).join("/");
    return rows[c] || (rows[c] = { collection: c, before: 0, after: 0, added: 0, changed: 0, keptExtra: 0 });
  };
  Object.keys(cur).forEach((rel) => { row(rel).before += 1; });
  Object.keys(next).forEach((rel) => {
    const r = row(rel);
    r.after += 1;
    if (!(rel in cur)) r.added += 1;
    else if (JSON.stringify(cur[rel]) !== JSON.stringify(next[rel])) r.changed += 1;
  });
  Object.keys(cur).forEach((rel) => { if (!(rel in next)) row(rel).keptExtra += 1; });
  const list = Object.keys(rows).sort().map((k) => rows[k]).filter((r) => r.added || r.changed || r.keptExtra);
  return { same: list.length === 0, rows: list };
}

async function inChunks(items, fn, size) {
  const n = size || 25;
  for (let i = 0; i < items.length; i += n) await Promise.all(items.slice(i, i + n).map(fn));
}

async function loadBackup(bucket, date, monthly) {
  const name = monthly ? "monthly/" + date + ".json" : dailyName(date);
  const [exists] = await bucket.file(name).exists();
  if (!exists) { const e = new Error("No backup file " + name); e.status = 404; throw e; }
  const [buf] = await bucket.file(name).download();
  return { name, text: String(buf), parsed: JSON.parse(String(buf)) };
}

/**
 * Restore the workspace document (state blob) from a backup into workspace/main or workspace/staging.
 * Always dry run unless confirm is exactly RESTORE. A real restore first saves the current state
 * as a "before-restore" snapshot in workspaceSnapshots, in the same transaction, then writes the
 * restored state with a fresh updatedAt (open tabs hit the stale-save guard and reload).
 * Other collections (users, botGrants, botKeys, ...) are never overwritten by this endpoint.
 */
async function restoreWorkspace({ db, bucket, date, monthly, target, confirm, actor, now }) {
  const targetPath = RESTORE_TARGETS[target || "main"];
  if (!targetPath) { const e = new Error("target must be main or staging"); e.status = 400; throw e; }
  if (!monthly && !validDate(date)) { const e = new Error("date must be YYYY-MM-DD"); e.status = 400; throw e; }
  const b = await loadBackup(bucket, date, !!monthly);
  const ws = b.parsed && b.parsed.collections && b.parsed.collections.workspace;
  const saved = ws && ws.main;
  if (!saved || !saved.state) { const e = new Error("Backup has no workspace/main state"); e.status = 422; throw e; }
  const ref = db.doc(targetPath);
  const curSnap = await ref.get();
  const cur = curSnap.exists ? curSnap.data() : null;
  const diff = diffStates(cur && cur.state, saved.state);
  // Records below workspace/main (the #114 split): compared and restored as well. Never deleted:
  // a record created after the backup stays (reported as keptExtra).
  const backedUp = recordsFromBackup(b.parsed);
  const curRecords = await collectRecords(ref);
  const records = diffRecords(curRecords, backedUp);
  const out = { dryRun: true, target: targetPath, file: b.name, backupCreatedAt: b.parsed.createdAt || null, diff, records };
  if (confirm !== RESTORE_WORD) return out;

  const at = (now || new Date()).toISOString();
  const snapRef = db.collection(SNAPSHOT_COLLECTION).doc();
  // 1. Save the current records next to the snapshot (additive, before anything is overwritten).
  await inChunks(Object.keys(curRecords), (rel) => db.doc(SNAPSHOT_COLLECTION + "/" + snapRef.id + "/records/" + encodeURIComponent(rel)).set({ path: rel, data: curRecords[rel] }));
  // 2. Snapshot of the state blob and the restored state, in one transaction.
  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(ref);
    const before = fresh.exists ? fresh.data() : null;
    if (before && before.state) {
      tx.set(snapRef, {
        label: "before-restore",
        state: before.state,
        stateUpdatedAt: before.updatedAt || null,
        takenAt: at,
        takenBy: actor,
        actedFor: null,
        recordCount: Object.keys(curRecords).length,
      });
    }
    tx.set(ref, { state: fromJson(saved.state), updatedAt: at, updatedBy: actor, restoredFrom: b.name }, { merge: true });
  });
  // 3. Put the backed-up records back (overwrite by id, delete nothing).
  await inChunks(Object.keys(backedUp), (rel) => db.doc(targetPath + "/" + rel).set(fromJson(backedUp[rel])));
  out.dryRun = false;
  out.restoredAt = at;
  return out;
}

module.exports = {
  BUCKET, STATUS_COLLECTION, SNAPSHOT_COLLECTION, TZ, RESTORE_WORD,
  sha256Hex, pacificDate, validDate, toJson, fromJson, collectAll, countsOf, buildBackupText, assertBucketPrivate,
  dailyName, monthlyName, runBackup, diffStates, diffRecords, collectRecords, recordsFromBackup, loadBackup, restoreWorkspace,
};
