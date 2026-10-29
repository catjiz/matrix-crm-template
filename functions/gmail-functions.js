/**
 * Matrix CRM: Gmail sync Cloud Functions (issue #54). Read-only: gmail.readonly scope, GET calls only
 * (see gmail-sync.js). Refresh tokens live in integrations/{gmail_owner|gmail_info}, which no client can read
 * or write (no rule matches it, and firestore.rules.phase2.proposed denies it explicitly).
 * Never log or return a token.
 */
"use strict";

const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const GS = require("./gmail-sync");

// c: { db, M, WORKSPACE_PATH, readWorkspace, planWorkspaceWrite, writeWorkspace, verifyBearer, cors, json, nowIso }
module.exports = function define(c) {
  const { db } = c;
  const CLIENT_ID = defineSecret("GMAIL_OAUTH_CLIENT_ID");
  const CLIENT_SECRET = defineSecret("GMAIL_OAUTH_CLIENT_SECRET");
  const integrationRef = (key) => db.collection("integrations").doc(key);

  async function listIntegrations() {
    const out = [];
    for (const key of Object.values(GS.MAILBOXES)) {
      const snap = await integrationRef(key).get();
      if (snap.exists) out.push({ key, doc: snap.data() || {} });
    }
    return out;
  }

  // The sync never reads the joined workspace (that is every split collection, including changeLog). It reads the
  // config doc, then only what it needs, and writes only the touched deal docs, new changeLog docs and the
  // workspace updatedAt:
  //   loadContext      deals + contacts + customers, plain reads, once per run, only when there is mail
  //   loadReplyPending deals with email.ball == "us" and email.replyWaiting == false (two equality filters, no composite index)
  // Single-document storage (not split) has everything in workspace/main, which is one read.
  const workspaceRef = () => db.doc(c.WORKSPACE_PATH);
  const rec = (d) => { const r = Object.assign({ id: d.id }, d.data()); delete r._ord; return r; };

  async function openWorkspace(what) {
    const snap = await workspaceRef().get();
    if (!snap.exists) { const err = new Error("workspace/main missing"); err.status = 404; throw err; }
    const doc = snap.data() || {};
    const split = c.M.isSplitStorage(doc.state);
    let state;
    if (!split) {
      state = JSON.parse(JSON.stringify(doc.state || {}));
    } else {
      state = { stages: (doc.state || {}).stages || [], deals: [], contacts: [], customers: [] };
      const col = (name) => workspaceRef().collection(name);
      if (what === "pending") {
        state.deals = (await col("deals").where("email.ball", "==", "us").where("email.replyWaiting", "==", false).get()).docs.map(rec);
      } else {
        const [deals, contacts, customers] = await Promise.all([col("deals").get(), col("contacts").get(), col("customers").get()]);
        state.deals = deals.docs.map(rec);
        state.contacts = contacts.docs.map(rec);
        state.customers = customers.docs.map(rec);
      }
    }
    state.changeLog = []; // only entries added by this run; the existing log is never read
    return { state, commit: (result) => commit(state, split, result) };
  }

  async function commit(state, split, result) {
    const ids = result.changedDealIds || [];
    // This batch's change log entries only (the stale sweep commits in batches to stay under the transaction write limit).
    const idSet = new Set(ids);
    const logs = state.changeLog.filter((l) => idSet.has(l.entityId));
    state.changeLog = state.changeLog.filter((l) => !idSet.has(l.entityId));
    if (!ids.length && !logs.length) return;
    const now = c.nowIso();
    const patch = { updatedAt: now, updatedBy: GS.SOURCE };
    const mine = new Map(state.deals.map((d) => [d.id, d]));
    const merged = new Map();
    if (!split) {
      await db.runTransaction(async (tx) => {
        const ws = await c.readWorkspace(tx, workspaceRef());
        const st = ws.state;
        const byId = new Map((st.deals || []).map((d, i) => [d.id, i]));
        ids.forEach((id) => { if (byId.has(id)) st.deals[byId.get(id)] = GS.mergeDealChanges(st.deals[byId.get(id)], mine.get(id), GS.mergeInfo(result, id)); });
        st.changeLog = (Array.isArray(st.changeLog) ? st.changeLog : []).concat(logs);
        c.writeWorkspace(tx, workspaceRef(), c.planWorkspaceWrite(ws, st, { bulk: true, isAdmin: true }), st, patch);
      });
      return;
    }
    await db.runTransaction(async (tx) => {
      merged.clear();
      const snaps = await Promise.all(ids.map((id) => tx.get(workspaceRef().collection("deals").doc(id))));
      ids.forEach((id, i) => {
        if (!snaps[i].exists) return; // deleted meanwhile: never recreate it
        const cur = snaps[i].data();
        const ord = cur._ord;
        delete cur._ord;
        const m = GS.mergeDealChanges(Object.assign({ id }, cur), mine.get(id), GS.mergeInfo(result, id));
        merged.set(id, m);
        tx.set(workspaceRef().collection("deals").doc(id), ord === undefined ? m : Object.assign({}, m, { _ord: ord }));
      });
      logs.forEach((l, i) => tx.set(workspaceRef().collection("changeLog").doc(l.id), Object.assign({}, l, { _ord: Date.now() + i })));
      tx.update(workspaceRef(), Object.assign({ recordsUpdatedAt: now }, patch));
    });
    state.deals = state.deals.map((d) => merged.get(d.id) || d);
  }

  async function saveReview(entries, now) {
    for (const e of entries) {
      const id = e.email.replace(/\//g, "_");
      const ref = db.doc(c.WORKSPACE_PATH + "/gmailReview/" + id);
      const merged = GS.mergeReview((await ref.get()).data(), e);
      if (merged) await ref.set(Object.assign({ id }, merged, { updatedAt: now }));
    }
  }

  // Thread index: workspace/main/emailThreads/{threadId}. Reads only the threads a batch of messages can touch.
  const threadsCol = () => workspaceRef().collection("emailThreads");
  async function loadThreads({ threadIds, addresses }) {
    const out = new Map();
    const add = (id, data) => { if (data && !out.has(id)) out.set(id, Object.assign({ id }, data)); };
    await Promise.all((threadIds || []).map(async (id) => { const s = await threadsCol().doc(id).get(); if (s.exists) add(id, s.data()); }));
    const addrs = addresses || [];
    for (let i = 0; i < addrs.length; i += 10) {
      const q = await threadsCol().where("participants", "array-contains-any", addrs.slice(i, i + 10)).get();
      q.docs.forEach((d) => add(d.id, d.data()));
    }
    return [...out.values()];
  }
  async function saveThreads(threads) {
    for (const t of threads) await threadsCol().doc(t.id).set(t);
  }

  const gmailSync = onSchedule(
    { schedule: "every 15 minutes", timeZone: "America/Los_Angeles", region: "us-central1", timeoutSeconds: 540, memory: "512MiB", secrets: [CLIENT_ID, CLIENT_SECRET] },
    async () => {
      const integrations = await listIntegrations();
      if (!integrations.some((i) => i.doc.refreshToken)) return; // nothing linked: no CRM reads, no writes
      const out = await GS.runSync({
        integrations,
        makeClient: (doc) => GS.makeGmailClient(fetch, { clientId: CLIENT_ID.value(), clientSecret: CLIENT_SECRET.value(), refreshToken: doc.refreshToken }),
        saveIntegration: (key, patch) => integrationRef(key).set(patch, { merge: true }),
        loadContext: () => openWorkspace("full"),
        loadReplyPending: () => openWorkspace("pending"),
        saveReview,
        loadThreads,
        saveThreads,
        log: (m) => console.warn(m),
      });
      console.log("gmailSync", out.mailboxes, "mailboxes,", out.logged, "messages logged");
    }
  );

  // Daily at 03:30 Pacific: a WARNING in the logs while a mailbox is not linked, then the stale flag sweep.
  // The sweep writes only the deals whose flag changed, through the same audited commit as the sync.
  const gmailDaily = onSchedule(
    { schedule: "30 3 * * *", timeZone: "America/Los_Angeles", region: "us-central1", timeoutSeconds: 540, memory: "512MiB" },
    async () => {
      const warning = GS.healthWarning(await listIntegrations());
      if (warning) console.warn(warning);
      const out = await GS.runStale({ loadContext: () => openWorkspace("full") });
      console.log("gmailDaily stale flagged", out.flagged, "cleared", out.cleared);
    }
  );

  // Admin only. POST { action: "status" | "link" | "unlink", mailbox, code? }
  //   status: per mailbox { linked, address, lastSyncAt, lastError, messagesLogged } plus the public OAuth client id
  //   link:   code from the Google Identity Services code client; the refresh token is stored server side only
  //   unlink: revokes the token with Google and clears only the token fields of that integration doc
  const gmailLink = onRequest({ cors: false, secrets: [CLIENT_ID, CLIENT_SECRET] }, async (req, res) => {
    c.cors(res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { c.json(res, 405, { error: "Use POST" }); return; }
    try {
      const decoded = await c.verifyBearer(req);
      const email = String(decoded.email || "").toLowerCase();
      const userSnap = email ? await db.collection("users").doc(email).get() : null;
      const roles = userSnap && userSnap.exists ? (userSnap.data() || {}).roles : null;
      if (!Array.isArray(roles) || roles.indexOf("admin") === -1) { c.json(res, 403, { ok: false, error: "Admin only" }); return; }
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const secrets = { clientId: CLIENT_ID.value(), clientSecret: CLIENT_SECRET.value() };
      if (body.action === "status") {
        const mailboxes = {};
        for (const [addr, key] of Object.entries(GS.MAILBOXES)) {
          const d = (await integrationRef(key).get()).data() || {};
          mailboxes[addr] = { linked: !!d.refreshToken, address: d.refreshToken ? d.mailbox : null, lastSyncAt: d.lastSyncAt || null, lastError: d.lastError || null, messagesLogged: d.messagesLogged || 0 };
        }
        c.json(res, 200, { ok: true, clientId: secrets.clientId, mailboxes });
        return;
      }
      const mailbox = String(body.mailbox || "").toLowerCase();
      const key = GS.MAILBOXES[mailbox];
      if (!key) { c.json(res, 400, { ok: false, error: "mailbox must be you@example.com or sales@example.com" }); return; }
      if (body.action === "link") {
        if (!body.code || typeof body.code !== "string") { c.json(res, 400, { ok: false, error: "Missing code" }); return; }
        const tok = await GS.exchangeCode(fetch, Object.assign({ code: body.code, redirectUri: typeof body.redirectUri === "string" && /^https:\/\//.test(body.redirectUri) ? body.redirectUri : undefined }, secrets));
        const granted = String(tok.scope || "").split(" ").filter((s) => s.indexOf("https://www.googleapis.com/auth/") === 0);
        if (granted.some((s) => s !== GS.GMAIL_SCOPE)) {
          if (tok.refresh_token) await GS.revokeToken(fetch, tok.refresh_token);
          c.json(res, 400, { ok: false, error: "Only the gmail.readonly scope is allowed" });
          return;
        }
        if (!tok.refresh_token) { c.json(res, 400, { ok: false, error: "Google sent no refresh token. Remove Matrix from that Google account's third-party access and link again." }); return; }
        const profile = await GS.makeGmailClient(fetch, Object.assign({ refreshToken: tok.refresh_token }, secrets)).getProfile();
        if (GS.normEmail(profile.emailAddress) !== mailbox) {
          await GS.revokeToken(fetch, tok.refresh_token);
          c.json(res, 400, { ok: false, error: "That Google account is " + profile.emailAddress + ", not " + mailbox });
          return;
        }
        await integrationRef(key).set({ mailbox, refreshToken: tok.refresh_token, linkedAt: c.nowIso(), linkedBy: email, historyId: null, backfill: null, lastSyncAt: null, lastError: null, messagesLogged: 0 });
        c.json(res, 200, { ok: true, mailbox });
        return;
      }
      if (body.action === "unlink") {
        const ref = integrationRef(key);
        const d = (await ref.get()).data() || {};
        if (d.refreshToken) await GS.revokeToken(fetch, d.refreshToken);
        await ref.set({ mailbox, refreshToken: null, historyId: null, backfill: null, unlinkedAt: c.nowIso(), unlinkedBy: email }, { merge: true });
        c.json(res, 200, { ok: true, mailbox });
        return;
      }
      c.json(res, 400, { ok: false, error: "action must be status, link or unlink" });
    } catch (e) {
      const status = e.status || 500;
      if (status >= 500) console.error("gmailLink error", e.message);
      c.json(res, status, { ok: false, error: e.message || String(e) });
    }
  });

  return { gmailSync, gmailDaily, gmailLink };
};
