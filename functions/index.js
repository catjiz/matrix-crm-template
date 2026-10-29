/**
 * Matrix CRM — Phase 1 write API for approved bots.
 * Auth: Firebase ID token (no Admin Auth bypass).
 */
"use strict";

const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const crypto = require("crypto");
const BK = require("./bot-keys");
const BACKUP = require("./backup");
const GS = require("./gmail-sync");
const LEAD_ALERT = require("./lead-alert");
const admin = require("firebase-admin");

setGlobalOptions({ region: "us-central1", maxInstances: 10 });

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Enrichment rules shared with the app (migrate-v12.js). firebase.json predeploy copies it to
// functions/shared/; the emulator can read it from the repo root.
function loadShared() {
  try {
    return require("./shared/migrate-v12.js");
  } catch (e) {
    return require("../migrate-v12.js");
  }
}
const M = loadShared();

const ALLOWLIST = new Set(["you@example.com", "bot@example.com"]);
const ADMIN_EMAILS = new Set(["you@example.com"]);
const WORKSPACE_PATH = "workspace/main";
const SNAPSHOT_COLLECTION = "workspaceSnapshots";
// Same thresholds as Admin tools > Data size. They apply to the single workspace/main document only;
// with split storage (#103) each record is its own document and only the 900 KB per document limit applies.
const BULK_LIMIT_BYTES = 700 * 1024;
const HARD_LIMIT_BYTES = 950 * 1024;
// Firestore allows 500 writes per transaction; keep room for the config and the snapshot.
const SPLIT_TX_WRITES = 480;
// A snapshot bigger than this goes into chunk documents (workspaceSnapshots/{id}/chunks/{n}).
const SNAPSHOT_INLINE_BYTES = 800 * 1024;
const SNAPSHOT_CHUNK_CHARS = 200 * 1000;

// Storage (issue #103). Reads the workspace inside a transaction: the single workspace/main document,
// or, when its config says settings.storage = 'split', the config plus every record document under
// workspace/main/<collection>/<id>, joined into the same state shape. writeWorkspace writes back only
// what changed (split) or the whole state (single). Every write sets updatedAt on workspace/main.
async function readWorkspace(tx, workspaceRef) {
  const snap = await tx.get(workspaceRef);
  if (!snap.exists) {
    const err = new Error("workspace/main missing");
    err.status = 404;
    throw err;
  }
  const doc = snap.data() || {};
  if (!M.isSplitStorage(doc.state)) return { doc, state: doc.state, split: false };
  const lists = {};
  for (const pair of M.SPLIT_COLLECTIONS) {
    const qs = await tx.get(workspaceRef.collection(pair[1]));
    lists[pair[1]] = qs.docs.map((d) => Object.assign({ id: d.id }, d.data()));
  }
  return { doc, state: M.joinState(doc.state, lists), split: true, base: M.splitBase(lists), configJson: M.canonicalJson(doc.state) };
}

// Size check before writing: whole state (single) or each touched document (split). Returns the plan.
function planWorkspaceWrite(ws, state, opts) {
  if (!ws.split) {
    const size = Buffer.byteLength(JSON.stringify(state), "utf8");
    if (size >= HARD_LIMIT_BYTES || (opts.bulk && size >= BULK_LIMIT_BYTES && !opts.isAdmin)) {
      const err = new Error("workspace/main would be " + Math.round(size / 1024) + " KB; split the workspace (Phase 1.5) first");
      err.status = 413;
      throw err;
    }
    return { split: false, size };
  }
  const d = M.recordDiff(ws.base, state, ws.configJson);
  if (d.writes.length + d.deletes.length > SPLIT_TX_WRITES) {
    const err = new Error((d.writes.length + d.deletes.length) + " records in one call; send at most " + SPLIT_TX_WRITES + " at a time");
    err.status = 413;
    throw err;
  }
  const big = d.writes.find((w) => Buffer.byteLength(JSON.stringify(w.data), "utf8") >= M.SPLIT_DOC_LIMIT);
  if (big) {
    const err = new Error(big.col + "/" + big.id + " would be over the 900 KB document limit");
    err.status = 413;
    throw err;
  }
  if (d.config && Buffer.byteLength(JSON.stringify(d.configState), "utf8") >= M.SPLIT_DOC_LIMIT) {
    const err = new Error("workspace/main config would be over the 900 KB document limit");
    err.status = 413;
    throw err;
  }
  return { split: true, diff: d };
}

function writeWorkspace(tx, workspaceRef, plan, state, patch) {
  if (!plan.split) {
    // update replaces state whole; set with merge would deep-merge it and keep deleted map keys.
    tx.update(workspaceRef, Object.assign({ state }, patch));
    return;
  }
  const d = plan.diff;
  d.writes.forEach((w) => tx.set(workspaceRef.collection(w.col).doc(w.id), w.data));
  d.deletes.forEach((x) => tx.delete(workspaceRef.collection(x.col).doc(x.id)));
  const cfg = Object.assign({}, patch, { recordsUpdatedAt: patch.updatedAt });
  if (d.config) cfg.state = d.configState;
  tx.update(workspaceRef, cfg);
}

// Server-side Time machine copy, in the same transaction. Small copies stay one document as before;
// bigger ones (split storage has no size limit) go into chunks: workspaceSnapshots/{id}/chunks/{n}.
function writeSnapshot(tx, meta, beforeJson) {
  const ref = db.collection(SNAPSHOT_COLLECTION).doc();
  if (Buffer.byteLength(beforeJson, "utf8") < SNAPSHOT_INLINE_BYTES) {
    tx.set(ref, Object.assign({}, meta, { state: JSON.parse(beforeJson) }));
    return;
  }
  const n = Math.ceil(beforeJson.length / SNAPSHOT_CHUNK_CHARS);
  tx.set(ref, Object.assign({}, meta, { chunked: true, chunks: n, bytes: Buffer.byteLength(beforeJson, "utf8") }));
  for (let i = 0; i < n; i++) {
    tx.set(ref.collection("chunks").doc(String(i)), { i, data: beforeJson.slice(i * SNAPSHOT_CHUNK_CHARS, (i + 1) * SNAPSHOT_CHUNK_CHARS) });
  }
}

function cors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Matrix-Bot-Key");
  res.set("Access-Control-Max-Age", "3600");
}

function json(res, status, body) {
  cors(res);
  res.status(status).json(body);
}

function nowIso() {
  return new Date().toISOString();
}

function makeNoteId() {
  return (
    "n_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 8)
  );
}

function isColdStage(stage, state) {
  const s = String(stage || "").toLowerCase();
  if (!s) return false;
  if (s === "cold-leads" || s.includes("cold")) return true;
  const sec = (state.sections || []).find((x) => x.id === "cold-leads");
  if (sec && Array.isArray(sec.stages) && sec.stages.indexOf(stage) !== -1) {
    return true;
  }
  return false;
}

