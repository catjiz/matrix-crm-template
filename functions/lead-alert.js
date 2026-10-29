/**
 * New lead alert (issue #48). One POST to the sales bot webhook after a brand-new Jotform lead is saved.
 * Never throws: a failed alert must not change the intake response or undo the lead.
 */
"use strict";

const ALERT_TIMEOUT_MS = 5000;
const ALERT_ATTEMPTS = 2; // the first try plus at most one retry

// Error text for the change log: status or message only. The URL and key are removed.
function safeText(text, url, key) {
  let out = String(text == null ? "" : text);
  [url, key].forEach((secret) => {
    if (secret && String(secret).length > 3) out = out.split(String(secret)).join("[hidden]");
  });
  return out.slice(0, 300);
}

/**
 * POST the payload as JSON. Returns { ok: true, status } or { ok: false, error }.
 * opts.fetch and opts.timeoutMs exist for tests.
 */
async function postLeadAlert(url, key, payload, opts) {
  const o = opts || {};
  const doFetch = o.fetch || (typeof fetch === "function" ? fetch : null);
  const timeoutMs = o.timeoutMs || ALERT_TIMEOUT_MS;
  const cleanUrl = String(url || "").trim();
  const cleanKey = String(key || "").trim();
  if (!cleanUrl) return { ok: false, skipped: true, error: "no url" };
  if (!doFetch) return { ok: false, error: "fetch is not available" };
  const headers = { "Content-Type": "application/json" };
  if (cleanKey) headers.Authorization = "Bearer " + cleanKey;
  let last = "unknown error";
  for (let attempt = 0; attempt < ALERT_ATTEMPTS; attempt++) {
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
    try {
      const resp = await doFetch(cleanUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: ctl ? ctl.signal : undefined,
      });
      if (resp && resp.status >= 200 && resp.status < 300) return { ok: true, status: resp.status };
      last = "HTTP " + (resp ? resp.status : "no response");
    } catch (e) {
      last = e && e.name === "AbortError" ? "timeout after " + timeoutMs + " ms" : safeText(e && e.message ? e.message : e, cleanUrl, cleanKey);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  return { ok: false, error: last };
}

module.exports = { postLeadAlert, safeText, ALERT_TIMEOUT_MS, ALERT_ATTEMPTS };
