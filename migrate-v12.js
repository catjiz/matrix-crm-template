/* Matrix CRM: v11 to v12 migration (Customers, Contacts, FileRef covers).
   Pure functions, no DOM. Loaded by index.html before app.js and by tests/migration-test.js in node.
   Phase 1 scope: migration steps 1, 2 and 4 (customers, contacts, lead file refs).
   Steps 3 and 5 (Projects, task entity rehome) land in Phase 2 behind the same entry point. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.StuffMigrate = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SCHEMA_VERSION = 12;
  var SHOP_NEEDS_STAGES = ['amazon-com', 'ppe-com'];
  var CRM_AREA_ID = 'crm';
  var SLOT_KEYS = ['quotes', 'invoices', 'designs', 'molds', 'renderings'];

  function nowIso() { return new Date().toISOString(); }

  function rand(n) {
    var s = '';
    while (s.length < n) s += Math.random().toString(36).slice(2);
    return s.slice(0, n);
  }

  function makeId(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + rand(6);
  }

  // Normalize company name for customer dedupe. Deterministic so re-running is idempotent.
  function normalizeCompanyName(name) {
    var s = String(name || '').trim().toLowerCase();
    s = s.replace(/[\u2018\u2019\u201c\u201d'"]/g, '');
    s = s.replace(/&/g, ' and ');
    s = s.replace(/[^a-z0-9]+/g, ' ').trim();
    s = s.replace(/\b(inc|llc|ltd|co|corp|corporation|company|limited)\b/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  }

  function slugForCustomer(normalized) {
    var slug = normalized.replace(/\s+/g, '-').slice(0, 40) || 'unnamed';
    return 'cus_' + slug;
  }

  function sectionAreaForStage(state, stage) {
    var secs = state.sections || [];
    for (var i = 0; i < secs.length; i++) {
      if ((secs[i].stages || []).indexOf(stage) !== -1) return { section: secs[i], area: secs[i].area || CRM_AREA_ID };
    }
    return { section: null, area: CRM_AREA_ID };
  }

  // A category holds projects when its role says so (Pre-Production, Operations, or a
  // custom "projects" category). Everything else holds leads. Never decide by area id alone,
  // or cards in a new lead-type category would be turned into projects on reload.
  var PROJECT_ROLES = ['pre-production', 'operations', 'projects'];

  function isProjectAreaId(state, areaId) {
    var a = (state.areas || []).find(function (x) { return x && x.kind !== 'separator' && x.kind !== 'fixed' && x.id === areaId; });
    var role = a && a.role;
    if (!role) {
      if (areaId === 'pre-production') role = 'pre-production';
      else if (areaId === 'floor-operations' || areaId === 'operations') role = 'operations';
    }
    return PROJECT_ROLES.indexOf(role) !== -1;
  }

  function isShopNeedsStage(stage) {
    return SHOP_NEEDS_STAGES.indexOf(stage) !== -1;
  }

  function ensureArrays(state) {
    if (!Array.isArray(state.customers)) state.customers = [];
    if (!Array.isArray(state.contacts)) state.contacts = [];
    if (!Array.isArray(state.files)) state.files = [];
    if (!Array.isArray(state.changeLog)) state.changeLog = [];
    if (!Array.isArray(state.proposals)) state.proposals = [];
    if (!Array.isArray(state.projects)) state.projects = [];
    if (!Array.isArray(state.skus)) state.skus = [];
    if (!Array.isArray(state.materialLines)) state.materialLines = [];
    if (!Array.isArray(state.materials)) state.materials = [];
    if (!Array.isArray(state.skuEvents)) state.skuEvents = [];
    if (!Array.isArray(state.vendors)) state.vendors = [];
    if (!Array.isArray(state.vendorQuotes)) state.vendorQuotes = [];
    if (!Array.isArray(state.customerQuotes)) state.customerQuotes = [];
    if (!Array.isArray(state.customerPos)) state.customerPos = [];
    if (!state.settings || typeof state.settings !== 'object') state.settings = {};
    if (typeof state.settings.botWritesFrozen !== 'boolean') state.settings.botWritesFrozen = false;
    return state;
  }

  // ---------------------------------------------------------------------
  // Split storage (issue #103, Owner: "There should be no limit"). Records live one per document in
  // subcollections of workspace/main (workspace/main/deals/{id}, .../customers/{id}, ...); the small
  // config (boards, stages, settings, views) stays in workspace/main's `state`. The app keeps the same
  // in-memory state shape: splitState / joinState convert, recordDiff says which docs a save touches.
  // Turned on by settings.storage = 'split' only after a verified copy. changeLog docs are never deleted.
  // ---------------------------------------------------------------------
  var SPLIT_COLLECTIONS = [
    ['deals', 'deals'], ['customers', 'customers'], ['contacts', 'contacts'], ['projects', 'projects'],
    ['skus', 'skus'], ['skuEvents', 'skuEvents'], ['tasks', 'tasks'], ['files', 'files'], ['proposals', 'proposals'],
    ['materials', 'materials'], ['materialLines', 'materialLines'], ['vendors', 'vendors'], ['vendorQuotes', 'vendorQuotes'],
    ['customerQuotes', 'customerQuotes'], ['customerPos', 'pos'], ['billingEntries', 'billingEntries'], ['changeLog', 'changeLog']
  ];
  var SPLIT_APPEND_ONLY = ['changeLog'];
  var SPLIT_DOC_LIMIT = 900 * 1024; // Firestore's limit is 1 MiB per document
  var SPLIT_ORD = '_ord';

  function isSplitStorage(state) { return !!(state && state.settings && state.settings.storage === 'split'); }

  // Firestore document ids: no slash, not . or .., not __x__, at most 700 bytes.
  function validDocId(id) {
    return typeof id === 'string' && id.length > 0 && id.length <= 700 && id.indexOf('/') === -1 && id !== '.' && id !== '..' && !/^__.*__$/.test(id);
  }

  // Firestore cannot store an array directly inside an array.
  function hasNestedArray(v) {
    if (Array.isArray(v)) return v.some(function (x) { return Array.isArray(x) || hasNestedArray(x); });
    if (v && typeof v === 'object') return Object.keys(v).some(function (k) { return hasNestedArray(v[k]); });
    return false;
  }

  function byteLen(str) {
    var n = 0;
    for (var i = 0; i < str.length; i++) { var c = str.charCodeAt(i); n += c < 0x80 ? 1 : c < 0x800 ? 2 : c >= 0xd800 && c <= 0xdbff ? (i++, 4) : 3; }
    return n;
  }

  // Key-sorted JSON, so equal records give equal strings whatever their key order.
  function canonicalJson(v) {
    if (Array.isArray(v)) return '[' + v.map(canonicalJson).join(',') + ']';
    if (v && typeof v === 'object') {
      return '{' + Object.keys(v).filter(function (k) { return v[k] !== undefined; }).sort().map(function (k) { return JSON.stringify(k) + ':' + canonicalJson(v[k]); }).join(',') + '}';
    }
    return JSON.stringify(v === undefined ? null : v);
  }

  // SHA-256 of a string (UTF-8), as 64 hex digits. Plain JS so it runs the same in the browser, node and Functions.
  var SHA_K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function utf8Bytes(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
        var d = str.charCodeAt(i + 1);
        if (d >= 0xdc00 && d <= 0xdfff) { c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00); i++; }
      }
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }
  function sha256Hex(str) {
    var bytes = utf8Bytes(String(str));
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    var hi = Math.floor(bitLen / 0x100000000), lo = bitLen >>> 0;
    bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255, (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
    var h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var w = new Array(64);
    for (var off = 0; off < bytes.length; off += 64) {
      for (var t = 0; t < 16; t++) w[t] = (bytes[off + 4 * t] << 24) | (bytes[off + 4 * t + 1] << 16) | (bytes[off + 4 * t + 2] << 8) | bytes[off + 4 * t + 3];
      for (t = 16; t < 64; t++) {
        var x = w[t - 15], y = w[t - 2];
        var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], k = h[7];
      for (t = 0; t < 64; t++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var t1 = (k + S1 + ((e & f) ^ (~e & g)) + SHA_K[t] + w[t]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        k = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + k) | 0;
    }
    return h.map(function (v) { return ('0000000' + (v >>> 0).toString(16)).slice(-8); }).join('');
  }

  // { config, collections: { col: [{ id, data }] } }. data carries _ord (its index) so joinState keeps order.
  function splitState(state) {
    var copy = JSON.parse(JSON.stringify(state || {}));
    var out = { config: copy, collections: {} };
    SPLIT_COLLECTIONS.forEach(function (pair) {
      var list = Array.isArray(copy[pair[0]]) ? copy[pair[0]] : [];
      out.collections[pair[1]] = list.map(function (rec, i) {
        var d = Object.assign({}, rec);
        d[SPLIT_ORD] = i;
        return { id: rec && rec.id, data: d };
      });
      delete copy[pair[0]];
    });
    return out;
  }

  // Full state from the config and the collection docs ({ col: [doc data] }). Order by _ord.
  function joinState(config, collections) {
    var state = JSON.parse(JSON.stringify(config || {}));
    SPLIT_COLLECTIONS.forEach(function (pair) {
      var docs = ((collections || {})[pair[1]] || []).filter(function (d) { return d && typeof d === 'object'; });
      docs = docs.slice().sort(function (a, b) {
        var x = Number(a[SPLIT_ORD]), y = Number(b[SPLIT_ORD]);
        if (isNaN(x)) x = Infinity; if (isNaN(y)) y = Infinity;
        return x - y || String(a.id).localeCompare(String(b.id));
      });
      state[pair[0]] = docs.map(function (d) { var r = Object.assign({}, d); delete r[SPLIT_ORD]; return r; });
    });
    return state;
  }

  // Dry run: counts, bytes, the largest doc per collection and anything that blocks the split.
  function splitPlan(state) {
    var parts = splitState(state);
    var plan = { collections: [], configBytes: byteLen(JSON.stringify(parts.config)), totalBytes: byteLen(JSON.stringify(state || {})), docs: 0, blockers: [], checksum: '' };
    if (plan.configBytes > SPLIT_DOC_LIMIT) plan.blockers.push('config is ' + Math.round(plan.configBytes / 1024) + ' KB, over the 900 KB document limit');
    if (hasNestedArray(parts.config)) plan.blockers.push('config has an array inside an array (Firestore cannot store it)');
    SPLIT_COLLECTIONS.forEach(function (pair) {
      var docs = parts.collections[pair[1]], seen = {}, bytes = 0, largest = 0, largestId = '';
      docs.forEach(function (d, i) {
        if (!validDocId(d.id)) { plan.blockers.push(pair[0] + ' #' + (i + 1) + ': id ' + JSON.stringify(d.id === undefined ? null : d.id) + ' cannot be a document id'); return; }
        if (seen[d.id]) plan.blockers.push(pair[0] + ': id ' + d.id + ' is used twice');
        seen[d.id] = true;
        var b = byteLen(JSON.stringify(d.data));
        bytes += b;
        if (b > largest) { largest = b; largestId = d.id; }
        if (b > SPLIT_DOC_LIMIT) plan.blockers.push(pair[0] + ' ' + d.id + ' is ' + Math.round(b / 1024) + ' KB, over the 900 KB document limit');
        if (hasNestedArray(d.data)) plan.blockers.push(pair[0] + ' ' + d.id + ' has an array inside an array (Firestore cannot store it)');
      });
      plan.docs += docs.length;
      plan.collections.push({ key: pair[0], collection: pair[1], count: docs.length, bytes: bytes, largestBytes: largest, largestId: largestId });
    });
    plan.checksum = stateChecksum(state);
    return plan;
  }

  // One SHA-256 over every record (canonical JSON, by collection and id) and the config, plus the line count.
  function stateChecksum(state) {
    var parts = splitState(state);
    var lines = ['config:' + canonicalJson(parts.config)];
    SPLIT_COLLECTIONS.forEach(function (pair) {
      parts.collections[pair[1]].map(function (d) { var r = Object.assign({}, d.data); delete r[SPLIT_ORD]; return pair[1] + '/' + d.id + ':' + canonicalJson(r); })
        .sort().forEach(function (l) { lines.push(l); });
    });
    return 'sha256:' + sha256Hex(lines.join('\n')) + '-' + lines.length;
  }

  // Field by field check of a joined copy against the source: { ok, problems[] }.
  function verifySplit(source, joined) {
    var problems = [];
    var a = splitState(source), b = splitState(joined);
    if (canonicalJson(a.config) !== canonicalJson(b.config)) problems.push('config differs');
    SPLIT_COLLECTIONS.forEach(function (pair) {
      var col = pair[1], left = {}, right = {};
      a.collections[col].forEach(function (d) { var r = Object.assign({}, d.data); delete r[SPLIT_ORD]; left[d.id] = canonicalJson(r); });
      b.collections[col].forEach(function (d) { var r = Object.assign({}, d.data); delete r[SPLIT_ORD]; right[d.id] = canonicalJson(r); });
      Object.keys(left).forEach(function (id) {
        if (!(id in right)) problems.push(pair[0] + ' ' + id + ' is missing');
        else if (left[id] !== right[id]) problems.push(pair[0] + ' ' + id + ' differs');
      });
      Object.keys(right).forEach(function (id) { if (!(id in left)) problems.push(pair[0] + ' ' + id + ' is extra'); });
      if (a.collections[col].length !== b.collections[col].length) problems.push(pair[0] + ': ' + a.collections[col].length + ' records, copy has ' + b.collections[col].length);
    });
    return { ok: !problems.length, problems: problems, sourceChecksum: stateChecksum(source), copyChecksum: stateChecksum(joined) };
  }

  // What a save must write. base: { col: { id: { json, ord } } } (the last synced docs). Returns
  // { config: changed?, configState, writes: [{ col, id, data }], deletes: [{ col, id }], base: newBase }.
  // A new record gets an _ord after the last one (or before the first, when it was added at the top).
  function recordDiff(base, state, baseConfigJson) {
    var parts = splitState(state);
    var out = { config: false, configState: parts.config, writes: [], deletes: [], base: {} };
    var cfgJson = canonicalJson(parts.config);
    out.config = cfgJson !== baseConfigJson;
    out.configJson = cfgJson;
    SPLIT_COLLECTIONS.forEach(function (pair) {
      var col = pair[1], had = (base && base[col]) || {}, now = {};
      var ords = Object.keys(had).map(function (id) { return had[id].ord; }).filter(function (o) { return typeof o === 'number'; });
      var maxOrd = ords.length ? Math.max.apply(null, ords) : -1, minOrd = ords.length ? Math.min.apply(null, ords) : 0;
      parts.collections[col].forEach(function (d, i) {
        if (!validDocId(d.id)) return;
        var r = Object.assign({}, d.data); delete r[SPLIT_ORD];
        var json = canonicalJson(r);
        var ord = had[d.id] ? had[d.id].ord : i === 0 && ords.length ? --minOrd : ++maxOrd;
        now[d.id] = { json: json, ord: ord };
        if (!had[d.id] || had[d.id].json !== json) { var data = JSON.parse(JSON.stringify(r)); data[SPLIT_ORD] = ord; out.writes.push({ col: col, id: d.id, data: data }); }
      });
      Object.keys(had).forEach(function (id) {
        if (now[id]) return;
        if (SPLIT_APPEND_ONLY.indexOf(col) !== -1) { now[id] = had[id]; return; } // never delete history
        out.deletes.push({ col: col, id: id });
      });
      out.base[col] = now;
    });
    return out;
  }

  // The base map for recordDiff from loaded docs ({ col: [data] }).
  function splitBase(collections) {
    var base = {};
    SPLIT_COLLECTIONS.forEach(function (pair) {
      var m = {};
      ((collections || {})[pair[1]] || []).forEach(function (data) {
        if (!data || !data.id) return;
        var r = Object.assign({}, data); var ord = r[SPLIT_ORD]; delete r[SPLIT_ORD];
        m[data.id] = { json: canonicalJson(r), ord: typeof ord === 'number' ? ord : Infinity };
      });
      base[pair[1]] = m;
    });
    return base;
  }

  function findCustomerByName(state, normalized) {
    for (var i = 0; i < state.customers.length; i++) {
      if (state.customers[i].normalizedName === normalized) return state.customers[i];
    }
    return null;
  }

  function findOrCreateCustomer(state, company, source, at) {
    var normalized = normalizeCompanyName(company);
    if (!normalized) normalized = 'unnamed';
    var existing = findCustomerByName(state, normalized);
    if (existing) return { customer: existing, created: false };
    var id = slugForCustomer(normalized);
    // Guard against slug collisions from truncation.
    var n = 1;
    var base = id;
    while (state.customers.some(function (c) { return c.id === id; })) { n += 1; id = base + '-' + n; }
    var cust = {
      id: id,
      name: String(company || '').trim() || 'Unnamed customer',
      normalizedName: normalized,
      website: '',
      industry: '',
      billingAddress: '',
      shipAddress: '',
      coverFileId: null,
      driveFolderId: null,
      notes: '',
      source: source || '',
      createdAt: at,
      updatedAt: at
    };
    state.customers.push(cust);
    return { customer: cust, created: true };
  }

  function contactsForCustomer(state, customerId) {
    return state.contacts.filter(function (c) { return c.customerId === customerId; });
  }

  function findContact(state, customerId, email, name) {
    var list = contactsForCustomer(state, customerId);
    var e = String(email || '').trim().toLowerCase();
    var n = String(name || '').trim().toLowerCase();
    for (var i = 0; i < list.length; i++) {
      if (e && String(list[i].email || '').toLowerCase() === e) return list[i];
    }
    for (var j = 0; j < list.length; j++) {
      if (n && String(list[j].name || '').toLowerCase() === n) return list[j];
    }
    return null;
  }

  function createContact(state, customerId, fields, at) {
    var hasPrimary = contactsForCustomer(state, customerId).some(function (c) { return c.isPrimary; });
    var c = {
      id: fields.id || makeId('con'),
      customerId: customerId,
      name: String(fields.name || '').trim() || String(fields.email || '').trim() || 'Contact',
      role: String(fields.role || '').trim(),
      email: String(fields.email || '').trim(),
      phone: String(fields.phone || '').trim(),
      notes: String(fields.notes || '').trim(),
      isPrimary: !hasPrimary,
      createdAt: at,
      updatedAt: at
    };
    // #8: buying roles, stored only when set.
    if (fields.decisionMaker === true) c.decisionMaker = true;
    if (BUYING_ROLES.indexOf(String(fields.buyingRole || '')) !== -1) c.buyingRole = fields.buyingRole;
    state.contacts.push(c);
    return c;
  }

  // Step 1 + 2 for one deal. Idempotent: skips deals that already carry customerId.
  function migrateDeal(state, deal, at, report) {
    if (!deal.status) deal.status = 'open';
    if (!Array.isArray(deal.projectIds)) deal.projectIds = [];
    if (!Array.isArray(deal.contactIds)) deal.contactIds = [];
    if (deal.primaryContactId === undefined) deal.primaryContactId = null;
    if (deal.coverFileId === undefined) deal.coverFileId = null;

    var legacyName = deal.contactName;
    var legacyEmail = deal.contactEmail;
    var legacyPhone = deal.contactPhone;
    var hasLegacy = !!(String(legacyName || '').trim() || String(legacyEmail || '').trim() || String(legacyPhone || '').trim());

    if (isShopNeedsStage(deal.stage)) {
      // TODO(owner): Shop Needs cards are internal purchasing cards. No Customer required (brief default 7).
      deal.type = 'internal';
      if (deal.customerId === undefined) deal.customerId = null;
      delete deal.contactName; delete deal.contactEmail; delete deal.contactPhone;
      report.internalLeads += 1;
      return;
    }

    if (!deal.customerId) {
      var res = findOrCreateCustomer(state, deal.company || deal.title, deal.source, at);
      deal.customerId = res.customer.id;
      if (res.created) report.customersCreated += 1; else report.customersReused += 1;
      if (!res.customer.updatedAt || deal.updatedAt > res.customer.updatedAt) res.customer.updatedAt = deal.updatedAt || at;
    }

    if (hasLegacy) {
      var existing = findContact(state, deal.customerId, legacyEmail, legacyName);
      var contact;
      if (existing) {
        // Fill blanks on the existing contact from this deal without overwriting.
        if (!existing.email && legacyEmail) existing.email = String(legacyEmail).trim();
        if (!existing.phone && legacyPhone) existing.phone = String(legacyPhone).trim();
        contact = existing;
        report.contactsMerged += 1;
      } else {
        contact = createContact(state, deal.customerId, { name: legacyName, email: legacyEmail, phone: legacyPhone }, deal.createdAt || at);
        report.contactsCreated += 1;
      }
      if (deal.contactIds.indexOf(contact.id) === -1) deal.contactIds.push(contact.id);
      if (!deal.primaryContactId) deal.primaryContactId = contact.id;
    }
    delete deal.contactName;
    delete deal.contactEmail;
    delete deal.contactPhone;
  }

  var BOARD_STATUS = {
    'pp-design': 'design', 'pp-prototyping': 'prototype', 'pp-tooling': 'tooling',
    'pp-raw-material-sampling': 'tooling', 'pp-freight': 'production'
  };

  function projectStatusFor(sectionInfo) {
    if (!sectionInfo || !sectionInfo.section) return 'design';
    if (sectionInfo.area === 'floor-operations' || sectionInfo.area === 'operations') return 'production';
    return BOARD_STATUS[sectionInfo.section.id] || 'design';
  }

  function emptySlots() {
    var o = {};
    SLOT_KEYS.forEach(function (k) { o[k] = []; });
    return o;
  }

  function cloneSlots(files) {
    var out = emptySlots();
    SLOT_KEYS.forEach(function (k) { out[k] = ((files && files[k]) || []).slice(); });
    return out;
  }

  // Build a Project from a lead. Used by migration step 3 and by graduation in the app.
  function buildProject(state, lead, opts, at) {
    opts = opts || {};
    var sectionInfo = sectionAreaForStage(state, opts.stage || lead.stage);
    var proj = {
      id: opts.id || makeId('prj'),
      customerId: opts.customerId || lead.customerId || null,
      leadId: lead.id,
      name: opts.name || lead.title || lead.company || 'Project',
      company: lead.company || '',
      title: opts.name || lead.title || lead.company || 'Project',
      description: '',
      area: sectionInfo.area,
      board: sectionInfo.section ? sectionInfo.section.id : null,
      stage: opts.stage || lead.stage,
      stageEnteredAt: opts.stage && opts.stage !== lead.stage ? at : (lead.stageEnteredAt || at),
      status: projectStatusFor(sectionInfo),
      values: opts.copyMoney === false ? { designDfm: 0, prototyping: 0, tooling: 0, productionArr: 0, currentPo: 0, partnerServices: 0 } : JSON.parse(JSON.stringify(lead.values || {})),
      contactIds: (lead.contactIds || []).slice(),
      primaryContactId: lead.primaryContactId || null,
      coverFileId: opts.moveCover ? (lead.coverFileId || null) : null,
      moldIds: [],
      progress: lead.progress ? JSON.parse(JSON.stringify(lead.progress)) : null,
      followUps: lead.followUps ? JSON.parse(JSON.stringify(lead.followUps)) : [],
      nextFollowUp: opts.keepFollowUp === false ? null : (lead.nextFollowUp || null),
      rot: lead.rot ? JSON.parse(JSON.stringify(lead.rot)) : null,
      notes: opts.copyNotes === false ? [] : JSON.parse(JSON.stringify(lead.notes || [])),
      timeline: [],
      files: opts.copyFiles === false ? emptySlots() : cloneSlots(lead.files),
      source: lead.source || '',
      pipedriveId: lead.pipedriveId || null,
      targetShipDate: null,
      poNumber: '',
      lastActivityAt: lead.lastActivityAt || at,
      createdAt: at,
      updatedAt: at
    };
    if (opts.moveFiles) {
      lead.files = emptySlots();
    }
    if (opts.moveCover && lead.coverFileId) {
      var ref = (state.files || []).find(function (f) { return f.id === lead.coverFileId; });
      if (ref) { ref.ownerType = 'project'; ref.ownerId = proj.id; }
      lead.coverFileId = null;
    }
    return proj;
  }

  function markConverted(lead, projectId, at) {
    lead.status = 'converted';
    if (!Array.isArray(lead.projectIds)) lead.projectIds = [];
    if (lead.projectIds.indexOf(projectId) === -1) lead.projectIds.push(projectId);
    lead.convertedAt = lead.convertedAt || at;
    lead.updatedAt = at;
  }

  // Step 3: cards already on Pre-Production or Operations boards become Projects.
  function migrateProjects(state, at, report) {
    (state.deals || []).forEach(function (d) {
      if (d.type === 'internal') return;
      var info = sectionAreaForStage(state, d.stage);
      if (!info.section || !isProjectAreaId(state, info.area)) return;
      var pid = 'prj_' + d.id;
      if (state.projects.some(function (p) { return p.id === pid; })) return; // idempotent
      if (isClosedLead(d) && (d.projectIds || []).length) return;
      var proj = buildProject(state, d, { id: pid, moveFiles: true, moveCover: true }, at);
      state.projects.push(proj);
      markConverted(d, pid, at);
      report.projectsOut += 1;
      report.convertedLeads += 1;
    });
  }

  // Simplification pass 1 (Owner approved 2026-09-23). Runs once, guarded by settings.simplified1,
  // so boards Owner re-adds later through Edit menu are left alone.
  //  - Pre-Production: Raw Material Sampling and Logistics boards fold into Tooling as its last stages.
  //  - Operations / Scheduling: empty stub stages removed; any card on them moves to the first Scheduling stage.
  //  - Tasks: quadrant "do" becomes the Today flag. Other Eisenhower values stay on the task, unused.
  var FOLD_INTO_TOOLING = ['pp-raw-material-sampling', 'pp-freight'];
  var SCHEDULING_STUBS = ['materials-ready', 'first-articles', 'production-setup'];

  function simplifyPass1(state, at, report) {
    if (state.settings.simplified1) return;
    var secs = state.sections || [];
    var tooling = secs.find(function (x) { return x.id === 'pp-tooling'; });
    if (tooling) {
      if (!Array.isArray(tooling.stages)) tooling.stages = [];
      FOLD_INTO_TOOLING.forEach(function (id) {
        var sec = secs.find(function (x) { return x.id === id; });
        if (!sec) return;
        (sec.stages || []).forEach(function (st) {
          if (tooling.stages.indexOf(st) === -1) tooling.stages.push(st);
        });
        report.boardsFolded += 1;
      });
      state.sections = secs.filter(function (x) { return FOLD_INTO_TOOLING.indexOf(x.id) === -1; });
    }
    var sched = (state.sections || []).find(function (x) { return x.id === 'fo-scheduling'; });
    if (sched && Array.isArray(sched.stages)) {
      var keep = sched.stages.filter(function (st) { return SCHEDULING_STUBS.indexOf(st) === -1; });
      if (keep.length) {
        var landing = keep[0];
        var cards = (state.deals || []).concat(state.projects || []);
        cards.forEach(function (c) {
          if (SCHEDULING_STUBS.indexOf(c.stage) !== -1) {
            c.stage = landing;
            c.stageEnteredAt = at;
            report.cardsMovedOffStubs += 1;
          }
        });
        report.stubStagesRemoved += sched.stages.length - keep.length;
        sched.stages = keep;
      }
    }
    (state.tasks || []).forEach(function (t) {
      if (t.quadrant === 'do' && !t.today) { t.today = true; report.tasksToToday += 1; }
    });
    state.settings.simplified1 = at;
  }

  // Cold Leads cleanup 1 (Owner 2026-09-23): cards on the Cold Leads board carry no follow-ups.
  // Clears next follow-up dates and closes open manual Follow Ups tasks linked to those cards.
  var COLD_BOARD_ID = 'cold-leads';

  function coldStages(state) {
    var sec = (state.sections || []).find(function (x) { return x.id === COLD_BOARD_ID; });
    return sec ? (sec.stages || []) : [];
  }

  function coldCleanup1(state, at, report) {
    if (state.settings.coldCleanup1) return;
    var stages = coldStages(state);
    var coldIds = {};
    (state.deals || []).forEach(function (d) {
      if (stages.indexOf(d.stage) === -1) return;
      coldIds[d.id] = true;
      if (d.nextFollowUp) { d.nextFollowUp = null; report.coldFollowUpsCleared += 1; }
      if (Array.isArray(d.followUps) && d.followUps.length) d.followUps = [];
    });
    (state.tasks || []).forEach(function (t) {
      var ref = t.entityId || t.dealId;
      if (t.done || !ref || !coldIds[ref] || t.bucket !== 'tasks-crm-follow-ups') return;
      t.done = true; t.completedAt = at; t.dismissedAt = at; t.today = false;
      report.coldTasksClosed += 1;
    });
    state.settings.coldCleanup1 = at;
  }

  // Won, awaiting payment (issue #97, Owner 2026-10-08). Runs once, guarded by settings.wonAwaitingPayment1.
  // Adds the stage to the Quotes board right after Invoicing (end of the board if Invoicing is gone).
  // Adds ids only: no card, label or order of anything else changes. report.wonStage is
  // 'added', 'exists' (a stage with that label is already on Quotes) or 'noBoard'.
  var WON_AWAITING_STAGE = 'won-awaiting-payment';
  var WON_AWAITING_LABEL = 'Won, awaiting payment';
  var WON_AWAITING_BOARD = 'quotes';

  function wonStagePending(state) {
    return !(state && state.settings && state.settings.wonAwaitingPayment1);
  }

  function addWonAwaitingStage(state, at, report, who) {
    if (!wonStagePending(state)) return;
    var sec = (state.sections || []).find(function (x) { return x && x.id === WON_AWAITING_BOARD; });
    if (!sec) { report.wonStage = 'noBoard'; state.settings.wonAwaitingPayment1 = at; return; }
    if (!Array.isArray(sec.stages)) sec.stages = [];
    if (!state.stageLabels || typeof state.stageLabels !== 'object') state.stageLabels = {};
    var want = WON_AWAITING_LABEL.toLowerCase();
    var have = sec.stages.some(function (x) {
      return String(state.stageLabels[x] || '').trim().toLowerCase() === want;
    });
    if (have) { report.wonStage = 'exists'; state.settings.wonAwaitingPayment1 = at; return; }
    if (!Array.isArray(state.stages)) state.stages = [];
    var after = sec.stages.indexOf('invoicing');
    sec.stages.splice(after === -1 ? sec.stages.length : after + 1, 0, WON_AWAITING_STAGE);
    if (state.stages.indexOf(WON_AWAITING_STAGE) === -1) {
      var gi = state.stages.indexOf('invoicing');
      if (gi === -1) {
        var last = sec.stages.map(function (x) { return state.stages.indexOf(x); }).filter(function (x) { return x !== -1; });
        gi = last.length ? Math.max.apply(null, last) : state.stages.length - 1;
      }
      state.stages.splice(gi + 1, 0, WON_AWAITING_STAGE);
    }
    if (!state.stageLabels[WON_AWAITING_STAGE]) state.stageLabels[WON_AWAITING_STAGE] = WON_AWAITING_LABEL;
    report.wonStage = 'added';
    state.settings.wonAwaitingPayment1 = at;
    state.changeLog.push({
      id: makeId('chg'), at: at, who: who || 'system', source: 'system', action: 'stage-add',
      entityType: 'state', entityId: null, detail: 'Added stage ' + WON_AWAITING_LABEL + ' on Quotes after Invoicing'
    });
  }

  // Awaiting Payment first on Pre-Production (issue #101, Owner 2026-10-10). Runs once, guarded by
  // settings.awaitingPaymentFirst1; the app takes the Time machine copy before-awaiting-payment-move first.
  // Adds the stage first on the SKU board, takes #97's Quotes stage off (its id and label stay in
  // stageLabels) and moves what sat there: leads go back to Invoicing (Pre-Production only holds SKU
  // jobs and Mark won stays a person's confirmation), SKU jobs go to the new stage. Nothing is created.
  // report.awaitingStage is 'added', 'exists' or 'noBoard'.
  var AWAITING_STAGE = 'awaiting-payment';
  var AWAITING_LABEL = 'Awaiting Payment';

  function awaitingPaymentPending(state) {
    return !(state && state.settings && state.settings.awaitingPaymentFirst1);
  }

  function moveAwaitingPaymentStage(state, at, report, who) {
    if (!awaitingPaymentPending(state)) return;
    var board = boardForKind(state, 'sku');
    if (!board) { report.awaitingStage = 'noBoard'; state.settings.awaitingPaymentFirst1 = at; return; }
    if (!Array.isArray(board.stages)) board.stages = [];
    if (!Array.isArray(state.stages)) state.stages = [];
    if (!state.stageLabels || typeof state.stageLabels !== 'object') state.stageLabels = {};
    if (board.stages.indexOf(AWAITING_STAGE) === -1) {
      var firstOther = board.stages[0];
      board.stages.unshift(AWAITING_STAGE);
      if (state.stages.indexOf(AWAITING_STAGE) === -1) {
        var gi = firstOther ? state.stages.indexOf(firstOther) : -1;
        state.stages.splice(gi === -1 ? state.stages.length : gi, 0, AWAITING_STAGE);
      }
      report.awaitingStage = 'added';
    } else report.awaitingStage = 'exists';
    if (!state.stageLabels[AWAITING_STAGE]) state.stageLabels[AWAITING_STAGE] = AWAITING_LABEL;
    var oldStage = WON_AWAITING_STAGE, back = 0, jobs = 0;
    (state.deals || []).forEach(function (d) {
      if (!d || d.stage !== oldStage) return;
      var sec = (state.sections || []).find(function (x) { return x && (x.stages || []).indexOf(oldStage) !== -1; });
      var at0 = sec ? sec.stages.indexOf(oldStage) : -1;
      var prev = at0 > 0 ? sec.stages[at0 - 1] : (state.stages.indexOf('invoicing') !== -1 ? 'invoicing' : (sec && sec.stages.filter(function (x) { return x !== oldStage; })[0]) || '');
      if (!prev) return;
      d.stage = prev; d.stageEnteredAt = at; d.updatedAt = at; back += 1;
    });
    (state.skus || []).forEach(function (k) {
      if (!k || k.stage !== oldStage) return;
      setSkuStage(state, k, AWAITING_STAGE, at); k.updatedAt = at; jobs += 1;
    });
    (state.sections || []).forEach(function (x) {
      if (x && Array.isArray(x.stages) && x.stages.indexOf(oldStage) !== -1) x.stages = x.stages.filter(function (y) { return y !== oldStage; });
    });
    state.stages = state.stages.filter(function (y) { return y !== oldStage; });
    report.awaitingLeadsBack = back; report.awaitingSkusMoved = jobs;
    state.settings.awaitingPaymentFirst1 = at;
    state.changeLog.push({
      id: makeId('chg'), at: at, who: who || 'system', source: 'system', action: 'stage-add',
      entityType: 'state', entityId: null,
      detail: 'Awaiting Payment is now the first Pre-Production stage; Won, awaiting payment left Quotes (' + back + ' lead(s) back to Invoicing, ' + jobs + ' SKU job(s) moved)'
    });
  }

  // KPI pipeline views (Owner 2026-09-23). A view is a set of whole boards minus excluded stages,
  // so stages added later to an included board join the view automatically.
  var PIPELINE_AREAS = ['crm', 'pre-production', 'floor-operations'];

  function defaultPipelineViews(state) {
    var secs = state.sections || [];
    var hotBoards = secs.filter(function (x) {
      return x.kind !== 'separator' && PIPELINE_AREAS.indexOf(x.area) !== -1 && x.id !== COLD_BOARD_ID && x.id !== 'fo-ordering';
    }).map(function (x) { return x.id; });
    return [
      { id: 'pv_hot', name: 'Hot Pipeline', boards: hotBoards, excludeStages: ['lost'], color: 'hot' },
      { id: 'pv_cold', name: 'Cold Pipeline', boards: [COLD_BOARD_ID], excludeStages: ['lost'], color: 'cold' }
    ];
  }

  function ensurePipelineViews(state) {
    if (!Array.isArray(state.pipelineViews) || !state.pipelineViews.length) {
      if (state.settings.pipelineViewsSeeded && Array.isArray(state.pipelineViews)) return; // user deleted them all on purpose
      state.pipelineViews = defaultPipelineViews(state);
      state.settings.pipelineViewsSeeded = true;
    }
    state.pipelineViews.forEach(function (v) {
      if (!Array.isArray(v.boards)) v.boards = [];
      if (!Array.isArray(v.excludeStages)) v.excludeStages = [];
      if (!v.id) v.id = makeId('pv');
      if (!v.name) v.name = 'Pipeline';
    });
  }

  function pipelineViewStages(state, view) {
    var out = [];
    (state.sections || []).forEach(function (sec) {
      if ((view.boards || []).indexOf(sec.id) === -1) return;
      (sec.stages || []).forEach(function (st) {
        if ((view.excludeStages || []).indexOf(st) === -1 && out.indexOf(st) === -1) out.push(st);
      });
    });
    return out;
  }

  // Step 5: tasks point at lead or project by entity. dealId stays as a deprecated alias.
  function migrateTasks(state, at, report) {
    (state.tasks || []).forEach(function (t) {
      if (t.entityType && t.entityId) { t.dealId = t.entityId; return; }
      if (!t.dealId) { t.entityType = null; t.entityId = null; return; }
      var proj = state.projects.find(function (p) { return p.id === t.dealId; });
      if (proj) { t.entityType = 'project'; t.entityId = proj.id; report.tasksRehomed += 1; return; }
      var lead = (state.deals || []).find(function (d) { return d.id === t.dealId; });
      if (lead && isClosedLead(lead) && lead.projectIds && lead.projectIds.length === 1) {
        t.entityType = 'project'; t.entityId = lead.projectIds[0]; t.dealId = t.entityId; t.inheritedFromLeadId = lead.id;
        report.tasksRehomed += 1; return;
      }
      t.entityType = 'lead'; t.entityId = t.dealId; report.tasksRehomed += 1;
    });
  }

  // Step 4: FileRef index for lead and project slot files (blobKey unchanged, no IndexedDB rewrite).
  function rebuildLeadFileRefs(state, at) {
    // Keep covers and every document not owned by a lead or project slot (materials, vendors, quotes).
    var covers = state.files.filter(function (f) {
      return f && (f.slot === 'cover' || (f.ownerType !== 'lead' && f.ownerType !== 'project'));
    });
    var refs = [];
    var owners = (state.deals || []).map(function (d) { return { type: 'lead', card: d }; })
      .concat((state.projects || []).map(function (p) { return { type: 'project', card: p }; }));
    owners.forEach(function (o) {
      var d = o.card;
      var files = d.files || {};
      SLOT_KEYS.forEach(function (slot) {
        (files[slot] || []).forEach(function (f) {
          if (!f || !f.id) return;
          refs.push({
            id: f.id,
            ownerType: o.type,
            ownerId: d.id,
            slot: slot,
            name: f.name || 'file',
            mime: f.mime || '',
            size: Number(f.size) || 0,
            blobKey: f.dataKey || (f.dataURL || f.url ? null : f.id),
            inlineDataURL: f.dataURL ? true : false,
            uploadedAt: f.addedAt || at,
            uploadedBy: f.uploadedBy || 'user',
            url: f.url || null,
            driveFileId: f.driveFileId || null,
            driveUrl: f.driveUrl || null,
            driveFolderId: f.driveFolderId || null
          });
        });
      });
    });
    state.files = covers.concat(refs);
    return refs.length;
  }

  function emptyReport() {
    return {
      dealsIn: 0, leadsOut: 0, projectsOut: 0, customersCreated: 0, customersReused: 0,
      contactsCreated: 0, contactsMerged: 0, filesRehomed: 0, tasksRehomed: 0, internalLeads: 0, convertedLeads: 0,
      boardsFolded: 0, stubStagesRemoved: 0, cardsMovedOffStubs: 0, tasksToToday: 0,
      coldFollowUpsCleared: 0, coldTasksClosed: 0,
      boardsAdded: 0, leadsWon: 0, quotesPickedUp: 0, placeholderSkus: 0, skusFromProjects: 0, notesMoved: 0,
      tasksToSkus: 0, posCreated: 0, projectsArchived: 0, skuJobsFirstRun: false, wonStage: null, awaitingStage: null,
      pdIds: 0, jfIds: 0, fromVersion: null, toVersion: SCHEMA_VERSION, at: null
    };
  }

  // Entry point. Mutates and returns state. Safe to run on already migrated state.
  function migrateToV12(state, opts) {
    opts = opts || {};
    var at = opts.at || nowIso();
    ensureArrays(state);
    var report = emptyReport();
    report.at = at;
    report.fromVersion = Number(state.version) || 11;
    var deals = state.deals || [];
    report.dealsIn = deals.length;
    deals.forEach(function (d) { migrateDeal(state, d, at, report); });
    simplifyPass1(state, at, report);
    coldCleanup1(state, at, report);
    addWonAwaitingStage(state, at, report, opts.who);
    ensurePipelineViews(state);
    migrateProjects(state, at, report);
    migrateTasks(state, at, report);
    migrateSkuJobs(state, at, report);
    moveAwaitingPaymentStage(state, at, report, opts.who);
    report.filesRehomed = rebuildLeadFileRefs(state, at);
    report.leadsOut = deals.length;
    report.projectsOut = (state.projects || []).length;
    report.pdIds = deals.filter(function (d) { return /^pd-/.test(String(d.id)); }).length;
    report.jfIds = deals.filter(function (d) { return /^jf-/.test(String(d.id)); }).length;
    // Customers with no remaining deals (possible after Import of a subset) are kept on purpose.
    state.version = SCHEMA_VERSION;
    state.schemaVersion = SCHEMA_VERSION;
    if (report.boardsFolded || report.stubStagesRemoved) {
      state.changeLog.push({
        id: makeId('chg'), at: at, who: opts.who || 'system', source: 'system', action: 'simplify',
        entityType: 'state', entityId: null,
        detail: 'Simplification pass 1: folded ' + report.boardsFolded + ' boards into Tooling, removed ' +
          report.stubStagesRemoved + ' stub stages, moved ' + report.cardsMovedOffStubs + ' cards, ' +
          report.tasksToToday + ' tasks flagged Today'
      });
    }
    if (report.coldFollowUpsCleared || report.coldTasksClosed) {
      state.changeLog.push({
        id: makeId('chg'), at: at, who: opts.who || 'system', source: 'system', action: 'cold-cleanup',
        entityType: 'state', entityId: null,
        detail: 'Cold Leads: cleared ' + report.coldFollowUpsCleared + ' follow-up dates, closed ' + report.coldTasksClosed + ' follow-up tasks'
      });
    }
    if (report.projectsArchived || report.leadsWon || report.boardsAdded || report.quotesPickedUp) {
      state.changeLog.push({
        id: makeId('chg'), at: at, who: opts.who || 'system', source: 'system', action: 'sku-jobs',
        entityType: 'state', entityId: null, detail: skuJobsLogLine(report)
      });
    }
    if (report.fromVersion < SCHEMA_VERSION || opts.forceLog) {
      state.changeLog.push({
        id: makeId('chg'),
        at: at,
        who: opts.who || 'system',
        source: 'system',
        action: 'migrate',
        entityType: 'state',
        entityId: null,
        detail: 'v' + report.fromVersion + ' to v' + SCHEMA_VERSION + ': ' + report.dealsIn + ' deals, ' +
          report.customersCreated + ' customers created, ' + report.contactsCreated + ' contacts created, ' +
          report.projectsOut + ' projects, ' + report.tasksRehomed + ' tasks rehomed, ' + report.filesRehomed + ' file refs'
      });
    }
    state.lastMigrationReport = report;
    return { state: state, report: report };
  }

  // Assertions used by the in-app Admin check and tests/migration-test.js.
  function checkMigration(state, expectations) {
    expectations = expectations || {};
    var problems = [];
    var deals = state.deals || [];
    if (expectations.dealCount != null && deals.length !== expectations.dealCount) {
      problems.push('deal count ' + deals.length + ' expected ' + expectations.dealCount);
    }
    var missingCustomer = deals.filter(function (d) { return d.type !== 'internal' && !d.customerId; });
    if (missingCustomer.length) problems.push(missingCustomer.length + ' leads have no customerId');
    var badCustomerRef = deals.filter(function (d) {
      return d.customerId && !(state.customers || []).some(function (c) { return c.id === d.customerId; });
    });
    if (badCustomerRef.length) problems.push(badCustomerRef.length + ' leads point at missing customers');
    var legacy = deals.filter(function (d) { return 'contactName' in d || 'contactEmail' in d || 'contactPhone' in d; });
    if (legacy.length) problems.push(legacy.length + ' leads still carry legacy contact fields');
    var uniqueNames = {};
    deals.forEach(function (d) { if (d.type !== 'internal') uniqueNames[normalizeCompanyName(d.company || d.title) || 'unnamed'] = true; });
    var uniqueCount = Object.keys(uniqueNames).length;
    if ((state.customers || []).length < uniqueCount) {
      problems.push('customers ' + state.customers.length + ' fewer than unique company names ' + uniqueCount);
    }
    (state.customers || []).forEach(function (c) {
      var prim = (state.contacts || []).filter(function (x) { return x.customerId === c.id && x.isPrimary; });
      if (prim.length > 1) problems.push('customer ' + c.id + ' has ' + prim.length + ' primary contacts');
    });
    if (expectations.requirePrefixes) {
      expectations.requirePrefixes.forEach(function (p) {
        if (!deals.some(function (d) { return String(d.id).indexOf(p) === 0; })) problems.push('no ' + p + ' ids survived');
      });
    }
    var enrichmentLost = deals.filter(function (d) { return /^jf-/.test(String(d.id)) && !d.enrichment; });
    if (enrichmentLost.length) problems.push(enrichmentLost.length + ' jf-* deals lost enrichment block');
    // Projects: every project has a customer and a stage on a non-CRM board; every converted lead points at real projects.
    (state.projects || []).forEach(function (p) {
      if (!p.customerId) problems.push('project ' + p.id + ' has no customerId');
      var info = sectionAreaForStage(state, p.stage);
      if (!info.section || !isProjectAreaId(state, info.area)) problems.push('project ' + p.id + ' stage ' + p.stage + ' is not on a Pre-Production or Operations board');
    });
    deals.forEach(function (d) {
      if (isClosedLead(d)) {
        (d.projectIds || []).forEach(function (pid) {
          if (!(state.projects || []).some(function (p) { return p.id === pid; })) problems.push('lead ' + d.id + ' points at missing project ' + pid);
        });
      } else if (d.type !== 'internal') {
        var li = sectionAreaForStage(state, d.stage);
        if (li.section && isProjectAreaId(state, li.area)) problems.push('open lead ' + d.id + ' sits on a project board stage ' + d.stage);
      }
    });
    (state.tasks || []).forEach(function (t) {
      if (t.dealId && !t.entityType) problems.push('task ' + t.id + ' has dealId but no entityType');
    });
    // SKU jobs: every SKU on a board sits on a Pre-Production or Operations stage, every PO line
    // points at a real SKU, and no project is left unarchived once SKU jobs ran.
    (state.skus || []).forEach(function (sk) {
      if (!sk.stage) return;
      var si = sectionAreaForStage(state, sk.stage);
      if (!si.section || !isProjectAreaId(state, si.area)) problems.push('sku ' + sk.id + ' stage ' + sk.stage + ' is not on a Pre-Production or Operations board');
    });
    (state.customerPos || []).forEach(function (po) {
      (po.lines || []).forEach(function (l) {
        if (!(state.skus || []).some(function (sk) { return sk.id === l.skuId; })) problems.push('po ' + po.id + ' line ' + l.id + ' points at missing sku ' + l.skuId);
      });
    });
    if (state.settings && state.settings.skuJobs1) {
      var live = (state.projects || []).filter(function (p) { return !p.archived; });
      if (live.length) problems.push(live.length + ' projects not moved to SKU jobs');
    }
    return { ok: problems.length === 0, problems: problems, uniqueCompanyNames: uniqueCount };
  }

  // ---------------------------------------------------------------------
  // Enrichment import (issue #7, Owner 2026-09-23). Approved bots and admins patch leads,
  // their customer and contacts from Gmail and Drive research.
  //  - Empty fields fill directly. A different non-empty value never overwrites silently:
  //    it goes to the proposal queue for Owner. Admins may overwrite per field.
  //  - Lists (contacts, notes, timeline, files, quotes) are add-only with dedupe.
  //  - Nothing is ever removed. Empty values in a patch are ignored, never used to clear.
  //  - Every change is logged with by, actedFor, source 'enrichment', old and new value.
  // Shared by the app (Admin tools > Import enrichment) and functions/index.js (patchDeals).
  // ---------------------------------------------------------------------
  var ENRICH_SOURCE = 'enrichment';
  var ENRICH_LOG_CAP = 500;
  var ENRICH_LEAD_LOCKED = ['id', 'stage', 'stageEnteredAt', 'customerId', 'createdAt', 'updatedAt', 'lastActivityAt',
    'notes', 'timeline', 'files', 'contactIds', 'primaryContactId', 'projectIds', 'status', 'type', 'coverFileId',
    'convertedAt', 'enrichment', 'pendingCustomerQuotes', 'followUps', 'lostReason', 'samples', 'invoices', 'docLinks'];
  var ENRICH_CUSTOMER_LOCKED = ['id', 'normalizedName', 'createdAt', 'updatedAt', 'coverFileId', 'driveFolderId'];
  var ENRICH_CONTACT_FIELDS = ['name', 'role', 'email', 'phone', 'notes', 'decisionMaker', 'buyingRole'];
  var LEGACY_CONTACT_FIELDS = { contactName: 'name', contactEmail: 'email', contactPhone: 'phone' };
  var ENRICH_KNOWN_KEYS = ['leadId', 'ifUpdatedAt', 'fields', 'customer', 'contactsAdd', 'contactsUpdate', 'notesAdd',
    'timelineAdd', 'filesAdd', 'quotesAdd', 'sources', 'overwrite', 'samplesAdd', 'invoicesAdd', 'docLinksAdd'];

  function isBlank(v) {
    if (v === undefined || v === null) return true;
    if (typeof v === 'string') return v.trim() === '';
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'object') return Object.keys(v).length === 0;
    return false;
  }

  function sameValue(a, b) {
    if (typeof a === 'string' && typeof b === 'string') return a.trim() === b.trim();
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function clip(v) {
    var s = typeof v === 'string' ? v : JSON.stringify(v);
    if (s === undefined) s = '';
    return s.length > 80 ? s.slice(0, 77) + '...' : s;
  }

  function dayOf(iso) { return String(iso || '').slice(0, 10); }

  function isHttpUrl(u) { return /^https?:\/\/\S+$/i.test(String(u || '').trim()); }

  // Overwrite flags: { field: true } or ['field', 'customer.website'].
  function overwriteSet(patch) {
    var out = {};
    var o = patch.overwrite;
    if (Array.isArray(o)) o.forEach(function (k) { out[String(k)] = true; });
    else if (o && typeof o === 'object') Object.keys(o).forEach(function (k) { if (o[k] === true) out[k] = true; });
    return out;
  }

  function emptyEnrichSummary() {
    return {
      patches: 0, leadsTouched: 0, fieldsFilled: 0, fieldsOverwritten: 0, conflicts: 0, unchanged: 0,
      contactsAdded: 0, contactsUpdated: 0, notesAdded: 0, timelineAdded: 0, filesAdded: 0, quotesHeld: 0, quotesMarkedSent: 0, quotesMarkedAccepted: 0, quotesUpdated: 0, sectionRowsAdded: 0,
      sourcesAdded: 0, duplicates: 0, skippedUnknown: [], skippedStale: [], skippedNoAccess: [], ignored: [],
      frozen: false
    };
  }

  // patches: array of lead patches (see ENRICH_KNOWN_KEYS). Mutates state; callers wanting a dry run
  // pass a copy. opts: { by, actedFor, isAdmin, at, canWriteLead(deal), canWriteCustomers, frozen }.
  function applyEnrichment(state, patches, opts) {
    opts = opts || {};
    ensureArrays(state);
    var at = opts.at || nowIso();
    var by = String(opts.by || 'unknown').toLowerCase();
    var actedFor = opts.actedFor ? String(opts.actedFor).toLowerCase() : null;
    var admin = !!opts.isAdmin;
    var canWriteLead = typeof opts.canWriteLead === 'function' ? opts.canWriteLead : function () { return true; };
    var canWriteCustomers = opts.canWriteCustomers !== false;
    var summary = emptyEnrichSummary();
    var list = Array.isArray(patches) ? patches : [];
    summary.patches = list.length;
    if (opts.frozen && !admin) {
      summary.frozen = true;
      return { summary: summary };
    }

    function log(entityType, entityId, action, field, oldValue, newValue, detail) {
      state.changeLog.push({
        id: makeId('chg'), at: at, who: by, by: by, actedFor: actedFor, source: ENRICH_SOURCE,
        action: action, entityType: entityType, entityId: entityId || null,
        field: field || null, oldValue: oldValue === undefined ? null : oldValue, newValue: newValue === undefined ? null : newValue,
        detail: detail
      });
    }

    function propose(entityType, entityId, leadId, field, oldValue, value, sources, label) {
      var dup = state.proposals.some(function (p) {
        return p.status === 'pending' && p.action === 'set-field' && p.entityType === entityType && p.entityId === entityId &&
          p.payload && p.payload.field === field && sameValue(p.payload.value, value);
      });
      if (dup) { summary.duplicates += 1; return; }
      var prop = {
        id: makeId('prp'), at: at, bot: by, actedFor: actedFor, source: ENRICH_SOURCE, action: 'set-field',
        entityType: entityType, entityId: entityId,
        payload: { field: field, value: value, oldValue: oldValue, leadId: leadId, sources: sources || [] },
        summary: label + ' ' + field + ': keep "' + clip(oldValue) + '" or use "' + clip(value) + '"',
        status: 'pending', resolvedAt: null, resolvedBy: null
      };
      state.proposals.push(prop);
      summary.conflicts += 1;
      log(entityType, entityId, 'proposal', field, oldValue, value, 'Conflict sent to proposals: ' + field + ' "' + clip(oldValue) + '" vs "' + clip(value) + '"');
    }

    // One field on one record. Returns true when the record changed.
    function setField(rec, entityType, leadId, field, value, allowOverwrite, sources, label) {
      if (isBlank(value)) { summary.ignored.push(label + ' ' + field + ': empty value ignored (no deletes)'); return false; }
      var old = rec[field];
      if (!isBlank(old) && sameValue(old, value)) { summary.unchanged += 1; return false; }
      var copy = JSON.parse(JSON.stringify(value));
      if (isBlank(old)) {
        rec[field] = copy;
        summary.fieldsFilled += 1;
        log(entityType, rec.id, 'enrich', field, old === undefined ? null : old, copy, 'Filled ' + field + ': "' + clip(copy) + '"');
        return true;
      }
      if (allowOverwrite) {
        rec[field] = copy;
        summary.fieldsOverwritten += 1;
        log(entityType, rec.id, 'enrich-overwrite', field, old, copy, 'Overwrote ' + field + ': "' + clip(old) + '" to "' + clip(copy) + '" (admin)');
        return true;
      }
      propose(entityType, rec.id, leadId, field, old, copy, sources, label);
      return false;
    }

    function wantsOverwrite(ow, key, label) {
      if (!ow[key]) return false;
      if (admin) return true;
      summary.ignored.push(label + ' ' + key + ': overwrite is admin only, sent to proposals');
      return false;
    }

    function contactPatch(c) {
      var out = {};
      if (!c || typeof c !== 'object') return out;
      ENRICH_CONTACT_FIELDS.forEach(function (k) {
        if (isBlank(c[k])) return;
        if (k === 'decisionMaker') { if (c[k] === true || /^(true|yes|1)$/i.test(String(c[k]))) out[k] = true; return; }
        if (k === 'buyingRole') { var r = String(c[k]).trim().toLowerCase(); if (BUYING_ROLES.indexOf(r) !== -1) out[k] = r; return; }
        out[k] = String(c[k]).trim();
      });
      return out;
    }

    // Object sections (#8): each subfield fills when empty; a different value goes to proposals.
    function fillSection(rec, entityType, leadId, key, raw, ow, sources, label) {
      var def = recordSection(key);
      var c = cleanSectionValues(def, raw);
      c.bad.forEach(function (b) { summary.ignored.push(label + ' ' + key + '.' + b + ': invalid value ignored'); });
      var had = rec[key] && typeof rec[key] === 'object';
      if (!had) rec[key] = {};
      var changed = false;
      Object.keys(c.vals).forEach(function (sub) {
        var v = c.vals[sub];
        if (v === '') return;
        var path = key + '.' + sub;
        var old = rec[key][sub];
        if (!isBlank(old) && sameValue(old, v)) { summary.unchanged += 1; return; }
        if (isBlank(old) || wantsOverwrite(ow, entityType === 'customer' ? 'customer.' + path : path, label)) {
          rec[key][sub] = v;
          if (isBlank(old)) summary.fieldsFilled += 1; else summary.fieldsOverwritten += 1;
          log(entityType, rec.id, isBlank(old) ? 'enrich' : 'enrich-overwrite', path, old === undefined ? null : old, v, (isBlank(old) ? 'Filled ' : 'Overwrote ') + path + ': "' + clip(v) + '"');
          changed = true;
          return;
        }
        propose(entityType, rec.id, leadId, path, old, v, sources, label);
      });
      if (!had && !Object.keys(rec[key]).length) delete rec[key];
      return changed;
    }

    list.forEach(function (patch, idx) {
      if (!patch || typeof patch !== 'object' || !patch.leadId) {
        summary.skippedUnknown.push('#' + (idx + 1) + ' (no leadId)');
        return;
      }
      var deal = (state.deals || []).find(function (d) { return d && d.id === patch.leadId; });
      if (!deal) { summary.skippedUnknown.push(String(patch.leadId)); return; }
      if (patch.ifUpdatedAt && deal.updatedAt && String(deal.updatedAt) !== String(patch.ifUpdatedAt)) {
        summary.skippedStale.push(deal.id);
        return;
      }
      if (!canWriteLead(deal)) { summary.skippedNoAccess.push(deal.id); return; }
      var label = deal.company || deal.title || deal.id;
      var ow = overwriteSet(patch);
      var fieldSources = (patch.sources && typeof patch.sources === 'object') ? patch.sources : {};
      var leadChanged = false;
      var touched = false;
      Object.keys(patch).forEach(function (k) {
        if (ENRICH_KNOWN_KEYS.indexOf(k) === -1) summary.ignored.push(label + ': unknown key ' + k + ' ignored');
      });

      // Lead fields. Legacy contact fields become a contact on the customer.
      var fields = (patch.fields && typeof patch.fields === 'object') ? patch.fields : {};
      var legacyContact = {};
      Object.keys(fields).forEach(function (k) {
        if (LEGACY_CONTACT_FIELDS[k]) { legacyContact[LEGACY_CONTACT_FIELDS[k]] = fields[k]; return; }
        if (ENRICH_LEAD_LOCKED.indexOf(k) !== -1) { summary.ignored.push(label + ' ' + k + ': not editable by import'); return; }
        if (k === 'nextFollowUp' && coldStages(state).indexOf(deal.stage) !== -1) {
          summary.ignored.push(label + ' nextFollowUp: Cold Leads carry no follow-ups');
          return;
        }
        if (k === 'nextFollowUp' && !isBlank(deal.nextFollowUp) && !wantsOverwrite(ow, k, label)) {
          // An overdue follow-up (before today, Pacific) may move to today or later; the bot sends
          // this after it has handled the lead. Upcoming dates stay put (a change goes to proposals).
          var nf = String(fields[k] == null ? '' : fields[k]).trim().slice(0, 10);
          var nfOld = String(deal.nextFollowUp).slice(0, 10);
          var today = pacificDay(at);
          if (isIsoDay(nf) && isIsoDay(nfOld) && nfOld < today && nf >= today) {
            deal.nextFollowUp = nf;
            summary.fieldsOverwritten += 1;
            log('lead', deal.id, 'enrich-overwrite', k, nfOld, nf, 'Overdue follow-up ' + nfOld + ' moved to ' + nf + ' by ' + by.split('@')[0]);
            leadChanged = true;
            return;
          }
        }
        if (k === 'firstContactAt') {
          // #16: a date (YYYY-MM-DD). Same day = no change; a different day on a filled lead is a proposal.
          var fcv = String(fields[k] == null ? '' : fields[k]).trim().slice(0, 10);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(fcv)) { summary.ignored.push(label + ' firstContactAt: use YYYY-MM-DD'); return; }
          var fcOld = isBlank(deal.firstContactAt) ? '' : String(deal.firstContactAt).slice(0, 10);
          if (fcOld === fcv) { summary.unchanged += 1; return; }
          var fcSrc = toList(fieldSources[k]).map(function (x) { return String(x).split(':')[0]; }).filter(Boolean)[0] || '';
          if (!fcOld || wantsOverwrite(ow, k, label)) {
            deal.firstContactAt = fcv;
            if (fcOld) summary.fieldsOverwritten += 1; else summary.fieldsFilled += 1;
            log('lead', deal.id, fcOld ? 'enrich-overwrite' : 'enrich', k, fcOld || null, fcv,
              'First contact set to ' + fcv + ' by ' + by.split('@')[0] + '@' + (fcSrc ? ' (source: ' + fcSrc + ')' : '') + (fcOld ? ', was ' + fcOld : ''));
            leadChanged = true;
            return;
          }
          propose('lead', deal.id, deal.id, k, fcOld, fcv, fieldSources[k], label);
          return;
        }
        if (k === 'values') {
          // Deal values key by key: 0 or blank fills, the same number is unchanged, a different
          // non-zero number goes to proposals (or overwrites with an admin overwrite on values.<key>).
          var vin = fields[k];
          if (!vin || typeof vin !== 'object' || Array.isArray(vin)) { summary.ignored.push(label + ' values: send an object of numbers'); return; }
          if (!deal.values || typeof deal.values !== 'object') deal.values = {};
          Object.keys(vin).forEach(function (vk) {
            var vpath = 'values.' + vk;
            if (SKU_VALUE_KEYS.indexOf(vk) === -1) { summary.ignored.push(label + ' ' + vpath + ': unknown value key ignored'); return; }
            if (isBlank(vin[vk])) return;
            var nv = Number(String(vin[vk]).replace(/[$,\s]/g, ''));
            if (!isFinite(nv) || nv < 0) { summary.ignored.push(label + ' ' + vpath + ': use a number of 0 or more'); return; }
            var ov = Number(deal.values[vk]) || 0;
            if (ov === nv) { summary.unchanged += 1; return; }
            if (nv === 0) { summary.ignored.push(label + ' ' + vpath + ': 0 never clears a value'); return; }
            if (ov === 0 || wantsOverwrite(ow, vpath, label)) {
              deal.values[vk] = nv;
              if (ov === 0) summary.fieldsFilled += 1; else summary.fieldsOverwritten += 1;
              log('lead', deal.id, ov === 0 ? 'enrich' : 'enrich-overwrite', vpath, ov, nv, (ov === 0 ? 'Filled ' : 'Overwrote ') + vpath + ': ' + nv);
              leadChanged = true;
              return;
            }
            propose('lead', deal.id, deal.id, vpath, ov, nv, fieldSources[k] || fieldSources[vpath], label);
          });
          return;
        }
        var secDef = recordSection(k);
        if (secDef && secDef.type === 'object') {
          if (fillSection(deal, 'lead', deal.id, k, fields[k], ow, fieldSources[k], label)) leadChanged = true;
          return;
        }
        // #102: ARR potential (a number) and the estimate / pin flags (true or false).
        if (k === 'arrPotential') {
          var ap = Number(String(fields[k]).replace(/[$,\s]/g, ''));
          if (fields[k] === '' || fields[k] == null || !(ap >= 0)) { summary.ignored.push(label + ' arrPotential: use a number'); return; }
          if (setField(deal, 'lead', deal.id, k, Math.round(ap * 100) / 100, wantsOverwrite(ow, k, label), fieldSources[k], label)) leadChanged = true;
          return;
        }
        if (k === 'arrEstimated' || k === 'arrPinned') {
          var b = fields[k] === true || fields[k] === 'true' ? true : fields[k] === false || fields[k] === 'false' ? false : null;
          if (b === null) { summary.ignored.push(label + ' ' + k + ': use true or false'); return; }
          if (setField(deal, 'lead', deal.id, k, b, wantsOverwrite(ow, k, label), fieldSources[k], label)) leadChanged = true;
          return;
        }
        if (k === 'sophisticationScore') {
          var sc = Math.round(Number(fields[k]));
          if (!(sc >= 1 && sc <= 5)) { summary.ignored.push(label + ' sophisticationScore: use 1 to 5'); return; }
          if (setField(deal, 'lead', deal.id, k, sc, wantsOverwrite(ow, k, label), fieldSources[k], label)) leadChanged = true;
          return;
        }
        if (setField(deal, 'lead', deal.id, k, fields[k], wantsOverwrite(ow, k, label), fieldSources[k], label)) leadChanged = true;
      });

      // Customer fields.
      var cust = deal.customerId ? state.customers.find(function (c) { return c.id === deal.customerId; }) : null;
      var custFields = (patch.customer && typeof patch.customer === 'object') ? patch.customer : {};
      if (Object.keys(custFields).length) {
        if (!cust) summary.ignored.push(label + ': no customer linked, customer fields skipped');
        else if (!canWriteCustomers) summary.ignored.push(label + ': no write access to Customers, customer fields skipped');
        else {
          var custChanged = false;
          Object.keys(custFields).forEach(function (k) {
            if (ENRICH_CUSTOMER_LOCKED.indexOf(k) !== -1) { summary.ignored.push(label + ' customer.' + k + ': not editable by import'); return; }
            var cDef = recordSection(k);
            if (cDef && cDef.type === 'object') {
              if (fillSection(cust, 'customer', deal.id, k, custFields[k], ow, fieldSources['customer.' + k], label + ' customer')) custChanged = true;
              return;
            }
            if (cDef) { summary.ignored.push(label + ' customer.' + k + ': lists go on the lead (samplesAdd, docLinksAdd)'); return; }
            if (k === 'driveFolderUrl' && !isHttpUrl(custFields[k])) { summary.ignored.push(label + ' customer.driveFolderUrl: needs an http(s) link'); return; }
            if (setField(cust, 'customer', deal.id, k, custFields[k], wantsOverwrite(ow, 'customer.' + k, label), fieldSources['customer.' + k], label + ' customer')) custChanged = true;
          });
          if (custChanged) {
            cust.normalizedName = normalizeCompanyName(cust.name) || cust.normalizedName;
            cust.updatedAt = at;
            touched = true;
          }
        }
      }

      // Contacts: add (dedupe by email, then name) and update (by id or email).
      var adds = Array.isArray(patch.contactsAdd) ? patch.contactsAdd.slice() : [];
      if (Object.keys(legacyContact).length) adds.push(legacyContact);
      var ups = Array.isArray(patch.contactsUpdate) ? patch.contactsUpdate : [];
      if ((adds.length || ups.length) && !cust) summary.ignored.push(label + ': no customer linked, contacts skipped');
      else if ((adds.length || ups.length) && !canWriteCustomers) summary.ignored.push(label + ': no write access to Customers, contacts skipped');
      else if (cust) {
        if (!Array.isArray(deal.contactIds)) deal.contactIds = [];
        adds.forEach(function (raw) {
          var c = contactPatch(raw);
          if (!c.email && !c.name) { summary.ignored.push(label + ': contact without name or email ignored'); return; }
          var existing = findContact(state, cust.id, c.email, c.name);
          if (existing && c.email && existing.email && existing.email.toLowerCase() !== c.email.toLowerCase()) existing = null; // same name, different person
          if (existing) {
            summary.duplicates += 1;
            var changed = false;
            Object.keys(c).forEach(function (k) {
              if (setField(existing, 'contact', deal.id, k, c[k], false, null, label + ' contact ' + existing.name)) changed = true;
            });
            if (changed) { existing.updatedAt = at; summary.contactsUpdated += 1; touched = true; }
            if (deal.contactIds.indexOf(existing.id) === -1) { deal.contactIds.push(existing.id); leadChanged = true; }
            return;
          }
          var created = createContact(state, cust.id, c, at);
          deal.contactIds.push(created.id);
          if (!deal.primaryContactId) deal.primaryContactId = created.id;
          summary.contactsAdded += 1;
          log('contact', created.id, 'enrich-add', 'contact', null, created.name + (created.email ? ' <' + created.email + '>' : ''), 'Added contact ' + created.name + ' on ' + cust.name);
          leadChanged = true;
        });
        ups.forEach(function (raw) {
          if (!raw || typeof raw !== 'object') return;
          var email = String(raw.email || raw.matchEmail || '').trim().toLowerCase();
          var target = raw.id ? state.contacts.find(function (c) { return c.id === raw.id && c.customerId === cust.id; })
            : (email ? findContact(state, cust.id, email, '') : null);
          if (!target) { summary.ignored.push(label + ': contact to update not found (' + (raw.id || email || '?') + ')'); return; }
          var src = raw.fields && typeof raw.fields === 'object' ? raw.fields : raw;
          var c = contactPatch(src);
          var changed = false;
          Object.keys(c).forEach(function (k) {
            if (setField(target, 'contact', deal.id, k, c[k], wantsOverwrite(ow, 'contact.' + k, label), null, label + ' contact ' + target.name)) changed = true;
          });
          if (changed) { target.updatedAt = at; summary.contactsUpdated += 1; touched = true; }
        });
      }

      // Notes: dedupe by text + date.
      (Array.isArray(patch.notesAdd) ? patch.notesAdd : []).forEach(function (raw) {
        var text = String(typeof raw === 'string' ? raw : (raw && raw.text) || '').trim();
        if (!text) return;
        var when = (raw && raw.createdAt) || at;
        if (!Array.isArray(deal.notes)) deal.notes = [];
        if (deal.notes.some(function (n) { return n && String(n.text || '').trim() === text && dayOf(n.createdAt) === dayOf(when); })) { summary.duplicates += 1; return; }
        var noteEntry = { id: makeId('n'), text: text, createdAt: when, source: by };
        var noteTldr = clampSummary(raw && raw.summary);
        if (noteTldr) noteEntry.summary = noteTldr;
        deal.notes.push(noteEntry);
        summary.notesAdded += 1;
        log('lead', deal.id, 'enrich-add', 'notes', null, text, 'Added note: "' + clip(text) + '"');
        leadChanged = true;
      });

      // Timeline: dedupe by text + date.
      (Array.isArray(patch.timelineAdd) ? patch.timelineAdd : []).forEach(function (raw) {
        var text = String(typeof raw === 'string' ? raw : (raw && raw.text) || '').trim();
        if (!text) return;
        var when = (raw && raw.at) || at;
        if (!Array.isArray(deal.timeline)) deal.timeline = [];
        if (deal.timeline.some(function (t) { return t && String(t.text || '').trim() === text && dayOf(t.at) === dayOf(when); })) { summary.duplicates += 1; return; }
        var tlEntry = { id: makeId('tl'), type: (raw && raw.type) || ENRICH_SOURCE, text: text, at: when, source: (raw && raw.source) || by };
        var tlTldr = clampSummary(raw && raw.summary);
        if (tlTldr) tlEntry.summary = tlTldr;
        if (raw && raw.awaitingReply === true) tlEntry.awaitingReply = true;
        deal.timeline.push(tlEntry);
        summary.timelineAdded += 1;
        log('lead', deal.id, 'enrich-add', 'timeline', null, text, 'Added timeline entry: "' + clip(text) + '"');
        leadChanged = true;
      });

      // Files: links only (Drive or web), dedupe by url across the card.
      (Array.isArray(patch.filesAdd) ? patch.filesAdd : []).forEach(function (raw) {
        if (!raw || typeof raw !== 'object') return;
        var url = String(raw.url || '').trim();
        var slot = String(raw.slot || '').trim();
        if (!isHttpUrl(url)) { summary.ignored.push(label + ': file without an http(s) url ignored'); return; }
        if (SLOT_KEYS.indexOf(slot) === -1) { summary.ignored.push(label + ': unknown file slot "' + slot + '" (use ' + SLOT_KEYS.join(', ') + ')'); return; }
        if (!deal.files || typeof deal.files !== 'object') deal.files = emptySlots();
        var exists = SLOT_KEYS.some(function (s) { return (deal.files[s] || []).some(function (f) { return f && (f.url === url || f.driveUrl === url); }); }) ||
          state.files.some(function (f) { return f && f.ownerId === deal.id && (f.url === url || f.driveUrl === url); });
        if (exists) { summary.duplicates += 1; return; }
        var name = String(raw.name || '').trim() || url.split('/').pop() || 'link';
        var id = makeId('fil');
        if (!Array.isArray(deal.files[slot])) deal.files[slot] = [];
        deal.files[slot].push({ id: id, name: name, url: url, source: raw.source || '', mime: '', size: 0, addedAt: at, uploadedBy: by });
        state.files.push({
          id: id, ownerType: 'lead', ownerId: deal.id, slot: slot, name: name, mime: '', size: 0, blobKey: null,
          inlineDataURL: false, uploadedAt: at, uploadedBy: by, url: url, driveFileId: null, driveUrl: null, driveFolderId: null
        });
        summary.filesAdded += 1;
        log('lead', deal.id, 'enrich-add', 'files.' + slot, null, url, 'Linked ' + slot + ' file ' + name);
        leadChanged = true;
      });

      // Section lists (#8): samples and document links. Add-only with dedupe.
      if (Array.isArray(patch.invoicesAdd) && patch.invoicesAdd.length) summary.ignored.push(label + ' invoicesAdd: invoices live in Billing, not imported');
      Object.keys(SECTION_ADD_KEYS).forEach(function (addKey) {
        (Array.isArray(patch[addKey]) ? patch[addKey] : []).forEach(function (raw) {
          if (!raw || typeof raw !== 'object') return;
          var r = addRecordSectionRow(state, deal, 'lead', SECTION_ADD_KEYS[addKey], raw, { by: by, actedFor: actedFor, at: at, source: ENRICH_SOURCE });
          r.bad.forEach(function (b) { summary.ignored.push(label + ' ' + addKey + ' ' + b + ': invalid value ignored'); });
          if (r.duplicate) { summary.duplicates += 1; return; }
          if (r.row) { summary.sectionRowsAdded += 1; leadChanged = true; }
        });
      });

      // Customer quotes: held on the lead until the customerQuotes model (#3) exists and picks them up.
      (Array.isArray(patch.quotesAdd) ? patch.quotesAdd : []).forEach(function (raw) {
        if (!raw || typeof raw !== 'object') return;
        if (!Array.isArray(deal.pendingCustomerQuotes)) deal.pendingCustomerQuotes = [];
        var key = raw.id || raw.number || raw.quoteNumber || null;
        // url (issue #97): the as-emailed PDF, kept on the quote as fileUrl. Only http(s).
        var urlIn = quoteFileUrl(raw.url != null ? raw.url : raw.fileUrl);
        if (!urlIn && (raw.url || raw.fileUrl)) summary.ignored.push(label + ' quotesAdd ' + (key || '') + ': url must start with http:// or https://');
        if (raw.url != null || raw.fileUrl != null) {
          raw = Object.assign({}, raw);
          delete raw.url; delete raw.fileUrl;
          if (urlIn) raw.fileUrl = urlIn;
        }
        var body = JSON.stringify(raw);
        var dupOf = deal.pendingCustomerQuotes.filter(function (q) {
          var qk = q.quote && (q.quote.id || q.quote.number || q.quote.quoteNumber);
          return key ? qk === key : JSON.stringify(q.quote) === body;
        })[0];
        if (!dupOf && key) {
          // A formal quote with the same number on this lead also counts as the same quote.
          var formal = (state.customerQuotes || []).filter(function (q) { return q && q.dealId === deal.id && q.number === key; })[0];
          if (formal) dupOf = { formal: formal };
        }
        // Another quote on this lead that is already accepted (formal or held), other than the one named here.
        function otherAccepted(selfFormal, selfHolder) {
          var f = (state.customerQuotes || []).filter(function (q) {
            return q && q.dealId === deal.id && q.status === 'accepted' && q !== selfFormal && !(selfHolder && selfHolder.customerQuoteId === q.id);
          })[0];
          if (f) return f.number || f.id;
          var h = (deal.pendingCustomerQuotes || []).filter(function (x) {
            return x && x !== selfHolder && !x.customerQuoteId && (x.acceptedAt || (x.quote && x.quote.status === 'accepted'));
          })[0];
          return h ? ((h.quote && (h.quote.number || h.quote.quoteNumber)) || 'another quote') : null;
        }
        // A second accepted quote is never applied over the first: it goes to proposals as a note for Owner.
        function proposeAccepted(num, other, acceptedAt) {
          var text = 'Quote ' + (num || '(no number)') + ' was reported accepted' + (acceptedAt ? ' on ' + String(acceptedAt).slice(0, 10) : '') +
            ', but quote ' + other + ' is already accepted on this lead. Check which one the customer accepted.';
          var dupProp = state.proposals.some(function (p) { return p.status === 'pending' && p.action === 'add-note' && p.entityId === deal.id && p.payload && p.payload.text === text; });
          if (dupProp) { summary.duplicates += 1; return; }
          state.proposals.push({
            id: makeId('prp'), at: at, bot: by, actedFor: actedFor, source: ENRICH_SOURCE, action: 'add-note',
            entityType: 'lead', entityId: deal.id, payload: { text: text, quoteNumber: num || null, acceptedAt: acceptedAt || null },
            summary: text, status: 'pending', resolvedAt: null, resolvedBy: null
          });
          summary.conflicts += 1;
          log('lead', deal.id, 'proposal', 'customerQuotes.status', other, num, 'Second accepted quote sent to proposals: ' + (num || ''));
        }
        if (dupOf) {
          var holderObj = dupOf.formal ? null : dupOf;
          var formalObj = dupOf.formal || (holderObj.customerQuoteId ? (state.customerQuotes || []).filter(function (q) { return q.id === holderObj.customerQuoteId; })[0] : null) || null;
          // The PDF link is add-only: it fills an empty fileUrl and never replaces one.
          if (urlIn) {
            var urlSet = false;
            if (formalObj && !formalObj.fileUrl) { formalObj.fileUrl = urlIn; formalObj.updatedAt = at; urlSet = true; }
            if (holderObj && holderObj.quote && !holderObj.quote.fileUrl) { holderObj.quote.fileUrl = urlIn; urlSet = true; }
            if (urlSet) {
              summary.quotesUpdated += 1; leadChanged = true;
              log('lead', deal.id, 'enrich-update', 'customerQuotes.fileUrl', null, urlIn, 'Linked the PDF on quote ' + key);
            }
          }
          // Accepted: only for a quote already marked sent. A second accepted quote goes to proposals.
          if (raw.status === 'accepted') {
            var hq = (holderObj && holderObj.quote) || {};
            var wasSent = !!(holderObj && (holderObj.sentAt || hq.sentAt || hq.status === 'sent' || hq.status === 'accepted')) ||
              !!(formalObj && (formalObj.sentAt || formalObj.status === 'sent' || formalObj.status === 'accepted'));
            var wasAccepted = (formalObj && formalObj.status === 'accepted') || hq.status === 'accepted';
            var acceptedAtIn = raw.acceptedAt || at;
            if (wasAccepted) { summary.duplicates += 1; return; }
            // Not sent yet: it is only marked sent (as before); send accepted again once it is.
            if (!wasSent) summary.ignored.push(label + ' quotesAdd ' + (key || '') + ': accepted needs a quote already marked sent, marked sent only');
            var other = wasSent ? otherAccepted(formalObj, holderObj) : null;
            if (other) { proposeAccepted(key, other, acceptedAtIn); return; }
            if (wasSent) {
              if (formalObj) { formalObj.status = 'accepted'; formalObj.acceptedAt = acceptedAtIn; formalObj.updatedAt = at; }
              if (holderObj) {
                if (!holderObj.quote) holderObj.quote = {};
                holderObj.quote.status = 'accepted'; holderObj.quote.acceptedAt = acceptedAtIn;
              }
              summary.quotesMarkedAccepted += 1; leadChanged = true;
              log('lead', deal.id, 'enrich-update', 'customerQuotes.status', 'sent', 'accepted', 'Marked quote ' + (key || '') + ' accepted');
              return;
            }
          }
          // Re-sending a quote already on the lead with status sent (or a sentAt) marks it sent.
          var sentAtIn = raw.sentAt || ((raw.status === 'sent' || raw.status === 'accepted') ? at : null);
          if (sentAtIn) {
            if (dupOf.formal) {
              if (dupOf.formal.status === 'draft' && !dupOf.formal.sentAt) {
                dupOf.formal.status = 'sent'; dupOf.formal.sentAt = sentAtIn; dupOf.formal.updatedAt = at;
                summary.quotesMarkedSent += 1; leadChanged = true;
                log('lead', deal.id, 'enrich-update', 'customerQuotes.sentAt', null, sentAtIn, 'Marked quote ' + key + ' sent');
                return;
              }
            } else {
              var qq = dupOf.quote || {};
              if (!dupOf.sentAt && !qq.sentAt && qq.status !== 'sent' && qq.status !== 'accepted') {
                dupOf.sentAt = sentAtIn; dupOf.sentBy = by;
                summary.quotesMarkedSent += 1; leadChanged = true;
                log('lead', deal.id, 'enrich-update', 'pendingCustomerQuotes.sentAt', null, sentAtIn, 'Marked quote ' + (key || '') + ' sent');
                return;
              }
            }
          }
          summary.duplicates += 1; return;
        }
        var heldQuote = JSON.parse(body);
        if (heldQuote.status === 'accepted') {
          // A new quote cannot take the accepted place from one already accepted: hold it as sent and propose.
          var otherNew = otherAccepted(null, null);
          if (otherNew) {
            proposeAccepted(key, otherNew, heldQuote.acceptedAt || at);
            heldQuote.status = 'sent'; delete heldQuote.acceptedAt;
          }
        }
        deal.pendingCustomerQuotes.push({ quote: heldQuote, addedAt: at, addedBy: by, source: ENRICH_SOURCE });
        summary.quotesHeld += 1;
        log('lead', deal.id, 'enrich-add', 'pendingCustomerQuotes', null, key || clip(body), 'Held a customer quote for the quotes model (#3)');
        leadChanged = true;
      });

      // Sources per field: add-only union on the lead's enrichment block.
      Object.keys(fieldSources).forEach(function (f) {
        var refs = Array.isArray(fieldSources[f]) ? fieldSources[f] : [fieldSources[f]];
        refs = refs.filter(function (r) { return !isBlank(r); });
        if (!refs.length) return;
        if (!deal.enrichment || typeof deal.enrichment !== 'object') deal.enrichment = {};
        if (!deal.enrichment.fieldSources || typeof deal.enrichment.fieldSources !== 'object') deal.enrichment.fieldSources = {};
        var have = deal.enrichment.fieldSources[f] || [];
        refs.forEach(function (r) {
          if (have.some(function (h) { return sameValue(h, r); })) return;
          have.push(r);
          summary.sourcesAdded += 1;
          leadChanged = true;
        });
        deal.enrichment.fieldSources[f] = have;
      });

      if (leadChanged) {
        deal.updatedAt = at;
        deal.lastActivityAt = at;
        if (!deal.enrichment || typeof deal.enrichment !== 'object') deal.enrichment = {};
        deal.enrichment.enrichedAt = at;
        deal.enrichment.enrichedBy = by;
      }
      if (leadChanged || touched) summary.leadsTouched += 1;
    });

    if (summary.patches) {
      state.changeLog.push({
        id: makeId('chg'), at: at, who: by, by: by, actedFor: actedFor, source: ENRICH_SOURCE, action: 'import',
        entityType: 'state', entityId: null, field: null, oldValue: null, newValue: null,
        detail: enrichSummaryLines(summary).join('; ')
      });
    }
    var cap = opts.logCap || ENRICH_LOG_CAP;
    if (state.changeLog.length > cap) state.changeLog = state.changeLog.slice(state.changeLog.length - cap);
    return { summary: summary };
  }

  function enrichSummaryLines(s) {
    if (s.frozen) return ['Bot writes are frozen (kill switch). Nothing imported.'];
    var lines = [
      s.patches + ' patches, ' + s.leadsTouched + ' leads touched',
      s.fieldsFilled + ' fields filled' + (s.fieldsOverwritten ? ', ' + s.fieldsOverwritten + ' overwritten (admin)' : ''),
      s.conflicts + ' conflicts sent to proposals',
      s.contactsAdded + ' contacts added, ' + s.contactsUpdated + ' updated',
      s.notesAdded + ' notes, ' + s.timelineAdded + ' timeline entries, ' + s.filesAdded + ' files added'
    ];
    if (s.quotesHeld) lines.push(s.quotesHeld + ' customer quotes held for the quotes model (#3)');
    if (s.quotesMarkedSent) lines.push(s.quotesMarkedSent + ' quotes marked sent');
    if (s.quotesMarkedAccepted) lines.push(s.quotesMarkedAccepted + ' quotes marked accepted');
    if (s.quotesUpdated) lines.push(s.quotesUpdated + ' quotes got a PDF link');
    if (s.sectionRowsAdded) lines.push(s.sectionRowsAdded + ' samples or document links added');
    if (s.sourcesAdded) lines.push(s.sourcesAdded + ' source refs added');
    if (s.unchanged || s.duplicates) lines.push(s.unchanged + ' unchanged fields, ' + s.duplicates + ' duplicates skipped');
    if (s.skippedUnknown.length) lines.push('Skipped, unknown leadId: ' + s.skippedUnknown.join(', '));
    if (s.skippedStale.length) lines.push('Skipped, changed since ifUpdatedAt: ' + s.skippedStale.join(', '));
    if (s.skippedNoAccess.length) lines.push('Skipped, no write access: ' + s.skippedNoAccess.join(', '));
    return lines;
  }

  // Bot grant section keys (quotes, cold-leads, inbound, customers, tasks) against lead boards.
  // Boards are matched by id, so boards Owner renames keep their access. A lead on a board with no
  // key of its own (Partner, a duplicated board) needs write on all three lead sections.
  var LEAD_GRANT_KEYS = ['quotes', 'cold-leads', 'inbound'];

  function grantKeyForStage(state, stage) {
    var info = sectionAreaForStage(state, stage);
    var id = String((info.section && info.section.id) || '').toLowerCase();
    if (!id) return null;
    if (LEAD_GRANT_KEYS.indexOf(id) !== -1) return id;
    if (id.indexOf('inbound') !== -1) return 'inbound';
    if (id.indexOf('cold') !== -1) return 'cold-leads';
    if (id.indexOf('quote') !== -1) return 'quotes';
    return null;
  }

  // sections: the grant's { key: 'read'|'write' } map, or null for an admin (all access).
  function grantCanWriteLead(state, deal, sections) {
    if (!sections) return true;
    var key = grantKeyForStage(state, deal && deal.stage);
    if (key) return sections[key] === 'write';
    return LEAD_GRANT_KEYS.every(function (k) { return sections[k] === 'write'; });
  }

  // Accept one set-field proposal from an enrichment import. Returns the change or null.
  function applyFieldProposal(state, prop, by, at) {
    if (!prop || prop.action !== 'set-field' || !prop.payload || !prop.payload.field) return null;
    at = at || nowIso();
    var coll = prop.entityType === 'lead' ? state.deals : prop.entityType === 'customer' ? state.customers : prop.entityType === 'contact' ? state.contacts : null;
    var rec = (coll || []).find(function (r) { return r && r.id === prop.entityId; });
    var field = prop.payload.field;
    var locked = prop.entityType === 'lead' ? ENRICH_LEAD_LOCKED : prop.entityType === 'customer' ? ENRICH_CUSTOMER_LOCKED : ['id', 'customerId', 'createdAt', 'updatedAt', 'isPrimary'];
    if (!rec || locked.indexOf(field.split('.')[0]) !== -1 || isBlank(prop.payload.value)) return null;
    // Section subfields (#8): "profile.legalName".
    var parts = field.split('.');
    var holder = rec;
    if (parts.length === 2 && recordSection(parts[0])) {
      if (!rec[parts[0]] || typeof rec[parts[0]] !== 'object') rec[parts[0]] = {};
      holder = rec[parts[0]];
    } else if (parts.length > 1) return null;
    var leaf = parts[parts.length - 1];
    var old = holder[leaf] === undefined ? null : holder[leaf];
    holder[leaf] = JSON.parse(JSON.stringify(prop.payload.value));
    if (prop.entityType === 'customer' && field === 'name') rec.normalizedName = normalizeCompanyName(rec.name) || rec.normalizedName;
    rec.updatedAt = at;
    if (prop.entityType === 'lead') rec.lastActivityAt = at;
    ensureArrays(state);
    state.changeLog.push({
      id: makeId('chg'), at: at, who: by || 'user', by: by || 'user', actedFor: null, source: 'human', action: 'proposal-applied',
      entityType: prop.entityType, entityId: prop.entityId, field: field, oldValue: old, newValue: holder[leaf],
      detail: 'Accepted ' + (prop.bot || 'bot') + ': ' + field + ' "' + clip(old) + '" to "' + clip(holder[leaf]) + '"'
    });
    return { field: field, oldValue: old, newValue: holder[leaf] };
  }

  // ---------------------------------------------------------------------
  // SKU jobs (issue #3, Owner 2026-09-23). The CRM ends at Won. Operations runs by
  // Customer, then SKU, then customer PO. Projects are folded into SKU jobs and archived
  // (never deleted). Customer quotes are structured so a won deal can prefill its SKU jobs.
  // Everything lives in workspace/main state: no new collections, no rules change.
  // ---------------------------------------------------------------------
  var SKU_BOARD_ID = 'pp-sku-jobs';
  var PRODUCTION_BOARD_ID = 'fo-production';
  var SKU_STAGES = [['sku-design-dfm', 'Design/DFM'], ['sku-prototyping', 'Prototyping'], ['sku-tooling-molds', 'Tooling/Molds'], ['sku-first-article', 'First article']];
  var PO_STAGES = [['po-open', 'Open PO'], ['po-in-production', 'In production'], ['po-shipped', 'Shipped'], ['po-closed', 'Closed']];
  var SKU_VALUE_KEYS = ['designDfm', 'prototyping', 'tooling', 'partnerServices', 'productionArr'];
  // Pre-production is everything before molds and production: design, DFM, prototypes (Owner 9/30).
  // Mold tooling is its own line so cash timing reads near, medium and long term.
  var PREPRO_VALUE_KEYS = ['designDfm', 'prototyping', 'partnerServices'];
  var QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'superseded'];
  // Fields a quote line fills on a SKU. Order is the order shown in the re-apply diff.
  var QUOTE_PREFILL_FIELDS = ['name', 'moldsRequired', 'values.designDfm', 'values.prototyping', 'values.tooling',
    'values.partnerServices', 'values.productionArr', 'sellPrice', 'tiers', 'annualQty'];
  var QUOTE_FIELD_LABELS = {
    name: 'Name', moldsRequired: 'Molds required', 'values.designDfm': 'Design/DFM', 'values.prototyping': 'Prototyping',
    'values.tooling': 'Tooling/Molds', 'values.partnerServices': 'Partner services', 'values.productionArr': 'ARR',
    sellPrice: 'Unit price', tiers: 'Qty ladder', annualQty: 'Annual qty'
  };

  function num(v) {
    if (v === null || v === undefined || v === '') return null;
    var n = Number(String(v).replace(/[$,\s]/g, ''));
    return isFinite(n) ? n : null;
  }

  function roleOfArea(state, areaId) {
    var a = (state.areas || []).find(function (x) { return x && x.kind !== 'separator' && x.kind !== 'fixed' && x.id === areaId; });
    if (a && a.role) return a.role;
    if (areaId === 'crm') return 'crm';
    if (areaId === 'pre-production') return 'pre-production';
    if (areaId === 'floor-operations' || areaId === 'operations') return 'operations';
    return '';
  }

  function firstAreaWithRole(state, role) {
    var a = (state.areas || []).find(function (x) { return x && x.kind !== 'separator' && x.kind !== 'fixed' && roleOfArea(state, x.id) === role; });
    return a ? a.id : null;
  }

  // The board that holds a card kind: 'sku' (Pre-production) or 'po-line' (Production).
  // Found by its cardKind flag, so Owner can rename or move it in Edit menu.
  function boardForKind(state, kind) {
    return (state.sections || []).find(function (s) { return s && s.kind !== 'separator' && s.cardKind === kind; }) || null;
  }

  function stageKindOf(state, stage) {
    if (!stage) return null;
    if (isShopNeedsStage(stage)) return 'internal';
    var info = sectionAreaForStage(state, stage);
    if (!info.section) return null;
    if (info.section.cardKind === 'po-line') return 'po-line';
    if (isProjectAreaId(state, info.area)) return 'sku';
    return 'lead';
  }

  function addBoard(state, def, areaId, stages) {
    var at = -1;
    (state.sections || []).forEach(function (s, i) { if (at === -1 && s && s.kind !== 'separator' && s.area === areaId) at = i; });
    var sec = { id: def.id, label: def.label, area: areaId, stages: stages.map(function (s) { return s[0]; }), cardKind: def.cardKind };
    if (at === -1) state.sections.push(sec); else state.sections.splice(at, 0, sec);
    if (!state.stageLabels || typeof state.stageLabels !== 'object') state.stageLabels = {};
    stages.forEach(function (s) { if (!state.stageLabels[s[0]]) state.stageLabels[s[0]] = s[1]; });
    if (Array.isArray(state.stages)) stages.forEach(function (s) { if (state.stages.indexOf(s[0]) === -1) state.stages.push(s[0]); });
    return sec;
  }

  // Adds the Pre-production and Production boards once (settings.skuJobs1). New boards go
  // first in their area; existing boards keep their names and order. If Owner removes them
  // later they are not added back.
  function ensureSkuJobBoards(state, report) {
    if (state.settings.skuJobs1) return;
    if (!Array.isArray(state.sections)) state.sections = [];
    if (!boardForKind(state, 'sku') && !state.sections.some(function (s) { return s.id === SKU_BOARD_ID; })) {
      var pre = firstAreaWithRole(state, 'pre-production');
      if (pre) { addBoard(state, { id: SKU_BOARD_ID, label: 'Pre-production', cardKind: 'sku' }, pre, SKU_STAGES); report.boardsAdded += 1; }
    }
    if (!boardForKind(state, 'po-line') && !state.sections.some(function (s) { return s.id === PRODUCTION_BOARD_ID; })) {
      var ops = firstAreaWithRole(state, 'operations');
      if (ops) { addBoard(state, { id: PRODUCTION_BOARD_ID, label: 'Production', cardKind: 'po-line' }, ops, PO_STAGES); report.boardsAdded += 1; }
    }
    // The Hot pipeline KPI view lists its boards; add the new ones where it already covers
    // Pre-Production, so KPI totals keep counting that work. Views Owner made are left alone.
    (state.pipelineViews || []).forEach(function (v) {
      if (v.id !== 'pv_hot' || !Array.isArray(v.boards) || v.boards.indexOf('pp-design') === -1) return;
      [SKU_BOARD_ID, PRODUCTION_BOARD_ID].forEach(function (id) {
        if (state.sections.some(function (s) { return s.id === id; }) && v.boards.indexOf(id) === -1) v.boards.push(id);
      });
    });
  }

  function skuBoardStages(state) {
    var b = boardForKind(state, 'sku');
    return b ? (b.stages || []) : [];
  }
  function poBoardStages(state) {
    var b = boardForKind(state, 'po-line');
    return b ? (b.stages || []) : [];
  }

  // Stage on the Pre-production board by position (Design/DFM, Prototyping, Tooling/Molds, First article).
  // Position, not id, so renamed stages still line up. Falls back to the first stage.
  function skuStageAt(state, idx) {
    var st = skuBoardStages(state).filter(function (x) { return x !== AWAITING_STAGE; });
    return st[Math.min(idx, st.length - 1)] || st[0] || '';
  }
  function poStageAt(state, idx) {
    var st = poBoardStages(state);
    return st[Math.min(idx, st.length - 1)] || st[0] || '';
  }

  var OLD_BOARD_TO_SKU_STAGE = { 'pp-design': 0, 'pp-prototyping': 1, 'pp-tooling': 2, 'pp-raw-material-sampling': 2, 'pp-freight': 2 };

  // Where a project lands. Returns { skuStage, production } where production means the
  // project had a PO, so its card becomes a Production PO line instead of a SKU card.
  function projectTarget(state, p) {
    var hasPo = !!(String(p.poNumber || '').trim() || Number((p.values || {}).currentPo) > 0);
    var info = sectionAreaForStage(state, p.stage);
    var sec = info.section;
    var role = sec ? roleOfArea(state, info.area) : '';
    var opsLike = role === 'operations' || p.stage === 'production-po-received';
    if (sec && sec.cardKind === 'sku') return { skuStage: p.stage, production: false };
    if (sec && sec.cardKind === 'po-line') return { skuStage: skuStageAt(state, 3), production: true };
    if (opsLike) return { skuStage: skuStageAt(state, 3), production: hasPo };
    var idx = sec && OLD_BOARD_TO_SKU_STAGE[sec.id] != null ? OLD_BOARD_TO_SKU_STAGE[sec.id] : 0;
    return { skuStage: skuStageAt(state, idx), production: false };
  }

  function emptySkuValues() {
    var o = {};
    SKU_VALUE_KEYS.forEach(function (k) { o[k] = 0; });
    return o;
  }

  // One shape for every SKU, used by the app (Add SKU) and by the migration.
  function blankSku(fields) {
    var t = (fields && fields.createdAt) || nowIso();
    var sku = {
      id: makeId('sku'), projectId: null, customerId: null,
      code: '', name: '', description: '', size: '', style: '', color: '', colorSpec: '', durometer: '', material: '',
      status: 'concept', revision: 'A', drawingRev: '', moldId: '', cavityCount: '', cycleTimeSec: '',
      dimensions: { l: '', w: '', h: '', unit: 'mm' }, weightGrams: '', tolerances: '',
      unitCostTarget: '', sellPrice: '', currency: 'USD', moq: '', leadTimeDays: '', overrunPct: 5,
      packaging: { type: '', casePack: '', masterCartonQty: '', cartonDims: '', labelSpec: '' },
      ids: { upc: '', ean: '', gtin: '', fnsku: '', asin: '', sellerSku: '', other: [] },
      firstArticle: { status: 'pending', date: '', approvedBy: '', notes: '' },
      bom: [], notes: '',
      board: null, stage: '', stageEnteredAt: null, values: emptySkuValues(), moldsRequired: '',
      tiers: [], annualQty: '', source: null, prefilled: {}, dealId: null, legacyProjectId: null,
      targetShipDate: null, archived: false, archivedAt: null,
      createdAt: t, updatedAt: t
    };
    return Object.assign(sku, fields || {});
  }

  // Fill fields added by #3 on SKUs made before it. Never overwrites a value.
  function ensureSkuJobFields(sku) {
    if (!sku.values || typeof sku.values !== 'object') sku.values = emptySkuValues();
    SKU_VALUE_KEYS.forEach(function (k) { if (sku.values[k] === undefined) sku.values[k] = 0; });
    if (sku.moldsRequired === undefined) sku.moldsRequired = '';
    if (!Array.isArray(sku.tiers)) sku.tiers = [];
    if (sku.annualQty === undefined) sku.annualQty = '';
    if (sku.source === undefined) sku.source = null;
    if (!sku.prefilled || typeof sku.prefilled !== 'object') sku.prefilled = {};
    if (sku.stage === undefined) sku.stage = '';
    if (sku.board === undefined) sku.board = null;
    if (sku.archived === undefined) sku.archived = false;
    if (sku.material === undefined) sku.material = '';
    if (sku.dealId === undefined) sku.dealId = null;
    if (sku.legacyProjectId === undefined) sku.legacyProjectId = null;
    return sku;
  }

  function projectSkuCode(p) {
    return 'JOB-' + String(p.id || '').replace(/^prj_/, '').toUpperCase();
  }

  function setSkuStage(state, sku, stage, at) {
    var info = sectionAreaForStage(state, stage);
    sku.stage = stage || '';
    sku.board = info.section ? info.section.id : null;
    sku.stageEnteredAt = at;
  }

  // Remove from board (Owner 2026-10-12): takes one SKU card off its board. The SKU, its
  // deal and every other card stay; it is not archived and shows as "Not on a board".
  function removeSkuFromBoard(state, sku, at) {
    if (!sku || !sku.stage) return { ok: false, reason: 'not on a board' };
    var from = sku.stage, fromBoard = sku.board || null;
    setSkuStage(state, sku, '', at);
    sku.updatedAt = at;
    return { ok: true, from: from, fromBoard: fromBoard };
  }

  // Send to Production (Owner 2026-10-12): first stage of the first Operations board that
  // holds SKU cards. Awaiting Payment cards wait for payment first.
  function productionTargetStage(state) {
    var secs = (state.sections || []).filter(function (s) {
      return s && s.kind !== 'separator' && (s.stages || []).length && s.cardKind !== 'po-line' && s.cardKind !== 'lead' &&
        areaRoleOf(state, s.area) === 'operations' && !isShopNeedsStage(s.stages[0]);
    });
    return secs.length ? secs[0].stages[0] : '';
  }

  function areaRoleOf(state, areaId) {
    var a = (state.areas || []).find(function (x) { return x && x.id === areaId; });
    if (a && a.role) return a.role;
    if (areaId === 'floor-operations' || areaId === 'operations') return 'operations';
    return areaId || '';
  }

  function sendSkuToProduction(state, sku, at) {
    if (!sku) return { ok: false, reason: 'missing' };
    if (sku.stage === 'awaiting-payment') return { ok: false, reason: 'awaiting-payment' };
    var info = sectionAreaForStage(state, sku.stage);
    if (sku.stage && info.section && areaRoleOf(state, info.area) === 'operations') return { ok: false, reason: 'already in production' };
    var from = sku.stage || '';
    var target = productionTargetStage(state);
    setSkuStage(state, sku, target, at);
    sku.jobPhase = 'production';
    sku.updatedAt = at;
    return { ok: true, from: from, to: target };
  }

  // Archived folder (Owner 2026-10-12): every archived record, nothing deleted.
  function archivedItems(state) {
    var out = [];
    (state.skus || []).forEach(function (s) {
      if (s && s.archived) out.push({ kind: 'sku', id: s.id, title: (s.code ? s.code + ' ' : '') + (s.name || ''), customerId: s.customerId || null, archivedAt: s.archivedAt || null, restorable: true });
    });
    (state.deals || []).forEach(function (d) {
      if (d && (d.status === 'archived' || d.archived === true)) out.push({ kind: 'lead', id: d.id, title: d.title || d.company || d.id, customerId: d.customerId || null, archivedAt: d.archivedAt || null, restorable: true });
    });
    (state.projects || []).forEach(function (p) {
      if (p && p.archived) out.push({ kind: 'project', id: p.id, title: p.title || p.name || p.id, customerId: p.customerId || null, archivedAt: p.archivedAt || null, restorable: false });
    });
    out.sort(function (a, b) { return String(b.archivedAt || '').localeCompare(String(a.archivedAt || '')); });
    return out;
  }

  function restoreArchived(state, kind, id, at) {
    if (kind === 'sku') {
      var s = (state.skus || []).find(function (x) { return x.id === id; });
      if (!s || !s.archived) return false;
      s.archived = false; s.archivedAt = null; s.updatedAt = at; return true;
    }
    if (kind === 'lead') {
      var d = (state.deals || []).find(function (x) { return x.id === id; });
      if (!d) return false;
      if (d.status === 'archived') d.status = 'open';
      d.archived = false; d.archivedAt = null; d.updatedAt = at; return true;
    }
    return false;
  }

  // Sourcing lives under Pre-Production in the menu (Owner 2026-10-12). Its deals and stages
  // stay a CRM board; only where it shows in the menu changes.
  function moveSourcingToPreprod(state) {
    var n = 0;
    (state.sections || []).forEach(function (s) {
      if (s && s.area === 'crm' && (s.id === 'board-sourcing' || /^sourcing$/i.test(String(s.label || '').trim())) && s.railArea !== 'pre-production') {
        s.railArea = 'pre-production'; n += 1;
      }
    });
    return n;
  }

  function pushSkuEvent(state, ev) {
    if (state.skuEvents.some(function (e) { return e.id === ev.id; })) return false;
    state.skuEvents.push(ev);
    return true;
  }

  // Lines of one customer PO for display and money. amount wins when set (migrated POs
  // carry only the old Current PO dollar value); otherwise qty x unit price.
  function poLineAmount(line) {
    if (!line) return 0;
    var a = num(line.amount);
    if (a != null && a > 0) return a;
    return (num(line.qty) || 0) * (num(line.unitPrice) || 0);
  }

  function isOpenPoLine(state, line) {
    var st = poBoardStages(state);
    if (line.status === 'closed' || line.status === 'shipped') return false;
    if (st.length && (line.stage === st[st.length - 1] || line.stage === st[st.length - 2])) return false;
    return true;
  }

  function poLinesForSku(state, skuId) {
    var out = [];
    (state.customerPos || []).forEach(function (po) {
      (po.lines || []).forEach(function (l) { if (l.skuId === skuId) out.push({ po: po, line: l }); });
    });
    return out;
  }

  function openPoAmountForSku(state, skuId) {
    return poLinesForSku(state, skuId).filter(function (x) { return isOpenPoLine(state, x.line); })
      .reduce(function (s, x) { return s + poLineAmount(x.line); }, 0);
  }

  function preproValue(values) {
    var v = values || {};
    return PREPRO_VALUE_KEYS.reduce(function (s, k) { return s + (Number(v[k]) || 0); }, 0);
  }
  function toolingValue(values) { return Number((values || {}).tooling) || 0; }

  // Card face numbers (the progress bar is gone). Leads and SKUs: ARR and Pre-production
  // value; SKUs add molds; Production PO lines show ARR and the open PO amount.
  // Newest quote on a lead, from held quotes (pendingCustomerQuotes, e.g. bot quotesAdd) or the
  // customerQuotes model. Newest by sent, created or added time. null when the lead has none.
  function latestQuote(state, deal) {
    if (!deal) return null;
    var best = null;
    function consider(total, number, at) {
      if (total == null || total <= 0) return;
      var t = Date.parse(at || '') || 0;
      if (!best || t >= best.t) best = { total: total, number: number || '', at: at || '', t: t };
    }
    (Array.isArray(deal.pendingCustomerQuotes) ? deal.pendingCustomerQuotes : []).forEach(function (h) {
      var q = (h && h.quote) || {};
      consider(num(q.total != null ? q.total : q.amount), q.number, h.addedAt || q.date);
    });
    ((state && state.customerQuotes) || []).forEach(function (q) {
      if (!q || q.dealId !== deal.id || q.status === 'rejected' || q.status === 'superseded') return;
      var x = q.extra || {};
      var total = num(q.total != null ? q.total : x.total);
      if (total == null && Array.isArray(q.lines) && q.lines.length) {
        total = q.lines.reduce(function (a, l) { return a + (num(l.amount) || (num(l.unitPrice) || 0) * (num(l.qty) || 0)); }, 0);
      }
      consider(total, q.number, q.sentAt || q.createdAt || x.date);
    });
    return best ? { total: best.total, number: best.number, at: best.at } : null;
  }

  // Quote color on a lead card: 'sent' when any quote on the lead is marked sent (status sent or
  // accepted, or a sentAt), 'unsent' when it has quotes but none sent yet, null when no quote.
  function quoteSentState(state, deal) {
    if (!deal) return null;
    var any = false, sent = false;
    (Array.isArray(deal.pendingCustomerQuotes) ? deal.pendingCustomerQuotes : []).forEach(function (h) {
      var q = (h && h.quote) || {};
      any = true;
      if (h.sentAt || q.sentAt || q.status === 'sent' || q.status === 'accepted') sent = true;
    });
    ((state && state.customerQuotes) || []).forEach(function (q) {
      if (!q || q.dealId !== deal.id || q.status === 'rejected' || q.status === 'superseded') return;
      any = true;
      if (q.sentAt || q.status === 'sent' || q.status === 'accepted') sent = true;
    });
    return sent ? 'sent' : (any ? 'unsent' : null);
  }

  // Mark every unsent quote on a lead as sent. Returns how many quotes changed.
  function markQuotesSent(state, deal, at, by) {
    if (!deal) return 0;
    at = at || nowIso();
    var n = 0;
    (Array.isArray(deal.pendingCustomerQuotes) ? deal.pendingCustomerQuotes : []).forEach(function (h) {
      if (!h) return;
      var q = h.quote || {};
      if (h.sentAt || q.sentAt || q.status === 'sent' || q.status === 'accepted') return;
      h.sentAt = at; h.sentBy = String(by || ''); n++;
    });
    ((state && state.customerQuotes) || []).forEach(function (q) {
      if (!q || q.dealId !== deal.id || q.status !== 'draft' || q.sentAt) return;
      q.status = 'sent'; q.sentAt = at; q.updatedAt = at; n++;
    });
    return n;
  }

  // Deal potential added over time, bucketed by when each lead came in (createdAt).
  // gran: 'day' | 'week' (Monday start) | 'month'. Returns [{ key, label, prepro, tooling, arr,
  // count, cumPrepro, cumTooling, cumArr }] covering the last `periods` buckets ending at `now`.
  function pipelineGrowth(deals, gran, periods, now) {
    var end = now ? new Date(now) : new Date();
    function startOf(d) {
      var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (gran === 'month') return new Date(x.getFullYear(), x.getMonth(), 1);
      if (gran === 'week') { var dow = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dow); }
      return x;
    }
    function step(d, k) {
      var x = new Date(d);
      if (gran === 'month') return new Date(x.getFullYear(), x.getMonth() + k, 1);
      x.setDate(x.getDate() + (gran === 'week' ? 7 : 1) * k);
      return x;
    }
    function keyOf(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var last = startOf(end);
    var first = step(last, -(periods - 1));
    var buckets = [], index = {};
    for (var i = 0; i < periods; i++) {
      var b0 = step(first, i);
      var label = gran === 'month' ? MONTHS[b0.getMonth()] + (b0.getMonth() === 0 || i === 0 ? ' ' + String(b0.getFullYear()).slice(-2) : '') : (b0.getMonth() + 1) + '/' + b0.getDate();
      var b = { key: keyOf(b0), label: label, prepro: 0, tooling: 0, arr: 0, count: 0 };
      index[b.key] = b; buckets.push(b);
    }
    var base = { prepro: 0, tooling: 0, arr: 0 };
    (deals || []).forEach(function (d) {
      var t = Date.parse((d && d.createdAt) || '');
      if (!t) return;
      var v = d.values || {};
      var add = { prepro: preproValue(v), tooling: toolingValue(v), arr: Number(v.productionArr) || 0 };
      var dt = new Date(t);
      if (dt < first) { base.prepro += add.prepro; base.tooling += add.tooling; base.arr += add.arr; return; }
      var b = index[keyOf(startOf(dt))];
      if (!b) return;
      b.prepro += add.prepro; b.tooling += add.tooling; b.arr += add.arr; b.count++;
    });
    var cp = base.prepro, ct = base.tooling, ca = base.arr;
    buckets.forEach(function (b) { cp += b.prepro; ct += b.tooling; ca += b.arr; b.cumPrepro = cp; b.cumTooling = ct; b.cumArr = ca; });
    return buckets;
  }

  function cardFace(state, card, kind) {
    if (kind === 'po-line') {
      var sku = (state.skus || []).find(function (s) { return s.id === card.skuId; });
      return { arr: sku ? Number((sku.values || {}).productionArr) || 0 : 0, prepro: null, tooling: null, molds: null, openPo: poLineAmount(card) };
    }
    var v = card.values || {};
    var face = { arr: Number(v.productionArr) || 0, prepro: preproValue(v), tooling: toolingValue(v), molds: null, openPo: null };
    if (card.arrIsEstimate === true || card.arrEstimated === true) face.arrEstimate = true; // our ARR estimate, shown with *
    if (kind === 'sku') {
      var m = num(card.moldsRequired);
      face.molds = m == null ? null : m;
    }
    return face;
  }

  // ---------------------------------------------------------------------
  // ARR counted vs potential (issue #102, Owner 2026-10-10). Three numbers:
  //   True ARR: sold jobs only (SKU jobs that are not archived). Real ARR is annual qty x sell price;
  //     a job with only an estimate counts too, marked as estimated.
  //   Pipeline ARR (counted): open leads, minus cold, lost and no activity for 45+ days (arrPinned
  //     keeps a stale lead in; it never brings back cold or lost).
  //   ARR potential: every open lead's ARR (arrPotential when set, else its ARR), cold, lost and stale included.
  // Won leads are not pipeline: their ARR is on their SKU jobs (True ARR).
  // ---------------------------------------------------------------------
  var ARR_STALE_DAYS = 45;

  // Owner (on #103): the 45-day rule counts only real customer activity (emails, calls, meetings, his own
  // edits), never bot touches or enrichment writes. So it does not use lastActivityAt (bots move it); it
  // uses customerActivityAt (set by human saves, Quick log and a customer's own form submission), the
  // first contact and created dates, and timeline entries of a real contact type, from any source.
  var CUSTOMER_ACTIVITY_TYPES = ['email', 'call', 'meeting', 'note', 'created', 'visit'];
  function customerActivityMs(deal) {
    var best = -Infinity;
    function take(v) { var t = Date.parse(v || ''); if (!isNaN(t) && t > best) best = t; }
    if (!deal) return best;
    take(deal.customerActivityAt); take(deal.firstContactAt); take(deal.createdAt);
    (deal.timeline || []).forEach(function (e) { if (e && CUSTOMER_ACTIVITY_TYPES.indexOf(e.type) !== -1) take(e.at); });
    return best;
  }

  function arrDaysIdle(deal, now) {
    var t = customerActivityMs(deal);
    if (!isFinite(t)) return Infinity;
    var n = now == null ? Date.now() : typeof now === 'number' ? now : Date.parse(now);
    return Math.floor((n - t) / 86400000);
  }

  function isArrEstimated(rec) { return !!rec && (rec.arrEstimated === true || rec.arrIsEstimate === true); }
  function dealArr(deal) { return Number(((deal && deal.values) || {}).productionArr) || Number(deal && deal.arr) || 0; }
  function dealArrPotential(deal) { var p = Number(deal && deal.arrPotential); return p > 0 ? p : dealArr(deal); }
  function isPipelineLead(d) { return !!d && d.kind !== 'project' && d.type !== 'internal' && !isClosedLead(d); }

  // Why a lead's ARR is left out of the counted pipeline; '' when it counts.
  function arrExcludedReason(state, deal, now) {
    if (!deal || deal.kind === 'project' || deal.type === 'internal') return 'not a lead';
    if (isClosedLead(deal)) return 'won';
    if (deal.stage === 'lost' || deal.status === 'lost') return 'lost';
    if (coldStages(state).indexOf(deal.stage) !== -1) return 'cold';
    if (!deal.arrPinned && arrDaysIdle(deal, now) >= ARR_STALE_DAYS) return 'no activity ' + ARR_STALE_DAYS + '+ days';
    return '';
  }
  function isArrCounted(state, deal, now) { return !arrExcludedReason(state, deal, now); }

  // A sold job's ARR: annual qty x sell price when both are set, else its ARR value (an estimate when it
  // did not come from a quote or is flagged arrEstimated).
  function skuArrInfo(sku) {
    var qty = num(sku && sku.annualQty), price = num(sku && sku.sellPrice);
    if (qty > 0 && price > 0) return { arr: Math.round(qty * price * 100) / 100, estimated: sku.arrEstimated === true };
    var v = Number(((sku && sku.values) || {}).productionArr) || 0;
    return { arr: v, estimated: v > 0 && (sku.arrEstimated === true || !sku.source) };
  }

  function arrSummary(state, now) {
    function bucket() { return { total: 0, estimated: 0, count: 0, items: [] }; }
    var out = { trueArr: bucket(), counted: bucket(), potential: bucket() };
    (state.skus || []).forEach(function (s) {
      if (!s || s.archived) return;
      var i = skuArrInfo(s);
      if (!(i.arr > 0)) return;
      out.trueArr.total += i.arr; out.trueArr.count += 1;
      if (i.estimated) out.trueArr.estimated += i.arr;
      out.trueArr.items.push({ id: s.id, kind: 'sku', arr: i.arr, estimated: i.estimated });
    });
    (state.deals || []).forEach(function (d) {
      if (!isPipelineLead(d)) return;
      var pot = dealArrPotential(d);
      if (pot > 0) {
        out.potential.total += pot; out.potential.count += 1;
        if (isArrEstimated(d)) out.potential.estimated += pot;
        out.potential.items.push({ id: d.id, kind: 'lead', arr: pot, estimated: isArrEstimated(d), reason: arrExcludedReason(state, d, now) });
      }
      var arr = dealArr(d);
      if (arr > 0 && isArrCounted(state, d, now)) {
        out.counted.total += arr; out.counted.count += 1;
        if (isArrEstimated(d)) out.counted.estimated += arr;
        out.counted.items.push({ id: d.id, kind: 'lead', arr: arr, estimated: isArrEstimated(d), pinned: !!d.arrPinned });
      }
    });
    ['trueArr', 'counted', 'potential'].forEach(function (k) {
      out[k].total = Math.round(out[k].total * 100) / 100;
      out[k].estimated = Math.round(out[k].estimated * 100) / 100;
      out[k].items.sort(function (a, b) { return b.arr - a.arr; });
    });
    return out;
  }

  function moldsForCustomer(state, customerId) {
    var total = 0, blanks = 0, count = 0;
    (state.skus || []).forEach(function (s) {
      if (s.customerId !== customerId || s.archived) return;
      count += 1;
      var m = num(s.moldsRequired);
      if (m == null) blanks += 1; else total += m;
    });
    return { total: total, blanks: blanks, skus: count };
  }

  // The as-emailed quote PDF link (issue #97). Only http(s), 2000 characters at most; otherwise ''.
  function quoteFileUrl(v) {
    var u = typeof v === 'string' ? v.trim() : '';
    return u && u.length <= 2000 && /^https?:\/\/\S+$/i.test(u) ? u : '';
  }

  // A customer quote in the Matrix. raw can come from the lead editor, a bot patch
  // (quotesAdd) or the write API; unknown keys are kept under extra so nothing is lost.
  function normalizeCustomerQuote(raw, ctx) {
    raw = raw || {};
    ctx = ctx || {};
    var known = ['id', 'dealId', 'customerId', 'number', 'quoteNumber', 'revision', 'rev', 'status', 'acceptedAt', 'fileId', 'fileUrl', 'url', 'lines',
      'createdAt', 'updatedAt', 'createdBy', 'source', 'notes', 'sentAt'];
    var extra = {};
    Object.keys(raw).forEach(function (k) { if (known.indexOf(k) === -1) extra[k] = raw[k]; });
    var q = {
      id: raw.id && /^cq_/.test(String(raw.id)) ? String(raw.id) : (ctx.id || makeId('cq')),
      dealId: raw.dealId || ctx.dealId || null,
      customerId: raw.customerId || ctx.customerId || null,
      number: String(raw.number || raw.quoteNumber || '').trim(),
      revision: String(raw.revision || raw.rev || '').trim(),
      status: QUOTE_STATUSES.indexOf(raw.status) !== -1 ? raw.status : 'draft',
      acceptedAt: raw.acceptedAt || null,
      sentAt: raw.sentAt || null,
      fileId: raw.fileId || null,
      fileUrl: quoteFileUrl(raw.fileUrl || raw.url),
      notes: String(raw.notes || ''),
      source: raw.source || ctx.source || 'manual',
      createdBy: raw.createdBy || ctx.by || 'user',
      createdAt: raw.createdAt || ctx.at || nowIso(),
      updatedAt: ctx.at || raw.updatedAt || nowIso(),
      lines: (Array.isArray(raw.lines) ? raw.lines : []).map(function (l, i) { return normalizeQuoteLine(l, (ctx.id || raw.id || 'cq') + '_l' + (i + 1)); })
    };
    if (Object.keys(extra).length) q.extra = extra;
    return q;
  }

  function normalizeQuoteLine(l, fallbackId) {
    l = l || {};
    function keep(v) { var n = num(v); return n == null ? '' : n; }
    return {
      id: l.id || fallbackId || makeId('cql'),
      productName: String(l.productName || l.name || l.sku || '').trim(),
      skuId: l.skuId || null,
      moldsRequired: keep(l.moldsRequired != null ? l.moldsRequired : l.molds),
      tooling: keep(l.tooling != null ? l.tooling : l.moldTooling),
      designDfm: keep(l.designDfm),
      prototyping: keep(l.prototyping),
      partnerServices: keep(l.partnerServices),
      unitPrice: keep(l.unitPrice),
      annualQty: keep(l.annualQty),
      tiers: (Array.isArray(l.tiers) ? l.tiers : []).map(function (t) { return { qty: keep(t && t.qty), unitPrice: keep(t && t.unitPrice) }; })
        .filter(function (t) { return t.qty !== '' || t.unitPrice !== ''; })
    };
  }

  function quoteLabel(q) {
    if (!q) return '';
    return (q.number || 'Quote') + (q.revision ? ' rev ' + q.revision : '');
  }

  // What a quote line puts on a SKU. Missing quote fields come back blank and listed in
  // missing, so the card can flag them instead of guessing.
  function skuFieldsFromQuoteLine(quote, line) {
    var out = { fields: {}, missing: [] };
    function set(path, v, blankIsMissing) {
      if (v === '' || v == null) { if (blankIsMissing) out.missing.push(path); out.fields[path] = ''; return; }
      out.fields[path] = v;
    }
    set('name', line.productName || '', false);
    set('moldsRequired', line.moldsRequired, true);
    set('values.designDfm', line.designDfm, false);
    set('values.prototyping', line.prototyping, false);
    set('values.tooling', line.tooling, true);
    set('values.partnerServices', line.partnerServices, false);
    set('sellPrice', line.unitPrice, true);
    out.fields.tiers = (line.tiers || []).map(function (t) { return { qty: t.qty, unitPrice: t.unitPrice }; });
    set('annualQty', line.annualQty, true);
    var up = num(line.unitPrice), aq = num(line.annualQty);
    if (up != null && aq != null) out.fields['values.productionArr'] = Math.round(up * aq * 100) / 100;
    else { out.fields['values.productionArr'] = ''; out.missing.push('values.productionArr'); }
    out.source = { quoteId: quote.id, number: quote.number || '', revision: quote.revision || '', lineId: line.id };
    return out;
  }

  function getPathValue(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function setPathValue(obj, path, v) {
    var parts = path.split('.');
    var o = obj;
    for (var i = 0; i < parts.length - 1; i++) { if (!o[parts[i]] || typeof o[parts[i]] !== 'object') o[parts[i]] = {}; o = o[parts[i]]; }
    o[parts[parts.length - 1]] = v;
  }
  // Compare field values: blanks are equal, numbers compare as numbers, lists as JSON.
  function normField(v) {
    if (v === undefined || v === null || v === '') return '';
    if (typeof v === 'object') return JSON.stringify(v);
    var n = num(v);
    return n != null ? String(n) : String(v).trim();
  }
  function sameField(a, b) { return normField(a) === normField(b); }
  function isBlankField(v) { return normField(v) === '' || normField(v) === '[]'; }

  // A field was edited by hand when it no longer equals what the quote put there.
  function isHandEdited(sku, path) {
    var pre = sku.prefilled || {};
    if (!(path in pre)) return false;
    return !sameField(getPathValue(sku, path), pre[path]);
  }

  // Compare a quote line with a SKU. Returns one row per field that would change, with
  // handEdited set when the SKU value came from a person, not the quote.
  function quoteDiff(sku, quote, line) {
    var src = skuFieldsFromQuoteLine(quote, line);
    var rows = [];
    QUOTE_PREFILL_FIELDS.forEach(function (path) {
      if (!(path in src.fields)) return;
      var cur = getPathValue(sku, path), next = src.fields[path];
      // A field the quote leaves blank never clears the SKU; it is flagged instead.
      if (isBlankField(next) || sameField(cur, next)) return;
      rows.push({ field: path, label: QUOTE_FIELD_LABELS[path] || path, from: cur === undefined ? '' : cur, to: next, handEdited: isHandEdited(sku, path) });
    });
    return { rows: rows, missing: src.missing, source: src.source };
  }

  // Apply a quote line to a SKU. Without opts.fields only fields that are blank or still
  // equal to the last quote value change; hand edits are never overwritten silently.
  // opts.fields lists the fields a person confirmed in the diff. Returns the applied rows.
  function applyQuoteToSku(state, sku, quote, line, opts) {
    opts = opts || {};
    ensureSkuJobFields(sku);
    var at = opts.at || nowIso();
    var by = opts.by || 'user';
    var d = quoteDiff(sku, quote, line);
    var src = skuFieldsFromQuoteLine(quote, line);
    var applied = [];
    d.rows.forEach(function (r) {
      var ok = opts.fields ? opts.fields.indexOf(r.field) !== -1 : !r.handEdited;
      if (!ok) return;
      setPathValue(sku, r.field, JSON.parse(JSON.stringify(r.to)));
      applied.push(r);
    });
    // Remember what the quote said, so a later hand edit is detectable. A field a person
    // kept (skipped) keeps its old marker, so it still counts as hand edited.
    QUOTE_PREFILL_FIELDS.forEach(function (path) {
      if (!(path in src.fields) || isBlankField(src.fields[path])) return;
      if (sameField(getPathValue(sku, path), src.fields[path])) sku.prefilled[path] = JSON.parse(JSON.stringify(src.fields[path]));
    });
    sku.source = src.source;
    sku.quoteMissing = src.missing.slice();
    sku.updatedAt = at;
    ensureArrays(state);
    if (applied.length) {
      pushSkuEvent(state, {
        id: makeId('sev'), skuId: sku.id, at: at, who: by, type: 'quote',
        text: 'Filled from quote ' + quoteLabel(quote) + ': ' + applied.map(function (r) { return r.label; }).join(', '),
        data: { quoteId: quote.id, lineId: line.id, changes: applied }
      });
      state.changeLog.push({
        id: makeId('chg'), at: at, who: by, by: by, source: 'human', action: 'quote-apply', entityType: 'sku', entityId: sku.id,
        detail: 'Quote ' + quoteLabel(quote) + ' applied to ' + (sku.code || sku.name || sku.id) + ': ' +
          applied.map(function (r) { return r.label + ' ' + clip(r.from) + ' to ' + clip(r.to); }).join('; ')
      });
    }
    return { applied: applied, skipped: d.rows.filter(function (r) { return applied.indexOf(r) === -1; }), missing: src.missing };
  }

  function isClosedLead(d) {
    return !!d && (d.status === 'won' || d.status === 'converted');
  }

  // Mark a lead won. Links or creates the Customer, closes the lead (it leaves the working
  // CRM boards but stays in history), accepts the chosen quote and supersedes older ones.
  function markLeadWon(state, lead, opts) {
    opts = opts || {};
    ensureArrays(state);
    var at = opts.at || nowIso();
    var by = opts.by || 'user';
    var cust = null;
    if (opts.customerId) cust = state.customers.find(function (c) { return c.id === opts.customerId; }) || null;
    if (!cust && opts.customerName) cust = findOrCreateCustomer(state, opts.customerName, lead.source, at).customer;
    if (!cust && lead.customerId) cust = state.customers.find(function (c) { return c.id === lead.customerId; }) || null;
    if (!cust) cust = findOrCreateCustomer(state, lead.company || lead.title, lead.source, at).customer;
    lead.customerId = cust.id;
    lead.status = 'won';
    lead.wonAt = at;
    lead.wonBy = by;
    lead.acceptedQuoteId = opts.quoteId || null;
    lead.nextFollowUp = null;
    lead.updatedAt = at;
    lead.lastActivityAt = at;
    if (!Array.isArray(lead.skuIds)) lead.skuIds = [];
    var quote = opts.quoteId ? state.customerQuotes.find(function (q) { return q.id === opts.quoteId; }) : null;
    if (quote) {
      state.customerQuotes.forEach(function (q) {
        if (q.dealId === lead.id && q.id !== quote.id && q.status === 'accepted') { q.status = 'superseded'; q.updatedAt = at; }
      });
      quote.status = 'accepted';
      quote.acceptedAt = quote.acceptedAt || at;
      quote.customerId = cust.id;
      quote.updatedAt = at;
    }
    state.changeLog.push({
      id: makeId('chg'), at: at, who: by, by: by, source: 'human', action: 'won', entityType: 'lead', entityId: lead.id,
      detail: 'Marked won for ' + cust.name + (quote ? ' with quote ' + quoteLabel(quote) : ' with no quote')
    });
    return { customer: cust, quote: quote || null };
  }

  // Create SKU jobs for a won lead. rows: [{ lineId?, name, stage? }]. With a quote each
  // row is prefilled from its line; with no quote the deal's one-time amounts and ARR go
  // onto the first SKU (Owner: money on the first SKU, editable).
  function createSkuJobs(state, lead, rows, opts) {
    opts = opts || {};
    ensureArrays(state);
    var at = opts.at || nowIso();
    var by = opts.by || 'user';
    var quote = opts.quoteId ? state.customerQuotes.find(function (q) { return q.id === opts.quoteId; }) : null;
    var stage = opts.stage || skuStageAt(state, 0);
    var made = [];
    (rows || []).forEach(function (row, i) {
      var sku = blankSku({ customerId: lead.customerId, dealId: lead.id, createdAt: at, updatedAt: at });
      sku.code = String(row.code || '').trim();
      sku.name = String(row.name || '').trim();
      setSkuStage(state, sku, row.stage || stage, at);
      state.skus.push(sku);
      var line = quote && row.lineId ? (quote.lines || []).find(function (l) { return l.id === row.lineId; }) : null;
      if (line) {
        applyQuoteToSku(state, sku, quote, line, { at: at, by: by });
        if (row.name) sku.name = String(row.name).trim();
        line.skuId = sku.id;
      } else if (!quote && i === 0) {
        var v = lead.values || {};
        SKU_VALUE_KEYS.forEach(function (k) { sku.values[k] = Number(v[k]) || 0; });
      }
      pushSkuEvent(state, {
        id: makeId('sev'), skuId: sku.id, at: at, who: by, type: 'created',
        text: 'SKU job created from won deal ' + (lead.title || lead.company || lead.id) + (quote ? ' (quote ' + quoteLabel(quote) + ')' : '')
      });
      lead.skuIds = (lead.skuIds || []).concat([sku.id]);
      made.push(sku);
    });
    if (made.length) {
      state.changeLog.push({
        id: makeId('chg'), at: at, who: by, by: by, source: 'human', action: 'create', entityType: 'sku', entityId: made[0].id,
        detail: made.length + ' SKU job(s) created from lead ' + lead.id + (quote ? ' and quote ' + quoteLabel(quote) : '')
      });
    }
    return made;
  }

  // ---------------------------------------------------------------------
  // Sold and paid (issue #96, Owner picked option 1). A lead is sold and paid when it has an
  // accepted quote and, linked to that lead (billing entry dealId, never customer-wide):
  //   - a paid Deposit entry, any amount; or
  //   - paid Design, Prototype and Tooling entries that together cover the quote's up-front total
  //     (design/DFM + prototyping + tooling + services on its lines).
  // Less than that is partial and does not count. Voided entries never count.
  // ---------------------------------------------------------------------
  var PAID_UPFRONT_CATEGORIES = ['design', 'prototype', 'tooling'];

  function acceptedQuoteFor(state, deal) {
    var qs = (state.customerQuotes || []).filter(function (q) { return q && q.dealId === deal.id && q.status === 'accepted'; });
    return qs.find(function (q) { return q.id === deal.acceptedQuoteId; }) || (qs.length === 1 ? qs[0] : null);
  }

  function quoteUpfrontTotal(q) {
    var t = 0;
    ((q && q.lines) || []).forEach(function (l) {
      ['designDfm', 'prototyping', 'tooling', 'partnerServices'].forEach(function (k) { t += Number(l[k]) || 0; });
    });
    return Math.round(t * 100) / 100;
  }

  // { soldPaid, quote, via: 'deposit' | 'upfront' | null, paidUpfront, upfrontTotal, reason }
  function soldPaidInfo(state, deal) {
    var out = { soldPaid: false, quote: null, via: null, paidUpfront: 0, upfrontTotal: 0, reason: '' };
    if (!deal || deal.kind === 'project' || deal.type === 'internal') { out.reason = 'not a lead'; return out; }
    out.quote = acceptedQuoteFor(state, deal);
    if (!out.quote) { out.reason = 'no accepted quote'; return out; }
    var paid = (state.billingEntries || []).filter(function (e) { return e && !e.voided && e.status === 'paid' && e.dealId === deal.id; });
    out.upfrontTotal = quoteUpfrontTotal(out.quote);
    paid.forEach(function (e) { if (PAID_UPFRONT_CATEGORIES.indexOf(e.category) !== -1) out.paidUpfront += Number(e.amount) || 0; });
    out.paidUpfront = Math.round(out.paidUpfront * 100) / 100;
    if (paid.some(function (e) { return e.category === 'deposit'; })) { out.soldPaid = true; out.via = 'deposit'; return out; }
    if (out.upfrontTotal > 0 && out.paidUpfront >= out.upfrontTotal) { out.soldPaid = true; out.via = 'upfront'; return out; }
    out.reason = out.paidUpfront > 0 ? 'partly paid' : 'not paid';
    return out;
  }

  function isSoldAndPaid(state, deal) { return soldPaidInfo(state, deal).soldPaid; }

  // Sold and paid leads that are not won yet (still on a CRM board). Lost leads count too: money came in.
  function paidNotWon(state) {
    return (state.deals || []).filter(function (d) { return d && d.kind !== 'project' && d.type !== 'internal' && !isClosedLead(d) && isSoldAndPaid(state, d); });
  }

  // Mark won for the write API (issue #96): the same steps as the Mark won window. With a quote,
  // one SKU job per quote line that has no SKU yet; with no quote, one SKU job named after the lead.
  // o: { quoteId?, customerId?, startStage?, by, at }. Returns { error } or { customer, quote, skus }.
  function applyMarkWon(state, lead, o) {
    o = o || {};
    ensureArrays(state);
    if (!lead || lead.kind === 'project' || lead.type === 'internal') return { error: 'not a lead' };
    if (isClosedLead(lead)) return { error: 'already won' };
    var at = o.at || nowIso(), by = o.by || 'bot';
    var quote = null;
    if (o.quoteId) {
      quote = state.customerQuotes.find(function (q) { return q.id === o.quoteId; }) || null;
      if (!quote || quote.dealId !== lead.id) return { error: 'quote ' + o.quoteId + ' is not on lead ' + lead.id };
      if (quote.status === 'superseded') return { error: 'quote ' + o.quoteId + ' is superseded' };
    } else quote = acceptedQuoteFor(state, lead);
    if (o.customerId && !state.customers.some(function (c) { return c.id === o.customerId; })) return { error: 'customer ' + o.customerId + ' not found' };
    var stage = o.startStage || skuStageAt(state, 0);
    if (!stage || stageKindOf(state, stage) !== 'sku') return { error: 'startStage ' + (o.startStage || '(none)') + ' is not a Pre-Production SKU stage' };
    var res = markLeadWon(state, lead, { customerId: o.customerId || null, quoteId: quote ? quote.id : null, by: by, at: at });
    var rows = quote ? (quote.lines || []).filter(function (l) { return !l.skuId; }).map(function (l) { return { lineId: l.id, name: l.productName || '' }; })
      : [{ name: lead.title || lead.company || '' }];
    var skus = createSkuJobs(state, lead, rows, { quoteId: quote ? quote.id : null, stage: stage, by: by, at: at });
    KPI_WON_STAGES.forEach(function (wonStage) {
      applyStageRules(state, lead, {
        at: at, stage: wonStage, allowWon: true, vars: { company: lead.company || '', title: lead.title || lead.company || '', contact: lead.contactName || '' },
        log: function (action, type, id, text) {
          state.changeLog.push({ id: makeId('chg'), at: at, who: by, by: by, source: 'stage-rule', action: action, entityType: type, entityId: id, detail: text });
        }
      });
    });
    return { customer: res.customer, quote: res.quote, skus: skus };
  }

  // Reassign a SKU to another customer. Its POs and timeline stay; the change is logged.
  function reassignSkuCustomer(state, sku, customerId, opts) {
    opts = opts || {};
    ensureArrays(state);
    var at = opts.at || nowIso();
    var by = opts.by || 'user';
    var from = sku.customerId || null;
    if (from === customerId) return false;
    var fromC = state.customers.find(function (c) { return c.id === from; });
    var toC = state.customers.find(function (c) { return c.id === customerId; });
    if (!toC) return false;
    sku.customerId = customerId;
    sku.updatedAt = at;
    pushSkuEvent(state, {
      id: makeId('sev'), skuId: sku.id, at: at, who: by, type: 'customer',
      text: 'Customer: ' + (fromC ? fromC.name : '(none)') + ' to ' + toC.name, data: { from: from, to: customerId }
    });
    state.changeLog.push({
      id: makeId('chg'), at: at, who: by, by: by, source: 'human', action: 'reassign', entityType: 'sku', entityId: sku.id,
      field: 'customerId', oldValue: from, newValue: customerId,
      detail: (sku.code || sku.name || sku.id) + ' moved from ' + (fromC ? fromC.name : '(none)') + ' to ' + toC.name
    });
    return true;
  }

  // ---------------------------------------------------------------------
  // Customer PO upload (issue #20). HelperBot parses a PO email or PDF and posts JSON (write API
  // poUpserts); Owner can paste the same JSON in Admin tools. One PO per customer and normalized
  // PO number: posting it again updates it and never duplicates it. Lines are never deleted.
  // An unknown or ambiguous customer, or a SKU code the customer does not have, sends the whole
  // PO to the proposal queue; nothing is written until Owner applies it.
  // ---------------------------------------------------------------------
  var PO_SOURCE = 'po-import';
  var PO_LINE_STATUSES = ['open', 'in_production', 'shipped', 'closed'];
  var PO_STATUSES = ['open', 'closed'];
  var PO_TEXT_FIELDS = ['terms', 'buyer', 'shipVia', 'shipTo'];
  var PO_DATE_FIELDS = ['poDate', 'requiredDate'];
  var PO_KNOWN_KEYS = ['customer', 'customerId', 'createCustomer', 'createSkus', 'poNumber', 'poDate', 'terms', 'requiredDate',
    'buyer', 'shipVia', 'shipTo', 'status', 'notes', 'filesAdd', 'lines', 'ifUpdatedAt', 'sources'];
  var PO_LINE_KNOWN_KEYS = ['id', 'lineNo', 'skuId', 'skuCode', 'revision', 'description', 'qty', 'unitPrice', 'amount',
    'shipDate', 'requiredDate', 'stage', 'uom'];
  var FREE_EMAIL_DOMAINS = ['gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
    'icloud.com', 'me.com', 'aol.com', 'comcast.net', 'proton.me', 'protonmail.com'];

  // "W 260922GK" and "w-260922gk" are the same PO.
  function normalizePoNumber(s) {
    return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  // "DH94 Rev00" is SKU code DH94, revision Rev00. Codes compare without spaces or dashes.
  function splitSkuCode(s) {
    var t = String(s == null ? '' : s).trim();
    var m = t.match(/^(.*?)[\s_-]+(rev\.?\s*[a-z0-9]+)$/i);
    if (m && m[1].trim()) return { code: m[1].trim(), revision: m[2].replace(/\s+/g, '') };
    return { code: t, revision: '' };
  }

  function normalizeSkuCode(s) {
    return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function domainOf(s) {
    var t = String(s == null ? '' : s).trim().toLowerCase();
    if (!t) return '';
    if (t.indexOf('@') !== -1) t = t.split('@').pop();
    t = t.replace(/^[a-z]+:\/\//, '').split('/')[0].split(':')[0].replace(/^www\./, '');
    return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(t) ? t : '';
  }

  function toList(v) {
    if (v == null || v === '') return [];
    return Array.isArray(v) ? v : [v];
  }

  // YYYY-MM-DD in Pacific time for an ISO timestamp (servers run in UTC).
  function pacificDay(iso) {
    var d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    try { return d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); } catch (e) { return d.toISOString().slice(0, 10); }
  }
  function isIsoDay(v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')); }

  function customerDomains(state, c) {
    var out = [];
    function add(d) { if (d && FREE_EMAIL_DOMAINS.indexOf(d) === -1 && out.indexOf(d) === -1) out.push(d); }
    add(domainOf(c.website));
    toList(c.emailDomains).forEach(function (d) { add(domainOf(d)); });
    (state.contacts || []).forEach(function (k) { if (k && k.customerId === c.id) add(domainOf(k.email)); });
    return out;
  }

  // Customer for a PO: by id, then exact name or aka (normalized), then email or web domain.
  // Returns { customer, via } or { customer: null, candidates: [ids], reason }.
  function matchPoCustomer(state, raw) {
    ensureArrays(state);
    var spec = raw.customer;
    if (typeof spec === 'string') spec = { name: spec };
    spec = spec && typeof spec === 'object' ? spec : {};
    var id = raw.customerId || spec.id;
    if (id) {
      var byId = state.customers.find(function (c) { return c.id === id; });
      return byId ? { customer: byId, via: 'id', candidates: [byId.id] } : { customer: null, candidates: [], reason: 'No customer with id ' + id };
    }
    var names = [];
    toList(spec.name).concat(toList(spec.aka)).forEach(function (n) {
      String(n).split(/\s+\/\s+/).forEach(function (part) {
        var k = normalizeCompanyName(part);
        if (k && names.indexOf(k) === -1) names.push(k);
      });
    });
    var byName = state.customers.filter(function (c) {
      if (c.archived) return false;
      var keys = [c.normalizedName].concat(toList(c.aka).map(normalizeCompanyName));
      return keys.some(function (k) { return k && names.indexOf(k) !== -1; });
    });
    if (byName.length === 1) return { customer: byName[0], via: 'name', candidates: [byName[0].id] };
    if (byName.length > 1) return { customer: null, candidates: byName.map(function (c) { return c.id; }), reason: 'More than one customer matches the name' };
    var domains = [];
    toList(spec.email).concat(toList(spec.emails), toList(spec.domain), toList(spec.website)).forEach(function (e) {
      var d = domainOf(e);
      if (d && FREE_EMAIL_DOMAINS.indexOf(d) === -1 && domains.indexOf(d) === -1) domains.push(d);
    });
    if (domains.length) {
      var byDomain = state.customers.filter(function (c) {
        return !c.archived && customerDomains(state, c).some(function (d) { return domains.indexOf(d) !== -1; });
      });
      if (byDomain.length === 1) return { customer: byDomain[0], via: 'domain', candidates: [byDomain[0].id] };
      if (byDomain.length > 1) return { customer: null, candidates: byDomain.map(function (c) { return c.id; }), reason: 'More than one customer matches the email domain' };
    }
    // Close names ("Northwind" for "Northwind Equipment") are suggestions for Owner, never a match.
    var similar = state.customers.filter(function (c) {
      return !c.archived && names.some(function (n) { return similarNames(n, c.normalizedName) || toList(c.aka).some(function (a) { return similarNames(n, normalizeCompanyName(a)); }); });
    });
    var label = toList(spec.name)[0] || domains[0] || '(no name)';
    if (similar.length) {
      return { customer: null, candidates: similar.map(function (c) { return c.id; }), reason: 'No exact customer match for ' + label + '; close: ' + similar.map(function (c) { return c.name; }).join(', ') };
    }
    return { customer: null, candidates: [], reason: 'No customer matches ' + label };
  }

  // Every word of the shorter name is in the longer one ("northwind" and "northwind equipment").
  function similarNames(a, b) {
    if (!a || !b || a === b) return false;
    var ta = a.split(' '), tb = b.split(' ');
    var short = ta.length <= tb.length ? ta : tb, long = ta.length <= tb.length ? tb : ta;
    if (short.join('').length < 4) return false;
    return short.every(function (w) { return long.indexOf(w) !== -1; });
  }

  // After Owner applies a PO to an existing customer, the names and email domain on the PO are
  // remembered (add-only) so the next PO from them matches without a proposal.
  function learnCustomerNames(state, cust, raw, log) {
    var spec = typeof raw.customer === 'string' ? { name: raw.customer } : (raw.customer && typeof raw.customer === 'object' ? raw.customer : {});
    if (!Array.isArray(cust.aka)) cust.aka = toList(cust.aka);
    var learned = [];
    toList(spec.name).concat(toList(spec.aka)).forEach(function (n) {
      String(n).split(/\s+\/\s+/).forEach(function (part) {
        var t = part.trim();
        var k = normalizeCompanyName(t);
        if (!k || k === cust.normalizedName || cust.aka.some(function (x) { return normalizeCompanyName(x) === k; })) return;
        cust.aka.push(t);
        learned.push(t);
      });
    });
    var have = customerDomains(state, cust);
    toList(spec.email).concat(toList(spec.emails), toList(spec.domain)).forEach(function (e) {
      var d = domainOf(e);
      if (!d || FREE_EMAIL_DOMAINS.indexOf(d) !== -1 || have.indexOf(d) !== -1) return;
      if (!Array.isArray(cust.emailDomains)) cust.emailDomains = [];
      cust.emailDomains.push(d);
      have.push(d);
      learned.push(d);
    });
    if (learned.length) cust.updatedAt = nowIso();
    if (learned.length) log('customer', cust.id, 'update', 'aka', null, learned.join(', '), 'Remembered for PO matching on ' + cust.name + ': ' + learned.join(', '));
    return learned;
  }

  // SKU for one PO line, only among the customer's SKUs. Returns { sku } or { sku: null, code, reason }.
  function matchPoSku(state, customerId, line) {
    var parsed = splitSkuCode(line.skuCode);
    if (line.skuId) {
      var s = (state.skus || []).find(function (x) { return x.id === line.skuId; });
      if (!s) return { sku: null, code: parsed.code, reason: 'No SKU with id ' + line.skuId };
      if (s.customerId !== customerId) return { sku: null, code: parsed.code, reason: 'SKU ' + (s.code || s.id) + ' belongs to another customer' };
      return { sku: s, revision: parsed.revision };
    }
    var key = normalizeSkuCode(parsed.code);
    if (!key) return { sku: null, code: '', reason: 'Line has no skuCode or skuId' };
    var hits = (state.skus || []).filter(function (x) { return x.customerId === customerId && normalizeSkuCode(x.code) === key; });
    var live = hits.filter(function (x) { return !x.archived; });
    if (live.length) hits = live;
    if (hits.length === 1) return { sku: hits[0], revision: parsed.revision };
    if (hits.length > 1) return { sku: null, code: parsed.code, reason: 'More than one SKU ' + parsed.code + ' for this customer' };
    return { sku: null, code: parsed.code, revision: parsed.revision, reason: 'New SKU code ' + parsed.code };
  }

  function poStatusForStage(state, stage) {
    var idx = poBoardStages(state).indexOf(stage);
    return PO_LINE_STATUSES[Math.max(0, Math.min(idx, PO_LINE_STATUSES.length - 1))];
  }

  function poKeyOf(raw, customerId) {
    var spec = raw.customer;
    var name = typeof spec === 'string' ? spec : spec && spec.name;
    return (customerId || raw.customerId || (spec && spec.id) || normalizeCompanyName(name) || domainOf(spec && spec.email) || '?') +
      '|' + normalizePoNumber(raw.poNumber);
  }

  function emptyPoSummary() {
    return {
      pos: 0, created: 0, updated: 0, unchanged: 0, proposals: 0, proposalsRefreshed: 0, linesAdded: 0, linesUpdated: 0,
      linesUnchanged: 0, filesAdded: 0, customersCreated: 0, skusCreated: 0, skippedStale: [], skippedNoAccess: [],
      invalid: [], results: [], ignored: [], frozen: false
    };
  }

  // One PO. Mutates state. opts: { by, actedFor, isAdmin, at, summary, customerId (from a proposal),
  // createCustomer, createSkus (admins only), canWriteCustomers }.
  function upsertCustomerPo(state, raw, opts) {
    opts = opts || {};
    ensureArrays(state);
    var at = opts.at || nowIso();
    var by = String(opts.by || 'unknown').toLowerCase();
    var actedFor = opts.actedFor ? String(opts.actedFor).toLowerCase() : null;
    var admin = !!opts.isAdmin;
    var summary = opts.summary || emptyPoSummary();
    var ignored = summary.ignored;
    raw = raw && typeof raw === 'object' ? raw : {};
    var poNo = normalizePoNumber(raw.poNumber);
    var label = 'PO ' + (poNo || '(no number)');
    var result = { poNumber: poNo, action: '', poId: null, customerId: null, reasons: [] };
    summary.results.push(result);

    function log(entityType, entityId, action, field, oldValue, newValue, detail) {
      state.changeLog.push({
        id: makeId('chg'), at: at, who: by, by: by, actedFor: actedFor, source: PO_SOURCE, action: action,
        entityType: entityType, entityId: entityId || null, field: field || null,
        oldValue: oldValue === undefined ? null : oldValue, newValue: newValue === undefined ? null : newValue, detail: detail
      });
    }

    if (!poNo) { result.action = 'invalid'; result.reasons.push('poNumber is required'); summary.invalid.push(label + ': poNumber is required'); return result; }
    if (opts.canWriteCustomers === false) { result.action = 'no-access'; summary.skippedNoAccess.push(label); return result; }
    var lines = Array.isArray(raw.lines) ? raw.lines.filter(function (l) { return l && typeof l === 'object'; }) : [];
    if (!lines.length) { result.action = 'invalid'; result.reasons.push('lines must be a non-empty array'); summary.invalid.push(label + ': lines must be a non-empty array'); return result; }
    Object.keys(raw).forEach(function (k) { if (PO_KNOWN_KEYS.indexOf(k) === -1) ignored.push(label + ': unknown key ' + k + ' ignored'); });
    lines.forEach(function (l, i) {
      Object.keys(l).forEach(function (k) { if (PO_LINE_KNOWN_KEYS.indexOf(k) === -1) ignored.push(label + ' line ' + (i + 1) + ': unknown key ' + k + ' ignored'); });
    });
    if ((raw.createCustomer || raw.createSkus) && !admin) ignored.push(label + ': createCustomer and createSkus are admin only, sent to proposals');

    // Customer.
    var match = opts.customerId ? matchPoCustomer(state, { customerId: opts.customerId }) : matchPoCustomer(state, raw);
    var cust = match.customer;
    var reasons = [];
    var createCustomer = admin && (opts.createCustomer || raw.createCustomer === true);
    var createSkus = admin && (opts.createSkus || raw.createSkus === true);
    var spec = typeof raw.customer === 'string' ? { name: raw.customer } : (raw.customer && typeof raw.customer === 'object' ? raw.customer : {});
    var willCreate = !cust && createCustomer && (!match.candidates.length || !!opts.fromProposal) && !!toList(spec.name)[0];
    if (!cust && !willCreate) reasons.push(match.reason);

    // SKUs (only knowable once the customer is).
    var missingSkus = [];
    var resolved = lines.map(function (l, i) {
      if (!cust) return null;
      var m = matchPoSku(state, cust.id, l);
      if (!m.sku) {
        if (createSkus && m.code && /^New SKU code/.test(m.reason)) return { create: true, code: m.code, revision: m.revision };
        missingSkus.push(m.code || ('line ' + (i + 1)));
        reasons.push('Line ' + (i + 1) + ': ' + m.reason);
      }
      return m;
    });
    if (!cust && willCreate && !reasons.length) {
      // New customer (admin only). It has no SKUs yet, so every line needs a code and createSkus.
      var codes = lines.map(function (l) { return splitSkuCode(l.skuCode); });
      if (!createSkus || codes.some(function (c) { return !normalizeSkuCode(c.code); })) {
        reasons.push('A new customer has no SKUs yet: set createSkus and a skuCode on every line');
        missingSkus = codes.map(function (c) { return c.code; }).filter(Boolean);
      } else {
        var made = findOrCreateCustomer(state, toList(spec.name)[0], PO_SOURCE, at);
        cust = made.customer;
        if (made.created) {
          var aka = toList(spec.aka).map(function (a) { return String(a).trim(); }).filter(Boolean);
          if (aka.length) cust.aka = aka;
          summary.customersCreated += 1;
          log('customer', cust.id, 'create', null, null, cust.name, 'Created customer ' + cust.name + ' from ' + label);
        }
        resolved = codes.map(function (c) { return { create: true, code: c.code, revision: c.revision }; });
      }
    }

    if (reasons.length) {
      // Proposal: the whole PO waits for Owner. Re-posting refreshes the pending one.
      var key = poKeyOf(raw, cust && cust.id);
      var copy = JSON.parse(JSON.stringify(raw));
      var pending = state.proposals.find(function (p) { return p.status === 'pending' && p.action === 'po-upsert' && p.payload && p.payload.poKey === key; });
      var summaryText = label + ' for ' + (cust ? cust.name : (toList(spec.name)[0] || 'unknown customer')) + ': ' + reasons.join('; ');
      if (pending) {
        pending.payload.po = copy;
        pending.payload.reasons = reasons;
        pending.payload.candidates = match.candidates;
        pending.payload.missingSkus = missingSkus;
        pending.summary = summaryText;
        pending.updatedAt = at;
        summary.proposalsRefreshed += 1;
        result.action = 'proposal-refreshed';
        result.proposalId = pending.id;
      } else {
        var prop = {
          id: makeId('prp'), at: at, bot: by, actedFor: actedFor, source: PO_SOURCE, action: 'po-upsert',
          entityType: cust ? 'customer' : 'po', entityId: cust ? cust.id : null,
          payload: { poKey: key, po: copy, reasons: reasons, candidates: match.candidates, missingSkus: missingSkus },
          summary: summaryText, status: 'pending', resolvedAt: null, resolvedBy: null
        };
        state.proposals.push(prop);
        summary.proposals += 1;
        result.action = 'proposal';
        result.proposalId = prop.id;
        log('po', null, 'proposal', null, null, poNo, 'Sent ' + summaryText + ' to proposals');
      }
      result.customerId = cust ? cust.id : null;
      result.reasons = reasons;
      return result;
    }
    result.customerId = cust.id;
    if (opts.fromProposal && opts.customerId) learnCustomerNames(state, cust, raw, log);

    // Find the PO. Existing hand-entered POs match on the normalized number too.
    var same = state.customerPos.filter(function (p) { return p.customerId === cust.id && normalizePoNumber(p.poNumber) === poNo; });
    if (same.length > 1) ignored.push(label + ': ' + same.length + ' POs with this number for ' + cust.name + ', updated the first');
    var po = same[0] || null;
    if (po && raw.ifUpdatedAt && po.updatedAt && String(po.updatedAt) !== String(raw.ifUpdatedAt)) {
      result.action = 'stale';
      result.poId = po.id;
      summary.skippedStale.push(label);
      return result;
    }
    var created = !po;
    var changed = false;
    if (created) {
      po = {
        id: makeId('po'), customerId: cust.id, poNumber: poNo, poDate: '', requiredDate: '', terms: '', buyer: '', shipVia: '', shipTo: '',
        fileId: null, status: 'open', notes: '', lines: [], source: PO_SOURCE, sources: [], createdAt: at, createdBy: by, updatedAt: at
      };
      state.customerPos.push(po);
      log('po', po.id, 'create', null, null, poNo, 'Added customer PO ' + poNo + ' for ' + cust.name);
    }

    function setPoField(field, value) {
      var v = String(value == null ? '' : value).trim();
      if (!v) return;
      var old = po[field] == null ? '' : String(po[field]);
      if (old === v) return;
      po[field] = v;
      changed = true;
      if (!created) log('po', po.id, 'update', field, old || null, v, label + ' ' + field + ': "' + clip(old) + '" to "' + clip(v) + '"');
    }
    PO_DATE_FIELDS.forEach(function (f) {
      if (isBlank(raw[f])) return;
      if (!isIsoDay(raw[f])) { ignored.push(label + ' ' + f + ': use YYYY-MM-DD, "' + clip(raw[f]) + '" ignored'); return; }
      setPoField(f, raw[f]);
    });
    PO_TEXT_FIELDS.forEach(function (f) { if (!isBlank(raw[f])) setPoField(f, raw[f]); });
    if (!isBlank(raw.status)) {
      if (PO_STATUSES.indexOf(String(raw.status)) === -1) ignored.push(label + ' status: use ' + PO_STATUSES.join(' or '));
      else setPoField('status', raw.status);
    }

    // Notes: add-only, one line per note, skip text already there.
    toList(raw.notes).forEach(function (n) {
      String(n == null ? '' : n).split(/\r?\n/).forEach(function (t) {
        t = t.trim();
        if (!t || String(po.notes || '').split(/\r?\n/).some(function (x) { return x.trim() === t; })) return;
        po.notes = po.notes ? po.notes + '\n' + t : t;
        changed = true;
        if (!created) log('po', po.id, 'update', 'notes', null, t, label + ' note added: "' + clip(t) + '"');
      });
    });

    // Sources: add-only.
    toList(raw.sources).forEach(function (s) {
      if (isBlank(s)) return;
      if (!Array.isArray(po.sources)) po.sources = [];
      if (po.sources.some(function (x) { return sameValue(x, s); })) return;
      po.sources.push(s);
      changed = true;
    });

    // Files: http(s) links only, dedupe by url on this PO.
    toList(raw.filesAdd).forEach(function (f) {
      if (typeof f === 'string') f = { url: f };
      if (!f || typeof f !== 'object') return;
      var url = String(f.url || '').trim();
      if (!isHttpUrl(url)) { ignored.push(label + ': file "' + clip(f.name || f.url || '') + '" needs an http(s) link (Drive or web)'); return; }
      var have = state.files.find(function (x) { return x && x.ownerType === 'po' && x.ownerId === po.id && (x.url === url || x.driveUrl === url); });
      if (have) { if (!po.fileId) { po.fileId = have.id; changed = true; } return; }
      var name = String(f.name || '').trim() || url.split('/').pop() || 'PO file';
      var fid = makeId('fil');
      state.files.push({
        id: fid, ownerType: 'po', ownerId: po.id, slot: 'po', name: name, mime: '', size: 0, blobKey: null, inlineDataURL: false,
        uploadedAt: at, uploadedBy: by, url: url, source: f.source || '', driveFileId: null, driveUrl: null, driveFolderId: null
      });
      if (!po.fileId) po.fileId = fid;
      summary.filesAdded += 1;
      changed = true;
      log('po', po.id, 'add-file', 'files', null, url, label + ': linked file ' + name);
    });

    // Lines: match by id, then lineNo, then SKU + qty + unit price. Never delete.
    var stages = poBoardStages(state);
    var used = {};
    var madeSkus = {};
    lines.forEach(function (l, i) {
      var m = resolved[i];
      var sku = m.sku;
      var revision = String(l.revision || m.revision || '').trim();
      var desc = String(l.description || '').trim();
      if (m.create && madeSkus[normalizeSkuCode(m.code)]) sku = madeSkus[normalizeSkuCode(m.code)];
      else if (m.create) {
        var price = num(l.unitPrice);
        sku = blankSku({
          customerId: cust.id, code: m.code, name: desc || m.code, description: desc, revision: revision || 'A',
          sellPrice: price == null ? '' : price, source: { type: 'po', poNumber: poNo }, notes: 'Created from customer ' + label,
          createdAt: at
        });
        state.skus.push(sku);
        madeSkus[normalizeSkuCode(m.code)] = sku;
        summary.skusCreated += 1;
        log('sku', sku.id, 'create', null, null, m.code, 'Created SKU ' + m.code + ' for ' + cust.name + ' from ' + label);
      }
      var qty = num(l.qty), unit = num(l.unitPrice), amount = num(l.amount);
      ['qty', 'unitPrice', 'amount'].forEach(function (k) {
        if (!isBlank(l[k]) && num(l[k]) == null) ignored.push(label + ' line ' + (i + 1) + ' ' + k + ': not a number, ignored');
      });
      if (amount != null && qty != null && unit != null && Math.abs(amount - qty * unit) > 0.01) {
        ignored.push(label + ' line ' + (i + 1) + ': amount ' + amount + ' is not qty x unit price (' + Math.round(qty * unit * 100) / 100 + '), kept as sent');
      }
      var ship = [l.shipDate, l.requiredDate, raw.requiredDate].filter(function (d) { return isIsoDay(d); })[0] || '';
      var lineNo = isBlank(l.lineNo) ? '' : String(l.lineNo).trim();
      function free(x) { return !used[x.id]; }
      var line = null;
      if (l.id) line = po.lines.find(function (x) { return x.id === l.id && free(x); }) || null;
      if (!line && lineNo) line = po.lines.find(function (x) { return String(x.lineNo || '') === lineNo && free(x); }) || null;
      if (!line) {
        line = po.lines.find(function (x) {
          return free(x) && x.skuId === sku.id && num(x.qty) === qty && num(x.unitPrice) === unit && (!lineNo || !x.lineNo);
        }) || null;
      }
      if (!line) {
        var stage = l.stage && stages.indexOf(l.stage) !== -1 ? l.stage : poStageAt(state, 0);
        if (l.stage && stages.indexOf(l.stage) === -1) ignored.push(label + ' line ' + (i + 1) + ': unknown stage ' + l.stage + ', used the first Production stage');
        line = {
          id: makeId('pol'), lineNo: lineNo, skuId: sku.id, description: desc, revision: revision,
          qty: qty == null ? '' : qty, unitPrice: unit == null ? '' : unit, amount: amount == null ? '' : amount, shipDate: ship,
          stage: stage, status: poStatusForStage(state, stage), stageEnteredAt: at, source: PO_SOURCE
        };
        po.lines.push(line);
        used[line.id] = true;
        summary.linesAdded += 1;
        changed = true;
        log('po', po.id, 'add-line', 'lines', null, (sku.code || sku.id) + ' x ' + line.qty, label + ' line added: ' + (sku.code || skuTitleOf(sku)) + ' qty ' + (line.qty === '' ? '?' : line.qty) + (line.unitPrice !== '' ? ' at $' + line.unitPrice : ''));
        pushSkuEvent(state, {
          id: makeId('sev'), skuId: sku.id, at: at, who: by, type: 'po',
          text: 'PO ' + poNo + ' added: qty ' + (line.qty === '' ? '?' : line.qty) + (line.unitPrice !== '' ? ' at $' + line.unitPrice : '') +
            ', $' + poLineAmount(line).toLocaleString('en-US') + (line.shipDate ? ', ship ' + line.shipDate : '')
        });
        return;
      }
      used[line.id] = true;
      var diffs = [];
      function upd(k, v) {
        if (v === '' || v == null) return;
        var old = line[k] == null ? '' : line[k];
        if (typeof v === 'number' ? num(old) === v : String(old) === String(v)) return;
        line[k] = v;
        diffs.push(k);
        log('po', po.id, 'update-line', 'lines.' + k, old === '' ? null : old, v, label + ' line ' + (line.lineNo || (sku.code || '')) + ' ' + k + ': "' + clip(old) + '" to "' + clip(v) + '"');
      }
      if (line.skuId !== sku.id) upd('skuId', sku.id);
      upd('lineNo', lineNo);
      upd('qty', qty);
      upd('unitPrice', unit);
      upd('amount', amount);
      upd('shipDate', ship);
      upd('description', desc);
      upd('revision', revision);
      if (l.stage && l.stage !== line.stage) ignored.push(label + ' line ' + (i + 1) + ': stage not changed on an existing line (move the card on the board)');
      if (diffs.length) {
        summary.linesUpdated += 1;
        changed = true;
        pushSkuEvent(state, {
          id: makeId('sev'), skuId: sku.id, at: at, who: by, type: 'po',
          text: 'PO ' + poNo + ' updated: ' + diffs.join(', ') + ' (qty ' + (line.qty === '' ? '?' : line.qty) + ', $' + poLineAmount(line).toLocaleString('en-US') + ')'
        });
      } else {
        summary.linesUnchanged += 1;
      }
    });
    var untouched = po.lines.filter(function (x) { return !used[x.id]; }).length;
    if (untouched) ignored.push(label + ': ' + untouched + ' existing line(s) not in this upload were kept');

    result.poId = po.id;
    if (created) { summary.created += 1; result.action = 'created'; }
    else if (changed) { summary.updated += 1; result.action = 'updated'; }
    else { summary.unchanged += 1; result.action = 'unchanged'; }
    if (changed || created) {
      po.updatedAt = at;
      po.updatedBy = by;
      if (actedFor) po.actedFor = actedFor;
    }
    return result;
  }

  function skuTitleOf(sku) { return sku.name || sku.code || sku.id; }

  // A list of POs (write API poUpserts, Admin tools Import PO JSON). Mutates state; callers
  // wanting a dry run pass a copy. opts as upsertCustomerPo plus frozen and logCap.
  function applyPoUpserts(state, list, opts) {
    opts = opts || {};
    ensureArrays(state);
    var at = opts.at || nowIso();
    var summary = emptyPoSummary();
    list = Array.isArray(list) ? list : [];
    summary.pos = list.length;
    if (opts.frozen && !opts.isAdmin) { summary.frozen = true; return { summary: summary }; }
    list.forEach(function (raw) {
      upsertCustomerPo(state, raw, Object.assign({}, opts, { at: at, summary: summary, customerId: null, createCustomer: false, createSkus: false }));
    });
    if (summary.pos) {
      state.changeLog.push({
        id: makeId('chg'), at: at, who: String(opts.by || 'unknown').toLowerCase(), by: String(opts.by || 'unknown').toLowerCase(),
        actedFor: opts.actedFor ? String(opts.actedFor).toLowerCase() : null, source: PO_SOURCE, action: 'import',
        entityType: 'state', entityId: null, field: null, oldValue: null, newValue: null, detail: poSummaryLines(summary).join('; ')
      });
    }
    var cap = opts.logCap || ENRICH_LOG_CAP;
    if (state.changeLog.length > cap) state.changeLog = state.changeLog.slice(state.changeLog.length - cap);
    return { summary: summary };
  }

  // Owner applies a po-upsert proposal: picks the customer (or creates it) and may create the
  // missing SKUs. Runs the same upsert as an admin. Returns the result; the proposal is marked
  // applied only when the PO was written.
  function applyPoProposal(state, prop, opts) {
    opts = opts || {};
    if (!prop || prop.action !== 'po-upsert' || prop.status !== 'pending' || !prop.payload || !prop.payload.po) return null;
    var at = opts.at || nowIso();
    var summary = emptyPoSummary();
    var res = upsertCustomerPo(state, prop.payload.po, {
      by: opts.by, actedFor: null, isAdmin: true, at: at, summary: summary,
      customerId: opts.customerId || null, createCustomer: !opts.customerId && !!opts.createCustomer, createSkus: !!opts.createSkus,
      fromProposal: true
    });
    res.summary = summary;
    if (res.action === 'created' || res.action === 'updated' || res.action === 'unchanged') {
      prop.status = 'applied';
      prop.resolvedAt = at;
      prop.resolvedBy = opts.by || 'user';
    } else if (res.proposalId && res.proposalId !== prop.id) {
      // A new proposal was queued for the remaining problem; this one is replaced by it.
      prop.status = 'replaced';
      prop.resolvedAt = at;
      prop.resolvedBy = opts.by || 'user';
    }
    return res;
  }

  function poSummaryLines(s) {
    var out = [];
    if (s.frozen) return ['Bot writes are frozen. Nothing was imported.'];
    out.push(s.pos + ' PO(s): ' + s.created + ' created, ' + s.updated + ' updated, ' + s.unchanged + ' unchanged.');
    out.push('Lines: ' + s.linesAdded + ' added, ' + s.linesUpdated + ' updated, ' + s.linesUnchanged + ' unchanged.');
    if (s.proposals || s.proposalsRefreshed) out.push((s.proposals + s.proposalsRefreshed) + ' PO(s) sent to the proposal queue (customer or SKU not matched).');
    if (s.filesAdded) out.push(s.filesAdded + ' file link(s) added.');
    if (s.customersCreated) out.push(s.customersCreated + ' customer(s) created.');
    if (s.skusCreated) out.push(s.skusCreated + ' SKU(s) created.');
    if (s.skippedStale.length) out.push('Skipped, changed since ifUpdatedAt: ' + s.skippedStale.join(', ') + '.');
    if (s.skippedNoAccess.length) out.push('Skipped, no write access to Customers: ' + s.skippedNoAccess.join(', ') + '.');
    if (s.invalid.length) out.push('Invalid: ' + s.invalid.join('; ') + '.');
    return out;
  }

  // ---------------------------------------------------------------------
  // Lead import (issue #25). A bot or Owner adds new leads, with their contacts and customer,
  // and a stage when needed, without a full import. Add-only: stages are never renamed or
  // removed, existing leads and fields are never changed except for added notes. A lead that
  // is already in the Matrix (same contact email, or contact name plus company) is merged, not
  // duplicated. Anything ambiguous goes to the proposal queue.
  // ---------------------------------------------------------------------
  var LEAD_IMPORT_SOURCE = 'lead-import';
  // Same ids as SOURCE_OPTIONS in app.js.
  var LEAD_SOURCE_IDS = ['referral', 'ai', 'google', 'tradeshow', 'website', 'linkedin', 'cold-outreach', 'partner',
    'existing-customer', 'email', 'other'];
  var LEAD_IMPORT_FIELDS = ['id', 'company', 'title', 'stage', 'source', 'nextFollowUp', 'firstContactAt', 'followUps', 'notes',
    'values', 'priority', 'createdAt', 'description', 'jotformSubmissionId', 'jotformSubmittedAt', 'nextReplyOwner', 'waitingSince', 'leadAlertSentAt'];
  var LEAD_ENTRY_KEYS = ['lead', 'contacts', 'customer', 'priority'];

  // "Direct email (sales@example.com)" is email; a known id stays as is.
  function normalizeLeadSource(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (!s) return '';
    var low = s.toLowerCase();
    if (LEAD_SOURCE_IDS.indexOf(low) !== -1) return low;
    if (/e-?mail|gmail|inbox|sales@/.test(low)) return 'email';
    if (/jotform|web ?form|website|contact form/.test(low)) return 'website';
    if (/referr/.test(low)) return 'referral';
    if (/linkedin/.test(low)) return 'linkedin';
    if (/trade ?show|expo/.test(low)) return 'tradeshow';
    if (/google/.test(low)) return 'google';
    if (/squid/.test(low)) return 'partner';
    if (/cold/.test(low)) return 'cold-outreach';
    if (/existing customer|repeat customer/.test(low)) return 'existing-customer';
    return 'other';
  }

  function sectionGrantKey(sectionId) {
    var id = String(sectionId || '').toLowerCase();
    if (!id) return null;
    if (LEAD_GRANT_KEYS.indexOf(id) !== -1) return id;
    if (id.indexOf('inbound') !== -1) return 'inbound';
    if (id.indexOf('cold') !== -1) return 'cold-leads';
    if (id.indexOf('quote') !== -1) return 'quotes';
    return null;
  }

  function emptyLeadSummary() {
    return {
      leads: 0, added: 0, merged: 0, duplicates: 0, proposals: 0, proposalsRefreshed: 0, skipped: [], stagesAdded: [], stagesRepaired: [], stagesMapped: [],
      skippedLeads: 0, contactsAdded: 0, customersCreated: 0, customersReused: 0, notesAdded: 0, idsReplaced: [], results: [], ignored: [], frozen: false
    };
  }

  // Add-only stages. Repairs a stage that is only partly there (in the section but missing from
  // stages or stageLabels). Never renames, reorders or removes.
  function stageSlug(t) { return String(t || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

  // stageMap collects payload ids that name a stage already on the board under another id
  // (same label): the whole post then uses the existing id.
  function addLeadStages(state, list, opts, summary, log, stageMap) {
    toList(list).forEach(function (s, i) {
      if (!s || typeof s !== 'object') return;
      var id = String(s.id || '').trim();
      var label = String(s.label || '').trim();
      var sec = (state.sections || []).find(function (x) { return x && x.id === s.sectionId; });
      if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) { summary.ignored.push('Stage #' + (i + 1) + ': id must be lowercase letters, digits and dashes'); return; }
      if (!sec) { summary.ignored.push('Stage ' + id + ': no board ' + (s.sectionId || '(none)')); return; }
      // Same label already on this board under another id: use that stage, add nothing.
      if ((state.stages || []).indexOf(id) === -1 && (sec.stages || []).indexOf(id) === -1 && label) {
        var want = label.toLowerCase();
        var same = (sec.stages || []).filter(function (x) {
          var l = state.stageLabels && state.stageLabels[x];
          return l ? String(l).trim().toLowerCase() === want : stageSlug(x) === stageSlug(label);
        })[0];
        if (same) {
          stageMap[id] = same;
          summary.stagesMapped.push(id + ' to ' + same);
          id = same;
        }
      }
      var owner = sectionAreaForStage(state, id).section;
      if (owner && owner.id !== sec.id) { summary.ignored.push('Stage ' + id + ': already on board ' + owner.id + ', left there'); return; }
      if (opts.grantSections && opts.grantSections[sectionGrantKey(sec.id)] !== 'write') { summary.skipped.push('stage ' + id + ' (no write access to ' + sec.id + ')'); return; }
      if (!Array.isArray(state.stages)) state.stages = [];
      if (!state.stageLabels || typeof state.stageLabels !== 'object') state.stageLabels = {};
      if (!Array.isArray(sec.stages)) sec.stages = [];
      var fixed = [];
      if (state.stages.indexOf(id) === -1) {
        var anchor = state.stages.indexOf(s.after);
        if (anchor === -1) {
          var secIdx = sec.stages.map(function (x) { return state.stages.indexOf(x); }).filter(function (x) { return x !== -1; });
          anchor = secIdx.length ? Math.max.apply(null, secIdx) : state.stages.length - 1;
        }
        state.stages.splice(anchor + 1, 0, id);
        fixed.push('stages');
      }
      if (!state.stageLabels[id]) { state.stageLabels[id] = label || id; fixed.push('stageLabels'); }
      if (sec.stages.indexOf(id) === -1) {
        var a = sec.stages.indexOf(s.after);
        sec.stages.splice(a === -1 ? sec.stages.length : a + 1, 0, id);
        fixed.push('board');
      }
      if (!fixed.length) return;
      if (fixed.length === 3) summary.stagesAdded.push(id); else summary.stagesRepaired.push(id);
      log('stage', id, fixed.length === 3 ? 'create' : 'repair', 'stages', null, id,
        (fixed.length === 3 ? 'Added stage ' : 'Repaired stage ') + (state.stageLabels[id] || id) + ' on ' + (sec.label || sec.id) + (fixed.length === 3 ? '' : ' (' + fixed.join(', ') + ')'));
    });
  }

  function leadEntryKey(entry) {
    var emails = toList(entry.contacts).map(function (c) { return String((c && c.email) || '').trim().toLowerCase(); }).filter(Boolean);
    var lead = entry.lead || {};
    return emails[0] || normalizeCompanyName(lead.company || (entry.customer && entry.customer.name)) || String(lead.id || '?');
  }

  function leadNoteList(lead, at, by) {
    return toList(lead.notes).map(function (n) {
      var text = String(typeof n === 'string' ? n : (n && n.text) || '').trim();
      if (!text) return null;
      var id = n && typeof n === 'object' && /^[A-Za-z0-9_-]{1,120}$/.test(String(n.id || '')) ? String(n.id) : '';
      var out = { id: id, text: text, createdAt: (n && n.createdAt) || lead.firstContactAt || at, source: by };
      var tldr = n && typeof n === 'object' ? clampSummary(n.summary) : '';
      if (tldr) out.summary = tldr;
      return out;
    }).filter(Boolean);
  }

  // Leads this entry already is: by contact email, then contact name plus company.
  function findExistingLead(state, entry) {
    var lead = entry.lead || {};
    var company = normalizeCompanyName(lead.company || (entry.customer && entry.customer.name));
    var contacts = [];
    toList(entry.contacts).forEach(function (c) {
      if (!c || typeof c !== 'object') return;
      var e = String(c.email || '').trim().toLowerCase();
      if (e) state.contacts.forEach(function (k) { if (String(k.email || '').trim().toLowerCase() === e && contacts.indexOf(k) === -1) contacts.push(k); });
    });
    var via = 'email';
    if (!contacts.length) {
      via = 'name';
      toList(entry.contacts).forEach(function (c) {
        var n = String((c && c.name) || '').trim().toLowerCase();
        if (!n || !company) return;
        state.contacts.forEach(function (k) {
          var cust = state.customers.find(function (x) { return x.id === k.customerId; });
          if (String(k.name || '').trim().toLowerCase() === n && cust && cust.normalizedName === company && contacts.indexOf(k) === -1) contacts.push(k);
        });
      });
    }
    var ids = contacts.map(function (k) { return k.id; });
    var leads = (state.deals || []).filter(function (d) {
      return d && (d.contactIds || []).some(function (id) { return ids.indexOf(id) !== -1; });
    });
    // A re-post of a lead created by this import keeps its id.
    if (!leads.length && lead.id) {
      var same = (state.deals || []).find(function (d) { return d && d.id === lead.id && normalizeCompanyName(d.company) === company; });
      if (same) { leads = [same]; via = 'id'; }
    }
    // Last guard: a lead for the same company already on the same stage.
    if (!leads.length && company && lead.stage) {
      leads = (state.deals || []).filter(function (d) { return d && d.stage === lead.stage && normalizeCompanyName(d.company) === company; });
      if (leads.length) via = 'company on the same stage';
    }
    var open = leads.filter(function (d) { return isActiveLead(d); });
    return { contacts: contacts, leads: open.length ? open : leads, via: via };
  }

  // Add-only merge into an existing lead: notes (by text and day) and an empty firstContactAt.
  function mergeLeadEntry(state, deal, entry, ctx) {
    var lead = entry.lead || {};
    var changed = false;
    if (!Array.isArray(deal.notes)) deal.notes = [];
    leadNoteList(lead, ctx.at, ctx.by).forEach(function (n) {
      // Already there: same note id (even if reworded), or same text on the same day.
      if (n.id && deal.notes.some(function (x) { return x && x.id === n.id; })) return;
      if (deal.notes.some(function (x) { return x && String(x.text || '').trim() === n.text && dayOf(x.createdAt) === dayOf(n.createdAt); })) return;
      var noteId = n.id && !(state.deals || []).some(function (d) { return (d.notes || []).some(function (x) { return x && x.id === n.id; }); }) ? n.id : makeId('n');
      var added = { id: noteId, text: n.text, createdAt: n.createdAt, source: n.source };
      if (n.summary) added.summary = n.summary;
      deal.notes.push(added);
      ctx.summary.notesAdded += 1;
      ctx.log('lead', deal.id, 'enrich-add', 'notes', null, n.text, 'Added note to ' + (deal.company || deal.id) + ': "' + clip(n.text) + '"');
      changed = true;
    });
    if (isIsoDay(dayOf(lead.firstContactAt)) && isBlank(deal.firstContactAt)) {
      deal.firstContactAt = lead.firstContactAt;
      ctx.log('lead', deal.id, 'enrich', 'firstContactAt', null, lead.firstContactAt, 'Filled firstContactAt on ' + (deal.company || deal.id));
      changed = true;
    }
    var have = (deal.contactIds || []).map(function (id) { return state.contacts.find(function (k) { return k.id === id; }); }).filter(Boolean)
      .map(function (k) { return String(k.email || '').toLowerCase(); });
    toList(entry.contacts).forEach(function (c) {
      var e = String((c && c.email) || '').trim().toLowerCase();
      if (e && have.indexOf(e) === -1) ctx.summary.ignored.push((deal.company || deal.id) + ': contact ' + e + ' is not on the existing lead; a merge adds notes only, add it by hand if needed');
    });
    if (changed) { deal.updatedAt = ctx.at; deal.lastActivityAt = ctx.at; deal.customerActivityAt = ctx.at; }
    return changed;
  }

  function newLeadFromEntry(state, entry, cust, contacts, ctx) {
    var lead = entry.lead || {};
    var stage = String(lead.stage);
    var id = String(lead.id || '').trim();
    if (!id || (state.deals || []).some(function (d) { return d && d.id === id; }) || (state.projects || []).some(function (p) { return p && p.id === id; })) {
      var fresh = makeId('lead');
      if (id) ctx.summary.idsReplaced.push(id + ' to ' + fresh);
      id = fresh;
    }
    var values = { designDfm: 0, prototyping: 0, tooling: 0, productionArr: 0, currentPo: 0, partnerServices: 0 };
    if (lead.values && typeof lead.values === 'object') Object.keys(values).forEach(function (k) { var n = num(lead.values[k]); if (n != null) values[k] = n; });
    var cold = coldStages(state).indexOf(stage) !== -1;
    var origSource = String(lead.source || '').trim();
    var src = normalizeLeadSource(origSource);
    var created = isIsoDay(dayOf(lead.createdAt)) ? lead.createdAt : (isIsoDay(dayOf(lead.firstContactAt)) ? lead.firstContactAt : ctx.at);
    var deal = {
      id: id, company: String(lead.company || cust.name).trim(), title: String(lead.title || lead.company || cust.name).trim(), stage: stage,
      nextFollowUp: !cold && isIsoDay(lead.nextFollowUp) ? lead.nextFollowUp : null,
      createdAt: created, updatedAt: ctx.at, lastActivityAt: ctx.at, pipedriveId: null, values: values, files: emptySlots(),
      source: src, status: 'open', projectIds: [], contactIds: contacts.map(function (k) { return k.id; }),
      primaryContactId: contacts[0] ? contacts[0].id : null, coverFileId: null, customerId: cust.id,
      notes: [], timeline: [{ id: makeId('tl'), type: 'created', text: 'Created by lead import' + (origSource ? ' (' + origSource + ')' : ''), at: ctx.at, source: ctx.by }],
      enrichment: { sources: [LEAD_IMPORT_SOURCE], enrichedAt: ctx.at, enrichedBy: ctx.by, fieldSources: origSource ? { source: [origSource] } : {} }
    };
    if (isIsoDay(dayOf(lead.firstContactAt))) deal.firstContactAt = lead.firstContactAt;
    if (!cold && Array.isArray(lead.followUps)) {
      deal.followUps = lead.followUps.filter(function (f) { return f && typeof f === 'object' && (isIsoDay(f.due) || !isBlank(f.text)); })
        .map(function (f) { return { due: isIsoDay(f.due) ? f.due : '', text: String(f.text || '').trim(), priority: String(f.priority || '').trim() }; });
    }
    var pri = lead.priority || entry.priority;
    if (!isBlank(pri)) deal.priority = String(pri);
    if (!isBlank(lead.description)) deal.description = String(lead.description);
    var replyFields = replyLeadFields(lead, Date.parse(ctx.at));
    if (replyFields) { deal.nextReplyOwner = replyFields.owner; deal.waitingSince = replyFields.since; }
    if (!isBlank(lead.jotformSubmissionId)) deal.jotformSubmissionId = String(lead.jotformSubmissionId);
    if (isIsoDay(dayOf(lead.jotformSubmittedAt))) deal.jotformSubmittedAt = lead.jotformSubmittedAt;
    if (!isBlank(lead.leadAlertSentAt) && !isNaN(Date.parse(String(lead.leadAlertSentAt)))) deal.leadAlertSentAt = String(lead.leadAlertSentAt);
    leadNoteList(lead, ctx.at, ctx.by).forEach(function (n) {
      var taken = !n.id || deal.notes.some(function (x) { return x.id === n.id; }) ||
        (state.deals || []).some(function (d) { return (d.notes || []).some(function (x) { return x && x.id === n.id; }); });
      var noteRec = { id: taken ? makeId('n') : n.id, text: n.text, createdAt: n.createdAt, source: n.source };
      if (n.summary) noteRec.summary = n.summary;
      deal.notes.push(noteRec);
    });
    Object.keys(lead).forEach(function (k) { if (LEAD_IMPORT_FIELDS.indexOf(k) === -1) ctx.summary.ignored.push(deal.company + ': lead key ' + k + ' ignored'); });
    state.deals.push(deal);
    return deal;
  }

  // body: { stagesAdd: [...], leads: [{ lead, contacts, customer, priority }] }. Mutates state; callers
  // wanting a dry run pass a copy. opts: { by, actedFor, isAdmin, at, frozen, grantSections (null = all), logCap,
  // resolve: { index: { target: 'lead:ID' | 'cust:ID' | 'new' } } (from a proposal) }.
  function applyLeadUpserts(state, body, opts) {
    opts = opts || {};
    ensureArrays(state);
    var at = opts.at || nowIso();
    var by = String(opts.by || 'unknown').toLowerCase();
    var actedFor = opts.actedFor ? String(opts.actedFor).toLowerCase() : null;
    var summary = emptyLeadSummary();
    body = Array.isArray(body) ? { leads: body } : (body && typeof body === 'object' ? body : {});
    var entries = toList(body.leads);
    summary.leads = entries.length;
    if (opts.frozen && !opts.isAdmin) { summary.frozen = true; return { summary: summary }; }
    // Reply fields (issue #130): validate every lead first so a bad value writes nothing (400).
    entries.forEach(function (e) { if (e && e.lead && typeof e.lead === 'object') replyLeadFields(e.lead, Date.parse(at)); });
    var grant = opts.isAdmin ? null : (opts.grantSections || null);
    var canWriteCustomers = !grant || grant.customers === 'write';
    function log(entityType, entityId, action, field, oldValue, newValue, detail) {
      state.changeLog.push({
        id: makeId('chg'), at: at, who: by, by: by, actedFor: actedFor, source: LEAD_IMPORT_SOURCE, action: action,
        entityType: entityType, entityId: entityId || null, field: field || null,
        oldValue: oldValue === undefined ? null : oldValue, newValue: newValue === undefined ? null : newValue, detail: detail
      });
    }
    var ctx = { at: at, by: by, summary: summary, log: log };
    Object.keys(body).forEach(function (k) {
      if (['stagesAdd', 'leads', 'actedFor', 'dryRun'].indexOf(k) === -1 && k.charAt(0) !== '_') summary.ignored.push('Unknown key ' + k + ' ignored');
    });
    var stageMap = {};
    addLeadStages(state, body.stagesAdd, { grantSections: grant }, summary, log, stageMap);

    entries.forEach(function (entry, idx) {
      var result = { ref: '', action: '', dealId: null, customerId: null, reasons: [] };
      summary.results.push(result);
      if (!entry || typeof entry !== 'object' || !entry.lead || typeof entry.lead !== 'object') {
        summary.skippedLeads += 1; result.action = 'skipped'; result.ref = '#' + (idx + 1); summary.skipped.push('#' + (idx + 1) + ' (no lead)'); return;
      }
      if (stageMap[entry.lead.stage]) entry = Object.assign({}, entry, { lead: Object.assign({}, entry.lead, { stage: stageMap[entry.lead.stage] }) });
      var lead = entry.lead;
      var label = String(lead.company || (entry.customer && entry.customer.name) || lead.title || lead.id || '#' + (idx + 1)).trim();
      result.ref = (lead.id ? lead.id + ' ' : '') + label;
      Object.keys(entry).forEach(function (k) { if (LEAD_ENTRY_KEYS.indexOf(k) === -1) summary.ignored.push(label + ': key ' + k + ' ignored'); });
      var stage = String(lead.stage || '');
      var info = sectionAreaForStage(state, stage);
      function skip(why) { summary.skippedLeads += 1; result.action = 'skipped'; result.reasons.push(why); summary.skipped.push(label + ' (' + why + ')'); }
      if (!stage || !info.section || (state.stages || []).indexOf(stage) === -1) return skip('stage ' + (stage || '(none)') + ' does not exist');
      if (isProjectAreaId(state, info.area)) return skip('stage ' + stage + ' is not a lead board');
      if (grant && !grantCanWriteLead(state, { stage: stage }, grant)) return skip('no write access to ' + info.section.id);
      if (!canWriteCustomers) return skip('no write access to Customers');
      var choice = opts.resolve && opts.resolve[idx] ? String(opts.resolve[idx].target || '') : '';

      // 1. Already in the Matrix? Merge (notes only) instead of duplicating.
      var found = findExistingLead(state, entry);
      if (choice.indexOf('lead:') === 0) {
        var pick = state.deals.find(function (d) { return d.id === choice.slice(5); });
        if (!pick) return skip('lead ' + choice.slice(5) + ' no longer exists');
        found = { contacts: found.contacts, leads: [pick], via: 'chosen' };
      }
      var reasons = [];
      var leadCands = [];
      if (found.leads.length > 1 && !choice) {
        reasons.push('Matches ' + found.leads.length + ' leads: ' + found.leads.map(function (d) { return d.company || d.id; }).join(', '));
        leadCands = found.leads.map(function (d) { return d.id; });
      } else if (found.leads.length === 1 && (!choice || choice.indexOf('lead:') === 0)) {
        var deal = found.leads[0];
        result.dealId = deal.id; result.customerId = deal.customerId || null;
        if (mergeLeadEntry(state, deal, entry, ctx)) { summary.merged += 1; result.action = 'merged'; }
        else { summary.duplicates += 1; result.action = 'duplicate'; }
        result.reasons.push('already in the Matrix (' + (deal.company || deal.id) + ', matched by ' + found.via + ')');
        return;
      }

      // 2. Customer: the contact's customer, or by name, aka or email domain.
      var cust = null;
      var custCands = [];
      if (!reasons.length) {
        if (choice.indexOf('cust:') === 0) {
          cust = state.customers.find(function (c) { return c.id === choice.slice(5); }) || null;
          if (!cust) return skip('customer ' + choice.slice(5) + ' no longer exists');
        } else if (choice !== 'new') {
          var viaContact = found.contacts.map(function (k) { return k.customerId; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
          if (viaContact.length === 1) cust = state.customers.find(function (c) { return c.id === viaContact[0]; }) || null;
          else if (viaContact.length > 1) { custCands = viaContact; reasons.push('Its contacts belong to ' + viaContact.length + ' customers'); }
          if (!cust && !reasons.length) {
            var spec = Object.assign({}, entry.customer || {});
            if (!spec.name) spec.name = lead.company;
            var emails = toList(entry.contacts).map(function (c) { return c && c.email; }).filter(Boolean);
            spec.emails = toList(spec.emails).concat(emails);
            var m = matchPoCustomer(state, { customer: spec });
            if (m.customer) cust = m.customer;
            else if (m.candidates.length) { custCands = m.candidates; reasons.push(m.reason); }
          }
        }
      }

      if (reasons.length) {
        var key = leadEntryKey(entry);
        var pending = state.proposals.find(function (p) { return p.status === 'pending' && p.action === 'lead-upsert' && p.payload && p.payload.key === key; });
        var text = 'New lead ' + label + ': ' + reasons.join('; ');
        if (pending) {
          pending.payload.entry = JSON.parse(JSON.stringify(entry));
          pending.payload.reasons = reasons; pending.payload.customerCandidates = custCands; pending.payload.leadCandidates = leadCands;
          pending.summary = text; pending.updatedAt = at;
          summary.proposalsRefreshed += 1; result.action = 'proposal-refreshed'; result.proposalId = pending.id;
        } else {
          var prop = {
            id: makeId('prp'), at: at, bot: by, actedFor: actedFor, source: LEAD_IMPORT_SOURCE, action: 'lead-upsert', entityType: 'lead', entityId: null,
            payload: { key: key, entry: JSON.parse(JSON.stringify(entry)), reasons: reasons, customerCandidates: custCands, leadCandidates: leadCands },
            summary: text, status: 'pending', resolvedAt: null, resolvedBy: null
          };
          state.proposals.push(prop);
          summary.proposals += 1; result.action = 'proposal'; result.proposalId = prop.id;
          log('lead', null, 'proposal', null, null, label, 'Sent ' + text + ' to proposals');
        }
        result.reasons = reasons;
        return;
      }

      // 3. Create: customer (if new), contacts (dedupe by email), then the lead.
      if (!cust) {
        var made = findOrCreateCustomer(state, (entry.customer && entry.customer.name) || lead.company, LEAD_IMPORT_SOURCE, at);
        cust = made.customer;
        if (made.created) {
          var cs = entry.customer || {};
          if (!isBlank(cs.website)) cust.website = String(cs.website).trim();
          var aka = toList(cs.aka).map(function (a) { return String(a).trim(); }).filter(Boolean);
          if (aka.length) cust.aka = aka;
          summary.customersCreated += 1;
          log('customer', cust.id, 'create', null, null, cust.name, 'Created customer ' + cust.name + ' from lead import');
        } else summary.customersReused += 1;
      } else summary.customersReused += 1;
      var linked = [];
      var seen = [];
      toList(entry.contacts).forEach(function (c) {
        if (!c || typeof c !== 'object') return;
        var e = String(c.email || '').trim().toLowerCase();
        var n = String(c.name || '').trim();
        if (!e && !n) return;
        if (e && seen.indexOf(e) !== -1) return;
        if (e) seen.push(e);
        var k = findContact(state, cust.id, e, e ? '' : n);
        if (!k && e) k = found.contacts.find(function (x) { return String(x.email || '').toLowerCase() === e; }) || null;
        if (!k) {
          k = createContact(state, cust.id, { name: n, email: String(c.email || '').trim(), phone: c.phone, role: c.role, notes: c.notes }, at);
          summary.contactsAdded += 1;
          log('contact', k.id, 'create', null, null, k.name + (k.email ? ' <' + k.email + '>' : ''), 'Added contact ' + k.name + ' on ' + cust.name);
        }
        if (linked.indexOf(k) === -1) linked.push(k);
      });
      var dealNew = newLeadFromEntry(state, entry, cust, linked, ctx);
      summary.added += 1;
      result.action = 'added'; result.dealId = dealNew.id; result.customerId = cust.id;
      log('lead', dealNew.id, 'create', null, null, dealNew.company, 'Added lead ' + dealNew.company + ' in ' + (state.stageLabels[stage] || stage));
    });

    if (summary.leads || summary.stagesAdded.length || summary.stagesRepaired.length) {
      state.changeLog.push({
        id: makeId('chg'), at: at, who: by, by: by, actedFor: actedFor, source: LEAD_IMPORT_SOURCE, action: 'import',
        entityType: 'state', entityId: null, field: null, oldValue: null, newValue: null, detail: leadSummaryLines(summary).join('; ')
      });
    }
    var cap = opts.logCap || ENRICH_LOG_CAP;
    if (state.changeLog.length > cap) state.changeLog = state.changeLog.slice(state.changeLog.length - cap);
    return { summary: summary };
  }

  // Owner applies a lead-upsert proposal: target 'lead:ID' (add notes to that lead), 'cust:ID'
  // (new lead for that customer) or 'new' (new customer). Admin only in the app.
  function applyLeadProposal(state, prop, opts) {
    opts = opts || {};
    if (!prop || prop.action !== 'lead-upsert' || prop.status !== 'pending' || !prop.payload || !prop.payload.entry) return null;
    var at = opts.at || nowIso();
    var res = applyLeadUpserts(state, { leads: [prop.payload.entry] }, {
      by: opts.by, isAdmin: true, at: at, logCap: opts.logCap, resolve: { 0: { target: opts.target || '' } }
    });
    var r = res.summary.results[0] || {};
    if (['added', 'merged', 'duplicate'].indexOf(r.action) !== -1) {
      prop.status = 'applied'; prop.resolvedAt = at; prop.resolvedBy = opts.by || 'user';
    }
    r.summary = res.summary;
    return r;
  }

  function leadSummaryLines(s) {
    if (s.frozen) return ['Bot writes are frozen. Nothing was imported.'];
    var out = [];
    if (s.stagesAdded.length) out.push('Stages added: ' + s.stagesAdded.join(', ') + '.');
    if (s.stagesRepaired.length) out.push('Stages repaired: ' + s.stagesRepaired.join(', ') + '.');
    if (s.stagesMapped.length) out.push('Stages mapped: ' + s.stagesMapped.join(', ') + '.');
    out.push(s.leads + ' lead(s): ' + s.added + ' added, ' + s.merged + ' merged, ' + s.duplicates + ' already there, ' +
      (s.proposals + s.proposalsRefreshed) + ' sent to proposals, ' + s.skippedLeads + ' skipped.');
    if (s.customersCreated || s.contactsAdded) out.push(s.customersCreated + ' customer(s) and ' + s.contactsAdded + ' contact(s) created.');
    if (s.notesAdded) out.push(s.notesAdded + ' note(s) added to existing leads.');
    if (s.idsReplaced.length) out.push('Ids already taken, new ids given: ' + s.idsReplaced.join(', ') + '.');
    if (s.skipped.length) out.push('Skipped: ' + s.skipped.join('; ') + '.');
    return out;
  }

  // ---------------------------------------------------------------------
  // Readable notes (issue #21). Display only: parses a stored note into a card shape and never
  // changes the note. Kinds: pipedrive-import, jotform, bot (has a source), plain.
  // ---------------------------------------------------------------------
  var NOTE_EMAIL_RE = /^[^\s@<>"'`]+@[^\s@<>"'`]+\.[a-z]{2,}$/i;
  var JOTFORM_DUMP_LABELS = ['Company & Project Info', 'Full Name', 'Email Address', 'Contact Number', 'Estimated Yearly Quantity', 'Estimated Yearly'];

  function noteEmpty(v) {
    var t = String(v == null ? '' : v).trim();
    return !t || /^(n\/?a|none|-+)$/i.test(t);
  }

  function notePhone(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
    if (d.length === 10) return { text: '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6), tel: d };
    if (d.length >= 7) return { text: String(v).trim(), tel: d };
    return null;
  }

  function noteSourceLabel(src) {
    var s = String(src || '').trim();
    if (!s) return '';
    var low = s.toLowerCase();
    var known = { gmail: 'Gmail', jotform: 'Jotform', pipedrive: 'Pipedrive', 'lead-import': 'Lead import', enrichment: 'Enrichment' };
    if (known[low]) return known[low];
    if (low.indexOf('@') !== -1) { var n = low.split('@')[0]; return n.charAt(0).toUpperCase() + n.slice(1); }
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // "Full Name A Email Address b@c.d Contact Number (1) Estimated Yearly" into a label map.
  function parseJotformDump(text) {
    var out = {};
    var t = ' ' + String(text || '').replace(/^\s*Let Us Make Your Stuff\s*/i, '') + ' ';
    var hits = [];
    JOTFORM_DUMP_LABELS.forEach(function (label) {
      var re = new RegExp('(^|\\s)' + label.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&') + '(?=\\s)', 'gi');
      var m;
      while ((m = re.exec(t))) {
        var at = m.index + m[1].length;
        if (!hits.some(function (h) { return at >= h.at && at < h.at + h.label.length; })) hits.push({ at: at, label: label });
      }
    });
    hits.sort(function (a, b) { return a.at - b.at; });
    hits.forEach(function (h, i) {
      var end = i + 1 < hits.length ? hits[i + 1].at : t.length;
      var v = t.slice(h.at + h.label.length, end).trim();
      if (!(h.label in out) || noteEmpty(out[h.label])) out[h.label] = v;
    });
    return out;
  }

  function formatNote(note) {
    var n = note && typeof note === 'object' ? note : { text: note };
    var raw = typeof n.text === 'string' ? n.text : (n.text == null ? '' : String(n.text));
    var out = { kind: 'plain', title: '', date: n.createdAt || '', source: noteSourceLabel(n.source), fields: [], body: raw, raw: raw };
    function field(label, value, type) {
      if (noteEmpty(value)) return;
      var v = String(value).replace(/\s+/g, ' ').trim();
      if (type === 'email') {
        if (!NOTE_EMAIL_RE.test(v)) type = 'text'; else v = v.toLowerCase();
      }
      if (type === 'phone') {
        var ph = notePhone(v);
        if (!ph) return;
        out.fields.push({ label: label, value: ph.text, type: 'phone', href: 'tel:' + ph.tel });
        return;
      }
      if (out.fields.some(function (f) { return f.label === label; })) return;
      var f = { label: label, value: v, type: type || 'text' };
      if (f.type === 'email') f.href = 'mailto:' + v;
      out.fields.push(f);
    }

    var pd = raw.match(/Imported from Pipedrive deal #(\d+)\.?/);
    if (pd) {
      out.kind = 'pipedrive-import';
      var after = raw.slice(pd.index + pd[0].length);
      var stage = (after.match(/Original stage:\s*(.*?)\.\s*(?=Status:|Owner:|\n|$)/) || [])[1] || '';
      var status = (after.match(/Status:\s*([^.\n]*)/) || [])[1] || '';
      out.title = ['Imported from Pipedrive #' + pd[1], stage.trim(), status.trim()].filter(Boolean).join(' · ');
      var lead = raw.slice(0, pd.index);
      var labelRe = /(^|\n|\s)([A-Z][A-Za-z ]{1,30}):\s*/g;
      var marks = [], m;
      while ((m = labelRe.exec(lead))) marks.push({ at: m.index + m[1].length, label: m[2].trim(), start: m.index + m[0].length });
      marks.forEach(function (mk, i) {
        var end = i + 1 < marks.length ? marks[i + 1].at : lead.length;
        field(mk.label, lead.slice(mk.start, end));
      });
      if (!marks.length && lead.trim()) field('Note', lead);
      var tail = after.replace(/Original stage:\s*.*?\.\s*(?=Status:|Owner:|\n|$)/, '').replace(/Status:\s*[^.\n]*\.?/, '').replace(/Owner:\s*[^\n]*/, '').trim();
      if (tail) field('Note', tail);
      out.body = '';
      return out;
    }

    if (/^\s*\[jotform\]/i.test(raw)) {
      out.kind = 'jotform';
      out.title = 'Jotform submission';
      var iso = raw.match(/\((\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\)/);
      if (iso) out.date = iso[1];
      var lines = {};
      var text = raw;
      // Flattened copies (one line) split on the form's own labels.
      if ((text.match(/\n/g) || []).length < 3) text = text.replace(/\s+(?=(?:Thread|Name|Company|Email|Phone|Need|Qty|Project):)/g, '\n');
      text.split(/\r?\n/).slice(1).forEach(function (line) {
        var mm = line.match(/^\s*([A-Za-z][A-Za-z &/]{0,40}?):\s*(.*)$/);
        if (mm) lines[mm[1].trim().toLowerCase()] = mm[2].trim();
      });
      var dump = parseJotformDump(lines.project || '');
      var projectIsDump = !!Object.keys(dump).length;
      var company = String(lines.company || '').replace(/^&\s*Project Info\s*/i, '');
      if (noteEmpty(company)) company = dump['Company & Project Info'] || '';
      company = company.replace(/^(n\/?a)\s+/i, '');
      field('Name', noteEmpty(lines.name) ? dump['Full Name'] : lines.name);
      field('Company / project', company);
      var email = !noteEmpty(lines.email) && NOTE_EMAIL_RE.test(lines.email.trim()) ? lines.email : dump['Email Address'];
      field('Email', email, 'email');
      var p1 = notePhone(lines.phone), p2 = notePhone(dump['Contact Number']);
      var phone = p1 && p2 ? (p2.tel.length > p1.tel.length ? dump['Contact Number'] : lines.phone) : (p1 ? lines.phone : dump['Contact Number']);
      field('Phone', phone, 'phone');
      field('Need', lines.need);
      if (!projectIsDump) field('Project', lines.project);
      field('Qty', lines.qty);
      field('Estimated yearly', dump['Estimated Yearly Quantity'] || dump['Estimated Yearly'] || lines['estimated yearly']);
      Object.keys(lines).forEach(function (k) {
        if (['thread', 'name', 'company', 'email', 'phone', 'need', 'qty', 'project', 'estimated yearly'].indexOf(k) !== -1) return;
        field(k.charAt(0).toUpperCase() + k.slice(1), lines[k]);
      });
      out.body = '';
      if (!out.source) out.source = 'Jotform';
      return out;
    }

    if (out.source) {
      out.kind = 'bot';
      out.body = raw.replace(/^\s*\[[a-z0-9 _-]+\]\s*/i, '');
    }
    return out;
  }

  // "Feb 18, 2026, 4:17 PM" (no seconds). timeZone is optional (tests pass UTC).
  function formatNoteDate(iso, timeZone) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    var o = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };
    if (timeZone) o.timeZone = timeZone;
    return d.toLocaleString('en-US', o);
  }

  // ---------------------------------------------------------------------
  // Live Jotform intake (issue #11). The jotformIntake Function turns one webhook submission
  // into a leadUpserts entry and writes it with applyLeadUpserts (dedupe, audit, no deletes).
  // Field names differ per form, so they live in one map: exact Jotform keys first ("q3_fullName"),
  // then patterns on the key without its "qN_" prefix. Edit JOTFORM_FIELD_MAP.byKey when the
  // form changes (README: Live Jotform intake).
  // ---------------------------------------------------------------------
  var JOTFORM_FIELD_MAP = {
    byKey: {},
    patterns: [
      ['project', /company.*project|project.*company/i], // "Company & Project Info" is one box on the form
      ['email', /e-?mail/i],
      ['phone', /phone|contact_?number|mobile/i],
      ['yearly', /year|annual/i],
      ['company', /company|business|organi[sz]ation/i],
      ['name', /(^|_)(full_?name|your_?name|name)$/i],
      ['qty', /qty|quantity/i],
      ['need', /need|service|interest/i],
      ['heard', /hear|referr|found_?us|how_?did/i],
      ['project', /project|describe|description|message|details|idea|product/i]
    ]
  };
  var JOTFORM_STAGE = 'inbound-jotform';
  var JOTFORM_EMAIL_RE = /^[^\s@<>"'`]+@[^\s@<>"'`]+\.[a-z]{2,}$/i;
  function jotformTime(v) { var t = v == null || v === '' ? NaN : Date.parse(String(v)); return isNaN(t) ? null : t; }

  function jotformValue(v) {
    if (v == null) return '';
    if (Array.isArray(v)) return v.map(jotformValue).filter(Boolean).join(', ');
    if (typeof v === 'object') {
      if (v.full) return String(v.full).trim();
      if (v.first || v.last) return [v.prefix, v.first, v.middle, v.last, v.suffix].filter(function (x) { return !isBlank(x); }).join(' ').trim();
      if (v.area || v.phone) return [v.area, v.phone].filter(function (x) { return !isBlank(x); }).join(' ').trim();
      return Object.keys(v).map(function (k) { return jotformValue(v[k]); }).filter(Boolean).join(' ').trim();
    }
    return String(v).trim();
  }

  // { name, email, phone, company, project, need, qty, yearly, heard } from the parsed rawRequest.
  function jotformMappedFields(answers, map) {
    map = map || JOTFORM_FIELD_MAP;
    var f = {};
    Object.keys(answers || {}).forEach(function (key) {
      var target = map.byKey && map.byKey[key];
      if (!target) {
        if (!/^q\d+_/.test(key)) return; // Jotform system keys (slug, event_id, ...)
        var bare = key.replace(/^q\d+_/, '');
        for (var i = 0; i < map.patterns.length && !target; i++) if (map.patterns[i][1].test(bare)) target = map.patterns[i][0];
      }
      var v = jotformValue(answers[key]);
      if (target && v && !f[target]) f[target] = v;
    });
    return f;
  }

  // submission: { submissionID, formID, createdAt?, answers: { q3_fullName: {...}, ... } } (the parsed rawRequest).
  // Returns { entry, fields } or { error }.
  function jotformToLeadEntry(submission, map, at) {
    map = map || JOTFORM_FIELD_MAP;
    var sub = submission && typeof submission === 'object' ? submission : {};
    var id = String(sub.submissionID || sub.submission_id || (sub.answers && (sub.answers.submissionID || sub.answers.event_id)) || '').trim();
    if (!/^[A-Za-z0-9_-]{4,64}$/.test(id)) return { error: 'submission id missing or invalid' };
    var answers = sub.answers && typeof sub.answers === 'object' ? sub.answers : {};
    var f = jotformMappedFields(answers, map);
    var submittedAt = jotformTime(sub.createdAt) != null ? new Date(jotformTime(sub.createdAt)).toISOString() : (at || nowIso());
    var email = f.email && JOTFORM_EMAIL_RE.test(f.email) ? f.email.toLowerCase() : '';
    var who = f.name || email || 'Jotform submission';
    var company = f.company || f.name || email || 'Jotform ' + id;
    var lines = ['[jotform] Jotform submission (' + submittedAt.replace(/\.\d{3}Z$/, 'Z') + ')', 'Submission: ' + id];
    [['Name', f.name], ['Company', f.company], ['Email', email || f.email], ['Phone', f.phone], ['Need', f.need], ['Qty', f.qty],
      ['Estimated yearly', f.yearly], ['Heard about us', f.heard], ['Project', f.project]].forEach(function (x) { if (x[1]) lines.push(x[0] + ': ' + x[1]); });
    var entry = {
      lead: {
        id: 'jf-' + id, company: company, title: company, stage: JOTFORM_STAGE, source: 'Jotform website form',
        createdAt: submittedAt, firstContactAt: submittedAt, jotformSubmissionId: id, jotformSubmittedAt: submittedAt,
        notes: [{ text: lines.join('\n'), createdAt: submittedAt }]
      },
      contacts: (f.name || email || f.phone) ? [{ name: who, email: email, phone: f.phone || '', role: '' }] : [],
      customer: { name: company }
    };
    return { entry: entry, fields: f };
  }

  // ---------------------------------------------------------------------
  // New lead alert (issue #48). The jotformIntake Function POSTs this payload to the sales bot
  // webhook once, after a brand-new lead is saved. Pure: no I/O. rawRequest is the parsed Jotform
  // answers; it may also carry submissionID and formID.
  // ---------------------------------------------------------------------
  var LEAD_ALERT_URL_BASE = 'https://YOUR-PROJECT-ID.web.app';
  var JOTFORM_INTERNAL_KEYS = ['event_id', 'timeToSubmit', 'jsExecutionTracker', 'validatedNewRequiredFieldIDs', 'validatedRequiredFieldIDs',
    'slug', 'path', 'submitSource', 'buildDate', 'uploadServerUrl', 'pretty', 'rawRequest', 'submissionID', 'submission_id',
    'formID', 'formId', 'ip', 'type', 'username', 'unread', 'status', 'preview', 'draft_id'];

  function jotformLabel(key) {
    var bare = String(key).replace(/^q\d+_/, '').replace(/_+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim();
    return bare ? bare.charAt(0).toUpperCase() + bare.slice(1) : String(key);
  }

  // Every answer in question order, then any other key, then submissionId and formId. Values are whole.
  function leadAlertForm(raw) {
    var rows = [];
    Object.keys(raw).forEach(function (key, idx) {
      if (JOTFORM_INTERNAL_KEYS.indexOf(key) !== -1) return;
      var v = typeof raw[key] === 'string' ? raw[key] : jotformValue(raw[key]);
      if (!String(v).trim()) return;
      var m = /^q(\d+)_/.exec(key);
      rows.push({ n: m ? parseInt(m[1], 10) : Infinity, idx: idx, row: { key: key, label: jotformLabel(key), value: v } });
    });
    rows.sort(function (a, b) { return a.n === b.n ? a.idx - b.idx : (a.n < b.n ? -1 : 1); });
    var form = rows.map(function (r) { return r.row; });
    var sid = raw.submissionID || raw.submission_id;
    if (sid) form.push({ key: 'submissionId', label: 'Submission ID', value: String(sid) });
    var fid = raw.formID || raw.formId;
    if (fid) form.push({ key: 'formId', label: 'Form ID', value: String(fid) });
    return form;
  }

  function leadAlertPayload(lead, contact, customer, rawRequest) {
    lead = lead || {};
    contact = contact || {};
    customer = customer || {};
    var raw = rawRequest && typeof rawRequest === 'object' ? rawRequest : {};
    var f = jotformMappedFields(raw);
    var need = [f.project, f.need].filter(function (t, i, a) { return t && a.indexOf(t) === i; }).join('\n\n');
    return {
      event: 'lead.created',
      leadId: lead.id || '',
      name: contact.name || f.name || '',
      company: customer.name || lead.company || f.company || '',
      email: contact.email || f.email || '',
      phone: contact.phone || f.phone || '',
      need: need,
      qty: f.qty || f.yearly || '',
      source: lead.source || '',
      stage: lead.stage || '',
      submittedAt: lead.jotformSubmittedAt || lead.createdAt || '',
      createdAt: lead.createdAt || '',
      matrixUrl: LEAD_ALERT_URL_BASE + '/#lead=' + encodeURIComponent(lead.id || ''),
      form: leadAlertForm(raw)
    };
  }

  // ---------------------------------------------------------------------
  // Inbound (Jotform) column order (issue #10): newest submission first, computed on render,
  // never saved. The submission date is a dedicated field if a card has one, else the
  // timestamp in its "[jotform] Jotform submission (...)" note, else createdAt.
  // ---------------------------------------------------------------------
  var INBOUND_SORT_STAGE = 'inbound-jotform';

  function validIso(v) {
    if (v == null || v === '') return null;
    var t = Date.parse(String(v));
    return isNaN(t) ? null : t;
  }

  // Milliseconds of the submission, or null when the card has no usable date.
  function inboundSortDate(card) {
    if (!card) return null;
    var keys = ['jotformSubmittedAt', 'submittedAt', 'submissionDate'];
    for (var i = 0; i < keys.length; i++) { var t = validIso(card[keys[i]]); if (t != null) return t; }
    var best = null;
    (card.notes || []).forEach(function (n) {
      var m = n && typeof n.text === 'string' && n.text.match(/^\s*\[jotform\][^(\n]*\((\d{4}-\d{2}-\d{2}T[^)\s]+)\)/i);
      var t = m ? validIso(m[1]) : null;
      if (t != null && (best == null || t < best)) best = t; // the first submission, not a later resend
    });
    if (best != null) return best;
    return validIso(card.createdAt);
  }

  // Newest first; no date last; ties by createdAt desc, then title.
  function compareInboundNewestFirst(a, b) {
    var da = inboundSortDate(a), db = inboundSortDate(b);
    if (da == null && db != null) return 1;
    if (db == null && da != null) return -1;
    if (da != null && db != null && da !== db) return db - da;
    var ca = validIso(a && a.createdAt), cb = validIso(b && b.createdAt);
    if (ca != null && cb != null && ca !== cb) return cb - ca;
    if ((ca == null) !== (cb == null)) return ca == null ? 1 : -1;
    return String((a && (a.title || a.company)) || '').localeCompare(String((b && (b.title || b.company)) || ''));
  }

  // ---------------------------------------------------------------------
  // Meeting notes (issue #19). Google Meet Gemini takeaways on leads and customers:
  // meetingNotes[] = { id, meetingAt, title, source, body, actionItems[{ id, text, done, taskId }],
  // importedAt, rawRef }. Stored only once there is a note. Import is idempotent (external id, else
  // meeting time to the minute plus title); re-import only adds action items or fills empty fields.
  // Nothing is deleted. Action items become Matrix tasks linked by taskId, once.
  // ---------------------------------------------------------------------
  var MEETING_SOURCE = 'meeting-import';

  function shortHash(str) {
    var h = 5381;
    str = String(str);
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  function meetingKey(n) {
    if (n.rawRef) return 'ref:' + String(n.rawRef).trim();
    return String(n.meetingAt || '').slice(0, 16) + '|' + String(n.title || '').trim().toLowerCase();
  }

  // Structured call notes (issue #94). Optional fields on a note, stored only when sent:
  // persons[{ name, email }], topics[], commitmentsOwner[{ text, due }], commitmentsOther[{ text, who, due }],
  // nextAction { text, owner, due }, transcriptUrl (the Gemini Drive Doc). Call time is meetingAt; a time
  // sent without Z or an offset is read as Pacific (America/Los_Angeles).
  var MEETING_TZ = 'America/Los_Angeles';
  var CALL_NOTE_FIELDS = [['persons', 'persons'], ['topics', 'topics'], ['commitmentsOwner', 'commitments by Owner'],
    ['commitmentsOther', 'commitments by them'], ['nextAction', 'next action'], ['transcriptUrl', 'transcript link']];

  // Minutes east of UTC for tz at the instant t (PDT is -420).
  function tzOffsetMinutes(t, tz) {
    var p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(t)).forEach(function (x) { p[x.type] = x.value; });
    return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - t) / 60000);
  }

  // Epoch ms for a call time. With Z or an offset it is taken as is; a wall time is Pacific.
  function parseCallTime(v) {
    var s = String(v == null ? '' : v).trim();
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/.exec(s);
    if (!m) return s ? Date.parse(s) : NaN;
    var wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    try {
      var off = tzOffsetMinutes(wall, MEETING_TZ);
      var t = wall - off * 60000;
      var off2 = tzOffsetMinutes(t, MEETING_TZ);
      return off2 === off ? t : wall - off2 * 60000;
    } catch (e) { return wall; }
  }

  // "Oct 6, 2026, 10:00 AM PT".
  function callTimePacific(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso || '');
    try {
      return d.toLocaleString('en-US', { timeZone: MEETING_TZ, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' PT';
    } catch (e) { return d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'; }
  }

  function pickField(raw, keys) {
    for (var i = 0; i < keys.length; i++) if (raw[keys[i]] != null && raw[keys[i]] !== '') return raw[keys[i]];
    return null;
  }

  function cleanText(v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }

  function hasText(list, text) {
    return list.some(function (x) { return String(typeof x === 'string' ? x : x.text).toLowerCase() === text.toLowerCase(); });
  }

  // Strings or { text, who, owner, due } objects into [{ text, who?, due? }], deduped by text.
  function commitmentList(v, withWho) {
    var out = [];
    toList(v).forEach(function (x) {
      var o = x && typeof x === 'object' ? x : { text: x };
      var text = cleanText(o.text || o.commitment || o.item);
      if (!text || hasText(out, text)) return;
      var c = { text: text };
      var who = cleanText(o.who || o.owner || o.by || o.name);
      if (withWho && who) c.who = who;
      if (isIsoDay(String(o.due || '').slice(0, 10))) c.due = String(o.due).slice(0, 10);
      out.push(c);
    });
    return out;
  }

  function topicList(v) {
    var out = [];
    toList(v).forEach(function (x) {
      var t = cleanText(x && typeof x === 'object' ? (x.text || x.topic || x.title) : x);
      if (t && !hasText(out, t)) out.push(t);
    });
    return out;
  }

  // "Name <a@b.com>", "a@b.com", "Name" or { name, email }.
  function personList(v) {
    var out = [];
    toList(v).forEach(function (x) {
      var name = '', email = '';
      if (x && typeof x === 'object') { name = cleanText(x.name || x.displayName); email = cleanText(x.email); }
      else {
        var s = cleanText(x), m = /^(.*?)\s*<([^>]+)>$/.exec(s);
        if (m) { name = m[1].replace(/^"|"$/g, ''); email = m[2]; } else if (/^[^\s@]+@[^\s@]+$/.test(s)) email = s; else name = s;
      }
      email = email.toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) email = '';
      if (!name && !email) return;
      if (out.some(function (p) { return (email && p.email === email) || (!email && name && p.name && p.name.toLowerCase() === name.toLowerCase()); })) return;
      var p = {};
      if (name) p.name = name;
      if (email) p.email = email;
      out.push(p);
    });
    return out;
  }

  function nextActionOf(v) {
    if (v == null || v === '') return null;
    var o = typeof v === 'object' ? v : { text: v };
    var text = cleanText(o.text || o.action || o.title);
    if (!text) return null;
    var n = { text: text };
    var owner = cleanText(o.owner || o.who || o.assignee);
    if (owner) n.owner = owner;
    if (isIsoDay(String(o.due || '').slice(0, 10))) n.due = String(o.due).slice(0, 10);
    return n;
  }

  // Labels of the #94 fields a note does not have yet (for the import report and the UI).
  function callNoteMissing(n) {
    var out = [];
    CALL_NOTE_FIELDS.forEach(function (f) {
      var v = n[f[0]];
      if (isBlank(v)) out.push(f[1]);
      else if (f[0] === 'nextAction' && !v.owner) out.push('next action owner');
    });
    return out;
  }

  function normalizeMeetingNote(raw, at) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var t = parseCallTime(pickField(raw, ['meetingAt', 'callTime', 'call_time', 'startTime', 'start', 'at', 'date']));
    if (isNaN(t)) return { error: 'meetingAt missing or not a date' };
    var meetingAt = new Date(t).toISOString();
    var title = String(raw.title || '').trim();
    var body = String(raw.body || raw.summary || raw.notes || '').trim();
    var rawRef = String(raw.id || raw.externalId || raw.rawRef || '').trim();
    var note = { meetingAt: meetingAt, title: title, source: 'gemini-meet', body: body, actionItems: [], importedAt: at, rawRef: rawRef || null };
    note.id = 'mtg_' + shortHash(meetingKey(note));
    toList(raw.actionItems || raw.action_items).forEach(function (ai) {
      var text = String(typeof ai === 'string' ? ai : (ai && ai.text) || '').trim();
      if (!text || note.actionItems.some(function (x) { return x.text.toLowerCase() === text.toLowerCase(); })) return;
      note.actionItems.push({ id: 'ai_' + shortHash(note.id + '|' + text.toLowerCase()), text: text, done: !!(ai && ai.done), taskId: null });
    });
    var warnings = [];
    var persons = personList(pickField(raw, ['persons', 'people', 'attendees', 'participants']));
    var topics = topicList(pickField(raw, ['topics', 'topicsDiscussed', 'topics_discussed']));
    var mine = commitmentList(pickField(raw, ['commitmentsOwner', 'commitments_owner', 'ownerCommitments', 'commitmentsOurs', 'ourCommitments']), false);
    var theirs = commitmentList(pickField(raw, ['commitmentsOther', 'commitments_other', 'otherCommitments', 'commitmentsTheirs', 'theirCommitments']), true);
    var next = nextActionOf(pickField(raw, ['nextAction', 'next_action', 'nextStep']));
    var url = cleanText(pickField(raw, ['transcriptUrl', 'transcript_url', 'transcriptLink', 'transcript', 'geminiDocUrl', 'docUrl']));
    if (url && !/^https:\/\/\S+$/i.test(url)) { warnings.push('transcript link is not an https link'); url = ''; }
    if (persons.length) note.persons = persons;
    if (topics.length) note.topics = topics;
    if (mine.length) note.commitmentsOwner = mine;
    if (theirs.length) note.commitmentsOther = theirs;
    if (next) note.nextAction = next;
    if (url) note.transcriptUrl = url;
    var structured = persons.length || topics.length || mine.length || theirs.length || next || url;
    if (!body && !note.actionItems.length && !title && !structured) return { error: 'empty note' };
    return { note: note, warnings: warnings };
  }

  function meetingNotesNewestFirst(rec) {
    return ((rec && rec.meetingNotes) || []).slice().sort(function (a, b) { return String(b.meetingAt).localeCompare(String(a.meetingAt)); });
  }

  function timeTitleKey(n) {
    return String(n.meetingAt || '').slice(0, 16) + '|' + String(n.title || '').trim().toLowerCase();
  }

  // Add or merge one note on a record. Returns 'added' | 'updated' | 'unchanged'.
  // A re-import only fills empty fields and adds list items it does not have; nothing is replaced.
  function upsertMeetingNote(state, rec, entityType, note, o) {
    if (!Array.isArray(rec.meetingNotes)) rec.meetingNotes = [];
    var key = meetingKey(note), tt = timeTitleKey(note);
    var have = rec.meetingNotes.find(function (n) { return n.id === note.id || meetingKey(n) === key; }) ||
      rec.meetingNotes.find(function (n) { return timeTitleKey(n) === tt; });
    function log(action, detail) {
      state.changeLog.push({ id: makeId('chg'), at: o.at, who: o.by, by: o.by, actedFor: o.actedFor || null, source: MEETING_SOURCE, action: action,
        entityType: entityType, entityId: rec.id, field: 'meetingNotes', oldValue: null, newValue: (have || note).id, detail: detail });
    }
    var label = (rec.company || rec.name || rec.id) + ' meeting ' + note.meetingAt.slice(0, 16).replace('T', ' ') + (note.title ? ' "' + clip(note.title) + '"' : '');
    if (!have) {
      rec.meetingNotes.push(JSON.parse(JSON.stringify(note)));
      rec.updatedAt = o.at;
      log('add', 'Added ' + label + ' with ' + note.actionItems.length + ' action item(s)');
      return 'added';
    }
    var changed = [];
    ['title', 'body', 'transcriptUrl'].forEach(function (k) { if (isBlank(have[k]) && !isBlank(note[k])) { have[k] = note[k]; changed.push(k); } });
    if (!have.rawRef && note.rawRef) { have.rawRef = note.rawRef; }
    note.actionItems.forEach(function (ai) {
      if (have.actionItems.some(function (x) { return x.text.toLowerCase() === ai.text.toLowerCase(); })) return;
      have.actionItems.push(JSON.parse(JSON.stringify(ai)));
      changed.push('action item');
    });
    ['topics', 'commitmentsOwner', 'commitmentsOther'].forEach(function (k) {
      (note[k] || []).forEach(function (x) {
        var text = typeof x === 'string' ? x : x.text;
        if (hasText(have[k] || [], text)) return;
        if (!Array.isArray(have[k])) have[k] = [];
        have[k].push(JSON.parse(JSON.stringify(x)));
        changed.push(k);
      });
    });
    (note.persons || []).forEach(function (p) {
      var list = have.persons || [];
      var same = list.find(function (q) { return (p.email && q.email === p.email) || (p.name && q.name && q.name.toLowerCase() === p.name.toLowerCase()); });
      if (same) { if (!same.email && p.email) { same.email = p.email; changed.push('persons'); } if (!same.name && p.name) { same.name = p.name; changed.push('persons'); } return; }
      if (!Array.isArray(have.persons)) have.persons = [];
      have.persons.push(JSON.parse(JSON.stringify(p)));
      changed.push('persons');
    });
    if (note.nextAction) {
      if (!have.nextAction) { have.nextAction = JSON.parse(JSON.stringify(note.nextAction)); changed.push('nextAction'); }
      else if (have.nextAction.text.toLowerCase() === note.nextAction.text.toLowerCase()) {
        ['owner', 'due'].forEach(function (k) { if (!have.nextAction[k] && note.nextAction[k]) { have.nextAction[k] = note.nextAction[k]; changed.push('nextAction ' + k); } });
      }
    }
    if (!changed.length) return 'unchanged';
    changed = changed.filter(function (c, i, a) { return a.indexOf(c) === i; });
    rec.updatedAt = o.at;
    log('update', 'Updated ' + label + ': ' + changed.join(', ') + ' added');
    return 'updated';
  }

  // One email to one target: one open lead with that contact, else one customer. Never a guess.
  function matchMeetingEmail(state, email) {
    var e = String(email).trim().toLowerCase();
    var ks = state.contacts.filter(function (k) { return String(k.email || '').toLowerCase() === e; });
    var ids = ks.map(function (k) { return k.id; });
    var leads = (state.deals || []).filter(function (d) {
      return isActiveLead(d) && ((d.contactIds || []).some(function (x) { return ids.indexOf(x) !== -1; }) || String(d.contactEmail || '').toLowerCase() === e);
    });
    var custs = ks.map(function (k) { return k.customerId; }).filter(function (v, j, a) { return v && a.indexOf(v) === j; });
    if (leads.length === 1) return { target: leads[0], type: 'lead' };
    if (!leads.length && custs.length === 1) {
      var c = state.customers.find(function (x) { return x.id === custs[0]; });
      if (c) return { target: c, type: 'customer' };
    }
    return { error: e + ' matches ' + (leads.length ? leads.length + ' open leads' : custs.length ? custs.length + ' customers' : 'nothing'), none: !leads.length && !custs.length };
  }

  // body: { notes: [ { leadId | customerId | email | persons, meetingAt | callTime, title, body, actionItems, id,
  //   topics, commitmentsOwner, commitmentsOther, nextAction, transcriptUrl } ] } or a list.
  // opts.canWriteLead(deal) / opts.canWriteCustomers limit a bot grant (write API); the app checks access itself.
  function applyMeetingNotesImport(state, body, opts) {
    opts = opts || {};
    ensureArrays(state);
    var o = { at: opts.at || nowIso(), by: String(opts.by || 'unknown').toLowerCase(), actedFor: opts.actedFor || null };
    var canWriteLead = typeof opts.canWriteLead === 'function' ? opts.canWriteLead : function () { return true; };
    var canWriteCustomers = opts.canWriteCustomers !== false;
    var list = Array.isArray(body) ? body : toList(body && (body.notes || body.meetingNotesImport));
    var summary = { notes: list.length, added: 0, updated: 0, unchanged: 0, skipped: [], incomplete: [], results: [], frozen: false };
    if (opts.frozen && !opts.isAdmin) { summary.frozen = true; return { summary: summary }; }
    list.forEach(function (raw, i) {
      var ref = '#' + (i + 1);
      var r = normalizeMeetingNote(raw, o.at);
      if (r.error) { summary.skipped.push(ref + ': ' + r.error); return; }
      var target = null, type = '';
      if (raw.leadId) { target = (state.deals || []).find(function (d) { return d.id === raw.leadId; }); type = 'lead'; }
      else if (raw.customerId) { target = state.customers.find(function (c) { return c.id === raw.customerId; }); type = 'customer'; }
      else if (raw.email) {
        var m = matchMeetingEmail(state, raw.email);
        if (m.error) { summary.skipped.push(ref + ': ' + m.error + '; add leadId or customerId'); return; }
        target = m.target; type = m.type;
      } else if ((r.note.persons || []).some(function (p) { return p.email; })) {
        // Outside attendees' emails. Our own addresses never pick the record.
        var found = [], why = [];
        r.note.persons.forEach(function (p) {
          if (!p.email || /@matrix\.com$/i.test(p.email)) return;
          var pm = matchMeetingEmail(state, p.email);
          if (pm.target) { if (!found.some(function (f) { return f.target === pm.target; })) found.push(pm); }
          else if (!pm.none) why.push(pm.error);
        });
        if (found.length !== 1 || why.length) {
          summary.skipped.push(ref + ': ' + (why.length ? why.join(', ') : found.length ? 'attendees match ' + found.length + ' records' : 'no attendee email matches a lead or customer') + '; add leadId or customerId');
          return;
        }
        target = found[0].target; type = found[0].type;
      } else { summary.skipped.push(ref + ': needs leadId, customerId or email'); return; }
      if (!target) { summary.skipped.push(ref + ': ' + (raw.leadId || raw.customerId) + ' not found'); return; }
      if (type === 'lead' ? !canWriteLead(target) : !canWriteCustomers) { summary.skipped.push(ref + ': no write access to ' + target.id); return; }
      var res = upsertMeetingNote(state, target, type, r.note, o);
      summary[res] += 1;
      var stored = (target.meetingNotes || []).find(function (n) { return n.id === r.note.id; }) ||
        (target.meetingNotes || []).find(function (n) { return timeTitleKey(n) === timeTitleKey(r.note) || meetingKey(n) === meetingKey(r.note); }) || r.note;
      var missing = callNoteMissing(stored);
      var notes = r.warnings.concat(missing.length ? ['missing ' + missing.join(', ')] : []);
      if (notes.length) summary.incomplete.push(ref + ' (' + target.id + '): ' + notes.join('; '));
      summary.results.push({ ref: ref, entityType: type, entityId: target.id, noteId: stored.id, action: res, missing: missing });
    });
    return { summary: summary };
  }

  function meetingSummaryLines(s) {
    if (s.frozen) return ['Bot writes are frozen. Nothing was imported.'];
    var out = [s.notes + ' meeting note(s): ' + s.added + ' added, ' + s.updated + ' updated, ' + s.unchanged + ' already there, ' + s.skipped.length + ' skipped.'];
    if (s.skipped.length) out.push('Skipped: ' + s.skipped.join('; ') + '.');
    if ((s.incomplete || []).length) out.push('Incomplete: ' + s.incomplete.join('; ') + '.');
    return out;
  }

  // Link an action item to a task once. makeTask(item, note) returns the new task (the app adds it
  // to state.tasks). A second call returns the linked task and creates nothing.
  function linkActionItemTask(state, rec, noteId, itemId, makeTask) {
    var note = (rec.meetingNotes || []).find(function (n) { return n.id === noteId; });
    var item = note && (note.actionItems || []).find(function (a) { return a.id === itemId; });
    if (!item) return { task: null, created: false };
    var existing = item.taskId ? (state.tasks || []).find(function (t) { return t.id === item.taskId; }) : null;
    if (existing) return { task: existing, created: false };
    var task = makeTask(item, note);
    if (!task) return { task: null, created: false };
    item.taskId = task.id;
    return { task: task, created: true };
  }

  // ---------------------------------------------------------------------
  // Lead and customer sections (issue #8). Optional fields, stored only once filled (no empty
  // blocks added to every record, which keeps workspace/main small). Every edit is a change log
  // entry with old and new value. Rows in lists are edited, never deleted.
  // ---------------------------------------------------------------------
  var BUYING_ROLES = ['buyer', 'ap', 'technical', 'founder', 'other'];
  var BUYING_ROLE_LABELS = { buyer: 'Buyer', ap: 'AP', technical: 'Technical', founder: 'Founder', other: 'Other' };
  var LOST_REASONS = [['price', 'Price'], ['timing', 'Timing'], ['no-response', 'No response'], ['went-elsewhere', 'Went elsewhere'],
    ['not-a-fit', 'Not a fit'], ['paused', 'Paused'], ['other', 'Other']];
  var SAMPLE_STATUSES = ['sent', 'received', 'approved', 'rejected'];
  var DOC_TYPES = ['NDA', 'SDS', 'Packing list', 'Remittance', 'Customer application', 'Spec sheet', 'Quote', 'Other'];
  // [key, label, kind, options]. kind: text (default), textarea, date, number, url, select.
  var RECORD_SECTIONS = [
    { key: 'profile', label: 'Company profile', type: 'object', fields: [['legalName', 'Legal name'], ['dba', 'DBA'], ['domain', 'Domain'],
      ['hq', 'HQ'], ['industry', 'Industry'], ['size', 'Company size']] },
    { key: 'specs', label: 'Product and process specs', type: 'object', fields: [['material', 'Material'], ['durometer', 'Durometer'],
      ['color', 'Color / PMS'], ['dimensions', 'Dimensions'], ['cure', 'Cure system'], ['notes', 'Notes', 'textarea']] },
    { key: 'openItems', label: 'Open questions, risks, next step', type: 'object', fields: [['questions', 'Open questions', 'textarea'],
      ['risks', 'Risks', 'textarea'], ['nextStep', 'Next step', 'textarea']] },
    { key: 'samples', label: 'Samples and shipping', type: 'list', fields: [['round', 'Round'], ['shippedAt', 'Shipped', 'date'],
      ['carrier', 'Carrier'], ['tracking', 'Tracking'], ['destination', 'Destination'], ['status', 'Status', 'select', SAMPLE_STATUSES],
      ['feedback', 'Feedback', 'textarea']], dedupe: ['round', 'shippedAt', 'tracking'] },
    { key: 'docLinks', label: 'Documents', type: 'list', fields: [['type', 'Type', 'select', DOC_TYPES], ['name', 'Name'], ['url', 'Link', 'url']], dedupe: ['url'] }
  ];
  // Invoices live in Billing (billingEntries, #50), so invoicesAdd is not a lead list.
  var SECTION_ADD_KEYS = { samplesAdd: 'samples', docLinksAdd: 'docLinks' };

  function recordSection(key) {
    for (var i = 0; i < RECORD_SECTIONS.length; i++) if (RECORD_SECTIONS[i].key === key) return RECORD_SECTIONS[i];
    return null;
  }

  // One value by field kind; '' when empty or invalid. bad collects labels of invalid input.
  function cleanSectionField(f, v, bad) {
    var kind = f[2] || 'text';
    if (v == null || (typeof v === 'string' && !v.trim())) return '';
    if (kind === 'number') { var n = num(v); if (n == null) { bad.push(f[1]); return ''; } return n; }
    var t = String(v).trim();
    if (kind === 'date') { if (!/^\d{4}-\d{2}-\d{2}$/.test(t.slice(0, 10))) { bad.push(f[1]); return ''; } return t.slice(0, 10); }
    if (kind === 'url') { if (!isHttpUrl(t)) { bad.push(f[1]); return ''; } return t; }
    if (kind === 'select') {
      var opts = f[3] || [];
      var hit = opts.filter(function (o) { return o.toLowerCase() === t.toLowerCase(); })[0];
      if (!hit) { bad.push(f[1]); return ''; }
      return hit;
    }
    return t.length > 4000 ? t.slice(0, 4000) : t;
  }

  function cleanSectionValues(def, raw) {
    var vals = {}, bad = [];
    raw = raw && typeof raw === 'object' ? raw : {};
    def.fields.forEach(function (f) { if (f[0] in raw) vals[f[0]] = cleanSectionField(f, raw[f[0]], bad); });
    return { vals: vals, bad: bad };
  }

  function sectionLog(state, o, entityType, rec, action, field, oldValue, newValue, detail) {
    ensureArrays(state);
    state.changeLog.push({
      id: makeId('chg'), at: o.at, who: o.by, by: o.by, actedFor: o.actedFor || null, source: o.source || 'human', action: action,
      entityType: entityType, entityId: rec.id || null, field: field, oldValue: oldValue === undefined || oldValue === '' ? null : oldValue,
      newValue: newValue === undefined || newValue === '' ? null : newValue, detail: detail
    });
  }

  function sectionOpts(opts) {
    opts = opts || {};
    return { at: opts.at || nowIso(), by: String(opts.by || 'user'), actedFor: opts.actedFor || null, source: opts.source || 'human' };
  }

  function recLabel(rec) { return rec.company || rec.name || rec.title || rec.id; }

  // Hand edit of an object section: sets what the form sends (a cleared field is cleared and logged).
  function setRecordSection(state, rec, entityType, key, raw, opts) {
    var def = recordSection(key);
    if (!def || def.type !== 'object') return { changed: [], bad: ['unknown section ' + key] };
    var o = sectionOpts(opts);
    var c = cleanSectionValues(def, raw);
    var cur = rec[key] && typeof rec[key] === 'object' ? rec[key] : {};
    var next = Object.assign({}, cur);
    var changed = [];
    Object.keys(c.vals).forEach(function (k) {
      var oldV = cur[k] == null ? '' : cur[k];
      if (String(oldV) === String(c.vals[k])) return;
      if (c.vals[k] === '') delete next[k]; else next[k] = c.vals[k];
      changed.push(k);
      sectionLog(state, o, entityType, rec, 'update', key + '.' + k, oldV, c.vals[k], recLabel(rec) + ' ' + def.label + ': ' + k + ' "' + clip(oldV) + '" to "' + clip(c.vals[k]) + '"');
    });
    if (changed.length) {
      if (Object.keys(next).length) rec[key] = next; else delete rec[key];
      rec.updatedAt = o.at;
    }
    return { changed: changed, bad: c.bad };
  }

  function sectionRowKey(def, row) {
    return (def.dedupe || []).map(function (k) { return String(row[k] == null ? '' : row[k]).trim().toLowerCase(); }).join('|');
  }

  function addRecordSectionRow(state, rec, entityType, key, raw, opts) {
    var def = recordSection(key);
    if (!def || def.type !== 'list') return { row: null, bad: ['unknown list ' + key] };
    var o = sectionOpts(opts);
    var c = cleanSectionValues(def, raw);
    var row = {};
    Object.keys(c.vals).forEach(function (k) { if (c.vals[k] !== '') row[k] = c.vals[k]; });
    if (!Object.keys(row).length) return { row: null, bad: c.bad.length ? c.bad : ['empty row'] };
    if (!Array.isArray(rec[key])) rec[key] = [];
    var dk = sectionRowKey(def, row);
    if (dk.replace(/\|/g, '') && rec[key].some(function (r) { return sectionRowKey(def, r) === dk; })) return { row: null, duplicate: true, bad: c.bad };
    row.id = makeId(key.slice(0, 3));
    row.addedAt = o.at;
    row.addedBy = o.by;
    rec[key].push(row);
    rec.updatedAt = o.at;
    sectionLog(state, o, entityType, rec, 'add', key, null, row, recLabel(rec) + ' ' + def.label + ': added ' + clip(row[def.fields[0][0]] || row[def.fields[1][0]] || ''));
    return { row: row, bad: c.bad };
  }

  function updateRecordSectionRow(state, rec, entityType, key, rowId, raw, opts) {
    var def = recordSection(key);
    var row = def && Array.isArray(rec[key]) ? rec[key].find(function (r) { return r.id === rowId; }) : null;
    if (!row) return { changed: [], bad: ['row not found'] };
    var o = sectionOpts(opts);
    var c = cleanSectionValues(def, raw);
    var changed = [];
    Object.keys(c.vals).forEach(function (k) {
      var oldV = row[k] == null ? '' : row[k];
      if (String(oldV) === String(c.vals[k])) return;
      if (c.vals[k] === '') delete row[k]; else row[k] = c.vals[k];
      changed.push(k);
      sectionLog(state, o, entityType, rec, 'update', key + '.' + k, oldV, c.vals[k], recLabel(rec) + ' ' + def.label + ' row: ' + k + ' "' + clip(oldV) + '" to "' + clip(c.vals[k]) + '"');
    });
    if (changed.length) { row.updatedAt = o.at; rec.updatedAt = o.at; }
    return { changed: changed, bad: c.bad };
  }

  // ---- Lead core fields (#50). The short list every working lead should have; everything else
  // is optional detail behind Add details. Read-only helpers, no state changes. ----
  var LEAD_CORE_FIELDS = [['company', 'Company'], ['contactName', 'Contact'], ['email', 'Email'], ['phone', 'Phone'],
    ['source', 'Source'], ['stage', 'Stage'], ['value', 'Value'], ['nextStep', 'Next step'], ['nextFollowUp', 'Next step date']];
  var LEAD_NEXT_STEP_KEYS = ['nextStep', 'nextFollowUp'];

  // Same order as the app: the lead's own primary, then its linked contacts, then the customer's.
  function leadPrimaryContact(state, deal) {
    var contacts = (state && state.contacts) || [];
    var byId = function (id) { return contacts.find(function (c) { return c && c.id === id; }) || null; };
    if (!deal) return null;
    if (deal.primaryContactId && byId(deal.primaryContactId)) return byId(deal.primaryContactId);
    var linked = (Array.isArray(deal.contactIds) ? deal.contactIds : []).map(byId).filter(Boolean);
    if (linked.length) return linked.find(function (c) { return c.isPrimary; }) || linked[0];
    if (deal.customerId) {
      var all = contacts.filter(function (c) { return c && c.customerId === deal.customerId; });
      return all.find(function (c) { return c.isPrimary; }) || all[0] || null;
    }
    return null;
  }

  function leadValueTotal(deal) {
    if (!deal) return 0;
    if (deal.values && typeof deal.values === 'object') {
      return Object.keys(deal.values).reduce(function (t, k) { return t + (Number(deal.values[k]) || 0); }, 0);
    }
    var one = deal.oneShot || {};
    return (Number(deal.arr) || 0) + (Number(one.designCadDfm) || 0) + (Number(one.moldTooling) || 0);
  }

  function leadCoreValues(state, deal) {
    var c = leadPrimaryContact(state, deal) || {};
    return {
      company: (deal && (deal.company || deal.title)) || '', contactName: c.name || '', email: c.email || '', phone: c.phone || '',
      source: (deal && deal.source) || '', stage: (deal && deal.stage) || '', value: leadValueTotal(deal),
      nextStep: (deal && deal.openItems && deal.openItems.nextStep) || '', nextFollowUp: (deal && deal.nextFollowUp) || ''
    };
  }

  // Keys of the empty core fields. Only working leads are checked (won, lost, projects and Shop
  // Needs cards have nothing missing). Cold leads are exempt from the next step fields.
  function leadCoreMissing(state, deal) {
    if (!isActiveLead(deal)) return [];
    var v = leadCoreValues(state, deal);
    var cold = coldStages(state || {}).indexOf(deal.stage) !== -1;
    return LEAD_CORE_FIELDS.map(function (f) { return f[0]; }).filter(function (k) {
      if (cold && LEAD_NEXT_STEP_KEYS.indexOf(k) !== -1) return false;
      if (k === 'value') return !(v.value > 0);
      return isBlank(v[k]);
    });
  }

  // One line for a filled detail section ('' when empty), shown in the collapsed Add details list.
  function recordSectionSummary(rec, key) {
    var def = recordSection(key);
    if (!def || isRecordSectionEmpty(rec, key)) return '';
    var shown = function (f, v) { return (f[2] || '') === 'url' ? '' : String(v); };
    if (def.type === 'object') {
      var o = rec[key];
      return clip(def.fields.filter(function (f) { return !isBlank(o[f[0]]); }).map(function (f) { return shown(f, o[f[0]]); }).filter(Boolean).join(', '));
    }
    var rows = rec[key];
    var last = rows[rows.length - 1] || {};
    var bits = def.fields.filter(function (f) { return (f[2] || '') !== 'textarea' && !isBlank(last[f[0]]); }).map(function (f) { return shown(f, last[f[0]]); }).filter(Boolean);
    return clip(rows.length + (rows.length === 1 ? ' row' : ' rows') + (bits.length ? ', latest: ' + bits.join(' ') : ''));
  }

  function timelineSummary(entries) {
    var t = timelineNewestFirst(entries);
    if (!t.length) return '';
    return clip(t.length + (t.length === 1 ? ' entry' : ' entries') + ', latest ' + String(t[0].at || '').slice(0, 10) + ': ' + (t[0].text || ''));
  }

  function isRecordSectionEmpty(rec, key) {
    var v = rec && rec[key];
    if (Array.isArray(v)) return !v.length;
    return !v || typeof v !== 'object' || !Object.keys(v).some(function (k) { return !isBlank(v[k]); });
  }

  function setSophistication(state, rec, entityType, score, notes, opts) {
    var o = sectionOpts(opts);
    var n = score === '' || score == null ? '' : Math.round(Number(score));
    if (n !== '' && !(n >= 1 && n <= 5)) return { changed: false, bad: ['Sophistication must be 1 to 5'] };
    var changed = false;
    var oldS = rec.sophisticationScore == null ? '' : rec.sophisticationScore;
    if (String(oldS) !== String(n)) {
      if (n === '') delete rec.sophisticationScore; else rec.sophisticationScore = n;
      sectionLog(state, o, entityType, rec, 'update', 'sophisticationScore', oldS, n, recLabel(rec) + ' sophistication ' + (oldS || 'none') + ' to ' + (n || 'none'));
      changed = true;
    }
    var t = String(notes == null ? '' : notes).trim();
    var oldN = rec.sophisticationNotes || '';
    if (notes !== undefined && t !== oldN) {
      if (t) rec.sophisticationNotes = t; else delete rec.sophisticationNotes;
      sectionLog(state, o, entityType, rec, 'update', 'sophisticationNotes', oldN, t, recLabel(rec) + ' sophistication evidence updated');
      changed = true;
    }
    if (changed) rec.updatedAt = o.at;
    return { changed: changed, bad: [] };
  }

  function lostReasonLabel(code) {
    var hit = LOST_REASONS.filter(function (r) { return r[0] === code; })[0];
    return hit ? hit[1] : '';
  }

  // Required when a lead moves to Lost: a picklist code, plus text (required for Other).
  function setLostReason(state, rec, code, text, opts) {
    var o = sectionOpts(opts);
    if (!lostReasonLabel(code)) return { ok: false, error: 'Pick a reason.' };
    var t = String(text == null ? '' : text).trim();
    if (code === 'other' && !t) return { ok: false, error: 'Add a few words for Other.' };
    var old = rec.lostReason ? JSON.parse(JSON.stringify(rec.lostReason)) : null;
    var next = { code: code, text: t, at: o.at, by: o.by };
    if (old && old.code === code && (old.text || '') === t) return { ok: true, changed: false };
    rec.lostReason = next;
    rec.updatedAt = o.at;
    sectionLog(state, o, 'lead', rec, 'update', 'lostReason', old ? lostReasonLabel(old.code) + (old.text ? ': ' + old.text : '') : '',
      lostReasonLabel(code) + (t ? ': ' + t : ''), recLabel(rec) + ' lost reason: ' + lostReasonLabel(code) + (t ? ' (' + clip(t) + ')' : ''));
    return { ok: true, changed: true };
  }

  // Communication timeline: newest first. Entries: { id, at, type, text, source, url }.
  function timelineNewestFirst(entries) {
    return (entries || []).filter(function (e) { return e && (e.text || e.at); }).slice().sort(function (a, b) {
      return String(b.at || '').localeCompare(String(a.at || ''));
    });
  }

  function addTimelineEntry(state, rec, entityType, raw, opts) {
    var o = sectionOpts(opts);
    raw = raw || {};
    var text = String(raw.text || '').trim();
    if (!text) return { entry: null, error: 'Write what happened.' };
    var at = String(raw.at || '').trim();
    if (at && !/^\d{4}-\d{2}-\d{2}/.test(at)) return { entry: null, error: 'Use a date like 2026-09-23.' };
    var url = String(raw.url || '').trim();
    if (url && !isHttpUrl(url)) return { entry: null, error: 'Links must start with http:// or https://.' };
    if (!Array.isArray(rec.timeline)) rec.timeline = [];
    var e = { id: makeId('tl'), type: String(raw.type || 'note'), text: text, at: at || o.at, source: String(raw.source || o.by) };
    if (url) e.url = url;
    var tldr = clampSummary(raw.summary);
    if (tldr) e.summary = tldr;
    if (rec.timeline.some(function (x) { return x && String(x.text || '').trim() === text && dayOf(x.at) === dayOf(e.at); })) return { entry: null, duplicate: true };
    rec.timeline.push(e);
    rec.updatedAt = o.at;
    sectionLog(state, o, entityType, rec, 'add', 'timeline', null, text, recLabel(rec) + ' timeline: ' + clip(text));
    return { entry: e };
  }

  // ---------------------------------------------------------------------
  // TL;DR (issue #61). Display helpers: nothing here changes a stored entry. An entry shows its
  // `summary` (bots write it, max 140 chars) or an auto-TL;DR cut from `text`. Full text is formatted
  // for reading behind Show more.
  // ---------------------------------------------------------------------
  var SUMMARY_MAX = 140;
  var TLDR_AUTO_MAX = 120;
  var TLDR_ABBREV = /(?:^|[\s(])(?:mr|mrs|ms|dr|jr|sr|st|vs|no|inc|co|ltd|corp|e\.g|i\.e|etc)\.$/i;

  // One plain line, trimmed, max 140 chars. '' when empty.
  function clampSummary(v) {
    var t = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
    if (t.length <= SUMMARY_MAX) return t;
    return t.slice(0, SUMMARY_MAX - 1).replace(/\s+$/, '') + '…';
  }

  // Index just past the end of the first sentence in s, or -1.
  function firstSentenceEnd(s) {
    var re = /[.!?]["')\]]?(?=\s+[A-Z0-9"'(]|$)/g, m;
    while ((m = re.exec(s))) {
      var end = m.index + m[0].length;
      if (!TLDR_ABBREV.test(s.slice(0, end))) return end;
    }
    return -1;
  }

  // First sentence or first line of the text, cut to about 120 chars with an ellipsis.
  function autoTldr(text, max) {
    var limit = max || TLDR_AUTO_MAX;
    var line = String(text == null ? '' : text).split(/\r?\n/).map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean)[0] || '';
    if (!line) return '';
    var end = firstSentenceEnd(line);
    var cut = end > 0 ? line.slice(0, end) : line;
    if (cut.length > limit) {
      cut = cut.slice(0, limit - 1);
      var sp = cut.lastIndexOf(' ');
      if (sp > limit * 0.6) cut = cut.slice(0, sp);
      return cut.replace(/[\s,;:.\-]+$/, '') + '…';
    }
    return cut;
  }

  // The first Gmail link in the text (or an entry's own url), or ''.
  function extractGmailUrl(text, url) {
    var u = String(url || '').trim();
    if (/^https?:\/\/(?:mail|inbox)\.google\.com\//i.test(u)) return u;
    var m = String(text == null ? '' : text).match(/https?:\/\/(?:mail|inbox)\.google\.com\/[^\s<>"')\]]+/i);
    return m ? m[0].replace(/[.,;:!?]+$/, '') : '';
  }

  // The line shown on a collapsed row: summary if present, else the auto-TL;DR.
  function entrySummary(entry) {
    var e = entry || {};
    return clampSummary(e.summary) || autoTldr(e.text);
  }

  // Full text for Show more: line breaks kept, a gap between paragraphs, "Label: value" lines as a
  // list, long run-ons split at sentence ends. Returns blocks:
  //   { type: 'fields', items: [{ label, value }] } or { type: 'para', text }
  var TL_LABEL_RE = /^([A-Z][A-Za-z0-9 \/&'()-]{0,38}):[ \t]+(\S.*)$/;

  function splitLongParagraph(line) {
    if (line.length <= 300) return [line];
    var parts = [], start = 0, re = /[.!?]["')\]]?(?=\s+[A-Z0-9"'(])/g, m;
    var sentences = [];
    while ((m = re.exec(line))) {
      var end = m.index + m[0].length;
      if (TLDR_ABBREV.test(line.slice(start, end))) continue;
      sentences.push(line.slice(start, end).trim());
      start = end;
    }
    var rest = line.slice(start).trim();
    if (rest) sentences.push(rest);
    var cur = '';
    sentences.forEach(function (s) {
      if (cur && (cur + ' ' + s).length > 200) { parts.push(cur); cur = s; } else cur = cur ? cur + ' ' + s : s;
    });
    if (cur) parts.push(cur);
    return parts;
  }

  function formatEntryText(text) {
    var raw = String(text == null ? '' : text).replace(/\r\n?/g, '\n');
    var blocks = [];
    raw.split(/\n[ \t]*\n+/).forEach(function (para) {
      var fields = null, plain = [];
      function flushPlain() {
        if (!plain.length) return;
        var body = plain.join('\n');
        blocks.push({ type: 'para', text: body });
        plain = [];
      }
      function flushFields() { if (fields) { blocks.push({ type: 'fields', items: fields }); fields = null; } }
      para.split('\n').forEach(function (line) {
        if (!line.trim()) return;
        var m = line.trim().match(TL_LABEL_RE);
        if (m && !/^https?$/i.test(m[1])) {
          flushPlain();
          if (!fields) fields = [];
          fields.push({ label: m[1].trim(), value: m[2].trim() });
          return;
        }
        flushFields();
        if (line.trim().length > 300) {
          flushPlain();
          splitLongParagraph(line.trim()).forEach(function (p) { blocks.push({ type: 'para', text: p }); });
        } else plain.push(line.replace(/\s+$/, ''));
      });
      flushFields();
      flushPlain();
    });
    return blocks;
  }

  // The header strip on a lead: up to 3 lines. Only what is on the record, nothing guessed:
  // latest entry summary, next step plus date, and "Awaiting our reply" when the newest entry
  // carries awaitingReply: true or says so.
  function leadTldrStrip(state, deal) {
    var lines = [];
    if (!deal) return lines;
    var entries = (deal.timeline || []).map(function (e) { return { at: e && e.at, e: e }; })
      .concat((deal.notes || []).map(function (n) { return { at: n && n.createdAt, e: n }; }))
      .filter(function (x) { return x.e && (x.e.text || x.e.summary); })
      .sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); });
    var newest = entries[0] && entries[0].e;
    var latest = newest ? entrySummary(newest) : '';
    if (latest) lines.push({ kind: 'latest', text: latest, date: dayOf(entries[0].at) });
    var core = leadCoreValues(state || {}, deal);
    var next = [String(core.nextStep || '').trim(), isIsoDay(core.nextFollowUp) ? dayOf(core.nextFollowUp) : ''].filter(Boolean);
    if (next.length) lines.push({ kind: 'next', text: 'Next: ' + next.join(', ') });
    if (newest && (newest.awaitingReply === true || /awaiting our reply/i.test(String(newest.summary || '') + ' ' + String(newest.text || '')))) {
      lines.push({ kind: 'awaiting', text: 'Awaiting our reply' });
    }
    return lines.slice(0, 3);
  }

  // A customer's timeline: its own entries plus those of its leads, newest first.
  function customerTimeline(state, customerId) {
    var cust = (state.customers || []).find(function (c) { return c.id === customerId; });
    var out = ((cust && cust.timeline) || []).map(function (e) { return Object.assign({ dealId: null }, e); });
    (state.deals || []).forEach(function (d) {
      if (d.customerId !== customerId) return;
      (d.timeline || []).forEach(function (e) { out.push(Object.assign({ dealId: d.id, dealTitle: d.title || d.company }, e)); });
    });
    return timelineNewestFirst(out);
  }

  // ---------------------------------------------------------------------
  // Communications (issue #14). Pure Gmail helpers shared by the app and the tests: which
  // addresses belong to a lead, the Gmail search for them, message parsing, and building the
  // raw message for a draft update. Nothing here sends mail; sending is a human click in the app.
  // ---------------------------------------------------------------------
  var COMMS_EMAIL_RE = /^[^\s@<>"'`,;()]+@[^\s@<>"'`,;()]+\.[a-z]{2,}$/i;

  function leadContactEmails(state, deal) {
    var out = [];
    function add(e) { e = String(e || '').trim().toLowerCase(); if (COMMS_EMAIL_RE.test(e) && out.indexOf(e) === -1) out.push(e); }
    (deal && deal.contactIds || []).forEach(function (id) { var k = (state.contacts || []).find(function (c) { return c.id === id; }); if (k) add(k.email); });
    if (!out.length && deal && deal.customerId) (state.contacts || []).forEach(function (k) { if (k.customerId === deal.customerId) add(k.email); });
    return out;
  }

  // Gmail sync (issue #54): deal.email = { lastInboundAt, lastOutboundAt, lastThreadUrl, ball, replyWaiting }, written only
  // by the gmailSync Function. emailedAgo: the latest of inbound or outbound as whole days ago (null when none).
  function emailedAgo(deal, nowMs) {
    var e = deal && deal.email;
    if (!e) return null;
    var t = Math.max(Date.parse(e.lastInboundAt || '') || 0, Date.parse(e.lastOutboundAt || '') || 0);
    if (!t) return null;
    return Math.max(0, Math.floor(((nowMs == null ? Date.now() : nowMs) - t) / 86400000));
  }

  // Needs Reply view: open deals whose customer wrote last and we have not answered, oldest waiting first.
  function needsReplyList(state, nowMs) {
    var now = nowMs == null ? Date.now() : nowMs;
    return (state.deals || []).filter(function (d) {
      return d && d.email && d.email.replyWaiting === true && d.status !== 'archived' && d.status !== 'lost';
    }).map(function (d) {
      var since = d.email.lastInboundAt || '';
      return { deal: d, since: since, days: since ? Math.max(0, Math.floor((now - Date.parse(since)) / 86400000)) : 0 };
    }).sort(function (a, b) { return String(a.since).localeCompare(String(b.since)); });
  }

  // Gmail search for mail with these addresses, e.g. {from:a to:a from:b to:b}.
  function gmailQueryFor(emails) {
    var parts = [];
    (emails || []).forEach(function (e) { if (COMMS_EMAIL_RE.test(e)) parts.push('from:' + e, 'to:' + e, 'cc:' + e); });
    return parts.length ? '{' + parts.join(' ') + '}' : '';
  }

  function b64urlDecode(s) {
    s = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = typeof atob === 'function' ? atob(s) : Buffer.from(s, 'base64').toString('binary');
    try { return decodeURIComponent(escape(bin)); } catch (e) { return bin; }
  }

  function b64urlEncode(str) {
    var bin = unescape(encodeURIComponent(String(str)));
    var b = typeof btoa === 'function' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64');
    return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function gmailHeader(msg, name) {
    var hs = (msg && msg.payload && msg.payload.headers) || [];
    var h = hs.find(function (x) { return String(x.name).toLowerCase() === name.toLowerCase(); });
    return h ? String(h.value) : '';
  }

  function gmailPlainBody(payload) {
    if (!payload) return '';
    if (payload.mimeType === 'text/plain' && payload.body && payload.body.data) return b64urlDecode(payload.body.data);
    var parts = payload.parts || [];
    for (var i = 0; i < parts.length; i++) { var t = gmailPlainBody(parts[i]); if (t) return t; }
    if (payload.body && payload.body.data && /^text\//.test(payload.mimeType || '')) return b64urlDecode(payload.body.data).replace(/<[^>]+>/g, '');
    return '';
  }

  function addressList(h) {
    return String(h || '').split(',').map(function (x) {
      var m = x.match(/<([^>]+)>/); return (m ? m[1] : x).trim().toLowerCase();
    }).filter(function (x) { return COMMS_EMAIL_RE.test(x); });
  }

  // One Gmail message (format full or metadata) for display. myEmail marks sent vs received.
  function parseGmailMessage(msg, myEmail) {
    var from = gmailHeader(msg, 'From');
    var fromAddr = addressList(from)[0] || '';
    var at = msg && msg.internalDate ? new Date(Number(msg.internalDate)).toISOString() : (Date.parse(gmailHeader(msg, 'Date')) ? new Date(gmailHeader(msg, 'Date')).toISOString() : '');
    return {
      id: msg && msg.id || '', threadId: msg && msg.threadId || '', from: from, fromAddr: fromAddr,
      to: addressList(gmailHeader(msg, 'To')), cc: addressList(gmailHeader(msg, 'Cc')), subject: gmailHeader(msg, 'Subject'),
      messageIdHeader: gmailHeader(msg, 'Message-ID') || gmailHeader(msg, 'Message-Id'), references: gmailHeader(msg, 'References'),
      at: at, snippet: msg && msg.snippet || '', body: msg && msg.payload ? gmailPlainBody(msg.payload) : '',
      direction: myEmail && fromAddr === String(myEmail).toLowerCase() ? 'sent' : 'received',
      link: msg && msg.threadId ? 'https://mail.google.com/mail/u/0/#all/' + encodeURIComponent(msg.threadId) : ''
    };
  }

  function sortMessagesNewestFirst(list) {
    return (list || []).slice().sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); });
  }

  // Raw RFC 2822 message (base64url) for a draft update; keeps threading headers.
  function buildRawMessage(m) {
    function clean(v) { return String(v || '').replace(/[\r\n]+/g, ' ').trim(); }
    var to = (Array.isArray(m.to) ? m.to : String(m.to || '').split(',')).map(function (x) { return clean(x); }).filter(Boolean);
    var lines = ['To: ' + to.join(', ')];
    if (m.cc && m.cc.length) lines.push('Cc: ' + (Array.isArray(m.cc) ? m.cc : [m.cc]).map(clean).join(', '));
    lines.push('Subject: ' + clean(m.subject));
    if (m.inReplyTo) lines.push('In-Reply-To: ' + clean(m.inReplyTo));
    if (m.references || m.inReplyTo) lines.push('References: ' + clean(m.references || m.inReplyTo));
    lines.push('MIME-Version: 1.0', 'Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: 8bit', '', String(m.body || '').replace(/\r?\n/g, '\r\n'));
    return b64urlEncode(lines.join('\r\n'));
  }

  // Drive file links as an embeddable preview (Drive viewer); other links as-is.
  function drivePreviewUrl(url) {
    var u = String(url || '');
    var m = u.match(/^https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/) || u.match(/^https:\/\/drive\.google\.com\/open\?id=([A-Za-z0-9_-]+)/);
    return m ? 'https://drive.google.com/file/d/' + m[1] + '/preview' : '';
  }

  // ---------------------------------------------------------------------
  // Completion log in its own collection (issue #5). workspace/main grows ~300 bytes per task
  // completion; once Owner deploys the rule for completionLog/{id}, new entries go there instead
  // (settings.completionLogStore = 'collection'). Entries already in state are copied, never
  // deleted, and both sources are read together (dedupe by id).
  // ---------------------------------------------------------------------
  var COMPLETION_LOG_COLLECTION = 'completionLog';

  function completionLogStore(state) {
    return state && state.settings && state.settings.completionLogStore === 'collection' ? 'collection' : 'state';
  }

  function validCompletionId(id) { return /^[A-Za-z0-9_-]{1,120}$/.test(String(id || '')); }

  // State entries first, then collection entries not already there (same id).
  function mergeCompletionEntries(stateEntries, collectionEntries) {
    var seen = {};
    var out = [];
    (stateEntries || []).concat(collectionEntries || []).forEach(function (e) {
      if (!e || typeof e !== 'object') return;
      if (e.id) { if (seen[e.id]) return; seen[e.id] = true; }
      out.push(e);
    });
    return out;
  }

  function countCompletions(entries, userEmail, fromDate, toDate) {
    var email = String(userEmail || '').toLowerCase();
    var from = fromDate ? new Date(fromDate).getTime() : null;
    var to = toDate ? new Date(toDate).getTime() : null;
    var n = 0;
    (entries || []).forEach(function (e) {
      if (!e || e.kind !== 'completed') return;
      if (email && String(e.completedBy || '').toLowerCase() !== email) return;
      var t = e.completedAt ? new Date(e.completedAt).getTime() : NaN;
      if (from != null && !(t >= from)) return;
      if (to != null && !(t <= to)) return;
      n += 1;
    });
    return n;
  }

  // Which state entries still need copying to the collection (by id). Entries without a usable id
  // cannot be keyed and are reported, not copied.
  function completionCopyPlan(stateEntries, collectionIds) {
    var have = {};
    (collectionIds || []).forEach(function (id) { have[id] = true; });
    var plan = { toCopy: [], already: 0, badId: 0 };
    (stateEntries || []).forEach(function (e) {
      if (!e || !validCompletionId(e.id)) { plan.badId += 1; return; }
      if (have[e.id]) plan.already += 1; else plan.toCopy.push(e);
    });
    return plan;
  }

  // Held quotes from enrichment (#7) become customer quote records. The held copy stays on
  // the lead and is marked, so this runs safely on every load.
  function pickUpHeldQuotes(state, at, report) {
    (state.deals || []).forEach(function (d) {
      (Array.isArray(d.pendingCustomerQuotes) ? d.pendingCustomerQuotes : []).forEach(function (h, i) {
        if (!h || h.customerQuoteId) return;
        var id = 'cq_' + d.id + '_held' + (i + 1);
        if (!state.customerQuotes.some(function (q) { return q.id === id; })) {
          var q = normalizeCustomerQuote(Object.assign({}, h.quote || {}, { id: id }), { id: id, dealId: d.id, customerId: d.customerId, at: h.addedAt || at, by: h.addedBy || 'enrichment', source: h.source || 'enrichment' });
          state.customerQuotes.push(q);
          report.quotesPickedUp += 1;
        }
        h.customerQuoteId = id;
      });
    });
  }

  // Projects to SKU jobs. Runs on every load for projects not yet archived (a tab on the old
  // build could still create one), and is a no-op when there are none. Deterministic ids, so
  // re-running on an unsaved cloud copy gives the same records.
  function migrateSkuJobs(state, at, report) {
    ensureSkuJobBoards(state, report);
    (state.skus || []).forEach(ensureSkuJobFields);
    // Leads: converted becomes won (Owner answer 6). convertedAt and projectIds are kept.
    (state.deals || []).forEach(function (d) {
      if (d.status !== 'converted') return;
      d.status = 'won';
      if (!d.wonAt) d.wonAt = d.convertedAt || at;
      if (!d.wonBy) d.wonBy = 'migration';
      if (d.acceptedQuoteId === undefined) d.acceptedQuoteId = null;
      report.leadsWon += 1;
    });
    pickUpHeldQuotes(state, at, report);
    (state.projects || []).forEach(function (p) {
      if (p.archived) return;
      var target = projectTarget(state, p);
      var skus = state.skus.filter(function (s) { return s.projectId === p.id; });
      if (!skus.length) {
        var ph = blankSku({
          id: 'sku_' + p.id, projectId: p.id, customerId: p.customerId || null, code: projectSkuCode(p),
          name: p.name || p.title || p.company || 'SKU', description: p.description || '',
          createdAt: p.createdAt || at, updatedAt: at
        });
        if (!state.skus.some(function (s) { return s.id === ph.id; })) state.skus.push(ph);
        skus = [state.skus.find(function (s) { return s.id === ph.id; })];
        report.placeholderSkus += 1;
      }
      var first = skus[0];
      var pv = p.values || {};
      skus.forEach(function (s, i) {
        ensureSkuJobFields(s);
        if (!s.customerId) s.customerId = p.customerId || null;
        if (!s.dealId) s.dealId = p.leadId || null;
        s.legacyProjectId = p.id;
        if (!s.targetShipDate && p.targetShipDate) s.targetShipDate = p.targetShipDate;
        setSkuStage(state, s, target.production ? '' : target.skuStage, p.stageEnteredAt || at);
        if (target.production) s.jobPhase = 'production';
        if (i === 0) {
          SKU_VALUE_KEYS.forEach(function (k) {
            var add = Number(pv[k]) || 0;
            if (add) s.values[k] = (Number(s.values[k]) || 0) + add;
          });
        }
        pushSkuEvent(state, {
          id: 'sev_' + p.id + '_' + s.id + '_moved', skuId: s.id, at: at, who: 'migration', type: 'migrated',
          text: 'Moved from project ' + (p.name || p.title || p.id) + (i === 0 ? ' with its money, notes and tasks' : '') + '. The project is archived and kept.'
        });
        report.skusFromProjects += 1;
      });
      (p.notes || []).forEach(function (n, i) {
        if (!n) return;
        if (pushSkuEvent(state, {
          id: 'sev_' + p.id + '_note' + (i + 1), skuId: first.id, at: n.createdAt || p.createdAt || at, who: n.author || 'migration',
          type: 'note', text: String(n.text || ''), data: { fromProjectId: p.id, noteId: n.id || null }
        })) report.notesMoved += 1;
      });
      (state.tasks || []).forEach(function (t) {
        if (t.entityType === 'project' && t.entityId === p.id) {
          t.entityType = 'sku'; t.entityId = first.id; t.dealId = first.id; t.legacyProjectId = p.id;
          report.tasksToSkus += 1;
        }
      });
      var hasPoNumber = !!String(p.poNumber || '').trim();
      var poAmount = Number(pv.currentPo) || 0;
      if (hasPoNumber || poAmount > 0) {
        var poId = 'po_' + p.id;
        if (!state.customerPos.some(function (x) { return x.id === poId; })) {
          state.customerPos.push({
            id: poId, customerId: p.customerId || null, poNumber: String(p.poNumber || '').trim(), poDate: '', terms: '', fileId: null,
            status: 'open', notes: 'Created from project ' + (p.name || p.id) + ' when projects became SKU jobs.',
            legacyProjectId: p.id, createdAt: at, updatedAt: at,
            lines: [{
              id: 'pol_' + p.id, skuId: first.id, qty: '', unitPrice: '', amount: poAmount || '', shipDate: p.targetShipDate || '',
              stage: poStageAt(state, 0), status: 'open', stageEnteredAt: p.stageEnteredAt || at
            }]
          });
          report.posCreated += 1;
          pushSkuEvent(state, {
            id: 'sev_' + p.id + '_po', skuId: first.id, at: at, who: 'migration', type: 'po',
            text: 'Customer PO ' + (String(p.poNumber || '').trim() || '(no number)') + (poAmount ? ' for $' + poAmount.toLocaleString('en-US') : '') + ' carried over from the project'
          });
        }
      }
      p.archived = true;
      p.archivedAt = at;
      p.migratedToSkuIds = skus.map(function (s) { return s.id; });
      report.projectsArchived += 1;
    });
    if (!state.settings.skuJobs1) {
      state.settings.skuJobs1 = at;
      report.skuJobsFirstRun = true;
    }
  }

  function skuJobsLogLine(report) {
    return 'SKU jobs: ' + report.projectsArchived + ' projects archived into ' + report.skusFromProjects + ' SKU jobs (' +
      report.placeholderSkus + ' new), ' + report.notesMoved + ' notes and ' + report.tasksToSkus + ' tasks moved, ' +
      report.posCreated + ' customer POs, ' + report.leadsWon + ' leads marked won, ' + report.boardsAdded + ' boards added' +
      (report.quotesPickedUp ? ', ' + report.quotesPickedUp + ' held quotes picked up' : '');
  }

  // ---- Leads page (issue #4). Read-only helpers, no state changes. ----

  // The one place that decides whether a lead is still being worked. Converted, won or lost
  // leads, the Lost stage, project cards and internal Shop Needs cards are not active leads.
  var INACTIVE_LEAD_STATUSES = ['converted', 'won', 'lost'];
  function isActiveLead(d) {
    if (!d || d.kind === 'project' || d.type === 'internal') return false;
    if (INACTIVE_LEAD_STATUSES.indexOf(d.status) !== -1) return false;
    return d.stage !== 'lost';
  }

  // row: { title, company, contactName, contactEmail, boardId, stage, source }.
  // q matches title, company, contact name or email (case-insensitive). Empty filters match all.
  function leadRowMatches(row, q, filters) {
    var f = filters || {};
    if (f.board && row.boardId !== f.board) return false;
    if (f.stage && row.stage !== f.stage) return false;
    if (f.source && row.source !== f.source) return false;
    var needle = String(q || '').trim().toLowerCase();
    if (!needle) return true;
    return [row.title, row.company, row.contactName, row.contactEmail].some(function (v) {
      return String(v || '').toLowerCase().indexOf(needle) !== -1;
    });
  }

  // Sort rows by a key. Blank values always sort last. Returns a new array.
  function sortLeadRows(rows, key, dir) {
    var sign = dir === 'desc' ? -1 : 1;
    return rows.slice().sort(function (a, b) {
      var x = a[key], y = b[key];
      var xb = x === null || x === undefined || x === '', yb = y === null || y === undefined || y === '';
      if (xb || yb) return xb === yb ? 0 : (xb ? 1 : -1);
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * sign;
      return String(x).localeCompare(String(y)) * sign;
    });
  }

  // ---------------------------------------------------------------------
  // Saved views and the table view (issue #53). Pure and read-only except the savedViews helpers.
  // state.savedViews (optional) = [{ id, name, boardId, filter, createdBy, createdAt, updatedAt }],
  // shared by everyone in the workspace. The starter views are built in, never stored.
  // ---------------------------------------------------------------------
  var VIEW_COLUMNS = [
    ['company', 'Company'], ['contactName', 'Contact'], ['email', 'Email'], ['phone', 'Phone'], ['sourceLabel', 'Source'],
    ['stageLabel', 'Stage'], ['value', 'Value'], ['nextFollowUp', 'Next step date'], ['idleDays', 'Idle days'],
    ['missingCount', 'Missing core'], ['owner', 'Owner']
  ];
  var VIEW_FILTER_KEYS = ['q', 'stage', 'source', 'email', 'phone', 'emailOrPhone', 'nextStep', 'idleMin', 'valueMin', 'valueMax', 'quote'];
  var VIEW_QUOTE_STAGE = 'design-prototyping-quote-sent';
  var VIEW_STARTERS = [
    { id: 'starter-no-next-step', name: 'No next step', filter: { nextStep: 'none' } },
    { id: 'starter-quote-sent-quiet', name: 'Quote sent, no reply 7+ days', filter: { quote: 'sent', idleMin: 7 } },
    { id: 'starter-inbound-untouched', name: 'Inbound not touched in 24h', filter: { stage: INBOUND_SORT_STAGE, idleMin: 1 } },
    { id: 'starter-missing-contact', name: 'Missing email or phone', filter: { emailOrPhone: 'missing' } },
    { id: 'starter-overdue', name: 'Overdue next step', filter: { nextStep: 'overdue' } }
  ];

  // Keeps only known keys with usable values. Anything blank is dropped, so {} means no filter.
  function normalizeViewFilter(f) {
    var out = {};
    f = f || {};
    var s = function (v) { return String(v == null ? '' : v).trim(); };
    if (s(f.q)) out.q = s(f.q);
    if (s(f.stage)) out.stage = s(f.stage);
    if (s(f.source)) out.source = s(f.source);
    ['email', 'phone'].forEach(function (k) { if (f[k] === 'has' || f[k] === 'missing') out[k] = f[k]; });
    if (f.emailOrPhone === 'missing') out.emailOrPhone = 'missing';
    if (f.nextStep === 'none' || f.nextStep === 'overdue' || f.nextStep === 'week') out.nextStep = f.nextStep;
    if (f.quote === 'sent') out.quote = 'sent';
    ['idleMin', 'valueMin', 'valueMax'].forEach(function (k) {
      if (s(f[k]) === '') return;
      var n = Number(f[k]);
      if (isFinite(n) && n >= 0) out[k] = n;
    });
    return out;
  }

  function viewFilterIsEmpty(f) { return Object.keys(normalizeViewFilter(f)).length === 0; }

  // One table row per lead. o: { today 'YYYY-MM-DD', nowMs, terminalStages, leadValue(deal), stageLabel(stage),
  // sourceLabel(id) }. idleDays is whole days like the card chip (null when the lead has no activity date).
  function leadViewRow(state, deal, o) {
    o = o || {};
    var nowMs = o.nowMs != null ? o.nowMs : Date.now();
    var c = leadPrimaryContact(state, deal) || {};
    var then = Date.parse((deal && deal.lastActivityAt) || '');
    var title = (deal && ((deal.title && String(deal.title).trim()) || deal.company)) || 'Untitled';
    return {
      id: deal.id,
      title: title,
      company: (deal.company && String(deal.company).trim()) || title,
      contactName: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      source: deal.source || '',
      sourceLabel: o.sourceLabel ? o.sourceLabel(deal.source || '') : (deal.source || ''),
      stage: deal.stage || '',
      stageLabel: o.stageLabel ? o.stageLabel(deal.stage || '') : (deal.stage || ''),
      value: o.leadValue ? (Number(o.leadValue(deal)) || 0) : leadValueTotal(deal),
      nextFollowUp: isoDayOf(deal.nextFollowUp),
      idleDays: isNaN(then) ? null : Math.max(0, Math.floor((nowMs - then) / 86400000)),
      missingCount: leadCoreMissing(state, deal).length,
      owner: String(deal.owner || deal.ownerName || deal.assignee || '').trim(),
      lacksNextStep: lacksNextStep(state, deal, o.terminalStages || []),
      quoteSent: quoteSentState(state, deal) === 'sent' || deal.stage === VIEW_QUOTE_STAGE
    };
  }

  // Does one row pass the filter? today is 'YYYY-MM-DD'. "Idle N+ days" counts a lead with no activity date as idle,
  // the same as the board does. "Due this week" is today through six days out; overdue dates are not due.
  function viewRowMatches(row, filter, today) {
    var f = normalizeViewFilter(filter);
    if (f.stage && row.stage !== f.stage) return false;
    if (f.source && row.source !== f.source) return false;
    if (f.email === 'has' && !row.email) return false;
    if (f.email === 'missing' && row.email) return false;
    if (f.phone === 'has' && !row.phone) return false;
    if (f.phone === 'missing' && row.phone) return false;
    if (f.emailOrPhone === 'missing' && row.email && row.phone) return false;
    if (f.nextStep === 'none' && !row.lacksNextStep) return false;
    if (f.nextStep === 'overdue' && !(row.nextFollowUp && row.nextFollowUp < today)) return false;
    if (f.nextStep === 'week' && !(row.nextFollowUp && row.nextFollowUp >= today && row.nextFollowUp <= todayAddDays(today, 6))) return false;
    if (f.idleMin != null && row.idleDays != null && row.idleDays < f.idleMin) return false;
    if (f.valueMin != null && !(row.value >= f.valueMin)) return false;
    if (f.valueMax != null && !(row.value <= f.valueMax)) return false;
    if (f.quote === 'sent' && !row.quoteSent) return false;
    if (f.q) {
      var needle = f.q.toLowerCase();
      var hit = [row.title, row.company, row.contactName, row.email, row.phone].some(function (v) {
        return String(v || '').toLowerCase().indexOf(needle) !== -1;
      });
      if (!hit) return false;
    }
    return true;
  }

  function filterViewRows(rows, filter, today) {
    return rows.filter(function (r) { return viewRowMatches(r, filter, today); });
  }

  // Starter views that make sense on a board: the Inbound one only where its stage exists.
  function startersForBoard(boardStages) {
    return VIEW_STARTERS.filter(function (v) { return !v.filter.stage || (boardStages || []).indexOf(v.filter.stage) !== -1; });
  }

  // Saved views pinned under one board (stored order).
  function savedViewsForBoard(state, boardId) {
    return ((state && state.savedViews) || []).filter(function (v) { return v && v.boardId === boardId; });
  }

  // Add a named view. Names are unique per board (case-insensitive); a repeat name replaces that view's filter.
  // Returns { view, replaced } or { error }.
  function saveView(state, boardId, name, filter, o) {
    o = o || {};
    var nm = String(name || '').trim().slice(0, 60);
    if (!nm) return { error: 'Name the view first.' };
    if (!boardId) return { error: 'No board.' };
    var f = normalizeViewFilter(filter);
    if (!Object.keys(f).length) return { error: 'Set at least one filter before saving.' };
    if (!Array.isArray(state.savedViews)) state.savedViews = [];
    var at = o.at || nowIso();
    var same = state.savedViews.find(function (v) { return v && v.boardId === boardId && String(v.name).toLowerCase() === nm.toLowerCase(); });
    if (same) { same.filter = f; same.updatedAt = at; return { view: same, replaced: true }; }
    var view = { id: makeId('view'), name: nm, boardId: boardId, filter: f, createdBy: String(o.by || ''), createdAt: at, updatedAt: at };
    state.savedViews.push(view);
    return { view: view, replaced: false };
  }

  // Remove a saved view only. Never touches leads. Returns true when one was removed.
  function deleteView(state, viewId) {
    var list = state.savedViews;
    if (!Array.isArray(list)) return false;
    var i = list.findIndex(function (v) { return v && v.id === viewId; });
    if (i < 0) return false;
    list.splice(i, 1);
    return true;
  }

  // Table rows as CSV text (header plus one line per row). cols: [[key, label]]. Cells that would run as a
  // spreadsheet formula get a leading apostrophe; phone-like text is left alone.
  function viewRowsToCsv(rows, cols) {
    var cell = function (v) {
      var s = v == null ? '' : String(v);
      if (/^[=@]/.test(s) || (/^[+-]/.test(s) && !/^[+-]?[\d\s().-]+$/.test(s))) s = "'" + s;
      return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    var lines = [cols.map(function (c) { return cell(c[1]); }).join(',')];
    rows.forEach(function (r) { lines.push(cols.map(function (c) { return cell(r[c[0]]); }).join(',')); });
    return lines.join('\r\n') + '\r\n';
  }

  // ---------------------------------------------------------------------
  // Production views (issue #22). Active jobs, PO kickoff and By due date.
  // Additive: customerPos may carry kickoffStage and kickoff; materialLines may carry
  // poId, lineId, status, vendorPoNumber, expectedAt, receivedAt. Missing fields default on read.
  // ---------------------------------------------------------------------
  var KICKOFF_STAGES = [['received', 'Received'], ['acknowledged', 'Acknowledged'], ['material-ordered', 'Material ordered'],
    ['material-received', 'Material received'], ['scheduled', 'Scheduled'], ['in-production', 'In production'],
    ['shipped', 'Shipped'], ['closed', 'Closed']];
  var KICKOFF_ITEMS = [
    { id: 'acknowledge', label: 'Acknowledge PO to customer', stage: 'acknowledged' },
    { id: 'order-material', label: 'Order material', stage: 'material-ordered' },
    { id: 'material-received', label: 'Material received', stage: 'material-received' },
    { id: 'schedule', label: 'Schedule job', stage: 'scheduled' },
    { id: 'first-article', label: 'First article', optional: true, stage: null }
  ];
  // Kickoff columns that drive the PO lines' status (PO_LINE_STATUSES).
  var KICKOFF_LINE_STATUS = { 'in-production': 'in_production', shipped: 'shipped', closed: 'closed' };
  var MATERIAL_LINE_STATUSES = ['ordered', 'received', 'cancelled'];

  function kickoffStageIds() { return KICKOFF_STAGES.map(function (s) { return s[0]; }); }
  function kickoffStageLabel(id) {
    var s = KICKOFF_STAGES.find(function (x) { return x[0] === id; });
    return s ? s[1] : String(id || '');
  }

  // Old POs have no kickoffStage: read it from the lines (all closed, all shipped, any in production), else Received.
  function poKickoffStage(po) {
    if (po && kickoffStageIds().indexOf(po.kickoffStage) !== -1) return po.kickoffStage;
    var lines = (po && po.lines) || [];
    if (!lines.length) return po && po.status === 'closed' ? 'closed' : 'received';
    var st = lines.map(function (l) { return l.status || 'open'; });
    if (st.every(function (s) { return s === 'closed'; })) return 'closed';
    if (st.every(function (s) { return s === 'closed' || s === 'shipped'; })) return 'shipped';
    if (st.some(function (s) { return s === 'in_production' || s === 'shipped' || s === 'closed'; })) return 'in-production';
    return 'received';
  }

  // Checklist with defaults, never mutating the PO.
  function poKickoffItems(po) {
    var saved = (po && po.kickoff && po.kickoff.items) || {};
    return KICKOFF_ITEMS.map(function (it) {
      var s = saved[it.id] || {};
      return { id: it.id, label: it.label, optional: !!it.optional, done: !!s.done, at: s.at || '', by: s.by || '', note: s.note || '' };
    });
  }

  function kickoffProgress(po) {
    var items = poKickoffItems(po);
    return { done: items.filter(function (i) { return i.done; }).length, total: items.length };
  }

  // Tick or untick one checklist item. A ticked item moves kickoffStage forward to its column
  // (never back). Returns { changed, stageFrom, stageTo }.
  function setKickoffItem(po, itemId, done, o) {
    o = o || {};
    var def = KICKOFF_ITEMS.find(function (x) { return x.id === itemId; });
    if (!def) return { changed: false };
    if (!po.kickoff || typeof po.kickoff !== 'object') po.kickoff = {};
    if (!po.kickoff.items || typeof po.kickoff.items !== 'object') po.kickoff.items = {};
    var cur = po.kickoff.items[itemId] || {};
    var note = o.note != null ? String(o.note).trim() : (cur.note || '');
    if (!!cur.done === !!done && note === (cur.note || '')) return { changed: false };
    po.kickoff.items[itemId] = { done: !!done, at: done ? (o.at || nowIso()) : '', by: done ? String(o.by || '') : '', note: note };
    var out = { changed: true, stageFrom: poKickoffStage(po), stageTo: null };
    if (done && def.stage) {
      var ids = kickoffStageIds();
      if (ids.indexOf(def.stage) > ids.indexOf(out.stageFrom)) { po.kickoffStage = def.stage; out.stageTo = def.stage; }
    }
    return out;
  }

  // Move a PO card between kickoff columns. In production, Shipped and Closed bring the lines
  // forward to the matching status and Production stage; a line already further along stays.
  // Returns { changed, from, to, lines: [{ line, fromStage, toStage }] }.
  function setPoKickoffStage(state, po, stage, o) {
    o = o || {};
    if (kickoffStageIds().indexOf(stage) === -1) return { changed: false, lines: [] };
    var from = poKickoffStage(po);
    var out = { changed: from !== stage || po.kickoffStage !== stage, from: from, to: stage, lines: [] };
    po.kickoffStage = stage;
    var status = KICKOFF_LINE_STATUS[stage];
    if (status) {
      var target = PO_LINE_STATUSES.indexOf(status);
      var stages = poBoardStages(state);
      (po.lines || []).forEach(function (l) {
        if (PO_LINE_STATUSES.indexOf(l.status || 'open') >= target) return;
        var was = l.stage;
        l.status = status;
        if (stages[target]) { l.stage = stages[target]; }
        if (was !== l.stage) l.stageEnteredAt = o.at || nowIso();
        out.lines.push({ line: l, fromStage: was, toStage: l.stage });
      });
      if (status === 'closed' && (po.lines || []).length) po.status = 'closed';
    }
    if (out.changed || out.lines.length) po.updatedAt = o.at || nowIso();
    out.changed = out.changed || out.lines.length > 0;
    return out;
  }

  function isoDayOf(v) {
    var s = String(v || '').slice(0, 10);
    return isIsoDay(s) ? s : '';
  }
  function dayNum(iso) { return Math.round(Date.parse(iso + 'T00:00:00Z') / 86400000); }
  function daysBetween(fromIso, toIso) { return dayNum(toIso) - dayNum(fromIso); }
  function dueUrgency(daysLeft) {
    if (daysLeft == null) return '';
    if (daysLeft < 0) return 'overdue';
    if (daysLeft <= 7) return 'soon';
    return '';
  }
  function poLineDue(po, line) { return isoDayOf(line && line.shipDate) || isoDayOf(line && line.requiredDate) || isoDayOf(po && po.requiredDate); }

  // Rows for the Active view: every PO line not closed, plus SKU jobs on Operations boards.
  // today is YYYY-MM-DD. Sorted by due date (no date last).
  function activeProductionRows(state, today) {
    var rows = [];
    function row(r) {
      r.daysLeft = r.due ? daysBetween(today, r.due) : null;
      r.urgency = dueUrgency(r.daysLeft);
      rows.push(r);
    }
    (state.customerPos || []).forEach(function (po) {
      (po.lines || []).forEach(function (l) {
        if ((l.status || 'open') === 'closed') return;
        row({ kind: 'po-line', id: l.id, poId: po.id, lineId: l.id, customerId: po.customerId, skuId: l.skuId || '',
          poNumber: po.poNumber || '', qty: l.qty, due: poLineDue(po, l), stage: l.stage || '', value: poLineAmount(l) });
      });
    });
    (state.skus || []).forEach(function (s) {
      if (s.archived || !s.stage) return;
      var info = sectionAreaForStage(state, s.stage);
      if (!info.section || info.section.cardKind === 'po-line' || stageKindOf(state, s.stage) !== 'sku') return;
      var a = (state.areas || []).find(function (x) { return x && x.id === info.area; });
      var role = (a && a.role) || (info.area === 'floor-operations' || info.area === 'operations' ? 'operations' : '');
      if (role !== 'operations') return;
      row({ kind: 'sku', id: s.id, poId: '', lineId: '', customerId: s.customerId, skuId: s.id, poNumber: '',
        qty: '', due: isoDayOf(s.targetShipDate), stage: s.stage, value: Number(s.values && s.values.productionArr) || 0 });
    });
    return sortByDue(rows);
  }

  function sortByDue(rows) {
    return rows.sort(function (a, b) {
      if (!a.due !== !b.due) return a.due ? -1 : 1;
      return a.due === b.due ? 0 : (a.due < b.due ? -1 : 1);
    });
  }

  // Monday of the ISO week holding day d (YYYY-MM-DD).
  function weekStart(d) {
    var n = dayNum(d);
    var dow = (new Date(n * 86400000).getUTCDay() + 6) % 7;
    return n - dow;
  }
  var DUE_BUCKETS = [['overdue', 'Overdue'], ['this-week', 'This week'], ['next-week', 'Next week'], ['later', 'Later'], ['no-date', 'No date']];
  function dueBucketOf(due, today) {
    if (!due) return 'no-date';
    if (due < today) return 'overdue';
    var w = weekStart(today), n = dayNum(due);
    if (n < w + 7) return 'this-week';
    if (n < w + 14) return 'next-week';
    return 'later';
  }
  // Open PO lines grouped by due date. Returns [{ id, label, rows }] in bucket order, empty buckets kept.
  function poLinesByDue(state, today) {
    var rows = activeProductionRows(state, today).filter(function (r) { return r.kind === 'po-line'; });
    return DUE_BUCKETS.map(function (b) {
      return { id: b[0], label: b[1], rows: rows.filter(function (r) { return dueBucketOf(r.due, today) === b[0]; }) };
    });
  }

  // Material usage from a SKU's bill of materials: qty needed = line qty x qty per part x (1 + scrap).
  // pickQuote(materialId) returns the vendor quote to use (the app passes its Best current quote);
  // without one, the newest quote for the material. Lines already ordered for the same PO line and
  // material are left out, so running it twice adds nothing.
  function prefillMaterialLines(state, po, opts) {
    opts = opts || {};
    var out = [];
    var existing = (state.materialLines || []).filter(function (m) { return m.poId === po.id && m.status !== 'cancelled'; });
    function pick(materialId) {
      if (typeof opts.pickQuote === 'function') return opts.pickQuote(materialId) || null;
      var qs = (state.vendorQuotes || []).filter(function (q) { return q.materialId === materialId; });
      return qs.sort(function (a, b) { return String(b.quotedAt || b.createdAt || '').localeCompare(String(a.quotedAt || a.createdAt || '')); })[0] || null;
    }
    (po.lines || []).forEach(function (l) {
      if ((l.status || 'open') === 'closed') return;
      var sku = (state.skus || []).find(function (s) { return s.id === l.skuId; });
      var bom = ((sku && sku.bom) || []).filter(function (b) { return b.materialId; });
      var qty = num(l.qty);
      if (!bom.length) {
        if (existing.some(function (m) { return m.lineId === l.id && !m.materialId; })) return;
        out.push({ poId: po.id, lineId: l.id, skuId: l.skuId || '', materialId: '', qtyNeeded: '', unit: '', vendorId: '', vendorQuoteId: '',
          why: sku ? 'No bill of materials on ' + (sku.code || 'the SKU') : 'SKU missing' });
        return;
      }
      bom.forEach(function (b) {
        if (existing.some(function (m) { return m.lineId === l.id && m.materialId === b.materialId; })) return;
        var per = num(b.qtyPerPart);
        var need = qty != null && per != null ? Math.round(qty * per * (1 + (num(b.scrapPct) || 0) / 100) * 1000) / 1000 : '';
        var q = pick(b.materialId);
        out.push({ poId: po.id, lineId: l.id, skuId: l.skuId || '', materialId: b.materialId, qtyNeeded: need, unit: b.unit || '',
          vendorId: (q && q.vendorId) || '', vendorQuoteId: (q && q.id) || '',
          why: need === '' ? (qty == null ? 'Line has no qty' : 'No qty per part on the bill of materials') : '' });
      });
    });
    return out;
  }

  // Save prefilled lines as material lines (status ordered) and tick Order material.
  // Returns the new records. Never emails anyone.
  function orderMaterialForPo(state, po, drafts, o) {
    o = o || {};
    ensureArrays(state);
    var at = o.at || nowIso();
    var made = (drafts || []).map(function (d) {
      var rec = {
        id: makeId('ml'), poId: po.id, lineId: d.lineId || '', skuId: d.skuId || '', materialId: d.materialId || '',
        qtyNeeded: d.qtyNeeded === '' || d.qtyNeeded == null ? '' : Number(d.qtyNeeded), unit: d.unit || '',
        vendorId: d.vendorId || '', vendorQuoteId: d.vendorQuoteId || '', status: 'ordered',
        vendorPoNumber: String(d.vendorPoNumber || '').trim(), expectedAt: isoDayOf(d.expectedAt), receivedAt: '',
        createdAt: at, createdBy: String(o.by || ''), updatedAt: at
      };
      state.materialLines.push(rec);
      return rec;
    });
    if (made.length) setKickoffItem(po, 'order-material', true, { at: at, by: o.by });
    return made;
  }

  function materialLinesForPo(state, poId) {
    return (state.materialLines || []).filter(function (m) { return m.poId === poId; });
  }

  // Next business day after an ISO time (Sat and Sun skipped), as YYYY-MM-DD.
  function addBusinessDays(iso, n) {
    var d = dayNum(isoDayOf(iso));
    var left = n;
    while (left > 0) {
      d += 1;
      var dow = new Date(d * 86400000).getUTCDay();
      if (dow !== 0 && dow !== 6) left -= 1;
    }
    return new Date(d * 86400000).toISOString().slice(0, 10);
  }

  // #51: idle (rotting) days per stage and the next step guard. Stored in state.stageIdleDays
  // { stage: days }; a stage without a stored value uses the built-in default, then the global fallback.
  var DEFAULT_STAGE_IDLE_DAYS = {
    'inbound-jotform': 1, 'needs-quotation': 3, 'needs-updated-quotation': 3,
    'design-prototyping-quote-sent': 7, 'follow-up-negotiation': 7, 'won-awaiting-payment': 7, 'awaiting-payment': 7
  };

  function stageIdleDays(state, stage, fallback) {
    var own = state && state.stageIdleDays && state.stageIdleDays[stage];
    if (typeof own === 'number' && own >= 1) return own;
    if (DEFAULT_STAGE_IDLE_DAYS[stage]) return DEFAULT_STAGE_IDLE_DAYS[stage];
    return fallback;
  }

  // Empty or invalid clears the stage's own value. Returns the stored number or null.
  function setStageIdleDays(state, stage, days) {
    var n = Math.floor(Number(days));
    if (!state.stageIdleDays || typeof state.stageIdleDays !== 'object') state.stageIdleDays = {};
    if (!(n >= 1) || String(days).trim() === '') { delete state.stageIdleDays[stage]; return null; }
    state.stageIdleDays[stage] = Math.min(n, 365);
    return state.stageIdleDays[stage];
  }

  // Cold, Inbound and terminal stages (Lost included) never ask for a next step.
  function stageNeedsNextStep(state, stage, terminalStages) {
    if (!stage || stage === INBOUND_SORT_STAGE) return false;
    if (coldStages(state).indexOf(stage) !== -1) return false;
    return (terminalStages || []).indexOf(stage) === -1;
  }

  // ---------------------------------------------------------------------
  // Follow-up sweep (issue #134). Open deals in a stage that needs a next step and have no
  // nextFollowUp get one: today + the stage cadence in business days. Never overwrites a value.
  // ---------------------------------------------------------------------
  var FOLLOWUP_SWEEP_CADENCE = {
    'inbound-jotform': 1, 'needs-quote': 1, 'direct-email': 1, 'contact-made': 1, 'followup-needed': 1,
    'needs-updated-quotation': 2, 're-quote-needed': 2,
    'design-prototyping-quote-sent': 3, 'tooling-production-quoted': 3,
    'follow-up-negotiation': 4
  };
  var FOLLOWUP_SWEEP_DEFAULT_DAYS = 3;
  var FOLLOWUP_SWEEP_CAP = 60;
  // Same list as TERMINAL_STAGES in app.js (stages that never ask for a next step).
  var FOLLOWUP_SWEEP_TERMINAL = ['won-tooling-committed', 'production-po-received', 'handoff-to-operations', 'materials-ready',
    'first-articles', 'production-setup', 'lost', 'won'];
  var FOLLOWUP_SWEEP_ACTOR = 'system:followup-sweep';

  // Pure. Returns { ops: [{ dealId, nextFollowUp, reason }], skipped: { counts } }. At most opts.cap ops.
  function planFollowUpSweep(state, todayIso, opts) {
    opts = opts || {};
    var cap = opts.cap == null ? FOLLOWUP_SWEEP_CAP : opts.cap;
    var today = String(todayIso || '').slice(0, 10);
    var skipped = { notOpen: 0, notNeeded: 0, hasDate: 0, overCap: 0 };
    var ops = [];
    var cold = coldStages(state || {});
    ((state && state.deals) || []).forEach(function (d) {
      if (!d || d.status !== 'open' || d.archived) { skipped.notOpen += 1; return; }
      var st = d.stage;
      if (st === 'lost' || st === 'wishlist' || cold.indexOf(st) !== -1 || !stageNeedsNextStep(state, st, FOLLOWUP_SWEEP_TERMINAL)) { skipped.notNeeded += 1; return; }
      if (d.nextFollowUp != null && String(d.nextFollowUp).trim() !== '') { skipped.hasDate += 1; return; }
      if (ops.length >= cap) { skipped.overCap += 1; return; }
      var days = Object.prototype.hasOwnProperty.call(FOLLOWUP_SWEEP_CADENCE, st) ? FOLLOWUP_SWEEP_CADENCE[st] : FOLLOWUP_SWEEP_DEFAULT_DAYS;
      ops.push({ dealId: d.id, nextFollowUp: addBusinessDays(today, days), reason: 'stage cadence' });
    });
    return { ops: ops, skipped: skipped };
  }

  // Applies a plan to state: only nextFollowUp (when still blank), a timeline entry and a change log entry.
  function applyFollowUpSweep(state, plan, ctx) {
    ctx = ctx || {};
    var at = ctx.at || nowIso();
    var by = ctx.by || FOLLOWUP_SWEEP_ACTOR;
    var applied = 0;
    (plan.ops || []).forEach(function (op) {
      var deal = (state.deals || []).find(function (x) { return x && x.id === op.dealId; });
      if (!deal || (deal.nextFollowUp != null && String(deal.nextFollowUp).trim() !== '')) return;
      deal.nextFollowUp = op.nextFollowUp;
      deal.updatedAt = at;
      if (!Array.isArray(deal.timeline)) deal.timeline = [];
      var text = 'Next step date set to ' + op.nextFollowUp + ' by follow-up sweep (' + op.reason + ')';
      deal.timeline.push({ id: makeId('tl'), type: 'followup-sweep', text: text, at: at, source: by });
      if (!Array.isArray(state.changeLog)) state.changeLog = [];
      state.changeLog.push({
        id: makeId('chg'), at: at, who: by, by: by, actedFor: null, source: 'followup-sweep',
        action: 'next-step', entityType: 'lead', entityId: deal.id, field: 'nextFollowUp', oldValue: null, newValue: op.nextFollowUp, detail: text
      });
      applied += 1;
    });
    if (Array.isArray(state.changeLog) && state.changeLog.length > 500) state.changeLog = state.changeLog.slice(-500);
    return applied;
  }

  // True when moving a lead to targetStage must first collect a next step date.
  // date is the date that will be saved (form value, or the card's own for a drag).
  function needsNextStepOnMove(state, deal, targetStage, date, today, terminalStages) {
    if (!deal || deal.stage === targetStage) return false;
    if (!stageNeedsNextStep(state, targetStage, terminalStages)) return false;
    return !(date && String(date).slice(0, 10) >= today);
  }

  // Cards with no date in a stage that needs one get the "No next step" chip.
  function lacksNextStep(state, deal, terminalStages) {
    return stageNeedsNextStep(state, deal.stage, terminalStages) && !deal.nextFollowUp;
  }

  // ---------------------------------------------------------------------
  // Stage automations (issue #57). state.stageRules[stageId] = [rule]; absent means none.
  //   rule: { id, kind 'task'|'nextStep'|'checklist'|'project', createdAt, days, title, bucket, delegate, items }
  // Nothing is enabled by default: STAGE_RULE_SUGGESTIONS are offered in the stage editor only.
  // Per-card bookkeeping on the lead: ruleFires { ruleId: iso } (24h guard) and ruleEntryAt (the
  // stageEnteredAt already handled, so a sweep never fires the same entry twice).
  // ---------------------------------------------------------------------
  var STAGE_RULE_KINDS = ['task', 'nextStep', 'checklist', 'project'];
  var STAGE_RULE_KIND_LABEL = { task: 'Create task', nextStep: 'Set next step', checklist: 'Add checklist', project: 'Create project' };
  var STAGE_RULE_GUARD_MS = 24 * 3600 * 1000;
  var STAGE_RULE_DEFAULT_BUCKET = 'tasks-crm-follow-ups';
  var STAGE_RULE_SUGGESTIONS = {
    'needs-quotation': [{ kind: 'task', title: 'Quote {company}', days: 3 }],
    'design-prototyping-quote-sent': [{ kind: 'nextStep', title: 'Follow up on quote', days: 3 }],
    'samples-shipped': [{ kind: 'nextStep', title: 'Check sample feedback', days: 5 }],
    'won': [{ kind: 'project' }, { kind: 'task', title: 'Kickoff call with {contact}', days: 2 }],
    'won-tooling-committed': [{ kind: 'project' }, { kind: 'task', title: 'Kickoff call with {contact}', days: 2 }]
  };

  // {company}, {title}, {contact}. Unknown tokens stay as typed; a missing value becomes empty.
  function renderRuleTemplate(tpl, vars) {
    vars = vars || {};
    return String(tpl == null ? '' : tpl).replace(/\{(company|title|contact)\}/g, function (m, k) {
      return vars[k] == null ? '' : String(vars[k]);
    }).replace(/\s{2,}/g, ' ').replace(/\s+([,.:;])/g, '$1').trim();
  }

  // Clean a rule from the editor or from storage. Returns null when it cannot work.
  function normalizeStageRule(raw) {
    if (!raw || typeof raw !== 'object' || STAGE_RULE_KINDS.indexOf(raw.kind) === -1) return null;
    var r = { id: String(raw.id || ''), kind: raw.kind, createdAt: String(raw.createdAt || '') };
    var days = Math.floor(Number(raw.days));
    r.days = days >= 0 ? Math.min(days, 365) : 0;
    if (raw.kind === 'task' || raw.kind === 'nextStep') {
      r.title = String(raw.title || '').trim().slice(0, 200);
      if (!r.title) return null;
    }
    if (raw.kind === 'task') {
      r.bucket = String(raw.bucket || STAGE_RULE_DEFAULT_BUCKET);
      r.delegate = raw.delegate ? String(raw.delegate) : '';
    }
    if (raw.kind === 'checklist') {
      r.items = (Array.isArray(raw.items) ? raw.items : String(raw.items || '').split('\n'))
        .map(function (x) { return String(x == null ? '' : x).trim().slice(0, 200); }).filter(Boolean).slice(0, 20);
      if (!r.items.length) return null;
      delete r.days;
    }
    if (raw.kind === 'project') delete r.days;
    return r;
  }

  function stageRulesFor(state, stage) {
    var list = state && state.stageRules && state.stageRules[stage];
    return Array.isArray(list) ? list : [];
  }

  // Returns { ok, rule } or { ok:false, error }. Create project is for Won stages only.
  function addStageRule(state, stage, raw, at) {
    var r = normalizeStageRule(raw);
    if (!r) return { ok: false, error: 'Add a title (or checklist items).' };
    if (r.kind === 'project' && KPI_WON_STAGES.indexOf(stage) === -1) return { ok: false, error: 'Create project works on Won stages only.' };
    if (r.kind === 'project' && stageRulesFor(state, stage).some(function (x) { return x.kind === 'project'; })) return { ok: false, error: 'This stage already has a Create project rule.' };
    r.id = makeId('rule');
    r.createdAt = at || nowIso();
    if (!state.stageRules || typeof state.stageRules !== 'object') state.stageRules = {};
    if (!Array.isArray(state.stageRules[stage])) state.stageRules[stage] = [];
    state.stageRules[stage].push(r);
    return { ok: true, rule: r };
  }

  function removeStageRule(state, stage, ruleId) {
    var list = stageRulesFor(state, stage);
    var idx = list.findIndex(function (x) { return x.id === ruleId; });
    if (idx === -1) return false;
    list.splice(idx, 1);
    if (!list.length) delete state.stageRules[stage];
    return true;
  }

  // Suggestions for a stage that are not already in place (same kind and title).
  function stageRuleSuggestions(state, stage) {
    var have = stageRulesFor(state, stage);
    return (STAGE_RULE_SUGGESTIONS[stage] || []).filter(function (s) {
      return !have.some(function (r) { return r.kind === s.kind && (r.title || '') === (s.title || ''); });
    });
  }

  function stageRuleText(rule) {
    var d = rule.days + ' business day' + (rule.days === 1 ? '' : 's');
    if (rule.kind === 'task') return 'Create task "' + rule.title + '" due in ' + d + (rule.delegate ? ', delegate ' + rule.delegate : '');
    if (rule.kind === 'nextStep') return 'Set next step "' + rule.title + '" in ' + d;
    if (rule.kind === 'checklist') return 'Add checklist: ' + (rule.items || []).join(', ');
    return 'Create project (asks first)';
  }

  // True when the lead entered its stage and no rule pass has handled that entry yet.
  function stageEntryPending(deal) {
    return !!deal && !!deal.stageEnteredAt && deal.ruleEntryAt !== deal.stageEnteredAt;
  }

  // Run the rules of the lead's current stage for this entry.
  // o: { at, vars (company, title, contact), actor (for setRecordSection), nextStepHandled, bucketOk(id),
  //      delegateOk(name), newId(prefix), log(action, entityType, entityId, text) }
  // Returns { fired: [{ rule, kind, text }], confirms: [rule] }. Create project is never run here; it is returned
  // in confirms so the app can ask. Each rule fires once per entry and at most once per 24 hours per lead.
  function applyStageRules(state, deal, o) {
    o = o || {};
    var out = { fired: [], confirms: [] };
    if (!deal || deal.kind === 'project') return out;
    if ((deal.status === 'converted' || deal.status === 'won') && !o.allowWon) return out;
    // o.stage: run the rules of that stage instead (a lead dropped on a Won board stays on its CRM stage).
    // o.allowWon: the Mark won window just ran, so it was the confirmation; Create project is not asked again.
    var stage = o.stage || deal.stage;
    var at = o.at || nowIso();
    var entryAt = o.stage ? at : (deal.stageEnteredAt || at);
    var rules = stageRulesFor(state, stage);
    var log = o.log || function () {};
    var newId = o.newId || makeId;
    if (!deal.ruleFires || typeof deal.ruleFires !== 'object') deal.ruleFires = {};
    Object.keys(deal.ruleFires).forEach(function (k) {
      if (Date.parse(at) - Date.parse(deal.ruleFires[k]) > 2 * STAGE_RULE_GUARD_MS) delete deal.ruleFires[k];
    });
    rules.forEach(function (raw) {
      var rule = normalizeStageRule(raw);
      if (!rule) return;
      rule.id = raw.id;
      if (!raw.createdAt || String(entryAt) < String(raw.createdAt)) return; // entered before the rule existed
      var last = deal.ruleFires[rule.id];
      if (last && Date.parse(at) - Date.parse(last) < STAGE_RULE_GUARD_MS) return;
      var vars = o.vars || {};
      var day = at.slice(0, 10);
      var text = null;
      if (rule.kind === 'task') {
        var title = renderRuleTemplate(rule.title, vars) || rule.title;
        var dup = (state.tasks || []).some(function (t) {
          return t.ruleId === rule.id && t.dealId === deal.id && (!t.done || Date.parse(at) - Date.parse(t.createdAt || 0) < STAGE_RULE_GUARD_MS);
        });
        if (dup) return;
        var bucket = rule.bucket && (!o.bucketOk || o.bucketOk(rule.bucket)) ? rule.bucket : STAGE_RULE_DEFAULT_BUCKET;
        var delegate = rule.delegate && (!o.delegateOk || o.delegateOk(rule.delegate)) ? rule.delegate : null;
        var due = addBusinessDays(at, rule.days);
        if (!Array.isArray(state.tasks)) state.tasks = [];
        state.tasks.push({
          id: newId('t'), title: title, dueDate: due, done: false,
          dealId: deal.id, entityType: 'lead', entityId: deal.id, bucket: bucket,
          createdAt: at, completedAt: null, quadrant: null, personal: false, urgent: false,
          delegatedTo: delegate, decideOption: null, suppressed: false, dismissedAt: null, ruleId: rule.id
        });
        text = 'Created task "' + title + '" due ' + due + (delegate ? ', delegated to ' + delegate : '');
      } else if (rule.kind === 'nextStep') {
        if (o.allowWon || coldStages(state).indexOf(stage) !== -1) return; // Cold and won leads carry no follow-ups
        var date = addBusinessDays(at, rule.days);
        var nsText = renderRuleTemplate(rule.title, vars) || rule.title;
        if (o.nextStepHandled) {
          text = 'Next step prompt prefilled with "' + nsText + '" for ' + date;
        } else if (deal.nextFollowUp && String(deal.nextFollowUp).slice(0, 10) >= day) {
          text = 'Kept the existing next step date ' + String(deal.nextFollowUp).slice(0, 10) + ' (rule wanted "' + nsText + '" for ' + date + ')';
        } else {
          deal.nextFollowUp = date;
          setRecordSection(state, deal, 'lead', 'openItems', { nextStep: nsText }, o.actor);
          text = 'Set next step "' + nsText + '" for ' + date;
        }
      } else if (rule.kind === 'checklist') {
        if (!Array.isArray(deal.checklist)) deal.checklist = [];
        var fresh = rule.items.filter(function (it) {
          return !deal.checklist.some(function (c) { return c.ruleId === rule.id && c.text === it && !c.done; });
        });
        if (!fresh.length) return;
        fresh.forEach(function (it) { deal.checklist.push({ id: newId('chk'), text: it, done: false, ruleId: rule.id, addedAt: at }); });
        text = 'Added checklist of ' + fresh.length + ' item' + (fresh.length === 1 ? '' : 's');
      } else if (rule.kind === 'project') {
        if (o.allowWon || KPI_WON_STAGES.indexOf(stage) === -1) return;
        out.confirms.push(rule);
        deal.ruleFires[rule.id] = at;
        return;
      }
      deal.ruleFires[rule.id] = at;
      out.fired.push({ rule: rule, kind: rule.kind, text: text });
      log('rule', 'lead', deal.id, 'Rule ' + rule.id + ' (' + stage + '): ' + text);
    });
    if (!o.stage) deal.ruleEntryAt = deal.stageEnteredAt || at;
    return out;
  }

  // POs still in Received with no material ordered one business day after they came in.
  // Derived for Tasks > Operations > Order Raw Materials; nothing is stored.
  function posNeedingMaterial(state, today) {
    return (state.customerPos || []).filter(function (po) {
      if (poKickoffStage(po) !== 'received') return false;
      if (poKickoffItems(po).some(function (i) { return i.id === 'order-material' && i.done; })) return false;
      if (materialLinesForPo(state, po.id).some(function (m) { return m.status !== 'cancelled'; })) return false;
      var came = isoDayOf(po.createdAt) || isoDayOf(po.poDate);
      if (!came) return false;
      return today >= addBusinessDays(came, 1);
    });
  }

  // ---------------------------------------------------------------------
  // Today inbox (issue #52). One list of what needs the signed-in person today.
  // Items are derived, never stored. Per-user state lives in two optional keys of workspace/main:
  //   todaySnoozes[emailLower][itemKey] = untilIso  (YYYY-MM-DD: back on that day; a full ISO time works too)
  //   todayDone[emailLower][itemKey]    = { day, title, type }  (only today's entries are kept)
  // ---------------------------------------------------------------------
  var TODAY_QUOTE_STAGES = ['needs-quotation', 'needs-updated-quotation'];
  var TODAY_QUOTE_SLA_DAYS = 3;
  var TODAY_TYPE_RANK = { inbound: 0, followup: 1, quote: 2, task: 3, rotting: 4 };
  var TODAY_TYPE_LABEL = { inbound: 'New inbound', followup: 'Follow-up', quote: 'Quote', task: 'Task', rotting: 'Idle' };

  // ---------------------------------------------------------------------
  // Global search and quick log (issue #60). Pure, so it can be tested in node.
  // ---------------------------------------------------------------------
  var SEARCH_TYPES = [['lead', 'Leads and deals'], ['customer', 'Customers'], ['contact', 'Contacts'], ['sku', 'SKUs'], ['po', 'Customer POs'], ['vendor', 'Vendors'], ['material', 'Materials'], ['task', 'Tasks']];
  var SEARCH_PREFIXES = { l: 'lead', c: 'customer', p: 'po', s: 'sku', v: 'vendor' };

  function searchText(v) { return String(v == null ? '' : v).toLowerCase().replace(/\s+/g, ' ').trim(); }
  function searchDigits(v) { return String(v == null ? '' : v).replace(/\D+/g, ''); }

  // o: { stageLabel(stage) }. One entry per record: { type, id, kind, title, sub, f: [primary fields], notes, digits }.
  function buildSearchIndex(state, o) {
    o = o || {};
    var out = [];
    var custName = {};
    (state.customers || []).forEach(function (c) { if (c) custName[c.id] = c.name || ''; });
    var vendorName = {};
    (state.vendors || []).forEach(function (v) { if (v) vendorName[v.id] = v.name || ''; });
    function add(type, rec, title, sub, fields, extra) {
      var e = { type: type, id: rec.id, title: title || '', sub: sub || '', f: [], notes: '', digits: '' };
      [title].concat(fields || []).forEach(function (x) { var s = searchText(x); if (s) e.f.push(s); });
      if (extra) Object.keys(extra).forEach(function (k) { e[k] = extra[k]; });
      out.push(e);
    }
    var cards = (state.deals || []).concat((state.projects || []).filter(function (p) { return !p.archived; }));
    cards.forEach(function (d) {
      if (!d || !d.id) return;
      var title = d.title || d.name || d.company || 'Untitled';
      var notes = (d.notes || []).map(function (n) { return typeof n === 'string' ? n : (n && n.text) || ''; }).join(' ');
      var stage = o.stageLabel && d.stage ? o.stageLabel(d.stage) : d.stage || '';
      var cname = d.customerId ? custName[d.customerId] || '' : '';
      add('lead', d, title, [d.company && d.company !== title ? d.company : '', stage].filter(Boolean).join(' · '),
        [d.company, cname, d.poNumber], { kind: d.kind === 'project' ? 'project' : 'lead', notes: searchText(notes) });
    });
    (state.customers || []).forEach(function (c) { if (c && c.id) add('customer', c, c.name || 'Customer', '', []); });
    (state.contacts || []).forEach(function (c) {
      if (!c || !c.id) return;
      var org = custName[c.customerId] || vendorName[c.customerId] || '';
      add('contact', c, c.name || c.email || 'Contact', [org, c.email].filter(Boolean).join(' · '), [c.email, c.phone, org], { digits: searchDigits(c.phone) });
    });
    (state.skus || []).forEach(function (s) {
      if (!s || !s.id || s.archived) return;
      add('sku', s, (s.code ? s.code + ' ' : '') + (s.name || ''), custName[s.customerId] || '', [s.code, s.name]);
    });
    (state.customerPos || []).forEach(function (p) {
      if (!p || !p.id) return;
      add('po', p, 'PO ' + (p.poNumber || '(no number)'), custName[p.customerId] || '', [p.poNumber]);
    });
    (state.vendors || []).forEach(function (v) { if (v && v.id) add('vendor', v, v.name || 'Vendor', '', []); });
    (state.materials || []).forEach(function (m) { if (m && m.id) add('material', m, m.name || 'Material', m.type || '', [m.type]); });
    (state.tasks || []).forEach(function (t) {
      if (!t || !t.id || t.done) return;
      add('task', t, t.title || t.text || 'Task', t.dueDate || t.due || '', []);
    });
    return out;
  }

  // 0 when the token is nowhere in the entry. Exact > prefix > word prefix > contains. Notes count least.
  function searchTokenScore(e, tok, tokDigits) {
    var best = 0;
    for (var i = 0; i < e.f.length; i++) {
      var s = e.f[i], sc = 0;
      if (s === tok) sc = 100;
      else if (s.indexOf(tok) === 0) sc = 80;
      else if (s.indexOf(' ' + tok) !== -1) sc = 65;
      else if (s.indexOf(tok) !== -1) sc = 50;
      if (sc && i === 0) sc += 10;
      if (sc > best) best = sc;
    }
    if (tokDigits.length >= 3 && e.digits) {
      var di = e.digits.indexOf(tokDigits);
      var ds = di === 0 ? 70 : di > 0 ? 55 : 0;
      if (ds > best) best = ds;
    }
    if (!best && e.notes && e.notes.indexOf(tok) !== -1) best = 20;
    return best;
  }

  // Returns { filter, query, groups: [{ type, label, items: [entry] }], count }. Every word must match.
  function searchEntries(index, query, o) {
    o = o || {};
    var perType = o.perType || 6;
    var q = String(query || '').trim();
    var filter = null;
    var m = /^([lcpsv]):\s*(.*)$/i.exec(q);
    if (m) { filter = SEARCH_PREFIXES[m[1].toLowerCase()]; q = m[2].trim(); }
    var toks = searchText(q).split(' ').filter(Boolean);
    var by = {};
    index.forEach(function (e) {
      if (filter && e.type !== filter) return;
      var score = 0;
      if (toks.length) {
        var sum = 0;
        for (var i = 0; i < toks.length; i++) {
          var s = searchTokenScore(e, toks[i], searchDigits(toks[i]));
          if (!s) { sum = 0; break; }
          sum += s;
        }
        if (!sum) return;
        score = sum / toks.length;
        if (toks.length > 1 && e.f[0] === toks.join(' ')) score += 20;
      } else if (!filter) return;
      (by[e.type] = by[e.type] || []).push({ e: e, s: score });
    });
    var groups = [], count = 0;
    SEARCH_TYPES.forEach(function (t) {
      var list = by[t[0]];
      if (!list) return;
      list.sort(function (a, b) { return b.s - a.s || a.e.title.localeCompare(b.e.title); });
      var items = list.slice(0, perType).map(function (x) { return x.e; });
      count += items.length;
      groups.push({ type: t[0], label: t[1], items: items, total: list.length, best: list[0].s });
    });
    // The strongest match comes first, so Enter opens the best hit. Ties keep the fixed type order.
    groups = groups.map(function (g, i) { return { g: g, i: i }; }).sort(function (a, b) { return b.g.best - a.g.best || a.i - b.i; }).map(function (x) { return x.g; });
    return { filter: filter, query: q, groups: groups, count: count };
  }

  var QUICK_LOG_KINDS = [['call', 'Call'], ['meeting', 'Meeting'], ['note', 'Note']];
  var QUICK_LOG_OUTCOMES = [['connected', 'Connected'], ['voicemail', 'Voicemail'], ['no-answer', 'No answer'], ['follow-up', 'Follow-up needed']];

  // Where a quick log lands. A lead or project logs on itself. A contact logs on its newest open lead,
  // else its customer, else itself. Returns { rec, entityType, label, contact } or null.
  function quickLogTarget(state, type, id) {
    var byId = function (list) { return (list || []).find(function (x) { return x && x.id === id; }) || null; };
    if (type === 'lead' || type === 'project') {
      var d = byId(state.deals) || byId(state.projects);
      return d ? { rec: d, entityType: d.kind === 'project' ? 'project' : 'lead', label: d.title || d.name || d.company || 'Untitled', contact: null } : null;
    }
    if (type === 'customer') {
      var cu = byId(state.customers);
      return cu ? { rec: cu, entityType: 'customer', label: cu.name || 'Customer', contact: null } : null;
    }
    if (type !== 'contact') return null;
    var c = byId(state.contacts);
    if (!c) return null;
    var open = (state.deals || []).filter(function (d) {
      return d && isActiveLead(d) && (d.primaryContactId === c.id || (d.contactIds || []).indexOf(c.id) !== -1);
    }).sort(function (a, b) { return String(b.lastActivityAt || b.updatedAt || '').localeCompare(String(a.lastActivityAt || a.updatedAt || '')); });
    if (open.length) return { rec: open[0], entityType: 'lead', label: open[0].title || open[0].company || 'Untitled', contact: c };
    var cust = (state.customers || []).find(function (x) { return x && x.id === c.customerId; });
    if (cust) return { rec: cust, entityType: 'customer', label: cust.name || 'Customer', contact: c };
    return { rec: c, entityType: 'contact', label: c.name || c.email || 'Contact', contact: c };
  }

  // raw: { kind: call|meeting|note, outcome, note, nextStep: 'YYYY-MM-DD', contactName }.
  // Adds a timeline entry and a change log line. A lead or project also gets lastActivityAt (idle days
  // reset) and, when given, the next step date. Never duplicates or deletes anything.
  function quickLog(state, rec, entityType, raw, opts) {
    var o = sectionOpts(opts);
    raw = raw || {};
    var kind = QUICK_LOG_KINDS.find(function (k) { return k[0] === raw.kind; });
    if (!kind) return { entry: null, error: 'Pick call, meeting or note.' };
    var outcome = QUICK_LOG_OUTCOMES.find(function (x) { return x[0] === raw.outcome; });
    if (raw.outcome && !outcome) return { entry: null, error: 'Pick an outcome from the list.' };
    var next = String(raw.nextStep || '').trim();
    if (next && !/^\d{4}-\d{2}-\d{2}$/.test(next)) return { entry: null, error: 'Use a date like 2026-09-23.' };
    var note = String(raw.note || '').trim();
    var who = String(raw.contactName || '').trim();
    var text = kind[1] + (who ? ' with ' + who : '') + (outcome ? ', ' + outcome[1].toLowerCase() : '') + (note ? ': ' + note : '');
    if (!Array.isArray(rec.timeline)) rec.timeline = [];
    var e = { id: makeId('tl'), type: kind[0], text: text, at: o.at, source: o.by };
    if (outcome) e.outcome = outcome[0];
    rec.timeline.push(e);
    rec.updatedAt = o.at;
    var isCard = entityType === 'lead' || entityType === 'project';
    if (isCard) { rec.lastActivityAt = o.at; rec.customerActivityAt = o.at; }
    sectionLog(state, o, entityType, rec, 'add', 'timeline', null, text, recLabel(rec) + ' quick log: ' + clip(text));
    var nextSet = false;
    if (next && isCard && coldStages(state).indexOf(rec.stage) === -1 && (rec.nextFollowUp || '') !== next) {
      var old = rec.nextFollowUp || null;
      rec.nextFollowUp = next;
      sectionLog(state, o, entityType, rec, 'update', 'nextFollowUp', old, next, recLabel(rec) + ' next step date ' + next + ' (quick log)');
      nextSet = true;
    }
    return { entry: e, nextSet: nextSet };
  }

  function todayItemKey(kind, id) { return kind + ':' + id; }

  function todayAddDays(ymd, n) { return new Date((dayNum(ymd) + n) * 86400000).toISOString().slice(0, 10); }

  // o: { today: 'YYYY-MM-DD', nowMs, cards: open leads and projects, tasks: tasks due today or flagged,
  //      terminalStages, rotDays, stageLabel(stage), cardTitle(card) }
  // One item per lead and one per task; a lead with several reasons shows them together.
  function collectTodayItems(state, o) {
    o = o || {};
    var today = o.today;
    var nowMs = o.nowMs != null ? o.nowMs : Date.now();
    var terminal = o.terminalStages || [];
    var cold = coldStages(state);
    var label = o.stageLabel || function (s) { return s; };
    var titleOf = o.cardTitle || function (c) { return c.title || c.company || 'Untitled'; };
    var items = [];
    (o.cards || []).forEach(function (c) {
      if (!c || !c.stage || terminal.indexOf(c.stage) !== -1 || cold.indexOf(c.stage) !== -1) return;
      var isLead = c.kind !== 'project';
      var reasons = [];
      var next = isoDayOf(c.nextFollowUp);
      if (isLead && c.stage === INBOUND_SORT_STAGE && c.createdAt) {
        var made = Date.parse(c.createdAt);
        if (!isNaN(made) && nowMs - made >= 0 && nowMs - made < 24 * 3600000) {
          reasons.push({ type: 'inbound', text: 'New inbound lead', age: (nowMs - made) / 86400000 });
        }
      }
      if (next && next <= today) {
        var overdue = daysBetween(next, today);
        reasons.push({ type: 'followup', text: overdue > 0 ? 'Next step overdue by ' + overdue + ' day' + (overdue === 1 ? '' : 's') : 'Next step due today', age: overdue });
      }
      if (isLead && TODAY_QUOTE_STAGES.indexOf(c.stage) !== -1) {
        var entered = isoDayOf(c.stageEnteredAt || c.updatedAt || c.createdAt);
        var inStage = entered ? daysBetween(entered, today) : 0;
        if (inStage >= TODAY_QUOTE_SLA_DAYS) reasons.push({ type: 'quote', text: 'Quote waiting ' + inStage + ' days (SLA ' + TODAY_QUOTE_SLA_DAYS + ')', age: inStage });
      }
      var lastMs = c.lastActivityAt ? Date.parse(c.lastActivityAt) : NaN;
      var idle = isNaN(lastMs) ? Infinity : Math.floor((nowMs - lastMs) / 86400000);
      var threshold = stageIdleDays(state, c.stage, o.rotDays || 14);
      if (idle >= threshold) {
        reasons.push({ type: 'rotting', text: idle === Infinity ? 'Idle ' + threshold + '+ days' : 'Idle ' + idle + ' day' + (idle === 1 ? '' : 's'), age: idle === Infinity ? threshold : idle });
      }
      if (!reasons.length) return;
      reasons.sort(function (a, b) { return TODAY_TYPE_RANK[a.type] - TODAY_TYPE_RANK[b.type]; });
      items.push({
        key: todayItemKey(isLead ? 'lead' : 'project', c.id), kind: isLead ? 'lead' : 'project', id: c.id,
        type: reasons[0].type, typeLabel: TODAY_TYPE_LABEL[reasons[0].type],
        title: titleOf(c), company: c.company || '', stage: c.stage, stageLabel: label(c.stage),
        why: reasons.map(function (r) { return r.text; }).join('. '), age: reasons[0].age
      });
    });
    var leadItemIds = {};
    items.forEach(function (it) { leadItemIds[it.id] = true; });
    (o.tasks || []).forEach(function (t) {
      if (!t || t.done) return;
      // Auto tasks made from a lead's next step or quote stage are the lead item already.
      if (t.virtual && t.dealId && leadItemIds[t.dealId]) return;
      var due = isoDayOf(t.dueDate);
      var late = due && due < today ? daysBetween(due, today) : 0;
      items.push({
        key: todayItemKey('task', t.id), kind: 'task', id: t.id, dealId: t.dealId || null,
        type: 'task', typeLabel: TODAY_TYPE_LABEL.task, title: t.title, company: '', stage: '', stageLabel: '',
        why: late ? 'Overdue by ' + late + ' day' + (late === 1 ? '' : 's') : (due === today ? 'Due today' : 'Flagged Today'), age: late
      });
    });
    items.sort(function (a, b) {
      if (TODAY_TYPE_RANK[a.type] !== TODAY_TYPE_RANK[b.type]) return TODAY_TYPE_RANK[a.type] - TODAY_TYPE_RANK[b.type];
      // newest inbound first, otherwise the most overdue first
      return a.type === 'inbound' ? a.age - b.age : b.age - a.age;
    });
    return items;
  }

  function todayEmailKey(email) { return String(email || 'local').trim().toLowerCase(); }

  function snoozeIsActive(until, today, nowIsoStr) {
    var u = String(until || '');
    if (!u) return false;
    return u.length > 10 ? u > (nowIsoStr || today + 'T12:00:00.000Z') : u > today;
  }

  // Active (not yet expired) snoozes for one person: { itemKey: untilIso }.
  function activeSnoozes(state, email, today, nowIsoStr) {
    var mine = (state.todaySnoozes || {})[todayEmailKey(email)] || {};
    var out = {};
    Object.keys(mine).forEach(function (k) { if (snoozeIsActive(mine[k], today, nowIsoStr)) out[k] = mine[k]; });
    return out;
  }

  function todayDoneMap(state, email, today) {
    var mine = (state.todayDone || {})[todayEmailKey(email)] || {};
    var out = {};
    Object.keys(mine).forEach(function (k) { if (mine[k] && mine[k].day === today) out[k] = mine[k]; });
    return out;
  }

  // Splits derived items into the three tabs for one person.
  function splitTodayItems(state, email, items, today, nowIsoStr) {
    var snz = activeSnoozes(state, email, today, nowIsoStr);
    var done = todayDoneMap(state, email, today);
    var res = { today: [], snoozed: [], done: [] };
    items.forEach(function (it) {
      if (done[it.key]) return;
      if (snz[it.key]) res.snoozed.push(Object.assign({}, it, { until: snz[it.key] }));
      else res.today.push(it);
    });
    Object.keys(done).forEach(function (k) {
      res.done.push({ key: k, type: done[k].type || '', typeLabel: TODAY_TYPE_LABEL[done[k].type] || 'Done', title: done[k].title || k, why: 'Done today' });
    });
    return res;
  }

  // choice: '1d' | '3d' | 'monday' | 'date' (with custom). Returns YYYY-MM-DD, or '' for a bad or past date.
  function snoozeUntilFor(choice, today, custom) {
    if (choice === '1d') return todayAddDays(today, 1);
    if (choice === '3d') return todayAddDays(today, 3);
    if (choice === 'monday') {
      var dow = new Date(dayNum(today) * 86400000).getUTCDay();
      return todayAddDays(today, (8 - dow) % 7 || 7);
    }
    if (choice === 'date') {
      var d = isoDayOf(custom);
      return d && d > today ? d : '';
    }
    return '';
  }

  // Writes one person's snooze and drops their expired entries. Returns the stored value.
  function setTodaySnooze(state, email, key, until, today, nowIsoStr) {
    if (!state.todaySnoozes || typeof state.todaySnoozes !== 'object') state.todaySnoozes = {};
    var kept = activeSnoozes(state, email, today, nowIsoStr);
    kept[key] = until;
    state.todaySnoozes[todayEmailKey(email)] = kept;
    return until;
  }

  function clearTodaySnooze(state, email, key) {
    var mine = (state.todaySnoozes || {})[todayEmailKey(email)];
    if (mine && mine[key] !== undefined) { delete mine[key]; return true; }
    return false;
  }

  // Records Done for today and drops this person's older entries.
  function markTodayDone(state, email, item, today) {
    if (!state.todayDone || typeof state.todayDone !== 'object') state.todayDone = {};
    var kept = todayDoneMap(state, email, today);
    kept[item.key] = { day: today, title: item.title || '', type: item.type || '' };
    state.todayDone[todayEmailKey(email)] = kept;
    return kept[item.key];
  }

  // ---------------------------------------------------------------------
  // Delegate-to list (issue #45). The Tasks Delegate popover lists state.delegatees.
  // Pure helpers: validate a new list and apply it. A rename moves tasks delegated to the
  // old name to the new one; a removal never touches tasks.
  // ---------------------------------------------------------------------
  function cleanDelegateName(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

  // rows: [{ from: old name or null for a new one, name }] in the new order.
  // Returns { list } or { error }.
  function validateDelegateRows(rows) {
    var list = [];
    var seen = {};
    for (var i = 0; i < (rows || []).length; i++) {
      var name = cleanDelegateName(rows[i] && rows[i].name);
      if (!name) return { error: 'Names cannot be blank (row ' + (i + 1) + ')' };
      var k = name.toLowerCase();
      if (seen[k]) return { error: name + ' is on the list twice' };
      seen[k] = true;
      list.push(name);
    }
    if (!list.length) return { error: 'Keep at least one delegate' };
    return { list: list };
  }

  // Apply the edited rows to state. Returns { error } or
  // { list, added: [names], removed: [names], renamed: [{ from, to, tasks }], reordered, changed }.
  function applyDelegateRows(state, rows) {
    var v = validateDelegateRows(rows);
    if (v.error) return { error: v.error };
    var before = Array.isArray(state.delegatees) ? state.delegatees.slice() : [];
    var kept = {};
    var renamed = [], added = [];
    rows.forEach(function (r, i) {
      var name = v.list[i];
      var from = r.from != null ? cleanDelegateName(r.from) : null;
      if (from && before.indexOf(from) !== -1) {
        kept[from] = true;
        if (from !== name) {
          var n = 0;
          (state.tasks || []).forEach(function (t) {
            if (t && t.delegatedTo === from) { t.delegatedTo = name; n += 1; }
          });
          renamed.push({ from: from, to: name, tasks: n });
        }
      } else {
        added.push(name);
      }
    });
    var removed = before.filter(function (n) { return !kept[n]; });
    var reordered = !renamed.length && !added.length && !removed.length && before.join('\n') !== v.list.join('\n');
    state.delegatees = v.list;
    return { list: v.list, added: added, removed: removed, renamed: renamed, reordered: reordered,
      changed: !!(renamed.length || added.length || removed.length || reordered) };
  }

  // ---------------------------------------------------------------------
  // Billing accounts (issue #41). Pass-through charges per customer (shipping labels, rush
  // fees, surcharges) from unbilled to invoiced to paid. Stored in workspace state as
  // billingEntries; missing means []. Entries are never deleted: void keeps them out of totals.
  // ---------------------------------------------------------------------
  // deposit, design, prototype, tooling: up-front payments on a lead (issue #96; tooling also comes with #55).
  var BILLING_CATEGORIES = ['shipping', 'rush', 'material', 'deposit', 'design', 'prototype', 'tooling', 'other'];
  var BILLING_STATUSES = ['unbilled', 'invoiced', 'paid'];
  var BILLING_EDIT_FIELDS = ['customerId', 'date', 'description', 'amount', 'breakdown', 'category', 'ref', 'shipTo', 'dealId', 'skuJobId', 'dueDate'];

  function ensureBillingEntries(state) {
    if (!Array.isArray(state.billingEntries)) state.billingEntries = [];
    return state.billingEntries;
  }

  // Dollars to cents and back, so 84.10 + 16.00 is exactly 100.10.
  function roundCents(v) {
    var n = typeof v === 'string' ? Number(v.replace(/[$,\s]/g, '')) : Number(v);
    if (v === '' || v == null || !isFinite(n)) return null;
    return Math.round(n * 100) / 100;
  }

  // Clean and check one entry's editable fields. Returns { fields } or { error }.
  function cleanBillingFields(state, input, partial) {
    input = input || {};
    var out = {};
    function has(k) { return !partial || Object.prototype.hasOwnProperty.call(input, k); }
    if (has('customerId')) {
      var cid = String(input.customerId || '').trim();
      if (!cid || !(state.customers || []).some(function (c) { return c.id === cid; })) return { error: 'Pick an existing customer' };
      out.customerId = cid;
    }
    if (has('date')) {
      var d = String(input.date || '').trim();
      if (!isIsoDay(d)) return { error: 'Date must be YYYY-MM-DD' };
      out.date = d;
    }
    if (has('description')) {
      var desc = String(input.description || '').trim();
      if (!desc) return { error: 'Add a description' };
      out.description = desc;
    }
    if (has('amount')) {
      var amt = roundCents(input.amount);
      if (amt == null || amt === 0) return { error: 'Amount must be a number other than 0' };
      out.amount = amt;
    }
    if (has('category')) {
      var cat = String(input.category || 'other').trim().toLowerCase();
      if (BILLING_CATEGORIES.indexOf(cat) === -1) return { error: 'Unknown category ' + cat };
      out.category = cat;
    }
    ['breakdown', 'ref', 'shipTo', 'dealId', 'skuJobId'].forEach(function (k) {
      if (has(k)) out[k] = String(input[k] == null ? '' : input[k]).trim();
    });
    // Optional due date (issue #101): blank, or YYYY-MM-DD.
    if (Object.prototype.hasOwnProperty.call(input, 'dueDate')) {
      var due = String(input.dueDate || '').trim();
      if (due && !isIsoDay(due)) return { error: 'Due date must be YYYY-MM-DD' };
      out.dueDate = due;
    }
    return { fields: out };
  }

  // Add a charge. o: { by, at }. Returns { entry } or { error }; writes nothing on error.
  function addBillingEntry(state, input, o) {
    o = o || {};
    var c = cleanBillingFields(state, input, false);
    if (c.error) return { error: c.error };
    var at = o.at || nowIso();
    var e = Object.assign({ id: makeId('bill') }, c.fields, {
      status: 'unbilled', invoiceRef: '', invoicedAt: '', paidAt: '',
      voided: false, voidedAt: '', voidedBy: '', voidReason: '',
      createdAt: at, createdBy: String(o.by || ''), updatedAt: at
    });
    ensureBillingEntries(state).push(e);
    return { entry: e };
  }

  function findBillingEntry(state, id) {
    return (state.billingEntries || []).find(function (e) { return e.id === id; }) || null;
  }

  // Edit fields of one entry. Returns { entry, changes: [{ field, from, to }] } or { error }.
  function updateBillingEntry(state, id, patch, o) {
    o = o || {};
    var e = findBillingEntry(state, id);
    if (!e) return { error: 'Entry not found' };
    if (e.voided) return { error: 'This entry is void' };
    var p = {};
    BILLING_EDIT_FIELDS.forEach(function (k) { if (patch && Object.prototype.hasOwnProperty.call(patch, k)) p[k] = patch[k]; });
    var c = cleanBillingFields(state, p, true);
    if (c.error) return { error: c.error };
    var changes = [];
    Object.keys(c.fields).forEach(function (k) {
      var from = e[k] == null ? '' : e[k];
      if (from === c.fields[k]) return;
      changes.push({ field: k, from: from, to: c.fields[k] });
      e[k] = c.fields[k];
    });
    if (changes.length) e.updatedAt = o.at || nowIso();
    return { entry: e, changes: changes };
  }

  // Set the status of one or more entries. Invoiced needs an invoice ref.
  // Returns { changed: [{ id, from, to }], skipped: [{ id, reason }] } or { error }.
  function setBillingStatus(state, ids, status, o) {
    o = o || {};
    if (BILLING_STATUSES.indexOf(status) === -1) return { error: 'Unknown status ' + status };
    var ref = String(o.invoiceRef || '').trim();
    if (status === 'invoiced' && !ref) return { error: 'Add the invoice ref' };
    var due = String(o.dueDate || '').trim();
    if (due && !isIsoDay(due)) return { error: 'Due date must be YYYY-MM-DD' };
    var at = o.at || nowIso();
    var out = { changed: [], skipped: [] };
    toList(ids).forEach(function (id) {
      var e = findBillingEntry(state, id);
      if (!e) { out.skipped.push({ id: id, reason: 'not found' }); return; }
      if (e.voided) { out.skipped.push({ id: id, reason: 'void' }); return; }
      if (e.status === status && (status !== 'invoiced' || e.invoiceRef === ref)) { out.skipped.push({ id: id, reason: 'already ' + status }); return; }
      var from = e.status || 'unbilled';
      e.status = status;
      if (status === 'invoiced') { e.invoiceRef = ref; e.invoicedAt = at; if (due) e.dueDate = due; }
      if (status === 'paid') { e.paidAt = at; e.paidAmount = Number(e.amount) || 0; if (ref) e.invoiceRef = ref; }
      e.updatedAt = at;
      out.changed.push({ id: id, from: from, to: status, invoiceRef: e.invoiceRef || '' });
    });
    return out;
  }

  // ---------------------------------------------------------------------
  // Write API billingUpserts (issues #55, #124). One billing write op: HelperBot posts pass-through charges and
  // Billing records each Bank invoice on a deal, so markPaid has a charge to match. A line is created, or
  // updated when its key exists: externalId, else bank:<bankInvoiceId>:<dealId or customerId>. Status and paid
  // amount only move forward. Never deletes or voids, never moves cards (markPaid does that). A line is
  // rejected alone; dryRun works on a copy.
  // ---------------------------------------------------------------------
  var BILLING_STATUS_RANK = { unbilled: 0, invoiced: 1, paid: 2 };

  function findBillingCustomer(state, line) {
    var customers = state.customers || [];
    if (line.customerId) {
      var id = String(line.customerId).trim();
      var byId = customers.find(function (c) { return c.id === id; });
      return byId ? { customer: byId } : { error: 'Customer not found: ' + id };
    }
    var name = String(line.customerName || '').trim().toLowerCase();
    if (!name) return { error: 'Give customerId, customerName or a dealId with a customer' };
    var hits = customers.filter(function (c) {
      if (String(c.name || '').trim().toLowerCase() === name) return true;
      return (state.contacts || []).some(function (p) { return p.customerId === c.id && String(p.name || '').trim().toLowerCase() === name; });
    });
    if (!hits.length) return { error: 'No customer matches ' + line.customerName };
    if (hits.length > 1) return { error: 'Several customers match ' + line.customerName + ': ' + hits.map(function (c) { return c.id; }).join(', ') };
    return { customer: hits[0] };
  }

  function billingUpsertKey(line, customerId) {
    var ext = String(line.externalId == null ? '' : line.externalId).trim();
    if (ext) return ext;
    var inv = String(line.bankInvoiceId == null ? '' : line.bankInvoiceId).trim().toLowerCase();
    return inv ? 'bank:' + inv + ':' + (String(line.dealId || '').trim() || customerId) : '';
  }

  // Check one line. Returns { fields, status, invoiceRef, paidAmount, paidAt, bankInvoiceId, key } or { error }.
  function cleanBillingUpsertLine(state, raw, existing) {
    var deal = null, dealId = String(raw.dealId == null ? '' : raw.dealId).trim();
    if (dealId) {
      deal = (state.deals || []).find(function (d) { return d && d.id === dealId; }) || null;
      if (!deal || deal.kind === 'project' || deal.type === 'internal') return { error: 'Lead not found: ' + dealId };
    }
    var cust;
    if (raw.customerId || raw.customerName) cust = findBillingCustomer(state, raw);
    else if (deal && deal.customerId) cust = findBillingCustomer(state, { customerId: deal.customerId });
    else if (existing) cust = findBillingCustomer(state, { customerId: existing.customerId });
    else cust = findBillingCustomer(state, raw);
    if (cust.error) return { error: cust.error };
    if (deal && deal.customerId && deal.customerId !== cust.customer.id) return { error: 'Lead ' + dealId + ' belongs to customer ' + deal.customerId + ', not ' + cust.customer.id };
    var inv = String(raw.bankInvoiceId == null ? '' : raw.bankInvoiceId).trim();
    if (inv.length > 80) return { error: 'bankInvoiceId is too long' };
    var input = { customerId: cust.customer.id };
    var date = raw.issuedDate != null ? raw.issuedDate : raw.date;
    if (date != null || !existing) input.date = date;
    if (raw.description != null || !existing) input.description = raw.description != null ? raw.description : (inv ? 'Bank invoice ' + inv : '');
    if (raw.amount != null || !existing) input.amount = raw.amount;
    if (raw.category != null || !existing) input.category = raw.category;
    ['breakdown', 'ref', 'shipTo', 'skuJobId', 'dueDate'].forEach(function (k) { if (raw[k] != null) input[k] = raw[k]; });
    if (dealId) input.dealId = dealId;
    var c = cleanBillingFields(state, input, !!existing);
    if (c.error) return { error: c.error };
    var link = raw.link == null ? null : String(raw.link).trim();
    if (link && !/^https?:\/\/\S+$/i.test(link)) return { error: 'Link must start with http:// or https://' };
    if (link != null) c.fields.link = link;
    var amount = c.fields.amount != null ? c.fields.amount : Number(existing && existing.amount) || 0;
    var status = raw.status != null ? String(raw.status).trim().toLowerCase() : (existing ? existing.status || 'unbilled' : (inv ? 'invoiced' : 'unbilled'));
    if (BILLING_STATUSES.indexOf(status) === -1) return { error: 'Status must be unbilled, invoiced or paid' };
    var invoiceRef = inv || String(raw.invoiceRef == null ? (existing && existing.invoiceRef) || '' : raw.invoiceRef).trim();
    if (status !== 'unbilled' && !invoiceRef) return { error: 'An invoiced or paid charge needs bankInvoiceId or invoiceRef' };
    var paidAmount = raw.paidAmount != null ? roundCents(raw.paidAmount) : (status === 'paid' ? amount : (existing ? Number(existing.paidAmount) || 0 : 0));
    if (paidAmount == null || paidAmount < 0) return { error: 'paidAmount must be 0 or more' };
    if (amount > 0 && cents(paidAmount) > cents(amount)) return { error: 'paidAmount is more than amount' };
    if (status === 'paid' && amount > 0 && cents(paidAmount) < cents(amount)) return { error: 'A paid charge needs paidAmount equal to amount; use status invoiced for a partial payment' };
    if (status === 'unbilled' && paidAmount > 0) return { error: 'An unbilled charge cannot have a paid amount' };
    var paidAt = raw.paidDate != null ? String(raw.paidDate).trim() : (existing ? existing.paidAt || '' : '');
    if (paidAt && !isIsoDay(paidAt)) return { error: 'paidDate must be YYYY-MM-DD' };
    if (status === 'paid' && !paidAt) return { error: 'A paid charge needs paidDate' };
    return { fields: c.fields, status: status, invoiceRef: invoiceRef, paidAmount: paidAmount, paidAt: paidAt, bankInvoiceId: inv, customerId: cust.customer.id };
  }

  // lines: billingUpserts. opts: { by, actedFor, isAdmin, frozen, dryRun, at }.
  function applyBillingUpserts(state, lines, opts) {
    opts = opts || {};
    var at = opts.at || nowIso();
    var by = String(opts.by || 'unknown').toLowerCase();
    var summary = { lines: 0, created: [], updated: [], unchanged: [], skipped: [], rejected: [], frozen: false };
    lines = Array.isArray(lines) ? lines : [];
    summary.lines = lines.length;
    if (opts.frozen && !opts.isAdmin) { summary.frozen = true; return { summary: summary }; }
    var work = opts.dryRun ? JSON.parse(JSON.stringify(state)) : state;
    var entries = ensureBillingEntries(work);
    ensureArrays(work);
    var logs = [];
    lines.forEach(function (raw, i) {
      raw = raw && typeof raw === 'object' ? raw : {};
      function reject(msg) { summary.rejected.push({ index: i, externalId: String(raw.externalId || ''), bankInvoiceId: String(raw.bankInvoiceId || ''), error: msg }); }
      // Find the entry this line updates: by key, or one live charge already on the lead with this Bank invoice ref.
      var custGuess = raw.customerId || (raw.dealId && ((work.deals || []).find(function (d) { return d && d.id === raw.dealId; }) || {}).customerId) ||
        (raw.customerName ? (findBillingCustomer(work, raw).customer || {}).id : '') || '';
      var key = billingUpsertKey(raw, custGuess);
      var existing = key ? entries.find(function (e) { return e.externalId === key; }) : null;
      if (!existing && raw.bankInvoiceId && raw.dealId) {
        var ref = String(raw.bankInvoiceId).trim().toLowerCase();
        var same = entries.filter(function (e) { return !e.externalId && e.dealId === raw.dealId && String(e.invoiceRef || '').trim().toLowerCase() === ref; });
        if (same.length > 1) return reject('Several charges on ' + raw.dealId + ' already carry invoice ' + raw.bankInvoiceId + ': ' + same.map(function (e) { return e.id; }).join(', '));
        if (same.length === 1) existing = same[0];
      }
      if (existing && existing.voided) { summary.skipped.push({ index: i, id: existing.id, key: key, reason: 'void' }); return; }
      var c = cleanBillingUpsertLine(work, raw, existing);
      if (c.error) return reject(c.error);
      if (!key) key = '';
      if (!existing) {
        var res = addBillingEntry(work, c.fields, { by: by, at: at });
        if (res.error) return reject(res.error);
        var e = res.entry;
        if (c.fields.link) e.link = c.fields.link;
        if (key) e.externalId = key;
        if (c.bankInvoiceId) e.bankInvoiceId = c.bankInvoiceId;
        e.status = c.status;
        if (c.status !== 'unbilled') { e.invoiceRef = c.invoiceRef; e.invoicedAt = c.fields.date; }
        if (c.paidAmount) e.paidAmount = c.paidAmount;
        if (c.paidAt) e.paidAt = c.paidAt;
        summary.created.push({ index: i, id: e.id, key: key, customerId: e.customerId, dealId: e.dealId || '', amount: e.amount, status: e.status });
        logs.push({ id: e.id, detail: 'Charge added: ' + (e.invoiceRef ? 'invoice ' + e.invoiceRef + ', ' : '') + e.amount.toFixed(2) + ', ' + e.status });
        return;
      }
      // Update: status and paid amount only move forward; amount is fixed once something is paid.
      var from = existing.status || 'unbilled';
      if (BILLING_STATUS_RANK[c.status] < BILLING_STATUS_RANK[from]) return reject('Status cannot go back from ' + from + ' to ' + c.status + ' (' + existing.id + ')');
      if (cents(c.paidAmount) < cents(existing.paidAmount)) return reject('paidAmount cannot go down (' + existing.id + ')');
      if (c.fields.amount != null && cents(c.fields.amount) !== cents(existing.amount) && (cents(existing.paidAmount) > 0 || from === 'paid')) return reject('Amount cannot change after a payment (' + existing.id + ')');
      if (c.fields.customerId && c.fields.customerId !== existing.customerId) return reject('Charge ' + existing.id + ' belongs to customer ' + existing.customerId);
      if (c.fields.dealId && existing.dealId && c.fields.dealId !== existing.dealId) return reject('Charge ' + existing.id + ' is on lead ' + existing.dealId);
      var changes = [];
      function set(k, v) {
        var was = existing[k] == null ? '' : existing[k];
        if (was === v || (typeof v === 'number' && cents(was) === cents(v))) return;
        changes.push({ field: k, from: was, to: v });
        existing[k] = v;
      }
      Object.keys(c.fields).forEach(function (k) { set(k, c.fields[k]); });
      if (key && !existing.externalId) set('externalId', key);
      if (c.bankInvoiceId) set('bankInvoiceId', c.bankInvoiceId);
      set('status', c.status);
      if (c.status !== 'unbilled') { set('invoiceRef', c.invoiceRef); if (!existing.invoicedAt) set('invoicedAt', existing.date || at); }
      set('paidAmount', c.paidAmount);
      if (c.paidAt) set('paidAt', c.paidAt);
      if (!changes.length) { summary.unchanged.push({ index: i, id: existing.id, key: key }); return; }
      existing.updatedAt = at;
      summary.updated.push({ index: i, id: existing.id, key: key, changes: changes });
      logs.push({ id: existing.id, detail: 'Charge updated: ' + changes.map(function (x) { return x.field + ' ' + x.from + ' to ' + x.to; }).join(', ') });
    });
    if (!opts.dryRun && logs.length) {
      var actedFor = opts.actedFor ? String(opts.actedFor).toLowerCase() : null;
      logs.forEach(function (l) {
        state.changeLog.push({
          id: makeId('chg'), at: at, who: by, by: by, actedFor: actedFor, source: 'billing-api', action: 'billing',
          entityType: 'billing', entityId: l.id, field: null, oldValue: null, newValue: null, detail: l.detail
        });
      });
      if (state.changeLog.length > ENRICH_LOG_CAP) state.changeLog = state.changeLog.slice(state.changeLog.length - ENRICH_LOG_CAP);
    }
    return { summary: summary };
  }

  function billingSummaryLines(s) {
    if (s.frozen) return ['Bot writes are frozen. Nothing was posted.'];
    var out = [s.lines + ' charge(s): ' + s.created.length + ' created, ' + s.updated.length + ' updated, ' + s.unchanged.length + ' unchanged, ' +
      s.skipped.length + ' skipped, ' + s.rejected.length + ' rejected.'];
    s.rejected.forEach(function (r) { out.push('Rejected line ' + (r.index + 1) + (r.bankInvoiceId ? ' (' + r.bankInvoiceId + ')' : r.externalId ? ' (' + r.externalId + ')' : '') + ': ' + r.error + '.'); });
    s.skipped.forEach(function (r) { out.push('Skipped line ' + (r.index + 1) + ': ' + r.id + ' is ' + r.reason + '.'); });
    return out;
  }

  // Void keeps the entry, greys it out and leaves it out of totals. A reason is required.
  function voidBillingEntry(state, id, reason, o) {
    o = o || {};
    var e = findBillingEntry(state, id);
    if (!e) return { error: 'Entry not found' };
    if (e.voided) return { error: 'Already void' };
    var r = String(reason || '').trim();
    if (!r) return { error: 'Say why it is void' };
    var at = o.at || nowIso();
    e.voided = true; e.voidedAt = at; e.voidedBy = String(o.by || ''); e.voidReason = r; e.updatedAt = at;
    return { entry: e };
  }

  // ---------------------------------------------------------------------
  // Awaiting Payment moves (issue #101). An invoice sent for a lead moves its SKU jobs to Awaiting
  // Payment; once every invoiced charge linked to the lead is paid they move on to the stage the paid
  // categories imply (Design/Deposit: Design, Prototype: Prototyping, Tooling: Tooling). A partial
  // payment (entry.paidAmount below amount) leaves them in place with a "Partial paid $X of $Y" chip.
  // ---------------------------------------------------------------------
  var AWAITING_CATEGORY_STAGE = { deposit: 0, design: 0, prototype: 1, tooling: 2 };

  function cents(v) { return Math.round((Number(v) || 0) * 100); }
  function billingOpenAmount(e) { return Math.max(0, cents(e.amount) - cents(e.paidAmount)) / 100; }

  function leadSkus(state, deal) {
    return (state.skus || []).filter(function (k) { return k && !k.archived && k.dealId === deal.id; });
  }

  // Live (not void) billing entries linked to the lead, by dealId or by one of its SKU jobs.
  function leadBillingEntries(state, deal) {
    var ids = {};
    leadSkus(state, deal).forEach(function (k) { ids[k.id] = true; });
    return (state.billingEntries || []).filter(function (e) {
      return e && !e.voided && (e.dealId === deal.id || (e.skuJobId && ids[e.skuJobId]));
    });
  }

  // { open, invoiced, invoiceRefs, openAmount, total, paid, partial, dueDate, overdue }
  function invoiceInfo(state, deal, nowIsoStr) {
    var entries = leadBillingEntries(state, deal);
    var inv = entries.filter(function (e) { return e.status === 'invoiced'; });
    var paidEntries = entries.filter(function (e) { return e.status === 'paid'; });
    var out = { open: inv.length > 0, invoiced: inv.length, invoiceRefs: [], openAmount: 0, total: 0, paid: 0, partial: false, dueDate: '', overdue: false };
    var openC = 0, totalC = 0, paidC = 0;
    inv.forEach(function (e) {
      openC += cents(e.amount) - cents(e.paidAmount); totalC += cents(e.amount); paidC += cents(e.paidAmount);
      if (e.invoiceRef && out.invoiceRefs.indexOf(e.invoiceRef) === -1) out.invoiceRefs.push(e.invoiceRef);
      if (e.dueDate && (!out.dueDate || e.dueDate < out.dueDate)) out.dueDate = e.dueDate;
    });
    paidEntries.forEach(function (e) { totalC += cents(e.amount); paidC += cents(e.amount); });
    out.openAmount = openC / 100; out.total = totalC / 100; out.paid = paidC / 100;
    out.partial = out.open && paidC > 0;
    out.overdue = !!(out.open && out.dueDate && out.dueDate < pacificDay(nowIsoStr));
    return out;
  }

  function skuOnPreProduction(state, k) {
    return !!(k && !k.archived && k.stage && stageKindOf(state, k.stage) === 'sku');
  }

  function moveSkuLogged(state, k, stage, o, text) {
    var from = k.stage || '';
    setSkuStage(state, k, stage, o.at);
    k.updatedAt = o.at;
    pushSkuEvent(state, { id: makeId('sev'), skuId: k.id, at: o.at, who: o.by, type: 'stage', text: text, data: { from: from, to: stage } });
    return from;
  }

  // Invoice sent: the lead's SKU jobs on Pre-Production go to Awaiting Payment. Returns [{ skuId, from, to }].
  function sendLeadToAwaitingPayment(state, deal, o) {
    o = o || {}; o.at = o.at || nowIso(); o.by = o.by || 'user';
    ensureArrays(state);
    var moved = [];
    if (skuBoardStages(state).indexOf(AWAITING_STAGE) === -1) return moved;
    leadSkus(state, deal).forEach(function (k) {
      if (!skuOnPreProduction(state, k) || k.stage === AWAITING_STAGE) return;
      var from = moveSkuLogged(state, k, AWAITING_STAGE, o, 'Invoice sent' + (o.invoiceRef ? ' (' + o.invoiceRef + ')' : '') + ': moved to Awaiting Payment');
      moved.push({ skuId: k.id, from: from, to: AWAITING_STAGE });
    });
    if (moved.length) {
      state.changeLog.push({
        id: makeId('chg'), at: o.at, who: o.by, by: o.by, source: o.source || 'human', action: 'stage', entityType: 'lead', entityId: deal.id,
        field: 'stage', oldValue: moved[0].from, newValue: AWAITING_STAGE,
        detail: 'Stage ' + moved[0].from + ' to ' + AWAITING_STAGE + ' (invoice sent, ' + moved.length + ' SKU job(s))'
      });
    }
    return moved;
  }

  // The stage a SKU job leaves Awaiting Payment for: the earliest the paid categories imply. Entries paid
  // since the job arrived count; if none carries a date after that, every paid entry counts.
  function paidTargetStage(state, deal, k) {
    var paid = leadBillingEntries(state, deal).filter(function (e) { return e.status === 'paid'; });
    var since = paid.filter(function (e) { return !k.stageEnteredAt || String(e.paidAt || '') >= String(k.stageEnteredAt).slice(0, 10); });
    var idxs = (since.length ? since : paid).map(function (e) { return AWAITING_CATEGORY_STAGE[e.category]; })
      .filter(function (i) { return i !== undefined; });
    return skuStageAt(state, idxs.length ? Math.min.apply(null, idxs) : 0);
  }

  // Paid: when no invoiced charge is left open, the lead's Awaiting Payment jobs move on.
  // o.toStage forces the target. Returns { moved: [...], open, partial, info }.
  function settleAwaitingPayment(state, deal, o) {
    o = o || {}; o.at = o.at || nowIso(); o.by = o.by || 'user';
    ensureArrays(state);
    var info = invoiceInfo(state, deal, o.at);
    var out = { moved: [], open: info.open, partial: info.partial, info: info };
    if (info.open) return out;
    leadSkus(state, deal).forEach(function (k) {
      if (k.stage !== AWAITING_STAGE) return;
      var to = o.toStage || paidTargetStage(state, deal, k);
      if (!to || to === AWAITING_STAGE) return;
      var from = moveSkuLogged(state, k, to, o, 'Paid: moved from Awaiting Payment to ' + (state.stageLabels && state.stageLabels[to] || to));
      out.moved.push({ skuId: k.id, from: from, to: to });
    });
    if (out.moved.length) {
      state.changeLog.push({
        id: makeId('chg'), at: o.at, who: o.by, by: o.by, source: o.source || 'human', action: 'stage', entityType: 'lead', entityId: deal.id,
        field: 'stage', oldValue: AWAITING_STAGE, newValue: out.moved[0].to,
        detail: 'Stage ' + AWAITING_STAGE + ' to ' + out.moved[0].to + ' (invoice paid, ' + out.moved.length + ' SKU job(s))'
      });
    }
    return out;
  }

  // Admin sweep: leads with an open invoice that are not in Awaiting Payment.
  // Not won yet: kind 'markWon' (Mark won with start stage Awaiting Payment). Won: kind 'move' with the SKU jobs to move.
  function openInvoiceNotAwaiting(state, nowIsoStr) {
    var out = [];
    (state.deals || []).forEach(function (d) {
      if (!d || d.kind === 'project' || d.type === 'internal') return;
      var info = invoiceInfo(state, d, nowIsoStr);
      if (!info.open) return;
      if (!isClosedLead(d)) { if (!isLostLead(state, d)) out.push({ deal: d, kind: 'markWon', skuIds: [], info: info }); return; }
      var ids = leadSkus(state, d).filter(function (k) { return skuOnPreProduction(state, k) && k.stage !== AWAITING_STAGE; }).map(function (k) { return k.id; });
      if (ids.length) out.push({ deal: d, kind: 'move', skuIds: ids, info: info });
    });
    return out;
  }

  function isLostLead(state, d) {
    var lost = (state.stages || []).filter(function (s) { return /^lost/.test(s); });
    return lost.indexOf(d.stage) !== -1 || d.status === 'lost';
  }

  // Write API markPaid (issue #101): Billing reports a Bank invoice paid. Validates first (throws status 400).
  // The invoiced charges with that invoice ref take the amount in order; the lead's Awaiting Payment jobs move
  // to the Pre-Production start stage once nothing is open; deal.cs.csStage becomes Paid (never moved back from
  // a later CS stage); a timeline note and a change log line record it.
  // o: { bankInvoiceId, paidDate, amount, by, actedFor, at }.
  function applyMarkPaid(state, deal, o) {
    o = o || {};
    function bad(msg) { var e = new Error(msg); e.status = 400; return e; }
    var inv = typeof o.bankInvoiceId === 'string' ? o.bankInvoiceId.trim() : '';
    if (!inv || inv.length > 80) throw bad('markPaid needs bankInvoiceId (the Bank invoice id)');
    if (!isIsoDay(o.paidDate)) throw bad('markPaid needs paidDate as YYYY-MM-DD');
    var amt = typeof o.amount === 'number' ? o.amount : roundCents(o.amount);
    if (amt == null || !isFinite(amt) || amt <= 0) throw bad('markPaid needs amount above 0');
    amt = Math.round(amt * 100) / 100;
    if (!deal || deal.kind === 'project' || deal.type === 'internal') throw bad('markPaid needs a lead');
    ensureArrays(state);
    var at = o.at || nowIso(), by = o.by || 'bot';
    var key = inv.toLowerCase();
    var mine = leadBillingEntries(state, deal).filter(function (e) { return String(e.invoiceRef || '').trim().toLowerCase() === key; });
    // Issue #124: no invoiced charge with this ref on the lead is a 409 and changes nothing. A charge already
    // paid in full under this ref is a repeat: a no-op that writes nothing.
    var openMine = mine.filter(function (e) { return e.status === 'invoiced' && cents(e.amount) - cents(e.paidAmount) > 0; });
    if (!openMine.length) {
      if (mine.some(function (e) { return e.status === 'paid'; })) {
        var cs0 = deal.cs || {};
        return { matched: [], settled: true, partial: false, moved: [], overpaid: 0, csStage: cs0.csStage || null, alreadyPaid: true };
      }
      var nm = new Error('no invoiced charge matches bankInvoiceId'); nm.status = 409; throw nm;
    }
    var left = cents(amt), matched = [];
    mine.filter(function (e) { return e.status === 'invoiced'; }).forEach(function (e) {
      if (left <= 0) return;
      var take = Math.min(left, cents(e.amount) - cents(e.paidAmount));
      if (take <= 0) return;
      e.paidAmount = (cents(e.paidAmount) + take) / 100;
      left -= take;
      if (cents(e.paidAmount) >= cents(e.amount)) { e.status = 'paid'; e.paidAt = o.paidDate; }
      e.updatedAt = at;
      matched.push(e.id);
    });
    var start = skuStageAt(state, 0);
    var res = settleAwaitingPayment(state, deal, { at: at, by: by, source: 'write-api', toStage: start });
    var settled = !res.open;
    var out = { matched: matched, settled: settled, partial: res.open, moved: res.moved, overpaid: left > 0 && matched.length > 0 ? left / 100 : 0, csStage: null, alreadyPaid: !matched.length && mine.length > 0 };
    if (settled) {
      var cs = csEnsure(deal);
      cs.bankInvoiceId = inv; cs.paidDate = o.paidDate;
      if (!cs.csStage || cs.csStage === 'Payment pending' || cs.csStage === 'Paid') {
        if (cs.csStage !== 'Paid') csLog(state, deal, { at: at, by: by, actedFor: o.actedFor }, 'cs.csStage', cs.csStage || null, 'Paid', 'Customer Success stage ' + (cs.csStage || '(none)') + ' to Paid');
        cs.csStage = 'Paid';
      }
      out.csStage = cs.csStage;
    }
    var text = 'Payment received: Bank invoice ' + inv + ', ' + amt.toFixed(2) + ' on ' + o.paidDate + (settled ? '' : ' (partial, invoice still open)') +
      (res.moved.length ? '. ' + res.moved.length + ' SKU job(s) moved to ' + (state.stageLabels && state.stageLabels[start] || start) : '');
    if (!Array.isArray(deal.notes)) deal.notes = [];
    deal.notes.push({ id: makeId('note'), text: text, createdAt: at, source: by });
    deal.updatedAt = at;
    state.changeLog.push({
      id: makeId('chg'), at: at, who: by, by: by, actedFor: o.actedFor || null, source: 'write-api', action: 'paid',
      entityType: 'lead', entityId: deal.id, field: 'invoice', oldValue: null, newValue: inv, detail: text
    });
    if (state.changeLog.length > 500) state.changeLog = state.changeLog.slice(-500);
    return out;
  }

  // Write API moveSku (issue #101): move one SKU job of a lead to a Pre-Production stage. Validates (throws 400/404).
  function applyMoveSku(state, deal, o) {
    o = o || {};
    function bad(msg, status) { var e = new Error(msg); e.status = status || 400; return e; }
    var sku = (state.skus || []).find(function (k) { return k && k.id === o.skuId; });
    if (!o.skuId || !sku || sku.dealId !== deal.id) throw bad('moveSku: SKU job ' + o.skuId + ' is not on lead ' + deal.id, 404);
    if (!o.stage || stageKindOf(state, o.stage) !== 'sku') throw bad('moveSku: ' + o.stage + ' is not a Pre-Production SKU stage');
    if (sku.archived || !skuOnPreProduction(state, sku)) throw bad('moveSku: SKU job ' + sku.id + ' is not on Pre-Production');
    var at = o.at || nowIso(), by = o.by || 'bot';
    if (sku.stage === o.stage) return { skuId: sku.id, from: sku.stage, to: o.stage, changed: false };
    var from = moveSkuLogged(state, sku, o.stage, { at: at, by: by }, 'Moved to ' + (state.stageLabels && state.stageLabels[o.stage] || o.stage) + ' (write API)');
    state.changeLog.push({
      id: makeId('chg'), at: at, who: by, by: by, actedFor: o.actedFor || null, source: 'write-api', action: 'stage', entityType: 'sku', entityId: sku.id,
      field: 'stage', oldValue: from, newValue: o.stage, detail: 'Stage ' + from + ' to ' + o.stage
    });
    return { skuId: sku.id, from: from, to: o.stage, changed: true };
  }

  // Totals by status, void entries left out. Sums in cents.
  function billingTotals(entries) {
    var cents = { unbilled: 0, invoiced: 0, paid: 0 };
    var count = 0, voided = 0;
    toList(entries).forEach(function (e) {
      if (!e) return;
      if (e.voided) { voided += 1; return; }
      count += 1;
      var s = BILLING_STATUSES.indexOf(e.status) === -1 ? 'unbilled' : e.status;
      cents[s] += Math.round((Number(e.amount) || 0) * 100);
    });
    return { unbilled: cents.unbilled / 100, invoiced: cents.invoiced / 100, paid: cents.paid / 100, open: (cents.unbilled + cents.invoiced) / 100, count: count, voided: voided };
  }

  function billingEntriesFor(state, customerId) {
    return (state.billingEntries || []).filter(function (e) { return e.customerId === customerId; })
      .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)); });
  }

  // One row per customer with entries: unbilled, invoiced not paid, last entry date. Unbilled first.
  function billingAccounts(state) {
    var by = {};
    (state.billingEntries || []).forEach(function (e) { (by[e.customerId] = by[e.customerId] || []).push(e); });
    return Object.keys(by).map(function (cid) {
      var list = by[cid];
      var t = billingTotals(list);
      var last = list.filter(function (e) { return !e.voided; }).map(function (e) { return e.date; }).sort().pop() || '';
      var c = (state.customers || []).find(function (x) { return x.id === cid; });
      return { customerId: cid, name: c ? c.name : cid, unbilled: t.unbilled, invoiced: t.invoiced, paid: t.paid, count: t.count, lastDate: last };
    }).sort(function (a, b) { return (b.unbilled - a.unbilled) || String(a.name).localeCompare(String(b.name)); });
  }

  // A UPS tracking number (1Z + 16) links to UPS tracking; anything else has no link.
  function billingRefUrl(ref) {
    var r = String(ref || '').replace(/\s+/g, '').toUpperCase();
    return /^1Z[0-9A-Z]{16}$/.test(r) ? 'https://www.ups.com/track?tracknum=' + r : '';
  }

  // ---------------------------------------------------------------------
  // Sales deep dive (issue #56). Everything is computed from existing data; nothing is stored except an
  // optional per-stage probability in state.stageMeta[stage].probability (percent, 0 to 100).
  // ---------------------------------------------------------------------
  var KPI_WON_STAGES = ['won', 'won-tooling-committed'];
  var KPI_QUOTE_NEEDED = 'needs-quotation';
  var KPI_QUOTE_SENT = 'design-prototyping-quote-sent';
  var KPI_QUOTE_SLA_DAYS = 3;
  var KPI_DEFAULT_PROBABILITY = { 'needs-quotation': 10, 'design-prototyping-quote-sent': 30, 'follow-up-negotiation': 50, invoicing: 90, 'won-awaiting-payment': 95, 'awaiting-payment': 95 };
  var KPI_DAY = 86400000;

  function stageProbability(state, stage) {
    var meta = state && state.stageMeta && state.stageMeta[stage];
    if (meta && meta.probability != null && meta.probability !== '') {
      var n = Number(meta.probability);
      if (isFinite(n) && n >= 0 && n <= 100) return n;
    }
    return KPI_DEFAULT_PROBABILITY[stage] != null ? KPI_DEFAULT_PROBABILITY[stage] : null;
  }

  // Sets or clears (blank) a stage's probability. Returns { ok, value } or { ok: false, error }.
  function setStageProbability(state, stage, raw) {
    if (!state.stageMeta || typeof state.stageMeta !== 'object') state.stageMeta = {};
    var s = String(raw == null ? '' : raw).replace('%', '').trim();
    if (s === '') {
      if (state.stageMeta[stage]) delete state.stageMeta[stage].probability;
      return { ok: true, value: null };
    }
    var n = Number(s);
    if (!isFinite(n) || n < 0 || n > 100) return { ok: false, error: 'Use a number from 0 to 100.' };
    state.stageMeta[stage] = Object.assign({}, state.stageMeta[stage], { probability: Math.round(n) });
    return { ok: true, value: Math.round(n) };
  }

  // ---------------------------------------------------------------------
  // SOPs (issue #97). Owner, entry text, exit criteria and SLA per stage. Defaults live in code;
  // only overrides are stored, in state.stageMeta[stage] { owner, entry, exit, slaDays }.
  // ---------------------------------------------------------------------
  var SOP_BOTS = [
    { id: 'matrix', label: 'Matrix Manager' }, { id: 'salesbot', label: 'SalesBot' }, { id: 'quoting', label: 'Quoting' },
    { id: 'billing', label: 'Billing' }, { id: 'shipping', label: 'Shipping' }, { id: 'account-manager', label: 'Account Manager' },
    { id: 'cold-lead-gen', label: 'Cold Lead Gen' }, { id: 'owner', label: 'Owner' }
  ];
  var SOP_ENTRY_MAX = 140;
  var SOP_EXIT_MAX = 200;
  var SOP_BOT_LABEL_MAX = 40;
  var SOP_MOVER_RULE = 'A bot may move a card only when it owns the stage the card is leaving or the stage it is entering.';
  var SOP_ESCALATIONS = [
    'Ambiguous requirements or conflicting data',
    'Money: prices, discounts, refunds, payment terms',
    'External commitments to a customer or vendor',
    'Anything that needs a Firestore rules change, a Cloud Functions deploy or a data migration'
  ];

  function sopRow(owner, sla, exit) { return { owner: owner, entry: '', exit: exit || '', slaDays: sla == null ? null : sla }; }
  var DEFAULT_STAGE_SOP = {
    'pre-matrix': sopRow('matrix', 7, 'Triaged to a real stage with a note why'),
    'cold-leads': sopRow('cold-lead-gen', null, 'Reply received (Gmail link). Move to Contact Made'),
    'wishlist': sopRow('cold-lead-gen', null, 'Contact made'),
    'lost': sopRow('salesbot', null, "Terminal. Customer's No in writing; Owner sets the reason"),
    'inbound-jotform': sopRow('salesbot', 1, 'First reply sent by Owner (Gmail link)'),
    'direct-email': sopRow('salesbot', 1, 'First reply sent by Owner (Gmail link)'),
    'contact-made': sopRow('salesbot', 3, 'Enough info to quote logged (qty, material, files)'),
    'needs-quote': sopRow('quoting', 3, 'Branded quote PDF on Drive, linked in the quotes slot, quote logged'),
    'needs-quotation': sopRow('quoting', 3, 'Branded quote PDF on Drive, linked in the quotes slot, quote logged'),
    're-quote-needed': sopRow('quoting', 3, 'Revised quote PDF linked, old quote Superseded'),
    'needs-updated-quotation': sopRow('quoting', 3, 'Revised quote PDF linked, old quote Superseded'),
    'quote-sent': sopRow('salesbot', 7, 'Customer Yes, a change request, or a follow-up sent'),
    'design-prototyping-quote-sent': sopRow('salesbot', 7, 'Customer Yes, a change request, or a follow-up sent'),
    'followup-needed': sopRow('salesbot', 3, 'Follow-up sent (Gmail link) with a next step date'),
    'follow-up-negotiation': sopRow('salesbot', 14, 'Customer Yes in writing naming the quote number'),
    'invoicing': sopRow('billing', 1, 'Bank invoice from the accepted quote, linked on the card, sent by Owner'),
    'won-awaiting-payment': sopRow('billing', 7, 'Payment received, billing entry paid, Mark won to the right board'),
    'sourcing': sopRow('quoting', 5, 'Vendor quote logged, quote work resumes'),
    'awaiting-payment': sopRow('billing', 7, 'Invoice paid in full, then the card moves to the stage the invoice type implies'),
    'sku-design-dfm': sopRow('account-manager', 14, 'Customer approved the design (Gmail link), design files linked'),
    'sku-prototyping': sopRow('account-manager', 21, 'Prototype approved (sample marked approved)'),
    'sku-tooling-molds': sopRow('account-manager', 42, 'Entry needs tooling paid 100%. Exit: T1 samples shipped'),
    'sku-first-article': sopRow('account-manager', 14, 'First article approved in writing, production PO logged'),
    'po-open': sopRow('account-manager', 7, '50% deposit paid, material on hand, run scheduled'),
    'po-in-production': sopRow('owner', null, 'Parts made, QC passed, packing list ready'),
    'po-shipped': sopRow('shipping', 7, 'Delivered, final invoice sent'),
    'po-closed': sopRow('billing', null, 'Terminal. Balance paid'),
    'raw-materials-production': sopRow('account-manager', 7, 'Vendor PO sent by Owner, delivery date logged'),
    'amazon-com': sopRow('owner', 7, 'Ordered'),
    'ppe-com': sopRow('owner', 7, 'Ordered'),
    'needs-sourcing': sopRow('quoting', 14, '(legacy)'),
    'tooling-production-quoted': sopRow('salesbot', 14, '(legacy)'),
    'won-tooling-committed': sopRow('billing', 14, '(legacy)'),
    'ready-to-ship': sopRow('billing', 14, '(legacy)'),
    'in-production': sopRow('owner', 14, '(legacy)'),
    'need-qc': sopRow('owner', 14, '(legacy)'),
    'freight': sopRow('shipping', 14, '(legacy)'),
    'ready-to-ship-4oc': sopRow('shipping', 14, '(legacy)'),
    'shipped': sopRow('shipping', 14, '(legacy)')
  };
  var SOP_LEGACY_AREAS = ['pre-production', 'floor-operations'];

  function sopBots(state) {
    var list = state && state.sopBots;
    if (Array.isArray(list) && list.length) {
      var ok = list.filter(function (b) { return b && typeof b.id === 'string' && b.id && typeof b.label === 'string' && b.label; });
      if (ok.length) return ok.map(function (b) { return { id: b.id, label: b.label }; });
    }
    return SOP_BOTS.map(function (b) { return { id: b.id, label: b.label }; });
  }

  function sopBotLabel(state, id) {
    var b = sopBots(state).filter(function (x) { return x.id === id; })[0];
    return b ? b.label : (id || '');
  }

  // Replaces the bot list. Ids are slugs and unique. An id is never dropped, so it is never reused.
  function setSopBots(state, list) {
    if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Add at least one bot.' };
    var seen = {};
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var id = String((list[i] && list[i].id) || '').trim();
      var label = String((list[i] && list[i].label) || '').trim();
      if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return { ok: false, error: 'Bot ids use lowercase letters, digits and dashes.' };
      if (!label || label.length > SOP_BOT_LABEL_MAX) return { ok: false, error: 'Bot names are 1 to ' + SOP_BOT_LABEL_MAX + ' characters.' };
      if (seen[id]) return { ok: false, error: 'Bot id ' + id + ' is listed twice.' };
      seen[id] = true;
      out.push({ id: id, label: label });
    }
    var missing = sopBots(state).filter(function (b) { return !seen[b.id]; });
    if (missing.length) return { ok: false, error: 'Bots cannot be removed (' + missing[0].id + '). Rename it instead.' };
    state.sopBots = out;
    return { ok: true, bots: out };
  }

  function defaultSop(state, stage) {
    var d = DEFAULT_STAGE_SOP[stage];
    if (d) return d;
    var where = sectionAreaForStage(state, stage);
    if (where && SOP_LEGACY_AREAS.indexOf(where.area) !== -1) return sopRow('account-manager', 14, '(legacy)');
    return { owner: '', entry: '', exit: '', slaDays: null };
  }

  // Effective owner, entry, exit and SLA for a stage: stored override, else code default, else empty.
  function stageSop(state, stage) {
    var def = defaultSop(state, stage);
    var own = (state && state.stageMeta && state.stageMeta[stage]) || {};
    var sla = Number(own.slaDays);
    return {
      owner: typeof own.owner === 'string' && own.owner ? own.owner : def.owner,
      entry: typeof own.entry === 'string' && own.entry ? own.entry : def.entry,
      exit: typeof own.exit === 'string' && own.exit ? own.exit : def.exit,
      slaDays: own.slaDays != null && own.slaDays !== '' && isFinite(sla) && sla >= 1 ? sla : def.slaDays
    };
  }

  // patch: any of { owner, entry, exit, slaDays }. Blank clears the override. All fields are checked
  // before any is stored. Returns { ok, changes: [{ field, oldValue, newValue }] } or { ok: false, error }.
  function setStageSop(state, stage, patch) {
    patch = patch || {};
    var def = defaultSop(state, stage);
    var before = stageSop(state, stage);
    var next = {};
    if ('owner' in patch) {
      var o = String(patch.owner == null ? '' : patch.owner).trim();
      if (o && !sopBots(state).some(function (b) { return b.id === o; })) return { ok: false, error: 'Pick an owner from the list.' };
      next.owner = o;
    }
    if ('entry' in patch) {
      var en = String(patch.entry == null ? '' : patch.entry).trim();
      if (en.length > SOP_ENTRY_MAX) return { ok: false, error: 'Moves in when is ' + SOP_ENTRY_MAX + ' characters at most.' };
      next.entry = en;
    }
    if ('exit' in patch) {
      var ex = String(patch.exit == null ? '' : patch.exit).trim();
      if (ex.length > SOP_EXIT_MAX) return { ok: false, error: 'Exit criteria is ' + SOP_EXIT_MAX + ' characters at most.' };
      next.exit = ex;
    }
    if ('slaDays' in patch) {
      var raw = String(patch.slaDays == null ? '' : patch.slaDays).trim();
      if (raw === '') next.slaDays = '';
      else {
        var n = Number(raw);
        if (!isFinite(n) || n !== Math.floor(n) || n < 1 || n > 365) return { ok: false, error: 'SLA days is a whole number from 1 to 365.' };
        next.slaDays = n;
      }
    }
    if (!state.stageMeta || typeof state.stageMeta !== 'object') state.stageMeta = {};
    var meta = Object.assign({}, state.stageMeta[stage]);
    Object.keys(next).forEach(function (k) {
      // Blank clears; a value equal to the code default is not stored.
      if (next[k] === '' || next[k] === def[k]) delete meta[k]; else meta[k] = next[k];
    });
    if (Object.keys(meta).length) state.stageMeta[stage] = meta; else delete state.stageMeta[stage];
    var after = stageSop(state, stage);
    var changes = [];
    Object.keys(next).forEach(function (k) {
      if (before[k] !== after[k]) changes.push({ field: k, oldValue: before[k], newValue: after[k] });
    });
    return { ok: true, changes: changes };
  }

  // SLA status of one card from stageEnteredAt. null when there is no SLA, no stageEnteredAt, or the
  // stage is Cold Leads or terminal. now: ms, Date or ISO string.
  function slaStatus(state, card, now, terminalStages) {
    if (!card || !card.stage || !card.stageEnteredAt) return null;
    if (coldStages(state).indexOf(card.stage) !== -1 || (terminalStages || []).indexOf(card.stage) !== -1) return null;
    var sla = stageSop(state, card.stage).slaDays;
    if (!sla) return null;
    var entered = Date.parse(card.stageEnteredAt);
    if (isNaN(entered)) return null;
    var nowMs = now instanceof Date ? now.getTime() : (typeof now === 'number' ? now : Date.parse(now || ''));
    if (isNaN(nowMs)) nowMs = Date.now();
    var days = Math.max(0, Math.floor((nowMs - entered) / 86400000));
    return { slaDays: sla, daysInStage: days, over: days > sla, daysOver: Math.max(0, days - sla) };
  }

  // Write API owner check. A bot may move a card when it owns the stage being left or the stage being
  // entered. Matrix Manager keys and humans are decided by the caller, not here.
  function canMoveStage(state, botId, fromStage, toStage) {
    var fromOwner = stageSop(state, fromStage).owner;
    var toOwner = stageSop(state, toStage).owner;
    var bot = String(botId || '');
    return { allowed: !!bot && (bot === fromOwner || bot === toOwner), fromOwner: fromOwner, toOwner: toOwner };
  }

  function kpiMs(v) { var t = Date.parse(v || ''); return isNaN(t) ? null : t; }

  // Stage moves for one deal from the change log, oldest first: [{ at, ms, from, to }].
  function dealStageMoves(state, deal) {
    var out = [];
    ((state && state.changeLog) || []).forEach(function (e) {
      if (!e || e.entityId !== deal.id || (e.action !== 'move' && e.action !== 'update' && e.action !== 'stage')) return;
      var m = /[Ss]tage (\S+) to (\S+)/.exec(String(e.detail || ''));
      var ms = kpiMs(e.at);
      if (m && ms != null && m[1] !== m[2]) out.push({ at: e.at, ms: ms, from: m[1], to: m[2] });
    });
    return out.sort(function (a, b) { return a.ms - b.ms; });
  }

  function kpiMedian(list) {
    if (!list.length) return null;
    var s = list.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }
  function kpiRound1(n) { return n == null ? null : Math.round(n * 10) / 10; }

  // o: { nowMs, rangeDays (0 = all), crmStages, leadValue(deal), normalizeSource(id), isColdStage(stage) }
  function salesKpis(state, o) {
    o = o || {};
    var nowMs = o.nowMs != null ? o.nowMs : Date.now();
    var rangeDays = Number(o.rangeDays) || 0;
    var since = rangeDays ? nowMs - rangeDays * KPI_DAY : -Infinity;
    var crm = o.crmStages || null;
    var value = o.leadValue || leadValueTotal;
    var norm = o.normalizeSource || function (s) { return s || ''; };
    var isCold = o.isColdStage || function (s) { return coldStages(state).indexOf(s) !== -1; };
    var deals = ((state && state.deals) || []).filter(function (d) { return d && d.kind !== 'project' && d.type !== 'internal' && !d.archived; });
    var moves = {};
    deals.forEach(function (d) { moves[d.id] = dealStageMoves(state, d); });

    // When the deal reached its current stage: latest logged move into it, else stageEnteredAt.
    function enteredCurrent(d) {
      var mv = moves[d.id];
      for (var i = mv.length - 1; i >= 0; i--) if (mv[i].to === d.stage) return mv[i].ms;
      var t = kpiMs(d.stageEnteredAt);
      if (t == null) t = kpiMs(d.updatedAt);
      return t != null ? t : kpiMs(d.createdAt);
    }

    // Win rate by source and lost reasons: deals that closed inside the range.
    var won = [], lost = [];
    deals.forEach(function (d) {
      var isWon = KPI_WON_STAGES.indexOf(d.stage) !== -1;
      var isLost = d.stage === 'lost';
      if (!isWon && !isLost) return;
      var at = isLost && d.lostReason && kpiMs(d.lostReason.at) != null ? kpiMs(d.lostReason.at) : enteredCurrent(d);
      if (at != null && at < since) return;
      (isWon ? won : lost).push(d);
    });
    var bySource = {};
    function srcRow(id) { return bySource[id] || (bySource[id] = { source: id, won: 0, lost: 0, rate: null, wonIds: [], lostIds: [], ids: [] }); }
    won.forEach(function (d) { var r = srcRow(norm(d.source)); r.won++; r.wonIds.push(d.id); r.ids.push(d.id); });
    lost.forEach(function (d) { var r = srcRow(norm(d.source)); r.lost++; r.lostIds.push(d.id); r.ids.push(d.id); });
    var winRates = Object.keys(bySource).map(function (k) {
      var r = bySource[k];
      r.rate = r.won + r.lost ? r.won / (r.won + r.lost) : null;
      return r;
    }).sort(function (a, b) { return (b.won + b.lost) - (a.won + a.lost) || String(a.source).localeCompare(String(b.source)); });
    var overall = { won: won.length, lost: lost.length, rate: won.length + lost.length ? won.length / (won.length + lost.length) : null,
      wonIds: won.map(function (d) { return d.id; }), lostIds: lost.map(function (d) { return d.id; }) };

    var reasons = {};
    lost.forEach(function (d) {
      var code = (d.lostReason && d.lostReason.code) || '';
      var r = reasons[code] || (reasons[code] = { code: code, label: code ? (lostReasonLabel(code) || code) : 'No reason given', count: 0, value: 0, ids: [] });
      r.count++; r.value += Number(value(d)) || 0; r.ids.push(d.id);
    });
    var lostReasons = Object.keys(reasons).map(function (k) { return reasons[k]; })
      .sort(function (a, b) { return b.count - a.count || b.value - a.value; });

    // Time in stage: closed stays from the log, plus the current stay of every deal (the stageEnteredAt fallback).
    var segs = {};
    function seg(stage, days, id) {
      if (crm && crm.indexOf(stage) === -1) return;
      if (stage === 'lost' || KPI_WON_STAGES.indexOf(stage) !== -1 || isCold(stage)) return;
      (segs[stage] || (segs[stage] = [])).push({ days: Math.max(0, days), id: id });
    }
    deals.forEach(function (d) {
      var prev = kpiMs(d.createdAt);
      moves[d.id].forEach(function (m) {
        if (prev != null && m.ms >= since) seg(m.from, (m.ms - prev) / KPI_DAY, d.id);
        prev = m.ms;
      });
      var entered = enteredCurrent(d);
      if (entered != null && d.stage) seg(d.stage, (nowMs - entered) / KPI_DAY, d.id);
    });
    var timeInStage = Object.keys(segs).map(function (stage) {
      var days = segs[stage].map(function (s) { return s.days; });
      var ids = [];
      segs[stage].forEach(function (s) { if (ids.indexOf(s.id) === -1) ids.push(s.id); });
      return { stage: stage, count: days.length, median: kpiRound1(kpiMedian(days)),
        average: kpiRound1(days.reduce(function (a, b) { return a + b; }, 0) / days.length), ids: ids, slowest: false };
    });
    if (crm) timeInStage.sort(function (a, b) { return crm.indexOf(a.stage) - crm.indexOf(b.stage); });
    var slow = null;
    timeInStage.forEach(function (r) { if (!slow || r.median > slow.median || (r.median === slow.median && r.average > slow.average)) slow = r; });
    if (slow) slow.slowest = true;

    // Quote turnaround: entering Needs quotation to the first quote sent after that.
    var quotes = [], breaches = [];
    deals.forEach(function (d) {
      var entries = moves[d.id].filter(function (m) { return m.to === KPI_QUOTE_NEEDED; }).map(function (m) { return m.ms; });
      if (d.stage === KPI_QUOTE_NEEDED && !entries.length && enteredCurrent(d) != null) entries.push(enteredCurrent(d));
      if (!entries.length) return;
      var sentTimes = moves[d.id].filter(function (m) { return m.to === KPI_QUOTE_SENT; }).map(function (m) { return m.ms; });
      ((state && state.customerQuotes) || []).forEach(function (q) {
        if (q && q.dealId === d.id && kpiMs(q.sentAt) != null) sentTimes.push(kpiMs(q.sentAt));
      });
      entries.forEach(function (start, i) {
        var end = i + 1 < entries.length ? entries[i + 1] : Infinity;
        var sent = sentTimes.filter(function (t) { return t >= start && t < end; }).sort(function (a, b) { return a - b; })[0];
        if (sent != null) {
          if (sent < since) return;
          var days = (sent - start) / KPI_DAY;
          quotes.push({ id: d.id, days: kpiRound1(days), onTime: days <= KPI_QUOTE_SLA_DAYS });
        } else if (d.stage === KPI_QUOTE_NEEDED && i === entries.length - 1) {
          var waiting = (nowMs - start) / KPI_DAY;
          if (waiting > KPI_QUOTE_SLA_DAYS) breaches.push({ id: d.id, days: kpiRound1(waiting) });
        }
      });
    });
    var onTime = quotes.filter(function (q) { return q.onTime; });
    var quoteSla = {
      slaDays: KPI_QUOTE_SLA_DAYS, count: quotes.length, onTimeCount: onTime.length,
      onTimePct: quotes.length ? Math.round(100 * onTime.length / quotes.length) : null,
      medianDays: kpiRound1(kpiMedian(quotes.map(function (q) { return q.days; }))),
      ids: quotes.map(function (q) { return q.id; }), onTimeIds: onTime.map(function (q) { return q.id; }),
      lateIds: quotes.filter(function (q) { return !q.onTime; }).map(function (q) { return q.id; }),
      breaches: breaches.sort(function (a, b) { return b.days - a.days; })
    };

    // Weighted pipeline: open value x stage probability, by expected month.
    var wRows = {}, months = {}, wTotal = 0, rawTotal = 0, wIds = [];
    deals.forEach(function (d) {
      if (d.stage === 'lost' || KPI_WON_STAGES.indexOf(d.stage) !== -1 || isCold(d.stage)) return;
      if (crm && crm.indexOf(d.stage) === -1) return;
      var p = stageProbability(state, d.stage);
      if (p == null || p === 0) return;
      var v = Number(value(d)) || 0;
      var w = v * p / 100;
      var r = wRows[d.stage] || (wRows[d.stage] = { stage: d.stage, probability: p, count: 0, value: 0, weighted: 0, ids: [] });
      r.count++; r.value += v; r.weighted += w; r.ids.push(d.id);
      var when = isoDayOf(d.expectedClose) || isoDayOf(d.nextFollowUp);
      var key = when ? when.slice(0, 7) : '';
      var mo = months[key] || (months[key] = { month: key, weighted: 0, count: 0, ids: [] });
      mo.weighted += w; mo.count++; mo.ids.push(d.id);
      wTotal += w; rawTotal += v; wIds.push(d.id);
    });
    var weighted = {
      total: Math.round(wTotal), rawTotal: Math.round(rawTotal), ids: wIds,
      stages: Object.keys(wRows).map(function (k) { return wRows[k]; }).sort(function (a, b) {
        return crm ? crm.indexOf(a.stage) - crm.indexOf(b.stage) : 0;
      }),
      months: Object.keys(months).sort(function (a, b) { return a === '' ? 1 : b === '' ? -1 : a < b ? -1 : 1; }).map(function (k) { return months[k]; })
    };

    // New leads per week by source: 12 weeks ending with the current one (weeks start Monday, UTC).
    var d0 = new Date(nowMs);
    var dow = (d0.getUTCDay() + 6) % 7;
    var thisMonday = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), d0.getUTCDate()) - dow * KPI_DAY;
    var weeks = [];
    for (var k = 11; k >= 0; k--) {
      weeks.push({ start: new Date(thisMonday - k * 7 * KPI_DAY).toISOString().slice(0, 10), startMs: thisMonday - k * 7 * KPI_DAY, total: 0, bySource: {}, ids: [] });
    }
    var sourcesSeen = {};
    deals.forEach(function (d) {
      var c = kpiMs(d.createdAt);
      if (c == null) return;
      var idx = Math.floor((c - weeks[0].startMs) / (7 * KPI_DAY));
      if (idx < 0 || idx > 11) return;
      var s = norm(d.source);
      sourcesSeen[s] = true;
      weeks[idx].total++; weeks[idx].ids.push(d.id);
      weeks[idx].bySource[s] = (weeks[idx].bySource[s] || 0) + 1;
    });
    weeks.forEach(function (wk) { delete wk.startMs; });

    return { rangeDays: rangeDays, winRates: winRates, overall: overall, lostReasons: lostReasons, timeInStage: timeInStage,
      quoteSla: quoteSla, weighted: weighted, newLeads: { weeks: weeks, sources: Object.keys(sourcesSeen).sort() } };
  }

  // ---------------------------------------------------------------------
  // Copy production into staging (issue #111, #114). Record documents live below the workspace
  // document (workspace/main/deals/{id}); staging gets its own copy at workspace/staging/deals/{id}.
  // `db` is a Firestore handle (compat API): collection(path).get(), doc(path), batch(). Production is
  // only read. Staging records that production no longer has are removed (staging only), so the copy
  // mirrors production. Returns counts per collection.
  // ---------------------------------------------------------------------
  var RECORD_COLLECTIONS = ['deals', 'customers', 'contacts', 'projects', 'skus', 'skuEvents', 'tasks', 'files', 'proposals',
    'materials', 'materialLines', 'vendors', 'vendorQuotes', 'customerQuotes', 'pos', 'billingEntries', 'changeLog'];
  function copyRecordsToStaging(db, from, to, cols) {
    var list = (cols && cols.length ? cols : RECORD_COLLECTIONS).slice();
    if (String(to).indexOf('workspace/staging') !== 0 || String(from) === String(to)) return Promise.reject(new Error('Records can only be copied into workspace/staging.'));
    var report = {};
    var ops = [];
    return list.reduce(function (chain, col) {
      return chain.then(function () {
        return Promise.all([db.collection(from + '/' + col).get(), db.collection(to + '/' + col).get()]).then(function (res) {
          var keep = {};
          res[0].docs.forEach(function (d) { keep[d.id] = 1; ops.push({ set: true, path: to + '/' + col + '/' + d.id, data: d.data() }); });
          var removed = 0;
          res[1].docs.forEach(function (d) { if (!keep[d.id]) { removed += 1; ops.push({ set: false, path: to + '/' + col + '/' + d.id }); } });
          report[col] = { copied: res[0].docs.length, removed: removed };
        });
      });
    }, Promise.resolve()).then(function () {
      var chunks = [];
      for (var i = 0; i < ops.length; i += 400) chunks.push(ops.slice(i, i + 400));
      return chunks.reduce(function (chain, chunk) {
        return chain.then(function () {
          var b = db.batch();
          chunk.forEach(function (o) { if (o.set) b.set(db.doc(o.path), o.data); else b.delete(db.doc(o.path)); });
          return b.commit();
        });
      }, Promise.resolve());
    }).then(function () { return report; });
  }

  // ---------------------------------------------------------------------------
  // Customer Success (Owner 2026-10-15). Per paying-customer project, stored on the deal as deal.cs:
  // csStage, bankInvoiceId, paidDate, customerHardDeadline, deadlineReason, kickoff{}, nextMilestone,
  // nextDueDate, gmailThread, milestones[], touches[]. Write API ops: csSet, milestonesUpsert, touchesAdd.
  // ---------------------------------------------------------------------------
  var CS_STAGES = ['Payment pending', 'Paid', 'Kickoff', 'Design-DFM', 'Prototype', 'Customer approval', 'Tooling', 'Production', 'QC', 'Ship', 'Delivered', 'Follow-up', 'N/A'];
  var CS_KICKOFF_KEYS = ['scope', 'cad', 'materialDurometerColor', 'qty', 'shipTo', 'nda', 'decisionMaker'];
  var CS_MILESTONE_STATUSES = ['on track', 'at risk', 'slipped', 'done'];
  var CS_TEXT_FIELDS = ['bankInvoiceId', 'deadlineReason', 'nextMilestone', 'gmailThread'];
  var CS_DATE_FIELDS = ['paidDate', 'customerHardDeadline', 'nextDueDate'];
  var CS_SET_KEYS = ['csStage', 'kickoff'].concat(CS_TEXT_FIELDS, CS_DATE_FIELDS);
  var CS_MS_KEYS = ['id', 'name', 'owner', 'dueDate', 'status', 'lastChecked', 'blocker', 'blockerOwner', 'blockerDue'];
  var CS_TOUCH_KEYS = ['date', 'channel', 'summary', 'by', 'direction'];

  function csErr(msg) { var e = new Error(msg); e.status = 400; return e; }
  function csDate(v, name) {
    if (v == null || v === '') return null;
    var s = String(v);
    if (!/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/.test(s) || isNaN(Date.parse(s))) throw csErr(name + ' must be YYYY-MM-DD or an ISO time, or null');
    return s;
  }
  function csText(v, name, max) {
    if (v === null) return null;
    if (typeof v !== 'string') throw csErr(name + ' must be a string or null');
    var s = v.trim();
    if (s.length > (max || 500)) throw csErr(name + ' is too long');
    return s;
  }
  function csEnsure(deal) {
    if (!deal.cs || typeof deal.cs !== 'object') deal.cs = {};
    var cs = deal.cs;
    if (!cs.kickoff || typeof cs.kickoff !== 'object') cs.kickoff = {};
    if (!Array.isArray(cs.milestones)) cs.milestones = [];
    if (!Array.isArray(cs.touches)) cs.touches = [];
    return cs;
  }
  function csLog(state, deal, ctx, field, oldValue, newValue, detail) {
    if (!Array.isArray(state.changeLog)) state.changeLog = [];
    state.changeLog.push({
      id: 'chg_' + Date.now().toString(36) + '_' + rand(6), at: ctx.at, who: ctx.by, by: ctx.by,
      actedFor: ctx.actedFor || null, source: ctx.source || 'write-api', action: 'cs',
      entityType: 'lead', entityId: deal.id, field: field, oldValue: oldValue === undefined ? null : oldValue,
      newValue: newValue === undefined ? null : newValue, detail: detail
    });
    if (state.changeLog.length > 500) state.changeLog = state.changeLog.slice(-500);
  }
  // Validate first, then write. Throws a 400 error on any bad value (nothing is written).
  function applyCsOps(state, deal, op, ctx) {
    ctx = ctx || {};
    ctx.at = ctx.at || nowIso();
    var changes = [];
    var set = op.csSet, ms = op.milestonesUpsert, tc = op.touchesAdd;
    if (set != null && (typeof set !== 'object' || Array.isArray(set))) throw csErr('csSet must be an object');
    if (ms != null && !Array.isArray(ms)) throw csErr('milestonesUpsert must be a list');
    if (tc != null && !Array.isArray(tc)) throw csErr('touchesAdd must be a list');
    var clean = {};
    if (set) {
      Object.keys(set).forEach(function (k) {
        if (CS_SET_KEYS.indexOf(k) === -1) throw csErr('Unknown csSet field: ' + k);
        var v = set[k];
        if (k === 'csStage') { if (CS_STAGES.indexOf(v) === -1) throw csErr('csStage must be one of: ' + CS_STAGES.join(' / ')); clean[k] = v; }
        else if (k === 'kickoff') {
          if (!v || typeof v !== 'object' || Array.isArray(v)) throw csErr('kickoff must be an object');
          var kc = {};
          Object.keys(v).forEach(function (kk) {
            if (CS_KICKOFF_KEYS.indexOf(kk) === -1) throw csErr('Unknown kickoff item: ' + kk);
            if (typeof v[kk] !== 'boolean') throw csErr('kickoff.' + kk + ' must be true or false');
            kc[kk] = v[kk];
          });
          clean.kickoff = kc;
        } else if (CS_DATE_FIELDS.indexOf(k) !== -1) clean[k] = csDate(v, k);
        else clean[k] = csText(v, k, k === 'gmailThread' ? 300 : 500);
      });
    }
    var cleanMs = (ms || []).map(function (m) {
      if (!m || typeof m !== 'object') throw csErr('Each milestone must be an object');
      Object.keys(m).forEach(function (k) { if (CS_MS_KEYS.indexOf(k) === -1) throw csErr('Unknown milestone field: ' + k); });
      var o = {};
      if (m.id != null) o.id = csText(m.id, 'milestone id', 60);
      if (!o.id && !(typeof m.name === 'string' && m.name.trim())) throw csErr('A new milestone needs a name (or an id to update)');
      ['name', 'owner', 'blocker', 'blockerOwner'].forEach(function (k) { if (k in m) o[k] = csText(m[k], 'milestone ' + k, 300); });
      ['dueDate', 'lastChecked', 'blockerDue'].forEach(function (k) { if (k in m) o[k] = csDate(m[k], 'milestone ' + k); });
      if ('status' in m) { if (CS_MILESTONE_STATUSES.indexOf(m.status) === -1) throw csErr('milestone status must be one of: ' + CS_MILESTONE_STATUSES.join(' / ')); o.status = m.status; }
      return o;
    });
    var cleanTc = (tc || []).map(function (t) {
      if (!t || typeof t !== 'object') throw csErr('Each touch must be an object');
      Object.keys(t).forEach(function (k) { if (CS_TOUCH_KEYS.indexOf(k) === -1) throw csErr('Unknown touch field: ' + k); });
      var o = { date: csDate(t.date, 'touch date'), channel: csText(t.channel || '', 'touch channel', 40), summary: csText(t.summary || '', 'touch summary', 1000), by: csText(t.by || '', 'touch by', 80) };
      if (!o.date || !o.summary) throw csErr('A touch needs date and summary');
      if (t.direction != null) { if (t.direction !== 'in' && t.direction !== 'out' && t.direction !== 'internal') throw csErr("touch direction must be 'in' (from customer), 'out' (to customer) or 'internal' (team handoff)"); o.direction = t.direction; }
      return o;
    });
    var cs = csEnsure(deal);
    Object.keys(clean).forEach(function (k) {
      if (k === 'kickoff') {
        Object.keys(clean.kickoff).forEach(function (kk) {
          if (cs.kickoff[kk] === clean.kickoff[kk]) return;
          csLog(state, deal, ctx, 'cs.kickoff.' + kk, cs.kickoff[kk], clean.kickoff[kk], 'Kickoff ' + kk + ' = ' + clean.kickoff[kk]);
          cs.kickoff[kk] = clean.kickoff[kk]; changes.push('cs.kickoff.' + kk);
        });
        return;
      }
      if (cs[k] === clean[k]) return;
      csLog(state, deal, ctx, 'cs.' + k, cs[k], clean[k], 'CS ' + k + ' = ' + clean[k]);
      cs[k] = clean[k]; changes.push('cs.' + k);
    });
    cleanMs.forEach(function (o) {
      var cur = o.id ? cs.milestones.filter(function (x) { return x.id === o.id; })[0] : null;
      if (o.id && !cur) throw csErr('Milestone not found: ' + o.id);
      if (!cur) {
        cur = { id: makeId('ms'), name: o.name, owner: null, dueDate: null, status: 'on track', lastChecked: null, blocker: null, blockerOwner: null, blockerDue: null, createdAt: ctx.at };
        cs.milestones.push(cur);
        csLog(state, deal, ctx, 'cs.milestones', null, cur.id, 'Milestone added: ' + o.name);
      }
      Object.keys(o).forEach(function (k) {
        if (k === 'id' || cur[k] === o[k]) return;
        if (k !== 'name' || cur.createdAt !== ctx.at) csLog(state, deal, ctx, 'cs.milestones.' + cur.id + '.' + k, cur[k], o[k], 'Milestone ' + cur.name + ' ' + k + ' = ' + o[k]);
        cur[k] = o[k];
      });
      cur.updatedAt = ctx.at;
      changes.push('milestone:' + cur.id);
    });
    cleanTc.forEach(function (o) {
      o.id = makeId('tch'); o.loggedAt = ctx.at; o.loggedBy = ctx.by || null;
      cs.touches.push(o);
      csLog(state, deal, ctx, 'cs.touches', null, o.id, 'Touch ' + o.date + ' ' + o.channel + ': ' + o.summary.slice(0, 80));
      changes.push('touch:' + o.id);
    });
    if (changes.length) { cs.updatedAt = ctx.at; cs.updatedBy = ctx.by || null; deal.updatedAt = ctx.at; }
    return changes;
  }

  // ---- Who owes the next reply (issue #130). Optional deal.nextReplyOwner + deal.waitingSince. ----
  var REPLY_OWNER_MAX = 60;
  var REPLY_FUTURE_SLACK_MS = 5 * 60 * 1000;
  var REPLY_SLA_DAYS = 3;
  function replyOwnerClean(v) {
    if (typeof v !== 'string') throw csErr('replySet owner must be a string');
    var s = v.trim();
    if (!s || s.length > REPLY_OWNER_MAX) throw csErr('replySet owner must be 1 to ' + REPLY_OWNER_MAX + ' characters');
    return s;
  }
  // since: optional ISO 8601 string. Returns a normalized ISO time. Not more than 5 minutes ahead of now.
  function replySinceClean(v, nowMs) {
    if (v == null || v === '') return new Date(nowMs).toISOString();
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}([T ][\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/.test(v.trim()) || isNaN(Date.parse(v.trim()))) {
      throw csErr('replySet since must be an ISO 8601 date or time');
    }
    var ms = Date.parse(v.trim());
    if (ms > nowMs + REPLY_FUTURE_SLACK_MS) throw csErr('replySet since cannot be in the future');
    return new Date(ms).toISOString();
  }
  // null clears; otherwise { owner, since }. Throws a 400 error on a bad value (nothing is written).
  function replyCleanSet(rs, nowMs) {
    if (rs === null) return null;
    if (!rs || typeof rs !== 'object' || Array.isArray(rs)) throw csErr('replySet must be an object or null');
    Object.keys(rs).forEach(function (k) { if (k !== 'owner' && k !== 'since') throw csErr('Unknown replySet field: ' + k); });
    return { owner: replyOwnerClean(rs.owner), since: replySinceClean(rs.since, nowMs == null ? Date.now() : nowMs) };
  }
  // A lead object in leadUpserts: nextReplyOwner / waitingSince, same validation. null when neither is set.
  function replyLeadFields(lead, nowMs) {
    var o = lead && lead.nextReplyOwner, s = lead && lead.waitingSince;
    if (o == null && s == null) return null;
    if (o == null) throw csErr('waitingSince needs nextReplyOwner');
    return replyCleanSet({ owner: o, since: s }, nowMs);
  }
  // Direct set (overwrite), not enrichment. cleaned = replyCleanSet(...). Returns { owner, since } or null.
  function applyReplySet(state, deal, cleaned, ctx) {
    ctx = ctx || {};
    var at = ctx.at || nowIso();
    var oldV = deal.nextReplyOwner || deal.waitingSince ? { owner: deal.nextReplyOwner == null ? null : deal.nextReplyOwner, since: deal.waitingSince == null ? null : deal.waitingSince } : null;
    var newV = cleaned ? { owner: cleaned.owner, since: cleaned.since } : null;
    deal.nextReplyOwner = newV ? newV.owner : null;
    deal.waitingSince = newV ? newV.since : null;
    deal.updatedAt = at;
    if (JSON.stringify(oldV) !== JSON.stringify(newV)) {
      if (!Array.isArray(state.changeLog)) state.changeLog = [];
      state.changeLog.push({
        id: makeId('chg'), at: at, who: ctx.by, by: ctx.by, actedFor: ctx.actedFor || null, source: ctx.source || 'write-api',
        action: 'reply-owner', entityType: 'lead', entityId: deal.id, field: 'nextReplyOwner', oldValue: oldV, newValue: newV,
        detail: newV ? 'Next reply owed by ' + newV.owner + ' since ' + newV.since.slice(0, 10) : 'Cleared who owes the next reply'
      });
      if (state.changeLog.length > 500) state.changeLog = state.changeLog.slice(-500);
    }
    return newV;
  }
  function replyOwnerIsUs(owner) {
    var o = String(owner || '').trim().toLowerCase();
    return o === 'us' || o.indexOf('Example Molding Co.') === 0;
  }
  function replyOwnerIsCustomer(owner) { return String(owner || '').trim().toLowerCase() === 'customer'; }
  // Chip data for a card or row: null when unknown. kind: us / customer / other. red: ours and 3 days or older.
  function replyChip(deal, nowMs) {
    if (!deal || !deal.nextReplyOwner) return null;
    var owner = String(deal.nextReplyOwner);
    var t = deal.waitingSince ? Date.parse(deal.waitingSince) : NaN;
    var days = isNaN(t) ? null : Math.max(0, Math.floor(((nowMs == null ? Date.now() : nowMs) - t) / 86400000));
    var kind = replyOwnerIsUs(owner) ? 'us' : replyOwnerIsCustomer(owner) ? 'customer' : 'other';
    var name = kind === 'customer' ? 'Waiting on customer' : owner.toLowerCase() === 'us' ? 'Us' : owner.replace(/^Example Molding Co.\s*\/\s*/i, '');
    return { owner: owner, kind: kind, days: days, red: kind === 'us' && days != null && days >= REPLY_SLA_DAYS,
      text: name + (days == null ? '' : ' · ' + days + 'd') };
  }
  // We owe a reply: open leads where we own the next reply, oldest waitingSince first (unknown last).
  function weOweReplyRows(state, nowMs) {
    var cold = coldStages(state);
    var rows = [];
    (state.deals || []).forEach(function (d) {
      if (!isActiveLead(d) || d.archived || cold.indexOf(d.stage) !== -1) return;
      if (!replyOwnerIsUs(d.nextReplyOwner)) return;
      rows.push({ deal: d, chip: replyChip(d, nowMs), since: d.waitingSince || '' });
    });
    rows.sort(function (a, b) {
      if (!a.since !== !b.since) return a.since ? -1 : 1;
      return a.since < b.since ? -1 : a.since > b.since ? 1 : 0;
    });
    return rows;
  }

  function csDays(fromIso, today) {
    var a = Date.parse(String(fromIso).slice(0, 10)), b = Date.parse(String(today).slice(0, 10));
    return Math.floor((b - a) / 86400000);
  }
  function csLastTouch(cs, dir) {
    var best = null;
    (cs.touches || []).forEach(function (t) {
      var d = t.direction || 'out';
      if (d === 'internal') return; // team handoffs never count as customer activity
      if (dir && d !== dir) return;
      if (!best || String(t.date) > best) best = String(t.date);
    });
    return best;
  }
  function isCsProject(d) { return !!(d && d.cs && d.cs.csStage && d.status !== 'archived'); }
  // The six CS views. today = YYYY-MM-DD (PT). Each row: { deal, reason }.
  function csViews(state, today) {
    var projects = (state.deals || []).filter(isCsProject);
    var live = projects.filter(function (d) { return d.cs.csStage !== 'N/A'; });
    var board = CS_STAGES.map(function (s) { return { stage: s, deals: projects.filter(function (d) { return d.cs.csStage === s; }) }; });
    function open(m) { return m.status !== 'done'; }
    var slipped = [], silent = [], noUpdate = [], missing = [], pay = [];
    live.forEach(function (d) {
      var cs = d.cs, ms = cs.milestones || [];
      var sl = ms.filter(function (m) { return open(m) && (m.status === 'slipped' || (m.dueDate && csDays(m.dueDate, today) > 0)); });
      if (sl.length) slipped.push({ deal: d, reason: sl.map(function (m) { return m.name + (m.dueDate ? ' (due ' + m.dueDate.slice(0, 10) + ')' : ''); }).join('; ') });
      var active = cs.csStage !== 'Follow-up' && cs.csStage !== 'Delivered';
      var lin = csLastTouch(cs, 'in');
      if (active && (!lin || csDays(lin, today) >= 5)) silent.push({ deal: d, reason: lin ? 'Last heard ' + lin.slice(0, 10) + ' (' + csDays(lin, today) + 'd)' : 'No customer touch logged' });
      var lout = csLastTouch(cs, 'out');
      if (active && (!lout || csDays(lout, today) >= 7)) noUpdate.push({ deal: d, reason: lout ? 'Last update ' + lout.slice(0, 10) + ' (' + csDays(lout, today) + 'd)' : 'No update logged' });
      var miss = ms.filter(function (m) { return open(m) && (!m.owner || !m.dueDate); });
      var why = miss.map(function (m) { return m.name + ': ' + [!m.owner ? 'owner' : '', !m.dueDate ? 'due' : ''].filter(Boolean).join(' + '); });
      if (!cs.nextDueDate) why.unshift('No next due date');
      if (!ms.filter(open).length) why.unshift('No open milestone');
      if (why.length) missing.push({ deal: d, reason: why.join('; ') });
      if (cs.csStage === 'Payment pending') pay.push({ deal: d, reason: cs.bankInvoiceId ? 'Invoice ' + cs.bankInvoiceId : 'No invoice id' });
    });
    return { board: board, slippedToday: slipped, customerSilent5: silent, noUpdate7: noUpdate, missingOwnerDue: missing, paymentPending: pay, count: projects.length };
  }

  return {
    salesKpis: salesKpis,
    WON_AWAITING_STAGE: WON_AWAITING_STAGE,
    WON_AWAITING_LABEL: WON_AWAITING_LABEL,
    wonStagePending: wonStagePending,
    addWonAwaitingStage: addWonAwaitingStage,
    SOP_BOTS: SOP_BOTS,
    SOP_ENTRY_MAX: SOP_ENTRY_MAX,
    SOP_EXIT_MAX: SOP_EXIT_MAX,
    SOP_MOVER_RULE: SOP_MOVER_RULE,
    SOP_ESCALATIONS: SOP_ESCALATIONS,
    DEFAULT_STAGE_SOP: DEFAULT_STAGE_SOP,
    sopBots: sopBots,
    sopBotLabel: sopBotLabel,
    setSopBots: setSopBots,
    stageSop: stageSop,
    setStageSop: setStageSop,
    slaStatus: slaStatus,
    canMoveStage: canMoveStage,
    stageProbability: stageProbability,
    setStageProbability: setStageProbability,
    dealStageMoves: dealStageMoves,
    KPI_DEFAULT_PROBABILITY: KPI_DEFAULT_PROBABILITY,
    KPI_WON_STAGES: KPI_WON_STAGES,
    latestQuote: latestQuote,
    quoteSentState: quoteSentState,
    markQuotesSent: markQuotesSent,
    pipelineGrowth: pipelineGrowth,
    SCHEMA_VERSION: SCHEMA_VERSION,
    KICKOFF_STAGES: KICKOFF_STAGES,
    KICKOFF_ITEMS: KICKOFF_ITEMS,
    MATERIAL_LINE_STATUSES: MATERIAL_LINE_STATUSES,
    DUE_BUCKETS: DUE_BUCKETS,
    kickoffStageLabel: kickoffStageLabel,
    poKickoffStage: poKickoffStage,
    poKickoffItems: poKickoffItems,
    kickoffProgress: kickoffProgress,
    setKickoffItem: setKickoffItem,
    setPoKickoffStage: setPoKickoffStage,
    activeProductionRows: activeProductionRows,
    dueBucketOf: dueBucketOf,
    poLinesByDue: poLinesByDue,
    prefillMaterialLines: prefillMaterialLines,
    orderMaterialForPo: orderMaterialForPo,
    materialLinesForPo: materialLinesForPo,
    addBusinessDays: addBusinessDays,
    STAGE_RULE_KINDS: STAGE_RULE_KINDS,
    STAGE_RULE_KIND_LABEL: STAGE_RULE_KIND_LABEL,
    STAGE_RULE_SUGGESTIONS: STAGE_RULE_SUGGESTIONS,
    renderRuleTemplate: renderRuleTemplate,
    normalizeStageRule: normalizeStageRule,
    stageRulesFor: stageRulesFor,
    addStageRule: addStageRule,
    removeStageRule: removeStageRule,
    stageRuleSuggestions: stageRuleSuggestions,
    stageRuleText: stageRuleText,
    stageEntryPending: stageEntryPending,
    applyStageRules: applyStageRules,
    stageIdleDays: stageIdleDays,
    setStageIdleDays: setStageIdleDays,
    stageNeedsNextStep: stageNeedsNextStep,
    FOLLOWUP_SWEEP_CADENCE: FOLLOWUP_SWEEP_CADENCE,
    FOLLOWUP_SWEEP_CAP: FOLLOWUP_SWEEP_CAP,
    FOLLOWUP_SWEEP_ACTOR: FOLLOWUP_SWEEP_ACTOR,
    planFollowUpSweep: planFollowUpSweep,
    applyFollowUpSweep: applyFollowUpSweep,
    needsNextStepOnMove: needsNextStepOnMove,
    lacksNextStep: lacksNextStep,
    VIEW_COLUMNS: VIEW_COLUMNS,
    VIEW_STARTERS: VIEW_STARTERS,
    normalizeViewFilter: normalizeViewFilter,
    viewFilterIsEmpty: viewFilterIsEmpty,
    leadViewRow: leadViewRow,
    viewRowMatches: viewRowMatches,
    filterViewRows: filterViewRows,
    startersForBoard: startersForBoard,
    savedViewsForBoard: savedViewsForBoard,
    saveView: saveView,
    deleteView: deleteView,
    viewRowsToCsv: viewRowsToCsv,
    todayItemKey: todayItemKey,
    collectTodayItems: collectTodayItems,
    SEARCH_TYPES: SEARCH_TYPES,
    QUICK_LOG_KINDS: QUICK_LOG_KINDS,
    QUICK_LOG_OUTCOMES: QUICK_LOG_OUTCOMES,
    buildSearchIndex: buildSearchIndex,
    searchEntries: searchEntries,
    quickLogTarget: quickLogTarget,
    quickLog: quickLog,
    activeSnoozes: activeSnoozes,
    splitTodayItems: splitTodayItems,
    snoozeUntilFor: snoozeUntilFor,
    setTodaySnooze: setTodaySnooze,
    clearTodaySnooze: clearTodaySnooze,
    markTodayDone: markTodayDone,
    TODAY_QUOTE_SLA_DAYS: TODAY_QUOTE_SLA_DAYS,
    DEFAULT_STAGE_IDLE_DAYS: DEFAULT_STAGE_IDLE_DAYS,
    posNeedingMaterial: posNeedingMaterial,
    poBoardStages: poBoardStages,
    poStatusForStage: poStatusForStage,
    cleanDelegateName: cleanDelegateName,
    validateDelegateRows: validateDelegateRows,
    applyDelegateRows: applyDelegateRows,
    BILLING_CATEGORIES: BILLING_CATEGORIES,
    PAID_UPFRONT_CATEGORIES: PAID_UPFRONT_CATEGORIES,
    acceptedQuoteFor: acceptedQuoteFor,
    quoteUpfrontTotal: quoteUpfrontTotal,
    soldPaidInfo: soldPaidInfo,
    isSoldAndPaid: isSoldAndPaid,
    paidNotWon: paidNotWon,
    applyMarkWon: applyMarkWon,
    AWAITING_STAGE: AWAITING_STAGE,
    awaitingPaymentPending: awaitingPaymentPending,
    moveAwaitingPaymentStage: moveAwaitingPaymentStage,
    invoiceInfo: invoiceInfo,
    sendLeadToAwaitingPayment: sendLeadToAwaitingPayment,
    settleAwaitingPayment: settleAwaitingPayment,
    openInvoiceNotAwaiting: openInvoiceNotAwaiting,
    billingOpenAmount: billingOpenAmount,
    applyMarkPaid: applyMarkPaid,
    applyMoveSku: applyMoveSku,
    SPLIT_COLLECTIONS: SPLIT_COLLECTIONS,
    SPLIT_DOC_LIMIT: SPLIT_DOC_LIMIT,
    isSplitStorage: isSplitStorage,
    validDocId: validDocId,
    canonicalJson: canonicalJson,
    splitState: splitState,
    joinState: joinState,
    splitPlan: splitPlan,
    stateChecksum: stateChecksum,
    sha256Hex: sha256Hex,
    verifySplit: verifySplit,
    recordDiff: recordDiff,
    splitBase: splitBase,
    ARR_STALE_DAYS: ARR_STALE_DAYS,
    arrDaysIdle: arrDaysIdle,
    customerActivityMs: customerActivityMs,
    isArrEstimated: isArrEstimated,
    dealArr: dealArr,
    dealArrPotential: dealArrPotential,
    arrExcludedReason: arrExcludedReason,
    isArrCounted: isArrCounted,
    skuArrInfo: skuArrInfo,
    arrSummary: arrSummary,
    BILLING_STATUSES: BILLING_STATUSES,
    ensureBillingEntries: ensureBillingEntries,
    roundCents: roundCents,
    addBillingEntry: addBillingEntry,
    updateBillingEntry: updateBillingEntry,
    setBillingStatus: setBillingStatus,
    applyBillingUpserts: applyBillingUpserts,
    billingSummaryLines: billingSummaryLines,
    voidBillingEntry: voidBillingEntry,
    billingTotals: billingTotals,
    billingEntriesFor: billingEntriesFor,
    billingAccounts: billingAccounts,
    billingRefUrl: billingRefUrl,
    SKU_BOARD_ID: SKU_BOARD_ID,
    PRODUCTION_BOARD_ID: PRODUCTION_BOARD_ID,
    SKU_VALUE_KEYS: SKU_VALUE_KEYS,
    PREPRO_VALUE_KEYS: PREPRO_VALUE_KEYS,
    toolingValue: toolingValue,
    QUOTE_FIELD_LABELS: QUOTE_FIELD_LABELS,
    blankSku: blankSku,
    ensureSkuJobFields: ensureSkuJobFields,
    boardForKind: boardForKind,
    stageKindOf: stageKindOf,
    skuStageAt: skuStageAt,
    poStageAt: poStageAt,
    setSkuStage: setSkuStage,
    removeSkuFromBoard: removeSkuFromBoard,
    sendSkuToProduction: sendSkuToProduction,
    productionTargetStage: productionTargetStage,
    archivedItems: archivedItems,
    restoreArchived: restoreArchived,
    moveSourcingToPreprod: moveSourcingToPreprod,
    poLineAmount: poLineAmount,
    isOpenPoLine: isOpenPoLine,
    poLinesForSku: poLinesForSku,
    openPoAmountForSku: openPoAmountForSku,
    preproValue: preproValue,
    cardFace: cardFace,
    moldsForCustomer: moldsForCustomer,
    normalizeCustomerQuote: normalizeCustomerQuote,
    normalizeQuoteLine: normalizeQuoteLine,
    quoteLabel: quoteLabel,
    skuFieldsFromQuoteLine: skuFieldsFromQuoteLine,
    quoteDiff: quoteDiff,
    isHandEdited: isHandEdited,
    applyQuoteToSku: applyQuoteToSku,
    isClosedLead: isClosedLead,
    markLeadWon: markLeadWon,
    createSkuJobs: createSkuJobs,
    reassignSkuCustomer: reassignSkuCustomer,
    formatNote: formatNote,
    formatNoteDate: formatNoteDate,
    leadContactEmails: leadContactEmails,
    gmailQueryFor: gmailQueryFor,
    parseGmailMessage: parseGmailMessage,
    sortMessagesNewestFirst: sortMessagesNewestFirst,
    buildRawMessage: buildRawMessage,
    b64urlDecode: b64urlDecode,
    b64urlEncode: b64urlEncode,
    drivePreviewUrl: drivePreviewUrl,
    INBOUND_SORT_STAGE: INBOUND_SORT_STAGE,
    inboundSortDate: inboundSortDate,
    compareInboundNewestFirst: compareInboundNewestFirst,
    normalizeMeetingNote: normalizeMeetingNote,
    meetingNotesNewestFirst: meetingNotesNewestFirst,
    applyMeetingNotesImport: applyMeetingNotesImport,
    callNoteMissing: callNoteMissing,
    callTimePacific: callTimePacific,
    parseCallTime: parseCallTime,
    meetingSummaryLines: meetingSummaryLines,
    linkActionItemTask: linkActionItemTask,
    RECORD_SECTIONS: RECORD_SECTIONS,
    DOC_TYPES: DOC_TYPES,
    emailedAgo: emailedAgo,
    needsReplyList: needsReplyList,
    LEAD_CORE_FIELDS: LEAD_CORE_FIELDS,
    leadPrimaryContact: leadPrimaryContact,
    leadValueTotal: leadValueTotal,
    leadCoreValues: leadCoreValues,
    leadCoreMissing: leadCoreMissing,
    recordSectionSummary: recordSectionSummary,
    timelineSummary: timelineSummary,
    BUYING_ROLES: BUYING_ROLES,
    BUYING_ROLE_LABELS: BUYING_ROLE_LABELS,
    LOST_REASONS: LOST_REASONS,
    recordSection: recordSection,
    setRecordSection: setRecordSection,
    addRecordSectionRow: addRecordSectionRow,
    updateRecordSectionRow: updateRecordSectionRow,
    isRecordSectionEmpty: isRecordSectionEmpty,
    setSophistication: setSophistication,
    setLostReason: setLostReason,
    lostReasonLabel: lostReasonLabel,
    timelineNewestFirst: timelineNewestFirst,
    clampSummary: clampSummary,
    autoTldr: autoTldr,
    extractGmailUrl: extractGmailUrl,
    entrySummary: entrySummary,
    formatEntryText: formatEntryText,
    leadTldrStrip: leadTldrStrip,
    addTimelineEntry: addTimelineEntry,
    customerTimeline: customerTimeline,
    COMPLETION_LOG_COLLECTION: COMPLETION_LOG_COLLECTION,
    completionLogStore: completionLogStore,
    validCompletionId: validCompletionId,
    mergeCompletionEntries: mergeCompletionEntries,
    countCompletions: countCompletions,
    completionCopyPlan: completionCopyPlan,
    normalizePoNumber: normalizePoNumber,
    splitSkuCode: splitSkuCode,
    normalizeSkuCode: normalizeSkuCode,
    matchPoCustomer: matchPoCustomer,
    matchPoSku: matchPoSku,
    upsertCustomerPo: upsertCustomerPo,
    applyPoUpserts: applyPoUpserts,
    applyPoProposal: applyPoProposal,
    poSummaryLines: poSummaryLines,
    normalizeLeadSource: normalizeLeadSource,
    applyLeadUpserts: applyLeadUpserts,
    applyLeadProposal: applyLeadProposal,
    leadSummaryLines: leadSummaryLines,
    JOTFORM_FIELD_MAP: JOTFORM_FIELD_MAP,
    jotformToLeadEntry: jotformToLeadEntry,
    leadAlertPayload: leadAlertPayload,
    applyEnrichment: applyEnrichment,
    applyFieldProposal: applyFieldProposal,
    enrichSummaryLines: enrichSummaryLines,
    grantKeyForStage: grantKeyForStage,
    grantCanWriteLead: grantCanWriteLead,
    isActiveLead: isActiveLead,
    leadRowMatches: leadRowMatches,
    sortLeadRows: sortLeadRows,
    normalizeCompanyName: normalizeCompanyName,
    migrateToV12: migrateToV12,
    checkMigration: checkMigration,
    findOrCreateCustomer: findOrCreateCustomer,
    createContact: createContact,
    contactsForCustomer: contactsForCustomer,
    ensureArrays: ensureArrays,
    makeId: makeId,
    isShopNeedsStage: isShopNeedsStage,
    isProjectAreaId: isProjectAreaId,
    rebuildLeadFileRefs: rebuildLeadFileRefs,
    buildProject: buildProject,
    coldStages: coldStages,
    defaultPipelineViews: defaultPipelineViews,
    pipelineViewStages: pipelineViewStages,
    markConverted: markConverted,
    projectStatusFor: projectStatusFor,
    sectionAreaForStage: sectionAreaForStage,
    emptySlots: emptySlots,
    RECORD_COLLECTIONS: RECORD_COLLECTIONS,
    copyRecordsToStaging: copyRecordsToStaging,
    CS_STAGES: CS_STAGES,
    CS_KICKOFF_KEYS: CS_KICKOFF_KEYS,
    CS_MILESTONE_STATUSES: CS_MILESTONE_STATUSES,
    applyCsOps: applyCsOps,
    replyCleanSet: replyCleanSet,
    applyReplySet: applyReplySet,
    replyChip: replyChip,
    replyOwnerIsUs: replyOwnerIsUs,
    weOweReplyRows: weOweReplyRows,
    REPLY_SLA_DAYS: REPLY_SLA_DAYS,
    csViews: csViews,
    isCsProject: isCsProject
  };
}));