function sectionForStage(state, stage) {
  const sections = state.sections || [];
  for (const sec of sections) {
    if ((sec.stages || []).indexOf(stage) !== -1) return sec.id;
  }
  return null;
}

async function verifyBearer(req) {
  const header = req.get("Authorization") || req.get("authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    const err = new Error("Missing Authorization Bearer token");
    err.status = 401;
    throw err;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(m[1].trim());
    return decoded;
  } catch (e) {
    const err = new Error("Invalid or expired ID token");
    err.status = 401;
    throw err;
  }
}

async function authorizeCaller(decoded, actedFor) {
  const email = String(decoded.email || "").toLowerCase();
  if (!email) {
    const err = new Error("Token has no email");
    err.status = 403;
    throw err;
  }

  // Admin = users/{email}.roles contains "admin" (same as the app and the proposed rules).
  const userSnap = await db.collection("users").doc(email).get();
  const roles = userSnap.exists ? (userSnap.data() || {}).roles : null;
  const isAdmin = Array.isArray(roles) && roles.indexOf("admin") !== -1;
  const onAllowlist = ALLOWLIST.has(email);

  let grant = null;
  const grantSnap = await db.collection("botGrants").doc(email).get();
  if (grantSnap.exists) {
    grant = grantSnap.data() || {};
  }

  const grantActive = grant && grant.status === "active";

  if (!onAllowlist && !grantActive && !isAdmin) {
    const err = new Error(
      "Caller not allowlisted and no active botGrant for " + email
    );
    err.status = 403;
    throw err;
  }

  let resolvedActedFor = null;
  if (actedFor) {
    const wanted = String(actedFor).toLowerCase();
    if (isAdmin) {
      resolvedActedFor = wanted;
    } else if (grantActive && String(grant.sponsorUserEmail || "").toLowerCase() === wanted) {
      resolvedActedFor = wanted;
    } else if (onAllowlist && !grantActive && email === wanted) {
      // Human on allowlist acting as self
      resolvedActedFor = wanted;
    } else {
      const err = new Error(
        "actedFor must match botGrant.sponsorUserEmail (or caller must be admin)"
      );
      err.status = 403;
      throw err;
    }
  } else if (grantActive && grant.sponsorUserEmail) {
    resolvedActedFor = String(grant.sponsorUserEmail).toLowerCase();
  }

  return { email, isAdmin, onAllowlist, grant: grantActive ? grant : null, actedFor: resolvedActedFor };
}

// Bot key (issue #63): X-Matrix-Bot-Key. Behaves like an active botGrant with the key's sections,
// acting for the sponsor, attributed to the key's bot label. 401 for a malformed, unknown or wrong
// key (same message, no oracle), 403 for a revoked one, 429 over 60 calls a minute.
const KEY_LAST_USED_EVERY_MS = 60 * 1000;
async function authorizeBotKey(presented, actedFor) {
  const bad = new Error("Invalid bot key");
  bad.status = 401;
  const parsed = BK.parseBotKey(presented);
  if (!parsed) throw bad;
  const ref = db.collection("botKeys").doc(parsed.keyId);
  const snap = await ref.get();
  const k = snap.exists ? snap.data() || {} : null;
  if (!k || !BK.keyMatchesHash(presented, k.sha256)) throw bad;
  if (k.status !== "active") {
    const err = new Error("Bot key is revoked");
    err.status = 403;
    throw err;
  }
  if (!BK.rateLimitOk(parsed.keyId)) {
    const err = new Error("Rate limit: " + BK.RATE_LIMIT + " calls a minute per bot key");
    err.status = 429;
    throw err;
  }
  const sponsor = String(k.sponsorUserEmail || "").toLowerCase();
  const label = String(k.botEmailLabel || "").toLowerCase();
  if (!sponsor || !label || !k.sections || typeof k.sections !== "object") {
    const err = new Error("Bot key is not set up (sponsor, label and sections are required)");
    err.status = 403;
    throw err;
  }
  if (actedFor && String(actedFor).toLowerCase() !== sponsor) {
    const err = new Error("actedFor must match the bot key's sponsor");
    err.status = 403;
    throw err;
  }
  const last = Date.parse(k.lastUsedAt || "") || 0;
  if (Date.now() - last >= KEY_LAST_USED_EVERY_MS) {
    // Best effort: a failed bookkeeping write never blocks the call.
    try { await ref.set({ lastUsedAt: nowIso() }, { merge: true }); } catch (e) { console.error("botKey lastUsedAt", e); }
  }
  return {
    email: label,
    isAdmin: false,
    onAllowlist: false,
    isBotKey: true,
    sopBotId: typeof k.sopBotId === "string" && k.sopBotId ? k.sopBotId : null,
    isManager: k.role === "manager",
    grant: { status: "active", sponsorUserEmail: sponsor, sections: k.sections },
    actedFor: sponsor,
  };
}

