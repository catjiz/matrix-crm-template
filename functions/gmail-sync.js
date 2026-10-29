/**
 * Matrix CRM: Gmail sync (issue #54). Read-only.
 * Logs customer email (owner@ and sales@) on the matching deal timeline, records quote PDFs sent by us,
 * and keeps email.lastInboundAt / lastOutboundAt / ball / replyWaiting on each deal.
 *
 * Gmail is only ever called with GET on users.getProfile, users.messages, users.history (gmail.readonly).
 * Nothing here sends, drafts, modifies, labels, archives or deletes mail. Only Gmail's short snippet is kept
 * (max 200 chars); bodies and attachments are never stored or downloaded; links in mail are never followed.
 * Pure functions plus runSync(deps); functions/index.js wires Firestore and fetch.
 */
"use strict";

const MAILBOXES = { "you@example.com": "gmail_owner", "sales@example.com": "gmail_info" };
const OWN_DOMAIN = "matrix.com";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const OAUTH_SCOPES = "openid email " + GMAIL_SCOPE;
const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const BACKFILL_DAYS = 60;
const MAX_MESSAGES_PER_RUN = 2000;
const APPLY_CHUNK = 150;
const SNIPPET_MAX = 200;
const REPLY_WAIT_BUSINESS_MS = 4 * 3600 * 1000;
const SOURCE = "gmail-sync";
const ACTOR = "gmail-sync@bots.example";
const TZ = "America/Los_Angeles";
// Stages where a quote PDF we send moves the deal to the quote sent stage (once).
const LEAD_STAGES = ["inbound-jotform", "needs-quotation", "needs-updated-quotation", "needs-quote", "direct-email", "contact-made", "followup-needed"];
const QUOTE_SENT_STAGE = "design-prototyping-quote-sent";
const TOOLING_QUOTED_STAGE = "tooling-production-quoted";
const QUOTE_FOLLOWUP_DAYS = 3;
const STALE_DEFAULT_DAYS = 7;
// Never flagged stale: cold, lost, wishlist, won and the hand-off stages (same idea as the follow-up sweep).
const STALE_SKIP_STAGES = ["cold-leads", "lost", "wishlist", "won", "won-tooling-committed", "production-po-received", "handoff-to-operations",
  "materials-ready", "first-articles", "production-setup", "completed-end-deal", "complete-end-deal"];
const STALE_COMMIT_BATCH = 150;
const MAX_THREAD_MESSAGES = 300;
const MAX_THREAD_PARTICIPANTS = 30;
const MAX_THREAD_DEALS = 20;
// Deal fields the sync and the stale sweep set directly. A human edit made since the read wins (see mergeDealChanges).
const SCALAR_FIELDS = ["stage", "stageEnteredAt", "nextFollowUp", "stale", "staleSince", "customerActivityAt"];
const TRACKED_FIELDS = SCALAR_FIELDS.concat(["lastActivityAt", "email"]);
const FREE_MAIL = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "icloud.com",
  "me.com", "mac.com", "aol.com", "proton.me", "protonmail.com", "pm.me", "gmx.com", "mail.com", "zoho.com", "comcast.net",
  "att.net", "sbcglobal.net", "verizon.net", "cox.net", "yahoo.co.uk", "hotmail.co.uk", "qq.com", "163.com",
]);
const SKIP_LABELS = ["SPAM", "TRASH", "DRAFT"];
const QUOTE_NUMBER_RE = /\b\d{6}[A-Za-z]\d+\b/;

function normEmail(e) {
  let s = String(e || "").trim().toLowerCase();
  const m = s.match(/^([^@\s]+)@([^@\s]+)$/);
  if (!m) return "";
  const local = m[1].replace(/\+.*$/, "");
  return local ? local + "@" + m[2] : "";
}

function domainOf(e) {
  const i = String(e).lastIndexOf("@");
  return i < 0 ? "" : String(e).slice(i + 1).toLowerCase();
}

function isOwn(e) { return domainOf(e) === OWN_DOMAIN; }

function headerValue(headers, name) {
  const h = (headers || []).find((x) => x && String(x.name).toLowerCase() === name.toLowerCase());
  return h ? String(h.value || "") : "";
}

