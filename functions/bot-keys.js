/**
 * Bot keys for the write API (issue #63). Pure helpers, no Firebase: the key format, the
 * SHA-256 compare, the request shape allowed for keys, and the per-key rate limit.
 * Key format: mbk_<keyId>_<secret>. keyId = 12 lowercase hex chars; secret = 32+ random bytes
 * as base64url (43+ chars). Only the SHA-256 (hex) of the whole key is stored, in botKeys/{keyId}.
 */
"use strict";

const crypto = require("crypto");

const KEY_RE = /^mbk_([a-f0-9]{12})_([A-Za-z0-9_-]{43,})$/;
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 1000;

// { keyId } for a well-formed key, else null.
function parseBotKey(key) {
  const m = KEY_RE.exec(String(key || ""));
  return m ? { keyId: m[1], secret: m[2] } : null;
}

function makeBotKey() {
  const keyId = crypto.randomBytes(6).toString("hex");
  return { keyId, key: "mbk_" + keyId + "_" + crypto.randomBytes(32).toString("base64url") };
}

function sha256Hex(s) {
  return crypto.createHash("sha256").update(String(s), "utf8").digest("hex");
}

// Constant-time compare of the SHA-256 of the presented key with the stored hex hash.
function keyMatchesHash(presented, storedHex) {
  const a = Buffer.from(sha256Hex(presented), "hex");
  const b = /^[a-f0-9]{64}$/i.test(String(storedHex || "")) ? Buffer.from(String(storedHex), "hex") : null;
  if (!b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Fixed window per key, in memory per instance. Returns true when the call is allowed.
const hits = new Map();
function rateLimitOk(keyId, now) {
  const t = now == null ? Date.now() : now;
  const h = hits.get(keyId);
  if (!h || t - h.start >= RATE_WINDOW_MS) {
    hits.set(keyId, { start: t, n: 1 });
    return true;
  }
  if (h.n >= RATE_LIMIT) return false;
  h.n += 1;
  return true;
}
function resetRateLimits() {
  hits.clear();
}

// What a key may send. Anything that deletes, voids, sends, grants or changes settings or rules
// is refused (403); other unknown keys are a 400. Existing botGrant callers are not checked here.
const BODY_KEYS = new Set(["ops", "patches", "poUpserts", "leadUpserts", "meetingNotesImport", "billingUpserts", "dryRun", "actedFor", "ifUpdatedAt", "requestedBy"]);
const OP_KEYS = new Set(["dealId", "setStage", "addNote", "clearFollowUp", "setFields", "requestedBy", "markWon", "quoteId", "customerId", "startStage", "csSet", "milestonesUpsert", "touchesAdd", "moveSku", "markPaid", "replySet"]);
const FORBIDDEN = /^(delete|remove|void|send|grant|grants|revoke|rules|settings|deals?Delete|archive)/i;

function checkKeyRequest(body) {
  const bad = (status, error) => ({ status, error });
  for (const k of Object.keys(body || {})) {
    if (BODY_KEYS.has(k)) continue;
    if (FORBIDDEN.test(k)) return bad(403, "Bot keys cannot use '" + k + "' (no deletes, voids, sends, grants or settings changes)");
    return bad(400, "Unknown body key for a bot key: " + k);
  }
  for (const op of Array.isArray(body && body.ops) ? body.ops : []) {
    for (const k of Object.keys(op || {})) {
      if (OP_KEYS.has(k)) continue;
      if (FORBIDDEN.test(k)) return bad(403, "Bot keys cannot use op '" + k + "' (no deletes, voids, sends, grants or settings changes)");
      return bad(400, "Unknown op key for a bot key: " + k);
    }
  }
  for (const patch of Array.isArray(body && body.patches) ? body.patches : []) {
    for (const k of Object.keys(patch || {})) {
      if (FORBIDDEN.test(k)) return bad(403, "Bot keys cannot use patch '" + k + "' (no deletes, voids, sends, grants or settings changes)");
    }
  }
  return null;
}

module.exports = { parseBotKey, makeBotKey, sha256Hex, keyMatchesHash, rateLimitOk, resetRateLimits, checkKeyRequest, RATE_LIMIT };