function assertSectionWrite(auth, state, stage) {
  if (!auth.grant || !auth.grant.sections) return; // allowlist / admin: Phase 1 open
  const sectionId = sectionForStage(state, stage) || stage;
  const level = auth.grant.sections[sectionId];
  if (level !== "write" && level !== "read") {
    // Also accept common aliases used in seed
    const aliases = {
      quotes: ["needs-quotation", "quotes"],
      "cold-leads": ["cold-leads"],
      inbound: ["inbound", "inbound-leads", "inbound-jotform"],
      customers: ["customers"],
      tasks: ["tasks"],
      // Pre-Production boards (issue #96, markWon start stage).
      "pre-production": ["pp-sku-jobs", "pp-design", "pp-prototyping", "pp-tooling"],
      preproduction: ["pp-sku-jobs", "pp-design", "pp-prototyping", "pp-tooling"],
    };
    let ok = false;
    for (const [sec, lvl] of Object.entries(auth.grant.sections)) {
      if (lvl !== "write") continue;
      if (sec === sectionId) {
        ok = true;
        break;
      }
      if ((aliases[sec] || []).indexOf(stage) !== -1 || (aliases[sec] || []).indexOf(sectionId) !== -1) {
        ok = true;
        break;
      }
    }
    if (!ok && level !== "write") {
      const err = new Error(
        "botGrant lacks write on section " + sectionId + " (stage " + stage + ")"
      );
      err.status = 403;
      throw err;
    }
  } else if (level === "read") {
    const err = new Error("botGrant is read-only for section " + sectionId);
    err.status = 403;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// SOP owner check (issue #97). Humans (ID token on the allowlist, admins) are never blocked. A bot
// key or botGrant may move a card only when its SOP bot owns the stage being left or the stage being
// entered. A key with role "manager" (Matrix Manager) may move any stage. settings.sopEnforce:
// "off" (default) no check, "warn" allow and warn, "on" refuse with 403.
// ---------------------------------------------------------------------------
const CHANGE_LOG_CAP = 500;

function stageExists(state, stage) {
  if ((state.stages || []).indexOf(stage) !== -1) return true;
  return (state.sections || []).some((sec) => sec && (sec.stages || []).indexOf(stage) !== -1);
}

function sopMode(state) {
  const m = state.settings && state.settings.sopEnforce;
  return m === "warn" || m === "on" ? m : "off";
}

function cleanRequestedBy(v) {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  return s && s.length <= 40 && /^[a-z0-9][a-z0-9-]*$/.test(s) ? s : null;
}

// Result of the check for one stage move. Throws 400 for an unknown stage and 403 when refused.
// A dry run reports a refusal in sop.refused instead of failing.
function checkStageMove(auth, state, deal, op, body, dryRun) {
  const to = String(op.setStage);
  if (!stageExists(state, to)) {
    const err = new Error("Unknown stage: " + to);
    err.status = 400;
    throw err;
  }
  const from = deal.stage;
  const mode = sopMode(state);
  const requestedBy = cleanRequestedBy(op.requestedBy) || cleanRequestedBy(body.requestedBy);
  const isBot = !!auth.isBotKey || (!!auth.grant && !auth.isAdmin);
  const result = { from, to, mode, requestedBy, caller: "human", checked: false, allowed: true, warning: null };
  if (!isBot) return result;
  if (auth.isManager) {
    result.caller = "manager";
    return result;
  }
  result.caller = "bot";
  result.bot = auth.sopBotId || null;
  const c = M.canMoveStage(state, auth.sopBotId, from, to);
  result.checked = true;
  result.allowed = c.allowed;
  result.fromOwner = c.fromOwner || null;
  result.toOwner = c.toOwner || null;
  if (!c.allowed) {
    const who = auth.sopBotId ? M.sopBotLabel(state, auth.sopBotId) : auth.email;
    const text = "Stage move refused: " + who + " owns neither " + from + " nor " + to;
    if (mode === "on" && !dryRun) {
      const err = new Error(text);
      err.status = 403;
      throw err;
    }
    if (mode === "on") result.refused = text;
    if (mode === "warn") result.warning = text.replace("Stage move refused", "Stage move outside the SOP");
  }
  return result;
}

// One change log entry per stage move through the write API.
function logStageMove(state, deal, check, auth, at) {
  if (!Array.isArray(state.changeLog)) state.changeLog = [];
  const entry = {
    id: "chg_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8),
    at,
    who: auth.email,
    by: auth.email,
    actedFor: auth.actedFor || null,
    requestedBy: check.requestedBy,
    source: "write-api",
    action: "stage",
    entityType: "lead",
    entityId: deal.id,
    field: "stage",
    oldValue: check.from,
    newValue: check.to,
    detail: "Stage " + check.from + " to " + check.to,
  };
  if (check.warning) entry.warning = check.warning;
  state.changeLog.push(entry);
  if (state.changeLog.length > CHANGE_LOG_CAP) state.changeLog = state.changeLog.slice(-CHANGE_LOG_CAP);
}

function applyOp(deal, op, state, botEmail) {
  const changes = [];
  if (op.setStage) {
    const newStage = String(op.setStage);
    if (deal.stage !== newStage) {
      deal.stage = newStage;
      deal.stageEnteredAt = nowIso();
      changes.push("setStage:" + newStage);
    }
  }
  if (op.clearFollowUp || isColdStage(deal.stage, state)) {
    if (deal.nextFollowUp != null) {
      deal.nextFollowUp = null;
      changes.push("clearFollowUp");
    }
    if (Array.isArray(deal.followUps) && deal.followUps.length) {
      deal.followUps = [];
      changes.push("clearFollowUps[]");
    }
  }
  if (op.addNote) {
    if (!Array.isArray(deal.notes)) deal.notes = [];
    deal.notes.push({
      id: makeNoteId(),
      text: String(op.addNote),
      createdAt: nowIso(),
      source: botEmail,
    });
    changes.push("addNote");
  }
  // setFields goes through the enrichment rules in patchDeals (no silent overwrite, no deletes).
  // Mirror cold cleanup after all field ops
  if (isColdStage(deal.stage, state)) {
    deal.nextFollowUp = null;
    if (Array.isArray(deal.followUps)) deal.followUps = [];
  }
  deal.updatedAt = nowIso();
  return changes;
}

exports.patchDeals = onRequest({ cors: false }, async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST" && req.method !== "PATCH") {
    json(res, 405, { error: "Use POST or PATCH" });
    return;
  }

  try {
    const keyHeader = String(req.get("X-Matrix-Bot-Key") || "").trim();
    const decoded = keyHeader ? null : await verifyBearer(req);
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const ops = Array.isArray(body.ops) ? body.ops : [];
    // Enrichment patches: same shape as Admin tools > Import enrichment (see MATRIX_WRITE_API.md).
    const patches = Array.isArray(body.patches) ? body.patches.slice() : [];
    // Customer PO upload (issue #20): same JSON as Admin tools > Import PO JSON.
    const poUpserts = Array.isArray(body.poUpserts) ? body.poUpserts : [];
    // New leads and stages (issue #25): same JSON as Admin tools > Import leads JSON.
    const leadBody = Array.isArray(body.leadUpserts) ? { leads: body.leadUpserts }
      : body.leadUpserts && typeof body.leadUpserts === "object" ? body.leadUpserts : null;
    const leadCount = leadBody ? (Array.isArray(leadBody.leads) ? leadBody.leads.length : 0) + (Array.isArray(leadBody.stagesAdd) ? leadBody.stagesAdd.length : 0) : 0;
    // Structured call notes (issues #19, #94): same JSON as Admin tools > Import meeting notes JSON.
    const meetingNotes = Array.isArray(body.meetingNotesImport) ? body.meetingNotesImport
      : body.meetingNotesImport && Array.isArray(body.meetingNotesImport.notes) ? body.meetingNotesImport.notes : [];
    // Billing charges and Bank invoices (issues #55, #124): one billing write op. No delete or void through the API.
    const billingUpserts = Array.isArray(body.billingUpserts) ? body.billingUpserts : [];
    const dryRun = body.dryRun === true;
    if (!ops.length && !patches.length && !poUpserts.length && !leadCount && !meetingNotes.length && !billingUpserts.length) {
      json(res, 400, { error: "body.ops, body.patches, body.poUpserts, body.leadUpserts, body.meetingNotesImport or body.billingUpserts must be non-empty" });
      return;
    }
    // Legacy setFields ride the enrichment rules too.
    for (const op of ops) {
      if (op && op.dealId && op.setFields && typeof op.setFields === "object") {
        patches.push({ leadId: op.dealId, fields: op.setFields });
      }
    }

    let auth;
    if (keyHeader) {
      auth = await authorizeBotKey(keyHeader, body.actedFor || null);
      const refused = BK.checkKeyRequest(body);
      if (refused) {
        json(res, refused.status, { ok: false, error: refused.error });
        return;
      }
    } else {
      auth = await authorizeCaller(decoded, body.actedFor || null);
    }
    if (patches.length && !auth.isAdmin && !auth.grant) {
      json(res, 403, { error: "Enrichment patches need an active botGrant or the admin role" });
      return;
    }
    if (poUpserts.length && !auth.isAdmin && !(auth.grant && auth.grant.sections && auth.grant.sections.customers === "write")) {
      json(res, 403, { error: "poUpserts need a botGrant with customers: write, or the admin role" });
      return;
    }
    if (leadCount && !auth.isAdmin && !(auth.grant && auth.grant.sections && auth.grant.sections.customers === "write")) {
      json(res, 403, { error: "leadUpserts need a botGrant with customers: write and write on the lead's board, or the admin role" });
      return;
    }
    if (meetingNotes.length && !auth.isAdmin && !(auth.grant && auth.grant.sections && auth.grant.sections.customers === "write")) {
      json(res, 403, { error: "meetingNotesImport needs a botGrant with customers: write (and write on the lead's board), or the admin role" });
      return;
    }
    if (billingUpserts.length && !auth.isAdmin && auth.grant && !(auth.grant.sections && auth.grant.sections.billing === "write")) {
      json(res, 403, { error: "billingUpserts need billing: write, or the admin role" });
      return;
    }
    const ifUpdatedAt = body.ifUpdatedAt || null;
    const workspaceRef = db.doc(WORKSPACE_PATH);

    const result = await db.runTransaction(async (tx) => {
      const ws = await readWorkspace(tx, workspaceRef);
      const doc = ws.doc;
      const state = ws.state;
      if (!state || !Array.isArray(state.deals)) {
        const err = new Error("workspace/main.state.deals missing");
        err.status = 500;
        throw err;
      }

      if (ifUpdatedAt && doc.updatedAt && String(doc.updatedAt) !== String(ifUpdatedAt)) {
        const err = new Error("Conflict: ifUpdatedAt mismatch");
        err.status = 409;
        err.currentUpdatedAt = doc.updatedAt;
        throw err;
      }

      const frozen = !!(state.settings && state.settings.botWritesFrozen);
      if (frozen && !auth.isAdmin) {
        const err = new Error("Bot writes are frozen (kill switch)");
        err.status = 423;
        throw err;
      }
      const before = JSON.stringify(state);

      const applied = [];
      const warnings = [];
      let markedWon = 0;
      let markedPaid = 0;
      let skuMoves = 0;
      for (const op of ops) {
        const dealId = op && op.dealId;
        if (!dealId) {
          const err = new Error("Each op requires dealId");
          err.status = 400;
          throw err;
        }
        const deal = state.deals.find((d) => d && d.id === dealId);
        if (!deal) {
          const err = new Error("Deal not found: " + dealId);
          err.status = 404;
          throw err;
        }
        if (op.markWon) {
          // Mark won (issue #96): same steps as the Mark won window. Needs customers: write, write on the
          // lead's board and write on the Pre-Production board the SKU jobs start on.
          const mw = typeof op.markWon === "object" ? op.markWon : op;
          const startStage = mw.startStage || M.skuStageAt(state, 0);
          if (op.setStage || op.setFields || op.addNote || op.clearFollowUp || op.replySet !== undefined) {
            const err = new Error("markWon cannot be combined with other changes in one op");
            err.status = 400;
            throw err;
          }
          if (!auth.isAdmin && auth.grant && !(auth.grant.sections && auth.grant.sections.customers === "write")) {
            const err = new Error("markWon needs customers: write");
            err.status = 403;
            throw err;
          }
          assertSectionWrite(auth, state, deal.stage);
          assertSectionWrite(auth, state, startStage);
          // Starting a won lead in Awaiting Payment (issue #101) is a stage move: the SOP owner check applies.
          let wonSop = null;
          if (startStage === M.AWAITING_STAGE) wonSop = checkStageMove(auth, state, deal, { setStage: startStage }, body, dryRun);
          const won = M.applyMarkWon(state, deal, {
            quoteId: mw.quoteId || null,
            customerId: mw.customerId || null,
            startStage,
            by: auth.email,
            at: nowIso(),
          });
          if (won.error) {
            const err = new Error("markWon " + dealId + ": " + won.error);
            err.status = won.error === "already won" ? 409 : 400;
            throw err;
          }
          markedWon += 1;
          applied.push({ dealId, markWon: { customerId: won.customer.id, quoteId: won.quote ? won.quote.id : null, skuIds: won.skus.map((k) => k.id), startStage }, ...(wonSop ? { sop: wonSop } : {}) });
          if (wonSop && (wonSop.warning || wonSop.refused)) warnings.push(dealId + ": " + (wonSop.warning || wonSop.refused));
          continue;
        }
        if (op.moveSku) {
          // Move one SKU job of the lead between Pre-Production stages (issue #101). Owner-checked like a stage move.
          const mv = typeof op.moveSku === "object" ? op.moveSku : {};
          if (op.setStage || op.setFields || op.addNote || op.clearFollowUp || op.markPaid || op.replySet !== undefined) {
            const err = new Error("moveSku cannot be combined with other changes in one op");
            err.status = 400;
            throw err;
          }
          const sku = (state.skus || []).find((k) => k && k.id === mv.skuId);
          if (!sku || sku.dealId !== dealId) {
            const err = new Error("moveSku: SKU job " + mv.skuId + " is not on lead " + dealId);
            err.status = 404;
            throw err;
          }
          if (mv.stage && sku.stage !== mv.stage) {
            assertSectionWrite(auth, state, sku.stage);
            assertSectionWrite(auth, state, mv.stage);
          }
          const sop = mv.stage ? checkStageMove(auth, state, { stage: sku.stage }, { setStage: mv.stage }, body, dryRun) : null;
          const moved = M.applyMoveSku(state, deal, { skuId: mv.skuId, stage: mv.stage, by: auth.email, actedFor: auth.actedFor, at: nowIso() });
          if (moved.changed) skuMoves += 1;
          applied.push({ dealId, moveSku: moved, ...(sop ? { sop } : {}) });
          if (sop && (sop.warning || sop.refused)) warnings.push(dealId + ": " + (sop.warning || sop.refused));
          continue;
        }
        if (op.markPaid) {
          // Billing reports a Bank invoice paid (issue #101). Needs billing: write (admin and allowlisted humans pass).
          if (!auth.isAdmin && auth.grant && !(auth.grant.sections && auth.grant.sections.billing === "write")) {
            const err = new Error("markPaid needs billing: write");
            err.status = 403;
            throw err;
          }
          const mp = typeof op.markPaid === "object" ? op.markPaid : {};
          if (op.setStage || op.setFields || op.addNote || op.clearFollowUp || op.markWon || op.moveSku || op.replySet !== undefined) {
            const err = new Error("markPaid cannot be combined with other changes in one op");
            err.status = 400;
            throw err;
          }
          const awaiting = (state.skus || []).some((k) => k && !k.archived && k.dealId === dealId && k.stage === M.AWAITING_STAGE);
          const sop = awaiting ? checkStageMove(auth, state, { stage: M.AWAITING_STAGE }, { setStage: M.skuStageAt(state, 0) }, body, dryRun) : null;
          const paid = M.applyMarkPaid(state, deal, {
            bankInvoiceId: mp.bankInvoiceId,
            paidDate: mp.paidDate,
            amount: mp.amount,
            by: auth.email,
            actedFor: auth.actedFor,
            at: nowIso(),
          });
          markedPaid += 1;
          applied.push({ dealId, markPaid: paid, ...(sop ? { sop } : {}) });
          if (sop && (sop.warning || sop.refused)) warnings.push(dealId + ": " + (sop.warning || sop.refused));
          continue;
        }
        const hasCs = op.csSet != null || op.milestonesUpsert != null || op.touchesAdd != null;
        if (hasCs) {
          // Customer Success ops (Owner 2026-10-15): admin, allowlisted humans, or a grant/key with cs: write.
          if (!auth.isAdmin && auth.grant && !(auth.grant.sections && auth.grant.sections.cs === "write")) {
            const err = new Error("csSet, milestonesUpsert and touchesAdd need cs: write");
            err.status = 403;
            throw err;
          }
          const csChanges = M.applyCsOps(state, deal, op, { by: auth.email, actedFor: auth.actedFor, at: nowIso() });
          const csOnly = !op.setStage && !op.addNote && !op.clearFollowUp && !op.setFields && op.replySet === undefined;
          if (csOnly) {
            applied.push({ dealId, changes: csChanges });
            continue;
          }
          op._csChanges = csChanges;
        }
        const targetStage = op.setStage || deal.stage;
        // Who owes the next reply (issue #130): validate before anything is written (400).
        const replyClean = op.replySet !== undefined ? M.replyCleanSet(op.replySet) : undefined;
        let sop = null;
        if (op.setStage) sop = checkStageMove(auth, state, deal, op, body, dryRun);
        assertSectionWrite(auth, state, targetStage);
        const changes = applyOp(deal, op, state, auth.email);
        let replyApplied;
        if (replyClean !== undefined) {
          replyApplied = M.applyReplySet(state, deal, replyClean, { by: auth.email, actedFor: auth.actedFor, at: nowIso() });
          changes.push("replySet");
        }
        const entry = { dealId, changes: (op._csChanges || []).concat(changes) };
        if (replyClean !== undefined) entry.replySet = replyApplied;
        if (sop) {
          entry.sop = sop;
          if (sop.warning || sop.refused) warnings.push(dealId + ": " + (sop.warning || sop.refused));
          if (changes.some((c) => c.indexOf("setStage:") === 0)) logStageMove(state, deal, sop, auth, nowIso());
        }
        applied.push(entry);
      }

      let enrichment = null;
      if (patches.length) {
        const grantSections = auth.isAdmin ? null : (auth.grant && auth.grant.sections) || {};
        const res = M.applyEnrichment(state, patches, {
          by: auth.email,
          actedFor: auth.actedFor,
          isAdmin: auth.isAdmin,
          frozen,
          canWriteLead: (deal) => M.grantCanWriteLead(state, deal, grantSections),
          canWriteCustomers: !grantSections || grantSections.customers === "write",
        });
        enrichment = { summary: res.summary, lines: M.enrichSummaryLines(res.summary) };
      }

      let po = null;
      if (poUpserts.length) {
        const res = M.applyPoUpserts(state, poUpserts, {
          by: auth.email,
          actedFor: auth.actedFor,
          isAdmin: auth.isAdmin,
          frozen,
        });
        po = { summary: res.summary, lines: M.poSummaryLines(res.summary) };
      }

      let leads = null;
      if (leadCount) {
        const res = M.applyLeadUpserts(state, leadBody, {
          by: auth.email,
          actedFor: auth.actedFor,
          isAdmin: auth.isAdmin,
          frozen,
          grantSections: auth.isAdmin ? null : (auth.grant && auth.grant.sections) || {},
        });
        leads = { summary: res.summary, lines: M.leadSummaryLines(res.summary) };
      }

      let meetings = null;
      if (meetingNotes.length) {
        const grantSections = auth.isAdmin ? null : (auth.grant && auth.grant.sections) || {};
        const res = M.applyMeetingNotesImport(state, meetingNotes, {
          by: auth.email,
          actedFor: auth.actedFor,
          isAdmin: auth.isAdmin,
          frozen,
          canWriteLead: (deal) => M.grantCanWriteLead(state, deal, grantSections),
          canWriteCustomers: !grantSections || grantSections.customers === "write",
        });
        meetings = { summary: res.summary, lines: M.meetingSummaryLines(res.summary) };
      }

      let billing = null;
      if (billingUpserts.length) {
        const res = M.applyBillingUpserts(state, billingUpserts, {
          by: auth.email,
          actedFor: auth.actedFor,
          isAdmin: auth.isAdmin,
          frozen,
          at: nowIso(),
        });
        billing = { summary: res.summary, lines: M.billingSummaryLines(res.summary) };
      }

      const writes = ops.length + patches.length + poUpserts.length + leadCount + meetingNotes.length + billingUpserts.length;
      const plan = planWorkspaceWrite(ws, state, { bulk: writes > 1, isAdmin: auth.isAdmin });

      if (dryRun) {
        return { dryRun: true, updatedAt: doc.updatedAt || null, applied, enrichment, po, leads, meetings, billing, ...(warnings.length ? { warnings } : {}) };
      }

      const updatedAt = nowIso();
      const patch = {
        updatedAt,
        updatedBy: auth.email,
      };
      if (auth.actedFor) patch.actedFor = auth.actedFor;

      if (patches.length || poUpserts.length || leadCount || meetingNotes.length || billingUpserts.length || markedWon || markedPaid || skuMoves) {
        // Server-side Time machine: the copy before this import, in the same transaction.
        writeSnapshot(tx, {
          label: patches.length ? "before-enrichment" : poUpserts.length ? "before-po-upload" : leadCount ? "before-lead-import" : meetingNotes.length ? "before-meeting-import" : billingUpserts.length ? "before-billing-upsert" : markedWon ? "before-mark-won" : markedPaid ? "before-mark-paid" : "before-move-sku",
          stateUpdatedAt: doc.updatedAt || null,
          takenAt: updatedAt,
          takenBy: auth.email,
          actedFor: auth.actedFor || null,
        }, before);
      }
      writeWorkspace(tx, workspaceRef, plan, state, patch);
      return { updatedAt, updatedBy: auth.email, actedFor: auth.actedFor || null, applied, enrichment, po, leads, meetings, billing, ...(warnings.length ? { warnings } : {}) };
    });

    json(res, 200, { ok: true, ...result });
  } catch (e) {
    const status = e.status || 500;
    const body = { ok: false, error: e.message || String(e) };
    if (e.currentUpdatedAt) body.currentUpdatedAt = e.currentUpdatedAt;
    if (status >= 500) console.error("patchDeals error", e);
    json(res, status, body);
  }
});

