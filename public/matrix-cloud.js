/* Matrix CRM — Google Auth gate + Firestore state sync (vanilla, no modules). */
(function () {
  'use strict';

  var DEBOUNCE_MS = 400;
  var ECHO_SKIP_MS = 1000;

  var _api = null;
  var _auth = null;
  var _db = null;
  var _docRef = null;
  var _unsubSnap = null;
  var _booted = false;
  var _applying = false;
  var _writing = false;
  var _lastWriteAt = 0;
  var _saveTimer = null;
  var _currentUser = null;
  var _gateEl = null;
  var _statusEl = null;
  var _ready = false;
  // updatedAt of the cloud copy this tab last applied or wrote. A save only goes through
  // if the cloud still has exactly this version (see queueCloudSave).
  var _baseUpdatedAt = null;
  // Why the last account was turned away. Signing it out fires the auth callback again with no
  // user, so the gate keeps showing this until the next sign-in attempt.
  var _refusal = '';

  var SECTION_KEYS = ['quotes', 'cold-leads', 'inbound', 'customers', 'tasks', 'pp-tooling'];

  function allowlist() {
    var list = window.MATRIX_ALLOWLIST;
    return Array.isArray(list) ? list.map(function (e) { return String(e).toLowerCase(); }) : [];
  }

  function isAllowed(email) {
    if (!email) return false;
    return allowlist().indexOf(String(email).toLowerCase()) !== -1;
  }

  function parseStatePath() {
    var path = window.MATRIX_FIRESTORE_STATE_PATH || 'workspace/main';
    var parts = String(path).split('/').filter(Boolean);
    if (parts.length < 2) return { collection: 'workspace', doc: 'main' };
    return { collection: parts[0], doc: parts.slice(1).join('/') };
  }

  function ensureGate() {
    if (_gateEl) return _gateEl;
    var el = document.createElement('div');
    el.id = 'matrix-auth-gate';
    el.innerHTML =
      '<div class="matrix-auth-card">' +
        '<div class="matrix-auth-brand">Matrix CRM</div>' +
        '<p class="matrix-auth-sub">Sign in with your Example Molding Co. Google account to continue.</p>' +
        '<button type="button" id="matrix-auth-google" class="matrix-auth-btn">Sign in with Google</button>' +
        '<p id="matrix-auth-status" class="matrix-auth-status" aria-live="polite"></p>' +
        '<button type="button" id="matrix-auth-signout" class="matrix-auth-signout" hidden>Sign out</button>' +
      '</div>';
    document.body.appendChild(el);
    _gateEl = el;
    _statusEl = document.getElementById('matrix-auth-status');
    var btn = document.getElementById('matrix-auth-google');
    if (btn) btn.addEventListener('click', function () { signIn(); });
    var out = document.getElementById('matrix-auth-signout');
    if (out) out.addEventListener('click', function () { signOut(); });
    return el;
  }

  function setStatus(msg, isError) {
    ensureGate();
    if (!_statusEl) return;
    _statusEl.textContent = msg || '';
    _statusEl.classList.toggle('is-error', !!isError);
    var out = document.getElementById('matrix-auth-signout');
    if (out) out.hidden = !isError;
  }

  function showGate() {
    ensureGate();
    _gateEl.hidden = false;
    _gateEl.classList.add('is-visible');
    var header = document.getElementById('app-header');
    var shell = document.getElementById('app-shell');
    if (header) header.style.display = 'none';
    if (shell) shell.style.display = 'none';
  }

  function hideGate() {
    if (_gateEl) {
      _gateEl.hidden = true;
      _gateEl.classList.remove('is-visible');
    }
    var header = document.getElementById('app-header');
    var shell = document.getElementById('app-shell');
    if (header) header.style.display = '';
    if (shell) shell.style.display = '';
  }

  function applyAuthChrome(user) {
    _currentUser = user || null;
    if (!_api) return;
    if (typeof _api.setAuthUser === 'function') _api.setAuthUser(user || null);
    else if (typeof _api.applyAuthChrome === 'function') _api.applyAuthChrome(user || null);
  }

  function ensureBooted() {
    if (_booted || !_api) return;
    _booted = true;
    if (typeof _api.bootLocal === 'function') _api.bootLocal();
  }

  // ---------------------------------------------------------------------
  // Split storage (issue #103). When workspace/main's config says settings.storage = 'split', records
  // live one per document under workspace/main/<collection>/<id>. This tab listens to each collection,
  // joins them into the same in-memory state the app always had, and saves only the documents that
  // changed. Remote changes to other records merge into local unsaved edits; when the same record (or
  // the config) changed on both sides, the local copy goes to Time machine and the cloud copy wins, as
  // with the single document. Nothing here runs while storage is the single workspace/main document.
  // ---------------------------------------------------------------------
  var SPLIT_SEEN_KEY = 'matrix-matrix-split-storage';
  var SPLIT_TX_MAX = 400; // bigger saves (imports) go in batches without the per-record check
  var _split = null;

  function SM() { return window.StuffMigrate; }
  function isSplitData(data) { return !!(data && data.state && data.state.settings && data.state.settings.storage === 'split'); }
  function splitCols() { return SM().SPLIT_COLLECTIONS.map(function (p) { return p[1]; }); }
  function colKey(col) { var p = SM().SPLIT_COLLECTIONS.find(function (x) { return x[1] === col; }); return p ? p[0] : col; }
  function docLists(docs) {
    var o = {};
    Object.keys(docs).forEach(function (c) { o[c] = Object.keys(docs[c]).map(function (id) { return docs[c][id]; }); });
    return o;
  }
  function stripOrd(d) { var r = Object.assign({}, d); delete r._ord; return r; }
  function remoteJoined() { return SM().joinState(_split.config, docLists(_split.docs)); }

  function enterSplit(data) {
    try { localStorage.setItem(SPLIT_SEEN_KEY, '1'); } catch (e) { /* private mode */ }
    if (_split) { _split.config = data.state; _split.updatedAt = data.updatedAt || null; scheduleSplitApply(); return; }
    if (_saveTimer) { // an unsaved single-document edit: keep it in Time machine, the split copy loads next
      clearTimeout(_saveTimer); _saveTimer = null;
      if (typeof _api.snapshotLocal === 'function') _api.snapshotLocal('before-split-reload');
    }
    _split = { config: data.state, updatedAt: data.updatedAt || null, docs: {}, loaded: {}, unsubs: [], base: null,
      baseConfigJson: null, inflight: null, applyTimer: null };
    setStatus('');
    splitCols().forEach(function (col) {
      _split.docs[col] = {};
      var unsub = _docRef.collection(col).onSnapshot(function (qs) {
        if (!_split) return;
        var m = {};
        qs.docs.forEach(function (d) { var v = d.data() || {}; if (!v.id) v.id = d.id; m[d.id] = v; });
        _split.docs[col] = m;
        _split.loaded[col] = true;
        scheduleSplitApply();
      }, function (err) {
        console.warn('MatrixCloud split listener error', col, err);
        setStatus('Cloud sync error: ' + (err && err.message ? err.message : String(err)), true);
        ensureBooted();
      });
      _split.unsubs.push(unsub);
    });
  }

  function exitSplit() {
    if (!_split) return;
    _split.unsubs.forEach(function (u) { try { u(); } catch (e) { /* ignore */ } });
    clearTimeout(_split.applyTimer);
    _split = null;
  }

  function scheduleSplitApply() {
    if (!_split || splitCols().some(function (c) { return !_split.loaded[c]; })) return;
    clearTimeout(_split.applyTimer);
    _split.applyTimer = setTimeout(applySplitRemote, 30);
  }

  function applyJoined(state) {
    _applying = true;
    try {
      ensureBooted();
      if (typeof _api.setState === 'function') _api.setState(state);
      if (typeof _api.saveLocal === 'function') _api.saveLocal();
      if (typeof _api.render === 'function') _api.render();
    } catch (e) {
      console.warn('MatrixCloud apply split state failed', e);
    } finally {
      _applying = false;
    }
  }

  // Records (col/id) that differ between two bases.
  function changedKeys(a, b) {
    var out = {};
    splitCols().forEach(function (col) {
      var x = (a && a[col]) || {}, y = (b && b[col]) || {};
      Object.keys(x).concat(Object.keys(y)).forEach(function (id) {
        var l = x[id], r = y[id];
        if (!l || !r || l.json !== r.json) out[col + '/' + id] = true;
      });
    });
    return out;
  }

  function applySplitRemote() {
    if (!_split) return;
    var sm = SM();
    var lists = docLists(_split.docs);
    var remoteBase = sm.splitBase(lists);
    var remoteCfgJson = sm.canonicalJson(_split.config);
    if (!_split.base) { // first full load
      _split.base = remoteBase; _split.baseConfigJson = remoteCfgJson;
      applyJoined(sm.joinState(_split.config, lists));
      return;
    }
    var expect = _split.inflight || { base: _split.base, configJson: _split.baseConfigJson };
    var changed = changedKeys(expect.base, remoteBase);
    var cfgChanged = remoteCfgJson !== expect.configJson;
    if (!Object.keys(changed).length && !cfgChanged) return; // our own write echoing back
    var local = typeof _api.getState === 'function' ? _api.getState() : null;
    var pending = (_saveTimer || _writing) && local ? sm.recordDiff(expect.base, local, expect.configJson) : null;
    var joined = sm.joinState(_split.config, lists);
    if (pending && (pending.writes.length || pending.deletes.length || pending.config)) {
      var overlap = (pending.config && cfgChanged) ||
        pending.writes.some(function (w) { return changed[w.col + '/' + w.id]; }) ||
        pending.deletes.some(function (d) { return changed[d.col + '/' + d.id]; });
      if (overlap) {
        if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
        _split.base = remoteBase; _split.baseConfigJson = remoteCfgJson; _split.inflight = null;
        notifyConflict({ state: joined, updatedAt: _split.updatedAt });
        return;
      }
      // No overlap: keep this tab's unsaved records and config on top of the cloud copy.
      pending.writes.forEach(function (w) {
        var key = colKey(w.col), list = joined[key] || (joined[key] = []);
        var rec = stripOrd(w.data), i = list.findIndex(function (r) { return r && r.id === w.id; });
        if (i === -1) list.push(rec); else list[i] = rec;
      });
      pending.deletes.forEach(function (d) {
        var key = colKey(d.col);
        joined[key] = (joined[key] || []).filter(function (r) { return !r || r.id !== d.id; });
      });
      if (pending.config) {
        var keep = joined;
        joined = Object.assign({}, pending.configState);
        sm.SPLIT_COLLECTIONS.forEach(function (p) { joined[p[0]] = keep[p[0]]; });
      }
      _split.base = remoteBase; _split.baseConfigJson = remoteCfgJson;
      applyJoined(joined);
      queueCloudSave(); // the unsaved edits still go out, against the new base
      return;
    }
    _split.base = remoteBase; _split.baseConfigJson = remoteCfgJson;
    applyJoined(joined);
  }

  // Save only what changed. Up to SPLIT_TX_MAX documents go in one transaction that first checks each
  // touched record (and the config) still matches what this tab last saw; anything else conflicts.
  function saveSplit(state) {
    var sm = SM();
    if (!_split || !_split.base) return;
    var d = sm.recordDiff(_split.base, state, _split.baseConfigJson);
    if (!d.writes.length && !d.deletes.length && !d.config) return;
    var at = new Date().toISOString(), by = (_currentUser && _currentUser.email) || '';
    var cfgPatch = { updatedAt: at, updatedBy: by, recordsUpdatedAt: at };
    if (d.config) cfgPatch.state = d.configState;
    var ops = d.writes.map(function (w) { return { col: w.col, id: w.id, data: w.data }; })
      .concat(d.deletes.map(function (x) { return { col: x.col, id: x.id, del: true }; }));
    var prevBase = _split.base, prevCfg = _split.baseConfigJson;
    _split.inflight = { base: d.base, configJson: d.config ? d.configJson : prevCfg };
    _writing = true;
    _lastWriteAt = Date.now();
    var conflict = false;
    var run;
    if (ops.length <= SPLIT_TX_MAX) {
      run = _db.runTransaction(function (tx) {
        conflict = false;
        var reads = ops.map(function (o) { return tx.get(_docRef.collection(o.col).doc(o.id)); });
        if (d.config) reads.push(tx.get(_docRef));
        return Promise.all(reads).then(function (snaps) {
          ops.forEach(function (o, i) {
            var had = prevBase[o.col] && prevBase[o.col][o.id];
            var remote = snaps[i].exists ? sm.canonicalJson(stripOrd(snaps[i].data() || {})) : null;
            if ((had ? had.json : null) !== remote) conflict = true;
          });
          if (d.config) {
            var cfgSnap = snaps[snaps.length - 1];
            var remoteCfg = cfgSnap.exists ? (cfgSnap.data() || {}).state : null;
            if (!remoteCfg || sm.canonicalJson(remoteCfg) !== prevCfg) conflict = true;
          }
          if (conflict) return;
          ops.forEach(function (o) {
            var ref = _docRef.collection(o.col).doc(o.id);
            if (o.del) tx.delete(ref); else tx.set(ref, o.data);
          });
          tx.update(_docRef, cfgPatch); // replaces state whole (merge would keep deleted config keys)
        });
      });
    } else {
      var batches = [];
      for (var i = 0; i < ops.length; i += SPLIT_TX_MAX) batches.push(ops.slice(i, i + SPLIT_TX_MAX));
      run = batches.reduce(function (p, chunk) {
        return p.then(function () {
          var b = _db.batch();
          chunk.forEach(function (o) { var ref = _docRef.collection(o.col).doc(o.id); if (o.del) b.delete(ref); else b.set(ref, o.data); });
          return b.commit();
        });
      }, Promise.resolve()).then(function () { return _docRef.update(cfgPatch); });
    }
    run.then(function () {
      _writing = false;
      _lastWriteAt = Date.now();
      if (!_split) return;
      _split.inflight = null;
      if (conflict) {
        var lists = docLists(_split.docs);
        _split.base = sm.splitBase(lists); _split.baseConfigJson = sm.canonicalJson(_split.config);
        notifyConflict({ state: sm.joinState(_split.config, lists), updatedAt: _split.updatedAt });
        return;
      }
      _split.base = d.base;
      if (d.config) _split.baseConfigJson = d.configJson;
      _split.updatedAt = at;
    }).catch(function (err) {
      _writing = false;
      if (_split) _split.inflight = null;
      console.warn('MatrixCloud split save failed', err);
      if (typeof _api.onCloudSaveError === 'function') _api.onCloudSaveError(err);
      setTimeout(function () { if (_docRef && _currentUser) queueCloudSave(); }, 5000);
    });
  }

  function attachSnapshot() {
    if (!_docRef || _unsubSnap) return;
    _unsubSnap = _docRef.onSnapshot(
      function (snap) {
        var sd = snap.exists ? (snap.data() || {}) : null;
        if (isSplitData(sd)) { enterSplit(sd); return; } // records live in subcollections (#103)
        if (_split) exitSplit(); // rolled back to the single document
        if (_writing || _applying) return;
        if (Date.now() - _lastWriteAt < ECHO_SKIP_MS) return;

        if (!snap.exists) {
          ensureBooted();
          var state = typeof _api.getState === 'function' ? _api.getState() : null;
          if (!state) return;
          _writing = true;
          _lastWriteAt = Date.now();
          var firstAt = new Date().toISOString();
          _docRef.set({
            state: state,
            updatedAt: firstAt,
            updatedBy: (_currentUser && _currentUser.email) || ''
          }, { merge: true }).then(function () {
            _writing = false;
            _baseUpdatedAt = firstAt;
          }).catch(function (err) {
            _writing = false;
            console.warn('MatrixCloud initial setDoc failed', err);
          });
          return;
        }

        var data = snap.data() || {};
        if (!data.state) {
          ensureBooted();
          return;
        }
        if (data.updatedAt && data.updatedAt === _baseUpdatedAt) return; // our own write echoing back

        // A newer cloud copy arrived while a local edit was still waiting to save.
        // Keep the local edit in Time machine instead of losing it silently.
        if (_saveTimer) {
          clearTimeout(_saveTimer);
          _saveTimer = null;
          notifyConflict(data);
          return;
        }

        _applying = true;
        try {
          ensureBooted();
          _baseUpdatedAt = data.updatedAt || null;
          if (typeof _api.setState === 'function') _api.setState(data.state);
          if (typeof _api.saveLocal === 'function') _api.saveLocal();
          if (typeof _api.render === 'function') _api.render();
        } catch (e) {
          console.warn('MatrixCloud apply remote state failed', e);
        } finally {
          _applying = false;
        }
      },
      function (err) {
        console.warn('MatrixCloud onSnapshot error', err);
        setStatus('Cloud sync error: ' + (err && err.message ? err.message : String(err)), true);
        ensureBooted();
      }
    );
  }

  // ---------------------------------------------------------------------
  // Profiles and bot access (Phase 2). Collections: users/{emailLower}, botAccessRequests,
  // botGrants/{botEmailLower}, accessAudit. Firestore rules decide what each person may do;
  // these helpers never bypass them.
  // ---------------------------------------------------------------------

  function nowIso() { return new Date().toISOString(); }
  function myEmail() { return String((_currentUser && _currentUser.email) || '').toLowerCase(); }
  // Staging safety (issue #111). A Hosting preview shares production Firestore and Auth, so on a
  // preview (MATRIX_ENV "staging") every write outside workspace/staging is refused here, whatever
  // the calling code does. Reads are untouched. Long term fix: a separate Firebase project.
  var STAGING_WRITE_PATH = 'workspace/staging';
  function stagingRefused(ref) {
    var p = ref && ref.path;
    return window.MATRIX_ENV === 'staging' && !(p === STAGING_WRITE_PATH || (typeof p === 'string' && p.indexOf(STAGING_WRITE_PATH + '/') === 0));
  }
  function stagingError(ref) {
    var e = new Error('Blocked: a staging preview may only write ' + STAGING_WRITE_PATH + ' (tried ' + ((ref && ref.path) || 'unknown') + ').');
    e.code = 'staging-write-blocked';
    return e;
  }
  function guardRef(ref) {
    if (!ref || ref.__stagingGuard) return ref;
    ['set', 'update', 'delete'].forEach(function (m) {
      var orig = ref[m];
      if (typeof orig !== 'function') return;
      ref[m] = function () {
        if (stagingRefused(ref)) return Promise.reject(stagingError(ref));
        return orig.apply(ref, arguments);
      };
    });
    ref.__stagingGuard = true;
    return ref;
  }
  function guardCollection(col) {
    if (!col || col.__stagingGuard) return col;
    var origDoc = col.doc;
    col.doc = function () { return guardRef(origDoc.apply(col, arguments)); };
    if (typeof col.add === 'function') {
      var origAdd = col.add;
      col.add = function () {
        if (window.MATRIX_ENV === 'staging') return Promise.reject(stagingError({ path: col.path || col.id || col.name }));
        return origAdd.apply(col, arguments);
      };
    }
    col.__stagingGuard = true;
    return col;
  }
  function guardWriter(w) {
    ['set', 'update', 'delete'].forEach(function (m) {
      var orig = w[m];
      if (typeof orig !== 'function') return;
      w[m] = function (ref) {
        if (stagingRefused(ref)) throw stagingError(ref);
        orig.apply(w, arguments);
        return w;
      };
    });
    return w;
  }
  function guardStaging(db) {
    if (!db) return db;
    return {
      collection: function (n) { return guardCollection(db.collection(n)); },
      doc: function (p) { return guardRef(db.doc(p)); },
      batch: function () { return guardWriter(db.batch()); },
      runTransaction: function (fn) {
        return db.runTransaction(function (tx) { return fn(guardWriter(tx)); });
      }
    };
  }

  function needDb() { if (!_db || !_currentUser) throw new Error('Sign in to the hosted Matrix to use profiles and bot access.'); }
  function docData(snap) { var d = snap.data() || {}; d.id = snap.id; return d; }
  function isDenied(err) { return !!err && (err.code === 'permission-denied' || /permission/i.test(String(err.message || ''))); }

  function sectionsArrayToMap(arr) {
    var out = {};
    (arr || []).forEach(function (s) {
      if (s && SECTION_KEYS.indexOf(s.id) !== -1 && (s.level === 'read' || s.level === 'write')) out[s.id] = s.level;
    });
    return out;
  }
  function sectionsMapToArray(map) {
    return SECTION_KEYS.filter(function (k) { return map && (map[k] === 'read' || map[k] === 'write'); })
      .map(function (k) { return { id: k, level: map[k] }; });
  }

  function auditEntry(action, fields) {
    return Object.assign({
      action: action, requestId: null, botEmail: null, before: null, after: null, note: '',
      actorUid: (_currentUser && _currentUser.uid) || '', actorEmail: myEmail(), at: nowIso()
    }, fields || {});
  }

  // Commit a batch with its accessAudit entry. accessAudit has no rule until Owner deploys the
  // Phase 2 rules, so if only the audit write is refused, commit the rest and report it.
  function commitWithAudit(build, audit) {
    function run(withAudit) {
      var batch = _db.batch();
      build(batch);
      if (withAudit) batch.set(_db.collection('accessAudit').doc(), audit);
      return batch.commit();
    }
    return run(true).then(function () { return { audited: true }; }).catch(function (err) {
      if (!isDenied(err)) throw err;
      return run(false).then(function () { return { audited: false }; });
    });
  }

  // Completion log collection (issue #5): completionLog/{entry.id}, create-only in the proposed rules.
  var COMPLETION_COL = 'completionLog';
  function completionIdOk(id) { return /^[A-Za-z0-9_-]{1,120}$/.test(String(id || '')); }

  var completionLog = {
    append: function (entry) {
      needDb();
      if (!entry || !completionIdOk(entry.id)) return Promise.reject(new Error('Completion entry needs a simple id'));
      return _db.collection(COMPLETION_COL).doc(entry.id).set(JSON.parse(JSON.stringify(entry)));
    },
    list: function () {
      needDb();
      return _db.collection(COMPLETION_COL).get().then(function (q) { return q.docs.map(function (d) { return d.data(); }); });
    },
    // Copies entries in batches; the caller passes only entries the collection does not have yet.
    copy: function (entries) {
      needDb();
      var list = (entries || []).filter(function (e) { return e && completionIdOk(e.id); });
      var chunks = [];
      for (var i = 0; i < list.length; i += 400) chunks.push(list.slice(i, i + 400));
      var done = 0;
      return chunks.reduce(function (p, chunk) {
        return p.then(function () {
          var batch = _db.batch();
          chunk.forEach(function (e) { batch.set(_db.collection(COMPLETION_COL).doc(e.id), JSON.parse(JSON.stringify(e))); });
          return batch.commit().then(function () { done += chunk.length; });
        });
      }, Promise.resolve()).then(function () { return { copied: done }; });
    }
  };

  var access = {
    SECTION_KEYS: SECTION_KEYS,
    completionLog: completionLog,
    isCloud: function () { return !!(_db && _currentUser); },
    me: function () {
      if (!_currentUser) return null;
      return { uid: _currentUser.uid, email: myEmail(), displayName: _currentUser.displayName || '', photoURL: _currentUser.photoURL || '' };
    },
    isOnAllowlist: function (email) { return isAllowed(email); },
    getProfile: function () {
      needDb();
      return _db.collection('users').doc(myEmail()).get().then(function (snap) { return snap.exists ? docData(snap) : null; });
    },
    // Writes only profile fields. roles and sectionGrants are set by admins (or the console).
    saveProfile: function (fields) {
      needDb();
      var ref = _db.collection('users').doc(myEmail());
      var clean = {
        displayName: String(fields.displayName || '').trim(),
        phone: String(fields.phone || '').trim(),
        title: String(fields.title || '').trim(),
        photoURL: (_currentUser && _currentUser.photoURL) || '',
        updatedAt: nowIso()
      };
      return ref.get().then(function (snap) {
        if (snap.exists) return ref.update(clean);
        return ref.set(Object.assign(clean, {
          email: myEmail(), uid: _currentUser.uid, createdAt: clean.updatedAt, roles: ['member'], sectionGrants: {}
        }));
      });
    },
    listMyRequests: function () {
      needDb();
      return _db.collection('botAccessRequests').where('requesterEmail', '==', myEmail()).get()
        .then(function (q) { return q.docs.map(docData); });
    },
    listAllRequests: function () {
      needDb();
      return _db.collection('botAccessRequests').get().then(function (q) { return q.docs.map(docData); });
    },
    listGrants: function () {
      needDb();
      return _db.collection('botGrants').get().then(function (q) { return q.docs.map(docData); });
    },
    // One grant, e.g. the signed-in bot's own (botGrants are readable by allowlisted accounts).
    getGrant: function (email) {
      needDb();
      return _db.collection('botGrants').doc(String(email || '').toLowerCase()).get().then(function (snap) { return snap.exists ? docData(snap) : null; });
    },
    listUsers: function () {
      needDb();
      return _db.collection('users').get().then(function (q) { return q.docs.map(docData); });
    },
    listAudit: function () {
      needDb();
      return _db.collection('accessAudit').get().then(function (q) { return q.docs.map(docData); })
        .catch(function (err) { if (isDenied(err)) return null; throw err; });
    },
    createRequest: function (req) {
      needDb();
      var ref = _db.collection('botAccessRequests').doc();
      var doc = {
        requesterUid: _currentUser.uid, requesterEmail: myEmail(),
        botEmail: String(req.botEmail || '').trim().toLowerCase(), botName: String(req.botName || '').trim(),
        sections: (req.sections || []).filter(function (s) { return SECTION_KEYS.indexOf(s.id) !== -1; }),
        reason: String(req.reason || '').trim(), status: 'pending', createdAt: nowIso(), decidedAt: null, decidedBy: null
      };
      return commitWithAudit(function (b) { b.set(ref, doc); },
        auditEntry('request', { requestId: ref.id, botEmail: doc.botEmail, after: { sections: sectionsArrayToMap(doc.sections) }, note: doc.reason }))
        .then(function (r) { return Object.assign({ id: ref.id }, r); });
    },
    // Approve: grant (sections from the request unless edited) + request decision, one batch.
    approveRequest: function (request, sectionsMap, note) {
      needDb();
      var botKey = String(request.botEmail || '').toLowerCase();
      var grantRef = _db.collection('botGrants').doc(botKey);
      var reqRef = _db.collection('botAccessRequests').doc(request.id);
      var at = nowIso();
      var sections = sectionsMap || sectionsArrayToMap(request.sections);
      return grantRef.get().then(function (snap) {
        var before = snap.exists ? docData(snap) : null;
        var grant = {
          botEmail: botKey, sponsorUserEmail: String(request.requesterEmail || '').toLowerCase(),
          sections: sections, status: 'active', approvedBy: myEmail(), approvedAt: at, updatedAt: at
        };
        return commitWithAudit(function (b) {
          b.set(grantRef, grant);
          b.update(reqRef, { status: 'approved', decidedAt: at, decidedBy: myEmail(), sections: sectionsMapToArray(sections) });
        }, auditEntry('approve', {
          requestId: request.id, botEmail: botKey, note: note || '',
          before: before ? { sections: before.sections || {}, status: before.status || null, sponsorUserEmail: before.sponsorUserEmail || null } : null,
          after: { sections: sections, status: 'active', sponsorUserEmail: grant.sponsorUserEmail }
        }));
      });
    },
    denyRequest: function (request, note) {
      needDb();
      var at = nowIso();
      return commitWithAudit(function (b) {
        b.update(_db.collection('botAccessRequests').doc(request.id), { status: 'denied', decidedAt: at, decidedBy: myEmail() });
      }, auditEntry('deny', { requestId: request.id, botEmail: request.botEmail, note: note || '' }));
    },
    // Edit the sections of a pending request (before approving).
    editRequest: function (request, sectionsMap) {
      needDb();
      return commitWithAudit(function (b) {
        b.update(_db.collection('botAccessRequests').doc(request.id), { sections: sectionsMapToArray(sectionsMap) });
      }, auditEntry('edit', { requestId: request.id, botEmail: request.botEmail, before: { sections: sectionsArrayToMap(request.sections) }, after: { sections: sectionsMap } }));
    },
    // Edit an existing grant's sections (HelperBot included).
    editGrant: function (grant, sectionsMap) {
      needDb();
      var at = nowIso();
      return commitWithAudit(function (b) {
        b.update(_db.collection('botGrants').doc(grant.id), { sections: sectionsMap, updatedAt: at });
      }, auditEntry('edit', { botEmail: grant.botEmail || grant.id, before: { sections: grant.sections || {} }, after: { sections: sectionsMap } }));
    },
    revokeGrant: function (grant, note, requests) {
      needDb();
      var at = nowIso();
      var botKey = String(grant.botEmail || grant.id).toLowerCase();
      var approved = (requests || []).filter(function (r) { return String(r.botEmail || '').toLowerCase() === botKey && r.status === 'approved'; });
      return commitWithAudit(function (b) {
        b.update(_db.collection('botGrants').doc(grant.id), { status: 'revoked', updatedAt: at });
        approved.forEach(function (r) { b.update(_db.collection('botAccessRequests').doc(r.id), { status: 'revoked', decidedAt: at, decidedBy: myEmail() }); });
      }, auditEntry('revoke', { botEmail: botKey, before: { status: grant.status || null, sections: grant.sections || {} }, after: { status: 'revoked' }, note: note || '' }));
    },
    // Invite a person: users/{emailLower} with status 'invited'. Once the Phase 2 rules are
    // deployed, that doc lets them sign in; their first sign-in sets uid and status 'active'.
    inviteUser: function (fields) {
      needDb();
      var email = String(fields.email || '').trim().toLowerCase();
      var roles = fields.role === 'admin' ? ['admin'] : ['member'];
      var grants = sectionsArrayToMap(sectionsMapToArray(fields.sectionGrants || {}));
      var ref = _db.collection('users').doc(email);
      return ref.get().then(function (snap) {
        if (snap.exists) throw new Error(email + ' already has a profile.');
        var at = nowIso();
        var doc = {
          email: email, uid: '', displayName: String(fields.displayName || '').trim(), title: '', phone: '', photoURL: '',
          roles: roles, sectionGrants: grants, status: 'invited', invitedBy: myEmail(), invitedAt: at, createdAt: at, updatedAt: at
        };
        return commitWithAudit(function (b) { b.set(ref, doc); },
          auditEntry('invite', { after: { email: email, roles: roles, sectionGrants: grants, status: 'invited' } }));
      });
    },
    // Only an invite nobody has used yet can be cancelled.
    cancelInvite: function (user) {
      needDb();
      var ref = _db.collection('users').doc(user.id);
      return ref.get().then(function (snap) {
        if (!snap.exists || (snap.data() || {}).status !== 'invited') throw new Error('This invite was already used or removed.');
        return commitWithAudit(function (b) { b.delete(ref); },
          auditEntry('cancel-invite', { before: { email: user.id, roles: user.roles || [], status: 'invited' }, after: null }));
      });
    },
    // Bot keys (issue #63) for the write API. botKeys/{keyId} holds only the SHA-256 of the key;
    // the key itself is returned once by createBotKey and never stored. Admin only (rules).
    // null when the rules do not allow the list yet.
    listBotKeys: function () {
      needDb();
      return _db.collection('botKeys').get().then(function (q) { return q.docs.map(docData); })
        .catch(function (err) { if (isDenied(err)) return null; throw err; });
    },
    createBotKey: function (fields) {
      needDb();
      var label = String(fields.botEmailLabel || '').trim().toLowerCase();
      var sections = fields.sections || {};
      var cryptoApi = window.crypto;
      if (!cryptoApi || !cryptoApi.subtle) return Promise.reject(new Error('This browser cannot make a key here. Use the hosted site over https.'));
      function b64url(bytes) {
        var s = '';
        for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
        return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      }
      var idBytes = cryptoApi.getRandomValues(new Uint8Array(6));
      var keyId = Array.prototype.map.call(idBytes, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      var key = 'mbk_' + keyId + '_' + b64url(cryptoApi.getRandomValues(new Uint8Array(32)));
      return cryptoApi.subtle.digest('SHA-256', new TextEncoder().encode(key)).then(function (buf) {
        var hash = Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
        var at = nowIso();
        var doc = {
          botName: String(fields.botName || '').trim(), botEmailLabel: label, sha256: hash, sections: sections,
          sponsorUserEmail: String(fields.sponsorUserEmail || myEmail()).toLowerCase(), status: 'active',
          createdBy: myEmail(), createdAt: at, lastUsedAt: null
        };
        // SOP owner check (#97): which SOP bot this key is, and whether it is the Matrix Manager.
        if (fields.sopBotId) doc.sopBotId = String(fields.sopBotId);
        if (fields.role === 'manager') doc.role = 'manager';
        return commitWithAudit(function (b) { b.set(_db.collection('botKeys').doc(keyId), doc); },
          auditEntry('create-key', { botEmail: label, after: { keyId: keyId, sections: sections, status: 'active', sponsorUserEmail: doc.sponsorUserEmail, sopBotId: doc.sopBotId || null, role: doc.role || null } }))
          .then(function (r) { return { key: key, keyId: keyId, audited: r.audited }; });
      });
    },
    // Change which sections an active key can write. The key string and its hash stay the same,
    // so the bot keeps working with the new access on its next call.
    updateBotKeySections: function (k, sections) {
      needDb();
      var at = nowIso();
      return commitWithAudit(function (b) {
        b.update(_db.collection('botKeys').doc(k.id), { sections: sections || {}, updatedAt: at, updatedBy: myEmail() });
      }, auditEntry('update-key', { botEmail: k.botEmailLabel || '', before: { keyId: k.id, sections: k.sections || {} }, after: { keyId: k.id, sections: sections || {} } }));
    },
    revokeBotKey: function (k, note) {
      needDb();
      var at = nowIso();
      return commitWithAudit(function (b) {
        b.update(_db.collection('botKeys').doc(k.id), { status: 'revoked', revokedAt: at, revokedBy: myEmail() });
      }, auditEntry('revoke-key', { botEmail: k.botEmailLabel || '', before: { keyId: k.id, status: k.status || null, sections: k.sections || {} }, after: { keyId: k.id, status: 'revoked' }, note: note || '' }));
    },
    // Gmail sync (issue #54). Tokens never reach the browser: link, unlink and status go through the gmailLink
    // Function (admin only). The review list of unmatched senders is a normal workspace sub-collection.
    gmail: {
      call: function (body) {
        if (!_currentUser) return Promise.reject(new Error('Sign in first.'));
        return _currentUser.getIdToken().then(function (token) {
          return fetch('/api/gmailLink', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) {
            if (!r.ok || j.ok === false) throw new Error(j.error || ('Gmail service answered ' + r.status));
            return j;
          });
        });
      },
      reviewList: function () {
        needDb();
        return _docRef.collection('gmailReview').get().then(function (q) { return q.docs.map(docData); });
      },
      // Thread index written by gmailSync (#137): live list of threads linked to one deal, newest first.
      // Returns an unsubscribe function. Needs no browser Gmail login.
      watchThreads: function (dealId, onRows, onError) {
        needDb();
        return _docRef.collection('emailThreads').where('dealIds', 'array-contains', String(dealId)).onSnapshot(function (qs) {
          var rows = qs.docs.map(function (d) { var v = d.data() || {}; if (!v.id) v.id = d.id; return v; });
          rows.sort(function (a, b) { return String(b.lastMessageAt || '').localeCompare(String(a.lastMessageAt || '')); });
          onRows(rows);
        }, function (err) { if (onError) onError(err); });
      },
      dismissReview: function (email) {
        needDb();
        return _docRef.collection('gmailReview').doc(String(email).replace(/\//g, '_')).set({ dismissedAt: nowIso(), dismissedBy: myEmail() }, { merge: true });
      }
    },
    // Backups (issue #111). Status docs are read straight from Firestore (admins only by rule);
    // download and restore go through the backupAdmin Function with the signed-in ID token.
    backups: {
      list: function () {
        needDb();
        return _db.collection('backups').orderBy('date', 'desc').limit(45).get().then(function (q) { return q.docs.map(docData); });
      },
      call: function (body) {
        if (!_currentUser) return Promise.reject(new Error('Sign in first.'));
        return _currentUser.getIdToken().then(function (token) {
          return fetch('/api/backupAdmin', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) {
            if (!r.ok || j.ok === false) throw new Error(j.error || ('Backup service answered ' + r.status));
            return j;
          });
        });
      },
      // Staging only. Copies the production state blob into workspace/staging. Production is only read.
      copyProductionToStaging: function () {
        needDb();
        if (window.MATRIX_ENV !== 'staging') return Promise.reject(new Error('Only available on a staging preview.'));
        return _db.collection('workspace').doc('main').get().then(function (snap) {
          var data = snap.exists ? snap.data() : null;
          if (!data || !data.state) throw new Error('Production has no state to copy.');
          var SM = window.StuffMigrate;
          var cols = SM.SPLIT_COLLECTIONS ? SM.SPLIT_COLLECTIONS.map(function (p) { return p[1]; }) : null;
          // Records first, then the state that points at them, so staging never reads a split state without its records.
          return SM.copyRecordsToStaging(_db, 'workspace/main', STAGING_WRITE_PATH, cols).then(function (report) {
            return _db.collection('workspace').doc('staging').set({
              state: data.state, updatedAt: nowIso(), updatedBy: myEmail(), copiedFrom: 'workspace/main', copiedFromUpdatedAt: data.updatedAt || null
            }).then(function () { return { copiedFromUpdatedAt: data.updatedAt || null, records: report }; });
          });
        });
      }
    },
    sectionsArrayToMap: sectionsArrayToMap,
    sectionsMapToArray: sectionsMapToArray
  };

  function detachSnapshot() {
    if (_unsubSnap) {
      try { _unsubSnap(); } catch (e) { /* ignore */ }
      _unsubSnap = null;
    }
    exitSplit();
  }

  function onAuthed(user) {
    hideGate();
    setStatus('');
    applyAuthChrome(user);
    var path = parseStatePath();
    _docRef = _db.collection(path.collection).doc(path.doc);
    attachSnapshot();
  }

  function onSignedOut(message, isError) {
    _gmail = null; // Gmail access ends with the Matrix sign-in
    detachSnapshot();
    _docRef = null;
    _baseUpdatedAt = null;
    if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
    applyAuthChrome(null);
    showGate();
    if (message) setStatus(message, !!isError);
    else setStatus('');
  }

  function signIn() {
    if (!_auth) {
      setStatus('Firebase Auth is not available.', true);
      return Promise.reject(new Error('no auth'));
    }
    _refusal = '';
    setStatus('Opening Google sign-in…');
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return _auth.signInWithPopup(provider).catch(function (err) {
      var msg = (err && err.message) ? err.message : String(err);
      if (err && err.code === 'auth/popup-blocked') {
        msg = 'Popup blocked. Allow popups for this site and try again.';
      }
      setStatus(msg, true);
      throw err;
    });
  }

  function signOut() {
    detachSnapshot();
    if (_auth) {
      return _auth.signOut().catch(function (err) {
        console.warn('MatrixCloud signOut failed', err);
      }).then(function () {
        onSignedOut('');
      });
    }
    onSignedOut('');
    return Promise.resolve();
  }

  // Apply a newer cloud copy after this tab's pending change lost the race.
  // The local copy goes to Time machine first; nothing is merged.
  function notifyConflict(remoteData) {
    _applying = true;
    try {
      if (typeof _api.onCloudConflict === 'function') {
        _api.onCloudConflict(remoteData);
      } else {
        if (typeof _api.setState === 'function') _api.setState(remoteData.state);
        if (typeof _api.saveLocal === 'function') _api.saveLocal();
        if (typeof _api.render === 'function') _api.render();
      }
      _baseUpdatedAt = remoteData.updatedAt || null;
    } catch (e) {
      console.warn('MatrixCloud conflict apply failed', e);
    } finally {
      _applying = false;
    }
  }

  // Stale-save guard (Owner approved 2026-09-24): write only if workspace/main still has the
  // updatedAt this tab last saw. If a CLI, bot or other tab wrote in between, abort the write,
  // keep the local copy in Time machine, reload the cloud copy. Equality, not "newer than",
  // so clocks on different machines do not matter. Every writer (CLI included) sets updatedAt.
  function queueCloudSave() {
    if (!_ready || !_docRef || _applying || !_currentUser) return;
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(function () {
      _saveTimer = null;
      if (!_docRef || _applying || !_currentUser) return;
      var state = typeof _api.getState === 'function' ? _api.getState() : null;
      if (!state) return;
      if (_split) { saveSplit(state); return; }
      _writing = true;
      _lastWriteAt = Date.now();
      var conflict = null;
      var writtenAt = null;
      var splitSwitched = null;
      _db.runTransaction(function (tx) {
        conflict = null;
        writtenAt = null;
        return tx.get(_docRef).then(function (snap) {
          var remote = snap.exists ? (snap.data() || {}) : null;
          var remoteAt = remote ? (remote.updatedAt || null) : null;
          if (isSplitData(remote)) { splitSwitched = remote; return; } // never write records back into workspace/main
          if (remote && remote.state && remoteAt !== _baseUpdatedAt) {
            conflict = remote;
            return;
          }
          writtenAt = new Date().toISOString();
          var fields = { state: state, updatedAt: writtenAt, updatedBy: (_currentUser && _currentUser.email) || '' };
          // update replaces state whole. set with merge would deep-merge it and keep keys this tab deleted (a cleared snooze).
          if (remote) tx.update(_docRef, fields); else tx.set(_docRef, fields);
        });
      }).then(function () {
        _writing = false;
        _lastWriteAt = Date.now();
        if (splitSwitched) {
          // An admin moved the records to split storage. Keep this tab's copy in Time machine, then load the split copy.
          if (typeof _api.snapshotLocal === 'function') _api.snapshotLocal('before-split-reload');
          enterSplit(splitSwitched);
          return;
        }
        if (conflict) notifyConflict(conflict);
        else if (writtenAt) _baseUpdatedAt = writtenAt;
      }).catch(function (err) {
        _writing = false;
        console.warn('MatrixCloud queueCloudSave failed', err);
        // Offline or transient error: try again shortly with whatever is current. Never force.
        if (typeof _api.onCloudSaveError === 'function') _api.onCloudSaveError(err);
        setTimeout(function () { if (_docRef && _currentUser) queueCloudSave(); }, 5000);
      });
    }, DEBOUNCE_MS);
  }

  function start(api) {
    _api = api || {};

    var hasFirebase =
      typeof firebase !== 'undefined' &&
      firebase.app &&
      window.MATRIX_FIREBASE &&
      window.MATRIX_FIREBASE.apiKey;

    if (!hasFirebase) {
      ensureBooted();
      return;
    }

    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(window.MATRIX_FIREBASE);
      }
      _auth = firebase.auth();
      var rawDb = firebase.firestore();
      // Offline persistence (#103), turned on once this browser has used split storage (it must be set
      // before the first read, so the first split load runs without it).
      var seenSplit = false;
      try { seenSplit = localStorage.getItem(SPLIT_SEEN_KEY) === '1'; } catch (e) { /* private mode */ }
      if (seenSplit && typeof rawDb.enablePersistence === 'function') {
        rawDb.enablePersistence({ synchronizeTabs: true }).catch(function (err) { console.warn('MatrixCloud offline persistence off', err && err.code); });
      }
      _db = guardStaging(rawDb);
    } catch (e) {
      console.warn('MatrixCloud init failed, falling back to local', e);
      ensureBooted();
      return;
    }

    _ready = true;
    showGate();
    setStatus('Checking session…');

    _auth.onAuthStateChanged(function (user) {
      if (!user) {
        onSignedOut(_refusal, !!_refusal);
        return;
      }
      var email = (user.email || '').toLowerCase();
      if (isAllowed(email)) { onAuthed(user); return; }
      setStatus('Checking your invite…');
      checkInvite(user, email).then(function (ok) {
        if (ok) { onAuthed(user); return; }
        _refusal = email + ' is not invited to the Matrix. Ask an admin for an invite.';
        _auth.signOut().finally(function () { onSignedOut(_refusal, true); });
      });
    });
  }

  // Not on the fixed allowlist: allowed only with an invite (users/{email}). Firestore rules make
  // the same check, so this is the UI side of it, not the lock. Needs a verified email.
  // 'invited': the first sign-in claims it (uid and status 'active'). 'active': only the Auth
  // account that claimed it. Anything else, or any error, means no entry.
  function checkInvite(user, email) {
    if (!user.emailVerified) return Promise.resolve(false);
    var ref = _db.collection('users').doc(email);
    return ref.get().then(function (snap) {
      var d = snap.exists ? (snap.data() || {}) : null;
      if (!d) return false;
      if (d.status === 'active') return !!d.uid && d.uid === user.uid;
      if (d.status !== 'invited') return false;
      var at = nowIso();
      var claim = { uid: user.uid, status: 'active', activatedAt: at, updatedAt: at };
      if (!d.displayName && user.displayName) claim.displayName = user.displayName;
      if (!d.photoURL && user.photoURL) claim.photoURL = user.photoURL;
      return ref.update(claim).then(function () { return true; });
    }).catch(function (err) {
      console.warn('MatrixCloud invite check failed', err);
      return false;
    });
  }

  // Gmail (issue #14). Runs in the browser as the signed-in person: Connect Gmail asks Google for
  // Gmail scopes in a popup; the access token stays in memory (about an hour) and is never saved.
  // Only the app's Send button (a human click) calls send; this file never sends on its own.
  var GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/gmail.send'];
  var GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me/';
  var _gmail = null; // { token, email, expiresAt }

  function gmailReady() { return !!(_gmail && _gmail.token && Date.now() < _gmail.expiresAt && _currentUser && myEmail() === _gmail.email); }

  function gmailFetch(path, opts) {
    if (!gmailReady()) return Promise.reject(new Error('Connect Gmail first.'));
    opts = opts || {};
    var init = { method: opts.method || 'GET', headers: { Authorization: 'Bearer ' + _gmail.token } };
    if (opts.body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    return fetch(GMAIL_BASE + path, init).then(function (r) {
      if (r.status === 401) { _gmail = null; throw new Error('Gmail sign-in expired. Connect Gmail again.'); }
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error((j && j.error && j.error.message) || ('Gmail error ' + r.status));
        return j;
      });
    });
  }

  var gmail = {
    isConnected: gmailReady,
    email: function () { return gmailReady() ? _gmail.email : ''; },
    connect: function () {
      if (!_currentUser) return Promise.reject(new Error('Sign in to the hosted Matrix first.'));
      var provider = new firebase.auth.GoogleAuthProvider();
      GMAIL_SCOPES.forEach(function (sc) { provider.addScope(sc); });
      provider.setCustomParameters({ login_hint: myEmail() });
      return _currentUser.reauthenticateWithPopup(provider).then(function (res) {
        var token = res && res.credential && res.credential.accessToken;
        if (!token) throw new Error('Google did not return Gmail access.');
        _gmail = { token: token, email: myEmail(), expiresAt: Date.now() + 55 * 60 * 1000 };
        return { email: _gmail.email };
      });
    },
    disconnect: function () { _gmail = null; },
    listDrafts: function (q) {
      return gmailFetch('drafts?maxResults=20' + (q ? '&q=' + encodeURIComponent(q) : '')).then(function (j) {
        return Promise.all((j.drafts || []).map(function (d) { return gmailFetch('drafts/' + encodeURIComponent(d.id) + '?format=full'); }));
      });
    },
    updateDraft: function (id, raw, threadId) {
      var message = { raw: raw };
      if (threadId) message.threadId = threadId;
      return gmailFetch('drafts/' + encodeURIComponent(id), { method: 'PUT', body: { id: id, message: message } });
    },
    sendDraft: function (id) { return gmailFetch('drafts/send', { method: 'POST', body: { id: id } }); },
    listMessages: function (q) {
      return gmailFetch('messages?maxResults=25' + (q ? '&q=' + encodeURIComponent(q) : '')).then(function (j) {
        return Promise.all((j.messages || []).map(function (m) {
          return gmailFetch('messages/' + encodeURIComponent(m.id) + '?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=Date');
        }));
      });
    }
  };


  // Split storage tool (issue #103), run from Admin tools by an admin (Firestore rules decide).
  // copy: archive the whole workspace/main document in workspaceSnapshots (chunks), write every record to
  //   workspace/main/<collection>/<id> (removing leftovers of an earlier copy), re-read and verify.
  //   workspace/main itself is not touched, so nothing changes for anyone yet.
  // switchOn: only if workspace/main has not changed since the copy; config only, settings.storage = 'split'.
  // rollback: join the records back into workspace/main.state. The record documents stay as they are.
  var SPLIT_SIZE_LIMIT = 950 * 1024;
  var SPLIT_CHUNK_CHARS = 200 * 1000;
  function splitBusy() { return !!(_saveTimer || _writing); }
  function commitOps(ops) {
    var groups = [];
    for (var i = 0; i < ops.length; i += SPLIT_TX_MAX) groups.push(ops.slice(i, i + SPLIT_TX_MAX));
    return groups.reduce(function (p, g) {
      return p.then(function () {
        var b = _db.batch();
        g.forEach(function (o) { if (o.del) b.delete(o.ref); else b.set(o.ref, o.data); });
        return b.commit();
      });
    }, Promise.resolve());
  }
  function readCollections() {
    var lists = {};
    return splitCols().reduce(function (p, col) {
      return p.then(function () {
        return _docRef.collection(col).get().then(function (qs) {
          lists[col] = qs.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
        });
      });
    }, Promise.resolve()).then(function () { return lists; });
  }
  function writeArchive(label, data) {
    var ref = _db.collection('workspaceSnapshots').doc();
    var json = JSON.stringify(data.state);
    var ops = [];
    for (var i = 0; i * SPLIT_CHUNK_CHARS < json.length; i++) {
      ops.push({ ref: ref.collection('chunks').doc(String(i)), data: { i: i, data: json.slice(i * SPLIT_CHUNK_CHARS, (i + 1) * SPLIT_CHUNK_CHARS) } });
    }
    // The summary goes last, so a summary means every chunk is there.
    ops.push({ ref: ref, data: { label: label, stateUpdatedAt: data.updatedAt || null, takenAt: nowIso(), takenBy: myEmail(), actedFor: null,
      chunked: true, chunks: ops.length, bytes: new Blob([json]).size } });
    return commitOps(ops).then(function () { return ref.id; });
  }
  function storageError(msg) { return Promise.reject(new Error(msg)); }

  var storage = {
    status: function () { return { cloud: !!(_docRef && _currentUser), split: !!_split }; },
    copy: function () {
      try { needDb(); } catch (e) { return Promise.reject(e); }
      if (_split) return storageError('The records are already split.');
      if (splitBusy()) return storageError('A save is still running. Try again in a moment.');
      var sm = SM(), src = null, out = {};
      return _docRef.get().then(function (snap) {
        src = snap.exists ? (snap.data() || {}) : null;
        if (!src || !src.state) throw new Error('There is no hosted workspace to copy.');
        if (isSplitData(src)) throw new Error('The records are already split.');
        var plan = sm.splitPlan(src.state);
        if (plan.blockers.length) throw new Error('Fix these first: ' + plan.blockers.join('; '));
        out.plan = plan;
        out.sourceUpdatedAt = src.updatedAt || null;
        return writeArchive('before-split', src);
      }).then(function (archiveId) {
        out.archiveId = archiveId;
        return readCollections();
      }).then(function (existing) {
        var parts = sm.splitState(src.state), ops = [], removed = 0;
        Object.keys(parts.collections).forEach(function (col) {
          var keep = {};
          parts.collections[col].forEach(function (x) { keep[x.id] = true; ops.push({ ref: _docRef.collection(col).doc(x.id), data: x.data }); });
          (existing[col] || []).forEach(function (d) {
            if (!keep[d.id]) { removed += 1; ops.push({ ref: _docRef.collection(col).doc(d.id), del: true }); }
          });
        });
        out.written = ops.length - removed;
        out.removed = removed;
        return commitOps(ops);
      }).then(function () { return storage.verify(src); }).then(function (v) {
        out.verify = v;
        out.ok = v.ok;
        return out;
      });
    },
    // Re-read the record documents and compare them field by field with the source (default: workspace/main now).
    verify: function (source) {
      try { needDb(); } catch (e) { return Promise.reject(e); }
      var sm = SM();
      var getSource = source ? Promise.resolve(source) : _docRef.get().then(function (snap) { return snap.exists ? snap.data() || {} : {}; });
      return getSource.then(function (src) {
        if (!src.state) throw new Error('There is no hosted workspace to check.');
        return readCollections().then(function (lists) {
          var cfg = sm.splitState(src.state).config;
          return sm.verifySplit(isSplitData(src) ? sm.joinState(src.state, lists) : src.state, sm.joinState(cfg, lists));
        });
      });
    },
    switchOn: function (copy) {
      try { needDb(); } catch (e) { return Promise.reject(e); }
      if (!copy || !copy.ok) return storageError('Copy and check the records first.');
      if (_split) return storageError('The records are already split.');
      if (splitBusy()) return storageError('A save is still running. Try again in a moment.');
      var sm = SM(), at = nowIso(), changed = false;
      return _db.runTransaction(function (tx) {
        changed = false;
        return tx.get(_docRef).then(function (snap) {
          var cur = snap.exists ? (snap.data() || {}) : null;
          if (!cur || !cur.state || isSplitData(cur) || (cur.updatedAt || null) !== copy.sourceUpdatedAt) { changed = true; return; }
          var cfg = sm.splitState(cur.state).config;
          cfg.settings = Object.assign({}, cfg.settings, { storage: 'split' });
          tx.update(_docRef, { state: cfg, updatedAt: at, updatedBy: myEmail(), recordsUpdatedAt: at, splitAt: at, splitArchiveId: copy.archiveId || null });
        });
      }).then(function () {
        if (changed) throw new Error('The data changed since the copy. Copy and check again.');
        return { ok: true, at: at };
      });
    },
    rollback: function () {
      try { needDb(); } catch (e) { return Promise.reject(e); }
      if (splitBusy()) return storageError('A save is still running. Try again in a moment.');
      var sm = SM(), at = nowIso(), joined = null, readAt = null, changed = false;
      return _docRef.get().then(function (snap) {
        var cur = snap.exists ? (snap.data() || {}) : null;
        if (!isSplitData(cur)) throw new Error('The records are not split.');
        readAt = cur.updatedAt || null;
        return readCollections().then(function (lists) {
          joined = sm.joinState(cur.state, lists);
          joined.settings = Object.assign({}, joined.settings);
          delete joined.settings.storage;
          var bytes = new Blob([JSON.stringify(joined)]).size;
          if (bytes >= SPLIT_SIZE_LIMIT) throw new Error('The joined data is ' + Math.round(bytes / 1024) + ' KB, too big for one document. Stay split.');
        });
      }).then(function () {
        return _db.runTransaction(function (tx) {
          changed = false;
          return tx.get(_docRef).then(function (snap) {
            var cur = snap.exists ? (snap.data() || {}) : null;
            if (!cur || (cur.updatedAt || null) !== readAt) { changed = true; return; }
            tx.update(_docRef, { state: joined, updatedAt: at, updatedBy: myEmail(), splitRolledBackAt: at });
          });
        });
      }).then(function () {
        if (changed) throw new Error('Someone saved while joining. Try again.');
        return { ok: true, at: at };
      });
    }
  };

  window.MatrixCloud = {
    start: start,
    gmail: gmail,
    queueCloudSave: queueCloudSave,
    signIn: signIn,
    signOut: signOut,
    isApplying: function () { return _applying; },
    isSplit: function () { return !!_split; },
    storage: storage,
    access: access
  };
})();