// 'A <a@b.c>, "Last, First" <d@e.f>, g@h.i' -> [{ email, name }]
function parseAddressList(value) {
  const parts = [];
  let cur = "";
  let quoted = false;
  for (const ch of String(value || "")) {
    if (ch === '"') quoted = !quoted;
    if (ch === "," && !quoted) { parts.push(cur); cur = ""; } else cur += ch;
  }
  parts.push(cur);
  const out = [];
  for (const p of parts) {
    const m = p.match(/<([^>]+)>/);
    const email = normEmail(m ? m[1] : p);
    if (!email) continue;
    out.push({ email, name: m ? p.slice(0, p.indexOf("<")).replace(/"/g, "").trim() : "" });
  }
  return out;
}

// Attachment names and mime types from the MIME part tree. Body data is never read.
function collectAttachments(payload, out) {
  out = out || [];
  if (!payload) return out;
  if (payload.filename) out.push({ filename: String(payload.filename), mimeType: String(payload.mimeType || "") });
  (payload.parts || []).forEach((p) => collectAttachments(p, out));
  return out;
}

// Gmail message resource -> the small record this module works with. Keeps no body data.
function parseMessage(raw, mailbox) {
  const h = (raw.payload && raw.payload.headers) || [];
  const from = parseAddressList(headerValue(h, "From"))[0] || { email: "", name: "" };
  const to = parseAddressList(headerValue(h, "To"));
  const cc = parseAddressList(headerValue(h, "Cc"));
  const ms = Number(raw.internalDate);
  const date = ms ? new Date(ms).toISOString() : (Date.parse(headerValue(h, "Date")) ? new Date(headerValue(h, "Date")).toISOString() : "");
  const outbound = !!MAILBOXES[from.email] || from.email === normEmail(mailbox);
  return {
    id: String(raw.id), threadId: String(raw.threadId || ""), mailbox, from, to, cc, date,
    subject: headerValue(h, "Subject").slice(0, 300),
    snippet: String(raw.snippet || "").replace(/\s+/g, " ").trim().slice(0, SNIPPET_MAX),
    labelIds: raw.labelIds || [],
    direction: outbound ? "outbound" : "inbound",
    listUnsubscribe: !!headerValue(h, "List-Unsubscribe"),
    autoSubmitted: /^(?!no$)\S/i.test(headerValue(h, "Auto-Submitted").trim()),
    attachments: collectAttachments(raw.payload).filter((a) => a.filename),
  };
}

// Returns a reason string when the message is not logged, else "".
function skipReason(m) {
  if (!m.from.email || !m.date) return "unparsable";
  if (m.labelIds.some((l) => SKIP_LABELS.indexOf(l) !== -1)) return "label";
  const all = [m.from].concat(m.to, m.cc);
  if (all.every((a) => isOwn(a.email))) return "internal";
  if (m.listUnsubscribe) return "bulk";
  if (m.autoSubmitted) return "auto";
  if (m.direction === "inbound" && /^(no-?reply|do-?not-?reply|mailer-daemon|postmaster)\b/.test(m.from.email.split("@")[0])) return "noreply";
  return "";
}

function threadUrl(mailbox, threadId) {
  return "https://mail.google.com/mail/u/?authuser=" + encodeURIComponent(mailbox) + "#all/" + encodeURIComponent(threadId);
}

function isQuotePdf(a) {
  const name = String(a.filename || "");
  const pdf = /\.pdf$/i.test(name) || /pdf/i.test(a.mimeType || "");
  return pdf && (/quote/i.test(name) || QUOTE_NUMBER_RE.test(name));
}

// ---- Business hours (Mon to Fri 8am to 5pm Pacific) ----
const ptFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
});
// Pacific wall clock as a UTC-style millisecond count, so day arithmetic is plain.
function wallMs(t) {
  const p = {};
  ptFmt.formatToParts(new Date(t)).forEach((x) => { p[x.type] = x.value; });
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
}

function businessMsBetween(fromIso, toIso) {
  const a = wallMs(Date.parse(fromIso));
  const b = wallMs(Date.parse(toIso));
  if (!(b > a)) return 0;
  const DAY = 86400000;
  let total = 0;
  for (let day = Math.floor(a / DAY) * DAY; day <= b; day += DAY) {
    const dow = new Date(day).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const s = Math.max(a, day + 8 * 3600000);
    const e = Math.min(b, day + 17 * 3600000);
    if (e > s) total += e - s;
  }
  return total;
}

function isReplyWaiting(inboundAt, nowIso) {
  return businessMsBetween(inboundAt, nowIso) > REPLY_WAIT_BUSINESS_MS;
}

// Pacific calendar day (yyyy-mm-dd) of an instant.
function ptDay(t) {
  const p = {};
  ptFmt.formatToParts(new Date(t)).forEach((x) => { p[x.type] = x.value; });
  return p.year + "-" + p.month + "-" + p.day;
}

function addBusinessDays(ymd, n) {
  let d = Date.parse(ymd + "T12:00:00Z");
  let left = n;
  while (left > 0) {
    d += 86400000;
    const dow = new Date(d).getUTCDay();
    if (dow !== 0 && dow !== 6) left -= 1;
  }
  return new Date(d).toISOString().slice(0, 10);
}

function coldStageList(state) {
  const sec = (state.sections || []).find((x) => x && x.id === "cold-leads");
  return sec && Array.isArray(sec.stages) ? sec.stages : ["cold-leads"];
}

// ---- Matching ----
function buildIndex(state) {
  const exact = new Map();
  const domains = new Map();
  const customerOf = new Map();
  function addExact(email, ref) {
    const e = normEmail(email);
    if (!e || isOwn(e)) return;
    if (!exact.has(e)) exact.set(e, []);
    exact.get(e).push(ref);
  }
  function addDomain(d, customerId) {
    d = String(d || "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[\/?#].*$/, "");
    if (!d || d === OWN_DOMAIN || FREE_MAIL.has(d) || !customerId) return;
    if (!domains.has(d)) domains.set(d, new Set());
    domains.get(d).add(customerId);
  }
  const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  (state.contacts || []).forEach((c) => {
    if (!c) return;
    [c.email].concat(list(c.emails), list(c.extraEmails)).forEach((e) => {
      addExact(e, { contactId: c.id, customerId: c.customerId || null });
      const ne = normEmail(e);
      if (ne) addDomain(domainOf(ne), c.customerId);
    });
  });
  (state.customers || []).forEach((c) => {
    if (!c) return;
    customerOf.set(c.id, c);
    [c.email].concat(list(c.emails)).forEach((e) => addExact(e, { contactId: null, customerId: c.id }));
    addDomain(c.domain, c.id);
    addDomain(c.website, c.id);
  });
  return { exact, domains };
}

function dealTime(d) {
  return String(d.lastActivityAt || d.updatedAt || d.createdAt || "");
}

function isLost(state, d) {
  const lost = (state.stages || []).filter((s) => /^lost/.test(s));
  return lost.indexOf(d.stage) !== -1 || d.status === "lost";
}
function isArchived(d) { return d.status === "archived" || d.archived === true; }
function isWon(d) { return d.status === "won" || d.status === "converted" || d.stage === "won" || d.stage === "won-tooling-committed"; }

// Deals reachable from a match ref, ranked: most recently active open deal, else most recent won deal.
function pickDeals(state, refs, withLost) {
  const ids = new Set();
  const cust = new Set();
  refs.forEach((r) => { if (r.customerId) cust.add(r.customerId); });
  const contactIds = new Set(refs.map((r) => r.contactId).filter(Boolean));
  const cands = (state.deals || []).filter((d) => {
    if (!d || isArchived(d) || ids.has(d.id)) return false;
    return (d.contactIds || []).some((c) => contactIds.has(c)) || (d.customerId && cust.has(d.customerId));
  });
  // Deals tied to the exact contact come before deals that only share the customer.
  const direct = (d) => ((d.contactIds || []).some((c) => contactIds.has(c)) ? 1 : 0);
  const rank = (a, b) => direct(b) - direct(a) || dealTime(b).localeCompare(dealTime(a)) || String(a.id).localeCompare(String(b.id));
  const open = cands.filter((d) => !isLost(state, d) && !isWon(d)).sort(rank);
  const won = cands.filter((d) => isWon(d) && !isLost(state, d)).sort(rank);
  const ordered = open.concat(won);
  if (withLost) ordered.lost = cands.filter((d) => isLost(state, d)).sort(rank);
  return ordered;
}

// addresses: external addresses of the message in priority order. Returns { deals: [deal...], lost: [deal...], via }
// or null. deals are the open then won deals; lost ones are only linked to the thread, never changed.
function matchDeals(state, index, addresses) {
  for (const a of addresses) {
    const refs = index.exact.get(a);
    if (refs) {
      const deals = pickDeals(state, refs, true);
      if (deals.length) return { deals: deals.slice(), lost: deals.lost || [], via: "email" };
    }
  }
  for (const a of addresses) {
    const d = domainOf(a);
    const set = index.domains.get(d);
    if (FREE_MAIL.has(d) || !set || set.size !== 1) continue;
    const deals = pickDeals(state, [{ contactId: null, customerId: [...set][0] }], true);
    if (deals.length) return { deals: deals.slice(), lost: deals.lost || [], via: "domain" };
  }
  return null;
}

// Deals already linked to a thread, or to an address that sits on a linked thread. threadIndex: Map(addr -> Set(dealId)).
function threadLinkedDeals(state, thread, addresses, threadIndex) {
  const ids = new Set(thread ? thread.dealIds || [] : []);
  addresses.forEach((a) => { (threadIndex.get(a) || []).forEach((id) => ids.add(id)); });
  const byId = new Map((state.deals || []).map((d) => [d.id, d]));
  const cands = [...ids].map((id) => byId.get(id)).filter((d) => d && !isArchived(d));
  const rank = (a, b) => dealTime(b).localeCompare(dealTime(a)) || String(a.id).localeCompare(String(b.id));
  const live = cands.filter((d) => !isLost(state, d)).sort((a, b) => (isWon(a) ? 1 : 0) - (isWon(b) ? 1 : 0) || rank(a, b));
  return { deals: live, lost: cands.filter((d) => isLost(state, d)) };
}

function threadAddressIndex(threads) {
  const idx = new Map();
  threads.forEach((t) => {
    (t.participants || []).forEach((a) => {
      if (!idx.has(a)) idx.set(a, new Set());
      (t.dealIds || []).forEach((id) => idx.get(a).add(id));
    });
  });
  return idx;
}

// Every external address on the message, the direction's own side first (sender when inbound, recipients when outbound).
function allExternal(m) {
  const first = externalAddresses(m);
  const seen = new Set(first);
  const rest = [m.from].concat(m.to, m.cc).map((a) => a.email).filter((e) => e && !isOwn(e) && !seen.has(e) && seen.add(e));
  return first.concat(rest);
}

function externalAddresses(m) {
  const list = m.direction === "inbound" ? [m.from] : m.to.concat(m.cc);
  const seen = new Set();
  return list.map((a) => a.email).filter((e) => e && !isOwn(e) && !seen.has(e) && seen.add(e));
}

function makeId(prefix) {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

// ---- Apply ----
function snapshotDeal(d) {
  const o = {};
  TRACKED_FIELDS.forEach((k) => { o[k] = d[k] === undefined ? undefined : JSON.parse(JSON.stringify(d[k])); });
  return o;
}

// Collects, for one run, which fields changed on which deals, with the values the deal had before its first change.
// Call begin(d) before the first mutation of a deal; set() is begin + assign + touch.
function makeRecorder() {
  const fields = new Map(); // dealId -> Set(field)
  const before = new Map(); // dealId -> snapshot
  const rec = {
    fields, before,
    begin(d) { if (!before.has(d.id)) before.set(d.id, snapshotDeal(d)); },
    touch(d, f) { if (!fields.has(d.id)) fields.set(d.id, new Set()); fields.get(d.id).add(f); },
    set(d, f, v) {
      if (JSON.stringify(d[f] === undefined ? null : d[f]) === JSON.stringify(v === undefined ? null : v)) return;
      rec.begin(d);
      d[f] = v;
      rec.touch(d, f);
    },
    // dealId -> { field: { old, new } } for the scalar fields that really differ from the start of the run.
    scalars(state) {
      const out = new Map();
      const byId = new Map((state.deals || []).map((d) => [d.id, d]));
      fields.forEach((_, id) => {
        const d = byId.get(id);
        const b = before.get(id);
        if (!d || !b) return;
        const o = {};
        SCALAR_FIELDS.forEach((k) => {
          if (JSON.stringify(b[k] === undefined ? null : b[k]) !== JSON.stringify(d[k] === undefined ? null : d[k])) o[k] = { old: b[k] === undefined ? null : b[k], new: d[k] === undefined ? null : d[k] };
        });
        if (Object.keys(o).length) out.set(id, o);
      });
      return out;
    },
  };
  return rec;
}

// What commit() hands to mergeDealChanges for a deal.
function mergeInfo(res, id) { return { fields: res.fields.get(id) || new Set(), scalars: (res.scalars.get(id)) || {} }; }

// ball / replyWaiting / last*At from the deal's stored email object, its Gmail timeline entries and extra (new) messages
// [{ direction, date, url }]. Takes the newest of each, so older mail never moves a date back and a re-run changes nothing.
// Sets d.email, customerActivityAt and lastActivityAt (when newer mail arrived) and records the changed fields.
function recomputeEmail(d, now, rec, extra) {
  const mails = (d.timeline || []).filter((t) => t && t.type === "email" && String(t.id).indexOf("gmail:") === 0)
    .map((t) => ({ direction: t.direction, date: t.date, url: t.threadUrl })).concat(extra || []);
  const cur = d.email && typeof d.email === "object" ? d.email : {};
  let lastIn = cur.lastInboundAt || null;
  let lastOut = cur.lastOutboundAt || null;
  const curNewest = [lastIn, lastOut].filter(Boolean).sort().pop() || "";
  let newestDate = "";
  let newestUrl = null;
  mails.forEach((x) => {
    if (!x.date) return;
    if (x.direction === "inbound") { if (!lastIn || x.date > lastIn) lastIn = x.date; } else if (!lastOut || x.date > lastOut) lastOut = x.date;
    if (x.date >= newestDate) { newestDate = x.date; newestUrl = x.url || newestUrl; }
  });
  if (!lastIn && !lastOut) return;
  const ball = lastIn && (!lastOut || lastIn > lastOut) ? "us" : "them";
  const url = newestDate && newestDate >= curNewest ? newestUrl || cur.lastThreadUrl : cur.lastThreadUrl;
  const next = { lastInboundAt: lastIn, lastOutboundAt: lastOut, lastThreadUrl: url, ball, replyWaiting: ball === "us" && isReplyWaiting(lastIn, now) };
  let any = false;
  Object.keys(next).forEach((k) => {
    if (cur[k] !== next[k] && !(cur[k] == null && next[k] == null)) { any = true; rec.touch(d, "email." + k); }
  });
  if (any) { rec.begin(d); d.email = Object.assign({}, cur, next); }
  if (lastIn) rec.set(d, "customerActivityAt", lastIn);
  const newest = [lastIn, lastOut].filter(Boolean).sort().pop();
  if (newest > String(d.lastActivityAt || "")) rec.set(d, "lastActivityAt", newest);
}

function valueAt(o, path) {
  return path.split(".").reduce((x, k) => (x == null ? undefined : x[k]), o);
}

// One change log entry per changed deal, by gmail-sync@bots.example, with old and new values; stamps updatedAt.
function logChanges(state, rec, now, action, label) {
  const byId = new Map((state.deals || []).map((d) => [d.id, d]));
  rec.fields.forEach((fields, id) => {
    const d = byId.get(id);
    d.updatedAt = now;
    const b = rec.before.get(id) || {};
    const list = [...fields].sort();
    const oldValue = {};
    const newValue = {};
    list.forEach((f) => {
      if (f === "timeline" || f === "docLinks") { oldValue[f] = null; newValue[f] = (d[f] || []).filter((x) => x && (x.source === SOURCE || x.addedBy === SOURCE)).length + " from gmail-sync"; return; }
      const o = valueAt(b, f);
      oldValue[f] = o === undefined ? null : o;
      const n = valueAt(d, f);
      newValue[f] = n === undefined ? null : n;
    });
    state.changeLog.push({
      id: makeId("chg"), at: now, who: ACTOR, by: ACTOR, actedFor: null, source: SOURCE, action: action || "gmail-sync",
      entityType: "lead", entityId: id, field: list.join(", "), oldValue, newValue,
      detail: (label || "Gmail sync updated ") + (d.title || d.company || id) + ": " + list.join(", "),
    });
  });
}

function finishRun(state, rec, now, res, action, label) {
  logChanges(state, rec, now, action, label);
  res.changedDealIds = [...rec.fields.keys()];
  res.fields = rec.fields;
  res.scalars = rec.scalars(state);
  return res;
}

// replyWaiting re-age with no new mail. state.deals holds only candidates (email.ball == "us", replyWaiting not true).
// Sets replyWaiting on those whose wait crossed 4 business hours. Returns { changedDealIds }.
function ageReplies(state, now) {
  if (!Array.isArray(state.changeLog)) state.changeLog = [];
  const rec = makeRecorder();
  (state.deals || []).forEach((d) => {
    if (!d || !d.email || d.email.ball !== "us" || d.email.replyWaiting === true || !d.email.lastInboundAt) return;
    if (!isReplyWaiting(d.email.lastInboundAt, now)) return;
    rec.begin(d);
    recomputeEmail(d, now, rec);
  });
  return finishRun(state, rec, now, {});
}

// ---- Thread index (workspace/main/emailThreads/{threadId}) ----
// Adds one message to its thread record. Returns { thread, fresh, changed }: fresh is false when the message was already
// counted (a re-run), so counts and dates never double.
function upsertThread(threads, m, dealIds, participants, now) {
  let t = threads.get(m.threadId);
  let changed = false;
  if (!t) {
    t = {
      id: m.threadId, subject: m.subject, participants: [], mailbox: m.mailbox, mailboxes: [], lastMessageAt: "", lastDirection: m.direction,
      snippet: "", messageCount: 0, messageIds: [], dealIds: [], firstMessageAt: m.date, lastInboundAt: null, lastOutboundAt: null, threadUrl: threadUrl(m.mailbox, m.threadId),
    };
    threads.set(m.threadId, t);
    changed = true;
  }
  const fresh = (t.messageIds || []).indexOf(m.id) === -1;
  if (fresh) {
    t.messageIds = (t.messageIds || []).concat(m.id).slice(-MAX_THREAD_MESSAGES);
    t.messageCount = (t.messageCount || 0) + 1;
    if (!t.subject || m.date < (t.firstMessageAt || "9")) { t.subject = m.subject || t.subject; t.firstMessageAt = m.date; }
    if (m.date >= (t.lastMessageAt || "")) {
      t.lastMessageAt = m.date; t.lastDirection = m.direction; t.snippet = m.snippet; t.mailbox = m.mailbox; t.threadUrl = threadUrl(m.mailbox, m.threadId);
    }
    if (m.direction === "inbound") { if (m.date > (t.lastInboundAt || "")) t.lastInboundAt = m.date; } else if (m.date > (t.lastOutboundAt || "")) t.lastOutboundAt = m.date;
    if ((t.mailboxes || []).indexOf(m.mailbox) === -1) t.mailboxes = (t.mailboxes || []).concat(m.mailbox);
    const have = new Set(t.participants || []);
    const add = participants.filter((a) => !have.has(a));
    if (add.length) t.participants = (t.participants || []).concat(add).slice(0, MAX_THREAD_PARTICIPANTS);
    changed = true;
  }
  const ids = [...new Set((t.dealIds || []).concat(dealIds))].slice(0, MAX_THREAD_DEALS);
  if (ids.length !== (t.dealIds || []).length) { t.dealIds = ids; changed = true; }
  if (changed) t.updatedAt = now;
  return { thread: t, fresh, changed };
}

// Mutates the given state (deals, changeLog; contacts, customers and stages are only read) for the parsed messages.
// opts.index is the contact/customer index (built once per run by the caller; built here when absent). opts.threads is the
// Map of thread records already stored (threadId -> record); it is updated in place. Returns
// { changedDealIds, review: Map<email, entry>, threads: [record...], logged, skipped, unmatched, fields, scalars }.
// Re-running the same messages changes nothing.
function applyMessages(state, messages, opts) {
  const now = (opts && opts.now) || new Date().toISOString();
  const index = (opts && opts.index) || buildIndex(state);
  const threads = (opts && opts.threads) || new Map();
  const rec = makeRecorder();
  const review = new Map();
  const res = { logged: 0, skipped: 0, unmatched: 0, duplicates: 0 };
  if (!Array.isArray(state.changeLog)) state.changeLog = [];
  const byId = new Map((state.deals || []).map((d) => [d.id, d]));
  const threadIdx = threadAddressIndex(threads);
  const changedThreads = new Set();
  const extras = new Map(); // dealId -> [{ direction, date, url }]
  const today = ptDay(now);
  const cold = coldStageList(state);
  const settings = state.settings || {};
  const quoteStage = settings.gmailQuoteStage === TOOLING_QUOTED_STAGE ? TOOLING_QUOTED_STAGE : QUOTE_SENT_STAGE;
  const stageKnown = (s) => !Array.isArray(state.stages) || !state.stages.length || state.stages.indexOf(s) !== -1;

  messages.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach((m) => {
    if (skipReason(m)) { res.skipped += 1; return; }
    const addrs = externalAddresses(m);
    const all = allExternal(m);
    // 1. exact contact email, 2. customer domain (never free mail), 3. a thread or address already linked to a deal.
    const hit = matchDeals(state, index, all);
    const linked = threadLinkedDeals(state, threads.get(m.threadId), all, threadIdx);
    const deals = hit ? hit.deals.slice() : [];
    const lost = hit ? hit.lost.slice() : [];
    linked.deals.forEach((d) => { if (deals.indexOf(d) === -1) deals.push(d); });
    linked.lost.forEach((d) => { if (lost.indexOf(d) === -1) lost.push(d); });
    if (!deals.length) {
      if (m.direction === "inbound" && addrs[0]) {
        res.unmatched += 1;
        const e = addrs[0];
        const prev = review.get(e);
        review.set(e, {
          email: e, name: m.from.name || (prev && prev.name) || "", firstSeen: prev ? prev.firstSeen : m.date, lastSeen: m.date,
          count: (prev ? prev.count : 0) + 1, lastSubject: m.subject, mailbox: m.mailbox, gmailThreadId: m.threadId, ids: (prev ? prev.ids : []).concat(m.id),
        });
      }
      return;
    }
    // The deal that already holds this message's timeline line stays the target (ranking can shift as dates update).
    const holder = deals.find((d) => (d.timeline || []).some((t) => t && t.id === "gmail:" + m.id));
    if (holder && holder !== deals[0]) { deals.splice(deals.indexOf(holder), 1); deals.unshift(holder); }
    const up = upsertThread(threads, m, deals.concat(lost).map((d) => d.id), all, now);
    if (up.changed) {
      changedThreads.add(m.threadId);
      (up.thread.participants || []).forEach((a) => {
        if (!threadIdx.has(a)) threadIdx.set(a, new Set());
        (up.thread.dealIds || []).forEach((id) => threadIdx.get(a).add(id));
      });
    }

    const url = threadUrl(m.mailbox, m.threadId);
    const sentQuote = m.direction === "outbound" && m.attachments.some(isQuotePdf);
    deals.forEach((deal, i) => {
      const isTarget = i === 0;
      rec.begin(deal);
      let newToDeal = false;
      // The timeline line and quote doc links go on the one best deal only (as before); the thread is on all of them.
      if (isTarget) {
        const entryId = "gmail:" + m.id;
        if (!Array.isArray(deal.timeline)) deal.timeline = [];
        if (deal.timeline.some((t) => t && t.id === entryId)) res.duplicates += 1;
        else {
          newToDeal = true;
          const entry = {
            id: entryId, type: "email", direction: m.direction, mailbox: m.mailbox,
            from: m.from.email, to: m.to.map((a) => a.email), date: m.date, at: m.date,
            subject: m.subject, text: m.subject || "(no subject)", snippet: m.snippet,
            gmailThreadId: m.threadId, gmailMessageId: m.id, threadUrl: url, url, source: SOURCE,
          };
          if (deals.length > 1) entry.alsoMatched = deals.slice(1).map((d) => d.id);
          deal.timeline.push(entry);
          rec.touch(deal, "timeline");
          res.logged += 1;
          // Quote PDFs we sent: a doc link record, idempotent by message id plus filename.
          if (m.direction === "outbound") {
            m.attachments.filter(isQuotePdf).forEach((a) => {
              if (!Array.isArray(deal.docLinks)) deal.docLinks = [];
              if (deal.docLinks.some((r) => r && r.gmailMessageId === m.id && r.name === a.filename)) return;
              deal.docLinks.push({
                id: makeId("doc"), type: "Quote", name: a.filename, url, sentAt: m.date.slice(0, 10),
                recipient: m.to.map((x) => x.email).join(", "), gmailMessageId: m.id, gmailThreadId: m.threadId,
                addedAt: now, addedBy: SOURCE,
              });
              rec.touch(deal, "docLinks");
            });
          }
        }
      }
      if (!(up.fresh || newToDeal)) return;
      if (!extras.has(deal.id)) extras.set(deal.id, []);
      extras.get(deal.id).push({ direction: m.direction, date: m.date, url });

      // Next step, stale flag and stage only change on open deals that are not cold, and only for mail newer than what
      // Matrix already knew (a backfill of old mail never moves anything back).
      if (isWon(deal) || isLost(state, deal) || cold.indexOf(deal.stage) !== -1) return;
      const newer = m.date > String(deal.lastActivityAt || "");
      if (!newer) return;
      if (m.direction === "inbound" && deal.nextFollowUp && String(deal.nextFollowUp).slice(0, 10) < today) rec.set(deal, "nextFollowUp", today);
      if (deal.stale) { rec.set(deal, "stale", false); rec.set(deal, "staleSince", null); }
      if (isTarget && sentQuote && LEAD_STAGES.indexOf(deal.stage) !== -1 && stageKnown(quoteStage) && (!deal.stageEnteredAt || m.date >= String(deal.stageEnteredAt))) {
        rec.set(deal, "stage", quoteStage);
        rec.set(deal, "stageEnteredAt", now);
        if (!deal.nextFollowUp || String(deal.nextFollowUp).slice(0, 10) < today) rec.set(deal, "nextFollowUp", addBusinessDays(today, QUOTE_FOLLOWUP_DAYS));
      }
    });
  });

  // Recompute the email object, customer activity and last activity on the deals that got mail.
  extras.forEach((list, id) => recomputeEmail(byId.get(id), now, rec, list));
  res.review = review;
  res.threads = [...changedThreads].map((id) => threads.get(id));
  return finishRun(state, rec, now, res);
}

// ---- Stale flag (nightly) ----
function staleDaysFor(state, stage) {
  const own = state && state.staleDays && state.staleDays[stage];
  return typeof own === "number" && own >= 1 ? own : STALE_DEFAULT_DAYS;
}

// Newest of the dates that count as a touch: our activity, customer activity, either direction of mail, stage entry.
function lastTouchMs(d) {
  const e = d.email && typeof d.email === "object" ? d.email : {};
  const c = [d.lastActivityAt, d.customerActivityAt, e.lastInboundAt, e.lastOutboundAt, d.stageEnteredAt].filter(Boolean).map((x) => Date.parse(x)).filter((n) => !isNaN(n));
  if (c.length) return Math.max(...c);
  const f = Date.parse(d.createdAt || d.updatedAt || "");
  return isNaN(f) ? null : f;
}

function staleCandidate(state, d, cold) {
  if (!d || isArchived(d) || (d.status || "open") !== "open") return false;
  return STALE_SKIP_STAGES.indexOf(d.stage) === -1 && cold.indexOf(d.stage) === -1 && !isLost(state, d);
}

// Open deals with no touch for N days (state.staleDays per stage, default 7) get stale: true and staleSince; a deal that was
// touched since has the flag cleared. Nothing else changes. Returns { changedDealIds, flagged, cleared, fields, scalars }.
function applyStale(state, now) {
  if (!Array.isArray(state.changeLog)) state.changeLog = [];
  const rec = makeRecorder();
  const cold = coldStageList(state);
  const nowMs = Date.parse(now);
  const res = { flagged: 0, cleared: 0 };
  (state.deals || []).forEach((d) => {
    if (!d) return;
    const ok = staleCandidate(state, d, cold);
    const t = ok ? lastTouchMs(d) : null;
    const isStale = ok && t != null && nowMs - t >= staleDaysFor(state, d.stage) * 86400000;
    if (isStale && d.stale !== true) {
      rec.set(d, "stale", true); rec.set(d, "staleSince", now); res.flagged += 1;
    } else if (!isStale && d.stale === true) {
      rec.set(d, "stale", false); rec.set(d, "staleSince", null); res.cleared += 1;
    }
  });
  return finishRun(state, rec, now, res, "gmail-stale", "Stale flag changed on ");
}

// Applies this run's changes (mine) onto the deal as it is stored now (fresh), so a human edit made since we read it is
// kept. Only the fields the sync writes are taken from mine: our timeline and docLinks entries, email, lastActivityAt,
// updatedAt and, from info.scalars ({ field: { old, new } }), the scalar fields whose stored value is still the old one.
function mergeDealChanges(fresh, mine, info) {
  const out = Object.assign({}, fresh);
  const addNew = (key, mark) => {
    const have = new Set((fresh[key] || []).map((x) => x && x.id));
    const add = (mine[key] || []).filter((x) => x && x[mark] === SOURCE && !have.has(x.id));
    if (add.length) out[key] = (fresh[key] || []).concat(add);
  };
  addNew("timeline", "source");
  addNew("docLinks", "addedBy");
  const touched = info && info.fields ? [...info.fields] : null;
  if (mine.email && (!touched || touched.some((f) => f.indexOf("email.") === 0 || f === "email"))) out.email = mine.email;
  if (String(mine.lastActivityAt || "") > String(fresh.lastActivityAt || "")) out.lastActivityAt = mine.lastActivityAt;
  if (info && info.scalars) {
    const same = (a, b) => JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b);
    const skip = new Set();
    Object.keys(info.scalars).forEach((k) => {
      if (skip.has(k)) return;
      const c = info.scalars[k];
      if (same(fresh[k], c.old)) { out[k] = c.new; return; }
      if (k === "stage") skip.add("stageEnteredAt");
    });
  }
  out.updatedAt = mine.updatedAt;
  return out;
}

// Merges new review entries into the stored doc for that sender. Counts each message once (seenIds, last 50).
function mergeReview(existing, e) {
  const seen = (existing && existing.seenIds) || [];
  const fresh = e.ids.filter((id) => seen.indexOf(id) === -1);
  if (!fresh.length) return null;
  const base = existing || { email: e.email, firstSeen: e.firstSeen, count: 0 };
  return Object.assign({}, base, {
    name: e.name || base.name || "", lastSeen: e.lastSeen > (base.lastSeen || "") ? e.lastSeen : base.lastSeen,
    count: (base.count || 0) + fresh.length, lastSubject: e.lastSubject, mailbox: e.mailbox, gmailThreadId: e.gmailThreadId,
    seenIds: seen.concat(fresh).slice(-50),
  });
}

// ---- Gmail REST client (plain fetch, GET only, gmail.readonly) ----
const MESSAGE_FIELDS = "id,threadId,labelIds,snippet,internalDate,payload";

function httpError(res, what) {
  const e = new Error(what + " failed (" + res.status + ")");
  e.status = res.status;
  return e;
}

const FORM = { "Content-Type": "application/x-www-form-urlencoded" };

// Exchanges an authorization code from the browser code client (redirect_uri "postmessage").
async function exchangeCode(fetchFn, o) {
  const res = await fetchFn("https://oauth2.googleapis.com/token", {
    method: "POST", headers: FORM,
    body: new URLSearchParams({ code: o.code, client_id: o.clientId, client_secret: o.clientSecret, redirect_uri: o.redirectUri || "postmessage", grant_type: "authorization_code" }).toString(),
  });
  if (!res.ok) throw httpError(res, "Code exchange");
  return res.json();
}

async function revokeToken(fetchFn, token) {
  const res = await fetchFn("https://oauth2.googleapis.com/revoke", { method: "POST", headers: FORM, body: new URLSearchParams({ token }).toString() });
  return res.ok;
}

// Every Gmail call below is a GET on users.getProfile, users.messages or users.history.
function makeGmailClient(fetchFn, o) {
  let access = null;
  async function accessToken() {
    if (access) return access;
    const res = await fetchFn("https://oauth2.googleapis.com/token", {
      method: "POST", headers: FORM,
      body: new URLSearchParams({ client_id: o.clientId, client_secret: o.clientSecret, refresh_token: o.refreshToken, grant_type: "refresh_token" }).toString(),
    });
    if (!res.ok) throw httpError(res, "Token refresh");
    access = (await res.json()).access_token;
    return access;
  }
  async function get(path, params) {
    const qs = new URLSearchParams();
    Object.keys(params || {}).forEach((k) => { if (params[k] != null && params[k] !== "") qs.set(k, String(params[k])); });
    const res = await fetchFn(GMAIL_BASE + path + (qs.toString() ? "?" + qs : ""), {
      method: "GET", headers: { Authorization: "Bearer " + (await accessToken()) },
    });
    if (!res.ok) throw httpError(res, "Gmail " + path);
    return res.json();
  }
  return {
    getProfile: () => get("/profile"),
    listMessages: (p) => get("/messages", { q: p.q, pageToken: p.pageToken, maxResults: 500, fields: "messages(id),nextPageToken" }),
    listHistory: (p) => get("/history", { startHistoryId: p.startHistoryId, pageToken: p.pageToken, historyTypes: "messageAdded", maxResults: 500 }),
    getMessage: (id) => get("/messages/" + encodeURIComponent(id), { format: "full", fields: MESSAGE_FIELDS }),
  };
}

// Email timeline entries of a deal, oldest first, for the bot read API.
function emailTimeline(d) {
  return ((d && d.timeline) || []).filter((t) => t && t.type === "email").sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

// ---- Run ----
function dayAgoSeconds(now, days) { return Math.floor((Date.parse(now) - days * 86400000) / 1000); }

// deps: { now(), log(), integrations: [{ key, doc }], makeClient(doc) -> gmail client, saveIntegration(key, patch),
//   loadContext() -> { state, commit(result) }  reads deals, contacts, customers once per run (only called when there is mail),
//   loadReplyPending() -> { state, commit(result) }  deals with email.ball == "us" and replyWaiting not true only,
//   saveReview(entries) }
// gmail client: getProfile(), listMessages({q,pageToken}), listHistory({startHistoryId,pageToken}), getMessage(id).
async function runSync(deps) {
  const now = deps.now ? deps.now() : new Date().toISOString();
  const out = { mailboxes: 0, logged: 0 };
  let ctx = null; // CRM context, loaded on the first run with mail and shared by every chunk and mailbox
  for (const { key, doc } of deps.integrations) {
    if (!doc || !doc.refreshToken || !doc.mailbox) continue;
    out.mailboxes += 1;
    let status = { lastSyncAt: now, lastError: null };
    try {
      const client = deps.makeClient(doc);
      const profile = await client.getProfile();
      if (normEmail(profile.emailAddress) !== doc.mailbox) throw new Error("Linked account is not " + doc.mailbox);
      const ids = [];
      let nextHistoryId = doc.historyId || null;
      let backfill = doc.backfill || null;
      if (!doc.historyId) {
        backfill = backfill || { pageToken: null, startHistoryId: String(profile.historyId || ""), after: dayAgoSeconds(now, BACKFILL_DAYS) };
        let token = backfill.pageToken;
        do {
          const r = await client.listMessages({ q: "after:" + backfill.after, pageToken: token });
          (r.messages || []).forEach((x) => ids.push(x.id));
          token = r.nextPageToken || null;
        } while (token && ids.length < MAX_MESSAGES_PER_RUN);
        if (ids.length > MAX_MESSAGES_PER_RUN) { ids.length = MAX_MESSAGES_PER_RUN; }
        if (token) backfill.pageToken = token;
        else { nextHistoryId = backfill.startHistoryId; backfill = null; }
      } else {
        let token = null;
        try {
          do {
            const r = await client.listHistory({ startHistoryId: doc.historyId, pageToken: token });
            (r.history || []).forEach((h) => (h.messagesAdded || []).forEach((x) => ids.push(x.message.id)));
            if (r.historyId) nextHistoryId = String(r.historyId);
            token = r.nextPageToken || null;
          } while (token && ids.length < MAX_MESSAGES_PER_RUN);
        } catch (e) {
          if (e.status !== 404) throw e;
          // History too old: start a fresh 60 day backfill (idempotent by message id).
          nextHistoryId = null;
          backfill = { pageToken: null, startHistoryId: String(profile.historyId || ""), after: dayAgoSeconds(now, BACKFILL_DAYS) };
        }
      }
      const parsed = [];
      for (const id of [...new Set(ids)]) {
        try { parsed.push(parseMessage(await client.getMessage(id), doc.mailbox)); } catch (e) {
          if (e.status !== 404) status.lastError = "message " + id + ": " + String(e.message || e).slice(0, 200);
        }
      }
      let logged = 0;
      for (let i = 0; i < parsed.length; i += APPLY_CHUNK) {
        if (!ctx) { ctx = await deps.loadContext(); ctx.index = buildIndex(ctx.state); ctx.threads = new Map(); ctx.seen = { ids: new Set(), addrs: new Set() }; }
        const chunk = parsed.slice(i, i + APPLY_CHUNK);
        if (deps.loadThreads) {
          // Only the stored threads these messages can touch: same thread ids, or threads that include one of their addresses.
          const ids = [...new Set(chunk.map((m) => m.threadId).filter((x) => x && !ctx.seen.ids.has(x)))];
          // Addresses are looked up only for mail that matches no contact or domain (the third matching rule).
          const open = chunk.filter((m) => !skipReason(m) && !matchDeals(ctx.state, ctx.index, allExternal(m)));
          const addrs = [...new Set([].concat(...open.map((m) => allExternal(m))).filter((x) => !ctx.seen.addrs.has(x)))];
          ids.forEach((x) => ctx.seen.ids.add(x));
          addrs.forEach((x) => ctx.seen.addrs.add(x));
          if (ids.length || addrs.length) (await deps.loadThreads({ threadIds: ids, addresses: addrs })).forEach((t) => { if (t && t.id && !ctx.threads.has(t.id)) ctx.threads.set(t.id, t); });
        }
        const r = applyMessages(ctx.state, chunk, { now, index: ctx.index, threads: ctx.threads });
        await ctx.commit(r);
        if (r.threads.length && deps.saveThreads) await deps.saveThreads(r.threads);
        logged += r.logged;
        if (r.review.size) await deps.saveReview([...r.review.values()], now);
      }
      out.logged += logged;
      status = Object.assign(status, {
        historyId: nextHistoryId, backfill, messagesLogged: (doc.messagesLogged || 0) + logged,
      });
    } catch (e) {
      status.lastError = String(e.message || e).slice(0, 300);
      if (deps.log) deps.log("gmailSync " + key + " failed: " + status.lastError);
    }
    await deps.saveIntegration(key, status);
  }
  // Re-age replyWaiting. Loaded state already has every deal; otherwise one narrow query.
  if (out.mailboxes) {
    try {
      const src = ctx || (await deps.loadReplyPending());
      const r = ageReplies(src.state, now);
      if (r.changedDealIds.length) await src.commit(r);
    } catch (e) {
      if (deps.log) deps.log("gmailSync reply re-age failed: " + String(e.message || e).slice(0, 200));
    }
  }
  return out;
}

// ---- Daily: health check and stale sweep ----
// Message for the daily log, or null when both mailboxes are linked. The caller logs it as a WARNING.
function healthWarning(integrations) {
  const linked = new Set((integrations || []).filter((i) => i && i.doc && i.doc.refreshToken && i.doc.mailbox).map((i) => i.doc.mailbox));
  if (linked.size >= Object.keys(MAILBOXES).length) return null;
  if (!linked.size) return "gmailSync: 0 linked (link you@example.com and sales@example.com in Admin tools > Gmail sync)";
  return "gmailSync: " + linked.size + " linked, not linked: " + Object.keys(MAILBOXES).filter((m) => !linked.has(m)).join(", ");
}

// deps: { now(), loadContext() -> { state, commit(result) } }. Flags and clears stale; writes only the deals that changed.
async function runStale(deps) {
  const now = deps.now ? deps.now() : new Date().toISOString();
  const ctx = await deps.loadContext();
  const r = applyStale(ctx.state, now);
  for (let i = 0; i < r.changedDealIds.length; i += STALE_COMMIT_BATCH) {
    await ctx.commit({ changedDealIds: r.changedDealIds.slice(i, i + STALE_COMMIT_BATCH), fields: r.fields, scalars: r.scalars });
  }
  return { flagged: r.flagged, cleared: r.cleared };
}

module.exports = {
  ACTOR, LEAD_STAGES, STALE_DEFAULT_DAYS, healthWarning, runStale, applyStale, staleDaysFor, lastTouchMs, upsertThread, mergeInfo, allExternal, ptDay, addBusinessDays,
  MAILBOXES, GMAIL_SCOPE, OAUTH_SCOPES, GMAIL_BASE, BACKFILL_DAYS, MAX_MESSAGES_PER_RUN, SNIPPET_MAX, SOURCE, FREE_MAIL,
  normEmail, domainOf, parseAddressList, parseMessage, skipReason, threadUrl, isQuotePdf, businessMsBetween, isReplyWaiting,
  emailTimeline, exchangeCode, revokeToken, makeGmailClient, mergeReview, mergeDealChanges, buildIndex, matchDeals, externalAddresses, applyMessages, ageReplies, runSync,
};