// ---------------------------------------------------------------------------
// Live Jotform intake (issue #11). The Jotform form webhook POSTs each submission to
// /api/jotformIntake?key=SECRET. The lead is written with the same rules as bot lead imports
// (applyLeadUpserts): dedupe, audit, no deletes, no overwrites. Attributed to jotform-intake.
// ---------------------------------------------------------------------------
const JOTFORM_SECRET = defineSecret("JOTFORM_WEBHOOK_SECRET");
const JOTFORM_ACTOR = "jotform-intake";
// New lead alert (issue #48). Both may be empty; an empty URL means no alert.
const LEAD_ALERT_URL = defineSecret("LEAD_ALERT_WEBHOOK_URL");
const LEAD_ALERT_KEY = defineSecret("LEAD_ALERT_WEBHOOK_KEY");

function secretValue(secret) {
  try {
    return String(secret.value() || "").trim();
  } catch (e) {
    return "";
  }
}

// After the intake commit: POST the alert, then record the outcome on the lead (leadAlertSentAt) or in
// the change log (lead-alert-failed). Never throws; the intake response does not depend on it.
async function sendLeadAlert(alert, workspaceRef) {
  try {
    const url = secretValue(LEAD_ALERT_URL);
    if (!url || !alert) return;
    const key = secretValue(LEAD_ALERT_KEY);
    const out = await LEAD_ALERT.postLeadAlert(url, key, alert.payload);
    const at = nowIso();
    await db.runTransaction(async (tx) => {
      const ws = await readWorkspace(tx, workspaceRef);
      const state = ws.state;
      if (!state || !Array.isArray(state.deals)) return;
      if (out.ok) {
        const deal = state.deals.find((d) => d && d.id === alert.dealId);
        if (!deal) return;
        deal.leadAlertSentAt = at;
      } else {
        if (!Array.isArray(state.changeLog)) state.changeLog = [];
        state.changeLog.push({
          id: "chg_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8),
          at,
          who: JOTFORM_ACTOR,
          by: JOTFORM_ACTOR,
          actedFor: null,
          source: "write-api",
          action: "lead-alert-failed",
          entityType: "lead",
          entityId: alert.dealId,
          detail: "Lead alert failed: " + LEAD_ALERT.safeText(out.error, url, key),
        });
        if (state.changeLog.length > CHANGE_LOG_CAP) state.changeLog = state.changeLog.slice(-CHANGE_LOG_CAP);
      }
      const plan = planWorkspaceWrite(ws, state, { bulk: false, isAdmin: false });
      writeWorkspace(tx, workspaceRef, plan, state, { updatedAt: at, updatedBy: JOTFORM_ACTOR });
    });
  } catch (e) {
    console.error("leadAlert error", e && e.message ? e.message : e);
  }
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ""), "utf8");
  const y = Buffer.from(String(b || ""), "utf8");
  if (!x.length || x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

// Text fields of a multipart/form-data body (Jotform webhooks). Files are ignored.
function parseMultipart(raw, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  if (!m) return {};
  const boundary = "--" + (m[1] || m[2]).trim();
  const out = {};
  String(raw || "").split(boundary).forEach((part) => {
    const idx = part.indexOf("\r\n\r\n");
    if (idx === -1) return;
    const head = part.slice(0, idx);
    const name = /name="([^"]*)"/i.exec(head);
    if (!name || /filename=/i.test(head)) return;
    out[name[1]] = part.slice(idx + 4).replace(/\r\n$/, "");
  });
  return out;
}

// { submissionID, formID, answers } from a Jotform webhook request (multipart, urlencoded or JSON).
function readJotformRequest(req) {
  const type = String(req.get("content-type") || "");
  let fields = {};
  if (/multipart\/form-data/i.test(type)) fields = parseMultipart(req.rawBody ? req.rawBody.toString("utf8") : "", type);
  else if (req.body && typeof req.body === "object") fields = req.body;
  else if (typeof req.body === "string") {
    try { fields = JSON.parse(req.body); } catch (e) { fields = {}; }
  }
  let answers = fields.rawRequest;
  if (typeof answers === "string") {
    try { answers = JSON.parse(answers); } catch (e) { answers = null; }
  }
  return { submissionID: fields.submissionID || fields.submission_id || "", formID: fields.formID || "", answers: answers || {} };
}

exports.jotformIntake = onRequest({ cors: false, secrets: [JOTFORM_SECRET, LEAD_ALERT_URL, LEAD_ALERT_KEY] }, async (req, res) => {
  if (req.method !== "POST") {
    json(res, 405, { error: "Use POST" });
    return;
  }
  try {
    const secret = JOTFORM_SECRET.value();
    if (!secret) {
      console.error("jotformIntake: JOTFORM_WEBHOOK_SECRET is not set");
      json(res, 503, { ok: false, error: "Intake is not configured" });
      return;
    }
    const given = (req.query && req.query.key) || req.get("X-Matrix-Key") || "";
    if (!safeEqual(given, secret)) {
      json(res, 403, { ok: false, error: "Bad or missing key" });
      return;
    }
    const sub = readJotformRequest(req);
    const at = nowIso();
    const mapped = M.jotformToLeadEntry(sub, null, at);
    if (mapped.error) {
      json(res, 400, { ok: false, error: mapped.error });
      return;
    }
    const id = mapped.entry.lead.jotformSubmissionId;
    const workspaceRef = db.doc(WORKSPACE_PATH);

    const result = await db.runTransaction(async (tx) => {
      const ws = await readWorkspace(tx, workspaceRef);
      const doc = ws.doc;
      const state = ws.state;
      if (!state || !Array.isArray(state.deals)) {
        const err = new Error("workspace/main.state.deals missing");
        err.status = 500;
        throw err;
      }
      if (state.settings && state.settings.botWritesFrozen) {
        const err = new Error("Bot writes are frozen (kill switch); submission " + id + " not saved");
        err.status = 423;
        throw err;
      }
      // Jotform can send the same submission twice: same id, nothing to do.
      const existing = state.deals.find((d) => d && d.jotformSubmissionId === id);
      if (existing) return { action: "duplicate", dealId: existing.id };

      const before = JSON.stringify(state);
      const res2 = M.applyLeadUpserts(state, { leads: [mapped.entry] }, {
        by: JOTFORM_ACTOR,
        at,
        isAdmin: false,
        grantSections: { inbound: "write", customers: "write" },
      });
      const r = res2.summary.results[0] || {};
      if (r.action === "skipped") {
        const err = new Error("Submission " + id + " skipped: " + (r.reasons || []).join("; "));
        err.status = 422;
        throw err;
      }
      if (r.action === "duplicate") return { action: "duplicate", dealId: r.dealId };
      const plan = planWorkspaceWrite(ws, state, { bulk: false, isAdmin: false });
      writeSnapshot(tx, {
        label: "before-jotform-intake",
        stateUpdatedAt: doc.updatedAt || null,
        takenAt: at,
        takenBy: JOTFORM_ACTOR,
        actedFor: null,
      }, before);
      writeWorkspace(tx, workspaceRef, plan, state, { updatedAt: at, updatedBy: JOTFORM_ACTOR });
      let alert = null;
      if (r.action === "added" && r.dealId) {
        // A brand-new lead only: never a duplicate, a merge or a proposal.
        const deal = state.deals.find((d) => d && d.id === r.dealId);
        if (deal) {
          const contact = (state.contacts || []).find((c) => c && (deal.contactIds || []).indexOf(c.id) !== -1) || null;
          const customer = (state.customers || []).find((c) => c && c.id === deal.customerId) || null;
          const rawRequest = Object.assign({}, sub.answers, { submissionID: sub.submissionID, formID: sub.formID });
          alert = { dealId: deal.id, payload: M.leadAlertPayload(deal, contact, customer, rawRequest) };
        }
      }
      return { action: r.action, dealId: r.dealId || null, proposalId: r.proposalId || null, alert };
    });

    const alert = result.alert;
    delete result.alert;
    // After the commit, outside the transaction. It runs before the response because Cloud Functions
    // stops work once the response is sent. It never throws, so the response below is the same either way.
    await sendLeadAlert(alert, workspaceRef);
    json(res, 200, { ok: true, submissionID: id, ...result });
  } catch (e) {
    const status = e.status || 500;
    console.error("jotformIntake error", status, e.message || e);
    json(res, status, { ok: false, error: e.message || String(e) });
  }
});

/**
 * One-shot seed: botGrants/bot@example.com for Owner sponsorship.
 * Protect with Bearer token from an allowlisted admin (owner@).
 */
exports.seedHelperBotBotGrant = onRequest({ cors: false }, async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    json(res, 405, { error: "Use POST" });
    return;
  }

  try {
    const decoded = await verifyBearer(req);
    const email = String(decoded.email || "").toLowerCase();
    if (!ADMIN_EMAILS.has(email) && email !== "bot@example.com") {
      json(res, 403, { error: "Only owner@ or helperbot@ may seed the HelperBot grant" });
      return;
    }

    const botEmail = "bot@example.com";
    const grant = {
      botEmail,
      sponsorUserEmail: "you@example.com",
      sections: {
        quotes: "write",
        "cold-leads": "write",
        inbound: "write",
        customers: "write",
        tasks: "write",
      },
      status: "active",
      approvedBy: email,
      approvedAt: nowIso(),
      updatedAt: nowIso(),
    };

    await db.collection("botGrants").doc(botEmail).set(grant, { merge: true });
    json(res, 200, { ok: true, id: botEmail, grant });
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error("seedHelperBotBotGrant error", e);
    json(res, status, { ok: false, error: e.message || String(e) });
  }
});

// ---- Backups (issue #111) ----

function backupBucket() {
  return admin.storage().bucket(BACKUP.BUCKET);
}

// Every night at 02:15 Pacific: all Firestore collections to dated JSON in the private bucket, plus
// a status doc backups/{date}. A failed run is recorded as failed (the Admin banner shows it).
// Follow-up sweep (issue #134): every open deal in a stage that needs a next step gets a date when it
// has none (never overwrites). Same transaction path as patchDeals: snapshot first, updatedAt set,
// size plan checked. dryRun returns the plan and writes nothing. At most M.FOLLOWUP_SWEEP_CAP deals.
async function runFollowUpSweep({ dryRun, today }) {
  const date = today || BACKUP.pacificDate(new Date());
  const workspaceRef = db.doc(WORKSPACE_PATH);
  return db.runTransaction(async (tx) => {
    const ws = await readWorkspace(tx, workspaceRef);
    const state = ws.state;
    if (!state || !Array.isArray(state.deals)) {
      const err = new Error("workspace/main.state.deals missing");
      err.status = 500;
      throw err;
    }
    const plan = M.planFollowUpSweep(state, date);
    const out = { dryRun: !!dryRun, today: date, planned: plan.ops.length, applied: 0, skipped: plan.skipped, ops: plan.ops };
    if (dryRun || !plan.ops.length) return out;
    const before = JSON.stringify(state);
    const at = nowIso();
    out.applied = M.applyFollowUpSweep(state, plan, { by: M.FOLLOWUP_SWEEP_ACTOR, at });
    const wplan = planWorkspaceWrite(ws, state, { bulk: true, isAdmin: true });
    writeSnapshot(tx, { label: "before-followup-sweep", stateUpdatedAt: ws.doc.updatedAt || null, takenAt: at, takenBy: M.FOLLOWUP_SWEEP_ACTOR, actedFor: null }, before);
    writeWorkspace(tx, workspaceRef, wplan, state, { updatedAt: at, updatedBy: M.FOLLOWUP_SWEEP_ACTOR });
    return out;
  });
}

// Runs after the backup wrote. A failed sweep is logged and never fails the backup job.
async function sweepAfterBackup() {
  try {
    const r = await runFollowUpSweep({ dryRun: false });
    console.log("followUpSweep", "planned", r.planned, "applied", r.applied, "skipped", JSON.stringify(r.skipped));
  } catch (e) {
    console.error("followUpSweep error", e && e.message ? e.message : e);
  }
}

exports.nightlyBackup = onSchedule(
  { schedule: "15 2 * * *", timeZone: BACKUP.TZ, region: "us-central1", timeoutSeconds: 540, memory: "512MiB" },
  async () => {
    const status = await BACKUP.runBackup({ db, bucket: backupBucket() });
    console.log("nightlyBackup", status.status, status.date, status.bytes);
    if (status.status !== "ok") throw new Error("nightlyBackup failed: " + status.error);
    await sweepAfterBackup();
  }
);

// Admin only (same check as backupAdmin). GET ?dryRun=1 returns the plan and writes nothing.
// POST { confirm: true } runs the sweep once now, with the same audit trail as the nightly run.
exports.followUpSweep = onRequest({ cors: false }, async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  try {
    if (req.method !== "GET" && req.method !== "POST") { json(res, 405, { error: "Use GET ?dryRun=1 or POST { confirm: true }" }); return; }
    const decoded = await verifyBearer(req);
    const email = String(decoded.email || "").toLowerCase();
    const userSnap = email ? await db.collection("users").doc(email).get() : null;
    const roles = userSnap && userSnap.exists ? (userSnap.data() || {}).roles : null;
    if (!Array.isArray(roles) || roles.indexOf("admin") === -1) {
      json(res, 403, { ok: false, error: "Admin only" });
      return;
    }
    const body = req.body && typeof req.body === "object" ? req.body : {};
    let dryRun = true;
    if (req.method === "POST") {
      if (body.confirm !== true) { json(res, 400, { ok: false, error: "POST needs { confirm: true }" }); return; }
      dryRun = false;
    } else {
      const q = String((req.query && req.query.dryRun) || "");
      if (q !== "1" && q !== "true") { json(res, 400, { ok: false, error: "GET needs ?dryRun=1" }); return; }
    }
    const r = await runFollowUpSweep({ dryRun });
    json(res, 200, { ok: true, ...r });
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error("followUpSweep error", e);
    json(res, status, { ok: false, error: e.message || String(e) });
  }
});

// Admin only (users/{email}.roles contains "admin"). POST { action, date, monthly?, target?, confirm? }
//   action "download": { url } signed read URL, valid 10 minutes
//   action "restore":  dry run diff unless confirm is exactly RESTORE; target main (default) or staging
exports.backupAdmin = onRequest({ cors: false }, async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { json(res, 405, { error: "Use POST" }); return; }
  try {
    const decoded = await verifyBearer(req);
    const email = String(decoded.email || "").toLowerCase();
    const userSnap = email ? await db.collection("users").doc(email).get() : null;
    const roles = userSnap && userSnap.exists ? (userSnap.data() || {}).roles : null;
    if (!Array.isArray(roles) || roles.indexOf("admin") === -1) {
      json(res, 403, { ok: false, error: "Admin only" });
      return;
    }
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const monthly = body.monthly === true;
    const date = String(body.date || "");
    if (body.action === "download") {
      if (!BACKUP.validDate(date) && !(monthly && /^\d{4}-\d{2}$/.test(date))) { json(res, 400, { ok: false, error: "Bad date" }); return; }
      const name = monthly ? "monthly/" + date + ".json" : BACKUP.dailyName(date);
      const file = backupBucket().file(name);
      const [exists] = await file.exists();
      if (!exists) { json(res, 404, { ok: false, error: "No backup file " + name }); return; }
      const [url] = await file.getSignedUrl({ action: "read", expires: Date.now() + 10 * 60 * 1000 });
      json(res, 200, { ok: true, url, file: name });
      return;
    }
    if (body.action === "restore") {
      const r = await BACKUP.restoreWorkspace({
        db, bucket: backupBucket(), date, monthly, target: body.target || "main", confirm: body.confirm, actor: email,
      });
      json(res, 200, { ok: true, ...r });
      return;
    }
    json(res, 400, { ok: false, error: "action must be download or restore" });
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error("backupAdmin error", e);
    json(res, status, { ok: false, error: e.message || String(e) });
  }
});

// ---------------------------------------------------------------------------
// Customer Success read (Owner 2026-10-15). GET with X-Matrix-Bot-Key (cs: read or write) or an
// allowlisted ID token. Returns the CS projects (deal.cs) and the six CS views for today (PT).
// ?all=1 also lists every won/customer deal without CS data yet, so a bot can find dealIds.
// ---------------------------------------------------------------------------
exports.csProjects = onRequest({ cors: false }, async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "GET") { json(res, 405, { error: "Use GET" }); return; }
  try {
    const keyHeader = String(req.get("X-Matrix-Bot-Key") || "").trim();
    let auth;
    if (keyHeader) auth = await authorizeBotKey(keyHeader, null);
    else auth = await authorizeCaller(await verifyBearer(req), null);
    const lvl = auth.grant && auth.grant.sections ? auth.grant.sections.cs : null;
    if (!auth.isAdmin && auth.grant && lvl !== "write" && lvl !== "read") {
      json(res, 403, { ok: false, error: "Needs cs: read or write" });
      return;
    }
    const ws = await db.runTransaction((tx) => readWorkspace(tx, db.doc(WORKSPACE_PATH)));
    const state = ws.state || {};
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
    const views = M.csViews(state, today);
    const cust = new Map((state.customers || []).map((c) => [c.id, c.name]));
    const row = (d) => ({ dealId: d.id, title: d.title || d.name || "", company: d.company || cust.get(d.customerId) || "", customerId: d.customerId || null, stage: d.stage, cs: d.cs || null, email: d.email || null, emailTimeline: GS.emailTimeline(d) });
    const ids = (list) => list.map((r) => ({ dealId: r.deal.id, title: r.deal.title || "", reason: r.reason }));
    const out = {
      ok: true, today, stages: M.CS_STAGES, kickoffKeys: M.CS_KICKOFF_KEYS, milestoneStatuses: M.CS_MILESTONE_STATUSES,
      projects: (state.deals || []).filter(M.isCsProject).map(row),
      views: {
        board: views.board.map((b) => ({ stage: b.stage, dealIds: b.deals.map((d) => d.id) })),
        slippedToday: ids(views.slippedToday), customerSilent5: ids(views.customerSilent5), noUpdate7: ids(views.noUpdate7),
        missingOwnerDue: ids(views.missingOwnerDue), paymentPending: ids(views.paymentPending),
      },
    };
    if (req.query && req.query.all) {
      out.candidates = (state.deals || []).filter((d) => d && !M.isCsProject(d) && d.status !== "archived" && (d.customerId || d.status === "won")).map(row);
    }
    json(res, 200, out);
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error("csProjects error", e);
    json(res, status, { ok: false, error: e.message || String(e) });
  }
});

// Gmail sync (issue #54): gmailSync (every 15 minutes) and gmailLink (admin link and unlink). Read-only Gmail.
Object.assign(exports, require("./gmail-functions")({
  db, M, WORKSPACE_PATH, readWorkspace, planWorkspaceWrite, writeWorkspace, verifyBearer, cors, json, nowIso,
}));
