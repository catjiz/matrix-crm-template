/* Matrix CRM app (split from index.html for hosting) */
(function () {
  const STORAGE_KEY = 'matrix-crm-v12-customers';
  const V11_STORAGE_KEY = 'matrix-crm-v11-tasks-eisenhower';
  const SNAPSHOT_KEY = 'matrix-crm-v12-snapshots';
  const AUTH_KEY = 'matrix-crm-v12-auth';
  const LEGACY_STORAGE_KEYS = [
    V11_STORAGE_KEY,
    'matrix-crm-v10-source',
    'matrix-crm-v9-tasks',
    'matrix-crm-v8-menu',
    'matrix-crm-v7-files',
    'matrix-crm-v6-project',
    'matrix-crm-v5-stages',
    'matrix-crm-v4-left-nav',
    'matrix-crm-v3-areas',
    'matrix-crm-v2-partner',
    'matrix-crm-v2-five-sections',
    'matrix-crm-v1-kpi-tasks',
    'matrix-crm-v1-dnd',
    'matrix-crm-v1-values',
    'matrix-crm-v1-sections',
    'matrix-crm-v0-pd',
    'matrix-crm-v0'
  ];
  const ACTIVE_NAV_KEY = 'matrix-crm-v4-active-nav';
  const LEGACY_ACTIVE_NAV_KEYS = ['matrix-crm-v3-active-nav'];
  const NAV_OPEN_KEY = 'matrix-crm-v4-nav-open';
  const AREA_OPEN_KEY = 'matrix-crm-v5-area-open';
  const ACTIVE_SECTION_KEY = 'matrix-crm-v1-active-section';
  const SOURCE_OPTIONS = [
    { id: 'referral', label: 'Referral' },
    { id: 'ai', label: 'A.I.' },
    { id: 'google', label: 'Google' },
    { id: 'tradeshow', label: 'Tradeshow' },
    { id: 'website', label: 'Website' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'cold-outreach', label: 'Cold outreach' },
    { id: 'partner', label: 'Partner' },
    { id: 'existing-customer', label: 'Existing customer' },
    { id: 'email', label: 'Direct email' },
    { id: 'other', label: 'Other' }
  ];
  const ACTIVE_VIEW_KEY = 'matrix-crm-v1-active-view';
  const SECTIONS = [
    {
      "id": "cold-leads",
      "label": "Cold Leads",
      "area": "crm",
      "stages": [
        "cold-leads",
        "lost"
      ]
    },
    {
      "id": "inbound-leads",
      "label": "Inbound Leads",
      "area": "crm",
      "stages": [
        "inbound-jotform"
      ]
    },
    {
      "id": "partner-leads",
      "label": "Partner Leads",
      "area": "crm",
      "stages": [
        "partner-new",
        "partner-active",
        "partner-handed-off"
      ],
      "copyOnDrop": true
    },
    {
      "id": "quotes",
      "label": "Quotes",
      "area": "crm",
      "stages": [
        "needs-quotation",
        "needs-updated-quotation",
        "design-prototyping-quote-sent",
        "follow-up-negotiation",
        "invoicing",
        "won-awaiting-payment"
      ]
    },
    {
      "id": "pp-design",
      "label": "Design",
      "area": "pre-production",
      "stages": [
        "design-in-progress",
        "round-1",
        "round-2",
        "round-3",
        "completed-end-deal"
      ]
    },
    {
      "id": "pp-prototyping",
      "label": "Prototyping",
      "area": "pre-production",
      "stages": [
        "prototyping-in-progress",
        "round-1-fwa",
        "round-2-d3x",
        "round-3-tfm",
        "complete-end-deal"
      ]
    },
    {
      "id": "pp-tooling",
      "label": "Tooling",
      "area": "pre-production",
      "stages": [
        "needs-sourcing",
        "tooling-production-quoted",
        "won-tooling-committed",
        "production-po-received",
        "raw-material-sampling",
        "freight"
      ]
    },
    {
      "id": "fo-scheduling",
      "label": "Scheduling",
      "area": "floor-operations",
      "stages": [
        "handoff-to-operations"
      ]
    },
    {
      "id": "fo-raw-materials-production",
      "label": "Raw Materials",
      "area": "floor-operations",
      "stages": [
        "raw-materials-production"
      ]
    },
    {
      "id": "fo-processes",
      "label": "Processes",
      "area": "floor-operations",
      "stages": [
        "processes"
      ]
    },
    {
      "id": "fo-qc",
      "label": "QC",
      "area": "floor-operations",
      "stages": [
        "qc"
      ]
    },
    {
      "id": "fo-packaging",
      "label": "Packaging",
      "area": "floor-operations",
      "stages": [
        "packaging"
      ]
    },
    {
      "id": "fo-ordering",
      "label": "Shop Needs",
      "area": "floor-operations",
      "stages": [
        "amazon-com",
        "ppe-com"
      ]
    }
  ];
  const STAGE_LABELS = {
    "cold-leads": "Cold Leads",
    "book-a-call": "Book A Call",
    "discovery-call-booked": "Discovery Call Booked",
    "interested-cool": "Interested *Cool*",
    "interested-hot": "Interested *Hot*",
    "inbound-jotform": "Inbound (Jotform)",
    "partner-new": "New",
    "partner-active": "Active",
    "partner-handed-off": "Handed to Design",
    "needs-quotation": "Needs Quotation",
    "needs-updated-quotation": "Needs Updated Quotation",
    "design-prototyping-quote-sent": "Design & Prototyping Quote SENT",
    "follow-up-negotiation": "Follow-up & Negotiation",
    "invoicing": "Invoicing",
    "won-awaiting-payment": "Won, awaiting payment",
    "design-in-progress": "Design Start",
    "prototyping-in-progress": "Prototype Start",
    "needs-sourcing": "Needs Sourcing",
    "tooling-production-quoted": "Tooling & Production Quoted",
    "won-tooling-committed": "WON! Tooling Committed",
    "production-po-received": "Production PO Received",
    "sampling": "Sampling",
    "raw-material-sampling": "Raw Material Sampling",
    "freight": "Logistics",
    "amazon-com": "Amazon.com",
    "ppe-com": "PPE.com",
    "handoff-to-operations": "Handoff to Operations",
    "materials-ready": "Materials Ready",
    "first-articles": "First Articles",
    "production-setup": "Production Setup",
    "raw-materials-production": "Raw Materials",
    "processes": "Processes",
    "qc": "QC",
    "packaging": "Packaging",
    "ordering": "Ordering",
    "lost": "\"No\" = Lost",
    "completed": "Completed",
    "round-1": "Round 1.",
    "round-2": "Round 2.",
    "round-3": "Round 3.",
    "completed-end-deal": "Completed, End Deal",
    "round-1-fwa": "Round 1.",
    "round-2-d3x": "Round 2.",
    "round-3-tfm": "Round 3.",
    "complete-end-deal": "Complete, End Deal"
  };
  const DEFAULT_STAGES = ["cold-leads","lost","inbound-jotform","partner-new","partner-active","partner-handed-off","needs-quotation","needs-updated-quotation","design-prototyping-quote-sent","follow-up-negotiation","invoicing","won-awaiting-payment","design-in-progress","round-1","round-2","round-3","completed-end-deal","prototyping-in-progress","round-1-fwa","round-2-d3x","round-3-tfm","complete-end-deal","needs-sourcing","tooling-production-quoted","won-tooling-committed","production-po-received","raw-material-sampling","freight","handoff-to-operations","materials-ready","first-articles","production-setup","raw-materials-production","processes","qc","packaging","amazon-com","ppe-com"];
  const KPI_PAGES = [
    { id: 'overview', label: 'Overview' },
    { id: 'sales-deep', label: 'Sales deep dive' },
    { id: 'ops-deep', label: 'Operations deep dive' }
  ];
  const AREAS = [
    {
      "id": "crm",
      "label": "CRM",
      "role": "crm"
    },
    {
      "id": "pre-production",
      "label": "Pre-Production",
      "role": "pre-production"
    },
    {
      "id": "floor-operations",
      "label": "Operations",
      "role": "operations"
    },
    {
      "id": "kpis",
      "label": "KPI's",
      "role": "kpis"
    }
  ];

  const TASK_GROUPS = [
    {
      id: 'tasks-crm',
      label: 'CRM',
      buckets: [
        { id: 'tasks-crm-quotes-needed', label: 'Quotes Needed', auto: 'quotes-needed' },
        { id: 'tasks-crm-follow-ups', label: 'Follow Ups', auto: 'follow-ups' },
        { id: 'tasks-crm-send-invoice', label: 'Send Invoice', auto: 'send-invoice' },
        { id: 'tasks-crm-stale', label: 'Stale Deals', auto: 'stale' }
      ]
    },
    {
      id: 'tasks-pre-production',
      label: 'Pre-Production',
      buckets: [
        { id: 'tasks-pp-designs', label: 'Designs', auto: 'board:pp-design' },
        { id: 'tasks-pp-prototypes', label: 'Prototypes', auto: 'board:pp-prototyping' },
        { id: 'tasks-pp-tooling', label: 'Tooling', auto: 'board:pp-tooling' },
        { id: 'tasks-pp-customer-tooling-samples', label: 'Customer Tooling Samples', auto: null },
        { id: 'tasks-pp-raw-material-samples', label: 'Raw Material Samples', auto: null },
        { id: 'tasks-pp-logistics', label: 'Logistics', auto: null }
      ]
    },
    {
      id: 'tasks-operations',
      label: 'Operations',
      buckets: [
        { id: 'tasks-ops-schedule-jobs', label: 'Schedule Jobs', auto: 'board:fo-scheduling' },
        { id: 'tasks-ops-order-raw-materials', label: 'Order Raw Materials', auto: 'order-material' },
        { id: 'tasks-ops-schedule-first-article-samples', label: 'Schedule First Article Samples', auto: null },
        { id: 'tasks-ops-qc-issues', label: 'QC Issues', auto: null },
        { id: 'tasks-ops-process-issues', label: 'Process Issues', auto: null },
        { id: 'tasks-ops-packaging-needs', label: 'Packaging Needs', auto: null },
        { id: 'tasks-ops-shop-floor-orders-needed', label: 'Shop Floor Orders Needed', auto: null }
      ]
    }
  ];

  const TERMINAL_STAGES = [
    'won-tooling-committed',
    'production-po-received',
    'handoff-to-operations',
    'materials-ready',
    'first-articles',
    'production-setup',
    'lost',
    'won'
  ];
  const ROT_DAYS = 14; // global idle fallback; stages override it (stageIdleDays)
  const SEED_DATA = (typeof window !== 'undefined' && window.MATRIX_SEED) ? window.MATRIX_SEED : { version: 11, sections: [], deals: [], tasks: [] };

  let activeArea = 'crm';
  let activeBoardId = 'cold-leads';
  let activeKpiPage = 'overview';
  let activeView = 'board';
  let activeDetailId = null;
  let activeCustomerId = null;
  let lastMigrationReport = null;
  let activeTaskBucket = 'tasks-crm-quotes-needed';
  let taskGroupOpen = { 'tasks-crm': true, 'tasks-pre-production': false, 'tasks-operations': false };
  let taskFilter = 'open';
  let activeTasksTab = 'home';
  let showAllCompleted = false;
  let activeTasksBucketFilter = 'all';
  let dragTaskId = null;
  let tasksPopoverEl = null;
  let dragDealId = null;
  let suppressCardClick = false;
  let editingId = null;
  let pendingNotes = [];
  let pendingFiles = null;
  let stagesEditMode = false;
  let menuEditMode = false;
  let detailPendingNotes = [];
  let detailPendingFiles = null;

  function uid() {
    return 'd_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  const QUOTE_NEEDED_STAGES = ['needs-quotation', 'needs-updated-quotation'];

  function isQuoteNeededStage(stage) {
    return QUOTE_NEEDED_STAGES.indexOf(stage) !== -1;
  }

  function toDateOnly(val) {
    if (!val) return todayStr();
    var s = String(val);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    try {
      var d = new Date(s);
      if (isNaN(d.getTime())) return todayStr();
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + day;
    } catch (e) {
      return todayStr();
    }
  }

  function addDaysYmd(ymd, days) {
    var d = new Date(toDateOnly(ymd) + 'T12:00:00');
    d.setDate(d.getDate() + days);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function ensureStageEnteredAt(deal) {
    if (!deal) return;
    if (!deal.stageEnteredAt) {
      deal.stageEnteredAt = deal.updatedAt || deal.createdAt || nowIso();
    }
  }

  /** Set stage and refresh stageEnteredAt when the stage actually changes. */
  // Cold Leads carry no follow-ups, overdue badges or idle badges (Owner 2026-09-23).
  function isColdStage(stage) {
    return !!state && StuffMigrate.coldStages(state).indexOf(stage) !== -1;
  }

  function setDealStage(deal, newStage) {
    if (!deal || !newStage) return;
    if (deal.stage !== newStage) {
      deal.stage = newStage;
      deal.stageEnteredAt = nowIso();
    } else {
      ensureStageEnteredAt(deal);
    }
    if (isColdStage(deal.stage)) {
      deal.nextFollowUp = null;
      if (Array.isArray(deal.followUps)) deal.followUps = [];
    }
  }

  function quoteDueDateForDeal(deal) {
    ensureStageEnteredAt(deal);
    return addDaysYmd(deal.stageEnteredAt || deal.updatedAt || deal.createdAt, 3);
  }

  const VALUE_KEYS = [
    'designDfm',
    'prototyping',
    'tooling',
    'productionArr',
    'currentPo',
    'partnerServices'
  ];

  function emptyValues() {
    var o = {};
    VALUE_KEYS.forEach(function (k) { o[k] = 0; });
    return o;
  }


  const FILE_CATEGORIES = ['quotes', 'invoices', 'designs', 'molds', 'renderings'];
  const FILE_CATEGORY_LABELS = {
    quotes: 'Quotes',
    invoices: 'Invoices',
    designs: 'Designs',
    molds: 'Molds',
    renderings: 'Renderings'
  };
  const FILE_SOFT_LIMIT = 2 * 1024 * 1024;
  const IDB_NAME = 'matrix-crm-files';
  const IDB_STORE = 'blobs';
  var idbDbPromise = null;

  function emptyFiles() {
    var o = {};
    FILE_CATEGORIES.forEach(function (k) { o[k] = []; });
    return o;
  }

  function ensureDealFiles(deal) {
    if (!deal) return emptyFiles();
    if (!deal.files || typeof deal.files !== 'object') {
      deal.files = emptyFiles();
    } else {
      FILE_CATEGORIES.forEach(function (k) {
        if (!Array.isArray(deal.files[k])) deal.files[k] = [];
      });
    }
    return deal.files;
  }

  function cloneFilesMeta(files) {
    var src = files && typeof files === 'object' ? files : emptyFiles();
    var out = emptyFiles();
    FILE_CATEGORIES.forEach(function (k) {
      out[k] = (src[k] || []).map(function (f) {
        var copy = Object.assign({}, f);
        copy.mime = f.mime || '';
        copy.size = Number(f.size) || 0;
        copy.addedAt = f.addedAt || nowIso();
        copy.dataKey = f.dataKey || null;
        copy.dataURL = f.dataURL || null;
        return copy;
      });
    });
    return out;
  }

  function idbOpen() {
    if (idbDbPromise) return idbDbPromise;
    if (typeof indexedDB === 'undefined') {
      idbDbPromise = Promise.reject(new Error('IndexedDB unavailable'));
      return idbDbPromise;
    }
    idbDbPromise = new Promise(function (resolve, reject) {
      var req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('IDB open failed')); };
    });
    return idbDbPromise;
  }

  function idbPut(key, value) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(value, key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function idbGet(key) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(IDB_STORE, 'readonly');
        var req = tx.objectStore(IDB_STORE).get(key);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function idbDelete(key) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).delete(key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    }).catch(function () { /* ignore */ });
  }

  function formatBytes(n) {
    n = Number(n) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function readFileAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(file);
    });
  }

  function storeFileBlob(fileId, file) {
    return idbPut(fileId, file).then(function () {
      return { dataKey: fileId, dataURL: null };
    }).catch(function () {
      if (file.size > FILE_SOFT_LIMIT) {
        return Promise.reject(new Error('File too large for fallback storage (max ~2MB without IndexedDB).'));
      }
      return readFileAsDataURL(file).then(function (dataURL) {
        return { dataKey: null, dataURL: dataURL };
      });
    });
  }

  function openStoredFile(meta) {
    if (!meta) return;
    // Linked files (enrichment import: Drive or web links) open in a new tab.
    if (!meta.dataURL && /^https?:\/\//i.test(String(meta.url || ''))) {
      window.open(meta.url, '_blank', 'noopener');
      return;
    }
    if (meta.dataURL) {
      var a = document.createElement('a');
      a.href = meta.dataURL;
      a.download = meta.name || 'file';
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    var key = meta.dataKey || meta.id;
    idbGet(key).then(function (blob) {
      if (!blob) {
        alert('File data not found in browser storage.');
        return;
      }
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = meta.name || 'file';
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    }).catch(function () {
      alert('Could not open file.');
    });
  }

  function deleteStoredBlob(meta) {
    if (!meta) return Promise.resolve();
    var key = meta.dataKey || meta.id;
    if (!key || meta.dataURL) return Promise.resolve();
    return idbDelete(key);
  }

  function deepCopyDealFiles(sourceFiles) {
    var src = cloneFilesMeta(sourceFiles);
    var out = emptyFiles();
    var chain = Promise.resolve();
    FILE_CATEGORIES.forEach(function (cat) {
      (src[cat] || []).forEach(function (f) {
        chain = chain.then(function () {
          var newId = uid();
          var meta = {
            id: newId,
            name: f.name,
            mime: f.mime || '',
            size: Number(f.size) || 0,
            addedAt: f.addedAt || nowIso(),
            dataKey: null,
            dataURL: f.dataURL || null
          };
          if (f.url) meta.url = f.url;
          if (f.source) meta.source = f.source;
          if (f.dataURL || (f.url && !f.dataKey)) {
            out[cat].push(meta);
            return;
          }
          var key = f.dataKey || f.id;
          return idbGet(key).then(function (blob) {
            if (!blob) {
              out[cat].push(meta);
              return;
            }
            meta.dataKey = newId;
            return idbPut(newId, blob).then(function () {
              out[cat].push(meta);
            }).catch(function () {
              out[cat].push(meta);
            });
          }).catch(function () {
            out[cat].push(meta);
          });
        });
      });
    });
    return chain.then(function () { return out; });
  }

  function deleteAllDealBlobs(files) {
    var f = files || emptyFiles();
    var ps = [];
    FILE_CATEGORIES.forEach(function (cat) {
      (f[cat] || []).forEach(function (meta) {
        ps.push(deleteStoredBlob(meta));
      });
    });
    return Promise.all(ps);
  }


  function migrateDealValues(deal) {
    if (!deal) return emptyValues();
    if (deal.values && typeof deal.values === 'object') {
      var out = emptyValues();
      VALUE_KEYS.forEach(function (k) {
        out[k] = Number(deal.values[k]) || 0;
      });
      return out;
    }
    var one = deal.oneShot || {};
    return {
      designDfm: Number(one.designCadDfm) || 0,
      prototyping: 0,
      tooling: Number(one.moldTooling) || 0,
      productionArr: Number(deal.arr) || 0,
      currentPo: 0,
      partnerServices: 0
    };
  }

  function totalValue(deal) {
    var vals = (deal && deal.values) ? deal.values : migrateDealValues(deal);
    var sum = 0;
    VALUE_KEYS.forEach(function (k) {
      sum += Number(vals[k]) || 0;
    });
    return sum;
  }

  // Lead card face: Pre-Production, Mold Tooling, Estimated ARR.
  function leadFace(deal) {
    return StuffMigrate.cardFace(state, Object.assign({}, deal, { values: migrateDealValues(deal) }), 'lead');
  }

  // Gmail sync (#54): "Emailed Nd ago" and a red Reply waiting chip, from deal.email (written by the gmailSync Function).
  function emailAgoText(deal) {
    var n = StuffMigrate.emailedAgo(deal);
    if (n == null) return '';
    return 'Emailed ' + (n === 0 ? 'today' : n + 'd ago');
  }
  function replyWaitingChipHtml(deal) {
    return deal && deal.email && deal.email.replyWaiting === true ? '<span class="badge badge-reply-waiting" title="They wrote last and we have not answered yet">Reply waiting</span>' : '';
  }
  function staleChipHtml(deal) {
    return deal && deal.stale === true ? '<span class="badge badge-stale" title="No email or activity for a while. Clears on the next touch.">Stale</span>' : '';
  }
  function emailLineHtml(deal) {
    var t = emailAgoText(deal);
    return t ? '<div class="email-ago muted-note">' + escapeHtml(t) + '</div>' : '';
  }

  // Pre-Production, Mold Tooling and Estimated ARR summed over a stage's cards.
  function stageFaceTotals(deals, jobs) {
    var t = { prepro: 0, tooling: 0, arr: 0, arrPotential: 0 };
    function add(f, potential, counted) {
      if (!f) return;
      t.prepro += Number(f.prepro) || 0; t.tooling += Number(f.tooling) || 0;
      if (counted) t.arr += Number(f.arr) || 0;
      t.arrPotential += potential == null ? Number(f.arr) || 0 : potential;
    }
    // #102: Est. ARR counts only live leads; the potential line has every lead.
    deals.forEach(function (d) {
      if (isConvertedLead(d)) return;
      var f = leadFace(d);
      var pot = Number(d.arrPotential) > 0 ? Number(d.arrPotential) : null;
      add(f, pot, isProjectCard(d) || StuffMigrate.isArrCounted(state, d));
    });
    jobs.forEach(function (c) { if (c.kind === 'sku') add(StuffMigrate.cardFace(state, c.sku, 'sku'), null, true); });
    return t;
  }

  // Column mini totals: open on desktop, collapsed on phones until tapped (#104). A tap is remembered.
  var faceTotalsOpen = null;
  function stageFaceTotalsHtml(t) {
    var open = faceTotalsOpen != null ? faceTotalsOpen : !(window.matchMedia && window.matchMedia('(max-width: 719.98px)').matches);
    return '<details class="col-face-details"' + (open ? ' open' : '') + '><summary>Totals</summary><div class="col-face-totals">' +
      '<div><span>Pre-Production</span><strong>' + formatMoney(t.prepro) + '</strong></div>' +
      '<div><span>Mold Tooling</span><strong>' + formatMoney(t.tooling) + '</strong></div>' +
      '<div><span>Est. ARR</span><strong>' + formatMoney(t.arr) + '</strong></div>' +
      (Math.round(t.arrPotential) !== Math.round(t.arr) ? '<div class="col-arr-potential" title="ARR of every card here, cold, lost and idle included"><span>Potential</span><strong>' + formatMoney(t.arrPotential) + '</strong></div>' : '') +
      '</div></details>';
  }

  // Dollars a lead adds to column and pipeline totals: its deal values, or its newest quote when
  // the values are still blank.
  function leadDollars(deal) {
    var v = totalValue(deal);
    if (v > 0 || isProjectCard(deal)) return v;
    var q = StuffMigrate.latestQuote(state, deal);
    return q ? q.total : 0;
  }

  function isOpenPipelineLead(d) {
    return !!d && !isProjectCard(d) && !isConvertedLead(d) && !isLostStage(d.stage) && d.status !== 'lost' && d.status !== 'archived';
  }

  // Quoted pipeline line above lead boards: newest quote totals across every open lead, and on this board.
  // =====================================================================
  // ARR counted vs potential (issue #102). Pipeline ARR leaves out cold, lost and leads with no
  // activity for 45+ days; "Count in ARR" (arrPinned) keeps a stale lead in. Potential is every
  // open lead's ARR (or its ARR potential when set). True ARR is sold jobs only.
  // =====================================================================
  function arrStatusText(deal) {
    var why = StuffMigrate.arrExcludedReason(state, deal);
    if (why === 'won') return 'Won: its ARR is on its SKU jobs (True ARR).';
    if (!why) return deal.arrPinned ? 'Counted in Pipeline ARR (pinned).' : 'Counted in Pipeline ARR.';
    return 'Not counted in Pipeline ARR: ' + why + '. Still in ARR potential.';
  }

  function arrControlsHtml(deal) {
    return '<div class="arr-controls"><div class="row">' +
      '<div class="field"><label for="d-arrPotential">ARR potential ($, optional)</label><input type="number" id="d-arrPotential" min="0" step="any" value="' +
        escapeHtml(Number(deal.arrPotential) > 0 ? deal.arrPotential : '') + '" placeholder="Same as ARR" /></div></div>' +
      '<label class="check-line"><input type="checkbox" id="d-arrEstimated"' + (StuffMigrate.isArrEstimated(deal) ? ' checked' : '') + ' /> ARR is our estimate</label>' +
      '<label class="check-line"><input type="checkbox" id="d-arrPinned"' + (deal.arrPinned ? ' checked' : '') + ' /> Count in ARR even with no activity for ' + StuffMigrate.ARR_STALE_DAYS + '+ days</label>' +
      '<p class="muted-note" id="d-arr-status">' + escapeHtml(arrStatusText(deal)) + '</p></div>';
  }

  // Reads the ARR controls into the lead; one change log line per changed field.
  function saveArrControls(deal) {
    var potEl = document.getElementById('d-arrPotential');
    if (!potEl) return;
    var pot = Number(potEl.value) > 0 ? Math.round(Number(potEl.value) * 100) / 100 : null;
    var est = !!document.getElementById('d-arrEstimated').checked;
    var pin = !!document.getElementById('d-arrPinned').checked;
    var oldPot = Number(deal.arrPotential) > 0 ? Number(deal.arrPotential) : null;
    if (pot !== oldPot) {
      if (pot == null) delete deal.arrPotential; else deal.arrPotential = pot;
      logChange('update', 'lead', deal.id, 'ARR potential ' + (oldPot == null ? 'blank' : formatMoney(oldPot)) + ' to ' + (pot == null ? 'blank' : formatMoney(pot)));
    }
    if (est !== StuffMigrate.isArrEstimated(deal)) {
      deal.arrEstimated = est;
      if (!est) delete deal.arrIsEstimate;
      logChange('update', 'lead', deal.id, est ? 'ARR marked as our estimate' : 'ARR no longer marked as an estimate');
    }
    if (pin !== !!deal.arrPinned) {
      if (pin) deal.arrPinned = true; else delete deal.arrPinned;
      logChange('update', 'lead', deal.id, pin ? 'Pinned: count in ARR even when idle 45+ days' : 'Unpinned from ARR');
    }
  }

  function arrListHtml(items) {
    if (!items.length) return '<p class="muted-note">Nothing here.</p>';
    return '<div class="table-wrap"><table class="kpi-table arr-list"><thead><tr><th>Record</th><th>Customer</th><th>Stage</th><th class="num">ARR</th><th>Note</th></tr></thead><tbody>' +
      items.map(function (i) {
        var rec = i.kind === 'sku' ? getSku(i.id) : getDeal(i.id);
        if (!rec) return '';
        var title = i.kind === 'sku' ? skuTitle(rec) : cardTitle(rec);
        var note = [i.estimated ? 'estimate *' : '', i.pinned ? 'pinned' : '', i.reason ? 'not counted: ' + i.reason : ''].filter(Boolean).join(', ');
        return '<tr><td><button type="button" class="link-btn" data-arr-open="' + escapeHtml(i.id) + '">' + escapeHtml(title) + '</button></td>' +
          '<td>' + escapeHtml(customerNameFor(rec)) + '</td><td>' + escapeHtml(rec.stage ? stageLabel(rec.stage) : '') + '</td>' +
          '<td class="num">' + formatMoney(i.arr) + (i.estimated ? '*' : '') + '</td><td>' + escapeHtml(note) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function openArrListModal(title, items) {
    var m = openJobModal('<div class="modal-title-row"><h2>' + escapeHtml(title) + '</h2></div>' + arrListHtml(items) +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Close</button></div>', 'lg');
    m.querySelectorAll('[data-arr-open]').forEach(function (b) {
      b.addEventListener('click', function () { closeJobModal(); openDetail(b.getAttribute('data-arr-open')); });
    });
  }

  // KPIs headline: True ARR first, then Pipeline ARR (counted) and ARR potential.
  function arrHeadlineHtml(a) {
    function tile(key, label, b, note) {
      var est = b.estimated > 0 ? '<span class="muted-note">' + formatMoney(b.estimated) + ' of it is our estimate *</span>' : '';
      return '<button type="button" class="arr-tile arr-' + key + '" data-arr-list="' + key + '"><span class="arr-label">' + label + '</span>' +
        '<strong class="arr-value">' + formatMoney(b.total) + (b.estimated > 0 ? '*' : '') + '</strong>' +
        '<span class="arr-count">' + b.count + (key === 'trueArr' ? ' sold job' : ' lead') + (b.count === 1 ? '' : 's') + '</span>' +
        '<span class="muted-note">' + note + '</span>' + est + '</button>';
    }
    return '<div class="arr-headline" id="arr-headline">' +
      tile('trueArr', 'True ARR', a.trueArr, 'Sold jobs only') +
      tile('counted', 'Pipeline ARR (counted)', a.counted, 'Open leads, not cold, lost or idle ' + StuffMigrate.ARR_STALE_DAYS + '+ days') +
      tile('potential', 'ARR potential', a.potential, 'Every open lead') + '</div>';
  }

  function renderPipelineTotal(stages) {
    var board = document.getElementById('board');
    if (!board) return;
    var el = document.getElementById('pipeline-total');
    if (!el) {
      el = document.createElement('p');
      el.id = 'pipeline-total';
      el.className = 'board-note pipeline-total';
      board.parentNode.insertBefore(el, board);
    }
    function quoted(d) { var q = StuffMigrate.latestQuote(state, d); return q ? q.total : 0; }
    var here = stages ? boardCards().filter(function (d) { return stages.indexOf(d.stage) !== -1 && isOpenPipelineLead(d); }) : [];
    if (!here.length) { el.classList.remove('visible'); el.innerHTML = ''; return; }
    var hereSum = here.reduce(function (a, d) { return a + quoted(d); }, 0);
    var paidHere = boardCards().filter(function (d) { return stages.indexOf(d.stage) !== -1 && !isProjectCard(d) && !isConvertedLead(d) && StuffMigrate.isSoldAndPaid(state, d); });
    var all = (state.deals || []).filter(function (d) { return isOpenPipelineLead(d) && quoted(d) > 0; });
    var allSum = all.reduce(function (a, d) { return a + quoted(d); }, 0);
    el.innerHTML =
      '<span class="bv-legend" id="quote-legend" tabindex="0" role="note" aria-label="Legend. Card edge colour shows quote status. An asterisk marks our ARR estimate." title="Legend">i<span class="bv-legend-tip">' +
      '<div><span class="qk qk-sent"></span>Quote sent</div><div><span class="qk qk-unsent"></span>Quoted, not sent</div><div><span class="qk qk-none"></span>No quote yet</div><div>* = our ARR estimate</div></span></span>' +
      '<span class="pipeline-sums">Quoted pipeline: <strong>' + formatMoney(allSum) + '</strong> across ' + all.length + ' open lead' + (all.length === 1 ? '' : 's') +
      ' &nbsp; This board: <strong>' + formatMoney(hereSum) + '</strong></span>' +
      (paidHere.length ? '<button type="button" class="link-btn paid-waiting" id="paid-waiting">' + paidHere.length + ' paid, not in Pre-Production</button>' : '') +
      '<button type="button" class="ghost growth-toggle" id="growth-toggle">' + (growthOpen ? 'Hide chart' : 'Growth chart') + '</button>' +
      (growthOpen ? '<div class="growth-panel" id="growth-panel"></div>' : '');
    el.classList.add('visible');
    el.querySelector('#growth-toggle').addEventListener('click', function () { growthOpen = !growthOpen; renderPipelineTotal(stages); });
    var pwBtn = el.querySelector('#paid-waiting');
    if (pwBtn) pwBtn.addEventListener('click', function () { openPaidWaitingModal(paidHere); });
    if (growthOpen) renderGrowthChart(el.querySelector('#growth-panel'));
  }

  var growthOpen = false;
  var growthGran = 'week';
  var GROWTH_PERIODS = { day: 30, week: 16, month: 12 };

  // Deal potential growth: new Pre-Production, Mold Tooling and Est. ARR by when leads came in,
  // stacked bars per period plus a running total line.
  function renderGrowthChart(root) {
    if (!root) return;
    var leads = (state.deals || []).filter(function (d) { return !isProjectCard(d) && !isLostStage(d.stage) && d.status !== 'lost' && d.status !== 'archived'; })
      .map(function (d) { return Object.assign({}, d, { values: migrateDealValues(d) }); });
    var rows = StuffMigrate.pipelineGrowth(leads, growthGran, GROWTH_PERIODS[growthGran], new Date());
    var W = 720, H = 260, padL = 56, padR = 56, padT = 14, padB = 34;
    var cw = W - padL - padR, ch = H - padT - padB;
    var maxBar = Math.max(1, Math.max.apply(null, rows.map(function (r) { return r.prepro + r.tooling + r.arr; })));
    var maxCum = Math.max(1, rows.length ? rows[rows.length - 1].cumPrepro + rows[rows.length - 1].cumTooling + rows[rows.length - 1].cumArr : 1);
    var bw = cw / rows.length;
    function short(n) { n = Math.round(n); return n >= 1e6 ? '$' + (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? '$' + Math.round(n / 1e3) + 'k' : '$' + n; }
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="growth-svg" role="img" aria-label="Deal potential growth">';
    [0, 0.5, 1].forEach(function (f) {
      var y = padT + ch - f * ch;
      svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y + '" y2="' + y + '" class="g-grid"/>' +
        '<text x="' + (padL - 6) + '" y="' + (y + 4) + '" class="g-axis" text-anchor="end">' + short(maxBar * f) + '</text>' +
        '<text x="' + (W - padR + 6) + '" y="' + (y + 4) + '" class="g-axis g-axis-cum">' + short(maxCum * f) + '</text>';
    });
    var every = Math.ceil(rows.length / 8);
    var pts = [];
    rows.forEach(function (r, i) {
      var x = padL + i * bw + bw * 0.15, w = bw * 0.7, y = padT + ch;
      [['prepro', 'g-prepro'], ['tooling', 'g-tooling'], ['arr', 'g-arr']].forEach(function (k) {
        var h = (r[k[0]] / maxBar) * ch;
        if (h > 0) { y -= h; svg += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" class="' + k[1] + '"><title>' + escapeHtml(r.label) + ': ' + r.count + ' new lead' + (r.count === 1 ? '' : 's') + ', Pre-Production ' + formatMoney(r.prepro) + ', Mold Tooling ' + formatMoney(r.tooling) + ', Est. ARR ' + formatMoney(r.arr) + '</title></rect>'; }
      });
      var cum = r.cumPrepro + r.cumTooling + r.cumArr;
      pts.push((padL + i * bw + bw / 2).toFixed(1) + ',' + (padT + ch - (cum / maxCum) * ch).toFixed(1));
      if (i % every === 0 || i === rows.length - 1) svg += '<text x="' + (padL + i * bw + bw / 2).toFixed(1) + '" y="' + (H - padB + 16) + '" class="g-axis" text-anchor="middle">' + escapeHtml(r.label) + '</text>';
    });
    svg += '<polyline points="' + pts.join(' ') + '" class="g-cum"/></svg>';
    var lastRow = rows[rows.length - 1] || { cumPrepro: 0, cumTooling: 0, cumArr: 0 };
    var added = rows.reduce(function (a, r) { return { p: a.p + r.prepro, t: a.t + r.tooling, a: a.a + r.arr, n: a.n + r.count }; }, { p: 0, t: 0, a: 0, n: 0 });
    root.innerHTML =
      '<div class="growth-head"><strong>Deal potential growth</strong><span class="growth-gran">' +
      [['day', 'Daily'], ['week', 'Weekly'], ['month', 'Monthly']].map(function (g) { return '<button type="button" class="ghost' + (growthGran === g[0] ? ' active' : '') + '" data-gran="' + g[0] + '">' + g[1] + '</button>'; }).join('') +
      '</span></div>' +
      '<div class="growth-legend"><span><i class="g-prepro"></i>Pre-Production</span><span><i class="g-tooling"></i>Mold Tooling</span><span><i class="g-arr"></i>Est. ARR</span><span><i class="g-cum-key"></i>Running total (right axis)</span></div>' +
      svg +
      '<p class="muted-note">Added in this window: ' + added.n + ' leads, Pre-Production ' + formatMoney(added.p) + ', Mold Tooling ' + formatMoney(added.t) + ', Est. ARR ' + formatMoney(added.a) +
      '. Running total now ' + formatMoney(lastRow.cumPrepro + lastRow.cumTooling + lastRow.cumArr) + '. Open and won leads, dated by when each came in; lost leads left out.</p>';
    root.querySelectorAll('[data-gran]').forEach(function (b) { b.addEventListener('click', function () { growthGran = b.getAttribute('data-gran'); renderGrowthChart(root); }); });
  }

  function formatMoney(n) {
    return '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
  }

  function isTerminalStage(stage) {
    return TERMINAL_STAGES.indexOf(stage) !== -1;
  }

  function idleDays(deal) {
    if (!deal.lastActivityAt) return Infinity;
    const then = new Date(deal.lastActivityAt).getTime();
    if (isNaN(then)) return Infinity;
    return Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000));
  }

  function isRotting(deal) {
    if (isTerminalStage(deal.stage) || isColdStage(deal.stage)) return false;
    const days = idleDays(deal);
    return days >= rotThreshold(deal.stage);
  }

  function rotThreshold(stage) {
    return StuffMigrate.stageIdleDays(state, stage, ROT_DAYS);
  }

  function needsNextStepOnMove(deal, stage, date) {
    return !isProjectCard(deal) && StuffMigrate.needsNextStepOnMove(state, deal, stage, date, todayStr(), TERMINAL_STAGES);
  }

  function isOverdue(dateStr) {
    if (!dateStr) return false;
    return dateStr < todayStr();
  }

  function isDueSoon(dateStr) {
    if (!dateStr) return false;
    if (isOverdue(dateStr)) return true;
    const t = new Date(dateStr + 'T12:00:00');
    const now = new Date();
    const diff = (t - now) / (24 * 60 * 60 * 1000);
    return diff <= 3;
  }

  function seedData() {
    return JSON.parse(JSON.stringify(SEED_DATA));
  }

  function normalizeTask(t) {
    if (!t || typeof t !== 'object') return null;
    return {
      id: t.id || uid(),
      title: String(t.title || '').trim() || 'Untitled task',
      dueDate: t.dueDate || null,
      done: !!t.done,
      dealId: t.dealId || null,
      bucket: t.bucket || null,
      createdAt: t.createdAt || nowIso(),
      completedAt: t.completedAt || null,
      quadrant: t.quadrant || null,
      personal: !!t.personal,
      urgent: !!t.urgent,
      delegatedTo: t.delegatedTo || null,
      decideOption: t.decideOption || null,
      suppressed: !!t.suppressed,
      dismissedAt: t.dismissedAt || null,
      fromAutoId: t.fromAutoId || null,
      ruleId: t.ruleId || null,
      assigneeTeam: t.assigneeTeam || null,
      executedBy: t.executedBy || null,
      priority: t.priority || null,
      entityType: t.entityType || null,
      entityId: t.entityId || null,
      inheritedFromLeadId: t.inheritedFromLeadId || null,
      today: !!t.today
    };
  }

  function normalizeState(parsed) {
    const base = seedData();
    const out = {
      version: parsed.version || 10,
      areas: (parsed.areas && parsed.areas.length)
        ? JSON.parse(JSON.stringify(parsed.areas))
        : JSON.parse(JSON.stringify(base.areas || AREAS)),
      sections: (parsed.sections && parsed.sections.length)
        ? JSON.parse(JSON.stringify(parsed.sections))
        : JSON.parse(JSON.stringify(base.sections)),
      stages: (parsed.stages && parsed.stages.length)
        ? parsed.stages.slice()
        : flatStageListFromSections(
            (parsed.sections && parsed.sections.length) ? parsed.sections : base.sections
          ),
      stageLabels: parsed.stageLabels
        ? Object.assign({}, STAGE_LABELS, parsed.stageLabels)
        : Object.assign({}, STAGE_LABELS),
      deals: Array.isArray(parsed.deals) ? parsed.deals.map(function (d) {
        var copy = Object.assign({}, d);
        copy.values = migrateDealValues(d);
        copy.source = normalizeSource(d.source);
        copy.files = cloneFilesMeta(d.files);
        delete copy.arr;
        delete copy.oneShot;
        return copy;
      }) : [],
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks.map(normalizeTask).filter(Boolean)
        : []
    };
    if (Array.isArray(parsed.kpiPages) && parsed.kpiPages.length) {
      out.kpiPages = JSON.parse(JSON.stringify(parsed.kpiPages));
    }
    if (parsed.utilityLabels && typeof parsed.utilityLabels === 'object') {
      out.utilityLabels = Object.assign({}, parsed.utilityLabels);
    }
    out.version = Math.max(Number(out.version) || 0, 11);
    if (Array.isArray(parsed.delegatees) && parsed.delegatees.length) {
      out.delegatees = parsed.delegatees.map(function (x) { return String(x || '').trim(); }).filter(Boolean);
    } else if (Array.isArray(base.delegatees) && base.delegatees.length) {
      out.delegatees = base.delegatees.slice();
    } else {
      out.delegatees = ['Quoting bots', 'Design', 'Prototyping', 'Tooling', 'Floor', 'Owner'];
    }
    out.suppressedAuto = (parsed.suppressedAuto && typeof parsed.suppressedAuto === 'object')
      ? Object.assign({}, parsed.suppressedAuto)
      : {};
    // Saved views (#53): optional shared list, rides along untouched.
    if (Array.isArray(parsed.savedViews)) out.savedViews = JSON.parse(JSON.stringify(parsed.savedViews));
    // Optional per-user keys (#52) and the per-stage idle days (#51) ride along untouched.
    // stageMeta (#56) holds the optional per-stage close probability.
    ['todaySnoozes', 'todayDone', 'stageIdleDays', 'stageMeta', 'stageRules'].forEach(function (k) {
      if (parsed[k] && typeof parsed[k] === 'object' && !Array.isArray(parsed[k])) out[k] = JSON.parse(JSON.stringify(parsed[k]));
    });
    out.completionLog = Array.isArray(parsed.completionLog)
      ? parsed.completionLog.map(function (e) { return e && typeof e === 'object' ? Object.assign({}, e) : null; }).filter(Boolean)
      : [];
    // Migrate legacy boards + apply v11 IA tweaks (Sampling removal, renames)
    ensureDefaultSections(out);
    ensureAreas(out);
    applyStructureIaTweaks(out);
    StuffMigrate.moveSourcingToPreprod(out);
    (out.tasks || []).forEach(function (t) {
      if (!t.bucket) t.bucket = 'tasks-crm-follow-ups';
    });
    (out.deals || []).forEach(function (d) {
      if (!d.stageEnteredAt) {
        d.stageEnteredAt = d.updatedAt || d.createdAt || nowIso();
      }
    });
    // Labels for any custom / unknown stage ids on boards or deals
    Object.keys(STAGE_LABELS).forEach(function (k) {
      if (!out.stageLabels[k]) out.stageLabels[k] = STAGE_LABELS[k];
    });
    (out.sections || []).forEach(function (sec) {
      (sec.stages || []).forEach(function (st) {
        if (!out.stageLabels[st]) out.stageLabels[st] = st;
      });
      if (sec.id === 'partner-leads' && sec.copyOnDrop == null) sec.copyOnDrop = true;
    });
    (out.deals || []).forEach(function (d) {
      if (d.stage && !out.stageLabels[d.stage]) out.stageLabels[d.stage] = d.stage;
    });
    // Flat stages list: all section stages + any deal stages (accepts unknown ids)
    out.stages = deriveAllStages(out);
    if (parsed.importedFrom) out.importedFrom = parsed.importedFrom;
    if (parsed.importedAt) out.importedAt = parsed.importedAt;
    // v12: Customers, Contacts, FileRefs, change log, proposals, settings
    ['customers', 'contacts', 'files', 'changeLog', 'proposals', 'projects', 'skus', 'skuEvents', 'materialLines', 'materials', 'vendors', 'vendorQuotes', 'customerQuotes', 'customerPos', 'billingEntries'].forEach(function (k) {
      out[k] = Array.isArray(parsed[k]) ? JSON.parse(JSON.stringify(parsed[k])) : [];
    });
    out.deals.forEach(function (d) { d.kind = 'lead'; });
    out.projects = out.projects.map(function (p) {
      var copy = Object.assign({}, p);
      copy.kind = 'project';
      copy.values = migrateDealValues(p);
      copy.files = cloneFilesMeta(p.files);
      if (!copy.stageEnteredAt) copy.stageEnteredAt = copy.updatedAt || copy.createdAt || nowIso();
      if (!copy.title) copy.title = copy.name || copy.company || 'Project';
      if (copy.stage && !out.stageLabels[copy.stage]) out.stageLabels[copy.stage] = copy.stage;
      return copy;
    });
    out.settings = (parsed.settings && typeof parsed.settings === 'object') ? Object.assign({}, parsed.settings) : {};
    if (Array.isArray(parsed.pipelineViews)) out.pipelineViews = JSON.parse(JSON.stringify(parsed.pipelineViews));
    if (parsed.enrichmentMeta) out.enrichmentMeta = JSON.parse(JSON.stringify(parsed.enrichmentMeta));
    if (parsed.lastMigrationReport) out.lastMigrationReport = parsed.lastMigrationReport;
    // Any deal without customerId (v11 import, or a fresh add) gets one here. Idempotent.
    var mig = StuffMigrate.migrateToV12(out);
    lastMigrationReport = mig.report;
    out.projects.forEach(function (p) { p.kind = 'project'; if (p.stage && !out.stageLabels[p.stage]) out.stageLabels[p.stage] = p.stage; });
    out.stages = deriveAllStages(out);
    return out;
  }

  function flatStageListFromSections(sections) {
    var list = [];
    var seen = {};
    (sections || []).forEach(function (sec) {
      (sec.stages || []).forEach(function (st) {
        if (!seen[st]) {
          seen[st] = true;
          list.push(st);
        }
      });
    });
    return list;
  }

  function ensureDefaultSections(out) {
    if (!out.sections || !out.sections.length) {
      out.sections = JSON.parse(JSON.stringify(SECTIONS));
      return;
    }
    var LEGACY_SECTION_IDS = {
      'leads': true,
      'deals': true,
      'production-start': true,
      'operations': true,
      'production-ongoing': true,
      'design-prototyping': true,
      'tooling-production-start': true,
      'production-ops': true
    };
    var hasLegacy = false;
    out.sections.forEach(function (s) {
      if (LEGACY_SECTION_IDS[s.id]) hasLegacy = true;
    });
    var byId = {};
    out.sections.forEach(function (s) { byId[s.id] = s; });
    // Old five-section model: replace with current area-based boards.
    // Keep custom stages when already on Owner-shaped / editable boards (v8+).
    if (hasLegacy) {
      out.sections = JSON.parse(JSON.stringify(SECTIONS));
      return;
    }
    // Fill empty stage lists from defaults for known boards; do not overwrite
    // custom labels or drop user-added boards (Edit menu).
    SECTIONS.forEach(function (def) {
      if (!byId[def.id]) return;
      if (!byId[def.id].area) byId[def.id].area = def.area;
      if (!byId[def.id].stages || !byId[def.id].stages.length) {
        byId[def.id].stages = def.stages.slice();
      }
      if (def.copyOnDrop && byId[def.id].copyOnDrop == null) {
        byId[def.id].copyOnDrop = true;
      }
    });
  }

  function ensureAreas(out) {
    if (!out.areas || !out.areas.length) {
      out.areas = JSON.parse(JSON.stringify(AREAS));
    }
    ensureFixedRailItems(out);
    out.areas.forEach(function (a) {
      if (isMenuOnly(a)) return;
      if (!a.role) {
        if (a.id === 'crm') a.role = 'crm';
        else if (a.id === 'pre-production') a.role = 'pre-production';
        else if (a.id === 'floor-operations' || a.id === 'operations') a.role = 'operations';
        else if (a.id === 'kpis') a.role = 'kpis';
        else a.role = 'custom';
      }
    });
  }

  /** One-shot IA: drop Pre-Production Sampling; rename Operations / Raw Materials. */
  function applyStructureIaTweaks(out) {
    if (!out.sections) return;
    var designFirst = 'design-in-progress';
    var protoFirst = 'prototyping-in-progress';
    out.sections.forEach(function (s) {
      if (s.id === 'pp-design' && s.stages && s.stages.length) designFirst = s.stages[0];
      if (s.id === 'pp-prototyping' && s.stages && s.stages.length) protoFirst = s.stages[0];
    });
    var samplingStages = { sampling: true };
    (out.deals || []).forEach(function (d) {
      if (samplingStages[d.stage]) d.stage = designFirst || protoFirst;
    });
    out.sections = out.sections.filter(function (s) { return s.id !== 'pp-sampling'; });
    out.sections.forEach(function (s) {
      if (s.id === 'fo-raw-materials-production') {
        if (s.label === 'Raw Materials Production') s.label = 'Raw Materials';
      }
      if (s.id === 'partner-leads' && s.copyOnDrop == null) s.copyOnDrop = true;
    });
    if (!out.stageLabels) out.stageLabels = {};
    if (out.stageLabels['raw-materials-production'] === 'Raw Materials Production' ||
        !out.stageLabels['raw-materials-production']) {
      out.stageLabels['raw-materials-production'] = 'Raw Materials';
    }
    // Area label Floor Operations -> Operations (keep id floor-operations)
    ensureAreas(out);
    (out.areas || []).forEach(function (a) {
      if (a.id === 'floor-operations' || a.role === 'operations') {
        if (a.label === 'Floor Operations') a.label = 'Operations';
        a.role = 'operations';
      }
    });
    // Freight -> Logistics; Ordering -> Shop Needs (Amazon.com / PPE.com)
    if (!out.stageLabels) out.stageLabels = {};
    (out.sections || []).forEach(function (s) {
      if (s.id === 'pp-freight') {
        if (s.label === 'Freight' || !s.label) s.label = 'Logistics';
      }
      if (s.id === 'fo-ordering') {
        if (s.label === 'Ordering' || !s.label) s.label = 'Shop Needs';
        var st = s.stages || [];
        var hasVendors = st.indexOf('amazon-com') !== -1 || st.indexOf('ppe-com') !== -1;
        if (!hasVendors) {
          var next = [];
          st.forEach(function (id) {
            if (id === 'ordering') {
              if (next.indexOf('amazon-com') === -1) next.push('amazon-com');
              if (next.indexOf('ppe-com') === -1) next.push('ppe-com');
            } else if (next.indexOf(id) === -1) {
              next.push(id);
            }
          });
          if (!next.length) next = ['amazon-com', 'ppe-com'];
          if (next.indexOf('amazon-com') === -1) next.unshift('amazon-com');
          if (next.indexOf('ppe-com') === -1) next.push('ppe-com');
          s.stages = next;
        } else {
          if (st.indexOf('amazon-com') === -1) st.unshift('amazon-com');
          if (st.indexOf('ppe-com') === -1) st.push('ppe-com');
          s.stages = st.filter(function (id) { return id !== 'ordering'; });
          if (!s.stages.length) s.stages = ['amazon-com', 'ppe-com'];
        }
      }
    });
    if (out.stageLabels.freight === 'Freight' || !out.stageLabels.freight) {
      out.stageLabels.freight = 'Logistics';
    }
    out.stageLabels['amazon-com'] = out.stageLabels['amazon-com'] || 'Amazon.com';
    out.stageLabels['ppe-com'] = out.stageLabels['ppe-com'] || 'PPE.com';
    (out.deals || []).forEach(function (d) {
      if (d.stage === 'ordering') d.stage = 'amazon-com';
    });
  }

  function deriveAllStages(src) {
    var list = flatStageListFromSections(src && src.sections);
    var seen = {};
    list.forEach(function (st) { seen[st] = true; });
    (src && src.deals || []).forEach(function (d) {
      if (d.stage && !seen[d.stage]) {
        seen[d.stage] = true;
        list.push(d.stage);
      }
    });
    // Fall back to defaults if somehow empty
    if (!list.length) {
      DEFAULT_STAGES.forEach(function (st) {
        if (!seen[st]) {
          seen[st] = true;
          list.push(st);
        }
      });
    }
    return list;
  }

  function syncStagesFromState() {
    if (!state) return;
    state.stages = deriveAllStages(state);
  }
  // state.sections and state.areas may hold menu separators ({ kind: 'separator' }) so the
  // left rail keeps one ordered list. Everything except the rail uses these filtered lists.
  function isSeparator(x) { return !!x && x.kind === 'separator'; }
  // Fixed destinations live in state.areas as { kind: 'fixed', id } so they can be dragged like categories.
  var FIXED_RAIL_ITEMS = ['today', 'tasks', 'customers', 'skus', 'materials'];
  function isFixedItem(x) { return !!x && x.kind === 'fixed'; }
  function isMenuOnly(x) { return isSeparator(x) || isFixedItem(x); }

  // Put fixed items where they have always been (Tasks first, the other two after CRM) if they are missing. Never moves existing ones.
  function ensureFixedRailItems(target) {
    if (!target || !Array.isArray(target.areas) || !target.areas.length) return;
    var have = {};
    target.areas.forEach(function (a) { if (isFixedItem(a)) have[a.id] = true; });
    if (!have.tasks) target.areas.unshift({ kind: 'fixed', id: 'tasks' });
    // Today (#52) sits right above Tasks, wherever Owner moved Tasks.
    if (!have.today) {
      var ti = target.areas.findIndex(function (a) { return isFixedItem(a) && a.id === 'tasks'; });
      target.areas.splice(ti === -1 ? 0 : ti, 0, { kind: 'fixed', id: 'today' });
    }
    var crmIdx = target.areas.findIndex(function (a) { return !isMenuOnly(a) && (a.role === 'crm' || a.id === 'crm'); });
    var at = crmIdx === -1 ? target.areas.length : crmIdx + 1;
    if (!have.customers) { target.areas.splice(at, 0, { kind: 'fixed', id: 'customers' }); at += 1; }
    if (!have.materials) target.areas.splice(at, 0, { kind: 'fixed', id: 'materials' });
    // SKUs (#3) joins right after Customers, wherever Owner moved Customers.
    if (!have.skus) {
      var ci = target.areas.findIndex(function (a) { return isFixedItem(a) && a.id === 'customers'; });
      target.areas.splice(ci === -1 ? target.areas.length : ci + 1, 0, { kind: 'fixed', id: 'skus' });
    }
  }

  function sectionList() {
    var raw = (state && state.sections && state.sections.length) ? state.sections : SECTIONS.slice();
    return raw.filter(function (x) { return !isSeparator(x); });
  }

  function areaList() {
    var raw = (state && state.areas && state.areas.length) ? state.areas : AREAS.slice();
    return raw.filter(function (x) { return !isMenuOnly(x); });
  }

  function areaLabelFor(areaId) {
    var found = areaList().find(function (a) { return a.id === areaId; });
    if (found) return found.label;
    found = AREAS.find(function (a) { return a.id === areaId; });
    return found ? found.label : (areaId || '');
  }

  function areaRoleFor(areaId) {
    var found = areaList().find(function (a) { return a.id === areaId; });
    if (found && found.role) return found.role;
    if (areaId === 'crm') return 'crm';
    if (areaId === 'pre-production') return 'pre-production';
    if (areaId === 'floor-operations' || areaId === 'operations') return 'operations';
    if (areaId === 'kpis') return 'kpis';
    return areaId || '';
  }

  function boardsByArea(area) {
    return sectionList().filter(function (s) { return s.area === area; });
  }

  function getKpiPage(id) {
    var pages = (typeof kpiPagesList === 'function') ? kpiPagesList() : KPI_PAGES;
    return pages.find(function (p) { return p.id === id; }) || pages[0] || KPI_PAGES[0];
  }


  function getSection(id) {
    return sectionList().find(function (s) { return s.id === id; }) || sectionList()[0];
  }

  function currentSection() {
    return getSection(activeBoardId);
  }

  function sectionStages(sec) {
    return (sec && sec.stages && sec.stages.length) ? sec.stages.slice() : [];
  }

  function defaultStageForSection(sec) {
    var stages = sectionStages(sec);
    return stages[0] || 'cold-leads';
  }

  function sectionForStage(stage) {
    // Prefer first section that owns the stage (cold-leads owns lost)
    var secs = sectionList();
    for (var i = 0; i < secs.length; i++) {
      if ((secs[i].stages || []).indexOf(stage) !== -1) return secs[i];
    }
    return null;
  }

  function isProjectArea(area) {
    var role = areaRoleFor(area);
    return role === 'pre-production' || role === 'operations' || role === 'projects';
  }

  /** Deal on CRM boards; Project on Pre-Production / Operations. Accepts section or deal. */
  // What a board holds or a record is: Deal (CRM), SKU (Pre-Production and Operations,
  // #3), PO (Production board), Item (Shop Needs), Project (archived project records).
  function entityLabel(sectionOrDeal) {
    var x = sectionOrDeal;
    if (!x) return 'Deal';
    if (isProjectCard(x)) return 'Project';
    if (isSkuRecord(x)) return 'SKU';
    var sec = x.area ? x : (x.stage != null ? sectionForStage(x.stage) : null);
    if (!sec || !isProjectArea(sec.area)) return 'Deal';
    var first = (sec.stages || [])[0];
    var kind = first ? StuffMigrate.stageKindOf(state, first) : 'sku';
    if (kind === 'po-line') return 'PO';
    if (kind === 'internal') return 'Item';
    return x.area ? 'SKU' : 'Deal';
  }

  function entityLabelPlural(sectionOrDeal) {
    return ({ Deal: 'Deals', Project: 'Projects', SKU: 'SKUs', PO: 'POs', Item: 'Items' })[entityLabel(sectionOrDeal)] || 'Deals';
  }

  function entityLabelLower(sectionOrDeal) {
    return entityLabel(sectionOrDeal).toLowerCase();
  }

  function stageLabel(slug) {
    if (state && state.stageLabels && state.stageLabels[slug]) return state.stageLabels[slug];
    if (STAGE_LABELS[slug]) return STAGE_LABELS[slug];
    return slug;
  }

  function sourceLabel(sourceId) {
    var found = SOURCE_OPTIONS.find(function (option) { return option.id === sourceId; });
    return found ? found.label : '';
  }

  function normalizeSource(source) {
    var value = typeof source === 'string' ? source : '';
    return SOURCE_OPTIONS.some(function (option) { return option.id === value; }) ? value : '';
  }

  function fillSourceSelect(id, preferredSource) {
    var sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">Select source…</option>';
    SOURCE_OPTIONS.forEach(function (option) {
      var opt = document.createElement('option');
      opt.value = option.id;
      opt.textContent = option.label;
      sel.appendChild(opt);
    });
    sel.value = normalizeSource(preferredSource);
  }

  function fillStageSelect(preferredStage) {
    const sel = document.getElementById('f-stage');
    const sec = currentSection();
    var stages = sectionStages(sec);
    var extra = preferredStage && stages.indexOf(preferredStage) === -1 ? preferredStage : null;
    sel.innerHTML = '';
    if (extra) {
      const opt = document.createElement('option');
      opt.value = extra;
      var owner = sectionForStage(extra);
      opt.textContent = stageLabel(extra) + (owner ? ' (' + owner.label + ')' : ' (other section)');
      sel.appendChild(opt);
    }
    stages.forEach(function (slug) {
      const opt = document.createElement('option');
      opt.value = slug;
      opt.textContent = stageLabel(slug);
      sel.appendChild(opt);
    });
    var pick = preferredStage || defaultStageForSection(sec);
    if (Array.prototype.some.call(sel.options, function (o) { return o.value === pick; })) {
      sel.value = pick;
    } else if (sel.options.length) {
      sel.value = sel.options[0].value;
    }
  }

  function loadActiveNav() {
    try {
      var raw = localStorage.getItem(ACTIVE_NAV_KEY);
      if (!raw && typeof LEGACY_ACTIVE_NAV_KEYS !== 'undefined') {
        for (var li = 0; li < LEGACY_ACTIVE_NAV_KEYS.length; li++) {
          raw = localStorage.getItem(LEGACY_ACTIVE_NAV_KEYS[li]);
          if (raw) break;
        }
      }
      if (raw) {
        var nav = JSON.parse(raw);
        if (nav && typeof nav === 'object') {
          if (nav.activeArea === 'crm' || nav.activeArea === 'pre-production' ||
              nav.activeArea === 'floor-operations' || nav.activeArea === 'kpis' ||
              nav.activeArea === 'operations' || nav.activeArea === 'tasks') {
            activeArea = (nav.activeArea === 'operations') ? 'pre-production' : nav.activeArea;
          }
          if (nav.activeTaskBucket && findTaskBucket(nav.activeTaskBucket)) {
            activeTaskBucket = nav.activeTaskBucket;
          }
          if (nav.activeTasksTab === 'home' || (nav.activeTasksTab && TASK_GROUPS.some(function (g) { return g.id === nav.activeTasksTab; }))) {
            activeTasksTab = nav.activeTasksTab;
          }
          if (nav.activeTasksBucketFilter === 'all' || (nav.activeTasksBucketFilter && findTaskBucket(nav.activeTasksBucketFilter))) {
            activeTasksBucketFilter = nav.activeTasksBucketFilter;
          }
          if (nav.taskGroupOpen && typeof nav.taskGroupOpen === 'object') {
            taskGroupOpen = Object.assign({}, taskGroupOpen, nav.taskGroupOpen);
          }
          if (nav.activeBoardId && sectionList().some(function (s) { return s.id === nav.activeBoardId; })) {
            activeBoardId = nav.activeBoardId;
          }
          if (nav.activeKpiPage && getKpiPage(nav.activeKpiPage)) {
            activeKpiPage = nav.activeKpiPage;
          }
          if (nav.activeView === 'board' || nav.activeView === 'kpi' ||
              nav.activeView === 'tasks' || nav.activeView === 'detail' ||
              nav.activeView === 'customers' || nav.activeView === 'leads' || nav.activeView === 'skus' || nav.activeView === 'admin' || nav.activeView === 'materials' || nav.activeView === 'profile' || nav.activeView === 'billing' || nav.activeView === 'today' || nav.activeView === 'sop' || nav.activeView === 'archived' || nav.activeView === 'cs' || nav.activeView === 'needs-reply' || nav.activeView === 'reply') {
            activeView = nav.activeView;
          }
          if (nav.activeDetailId) {
            activeDetailId = nav.activeDetailId;
          }
          if (nav.activeCustomerId) activeCustomerId = nav.activeCustomerId;
          if (nav.materialsNav && typeof nav.materialsNav === 'object') materialsNav = Object.assign(materialsNav, nav.materialsNav);
          if (nav.billingNav && typeof nav.billingNav === 'object') billingNav = Object.assign(billingNav, nav.billingNav);
        }
      } else {
        // Migrate from older single-key views
        var savedSec = localStorage.getItem(ACTIVE_SECTION_KEY);
        var LEGACY_ACTIVE = {
          'leads': 'cold-leads',
          'deals': 'pp-design',
          'design-prototyping': 'pp-design',
          'production-start': 'pp-tooling',
          'tooling-production-start': 'pp-tooling',
          'operations': 'fo-scheduling',
          'production-ops': 'fo-scheduling',
          'production-ongoing': 'fo-scheduling'
        };
        if (savedSec && LEGACY_ACTIVE[savedSec]) savedSec = LEGACY_ACTIVE[savedSec];
        if (savedSec && getSection(savedSec)) {
          activeBoardId = savedSec;
          var sec = getSection(savedSec);
          activeArea = sec.area || 'crm';
          activeView = 'board';
        }
        var savedView = localStorage.getItem(ACTIVE_VIEW_KEY);
        if (savedView === 'kpis' || savedView === 'kpi') {
          activeArea = 'kpis';
          activeView = 'kpi';
          activeKpiPage = 'overview';
        } else if (savedView === 'tasks') {
          activeArea = 'tasks';
          activeView = 'tasks';
        } else if (savedView === 'board') {
          activeView = 'board';
        }
      }
    } catch (e) { /* keep defaults */ }
    // Validate
    if (!getSection(activeBoardId)) {
      activeBoardId = sectionList()[0].id;
    }
    if (activeView === 'board') {
      var b = getSection(activeBoardId);
      activeArea = b.area || 'crm';
    } else if (activeView === 'kpi') {
      activeArea = 'kpis';
      if (!getKpiPage(activeKpiPage)) activeKpiPage = 'overview';
    } else if (activeView === 'tasks') {
      activeArea = 'tasks';
      if (!findTaskBucket(activeTaskBucket)) {
        activeTaskBucket = TASK_GROUPS[0].buckets[0].id;
      }
    } else if (activeView === 'today') {
      activeArea = 'today';
    } else if (activeView === 'customers') {
      activeArea = 'customers';
      if (activeCustomerId && !getCustomer(activeCustomerId)) activeCustomerId = null;
    } else if (activeView === 'leads') {
      activeArea = crmAreaId();
    } else if (activeView === 'billing') {
      activeArea = opsAreaId();
    } else if (activeView === 'admin') {
      activeArea = 'admin';
    } else if (activeView === 'profile') {
      activeArea = 'profile';
    } else if (activeView === 'sop') {
      activeArea = 'sop';
    } else if (activeView === 'materials') {
      activeArea = 'materials';
    } else if (activeView === 'skus') {
      activeArea = 'skus';
    } else if (activeView === 'detail') {
      if (!activeDetailId || !(getDeal(activeDetailId) || getSku(activeDetailId))) {
        activeDetailId = null;
        activeView = 'board';
        var b0 = getSection(activeBoardId);
        activeArea = b0 ? (b0.area || 'crm') : 'crm';
      } else {
        var dSec = sectionForStage((getDeal(activeDetailId) || getSku(activeDetailId)).stage);
        if (dSec) {
          activeBoardId = dSec.id;
          activeArea = dSec.area || 'crm';
        }
      }
    }
  }

  function persistActiveNav() {
    try {
      localStorage.setItem(ACTIVE_NAV_KEY, JSON.stringify({
        activeArea: activeArea,
        activeBoardId: activeBoardId,
        activeKpiPage: activeKpiPage,
        activeView: activeView,
        activeDetailId: activeView === 'detail' ? activeDetailId : null,
        activeCustomerId: activeView === 'customers' ? activeCustomerId : null,
        materialsNav: materialsNav,
        billingNav: billingNav,
        activeTaskBucket: activeTaskBucket,
        taskGroupOpen: taskGroupOpen,
        activeTasksTab: activeTasksTab,
        activeTasksBucketFilter: activeTasksBucketFilter
      }));
    } catch (e) { /* ignore */ }
  }

  function persistActiveSection() {
    try {
      localStorage.setItem(ACTIVE_SECTION_KEY, activeBoardId);
    } catch (e) { /* ignore */ }
    persistActiveNav();
  }

  function setActiveBoard(id, ppStage) {
    autoCloseNavOnPhone();
    if (!getSection(id)) return;
    preprodStageFilter = ppStage || null;
    activeBoardId = id;
    activeArea = getSection(id).area || 'crm';
    activeView = 'board';
    activeDetailId = null;
    persistActiveNav();
    persistActiveSection();
    renderApp();
  }

  function setActiveKpiPage(id) {
    autoCloseNavOnPhone();
    if (!getKpiPage(id)) return;
    activeKpiPage = id;
    activeArea = 'kpis';
    activeView = 'kpi';
    activeDetailId = null;
    persistActiveNav();
    renderApp();
  }

  function setActiveTasks(bucketId) {
    autoCloseNavOnPhone();
    activeArea = 'tasks';
    activeView = 'tasks';
    activeDetailId = null;
    activeTasksTab = 'home';
    activeTasksBucketFilter = 'all';
    if (bucketId && findTaskBucket(bucketId)) {
      activeTaskBucket = bucketId;
      var g = groupForBucket(bucketId);
      if (g) {
        taskGroupOpen[g.id] = true;
        activeTasksTab = g.id;
      }
    } else if (!findTaskBucket(activeTaskBucket)) {
      activeTaskBucket = firstBucketWithCount() || TASK_GROUPS[0].buckets[0].id;
    }
    areaOpen.tasks = true;
    persistAreaOpen();
    persistActiveNav();
    renderApp();
  }

  function setActiveTaskBucket(bucketId) {
    if (!findTaskBucket(bucketId)) return;
    activeTaskBucket = bucketId;
    activeArea = 'tasks';
    activeView = 'tasks';
    activeDetailId = null;
    var g = groupForBucket(bucketId);
    if (g) taskGroupOpen[g.id] = true;
    areaOpen.tasks = true;
    persistAreaOpen();
    persistActiveNav();
    renderApp();
  }

  function setActiveView(view) {
    if (view === 'kpis') view = 'kpi';
    if (view === 'board') {
      activeView = 'board';
      activeArea = getSection(activeBoardId).area || 'crm';
      activeDetailId = null;
    } else if (view === 'kpi') {
      activeView = 'kpi';
      activeArea = 'kpis';
      activeDetailId = null;
    } else if (view === 'tasks') {
      activeView = 'tasks';
      activeArea = 'tasks';
      activeDetailId = null;
    } else if (view === 'customers') {
      activeView = 'customers';
      activeArea = 'customers';
      activeDetailId = null;
    } else if (view === 'admin') {
      activeView = 'admin';
      activeArea = 'admin';
      activeDetailId = null;
    } else {
      return;
    }
    persistActiveNav();
    renderApp();
  }

  // Where Close on the slide-in editor returns to, and which view draws behind it.
  var detailReturn = null;

  // New lead alert (#48). The Inbound nav item counts leads created since this person last opened
  // Inbound (localStorage matrix.lastSeenInboundAt.<email>); a live update that brings in a new
  // Inbound lead shows a toast. The first load only sets the baseline.
  var inboundSeenIds = null;
  var leadToastTimer = null;

  function inboundStageSet() {
    var sec = getSection('inbound-leads');
    var st = sec && sec.id === 'inbound-leads' ? sectionStages(sec) : [];
    return st.length ? st : ['inbound-jotform'];
  }

  function inboundLeadList() {
    var stages = inboundStageSet();
    return (state.deals || []).filter(function (d) { return d && stages.indexOf(d.stage) !== -1 && !isProjectCard(d); });
  }

  function lastSeenInboundKey() { return 'matrix.lastSeenInboundAt.' + currentUserEmail().toLowerCase(); }

  function readLastSeenInbound() {
    var raw = null;
    try { raw = localStorage.getItem(lastSeenInboundKey()); } catch (e) { /* ignore */ }
    var t = raw ? Date.parse(raw) : NaN;
    if (isNaN(t)) {
      t = Date.now();
      try { localStorage.setItem(lastSeenInboundKey(), new Date(t).toISOString()); } catch (e2) { /* ignore */ }
    }
    return t;
  }

  function markInboundSeen() {
    try { localStorage.setItem(lastSeenInboundKey(), new Date().toISOString()); } catch (e) { /* ignore */ }
  }

  function newInboundCount() {
    if (activeView === 'board' && activeBoardId === 'inbound-leads') { markInboundSeen(); return 0; }
    var seen = readLastSeenInbound();
    return inboundLeadList().filter(function (d) { var t = Date.parse(d.createdAt || ''); return !isNaN(t) && t > seen; }).length;
  }

  function showLeadToast(deal) {
    var el = document.getElementById('lead-toast');
    if (!el) {
      el = document.createElement('button');
      el.type = 'button';
      el.id = 'lead-toast';
      el.className = 'lead-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
      el.addEventListener('click', function () {
        el.classList.remove('show');
        var id = el.getAttribute('data-deal-id');
        if (id && getDeal(id)) { openDetail(id); renderApp(); }
      });
    }
    var who = '';
    var contact = (state.contacts || []).filter(function (c) { return c && (deal.contactIds || []).indexOf(c.id) !== -1; })[0];
    if (contact && contact.name) who = contact.name;
    var co = String(deal.company || deal.title || '');
    el.textContent = 'New lead: ' + (who || co || 'Unnamed') + (who && co && co !== who ? ', ' + co : '');
    el.setAttribute('data-deal-id', deal.id);
    el.classList.add('show');
    clearTimeout(leadToastTimer);
    leadToastTimer = setTimeout(function () { el.classList.remove('show'); }, 8000);
  }

  // Called with each live update from the cloud, before it renders. Never toasts on the first call.
  function detectNewInboundLeads() {
    var all = (state.deals || []).map(function (d) { return d && d.id; }).filter(Boolean);
    var prev = inboundSeenIds;
    inboundSeenIds = {};
    all.forEach(function (id) { inboundSeenIds[id] = true; });
    if (!prev) return;
    var fresh = inboundLeadList().filter(function (d) { return !prev[d.id]; });
    if (fresh.length) showLeadToast(fresh[fresh.length - 1]);
  }

  // Deep link from the lead alert webhook: https://YOUR-PROJECT-ID.web.app/#lead=<id>. Waits until the lead is loaded.
  function openLeadFromHash() {
    var m = /^#lead=([^&]+)/.exec(window.location.hash || '');
    if (!m) return;
    var id = '';
    try { id = decodeURIComponent(m[1]); } catch (e) { return; }
    if (!getDeal(id)) return;
    try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e2) { /* ignore */ }
    openDetail(id);
  }

  function openDetail(dealId) {
    var deal = getDeal(dealId) || getSku(dealId);
    if (!deal) return;
    if (activeView !== 'detail') {
      detailReturn = { view: activeView === 'detail' ? 'board' : activeView, customerId: activeCustomerId, boardId: activeBoardId };
    }
    if (activeDetailId !== dealId) skuEditorTab = 'job';
    activeDetailId = dealId;
    activeSkuId = null;
    skuDraft = null;
    activeView = 'detail';
    var sec = sectionForStage(deal.stage);
    if (sec) {
      activeBoardId = sec.id;
      activeArea = sec.area || 'crm';
    }
    persistActiveNav();
    persistActiveSection();
    renderApp();
  }

  function backFromDetail() {
    activeSkuId = null;
    skuDraft = null;
    activeDetailId = null;
    var ret = detailReturn || { view: 'board' };
    detailReturn = null;
    if (ret.view === 'customers') { activeCustomerId = ret.customerId || null; activeView = 'customers'; activeArea = 'customers'; }
    else if (ret.view === 'leads') { activeView = 'leads'; activeArea = crmAreaId(); }
    else if (ret.view === 'skus') { activeView = 'skus'; activeArea = 'skus'; }
    else if (ret.view === 'tasks') { activeView = 'tasks'; activeArea = 'tasks'; }
    else if (ret.view === 'today') { activeView = 'today'; activeArea = 'today'; }
    else if (ret.view === 'kpi') { activeView = 'kpi'; activeArea = 'kpis'; }
    else if (ret.view === 'admin') { activeView = 'admin'; activeArea = 'admin'; }
    else if (ret.view === 'materials') { activeView = 'materials'; activeArea = 'materials'; }
    else if (ret.view === 'profile') { activeView = 'profile'; activeArea = 'profile'; }
    else {
      activeView = 'board';
      if (ret.boardId && getSection(ret.boardId)) { activeBoardId = ret.boardId; persistActiveSection(); }
      var b = getSection(activeBoardId);
      activeArea = b ? (b.area || 'crm') : 'crm';
    }
    persistActiveNav();
    renderApp();
  }

  function underlyingView() {
    return (detailReturn && detailReturn.view) || 'board';
  }

  function contextTitleText() {
    if (activeView === 'detail') {
      var dsku = getDeal(activeDetailId) ? null : getSku(activeDetailId);
      if (dsku) return 'SKUs / ' + (customerNameFor(dsku) ? customerNameFor(dsku) + ' / ' : '') + (dsku.code || skuTitle(dsku));
      var deal = getDeal(activeDetailId);
      var ent = deal ? entityLabel(deal) : 'Deal';
      var name = deal ? cardTitle(deal) : '';
      var sec = deal ? sectionForStage(deal.stage) : null;
      var area = sec ? areaLabelFor(sec.area) : '';
      return (area ? area + ' / ' : '') + ent + (name ? ': ' + name : '');
    }
    if (activeView === 'tasks') {
      return 'Tasks';
    }
    if (activeView === 'today') {
      return 'Today';
    }
    if (activeView === 'leads') {
      return areaLabelFor(crmAreaId()) + ' / Leads';
    }
    if (activeView === 'skus') {
      return 'SKUs';
    }
    if (activeView === 'archived') return 'Archived';
    if (activeView === 'cs') return 'Customer Success';
    if (activeView === 'reply') return 'We owe a reply';
    if (activeView === 'needs-reply') return 'Sales / Needs Reply';
    if (activeView === 'billing') {
      var bc = billingNav.customerId ? getCustomer(billingNav.customerId) : null;
      return areaLabelFor(opsAreaId()) + ' / Billing accounts' + (bc ? ' / ' + bc.name : '');
    }
    if (activeView === 'customers') {
      var cust = activeCustomerId ? getCustomer(activeCustomerId) : null;
      return cust ? 'Customers / ' + cust.name : 'Customers';
    }
    if (activeView === 'admin') {
      return 'Admin tools';
    }
    if (activeView === 'profile') {
      return profileTab === 'admin' ? 'Access admin' : 'Profile';
    }
    if (activeView === 'sop') {
      return 'SOP';
    }
    if (activeView === 'materials') {
      return materialsTitle();
    }
    if (activeView === 'kpi') {
      var p = getKpiPage(activeKpiPage);
      return 'KPIs / ' + (p ? p.label : 'Overview');
    }
    var sec2 = currentSection();
    return areaLabelFor(sec2.area) + ' / ' + sec2.label;
  }

  function renderContextTitle() {
    var el = document.getElementById('context-title');
    if (!el) return;
    el.innerHTML = '<strong>' + escapeHtml(contextTitleText()) + '</strong>';
  }

  let navOpen = true;

  function loadNavOpen() {
    try {
      var v = localStorage.getItem(NAV_OPEN_KEY);
      if (v === '0' || v === 'false') navOpen = false;
      else if (v === '1' || v === 'true') navOpen = true;
      else if (window.innerWidth < 720) navOpen = false; // phone: start with the rail closed, logo opens it
    } catch (e) { /* keep default */ }
  }

  // Phone: picking a destination in the rail closes it so the content gets the width back.
  function autoCloseNavOnPhone() {
    if (window.innerWidth < 720 && navOpen) { navOpen = false; persistNavOpen(); }
  }

  function persistNavOpen() {
    try {
      localStorage.setItem(NAV_OPEN_KEY, navOpen ? '1' : '0');
    } catch (e) { /* ignore */ }
  }

  function applyNavOpen() {
    var shell = document.getElementById('app-shell');
    var btn = document.getElementById('btn-nav-toggle');
    if (shell) shell.classList.toggle('nav-closed', !navOpen);
    if (btn) btn.setAttribute('aria-expanded', navOpen ? 'true' : 'false');
  }

  function toggleNav() {
    navOpen = !navOpen;
    persistNavOpen();
    applyNavOpen();
    // Phone: the rail is an overlay drawer; move focus into it and back (issue #42).
    if (isPhoneWidth()) {
      if (navOpen) { var c = document.querySelector('#left-rail .rail-close'); if (c) c.focus({ preventScroll: true }); }
      else { var t = document.getElementById('btn-nav-toggle'); if (t) t.focus({ preventScroll: true }); }
    }
  }

  function isPhoneWidth() { return window.innerWidth < 720; }

  let areaOpen = { tasks: true, crm: false, 'pre-production': false, 'floor-operations': false, kpis: false };
  let areaOpenHydrated = false;

  function defaultAreaOpenMap() {
    var map = { tasks: false };
    areaList().forEach(function (a) { map[a.id] = false; });
    var active = activeAreaForNav();
    if (map.hasOwnProperty(active)) map[active] = true;
    else if (map.hasOwnProperty('crm')) map.crm = true;
    else {
      var first = Object.keys(map)[0];
      if (first) map[first] = true;
    }
    return map;
  }

  function syncAreaOpenKeys() {
    var next = {};
    next.tasks = areaOpen.hasOwnProperty('tasks') ? !!areaOpen.tasks : true;
    areaList().forEach(function (a) {
      next[a.id] = areaOpen.hasOwnProperty(a.id) ? !!areaOpen[a.id] : false;
    });
    areaOpen = next;
  }

  function activeAreaForNav() {
    if (activeView === 'tasks') return 'tasks';
    if (activeView === 'kpi') {
      var k = areaList().find(function (a) { return a.role === 'kpis' || a.id === 'kpis'; });
      return k ? k.id : 'kpis';
    }
    var sec = getSection(activeBoardId);
    return (sec && sec.area) ? sec.area : 'crm';
  }

  function loadAreaOpen() {
    try {
      var raw = localStorage.getItem(AREA_OPEN_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          areaOpen = parsed;
          syncAreaOpenKeys();
          areaOpenHydrated = true;
          return;
        }
      }
    } catch (e) { /* fall through */ }
    areaOpen = defaultAreaOpenMap();
    areaOpenHydrated = false;
  }

  function persistAreaOpen() {
    try {
      localStorage.setItem(AREA_OPEN_KEY, JSON.stringify(areaOpen));
      areaOpenHydrated = true;
    } catch (e) { /* ignore */ }
  }

  function ensureActiveAreaExpanded() {
    syncAreaOpenKeys();
    var active = activeAreaForNav();
    if (!areaOpenHydrated) {
      areaOpen = defaultAreaOpenMap();
      return;
    }
    // Keep remembered state, but always expand the area that holds the active item
    if (areaOpen.hasOwnProperty(active)) areaOpen[active] = true;
  }

  var areaDragExpandTimer = null;
  var areaDragExpandTarget = null;

  function clearAreaDragExpand() {
    if (areaDragExpandTimer) {
      clearTimeout(areaDragExpandTimer);
      areaDragExpandTimer = null;
    }
    areaDragExpandTarget = null;
    document.querySelectorAll('.rail-area-title.drag-expand').forEach(function (el) {
      el.classList.remove('drag-expand');
    });
  }

  /** Expand a left-rail area in place (no full re-render) so an active card drag stays alive. */
  function expandAreaForDrag(areaId) {
    if (!areaOpen.hasOwnProperty(areaId)) return;
    if (areaOpen[areaId]) return;
    areaOpen[areaId] = true;
    persistAreaOpen();
    var wrap = document.querySelector('.rail-area[data-area="' + areaId + '"]');
    if (!wrap) return;
    wrap.classList.remove('collapsed');
    var titleBtn = wrap.querySelector('.rail-area-title');
    if (titleBtn) {
      titleBtn.setAttribute('aria-expanded', 'true');
      titleBtn.classList.remove('drag-expand');
    }
  }

  function scheduleAreaExpandOnDrag(areaId, titleBtn) {
    if (!areaOpen.hasOwnProperty(areaId)) return;
    if (areaOpen[areaId]) return;
    if (areaDragExpandTarget === areaId) return;
    clearAreaDragExpand();
    areaDragExpandTarget = areaId;
    if (titleBtn) titleBtn.classList.add('drag-expand');
    areaDragExpandTimer = setTimeout(function () {
      areaDragExpandTimer = null;
      expandAreaForDrag(areaId);
      areaDragExpandTarget = null;
    }, 220);
  }

  function toggleAreaOpen(areaId) {
    if (!areaOpen.hasOwnProperty(areaId)) return;
    areaOpen[areaId] = !areaOpen[areaId];
    persistAreaOpen();
    renderLeftRail();
  }


  function findTaskBucket(bucketId) {
    if (!bucketId) return null;
    for (var i = 0; i < TASK_GROUPS.length; i++) {
      for (var j = 0; j < TASK_GROUPS[i].buckets.length; j++) {
        if (TASK_GROUPS[i].buckets[j].id === bucketId) return TASK_GROUPS[i].buckets[j];
      }
    }
    return null;
  }

  function groupForBucket(bucketId) {
    for (var i = 0; i < TASK_GROUPS.length; i++) {
      for (var j = 0; j < TASK_GROUPS[i].buckets.length; j++) {
        if (TASK_GROUPS[i].buckets[j].id === bucketId) return TASK_GROUPS[i];
      }
    }
    return null;
  }

  function stagesForBoardId(boardId) {
    var sec = sectionList().find(function (s) { return s.id === boardId; });
    return sec ? sectionStages(sec) : [];
  }

  function dealsOnStages(stageIds) {
    var set = {};
    (stageIds || []).forEach(function (st) { set[st] = true; });
    return activeCards().filter(function (d) {
      return set[d.stage] && !isLostStage(d.stage);
    });
  }

  function autoTasksForBucketUnfiltered(bucketId) {
    var bucket = findTaskBucket(bucketId);
    if (!bucket || !bucket.auto) return [];
    var auto = bucket.auto;
    if (auto === 'quotes-needed') {
      return dealsOnStages(QUOTE_NEEDED_STAGES).map(function (d) {
        ensureStageEnteredAt(d);
        var due = quoteDueDateForDeal(d);
        return {
          virtual: true,
          id: 'aq_' + d.id,
          title: 'Get quote within 3 days: ' + cardTitle(d),
          dueDate: due,
          done: false,
          dealId: d.id,
          bucket: bucketId,
          autoKind: 'quotes-needed',
          assigneeTeam: 'quoting-bots',
          executedBy: 'quoting-bots'
        };
      });
    }
    if (auto === 'follow-ups') {
      return followUpVirtualTasks().map(function (t) {
        t.bucket = bucketId;
        return t;
      });
    }
    if (auto === 'stale') {
      // #137: deals the nightly sweep flagged stale (no touch for N days). Derived; clears itself on the next touch.
      return activeCards().filter(function (d) { return d.stale === true && !isProjectCard(d) && !isLostStage(d.stage); }).map(function (d) {
        return {
          virtual: true,
          id: 'st_' + d.id,
          title: 'No touch since ' + String(d.staleSince || '').slice(0, 10) + ': ' + cardTitle(d),
          dueDate: todayStr(),
          done: false,
          dealId: d.id,
          bucket: bucketId,
          autoKind: 'stale'
        };
      });
    }
    if (auto === 'send-invoice') {
      return dealsOnStages(['invoicing']).map(function (d) {
        return {
          virtual: true,
          id: 'inv_' + d.id,
          title: 'Send invoice: ' + cardTitle(d),
          dueDate: d.nextFollowUp || null,
          done: false,
          dealId: d.id,
          bucket: bucketId,
          autoKind: 'send-invoice'
        };
      });
    }
    if (auto === 'order-material') {
      // Issue #22: POs still in Received with no material ordered after one business day. Derived, never stored.
      return StuffMigrate.posNeedingMaterial(state, todayStr()).map(function (po) {
        return {
          virtual: true,
          id: 'om_' + po.id,
          title: 'Order material: ' + customerNameFor(po) + ' PO ' + (po.poNumber || '(no number)'),
          dueDate: StuffMigrate.addBusinessDays(po.createdAt || po.poDate, 1),
          done: false,
          poId: po.id,
          bucket: bucketId,
          autoKind: 'order-material'
        };
      });
    }
    if (auto.indexOf('board:') === 0) {
      var boardId = auto.slice(6);
      var stages = stagesForBoardId(boardId);
      var prefix = boardId === 'pp-design' ? 'Design' :
        boardId === 'pp-prototyping' ? 'Prototype' :
        boardId === 'pp-tooling' ? 'Tooling' :
        boardId === 'fo-scheduling' ? 'Schedule' : 'Work';
      return dealsOnStages(stages).map(function (d) {
        return {
          virtual: true,
          id: 'ab_' + boardId + '_' + d.id,
          title: prefix + ': ' + cardTitle(d),
          dueDate: d.nextFollowUp || null,
          done: false,
          dealId: d.id,
          bucket: bucketId,
          autoKind: boardId
        };
      });
    }
    return [];
  }

  function autoTasksForBucket(bucketId) {
    return autoTasksForBucketUnfiltered(bucketId).filter(function (t) {
      return !isAutoSuppressed(t);
    });
  }


  function manualTasksForBucket(bucketId, openOnly) {
    return (state.tasks || []).filter(function (t) {
      if (t.bucket !== bucketId) return false;
      if (openOnly && t.done) return false;
      return true;
    });
  }

  function bucketOpenCount(bucketId) {
    return autoTasksForBucket(bucketId).length + manualTasksForBucket(bucketId, true).length;
  }

  function groupOpenCount(groupId) {
    var g = TASK_GROUPS.find(function (x) { return x.id === groupId; });
    if (!g) return 0;
    var n = 0;
    g.buckets.forEach(function (b) { n += bucketOpenCount(b.id); });
    return n;
  }

  function totalOpenTaskCount() {
    var n = 0;
    TASK_GROUPS.forEach(function (g) { n += groupOpenCount(g.id); });
    return n;
  }

  function firstBucketWithCount() {
    for (var i = 0; i < TASK_GROUPS.length; i++) {
      for (var j = 0; j < TASK_GROUPS[i].buckets.length; j++) {
        var id = TASK_GROUPS[i].buckets[j].id;
        if (bucketOpenCount(id) > 0) return id;
      }
    }
    return TASK_GROUPS[0].buckets[0].id;
  }

  function countBadgeHtml(n) {
    return '<span class="rail-count' + (n ? '' : ' zero') + '">' + n + '</span>';
  }

  function updateHeaderTasksBadge() {
    var badge = document.getElementById('header-tasks-badge');
    if (!badge) return;
    var n = totalOpenTaskCount();
    badge.textContent = String(n);
    badge.classList.toggle('hidden', n === 0);
  }

  function toggleTaskGroupOpen(groupId) {
    taskGroupOpen[groupId] = !taskGroupOpen[groupId];
    persistActiveNav();
    renderLeftRail();
  }

  function renderLeftRail() {
    var rail = document.getElementById('left-rail');
    if (!rail) return;
    ensureActiveAreaExpanded();
    rail.innerHTML = '';
    rail.classList.toggle('editing-menu', !!menuEditMode);
    var menuBtn = document.getElementById('btn-edit-menu');
    if (menuBtn) {
      menuBtn.classList.toggle('active', !!menuEditMode);
      menuBtn.textContent = menuEditMode ? 'Done editing' : 'Edit menu';
    }
    if (menuEditMode) { renderRailEditor(rail); return; }
    // Phone drawer close button (hidden on wider screens by CSS).
    var railClose = document.createElement('button');
    railClose.type = 'button';
    railClose.className = 'rail-close';
    railClose.setAttribute('aria-label', 'Close menu');
    railClose.innerHTML = '<span aria-hidden="true">&times;</span> Close';
    railClose.addEventListener('click', function () { if (navOpen) toggleNav(); });
    rail.appendChild(railClose);

    var chevronSvg =
      '<svg class="rail-chevron" viewBox="0 0 12 12" aria-hidden="true">' +
      '<path fill="currentColor" d="M2.2 4.2L6 8l3.8-3.8L11 5.4 6 10.4 1 5.4z"/></svg>';

    function makeEditControls(opts) {
      var wrap = document.createElement('div');
      wrap.className = 'rail-edit-controls';
      function mk(label, title, disabled, onClick, danger) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.title = title;
        if (danger) b.className = 'danger-x';
        if (disabled) b.disabled = true;
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          e.preventDefault();
          onClick();
        });
        wrap.appendChild(b);
      }
      if (opts.onUp) mk('Up', 'Move up', !!opts.upDisabled, opts.onUp);
      if (opts.onDown) mk('Down', 'Move down', !!opts.downDisabled, opts.onDown);
      if (opts.onRemove) mk('x', 'Remove', !!opts.removeDisabled, opts.onRemove, true);
      return wrap;
    }

    function beginInlineRename(spanEl, current, onCommit) {
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'rail-name-input';
      input.value = current;
      var parent = spanEl.parentNode;
      parent.replaceChild(input, spanEl);
      input.focus();
      input.select();
      var done = false;
      function finish(commit) {
        if (done) return;
        done = true;
        if (commit) onCommit(input.value);
        renderApp();
      }
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); finish(true); }
        else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      });
      input.addEventListener('blur', function () { finish(true); });
      input.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    function addArea(areaId, areaLabel, items, areaIndex, areasLen) {
      var isOpen = !!areaOpen[areaId];
      var wrap = document.createElement('div');
      wrap.className = 'rail-area' + (isOpen ? '' : ' collapsed');
      wrap.setAttribute('data-area', areaId);

      var titleBtn = document.createElement('button');
      titleBtn.type = 'button';
      titleBtn.className = 'rail-area-title';
      titleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      titleBtn.setAttribute('aria-controls', 'rail-body-' + areaId);
      var labelSpan = document.createElement('span');
      labelSpan.className = 'rail-area-label' + (menuEditMode ? ' editable-menu' : '');
      labelSpan.textContent = areaLabel;
      titleBtn.innerHTML = chevronSvg;
      titleBtn.appendChild(labelSpan);
      if (menuEditMode) {
        titleBtn.appendChild(makeEditControls({
          onUp: function () { if (reorderArea(areaId, -1)) renderApp(); },
          onDown: function () { if (reorderArea(areaId, 1)) renderApp(); },
          upDisabled: areaIndex === 0,
          downDisabled: areaIndex === areasLen - 1,
          onRemove: function () { if (removeArea(areaId)) renderApp(); },
          removeDisabled: areaRoleFor(areaId) === 'crm' || areaRoleFor(areaId) === 'kpis'
        }));
        labelSpan.addEventListener('click', function (e) {
          e.stopPropagation();
          beginInlineRename(labelSpan, areaLabel, function (v) {
            renameArea(areaId, v);
          });
        });
      }
      titleBtn.addEventListener('click', function (e) {
        if (menuEditMode && e.target && e.target.closest && e.target.closest('.rail-edit-controls')) return;
        if (menuEditMode && e.target && e.target.classList && e.target.classList.contains('editable-menu')) return;
        toggleAreaOpen(areaId);
      });
      // While dragging a card, expand collapsed area headers so board drop targets appear.
      titleBtn.addEventListener('dragenter', function (e) {
        if (!dragDealId || menuEditMode) return;
        e.preventDefault();
        scheduleAreaExpandOnDrag(areaId, titleBtn);
      });
      titleBtn.addEventListener('dragover', function (e) {
        if (!dragDealId || menuEditMode) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        scheduleAreaExpandOnDrag(areaId, titleBtn);
      });
      titleBtn.addEventListener('dragleave', function (e) {
        if (titleBtn.contains(e.relatedTarget)) return;
        if (areaDragExpandTarget === areaId) {
          clearAreaDragExpand();
        } else {
          titleBtn.classList.remove('drag-expand');
        }
      });
      wrap.appendChild(titleBtn);

      var body = document.createElement('div');
      body.className = 'rail-area-body';
      body.id = 'rail-body-' + areaId;
      var boardItems = items.filter(function (it) { return !!it.boardId; });
      items.forEach(function (item, itemIndex) {
        if (item.separator) {
          var sepEl = document.createElement('div');
          sepEl.className = 'rail-sep';
          sepEl.setAttribute('role', 'separator');
          body.appendChild(sepEl);
          return;
        }
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rail-item' + (item.active ? ' active' : '') + (item.utility ? ' utility' : '') + (item.sub ? ' rail-sub' : '') +
          (menuEditMode ? ' editing-menu-row' : '');
        btn.setAttribute('data-rail', item.key);
        var labelEl = document.createElement('span');
        labelEl.className = 'rail-item-label' + (menuEditMode ? ' editable-menu' : '');
        labelEl.textContent = item.label;
        btn.appendChild(labelEl);
        if (typeof item.count === 'number') {
          var countEl = document.createElement('span');
          countEl.className = 'rail-count' + (item.count ? '' : ' zero');
          countEl.textContent = String(item.count);
          btn.appendChild(countEl);
        }
        if (item.droppable && !menuEditMode) {
          var hint = document.createElement('span');
          hint.className = 'rail-drop-hint';
          hint.textContent = item.dropHint || 'Drop';
          btn.appendChild(hint);
        }
        if (menuEditMode) {
          if (item.boardId) {
            var bIdx = boardItems.indexOf(item);
            btn.appendChild(makeEditControls({
              onUp: function () { if (reorderBoard(item.boardId, -1)) renderApp(); },
              onDown: function () { if (reorderBoard(item.boardId, 1)) renderApp(); },
              upDisabled: bIdx <= 0,
              downDisabled: bIdx < 0 || bIdx >= boardItems.length - 1,
              onRemove: function () { if (removeBoard(item.boardId)) renderApp(); },
              removeDisabled: boardItems.length <= 1
            }));
            labelEl.addEventListener('click', function (e) {
              e.stopPropagation();
              beginInlineRename(labelEl, item.label, function (v) {
                renameBoard(item.boardId, v);
              });
            });
          } else if (item.utility && item.renameKey) {
            labelEl.addEventListener('click', function (e) {
              e.stopPropagation();
              beginInlineRename(labelEl, item.label, function (v) {
                renameUtilityLabel(item.renameKey, v);
              });
            });
          }
        }
        btn.addEventListener('click', function (e) {
          if (suppressCardClick) return;
          if (menuEditMode && e.target && e.target.closest && e.target.closest('.rail-edit-controls')) return;
          if (menuEditMode && e.target && e.target.classList && e.target.classList.contains('editable-menu')) return;
          if (menuEditMode) return;
          item.onClick();
        });
        if (item.droppable && !menuEditMode) {
          btn.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            btn.classList.add('drag-over');
          });
          btn.addEventListener('dragleave', function (e) {
            if (!btn.contains(e.relatedTarget)) btn.classList.remove('drag-over');
          });
          btn.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            clearDragOver();
            clearAreaDragExpand();
            var id = e.dataTransfer.getData('text/plain') || dragDealId;
            if (!id) return;
            if (moveDealToSection(id, item.boardId)) {
              suppressCardClick = true;
              setTimeout(function () { suppressCardClick = false; }, 80);
              setActiveBoard(item.boardId);
            }
          });
        }
        body.appendChild(btn);
      });
      if (menuEditMode && areaRoleFor(areaId) !== 'kpis') {
        var addWrap = document.createElement('div');
        addWrap.className = 'rail-menu-add';
        var addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.textContent = '+ Add board';
        addBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var name = prompt('New board name:');
          if (name == null || !String(name).trim()) return;
          if (addBoard(areaId, name)) renderApp();
        });
        addWrap.appendChild(addBtn);
        body.appendChild(addWrap);
      }
      wrap.appendChild(body);
      rail.appendChild(wrap);
    }

    function boardItemsFor(areaId) {
      var raw = (state.sections || []).filter(function (x) { return x.area === areaId && !x.railArea; });
      var out = [];
      raw.forEach(function (sec) {
        if (isSeparator(sec)) { out.push({ separator: true, key: 'sep:' + sec.id }); return; }
        var views = isCrmBoard(sec) ? StuffMigrate.savedViewsForBoard(state, sec.id) : [];
        var onBoard = activeView === 'board' && activeBoardId === sec.id;
        var viewOn = null;
        if (onBoard) viewOn = views.filter(function (v) { return sameViewFilter(boardFilter(sec.id), v.filter); })[0] || null;
        out.push({
          key: 'board:' + sec.id,
          label: sec.label,
          boardId: sec.id,
          droppable: true,
          dropHint: isPartnerSection(sec) ? 'Copy here' : 'Drop',
          active: onBoard && !viewOn,
          onClick: function () { boardFilters[sec.id] = {}; setActiveBoard(sec.id); }
        });
        if (sec.id === 'inbound-leads') out[out.length - 1].count = newInboundCount();
        // Saved views are pinned under their board with a count (#53).
        if (views.length) {
          var rows = boardLeadRows(sec);
          views.forEach(function (v) {
            out.push({
              key: 'view:' + v.id,
              label: v.name,
              sub: true,
              view: true,
              count: StuffMigrate.filterViewRows(rows, v.filter, todayStr()).length,
              droppable: false,
              active: !!viewOn && viewOn.id === v.id,
              onClick: function () { openBoardView(sec.id, v.filter); }
            });
          });
        }
      });
      return out;
    }

    // Today (#52): one list of what needs the signed-in person, with a count badge.
    function renderTodayItem() {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rail-item task-rail-item' + (activeView === 'today' || (activeView === 'detail' && underlyingView() === 'today') ? ' active' : '');
      btn.setAttribute('data-rail', 'today');
      btn.title = menuEditMode ? 'Today is a fixed area and cannot be removed' : 'What needs you today';
      var label = document.createElement('span');
      label.className = 'rail-item-label';
      label.textContent = 'Today';
      btn.appendChild(label);
      var badge = document.createElement('span');
      var total = todaySplit().today.length;
      badge.className = 'rail-count' + (total ? '' : ' zero');
      badge.textContent = String(total);
      btn.appendChild(badge);
      if (menuEditMode) {
        var lock = document.createElement('span');
        lock.className = 'rail-locked';
        lock.textContent = 'fixed';
        btn.appendChild(lock);
      }
      btn.addEventListener('click', function () { if (!menuEditMode) setActiveToday(); });
      rail.appendChild(btn);
    }

    // Tasks is a single destination. Its grouped buckets live on the Tasks page.
    function renderTasksItem() {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rail-item task-rail-item' + (activeView === 'tasks' ? ' active' : '');
      btn.setAttribute('data-rail', 'tasks');
      var label = document.createElement('span');
      label.className = 'rail-item-label';
      label.textContent = 'Tasks';
      btn.appendChild(label);
      var badge = document.createElement('span');
      var total = totalOpenTaskCount();
      badge.className = 'rail-count' + (total ? '' : ' zero');
      badge.textContent = String(total);
      btn.appendChild(badge);
      btn.addEventListener('click', function () { setActiveTasks(); });
      rail.appendChild(btn);
    }

    function renderCustomersItem() {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rail-item customers-rail-item' + (activeView === 'customers' ? ' active' : '');
      btn.setAttribute('data-rail', 'customers');
      btn.title = menuEditMode ? 'Customers is a fixed area and cannot be removed' : 'Customers, their contacts and SKUs';
      var label = document.createElement('span');
      label.className = 'rail-item-label';
      label.textContent = 'Customers';
      btn.appendChild(label);
      var badge = document.createElement('span');
      var total = (state.customers || []).filter(hasJobs).length;
      badge.className = 'rail-count' + (total ? '' : ' zero');
      badge.textContent = String(total);
      btn.appendChild(badge);
      if (menuEditMode) {
        var lock = document.createElement('span');
        lock.className = 'rail-locked';
        lock.textContent = 'fixed';
        btn.appendChild(lock);
      }
      btn.addEventListener('click', function () { if (!menuEditMode) setActiveCustomers(null); });
      rail.appendChild(btn);
    }

    function renderPreprodRailItem(area) {
      var btn = document.createElement('button');
      btn.type = 'button';
      var cur = currentSection();
      var on = activeView === 'board' && cur && preprodBoards().some(function (s) { return s.id === cur.id; });
      btn.className = 'rail-item preprod-rail-item' + (on ? ' active' : '');
      btn.setAttribute('data-rail', 'pre-production');
      var label = document.createElement('span');
      label.className = 'rail-item-label';
      label.textContent = area.label || 'Pre-Production';
      btn.appendChild(label);
      var badge = document.createElement('span');
      var total = preprodCardCount();
      badge.className = 'rail-count' + (total ? '' : ' zero');
      badge.textContent = String(total);
      btn.appendChild(badge);
      btn.addEventListener('click', function () { setActivePreprod(); });
      rail.appendChild(btn);
    }

    function renderNeedsReplyItem() {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rail-item needs-reply-rail-item' + (activeView === 'needs-reply' ? ' active' : '');
      btn.setAttribute('data-rail', 'needs-reply');
      var label = document.createElement('span');
      label.className = 'rail-item-label';
      label.textContent = 'Needs Reply';
      btn.appendChild(label);
      var badge = document.createElement('span');
      var n = StuffMigrate.needsReplyList(state).length;
      badge.className = 'rail-count' + (n ? ' alert' : ' zero');
      badge.textContent = String(n);
      btn.appendChild(badge);
      btn.addEventListener('click', function () { setActiveNeedsReply(); });
      rail.appendChild(btn);
    }

    function renderCsItem() {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rail-item cs-rail-item' + (activeView === 'cs' ? ' active' : '');
      btn.setAttribute('data-rail', 'cs');
      var label = document.createElement('span');
      label.className = 'rail-item-label';
      label.textContent = 'Customer Success';
      btn.appendChild(label);
      var badge = document.createElement('span');
      var v = StuffMigrate.csViews(state, csToday());
      badge.className = 'rail-count' + (v.slippedToday.length ? ' alert' : ' zero');
      badge.textContent = String(v.count);
      btn.appendChild(badge);
      btn.addEventListener('click', function () { setActiveCs(); });
      rail.appendChild(btn);
    }

    function renderReplyItem() {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rail-item reply-rail-item' + (activeView === 'reply' ? ' active' : '');
      btn.setAttribute('data-rail', 'reply');
      var label = document.createElement('span');
      label.className = 'rail-item-label';
      label.textContent = 'We owe a reply';
      btn.appendChild(label);
      var badge = document.createElement('span');
      var rows = StuffMigrate.weOweReplyRows(state, Date.now());
      var late = rows.some(function (r) { return r.chip && r.chip.red; });
      badge.className = 'rail-count' + (late ? ' alert' : rows.length ? '' : ' zero');
      badge.textContent = String(rows.length);
      btn.appendChild(badge);
      btn.addEventListener('click', function () { setActiveReply(); });
      rail.appendChild(btn);
    }

    function renderArchivedItem() {
      var sep = document.createElement('div');
      sep.className = 'rail-sep rail-sep-top';
      sep.setAttribute('role', 'separator');
      rail.appendChild(sep);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rail-item archived-rail-item' + (activeView === 'archived' ? ' active' : '');
      btn.setAttribute('data-rail', 'archived');
      var label = document.createElement('span');
      label.className = 'rail-item-label';
      label.textContent = 'Archived';
      btn.appendChild(label);
      var badge = document.createElement('span');
      var total = StuffMigrate.archivedItems(state).length;
      badge.className = 'rail-count' + (total ? '' : ' zero');
      badge.textContent = String(total);
      btn.appendChild(badge);
      btn.addEventListener('click', function () { setActiveArchived(); });
      rail.appendChild(btn);
    }

    var areas = areaList();
    ensureFixedRailItems(state);
    var rawAreas = (state.areas && state.areas.length) ? state.areas : areas;
    rawAreas.forEach(function (area) {
      if (isFixedItem(area)) {
        if (area.id === 'today') renderTodayItem();
        else if (area.id === 'tasks') renderTasksItem();
        else if (area.id === 'customers') renderCustomersItem();
        else if (area.id === 'skus') renderSkusRailItem(rail);
        else if (area.id === 'materials') renderMaterialsRailItem(rail);
        return;
      }
      if (isSeparator(area)) {
        var topSep = document.createElement('div');
        topSep.className = 'rail-sep rail-sep-top';
        topSep.setAttribute('role', 'separator');
        rail.appendChild(topSep);
        return;
      }
      var areaIndex = areas.indexOf(area);
      var role = area.role || areaRoleFor(area.id);
      var items;
      // Pre-Production is one menu item; its boards are view tabs on the page (Owner 2026-10-12).
      if (role === 'pre-production') { renderPreprodRailItem(area); return; }
      if (role === 'kpis' || area.id === 'kpis') {
        items = kpiPagesList().map(function (p) {
          return {
            key: 'kpi:' + p.id,
            label: p.label,
            utility: true,
            renameKey: 'kpi:' + p.id,
            droppable: false,
            active: activeView === 'kpi' && activeKpiPage === p.id,
            onClick: function () { setActiveKpiPage(p.id); }
          };
        });
      } else {
        items = boardItemsFor(area.id);
        // Leads is a view, not a board: first in the CRM group, no board record.
        if (role === 'crm') {
          items = [{
            key: 'leads',
            label: 'Leads',
            view: true,
            count: activeLeadCount(),
            droppable: false,
            active: activeView === 'leads' || (activeView === 'detail' && underlyingView() === 'leads'),
            onClick: function () { setActiveLeads(); }
          }].concat(items);
        }
        // Billing accounts is a view, not a board: last in the Operations group.
        if (role === 'operations') {
          items = items.concat([{
            key: 'billing',
            label: 'Billing accounts',
            view: true,
            count: billingUnbilledCount(),
            droppable: false,
            active: activeView === 'billing',
            onClick: function () { setActiveBilling(null); }
          }]);
        }
      }
      addArea(area.id, area.label, items, areaIndex, areas.length);
    });

    if (!menuEditMode) { renderNeedsReplyItem(); renderReplyItem(); renderCsItem(); renderArchivedItem(); }

    if (menuEditMode) {
      var addAreaWrap = document.createElement('div');
      addAreaWrap.className = 'rail-add-area-wrap';
      var addAreaBtn = document.createElement('button');
      addAreaBtn.type = 'button';
      addAreaBtn.textContent = '+ Add area';
      addAreaBtn.addEventListener('click', function () {
        var name = prompt('New area name:');
        if (name == null || !String(name).trim()) return;
        var rolePick = prompt(
          'Area type? Enter: crm (Deals), pre-production (Projects), operations (Projects), or custom',
          'custom'
        );
        if (rolePick == null) return;
        if (addAreaEntry(name, rolePick)) renderApp();
      });
      addAreaWrap.appendChild(addAreaBtn);
      rail.appendChild(addAreaWrap);
    }
  }

  function kpiPagesList() {
    if (state && state.kpiPages && state.kpiPages.length) return state.kpiPages;
    return KPI_PAGES.slice();
  }

  function utilityLabel(key, fallback) {
    if (state && state.utilityLabels && state.utilityLabels[key]) return state.utilityLabels[key];
    return fallback;
  }

  function renameUtilityLabel(key, newLabel) {
    var label = String(newLabel || '').trim();
    if (!label) return false;
    if (!state.utilityLabels) state.utilityLabels = {};
    if (key.indexOf('kpi:') === 0) {
      var kid = key.slice(4);
      if (!state.kpiPages) state.kpiPages = JSON.parse(JSON.stringify(KPI_PAGES));
      state.kpiPages.forEach(function (p) {
        if (p.id === kid) p.label = label;
      });
    } else {
      state.utilityLabels[key] = label;
    }
    save();
    return true;
  }

  function slugifyId(label, prefix) {
    var base = String(label || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!base) base = prefix || 'item';
    var slug = (prefix ? prefix + '-' : '') + base;
    var n = 0;
    function exists(id) {
      if (areaList().some(function (a) { return a.id === id; })) return true;
      if (sectionList().some(function (s) { return s.id === id; })) return true;
      return false;
    }
    while (exists(slug)) {
      n += 1;
      slug = (prefix ? prefix + '-' : '') + base + '-' + n;
      if (n > 40) {
        slug = (prefix ? prefix + '-' : '') + base + '-' + Date.now().toString(36).slice(-4);
        break;
      }
    }
    return slug;
  }

  function renameArea(areaId, newLabel) {
    var label = String(newLabel || '').trim();
    if (!label || !state.areas) return false;
    var a = state.areas.find(function (x) { return x.id === areaId; });
    if (!a) return false;
    a.label = label;
    save();
    return true;
  }

  function reorderArea(areaId, dir) {
    if (!state.areas) return false;
    var idx = -1;
    for (var i = 0; i < state.areas.length; i++) {
      if (state.areas[i].id === areaId) { idx = i; break; }
    }
    if (idx < 0) return false;
    var to = idx + (dir < 0 ? -1 : 1);
    if (to < 0 || to >= state.areas.length) return false;
    var tmp = state.areas[idx];
    state.areas[idx] = state.areas[to];
    state.areas[to] = tmp;
    save();
    return true;
  }

  function addAreaEntry(label, roleRaw) {
    var name = String(label || '').trim();
    if (!name) return false;
    if (!state.areas) state.areas = JSON.parse(JSON.stringify(AREAS));
    var role = String(roleRaw || 'custom').trim().toLowerCase();
    if (role === 'crm' || role === 'deal' || role === 'deals') role = 'crm';
    else if (role === 'pre-production' || role === 'preproduction') role = 'pre-production';
    else if (role === 'operations' || role === 'ops' || role === 'floor-operations') role = 'operations';
    else if (role === 'kpis' || role === 'kpi') role = 'kpis';
    else role = 'custom';
    var id = slugifyId(name, role === 'operations' ? 'ops' : (role === 'custom' ? 'area' : role));
    if (role === 'crm') id = 'crm-' + slugifyId(name, '').replace(/^-+/, '');
    state.areas.push({ id: id, label: name, role: role });
    areaOpen[id] = true;
    persistAreaOpen();
    if (role !== 'kpis') {
      addBoard(id, 'New Board');
    }
    save();
    return true;
  }

  function removeArea(areaId) {
    if (!state.areas) return false;
    if (areaId === 'tasks') {
      alert('Tasks area cannot be removed.');
      return false;
    }
    var role = areaRoleFor(areaId);
    if (role === 'crm' || role === 'kpis') {
      alert('CRM and KPI\'s areas cannot be removed.');
      return false;
    }
    var boards = boardsByArea(areaId);
    if (boards.length) {
      alert('Move or remove all boards in this area before removing the area.');
      return false;
    }
    if (!confirm('Remove area "' + areaLabelFor(areaId) + '"?')) return false;
    state.areas = state.areas.filter(function (a) { return a.id !== areaId; });
    if (state.sections) state.sections = state.sections.filter(function (x) { return !(isSeparator(x) && x.area === areaId); });
    delete areaOpen[areaId];
    persistAreaOpen();
    save();
    return true;
  }

  function renameBoard(boardId, newLabel) {
    var sec = getMutableSection(boardId);
    if (!sec) return false;
    var label = String(newLabel || '').trim();
    if (!label) return false;
    sec.label = label;
    save();
    return true;
  }

  function reorderBoard(boardId, dir) {
    if (!state.sections) return false;
    var sec = getMutableSection(boardId);
    if (!sec) return false;
    var area = sec.area;
    var idxs = [];
    state.sections.forEach(function (s, i) {
      if (s.area === area) idxs.push(i);
    });
    var pos = -1;
    for (var i = 0; i < idxs.length; i++) {
      if (state.sections[idxs[i]].id === boardId) { pos = i; break; }
    }
    if (pos < 0) return false;
    var toPos = pos + (dir < 0 ? -1 : 1);
    if (toPos < 0 || toPos >= idxs.length) return false;
    var from = idxs[pos];
    var to = idxs[toPos];
    var tmp = state.sections[from];
    state.sections[from] = state.sections[to];
    state.sections[to] = tmp;
    save();
    return true;
  }

  function addBoard(areaId, label) {
    var name = String(label || '').trim();
    if (!name) return null;
    if (!state.sections) state.sections = [];
    var id = slugifyId(name, 'board');
    var stageSlug = slugifyStageLabel(name);
    var sec = {
      id: id,
      label: name,
      area: areaId,
      stages: [stageSlug]
    };
    if (!state.stageLabels) state.stageLabels = Object.assign({}, STAGE_LABELS);
    state.stageLabels[stageSlug] = name;
    // Insert after last board in this area
    var lastIdx = -1;
    for (var i = 0; i < state.sections.length; i++) {
      if (state.sections[i].area === areaId) lastIdx = i;
    }
    if (lastIdx >= 0) state.sections.splice(lastIdx + 1, 0, sec);
    else state.sections.push(sec);
    syncStagesFromState();
    save();
    setActiveBoard(id);
    return id;
  }

  function dealsOnBoard(boardId) {
    var sec = getSection(boardId);
    if (!sec) return [];
    var stages = sectionStages(sec);
    return allCards().filter(function (d) {
      return stages.indexOf(d.stage) !== -1;
    });
  }

  function removeBoard(boardId) {
    var sec = getMutableSection(boardId);
    if (!sec) return false;
    var siblings = boardsByArea(sec.area);
    if (siblings.length <= 1) {
      alert('Each area needs at least one board. Add another board before removing this one.');
      return false;
    }
    var onBoard = dealsOnBoard(boardId);
    if (onBoard.length) {
      var others = siblings.filter(function (s) { return s.id !== boardId; });
      var choices = others.map(function (s, i) {
        return (i + 1) + ') ' + s.label;
      }).join('\n');
      var pick = prompt(
        'This board has ' + onBoard.length + ' deal(s)/project(s). Move them to which board? Enter a number:\n' +
        choices + '\n\nCancel to keep the board.',
        '1'
      );
      if (pick == null) return false;
      var n = parseInt(pick, 10);
      if (!n || n < 1 || n > others.length) {
        alert('Invalid choice. Board not removed.');
        return false;
      }
      var target = others[n - 1];
      var targetStage = defaultStageForSection(target);
      onBoard.forEach(function (d) {
        d.stage = targetStage;
        var t = nowIso();
        d.updatedAt = t;
        d.lastActivityAt = t;
      });
    } else {
      if (!confirm('Remove board "' + sec.label + '"?')) return false;
    }
    state.sections = state.sections.filter(function (s) { return s.id !== boardId; });
    if (activeBoardId === boardId) {
      var next = boardsByArea(sec.area)[0] || sectionList()[0];
      if (next) activeBoardId = next.id;
    }
    syncStagesFromState();
    save();
    return true;
  }

  function toggleMenuEditMode() {
    if (!menuEditMode && !requireAdmin('edit the menu')) return;
    menuEditMode = !menuEditMode;
    railAddForm = null;
    if (menuEditMode && stagesEditMode) {
      stagesEditMode = false;
    }
    var btn = document.getElementById('btn-edit-menu');
    if (btn) {
      btn.classList.toggle('active', menuEditMode);
      btn.textContent = menuEditMode ? 'Done editing' : 'Edit menu';
    }
    var stageBtn = document.getElementById('btn-edit-stages');
    if (stageBtn && !stagesEditMode) {
      stageBtn.classList.remove('active');
      stageBtn.textContent = 'Edit stages';
    }
    renderApp();
  }

  function updateAddButtonLabel() {
    var btn = document.getElementById('btn-add');
    if (!btn) return;
    btn.textContent = 'Add ' + entityLabel(currentSection());
    var sc = document.getElementById('btn-show-converted');
    if (sc) {
      var sec = currentSection();
      var onCrm = sec && !isProjectArea(sec.area);
      sc.style.display = onCrm ? '' : 'none';
      var n = state.deals.filter(function (d) { return isConvertedLead(d) && sectionStages(sec).indexOf(d.stage) !== -1; }).length;
      sc.textContent = (showConvertedLeads ? 'Hide won' : 'Show won') + (n ? ' (' + n + ')' : '');
      sc.classList.toggle('active', showConvertedLeads);
    }
  }

  function renderApp() {
    checkBackupBanner();
    checkGmailBanner();
    sweepStageRules();
    if (ruleConfirmQueue.length) setTimeout(drainRuleConfirms, 0);
    revokeCoverUrlsIfViewChanged();
    renderLeftRail();
    applyNavOpen();
    renderContextTitle();
    updateAddButtonLabel();
    updateHeaderTasksBadge();
    var header = document.getElementById('app-header');
    header.classList.remove('view-board', 'view-kpis', 'view-kpi', 'view-tasks', 'view-detail', 'view-customers', 'view-leads', 'view-skus', 'view-admin', 'view-materials', 'view-profile', 'view-billing', 'view-today', 'view-sop', 'view-archived', 'view-cs', 'view-needs-reply', 'view-reply');
    var headerView = activeView === 'kpi' ? 'kpi' : activeView;
    header.classList.add('view-' + headerView);
    applyRoleToChrome();
    // The editor slides in over whatever view it was opened from.
    var inDetail = activeView === 'detail';
    var base = inDetail ? underlyingView() : activeView;
    document.getElementById('view-board').classList.toggle('active', base === 'board');
    document.getElementById('view-kpis').classList.toggle('active', base === 'kpi');
    document.getElementById('view-tasks').classList.toggle('active', base === 'tasks');
    document.getElementById('view-today').classList.toggle('active', base === 'today');
    document.getElementById('view-customers').classList.toggle('active', base === 'customers');
    document.getElementById('view-leads').classList.toggle('active', base === 'leads');
    document.getElementById('view-skus').classList.toggle('active', base === 'skus');
    document.getElementById('view-admin').classList.toggle('active', base === 'admin');
    document.getElementById('view-materials').classList.toggle('active', base === 'materials');
    document.getElementById('view-profile').classList.toggle('active', base === 'profile');
    document.getElementById('view-billing').classList.toggle('active', base === 'billing');
    document.getElementById('view-sop').classList.toggle('active', base === 'sop');
    var va = document.getElementById('view-archived');
    if (va) va.classList.toggle('active', base === 'archived');
    var vcs = document.getElementById('view-cs');
    if (vcs) vcs.classList.toggle('active', base === 'cs');
    var vrp = document.getElementById('view-reply');
    if (vrp) vrp.classList.toggle('active', base === 'reply');
    var vnr = document.getElementById('view-needs-reply');
    if (vnr) vnr.classList.toggle('active', base === 'needs-reply');
    var hs = document.getElementById('btn-header-sop');
    if (hs) hs.classList.toggle('active', activeView === 'sop');
    var hp =document.getElementById('btn-header-profile');
    if (hp) hp.classList.toggle('active', activeView === 'profile');
    document.getElementById('view-detail').classList.toggle('active', inDetail);
    document.getElementById('detail-scrim').classList.toggle('open', inDetail);
    document.body.classList.toggle('drawer-open', inDetail);
    if (inDetail) {
      if (base === 'board') renderBoard();
      else if (base === 'kpi') renderKpis();
      else if (base === 'tasks') renderTasks();
      else if (base === 'today') renderToday();
      else if (base === 'customers') renderCustomers();
      else if (base === 'leads') renderLeads();
      else if (base === 'skus') renderSkus();
      else if (base === 'admin') renderAdmin();
      else if (base === 'materials') renderMaterials();
      else if (base === 'profile') renderProfile();
      else if (base === 'billing') renderBilling();
      else if (base === 'sop') renderSop();
      else if (base === 'archived') renderArchived();
      else if (base === 'cs') renderCs();
      else if (base === 'reply') renderReply();
      else if (base === 'needs-reply') renderNeedsReply();
    }
    if (activeView === 'board') {
      renderBoard();
    } else if (activeView === 'kpi') {
      renderKpis();
    } else if (activeView === 'tasks') {
      renderTasks();
    } else if (activeView === 'today') {
      renderToday();
    } else if (activeView === 'detail') {
      renderDetail();
    } else if (activeView === 'customers') {
      renderCustomers();
    } else if (activeView === 'leads') {
      renderLeads();
    } else if (activeView === 'skus') {
      renderSkus();
    } else if (activeView === 'admin') {
      renderAdmin();
    } else if (activeView === 'profile') {
      renderProfile();
    } else if (activeView === 'materials') {
      renderMaterials();
    } else if (activeView === 'billing') {
      renderBilling();
    } else if (activeView === 'sop') {
      renderSop();
    } else if (activeView === 'archived') {
      renderArchived();
    } else if (activeView === 'cs') {
      renderCs();
    } else if (activeView === 'reply') {
      renderReply();
    } else if (activeView === 'needs-reply') {
      renderNeedsReply();
    }
  }

  function readStorageRaw() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { raw: raw, fromLegacy: false };
    for (var i = 0; i < LEGACY_STORAGE_KEYS.length; i++) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEYS[i]);
      if (raw) return { raw: raw, fromLegacy: true, legacyKey: LEGACY_STORAGE_KEYS[i] };
    }
    return null;
  }

  function load() {
    try {
      var found = readStorageRaw();
      if (!found) {
        state = normalizeState(seedData());
        save();
        return;
      }
      const parsed = JSON.parse(found.raw);
      if (!parsed || !Array.isArray(parsed.deals)) {
        state = normalizeState(seedData());
        save();
        return;
      }
      if (found.fromLegacy) takeSnapshotRaw('before-migrate-' + (found.legacyKey || 'legacy'), found.raw);
      else if (!(parsed.settings && parsed.settings.coldCleanup1)) takeSnapshotRaw('before-cold-leads-cleanup', found.raw);
      if (!found.fromLegacy && !(parsed.settings && parsed.settings.skuJobs1)) snapshotBeforeSkuJobs(found.raw);
      if (StuffMigrate.wonStagePending(parsed)) snapshotBeforeWonStage(found.raw);
      if (StuffMigrate.awaitingPaymentPending(parsed)) snapshotBeforeAwaiting(found.raw);
      state = normalizeState(parsed);
      if (!Array.isArray(state.tasks)) state.tasks = [];
      if (!sectionList().some(function (s) { return s.id === activeBoardId; })) {
        activeBoardId = sectionList()[0] ? sectionList()[0].id : 'cold-leads';
      }
      save();
      // Keep the v11 key untouched for one release as a rollback copy. Older keys are cleared as before.
      if (found.fromLegacy && found.legacyKey && found.legacyKey !== V11_STORAGE_KEY) {
        try { localStorage.removeItem(found.legacyKey); } catch (e2) { /* ignore */ }
      }
    } catch (e) {
      // Never overwrite real data because of a load bug. Keep a rescue copy, pause saving, tell the user.
      console.warn('Matrix load failed', e);
      var rescueRaw = null;
      try { rescueRaw = localStorage.getItem(STORAGE_KEY) || (readStorageRaw() || {}).raw || null; } catch (e3) { rescueRaw = null; }
      if (rescueRaw) {
        try { localStorage.setItem(RESCUE_PREFIX + new Date().toISOString().replace(/[:.]/g, '-'), rescueRaw); } catch (e4) { /* storage full: data still sits under its original key */ }
        loadFailed = true;
      }
      state = normalizeState(seedData());
      if (!loadFailed) save();
      setTimeout(function () {
        if (loadFailed) alert('The Matrix could not load your saved data, so it is showing the starter data instead.\n\nYour data is safe: it was not changed, a rescue copy was made, and saving is paused.\n\nOpen Admin tools to download the rescue copy, and send it with this message: ' + (e && e.message ? e.message : e));
      }, 300);
    }
  }

  // Projects become SKU jobs the first time a copy without settings.skuJobs1 loads (#3).
  // Keep that copy in Time machine first. Once per tab, so a cloud copy that has not been
  // saved back yet does not fill Time machine on every sync.
  var skuJobsSnapshotTaken = false;
  function snapshotBeforeSkuJobs(raw) {
    if (skuJobsSnapshotTaken) return;
    try { if (takeSnapshotRaw('before-sku-jobs', raw)) skuJobsSnapshotTaken = true; } catch (e) { /* storage full: the source copy is untouched */ }
  }

  // Won, awaiting payment stage (#97): same rule, one snapshot per tab before the one-time migration.
  var wonStageSnapshotTaken = false;
  function snapshotBeforeWonStage(raw) {
    if (wonStageSnapshotTaken) return;
    try { if (takeSnapshotRaw('before-won-awaiting-payment', raw)) wonStageSnapshotTaken = true; } catch (e) { /* storage full: the source copy is untouched */ }
  }

  // Awaiting Payment first on Pre-Production (#101): same rule, Time machine copy before the one-time migration.
  var awaitingSnapshotTaken = false;
  function snapshotBeforeAwaiting(raw) {
    if (awaitingSnapshotTaken) return;
    try { if (takeSnapshotRaw('before-awaiting-payment-move', raw)) awaitingSnapshotTaken = true; } catch (e) { /* storage full: the source copy is untouched */ }
  }

  var RESCUE_PREFIX = 'matrix-matrix-rescue-';
  var loadFailed = false;

  function listRescueKeys() {
    var keys = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(RESCUE_PREFIX) === 0) keys.push(k); } } catch (e) { /* ignore */ }
    return keys.sort().reverse();
  }

  function downloadText(name, text) {
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function saveLocalOnly() {
    if (loadFailed) {
      // Local data did not load: never overwrite it. The cloud copy (if signed in) clears this.
      if (typeof showToast === 'function') showToast('Saving is paused: your saved data did not load. Download the rescue copy in Admin tools.');
      return;
    }
    if (!state.tasks) state.tasks = [];
    StuffMigrate.ensureArrays(state);
    StuffMigrate.rebuildLeadFileRefs(state, nowIso());
    state.version = 12;
    state.schemaVersion = 12;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function save() {
    searchVersion = (searchVersion || 0) + 1;
    if (loadFailed) { saveLocalOnly(); return; }
    saveLocalOnly();
    if (window.MatrixCloud && window.MatrixCloud.queueCloudSave && !(window.MatrixCloud.isApplying && window.MatrixCloud.isApplying())) {
      window.MatrixCloud.queueCloudSave(state);
    }
  }

  function getDeal(id) {
    if (!id) return undefined;
    var d = state.deals.find(function (x) { return x.id === id; });
    if (d) return d;
    return (state.projects || []).find(function (p) { return p.id === id; });
  }

  function isProjectCard(card) {
    return !!card && card.kind === 'project';
  }

  // Won (or older converted) leads are closed: off the working CRM boards, kept in history.
  function isConvertedLead(card) {
    return !!card && !isProjectCard(card) && (card.status === 'converted' || card.status === 'won');
  }

  // Every card record: leads (any status) plus projects not yet folded into SKU jobs (#3).
  function allCards() {
    return (state.deals || []).concat((state.projects || []).filter(function (p) { return !p.archived; }));
  }

  // A SKU record (has a code and a bill of materials) rather than a lead or project.
  function isSkuRecord(x) {
    return !!x && Array.isArray(x.bom) && Object.prototype.hasOwnProperty.call(x, 'code') && !x.kind;
  }

  // Cards that count for tasks, KPIs and follow-ups: open leads plus projects.
  function activeCards() {
    return allCards().filter(function (c) { return !isConvertedLead(c); });
  }

  // Cards drawn on boards: active cards plus converted leads when Show converted is on.
  var showConvertedLeads = false;
  function boardCards() {
    if (!showConvertedLeads) return activeCards();
    // Converted leads only ever show on CRM boards; project boards draw projects.
    return allCards().filter(function (c) {
      if (!isConvertedLead(c)) return true;
      var sec = sectionForStage(c.stage);
      return !sec || !isProjectArea(sec.area);
    });
  }

  function cardTitle(deal) {
    if (isSkuRecord(deal)) return skuTitle(deal);
    if (isProjectCard(deal)) return (deal.name && String(deal.name).trim()) || (deal.title && String(deal.title).trim()) || deal.company || 'Project';
    return (deal.title && String(deal.title).trim()) || deal.company || 'Untitled';
  }

  function customerNameFor(card) {
    var c = card && card.customerId ? getCustomer(card.customerId) : null;
    return c ? c.name : (card && card.company) || '';
  }

  function cardSubline(deal) {
    var pc = primaryContactFor(deal);
    var contact = pc ? String(pc.name || '').trim() : '';
    if (isProjectCard(deal)) return contact;
    var company = (deal.company && String(deal.company).trim()) || '';
    var title = cardTitle(deal);
    if (contact && company && company !== title) return contact + ' / ' + company;
    if (contact) return contact;
    if (company && company !== title) return company;
    return '';
  }

  function dealInCurrentSection(deal) {
    var stages = sectionStages(currentSection());
    return stages.indexOf(deal.stage) !== -1;
  }

  function renderFollowupStrip() {
    const strip = document.getElementById('followup-strip');
    const items = activeCards()
      .filter(function (d) {
        return dealInCurrentSection(d) &&
          d.nextFollowUp &&
          !isColdStage(d.stage) &&
          isDueSoon(d.nextFollowUp) &&
          !isTerminalStage(d.stage);
      })
      .sort(function (a, b) {
        return (a.nextFollowUp || '').localeCompare(b.nextFollowUp || '');
      });

    if (!items.length) {
      strip.classList.remove('visible');
      strip.innerHTML = '';
      return;
    }

    strip.classList.add('visible');
    var overdue = items.filter(function (d) { return isOverdue(d.nextFollowUp); }).length;
    var soon = items.length - overdue;
    var parts = [];
    if (overdue) parts.push(overdue + ' overdue');
    if (soon) parts.push(soon + ' due soon');
    strip.innerHTML = '<button type="button" class="followup-summary" id="followup-open"><strong>Follow-ups:</strong> ' + parts.join(', ') + ' <span class="followup-view">View list</span></button>';
    strip.querySelector('#followup-open').addEventListener('click', function () { openFollowupList(items); });
  }

  // Follow-up list popup: one line per lead, tap a line to open that card.
  function openFollowupList(items) {
    var html = '<div class="modal-title-row"><h2>Follow-ups</h2></div><div class="followup-list">' +
      items.map(function (d) {
        var od = isOverdue(d.nextFollowUp);
        return '<button type="button" class="followup-row' + (od ? ' overdue' : '') + '" data-fu-id="' + escapeHtml(d.id) + '">' +
          '<span class="fu-name">' + escapeHtml(cardTitle(d)) + '</span>' +
          '<span class="fu-date">' + escapeHtml(d.nextFollowUp) + (od ? ' overdue' : '') + '</span></button>';
      }).join('') + '</div>' +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Close</button></div>';
    var m = openJobModal(html);
    m.querySelectorAll('[data-fu-id]').forEach(function (b) {
      b.addEventListener('click', function () { var id = b.getAttribute('data-fu-id'); closeJobModal(); openDetail(id); });
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function firstNonLostStage(sec) {
    var stages = sectionStages(sec);
    for (var i = 0; i < stages.length; i++) {
      if (stages[i] !== 'lost') return stages[i];
    }
    return stages[0] || 'cold-leads';
  }

  function clearDragOver() {
    document.querySelectorAll('.drag-over').forEach(function (el) {
      el.classList.remove('drag-over');
    });
  }

  function isPartnerSection(sec) {
    return !!sec && (sec.id === 'partner-leads' || sec.copyOnDrop === true);
  }

  function isDealOnPartner(deal) {
    return !!deal && isPartnerSection(sectionForStage(deal.stage));
  }

  // Partner keeps its own timeline while preserving the original deal.
  function duplicateDealForPartner(sourceDeal, targetStage) {
    if (!sourceDeal || !targetStage) return null;
    var copy = JSON.parse(JSON.stringify(sourceDeal));
    copy.id = uid();
    while (getDeal(copy.id)) copy.id = uid();
    copy.stage = targetStage;
    copy.stageEnteredAt = nowIso();
    copy.copiedFromId = sourceDeal.id;
    copy.source = normalizeSource(sourceDeal.source);
    var t = nowIso();
    copy.updatedAt = t;
    copy.lastActivityAt = t;
    copy.files = emptyFiles();
    copy.coverFileId = null;
    copy.values = migrateDealValues(copy);
    state.deals.push(copy);
    logChange('copy', 'lead', copy.id, 'Copied ' + cardTitle(sourceDeal) + ' into Partner ' + targetStage);
    deepCopyDealFiles(sourceDeal.files).then(function (files) {
      var live = getDeal(copy.id);
      if (!live) return;
      live.files = files;
      save();
      if (activeView === 'detail' && activeDetailId === live.id) renderDetail();
    });
    return copy;
  }

  // Lead onto a Pre-Production or Operations board: graduation modal instead of a move.
  // Project onto a CRM board: blocked.
  function moveRule(card, targetSection, targetStage) {
    var targetIsProjectArea = isProjectArea(targetSection.area);
    if (isProjectCard(card) && !targetIsProjectArea) {
      showToast('Projects cannot move back to CRM');
      return 'block';
    }
    if (!isProjectCard(card) && targetIsProjectArea) {
      if (card.type === 'internal') return 'ok'; // Shop Needs cards stay internal cards
      if (isConvertedLead(card)) { showToast('This lead is already won. Its work runs as SKU jobs.'); return 'block'; }
      // The CRM ends at Won (#3): dropping a lead on Pre-Production or Operations marks it won.
      openWonModal({ leadId: card.id, stage: targetStage });
      return 'graduate';
    }
    if (isConvertedLead(card)) {
      showToast('This lead is won. Open it to see its SKU jobs.');
      return 'block';
    }
    return 'ok';
  }

  // Stage automations (#57). The rules live in state.stageRules and run in StuffMigrate.applyStageRules.
  // Create project is never silent: it asks, then opens the Mark won window (what graduation is today).
  var promptedNextStepFor = null;
  var ruleConfirmQueue = [];

  function ruleVarsFor(deal) {
    var c = primaryContactFor(deal);
    return { company: deal.company || '', title: cardTitle(deal), contact: (c && c.name) || deal.contactName || '' };
  }

  function runStageRules(deal) {
    if (!deal || !state || loadFailed || !StuffMigrate.stageRulesFor(state, deal.stage).length) {
      if (deal && StuffMigrate.stageEntryPending(deal) && state && !loadFailed) deal.ruleEntryAt = deal.stageEnteredAt;
      return false;
    }
    var res = StuffMigrate.applyStageRules(state, deal, {
      at: nowIso(),
      vars: ruleVarsFor(deal),
      actor: sectionActor(),
      nextStepHandled: promptedNextStepFor === deal.id,
      bucketOk: function (b) { return !!findTaskBucket(b); },
      delegateOk: function (n) { return ensureDelegatees().indexOf(n) !== -1; },
      log: function (action, type, id, text) { logChange(action, type, id, text); }
    });
    if (promptedNextStepFor === deal.id) promptedNextStepFor = null;
    res.confirms.forEach(function (rule) { ruleConfirmQueue.push({ dealId: deal.id, rule: rule, stage: deal.stage }); });
    return res.fired.length > 0 || res.confirms.length > 0;
  }

  // Catch-up for moves made outside this tab (bots through the write API, other devices, the detail form).
  function sweepStageRules() {
    if (!state || loadFailed || !state.stageRules || !Object.keys(state.stageRules).length) return;
    var changed = false;
    (state.deals || []).forEach(function (d) {
      if (!StuffMigrate.stageEntryPending(d) || isProjectCard(d)) return;
      if (runStageRules(d)) changed = true;
    });
    // Deferred: a render during a cloud update must not be skipped by the "applying remote" guard in save().
    if (changed) setTimeout(save, 0);
  }

  function drainRuleConfirms() {
    var bd = document.getElementById('job-modal-backdrop');
    if (!ruleConfirmQueue.length || (bd && bd.classList.contains('open'))) return;
    var item = ruleConfirmQueue.shift();
    var deal = getDeal(item.dealId);
    if (!deal || isProjectCard(deal) || isConvertedLead(deal) || deal.stage !== item.stage) { drainRuleConfirms(); return; }
    var html = '<div class="modal-title-row"><h2>Create the project?</h2></div>' +
      '<p class="muted-note">' + escapeHtml(cardTitle(deal)) + ' is on ' + escapeHtml(stageLabel(item.stage)) + '. A stage rule can create its project. Nothing is created until you say yes.</p>' +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" id="rule-no">Not now</button><button type="button" id="rule-yes">Create project</button></div>';
    var m = openJobModal(html, 'sm');
    function done() { closeJobModal(); drainRuleConfirms(); }
    m.querySelector('#rule-no').addEventListener('click', function () {
      logChange('rule', 'lead', deal.id, 'Rule ' + item.rule.id + ' (' + item.stage + '): Create project declined');
      save();
      done();
    });
    m.querySelector('#rule-yes').addEventListener('click', function () {
      logChange('rule', 'lead', deal.id, 'Rule ' + item.rule.id + ' (' + item.stage + '): Create project confirmed');
      save();
      closeJobModal();
      openWonModal({ leadId: deal.id });
    });
  }

  function moveDealToStage(dealId, stage) {
    var job = getJobCard(dealId);
    if (job) return !!stage && moveJobCard(job, stage);
    var deal = getDeal(dealId);
    var targetSection = sectionForStage(stage);
    if (!deal || !stage || !targetSection) return false;
    if (deal.stage === stage) return false;
    var rule = moveRule(deal, targetSection, stage);
    if (rule !== 'ok') return false;
    if (needsLostReason(deal, stage)) {
      openLostReasonModal(deal, function () { if (moveDealToStage(dealId, stage)) renderApp(); });
      return false;
    }
    if (needsNextStepOnMove(deal, stage, deal.nextFollowUp)) {
      // A next step rule on the target stage prefills the prompt (it does not skip it).
      var nsRule = StuffMigrate.stageRulesFor(state, stage).find(function (r) { return r.kind === 'nextStep'; });
      var nsOpts = nsRule ? { date: StuffMigrate.addBusinessDays(nowIso(), nsRule.days), text: StuffMigrate.renderRuleTemplate(nsRule.title, ruleVarsFor(deal)) } : null;
      openNextStepModal(deal, stage, function (date, text) {
        deal.nextFollowUp = date;
        if (text) StuffMigrate.setRecordSection(state, deal, 'lead', 'openItems', { nextStep: text }, sectionActor());
        logChange('update', 'lead', deal.id, 'Next step date ' + date);
        promptedNextStepFor = nsRule ? deal.id : null;
        if (moveDealToStage(dealId, stage)) renderApp();
        promptedNextStepFor = null;
      }, nsOpts);
      return false;
    }
    if (isPartnerSection(targetSection) && !isDealOnPartner(deal)) {
      if (!duplicateDealForPartner(deal, stage)) return false;
    } else {
      var t = nowIso();
      var from = deal.stage;
      setDealStage(deal, stage);
      deal.updatedAt = t;
      deal.lastActivityAt = t;
      logChange('move', isProjectCard(deal) ? 'project' : 'lead', deal.id, 'Stage ' + from + ' to ' + stage);
      if (isProjectCard(deal)) deal.status = StuffMigrate.projectStatusFor(StuffMigrate.sectionAreaForStage(state, stage));
      else runStageRules(deal);
    }
    save();
    drainRuleConfirms();
    return true;
  }

  function moveDealToSection(dealId, sectionId) {
    var job = getJobCard(dealId);
    var sec = getSection(sectionId);
    if (job) return !!sec && moveJobCard(job, defaultStageForSection(sec));
    var deal = getDeal(dealId);
    if (!deal || !sec) return false;
    // Rail drop: land on first stage of target board, copying into Partner.
    var targetStage = defaultStageForSection(sec);
    var rule = moveRule(deal, sec, targetStage);
    if (rule !== 'ok') return false;
    if (isPartnerSection(sec) && !isDealOnPartner(deal)) {
      if (!duplicateDealForPartner(deal, targetStage)) return false;
    } else {
      var t = nowIso();
      var from = deal.stage;
      setDealStage(deal, targetStage);
      deal.updatedAt = t;
      deal.lastActivityAt = t;
      logChange('move', isProjectCard(deal) ? 'project' : 'lead', deal.id, 'Stage ' + from + ' to ' + targetStage + ' (rail drop)');
      if (isProjectCard(deal)) deal.status = StuffMigrate.projectStatusFor(StuffMigrate.sectionAreaForStage(state, targetStage));
      else runStageRules(deal);
    }
    save();
    drainRuleConfirms();
    return true;
  }

  function isLostStage(stage) {
    return stage === 'lost';
  }

  function nonLostDeals() {
    return activeCards().filter(function (d) { return !isLostStage(d.stage); });
  }

  function VALUE_LABELS() {
    return {
      designDfm: 'Design/DFM',
      prototyping: 'Prototyping',
      tooling: 'Tooling',
      productionArr: 'Production ARR',
      currentPo: 'Current PO',
      partnerServices: 'Partner Services'
    };
  }

  // Sales deep dive (#56). Numbers come from StuffMigrate.salesKpis; every number is a button that lists its deals.
  var salesRange = 90;
  var SALES_RANGES = [[30, '30 days'], [90, '90 days'], [365, '365 days'], [0, 'All']];

  function crmStageIds() {
    var out = [];
    sectionList().filter(isCrmBoard).forEach(function (sec) {
      sectionStages(sec).forEach(function (s) { if (out.indexOf(s) === -1) out.push(s); });
    });
    return out;
  }

  function renderSalesDeep(root) {
    var k = StuffMigrate.salesKpis(state, {
      nowMs: Date.now(), rangeDays: salesRange, crmStages: crmStageIds(), leadValue: leadDollars,
      normalizeSource: function (s) { return normalizeSource(s) || 'unknown'; }, isColdStage: isColdStage
    });
    var drills = {};
    var seq = 0;
    // A number that opens the list of deals behind it. Zero or empty stays plain text.
    function num(text, title, ids) {
      if (!ids || !ids.length) return '<span class="kpi-num-zero">' + escapeHtml(text) + '</span>';
      var key = 'd' + (seq++);
      drills[key] = { title: title, ids: ids };
      return '<button type="button" class="kpi-num" data-drill="' + key + '">' + escapeHtml(text) + '</button>';
    }
    var srcName = function (id) { return id === 'unknown' ? 'No source' : (sourceLabel(id) || id); };
    var pct = function (r) { return r == null ? 'n/a' : Math.round(r * 100) + '%'; };
    var days = function (n) { return n == null ? 'n/a' : n + (n === 1 ? ' day' : ' days'); };
    var rangeLabel = (SALES_RANGES.filter(function (r) { return r[0] === salesRange; })[0] || [0, 'All'])[1];
    function card(id, title, note, body) {
      return '<section class="sales-card" id="sales-' + id + '"><h3>' + escapeHtml(title) + '</h3>' +
        (note ? '<p class="sales-note">' + note + '</p>' : '') + body + '</section>';
    }
    function table(head, rows) {
      if (!rows.length) return '<p class="task-empty">Nothing to show yet.</p>';
      return '<div class="sales-scroll"><table class="sales-table"><thead><tr>' + head.map(function (h, i) {
        return '<th' + (i ? ' class="n"' : '') + '>' + escapeHtml(h) + '</th>';
      }).join('') + '</tr></thead><tbody>' + rows.map(function (r) {
        return '<tr>' + r.map(function (c, i) { return '<td' + (i ? ' class="n"' : '') + '>' + c + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
    }

    var html = '<div class="kpi-head"><h2>KPIs / Sales deep dive</h2></div>' +
      '<div class="sales-range" role="group" aria-label="Date range">' + SALES_RANGES.map(function (r) {
        return '<button type="button" class="ghost' + (r[0] === salesRange ? ' active' : '') + '" data-sales-range="' + r[0] + '">' + r[1] + '</button>';
      }).join('') + '</div>' +
      '<p class="sales-note">Closed deals, time in stage and quotes use the range. Open pipeline and breaches are as of today.</p>' +
      '<div id="sales-drill"></div>';

    // Win rate by source
    html += card('win-rate', 'Win rate by source', 'Won out of won plus lost, last ' + escapeHtml(rangeLabel.toLowerCase()) + '.',
      table(['Source', 'Won', 'Lost', 'Win rate'], k.winRates.map(function (r) {
        return [escapeHtml(srcName(r.source)), num(String(r.won), srcName(r.source) + ': won', r.wonIds),
          num(String(r.lost), srcName(r.source) + ': lost', r.lostIds), num(pct(r.rate), srcName(r.source) + ': won and lost', r.ids)];
      }).concat(k.winRates.length ? [['<strong>All sources</strong>', num(String(k.overall.won), 'All won', k.overall.wonIds),
        num(String(k.overall.lost), 'All lost', k.overall.lostIds), num(pct(k.overall.rate), 'All won and lost', k.overall.wonIds.concat(k.overall.lostIds))]] : [])));

    // Lost reasons
    html += card('lost-reasons', 'Lost reasons', 'Count and value per reason.',
      table(['Reason', 'Deals', 'Value'], k.lostReasons.map(function (r) {
        return [escapeHtml(r.label), num(String(r.count), 'Lost: ' + r.label, r.ids), escapeHtml(formatMoney(r.value))];
      })));

    // Time in stage
    html += card('time-in-stage', 'Time in stage', 'Days in each CRM stage, from the change log. Deals without history use when they entered the stage.',
      table(['Stage', 'Deals', 'Median', 'Average'], k.timeInStage.map(function (r) {
        return [escapeHtml(stageLabel(r.stage)) + (r.slowest ? ' <span class="badge badge-lost">Slowest</span>' : ''),
          num(String(r.count), stageLabel(r.stage) + ': deals counted', r.ids), escapeHtml(days(r.median)), escapeHtml(days(r.average))];
      })));

    // Quote turnaround
    var q = k.quoteSla;
    var breachHtml = q.breaches.length
      ? '<ul class="sales-list">' + q.breaches.map(function (b) {
        var d = getDeal(b.id);
        return '<li><button type="button" class="kpi-num" data-open-deal="' + escapeHtml(b.id) + '">' + escapeHtml(d ? cardTitle(d) : b.id) + '</button> waiting ' + escapeHtml(days(b.days)) + '</li>';
      }).join('') + '</ul>'
      : '<p class="task-empty">No quotes are over the ' + q.slaDays + '-day limit right now.</p>';
    html += card('quote-sla', 'Quote turnaround vs the ' + q.slaDays + '-day limit', 'From entering Needs quotation to quote sent.',
      table(['Measure', 'Value'], [
        ['Quotes sent', num(String(q.count), 'Quotes sent in range', q.ids)],
        ['On time', num(q.onTimePct == null ? 'n/a' : q.onTimePct + '% (' + q.onTimeCount + ')', 'Quotes sent on time', q.onTimeIds)],
        ['Late', num(String(q.count - q.onTimeCount), 'Quotes sent late', q.lateIds)],
        ['Median turnaround', escapeHtml(days(q.medianDays))]
      ]) + '<h4>Over the limit now</h4>' + breachHtml);

    // Weighted pipeline
    var w = k.weighted;
    var monthName = function (m) {
      if (!m) return 'No date';
      return new Date(m + '-15T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };
    html += card('weighted', 'Weighted pipeline', 'Open deal value times the chance to close for its stage. Change the chances in Edit stages. Date is expected close, else next step.',
      '<p class="sales-big">' + num(formatMoney(w.total), 'Weighted pipeline: open deals', w.ids) + ' <span class="sales-note">of ' + escapeHtml(formatMoney(w.rawTotal)) + ' open</span></p>' +
      table(['Stage', 'Chance', 'Deals', 'Open value', 'Weighted'], w.stages.map(function (r) {
        return [escapeHtml(stageLabel(r.stage)), r.probability + '%', num(String(r.count), stageLabel(r.stage) + ': open deals', r.ids),
          escapeHtml(formatMoney(r.value)), escapeHtml(formatMoney(r.weighted))];
      })) + '<h4>By expected month</h4>' +
      table(['Month', 'Deals', 'Weighted'], w.months.map(function (m) {
        return [escapeHtml(monthName(m.month)), num(String(m.count), 'Expected ' + monthName(m.month), m.ids), escapeHtml(formatMoney(m.weighted))];
      })));

    // New leads per week
    var maxWeek = Math.max.apply(null, k.newLeads.weeks.map(function (x) { return x.total; }).concat([1]));
    html += card('new-leads', 'New leads per week', 'Last 12 weeks, by source. Weeks start Monday.',
      '<div class="sales-bars">' + k.newLeads.weeks.map(function (wk) {
        var parts = k.newLeads.sources.filter(function (s) { return wk.bySource[s]; }).map(function (s) { return srcName(s) + ' ' + wk.bySource[s]; }).join(', ');
        return '<div class="sales-bar-col"><div class="sales-bar-num">' + num(String(wk.total), 'New leads, week of ' + wk.start + (parts ? ' (' + parts + ')' : ''), wk.ids) + '</div>' +
          '<div class="sales-bar-track"><div class="sales-bar-stack" style="height:' + Math.round(100 * wk.total / maxWeek) + '%" title="' + escapeHtml(parts || 'None') + '">' +
          k.newLeads.sources.filter(function (s) { return wk.bySource[s]; }).map(function (s) {
            return '<span class="sales-seg src-' + (k.newLeads.sources.indexOf(s) % 6) + '" style="flex:' + wk.bySource[s] + '"></span>';
          }).join('') + '</div></div><div class="sales-bar-label">' + escapeHtml(wk.start.slice(5)) + '</div></div>';
      }).join('') + '</div>' +
      '<div class="sales-legend">' + k.newLeads.sources.map(function (s, i) {
        return '<span><i class="sales-swatch src-' + (i % 6) + '"></i>' + escapeHtml(srcName(s)) + '</span>';
      }).join('') + '</div>');

    root.innerHTML = html;

    function showDrill(key) {
      var box = document.getElementById('sales-drill');
      var dr = drills[key];
      if (!box) return;
      if (!dr) { box.innerHTML = ''; return; }
      box.innerHTML = '<section class="sales-card sales-drill-card"><div class="sales-drill-head"><h3>' + escapeHtml(dr.title) + ' (' + dr.ids.length + ')</h3>' +
        '<button type="button" class="ghost" data-drill-close="1">Close</button></div><ul class="sales-list">' + dr.ids.map(function (id) {
          var d = getDeal(id);
          if (!d) return '';
          return '<li><button type="button" class="kpi-num" data-open-deal="' + escapeHtml(id) + '">' + escapeHtml(cardTitle(d)) + '</button> ' +
            '<span class="sales-note">' + escapeHtml(stageLabel(d.stage)) + ', ' + escapeHtml(formatMoney(leadDollars(d))) + '</span></li>';
        }).join('') + '</ul></section>';
      box.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
    // One handler on the root (assigned, so a re-render never stacks listeners).
    root.onclick = function (e) {
      var t = e.target.closest ? e.target.closest('button') : null;
      if (!t) return;
      if (t.getAttribute('data-sales-range')) { salesRange = Number(t.getAttribute('data-sales-range')); renderKpis(); }
      else if (t.getAttribute('data-drill')) showDrill(t.getAttribute('data-drill'));
      else if (t.getAttribute('data-drill-close')) showDrill('');
      else if (t.getAttribute('data-open-deal')) openDetail(t.getAttribute('data-open-deal'));
    };
  }

  function renderKpis() {
    var root = document.getElementById('kpis-root');
    if (activeKpiPage === 'sales-deep') { renderSalesDeep(root); return; }
    if (activeKpiPage === 'ops-deep') {
      root.innerHTML = '<h2>Operations deep dive</h2><div class="kpi-coming"><h3>Coming soon</h3><p>Operations throughput and production metrics will live here.</p></div>';
      return;
    }
    // overview
    if (kpiEditingViews) { renderPipelineViewEditor(root); return; }
    var active = nonLostDeals();
    var lostCount = state.deals.filter(function (d) { return isLostStage(d.stage); }).length;
    var overdueFollowups = activeCards().filter(function (d) {
      return d.nextFollowUp && isOverdue(d.nextFollowUp) && !isTerminalStage(d.stage);
    }).length;
    var rotting = activeCards().filter(function (d) { return isRotting(d); }).length;
    var views = state.pipelineViews || [];

    var html = '<div class="kpi-head"><h2>KPIs / Overview</h2>' +
      '<button type="button" class="ghost" id="btn-edit-views">Edit pipeline views</button></div>';
    var arrSum = StuffMigrate.arrSummary(state);
    html += arrHeadlineHtml(arrSum);

    // Pipeline views: one dropdown card per view, cards listed inside.
    html += '<div class="pipeline-views">';
    if (!views.length) html += '<p class="task-empty">No pipeline views. Use Edit pipeline views to add one.</p>';
    views.forEach(function (v) {
      var cards = cardsInPipelineView(v);
      var sum = cards.reduce(function (a, d) { return a + totalValue(d); }, 0);
      var leads = cards.filter(function (c) { return !isProjectCard(c) && !isSkuRecord(c); }).length;
      var open = !!kpiOpen['pv:' + v.id];
      html += '<details class="pipeline-view pv-' + escapeHtml(v.color || 'custom') + '" data-kpi-key="pv:' + escapeHtml(v.id) + '"' + (open ? ' open' : '') + '>';
      html += '<summary><span class="pv-name">' + escapeHtml(v.name) + '</span>' +
        '<span class="pv-value">' + formatMoney(sum) + '</span>' +
        '<span class="pv-meta">' + cards.length + ' cards: ' + leads + ' leads, ' + (cards.length - leads) + ' projects</span>' +
        '<span class="pv-boards">' + escapeHtml(viewBoardSummary(v)) + '</span></summary>';
      if (!cards.length) {
        html += '<p class="task-empty">Nothing in this view.</p>';
      } else {
        html += '<div class="table-wrap"><table class="kpi-table pv-table"><thead><tr><th>Card</th><th>Customer</th><th>Board / stage</th><th class="num">Idle</th><th class="num">Value</th></tr></thead><tbody>';
        cards.slice().sort(function (a, b) { return totalValue(b) - totalValue(a); }).forEach(function (c) {
          var sec = sectionForStage(c.stage);
          var idle = idleDays(c);
          html += '<tr class="pv-row" data-open-id="' + escapeHtml(c.id) + '"><td>' + escapeHtml(cardTitle(c)) +
            (isProjectCard(c) ? ' <span class="badge badge-entity">Project</span>' : isSkuRecord(c) ? ' <span class="badge badge-entity">SKU</span>' : '') + '</td>' +
            '<td>' + escapeHtml(customerNameFor(c)) + '</td>' +
            '<td>' + escapeHtml((sec ? sec.label + ' / ' : '') + stageLabel(c.stage)) + '</td>' +
            '<td class="num">' + (idle === Infinity ? '' : idle + 'd') + '</td>' +
            '<td class="num">' + formatMoney(totalValue(c)) + '</td></tr>';
        });
        html += '</tbody></table></div>';
      }
      html += '</details>';
    });
    html += '</div>';

    html += '<div class="kpi-tiles">';
    html += tile('Overdue follow-ups', String(overdueFollowups));
    html += tile('Idle cards', String(rotting));
    if (lostCount) html += tile('Lost', String(lostCount), true);
    html += '</div>';

    // Over SLA (#97): cards past their stage SLA, grouped by stage owner.
    var overList = overSlaCards();
    if (overList.length) {
      var byOwner = {};
      overList.forEach(function (c) { (byOwner[c.owner || ''] = byOwner[c.owner || ''] || []).push(c); });
      html += '<details class="kpi-section over-sla-section" data-kpi-key="over-sla"' + (kpiOpen['over-sla'] ? ' open' : '') + '><summary><h3>Over SLA (' +
        overList.length + ' cards past their stage SLA)</h3></summary>';
      Object.keys(byOwner).sort().forEach(function (o) {
        html += '<div class="section-title">' + escapeHtml(o ? StuffMigrate.sopBotLabel(state, o) : 'No owner') + ' (' + byOwner[o].length + ')</div>' +
          '<div class="table-wrap"><table class="kpi-table pv-table"><thead><tr><th>Card</th><th>Customer</th><th>Stage</th><th class="num">Days in stage</th><th class="num">SLA</th></tr></thead><tbody>';
        byOwner[o].sort(function (a, b) { return b.status.daysOver - a.status.daysOver; }).forEach(function (c) {
          html += '<tr class="pv-row" data-open-id="' + escapeHtml(c.id) + '"><td>' + escapeHtml(c.title) + '</td><td>' + escapeHtml(c.customer) + '</td>' +
            '<td>' + escapeHtml(stageLabel(c.stage)) + '</td><td class="num">' + c.status.daysInStage + 'd</td><td class="num">' + c.status.slaDays + 'd</td></tr>';
        });
        html += '</tbody></table></div>';
      });
      html += '</details>';
    }

    // Breakdowns: collapsed by default, scoped by a view.
    var scopeView = views.find(function (v) { return v.id === kpiScope; }) || null;
    if (kpiScope !== 'all' && !scopeView) kpiScope = 'all';
    var scoped = scopeView ? cardsInPipelineView(scopeView) : active;
    html += '<div class="kpi-scope"><label for="kpi-scope">Breakdowns for</label><select id="kpi-scope">' +
      '<option value="all"' + (kpiScope === 'all' ? ' selected' : '') + '>All active (not lost)</option>';
    views.forEach(function (v) {
      html += '<option value="' + escapeHtml(v.id) + '"' + (kpiScope === v.id ? ' selected' : '') + '>' + escapeHtml(v.name) + '</option>';
    });
    html += '</select></div>';

    function section(key, title, body) {
      return '<details class="kpi-section kpi-details" data-kpi-key="' + key + '"' + (kpiOpen[key] ? ' open' : '') + '>' +
        '<summary><h3>' + escapeHtml(title) + '</h3></summary>' + body + '</details>';
    }

    var body = '<table class="kpi-table"><thead><tr><th>Area</th><th>Board</th><th class="num">Count</th><th class="num">Total $</th></tr></thead><tbody>';
    sectionList().forEach(function (sec) {
      var stages = sectionStages(sec);
      var deals = scoped.filter(function (d) { return stages.indexOf(d.stage) !== -1; });
      if (scopeView && !deals.length) return;
      var sum = deals.reduce(function (a, d) { return a + totalValue(d); }, 0);
      body += '<tr><td>' + escapeHtml(areaLabelFor(sec.area)) + '</td><td>' + escapeHtml(sec.label) + '</td>' +
        '<td class="num">' + deals.length + '</td><td class="num">' + formatMoney(sum) + '</td></tr>';
    });
    body += '</tbody></table>';
    html += section('by-board', 'By board', body);

    body = '<table class="kpi-table"><thead><tr><th>Area</th><th class="num">Count</th><th class="num">Total $</th></tr></thead><tbody>';
    ['crm', 'pre-production', 'floor-operations'].forEach(function (areaId) {
      var stages = [];
      boardsByArea(areaId).forEach(function (sec) { stages = stages.concat(sectionStages(sec)); });
      var deals = scoped.filter(function (d) { return stages.indexOf(d.stage) !== -1; });
      var sum = deals.reduce(function (a, d) { return a + totalValue(d); }, 0);
      body += '<tr><td>' + escapeHtml(areaLabelFor(areaId)) + '</td><td class="num">' + deals.length + '</td><td class="num">' + formatMoney(sum) + '</td></tr>';
    });
    body += '</tbody></table>';
    html += section('by-area', 'By area', body);

    body = '<table class="kpi-table"><thead><tr><th>Field</th><th class="num">Sum</th></tr></thead><tbody>';
    var labels = VALUE_LABELS();
    VALUE_KEYS.forEach(function (k) {
      var sum = scoped.reduce(function (a, d) { return a + (Number(migrateDealValues(d)[k]) || 0); }, 0);
      body += '<tr><td>' + escapeHtml(labels[k] || k) + '</td><td class="num">' + formatMoney(sum) + '</td></tr>';
    });
    body += '</tbody></table>';
    html += section('by-field', 'Value field breakdown', body);

    var byStage = {};
    scoped.forEach(function (d) {
      if (!byStage[d.stage]) byStage[d.stage] = { count: 0, dollars: 0 };
      byStage[d.stage].count += 1;
      byStage[d.stage].dollars += totalValue(d);
    });
    var stageRows = Object.keys(byStage).map(function (st) {
      return { stage: st, count: byStage[st].count, dollars: byStage[st].dollars };
    }).sort(function (a, b) { return (b.count - a.count) || (b.dollars - a.dollars); }).slice(0, 8);
    var maxCount = stageRows.length ? stageRows[0].count : 1;
    body = '';
    if (!stageRows.length) body += '<p class="task-empty">No cards in scope.</p>';
    stageRows.forEach(function (row) {
      var pct = Math.round((row.count / maxCount) * 100);
      body += '<div class="bar-row"><div class="bar-label" title="' + escapeHtml(stageLabel(row.stage)) + '">' + escapeHtml(stageLabel(row.stage)) + '</div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="bar-meta">' + row.count + ' / ' + formatMoney(row.dollars) + '</div></div>';
    });
    html += section('top-stages', 'Top stages by count', body);

    root.innerHTML = html;

    root.querySelectorAll('details[data-kpi-key]').forEach(function (d) {
      d.addEventListener('toggle', function () { kpiOpen[d.getAttribute('data-kpi-key')] = d.open; });
    });
    root.querySelectorAll('.pv-row').forEach(function (tr) {
      tr.addEventListener('click', function () { openDetail(tr.getAttribute('data-open-id')); });
    });
    root.querySelectorAll('[data-arr-list]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-arr-list');
        var titles = { trueArr: 'True ARR: sold jobs', counted: 'Pipeline ARR (counted)', potential: 'ARR potential: every open lead' };
        openArrListModal(titles[k], arrSum[k].items);
      });
    });
    document.getElementById('btn-edit-views').addEventListener('click', function () {
      kpiEditingViews = true;
      kpiViewDraft = JSON.parse(JSON.stringify(state.pipelineViews || []));
      renderKpis();
    });
    document.getElementById('kpi-scope').addEventListener('change', function (e) {
      kpiScope = e.target.value;
      renderKpis();
    });

    function tile(label, value, muted) {
      return '<div class="kpi-tile' + (muted ? ' muted' : '') + '">' +
        '<div class="kpi-label">' + escapeHtml(label) + '</div>' +
        '<div class="kpi-value">' + escapeHtml(value) + '</div></div>';
    }
  }

  // ---------------------------------------------------------------------
  // KPI pipeline views
  // ---------------------------------------------------------------------
  var kpiOpen = {};
  var kpiScope = 'all';
  var kpiEditingViews = false;
  var kpiViewDraft = null;

  // Leads and SKU jobs on the view's stages (#3: SKU jobs replace project cards).
  function cardsInPipelineView(view) {
    var stages = StuffMigrate.pipelineViewStages(state, view);
    return activeCards().concat(liveSkus()).filter(function (c) { return c.stage && stages.indexOf(c.stage) !== -1; });
  }

  function viewBoardSummary(view) {
    var names = (view.boards || []).map(function (id) { var sec = getSection(id); return sec ? sec.label : null; }).filter(Boolean);
    var ex = (view.excludeStages || []).filter(function (st) { return (state.stages || []).indexOf(st) !== -1; });
    return (names.length > 4 ? names.slice(0, 4).join(', ') + ' +' + (names.length - 4) + ' more' : names.join(', ')) +
      (ex.length ? ' (without ' + ex.map(stageLabel).join(', ') + ')' : '');
  }

  function renderPipelineViewEditor(root) {
    var draft = kpiViewDraft;
    var areas = ['crm', 'pre-production', 'floor-operations'];
    var html = '<div class="kpi-head"><h2>Edit pipeline views</h2></div>';
    html += '<p class="board-note visible">A view adds up every open lead and project sitting on the boards you tick. New stages you add to a ticked board join the view automatically. Untick a stage to leave it out.</p>';
    draft.forEach(function (v, vi) {
      html += '<section class="pv-edit" data-vi="' + vi + '">';
      html += '<div class="pv-edit-head"><input type="text" class="pv-name-input" value="' + escapeHtml(v.name) + '" aria-label="View name" />' +
        '<button type="button" class="ghost" data-act="up"' + (vi === 0 ? ' disabled' : '') + '>Up</button>' +
        '<button type="button" class="ghost" data-act="down"' + (vi === draft.length - 1 ? ' disabled' : '') + '>Down</button>' +
        '<button type="button" class="danger" data-act="remove">Remove view</button></div>';
      html += '<div class="pv-edit-areas">';
      areas.forEach(function (areaId) {
        var boards = boardsByArea(areaId);
        if (!boards.length) return;
        html += '<div class="pv-edit-area"><h4>' + escapeHtml(areaLabelFor(areaId)) + '</h4>';
        boards.forEach(function (sec) {
          var on = v.boards.indexOf(sec.id) !== -1;
          html += '<div class="pv-edit-board"><label class="check-line"><input type="checkbox" data-board="' + escapeHtml(sec.id) + '"' + (on ? ' checked' : '') + ' /> <strong>' + escapeHtml(sec.label) + '</strong></label>';
          if (on) {
            html += '<div class="pv-edit-stages">';
            sectionStages(sec).forEach(function (st) {
              var inc = v.excludeStages.indexOf(st) === -1;
              html += '<label class="stage-chip' + (inc ? ' on' : '') + '"><input type="checkbox" data-stage="' + escapeHtml(st) + '"' + (inc ? ' checked' : '') + ' /> ' + escapeHtml(stageLabel(st)) + '</label>';
            });
            html += '</div>';
          }
          html += '</div>';
        });
        html += '</div>';
      });
      html += '</div></section>';
    });
    html += '<div class="admin-actions"><button type="button" class="secondary" id="pv-add">+ New view</button>' +
      '<button type="button" class="ghost" id="pv-reset">Reset to Hot and Cold</button></div>';
    html += '<div class="detail-actions"><span class="spacer"></span><button type="button" class="ghost" id="pv-cancel">Cancel</button><button type="button" id="pv-save">Save views</button></div>';
    root.innerHTML = html;

    root.querySelectorAll('.pv-edit').forEach(function (secEl) {
      var v = draft[Number(secEl.getAttribute('data-vi'))];
      secEl.querySelector('.pv-name-input').addEventListener('input', function (e) { v.name = e.target.value; });
      secEl.querySelectorAll('input[data-board]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var id = cb.getAttribute('data-board');
          if (cb.checked) { if (v.boards.indexOf(id) === -1) v.boards.push(id); }
          else v.boards = v.boards.filter(function (x) { return x !== id; });
          renderPipelineViewEditor(root);
        });
      });
      secEl.querySelectorAll('input[data-stage]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var st = cb.getAttribute('data-stage');
          if (cb.checked) v.excludeStages = v.excludeStages.filter(function (x) { return x !== st; });
          else if (v.excludeStages.indexOf(st) === -1) v.excludeStages.push(st);
          cb.closest('.stage-chip').classList.toggle('on', cb.checked);
        });
      });
      secEl.querySelectorAll('[data-act]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = draft.indexOf(v), act = btn.getAttribute('data-act');
          if (act === 'remove') { if (!confirm('Remove view "' + v.name + '"?')) return; draft.splice(i, 1); }
          else if (act === 'up' && i > 0) { draft.splice(i, 1); draft.splice(i - 1, 0, v); }
          else if (act === 'down' && i < draft.length - 1) { draft.splice(i, 1); draft.splice(i + 1, 0, v); }
          renderPipelineViewEditor(root);
        });
      });
    });
    document.getElementById('pv-add').addEventListener('click', function () {
      draft.push({ id: StuffMigrate.makeId('pv'), name: 'New view', boards: [], excludeStages: ['lost'], color: 'custom' });
      renderPipelineViewEditor(root);
    });
    document.getElementById('pv-reset').addEventListener('click', function () {
      if (!confirm('Replace all views with the default Hot Pipeline and Cold Pipeline?')) return;
      kpiViewDraft = draft = StuffMigrate.defaultPipelineViews(state);
      renderPipelineViewEditor(root);
    });
    document.getElementById('pv-cancel').addEventListener('click', function () {
      kpiEditingViews = false; kpiViewDraft = null; renderKpis();
    });
    document.getElementById('pv-save').addEventListener('click', function () {
      draft.forEach(function (v) { v.name = String(v.name || '').trim() || 'Untitled view'; });
      state.pipelineViews = draft;
      logChange('update', 'settings', 'pipelineViews', 'Saved ' + draft.length + ' pipeline views: ' + draft.map(function (v) { return v.name; }).join(', '));
      save();
      kpiEditingViews = false; kpiViewDraft = null;
      renderKpis();
    });
  }

  function followUpVirtualTasks() {
    return activeCards()
      .filter(function (d) {
        return d.nextFollowUp && !isColdStage(d.stage) &&
          isDueSoon(d.nextFollowUp) &&
          !isTerminalStage(d.stage);
      })
      .slice()
      .sort(function (a, b) {
        return (a.nextFollowUp || '').localeCompare(b.nextFollowUp || '');
      })
      .map(function (d) {
        return {
          virtual: true,
          id: 'fu_' + d.id,
          title: 'Follow up: ' + cardTitle(d),
          dueDate: d.nextFollowUp,
          done: false,
          dealId: d.id,
          createdAt: null,
          completedAt: null,
          autoKind: 'follow-ups'
        };
      });
  }

  function dealPickerOptions(selectedId) {
    var opts = '<option value="">(no lead or SKU)</option>';
    var deals = activeCards().concat(liveSkus()).slice().sort(function (a, b) {
      return cardTitle(a).localeCompare(cardTitle(b));
    });
    var groups = { sku: [], project: [], lead: [] };
    deals.forEach(function (d) { groups[isSkuRecord(d) ? 'sku' : isProjectCard(d) ? 'project' : 'lead'].push(d); });
    ['sku', 'project', 'lead'].forEach(function (g) {
      if (!groups[g].length) return;
      opts += '<optgroup label="' + (g === 'sku' ? 'SKU jobs' : g === 'project' ? 'Projects' : 'Open leads') + '">';
      groups[g].forEach(function (d) {
        var label = cardTitle(d);
        var company = isSkuRecord(d) ? ' / ' + (d.code || '') + (customerNameFor(d) ? ' / ' + customerNameFor(d) : '') : (d.company && d.company !== label) ? ' / ' + d.company : '';
        opts += '<option value="' + escapeHtml(d.id) + '"' +
          (selectedId === d.id ? ' selected' : '') + '>' +
          escapeHtml(label + company) + '</option>';
      });
      opts += '</optgroup>';
    });
    return opts;
  }

  /* ---- Tasks IA: Home + section tabs + Eisenhower ---- */
  var DEFAULT_DELEGATEES = ['Quoting bots', 'Design', 'Prototyping', 'Tooling', 'Floor', 'Owner'];
  var DECIDE_OPTIONS = [
    { id: 'tomorrow', label: 'Tomorrow', days: 1 },
    { id: 'next-week', label: 'Next week', days: 7 },
    { id: 'two-weeks', label: '2 weeks', days: 14 },
    { id: 'next-month', label: 'Next month', days: 30 },
    { id: 'next-quarter', label: 'Next quarter', days: 90 }
  ];
  function ensureDelegatees() {
    if (!state.delegatees || !Array.isArray(state.delegatees) || !state.delegatees.length) {
      state.delegatees = DEFAULT_DELEGATEES.slice();
    }
    return state.delegatees;
  }

  function ensureSuppressedAuto() {
    if (!state.suppressedAuto || typeof state.suppressedAuto !== 'object') {
      state.suppressedAuto = {};
    }
    return state.suppressedAuto;
  }

  function autoSuppressKey(t) {
    return String(t.autoKind || '') + '|' + String(t.dealId || t.poId || '') + '|' + String(t.bucket || '');
  }

  function isAutoSuppressed(t) {
    var map = ensureSuppressedAuto();
    var key = autoSuppressKey(t);
    var entry = map[key];
    if (!entry) return false;
    var deal = t.dealId ? getDeal(t.dealId) : null;
    if (deal && entry.stage && deal.stage !== entry.stage) {
      delete map[key];
      return false;
    }
    return true;
  }

  function suppressAutoTask(t) {
    if (!t || !t.virtual) return;
    var map = ensureSuppressedAuto();
    var deal = t.dealId ? getDeal(t.dealId) : null;
    map[autoSuppressKey(t)] = {
      stage: deal ? deal.stage : null,
      at: nowIso(),
      autoId: t.id
    };
  }

  function isDueWithinDays(dateStr, days) {
    if (!dateStr) return false;
    if (isOverdue(dateStr)) return true;
    var t = new Date(toDateOnly(dateStr) + 'T12:00:00');
    var now = new Date();
    var diff = (t - now) / (24 * 60 * 60 * 1000);
    return diff <= days;
  }

  function allOpenTasksFlat() {
    var out = [];
    TASK_GROUPS.forEach(function (group) {
      group.buckets.forEach(function (bucket) {
        autoTasksForBucket(bucket.id).forEach(function (t) { out.push(t); });
        manualTasksForBucket(bucket.id, true).forEach(function (t) { out.push(t); });
      });
    });
    return out;
  }

  function urgentTasks() {
    return allOpenTasksFlat().filter(function (t) {
      if (t.done) return false;
      if (t.urgent || t.quadrant === 'do') return true;
      if (t.dueDate && isDueWithinDays(t.dueDate, 2)) return true;
      return false;
    }).sort(function (a, b) {
      return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
    });
  }

  function importantTasks() {
    return allOpenTasksFlat().filter(function (t) {
      if (t.done) return false;
      if (t.urgent || t.quadrant === 'do') return false;
      if (t.quadrant === 'decide') {
        if (!t.dueDate) return true;
        return isDueWithinDays(t.dueDate, 14);
      }
      if (t.priority === 'high') return true;
      return false;
    }).sort(function (a, b) {
      return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
    });
  }

  function personalDoTasks() {
    return allOpenTasksFlat().filter(function (t) {
      if (t.done) return false;
      return !!t.personal || t.quadrant === 'do';
    }).sort(function (a, b) {
      return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
    });
  }

  function urgentOpenCount() {
    return urgentTasks().length;
  }

  function findStoredTask(id) {
    return (state.tasks || []).find(function (x) { return x.id === id; }) || null;
  }

  function resolveTaskRef(id) {
    if (!id) return null;
    var stored = findStoredTask(id);
    if (stored) return { task: stored, virtual: false };
    var all = allOpenTasksFlat();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return { task: all[i], virtual: !!all[i].virtual };
    }
    return null;
  }

  function materializeOrGet(ref, patch) {
    patch = patch || {};
    if (!ref) return null;
    if (!ref.virtual) {
      Object.keys(patch).forEach(function (k) { ref.task[k] = patch[k]; });
      return ref.task;
    }
    var v = ref.task;
    suppressAutoTask(v);
    var t = {
      id: 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
      title: v.title,
      dueDate: v.dueDate || null,
      done: false,
      dealId: v.dealId || null,
      bucket: v.bucket || null,
      createdAt: nowIso(),
      completedAt: null,
      quadrant: null,
      personal: false,
      urgent: false,
      today: false,
      delegatedTo: null,
      decideOption: null,
      suppressed: false,
      dismissedAt: null,
      fromAutoId: v.id,
      assigneeTeam: v.assigneeTeam || null,
      executedBy: v.executedBy || null
    };
    if (v.poId) t.poId = v.poId;
    Object.keys(patch).forEach(function (k) { t[k] = patch[k]; });
    if (!state.tasks) state.tasks = [];
    state.tasks.push(t);
    return t;
  }


  function ensureCompletionLog() {
    if (!Array.isArray(state.completionLog)) state.completionLog = [];
    return state.completionLog;
  }

  function currentUserEmail(opts) {
    opts = opts || {};
    if (opts.completedBy) return String(opts.completedBy);
    if (auth && auth.user && auth.user.email) return String(auth.user.email);
    return 'local';
  }

  function sectionLabelForTask(t) {
    if (!t) return null;
    var g = groupForBucket(t.bucket);
    return g ? g.label : null;
  }

  // Completion log (issue #5): after the switch in Admin tools, new entries go to the
  // completionLog collection instead of workspace/main. A refused write keeps the entry in
  // workspace/main, so nothing is lost.
  var completionCache = { loaded: false, loading: false, entries: [], error: '' };

  function completionCollectionInUse() {
    return StuffMigrate.completionLogStore(state) === 'collection' && cloudReady() && !!accessApi().completionLog;
  }

  function appendCompletionLog(entry) {
    if (!completionCollectionInUse()) {
      ensureCompletionLog().push(entry);
      return entry;
    }
    completionCache.entries.push(entry);
    accessApi().completionLog.append(entry).catch(function (err) {
      completionCache.entries = completionCache.entries.filter(function (e) { return e.id !== entry.id; });
      ensureCompletionLog().push(entry);
      logChange('update', 'completionLog', entry.id, 'Completion log collection refused a write (' + ((err && err.message) || err) + '); kept in workspace/main');
      save();
    });
    return entry;
  }

  function allCompletionEntries() {
    return StuffMigrate.mergeCompletionEntries(ensureCompletionLog(), completionCache.entries);
  }

  function loadCompletionCache() {
    var s = state.settings || {};
    if (!cloudReady() || !accessApi().completionLog || completionCache.loading || !(s.completionLogStore === 'collection' || s.completionLogCopiedAt)) return Promise.resolve();
    completionCache.loading = true;
    return accessApi().completionLog.list().then(function (entries) {
      var pending = completionCache.entries.filter(function (e) { return !entries.some(function (x) { return x.id === e.id; }); });
      completionCache = { loaded: true, loading: false, entries: entries.concat(pending), error: '' };
    }).catch(function (err) {
      completionCache.loading = false;
      completionCache.error = (err && err.message) || String(err);
    }).then(function () {
      if (activeView === 'admin') renderAdmin(); else renderApp();
    });
  }

  function buildCompletionLogEntry(task, opts) {
    opts = opts || {};
    var entry = {
      id: 'clog_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
      kind: opts.kind || 'completed',
      taskId: task && task.id ? task.id : (opts.taskId || null),
      title: (task && task.title) || opts.title || '',
      bucket: (task && task.bucket) || opts.bucket || null,
      section: (task && sectionLabelForTask(task)) || opts.section || null,
      dealId: (task && task.dealId) || opts.dealId || null,
      quadrant: (task && task.quadrant) || opts.quadrant || null,
      dueDate: (task && task.dueDate) || opts.dueDate || null,
      completedAt: opts.at || nowIso(),
      completedBy: currentUserEmail(opts),
      source: opts.source || 'unknown'
    };
    if (opts.onBehalfOf) entry.onBehalfOf = opts.onBehalfOf;
    return entry;
  }

  function completionsBy(userEmail, fromDate, toDate) {
    return StuffMigrate.countCompletions(allCompletionEntries(), userEmail, fromDate, toDate);
  }

  function completedEntriesToday() {
    var today = todayStr();
    return ensureCompletionLog().filter(function (e) {
      if (!e || e.kind !== 'completed' || !e.completedAt) return false;
      try {
        var d = new Date(e.completedAt);
        if (isNaN(d.getTime())) return false;
        var local = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        return local === today;
      } catch (err) { return false; }
    }).sort(function (a, b) {
      return String(b.completedAt).localeCompare(String(a.completedAt));
    });
  }

  function markTaskCompleted(ref, opts) {
    opts = opts || {};
    if (!ref) return null;
    var at = opts.at || nowIso();
    var t = materializeOrGet(ref, {
      done: true,
      completedAt: at,
      urgent: false,
      dismissedAt: null
    });
    if (!t) return null;
    t.done = true;
    t.completedAt = at;
    t.urgent = false;
    if (t.dismissedAt) t.dismissedAt = null;
    appendCompletionLog(buildCompletionLogEntry(t, {
      kind: 'completed',
      source: opts.source || 'done-button',
      at: at,
      completedBy: opts.completedBy,
      onBehalfOf: opts.onBehalfOf,
      quadrant: t.quadrant || opts.quadrant || null
    }));
    return t;
  }

  function markTaskDismissed(ref, opts) {
    opts = opts || {};
    if (!ref) return null;
    var at = opts.at || nowIso();
    if (ref.virtual) {
      suppressAutoTask(ref.task);
      appendCompletionLog(buildCompletionLogEntry(ref.task, {
        kind: 'dismissed',
        source: opts.source || 'eisenhower-delete',
        at: at,
        completedBy: opts.completedBy,
        onBehalfOf: opts.onBehalfOf,
        quadrant: 'delete'
      }));
      return ref.task;
    }
    var t = ref.task;
    t.done = true;
    t.completedAt = at;
    t.suppressed = true;
    t.dismissedAt = at;
    t.quadrant = 'delete';
    t.urgent = false;
    appendCompletionLog(buildCompletionLogEntry(t, {
      kind: 'dismissed',
      source: opts.source || 'eisenhower-delete',
      at: at,
      completedBy: opts.completedBy,
      onBehalfOf: opts.onBehalfOf,
      quadrant: 'delete'
    }));
    return t;
  }

  function markTaskReopened(id, opts) {
    opts = opts || {};
    var t = (state.tasks || []).find(function (x) { return x.id === id; });
    if (!t) return null;
    t.done = false;
    t.completedAt = null;
    t.dismissedAt = null;
    appendCompletionLog(buildCompletionLogEntry(t, {
      kind: 'reopened',
      source: opts.source || 'done-button',
      at: opts.at || nowIso(),
      completedBy: opts.completedBy,
      onBehalfOf: opts.onBehalfOf,
      quadrant: t.quadrant || null
    }));
    return t;
  }

  function applyQuadrantCompleted(ref) {
    if (!ref) return;
    markTaskCompleted(ref, { source: 'eisenhower-drop', quadrant: ref.task && ref.task.quadrant });
    save();
    renderApp();
  }

  function applyQuadrantDo(ref) {
    var t = materializeOrGet(ref, {
      quadrant: 'do',
      personal: true,
      urgent: true,
      decideOption: null
    });
    if (t && !t.dueDate) t.dueDate = todayStr();
    save();
    renderApp();
  }

  function applyQuadrantDecide(ref, optionId) {
    var opt = DECIDE_OPTIONS.find(function (o) { return o.id === optionId; });
    if (!opt) return;
    var due = addDaysYmd(todayStr(), opt.days);
    materializeOrGet(ref, {
      quadrant: 'decide',
      urgent: false,
      personal: false,
      decideOption: opt.id,
      dueDate: due,
      delegatedTo: null
    });
    save();
    renderApp();
  }

  function applyQuadrantDelegate(ref, who) {
    if (!who) return;
    materializeOrGet(ref, {
      quadrant: 'delegate',
      delegatedTo: who,
      urgent: false,
      decideOption: null
    });
    save();
    renderApp();
  }

  function applyQuadrantDelete(ref) {
    if (!ref) return;
    if (!confirm('Dismiss this task? It will not count as completed.')) return;
    markTaskDismissed(ref, { source: 'eisenhower-delete' });
    save();
    renderApp();
  }

  function closeTasksPopover() {
    if (tasksPopoverEl && tasksPopoverEl.parentNode) {
      tasksPopoverEl.parentNode.removeChild(tasksPopoverEl);
    }
    tasksPopoverEl = null;
  }

  function showDecidePopover(ref, x, y) {
    closeTasksPopover();
    var el = document.createElement('div');
    el.className = 'tasks-popover';
    el.style.left = Math.min(x, window.innerWidth - 260) + 'px';
    el.style.top = Math.min(y, window.innerHeight - 280) + 'px';
    var html = '<h4>Defer until</h4><div class="pop-actions">';
    DECIDE_OPTIONS.forEach(function (o) {
      html += '<button type="button" data-decide="' + escapeHtml(o.id) + '">' +
        escapeHtml(o.label) + '</button>';
    });
    html += '</div><div class="pop-foot"><button type="button" class="secondary" data-cancel="1">Cancel</button></div>';
    el.innerHTML = html;
    document.body.appendChild(el);
    tasksPopoverEl = el;
    el.querySelectorAll('[data-decide]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyQuadrantDecide(ref, btn.getAttribute('data-decide'));
        closeTasksPopover();
      });
    });
    el.querySelector('[data-cancel]').addEventListener('click', closeTasksPopover);
  }

  function showDelegatePopover(ref, x, y) {
    closeTasksPopover();
    ensureDelegatees();
    var el = document.createElement('div');
    el.className = 'tasks-popover';
    el.style.left = Math.min(x, window.innerWidth - 260) + 'px';
    el.style.top = Math.min(y, window.innerHeight - 280) + 'px';
    var html = '<h4>Delegate to</h4><div class="pop-actions">';
    state.delegatees.forEach(function (name) {
      html += '<button type="button" data-deleg="' + escapeHtml(name) + '">' +
        escapeHtml(name) + '</button>';
    });
    html += '</div><div class="pop-foot"><button type="button" class="link-btn" data-edit-delegates="1">Edit list</button>' +
      '<button type="button" class="secondary" data-cancel="1">Cancel</button></div>';
    el.innerHTML = html;
    document.body.appendChild(el);
    tasksPopoverEl = el;
    el.querySelector('[data-edit-delegates]').addEventListener('click', function () { closeTasksPopover(); editDelegatees(); });
    el.querySelectorAll('[data-deleg]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyQuadrantDelegate(ref, btn.getAttribute('data-deleg'));
        closeTasksPopover();
      });
    });
    el.querySelector('[data-cancel]').addEventListener('click', closeTasksPopover);
  }

  // Manage delegates (issue #45): add, rename, remove and reorder the Delegate-to list.
  // Rules live in migrate-v12.js (applyDelegateRows). A rename moves tasks delegated to the
  // old name; a removal leaves existing tasks as they are.
  function editDelegatees() {
    ensureDelegatees();
    var draft = state.delegatees.map(function (n) { return { from: n, name: n }; });
    var focusAfter = null;
    var m = openJobModal('<div id="dlg-editor"></div>', 'sm');
    var box = m.querySelector('#dlg-editor');
    function syncInputs() {
      box.querySelectorAll('[data-dlg-name]').forEach(function (inp) { draft[Number(inp.getAttribute('data-dlg-name'))].name = inp.value; });
    }
    function draw(error) {
      var html = '<div class="modal-title-row"><h2 id="dlg-title">Delegates</h2></div>' +
        '<p class="muted-note">These names show in the Delegate popover on Tasks. Renaming one also updates tasks already delegated to it. Removing one never changes existing tasks.</p>' +
        '<ul class="dlg-list" aria-labelledby="dlg-title">' + draft.map(function (r, i) {
          return '<li class="dlg-row"><input type="text" data-dlg-name="' + i + '" value="' + escapeHtml(r.name) + '" aria-label="Delegate ' + (i + 1) + ' name" />' +
            '<button type="button" class="ghost" data-dlg-up="' + i + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Move ' + escapeHtml(r.name || 'row ' + (i + 1)) + ' up">Up</button>' +
            '<button type="button" class="ghost" data-dlg-down="' + i + '"' + (i === draft.length - 1 ? ' disabled' : '') + ' aria-label="Move ' + escapeHtml(r.name || 'row ' + (i + 1)) + ' down">Down</button>' +
            '<button type="button" class="ghost" data-dlg-remove="' + i + '"' + (draft.length === 1 ? ' disabled' : '') + ' aria-label="Remove ' + escapeHtml(r.name || 'row ' + (i + 1)) + '">Remove</button></li>';
        }).join('') + '</ul>' +
        '<div class="dlg-row dlg-add"><label for="dlg-new" class="sr-only">New delegate</label><input type="text" id="dlg-new" placeholder="New delegate" />' +
        '<button type="button" class="secondary" id="dlg-add">Add</button></div>' +
        '<p class="warn-note" id="dlg-error" role="alert">' + (error ? escapeHtml(error) : '') + '</p>' +
        '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button><button type="button" id="dlg-save">Save</button></div>';
      box.innerHTML = html;
      box.querySelectorAll('[data-dlg-up],[data-dlg-down]').forEach(function (b) {
        b.addEventListener('click', function () {
          syncInputs();
          var up = b.hasAttribute('data-dlg-up');
          var i = Number(b.getAttribute(up ? 'data-dlg-up' : 'data-dlg-down'));
          var j = up ? i - 1 : i + 1;
          if (j < 0 || j >= draft.length) return;
          var t = draft[i]; draft[i] = draft[j]; draft[j] = t;
          focusAfter = '[data-dlg-' + (up ? 'up' : 'down') + '="' + j + '"]';
          draw();
        });
      });
      box.querySelectorAll('[data-dlg-remove]').forEach(function (b) {
        b.addEventListener('click', function () {
          syncInputs();
          if (draft.length === 1) return;
          draft.splice(Number(b.getAttribute('data-dlg-remove')), 1);
          focusAfter = '#dlg-new';
          draw();
        });
      });
      function addNew() {
        syncInputs();
        var inp = box.querySelector('#dlg-new');
        var name = StuffMigrate.cleanDelegateName(inp.value);
        if (!name) { draw('Type a name to add.'); return; }
        if (draft.some(function (r) { return StuffMigrate.cleanDelegateName(r.name).toLowerCase() === name.toLowerCase(); })) { draw(name + ' is already on the list.'); return; }
        draft.push({ from: null, name: name });
        focusAfter = '#dlg-new';
        draw();
      }
      box.querySelector('#dlg-add').addEventListener('click', addNew);
      box.querySelector('#dlg-new').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addNew(); } });
      box.querySelector('#dlg-save').addEventListener('click', function () {
        syncInputs();
        var res = StuffMigrate.applyDelegateRows(state, draft);
        if (res.error) { draw(res.error + '.'); return; }
        if (res.changed) {
          var parts = [];
          if (res.added.length) parts.push('added ' + res.added.join(', '));
          res.renamed.forEach(function (r) { parts.push('renamed ' + r.from + ' to ' + r.to + (r.tasks ? ' (' + r.tasks + ' task' + (r.tasks === 1 ? '' : 's') + ' moved)' : '')); });
          if (res.removed.length) parts.push('removed ' + res.removed.join(', ') + ' (existing tasks kept)');
          if (res.reordered) parts.push('new order');
          logChange('update', 'settings', 'delegatees', 'Delegates list updated: ' + parts.join('; ') + '. Now: ' + res.list.join(', '));
          save();
        }
        closeJobModal();
        renderApp();
        if (res.changed) showToast('Delegates saved.');
      });
      // Keep keyboard focus inside the dialog.
      box.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var items = Array.prototype.filter.call(box.querySelectorAll('input, button:not([disabled])'), function (el) { return el.offsetParent !== null; });
        if (!items.length) return;
        if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === items[items.length - 1]) { e.preventDefault(); items[0].focus(); }
      });
      var f = focusAfter ? box.querySelector(focusAfter) : (error ? box.querySelector('#dlg-new') : box.querySelector('[data-dlg-name]'));
      focusAfter = null;
      if (f) f.focus({ preventScroll: false });
    }
    draw();
  }

  function handleQuadrantDrop(quadrant, taskId, clientX, clientY) {
    var ref = resolveTaskRef(taskId);
    if (!ref) return;
    if (quadrant === 'do') applyQuadrantDo(ref);
    else if (quadrant === 'decide') showDecidePopover(ref, clientX || 80, clientY || 80);
    else if (quadrant === 'delegate') showDelegatePopover(ref, clientX || 80, clientY || 80);
    else if (quadrant === 'delete') applyQuadrantDelete(ref);
    else if (quadrant === 'completed') applyQuadrantCompleted(ref);
  }

  function setActiveTasksTab(tabId) {
    var ok = tabId === 'home' || TASK_GROUPS.some(function (g) { return g.id === tabId; });
    if (!ok) tabId = 'home';
    activeTasksTab = tabId;
    if (tabId === 'home') {
      activeTasksBucketFilter = 'all';
    } else {
      var g = TASK_GROUPS.find(function (x) { return x.id === tabId; });
      if (g && activeTasksBucketFilter !== 'all') {
        var found = g.buckets.some(function (b) { return b.id === activeTasksBucketFilter; });
        if (!found) activeTasksBucketFilter = 'all';
      }
    }
    persistActiveNav();
    renderTasks();
  }

  function setActiveTasksBucketFilter(bucketId) {
    activeTasksBucketFilter = bucketId || 'all';
    persistActiveNav();
    renderTasks();
  }

  function renderTasks() {
    var root = document.getElementById('tasks-root');
    if (!root) return;
    ensureDelegatees();
    ensureSuppressedAuto();
    var html = '<div class="tasks-page">';
    html += '<div class="tasks-page-head"><h2>Tasks</h2>';
    html += '<p class="board-note visible">Home shows what needs you today and what is coming up beside an Eisenhower board. Flag any task with Today to pin it there. CRM, Pre-Production and Operations each have their own list with a sticky Eisenhower board on the left. Drag a task onto Do, Decide, Delegate, Delete, or Completed.</p>';
    html += renderTasksTabsHtml();
    html += '</div>';
    if (activeTasksTab === 'home') html += renderTasksHomeHtml();
    else html += renderTasksSectionHtml(activeTasksTab);
    html += '</div>';
    root.innerHTML = html;
    bindTaskEvents();
  }

  function renderTasksTabsHtml() {
    var tabs = [
      { id: 'home', label: 'Home', count: todayTasks().length },
      { id: 'tasks-crm', label: 'CRM', count: groupOpenCount('tasks-crm') },
      { id: 'tasks-pre-production', label: 'Pre-Production', count: groupOpenCount('tasks-pre-production') },
      { id: 'tasks-operations', label: 'Operations', count: groupOpenCount('tasks-operations') }
    ];
    var html = '<div class="tasks-tabs" role="tablist" aria-label="Tasks sections">';
    tabs.forEach(function (tab) {
      html += '<button type="button" role="tab" class="tasks-tab' +
        (activeTasksTab === tab.id ? ' active' : '') +
        '" data-tasks-tab="' + escapeHtml(tab.id) + '"' +
        ' aria-selected="' + (activeTasksTab === tab.id ? 'true' : 'false') + '">' +
        escapeHtml(tab.label) +
        ' <span class="rail-count' + (tab.count ? '' : ' zero') + '">' + tab.count + '</span>' +
        '</button>';
    });
    html += '</div>';
    return html;
  }

  function renderTasksHomeHtml() {
    var today = todayTasks();
    var soon = comingUpTasks();
    var homeEisenhowerPool = allOpenTasksFlat().filter(function (t) { return !t.done; });
    var html = '';
    html += '<div class="tasks-split">';
    html += '<aside class="tasks-split-eisenhower">' + renderEisenhowerHtml(homeEisenhowerPool) + '</aside>';
    html += '<div class="tasks-split-list">';
    html += '<section class="home-section urgent"><h3>Today <span class="rail-count' +
      (today.length ? '' : ' zero') + '">' + today.length + '</span></h3>';
    html += renderTaskListHtml(today, {
      empty: 'Nothing for today. Overdue tasks, tasks due today, and anything you flag Today land here.',
      draggable: true
    });
    html += '</section>';
    html += '<section class="home-section important"><h3>Coming up (7 days) <span class="rail-count' +
      (soon.length ? '' : ' zero') + '">' + soon.length + '</span></h3>';
    html += renderTaskListHtml(soon, { empty: 'Nothing due in the next week.', draggable: true });
    html += '</section>';
    html += '</div></div>';
    return html;
  }

  function isTodayTask(t) {
    if (t.done) return false;
    if (t.today) return true;
    if (t.dueDate && (isOverdue(t.dueDate) || toDateOnly(t.dueDate) === todayStr())) return true;
    return false;
  }

  function todayTasks() {
    return allOpenTasksFlat().filter(isTodayTask).sort(function (a, b) {
      return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
    });
  }

  function comingUpTasks() {
    return allOpenTasksFlat().filter(function (t) {
      return !t.done && !isTodayTask(t) && t.dueDate && isDueWithinDays(t.dueDate, 7);
    }).sort(function (a, b) {
      return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
    });
  }

  function toggleTodayFlag(id) {
    var ref = resolveTaskRef(id);
    if (!ref) return;
    var on = !ref.task.today;
    var t = materializeOrGet(ref, { today: on });
    if (t) logChange('update', 'task', t.id, (on ? 'Flagged Today: ' : 'Unflagged Today: ') + t.title);
    save();
    renderApp();
  }

  // ---------------------------------------------------------------------
  // Today inbox (#52): one list of what needs the signed-in person. Items are derived from
  // leads and tasks (migrate-v12.js collectTodayItems); only Done and Snooze are stored, per user.
  // ---------------------------------------------------------------------
  var activeTodayTab = 'today';

  function setActiveToday() {
    autoCloseNavOnPhone();
    activeView = 'today';
    activeArea = 'today';
    activeDetailId = null;
    persistActiveNav();
    renderApp();
  }

  function todayItemsNow() {
    return StuffMigrate.collectTodayItems(state, {
      today: todayStr(),
      nowMs: Date.now(),
      cards: activeCards().filter(function (c) { return !isProjectCard(c); }),
      tasks: todayTasks(),
      terminalStages: TERMINAL_STAGES,
      rotDays: ROT_DAYS,
      stageLabel: stageLabel,
      cardTitle: cardTitle
    });
  }

  function todaySplit() {
    return StuffMigrate.splitTodayItems(state, currentUserEmail(), todayItemsNow(), todayStr(), nowIso());
  }

  function todayAgeText(it) {
    if (it.type === 'inbound') return it.age < 1 / 24 ? 'just now' : (it.age < 1 ? Math.floor(it.age * 24) + 'h' : '1d');
    var d = Math.floor(it.age || 0);
    return d > 0 ? d + 'd' : 'today';
  }

  function renderToday() {
    var root = document.getElementById('today-root');
    if (!root) return;
    var split = todaySplit();
    var tabs = [{ id: 'today', label: 'Today' }, { id: 'snoozed', label: 'Snoozed' }, { id: 'done', label: 'Done today' }];
    var html = '<div class="tasks-page today-page"><div class="tasks-page-head"><h2>Today</h2>' +
      '<p class="board-note visible">What needs you today: new inbound leads, next steps due, quotes past 3 days, idle leads and tasks. Done and Snooze are yours only.</p>' +
      '<div class="tasks-tabs" role="tablist" aria-label="Today views">';
    tabs.forEach(function (tab) {
      var n = split[tab.id].length;
      html += '<button type="button" role="tab" class="tasks-tab' + (activeTodayTab === tab.id ? ' active' : '') + '" data-today-tab="' + tab.id + '"' +
        ' aria-selected="' + (activeTodayTab === tab.id ? 'true' : 'false') + '">' + escapeHtml(tab.label) +
        ' <span class="rail-count' + (n ? '' : ' zero') + '">' + n + '</span></button>';
    });
    html += '</div></div>';
    var list = split[activeTodayTab] || [];
    if (!list.length) {
      html += '<p class="task-empty">' + (activeTodayTab === 'today' ? 'Nothing needs you right now.' : activeTodayTab === 'snoozed' ? 'Nothing snoozed.' : 'Nothing done yet today.') + '</p>';
    } else {
      html += '<ul class="today-list">';
      list.forEach(function (it) {
        var key = escapeHtml(it.key);
        var sub = [it.company && it.company !== it.title ? it.company : '', it.stageLabel].filter(Boolean).join(' / ');
        html += '<li class="today-item type-' + escapeHtml(it.type) + '" data-today-key="' + key + '">' +
          (activeTodayTab === 'done' ? '<div class="today-open static">' : '<button type="button" class="today-open" data-today-open="' + key + '">') +
          '<span class="today-type">' + escapeHtml(it.typeLabel) + '</span>' +
          '<span class="today-title">' + escapeHtml(it.title) + '</span>' +
          (sub ? '<span class="today-sub">' + escapeHtml(sub) + '</span>' : '') +
          '<span class="today-why">' + escapeHtml(it.why) + (it.until ? '. Back ' + escapeHtml(it.until.slice(0, 10)) : '') + '</span>' +
          (activeTodayTab === 'done' ? '' : '<span class="today-age">' + escapeHtml(todayAgeText(it)) + '</span>') +
          (activeTodayTab === 'done' ? '</div>' : '</button>');
        if (activeTodayTab === 'today') {
          html += '<div class="today-actions"><button type="button" data-today-done="' + key + '">Done</button>' +
            '<button type="button" class="ghost" data-today-snooze="' + key + '">Snooze</button></div>';
        } else if (activeTodayTab === 'snoozed') {
          html += '<div class="today-actions"><button type="button" class="ghost" data-today-back="' + key + '">Back to Today</button></div>';
        }
        html += '</li>';
      });
      html += '</ul>';
    }
    html += '</div>';
    root.innerHTML = html;
    function find(key) {
      var all = split.today.concat(split.snoozed);
      for (var i = 0; i < all.length; i++) if (all[i].key === key) return all[i];
      return null;
    }
    root.querySelectorAll('[data-today-tab]').forEach(function (b) {
      b.addEventListener('click', function () { activeTodayTab = b.getAttribute('data-today-tab'); renderToday(); });
    });
    root.querySelectorAll('[data-today-open]').forEach(function (b) {
      b.addEventListener('click', function () { var it = find(b.getAttribute('data-today-open')); if (it) todayOpenItem(it); });
    });
    root.querySelectorAll('[data-today-done]').forEach(function (b) {
      b.addEventListener('click', function () { var it = find(b.getAttribute('data-today-done')); if (it) todayMarkDone(it); });
    });
    root.querySelectorAll('[data-today-snooze]').forEach(function (b) {
      b.addEventListener('click', function () { var it = find(b.getAttribute('data-today-snooze')); if (it) openTodaySnoozeModal(it); });
    });
    root.querySelectorAll('[data-today-back]').forEach(function (b) {
      b.addEventListener('click', function () { var it = find(b.getAttribute('data-today-back')); if (it) todayUnsnooze(it); });
    });
  }

  function todayOpenItem(it) {
    if (it.kind === 'lead') { openDetail(it.id); return; }
    if (it.dealId && getDeal(it.dealId)) { openDetail(it.dealId); return; }
    setActiveTasks();
  }

  function todayFinishDone(it) {
    var email = currentUserEmail();
    StuffMigrate.clearTodaySnooze(state, email, it.key);
    StuffMigrate.markTodayDone(state, email, it, todayStr());
    logChange('done', 'today', it.key, it.typeLabel + ': ' + it.title);
    save();
    renderApp();
  }

  // Tasks complete. Lead items ask for a new next step date first (Cancel changes nothing).
  function todayMarkDone(it) {
    if (it.kind === 'task') {
      var ref = resolveTaskRef(it.id);
      if (!ref) return;
      markTaskCompleted(ref, { source: 'today' });
      todayFinishDone(it);
      return;
    }
    var deal = getDeal(it.id);
    if (!deal) return;
    openNextStepModal(deal, deal.stage, function (date, text) {
      var t = nowIso();
      deal.nextFollowUp = date;
      if (text) StuffMigrate.setRecordSection(state, deal, 'lead', 'openItems', { nextStep: text }, sectionActor());
      deal.updatedAt = t;
      deal.lastActivityAt = t;
      logChange('update', 'lead', deal.id, 'Next step date ' + date + ' (from Today)');
      todayFinishDone(it);
    }, { note: 'Done for now. When is the next step?', button: 'Done', min: addDaysYmd(todayStr(), 1) });
  }

  function openTodaySnoozeModal(it) {
    var html = '<div class="modal-title-row"><h2>Snooze</h2></div><p class="muted-note">' + escapeHtml(it.title) + '</p>' +
      '<div class="today-snooze-opts">' +
      '<button type="button" data-snooze="1d">1 day</button><button type="button" data-snooze="3d">3 days</button><button type="button" data-snooze="monday">Next Monday</button></div>' +
      '<form id="today-snooze-form"><div class="field"><label for="ts-date">Pick a date</label><input type="date" id="ts-date" required min="' + addDaysYmd(todayStr(), 1) + '" /></div>' +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button><button type="submit">Snooze</button></div></form>';
    var m = openJobModal(html, 'sm');
    function apply(choice, custom) {
      var until = StuffMigrate.snoozeUntilFor(choice, todayStr(), custom);
      if (!until) { alert('Pick a date after today.'); return; }
      StuffMigrate.setTodaySnooze(state, currentUserEmail(), it.key, until, todayStr(), nowIso());
      logChange('snooze', 'today', it.key, 'Snoozed until ' + until + ': ' + it.title);
      closeJobModal();
      save();
      renderApp();
    }
    m.querySelectorAll('[data-snooze]').forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-snooze')); });
    });
    m.querySelector('#today-snooze-form').addEventListener('submit', function (e) {
      e.preventDefault();
      apply('date', m.querySelector('#ts-date').value);
    });
  }

  function todayUnsnooze(it) {
    if (!StuffMigrate.clearTodaySnooze(state, currentUserEmail(), it.key)) return;
    logChange('unsnooze', 'today', it.key, 'Back to Today: ' + it.title);
    save();
    renderApp();
  }

  function renderTasksSectionHtml(groupId) {
    var group = TASK_GROUPS.find(function (g) { return g.id === groupId; });
    if (!group) return '<p class="task-empty">Unknown section.</p>';
    var html = '';
    html += '<div class="tasks-bucket-chips" role="tablist" aria-label="Buckets in ' + escapeHtml(group.label) + '">';
    html += '<button type="button" class="chip' + (activeTasksBucketFilter === 'all' ? ' active' : '') +
      '" data-bucket-filter="all">All in section</button>';
    group.buckets.forEach(function (b) {
      var n = bucketOpenCount(b.id);
      html += '<button type="button" class="chip' + (activeTasksBucketFilter === b.id ? ' active' : '') +
        '" data-bucket-filter="' + escapeHtml(b.id) + '">' + escapeHtml(b.label) +
        ' <span class="chip-n">' + n + '</span></button>';
    });
    html += '</div>';


    var bucketForAdd = activeTasksBucketFilter !== 'all' && findTaskBucket(activeTasksBucketFilter)
      ? activeTasksBucketFilter
      : (group.buckets[0] ? group.buckets[0].id : activeTaskBucket);
    html += '<div class="task-add" id="task-add-form">' +
      '<div class="field title-field"><label for="task-title">New task</label>' +
      '<input type="text" id="task-title" placeholder="Task title" /></div>' +
      '<div class="field"><label for="task-due">Due date</label>' +
      '<input type="date" id="task-due" /></div>' +
      '<div class="field"><label for="task-bucket">Bucket</label><select id="task-bucket">';
    group.buckets.forEach(function (bucket) {
      html += '<option value="' + escapeHtml(bucket.id) + '"' +
        (bucket.id === bucketForAdd ? ' selected' : '') + '>' +
        escapeHtml(bucket.label) + '</option>';
    });
    html += '</select></div>' +
      '<div class="field deal-field"><label for="task-deal">Deal / project (optional)</label>' +
      '<select id="task-deal">' + dealPickerOptions(null) + '</select></div>' +
      '<button type="button" id="btn-add-task">Add task</button></div>';

    html += '<div class="task-filters">' +
      '<button type="button" class="chip' + (taskFilter === 'open' ? ' active' : '') +
      '" data-filter="open">Open</button>' +
      '<button type="button" class="chip' + (taskFilter === 'done' ? ' active' : '') +
      '" data-filter="done">Done</button>' +
      '<button type="button" class="chip' + (taskFilter === 'all' ? ' active' : '') +
      '" data-filter="all">All</button></div>';

    var openTasks = [];
    var doneTasks = [];
    group.buckets.forEach(function (bucket) {
      if (activeTasksBucketFilter !== 'all' && bucket.id !== activeTasksBucketFilter) return;
      autoTasksForBucket(bucket.id).forEach(function (t) { openTasks.push(t); });
      manualTasksForBucket(bucket.id, false).forEach(function (t) {
        if (t.done) doneTasks.push(t);
        else openTasks.push(t);
      });
    });
    openTasks.sort(function (a, b) {
      return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
    });
    doneTasks.sort(function (a, b) {
      return (b.completedAt || '').localeCompare(a.completedAt || '');
    });

    var showOpen = taskFilter === 'open' || taskFilter === 'all';
    var showDone = taskFilter === 'done' || taskFilter === 'all';
    html += '<div class="tasks-split">';
    html += '<aside class="tasks-split-eisenhower">' + renderEisenhowerHtml(openTasks) + '</aside>';
    html += '<div class="tasks-split-list">';
    if (showOpen) {
      html += '<div class="task-block"><h4>Open in ' + escapeHtml(group.label) + '</h4>';
      html += renderTaskListHtml(openTasks, {
        empty: 'No open tasks in this view. Auto rows appear when CRM or board conditions match.',
        draggable: true
      });
      html += '</div>';
    }
    if (showDone) {
      html += '<div class="task-block"><h4>Done</h4>';
      html += renderTaskListHtml(doneTasks, { empty: 'No completed tasks yet.', draggable: false });
      html += '</div>';
    }
    html += '</div></div>';
    return html;
  }

  function renderTaskListHtml(tasks, opts) {
    opts = opts || {};
    if (!tasks || !tasks.length) {
      return '<div class="task-list"><div class="task-empty">' + escapeHtml(opts.empty || 'No tasks.') + '</div></div>';
    }
    var html = '<ul class="task-list">';
    tasks.forEach(function (t) {
      html += taskItemHtml(t, !!t.virtual, { draggable: !!opts.draggable && !t.done });
    });
    html += '</ul>';
    return html;
  }

  function renderEisenhowerHtml(openTasks) {
    var byQ = { do: [], decide: [], delegate: [], delete: [] };
    (openTasks || []).forEach(function (t) {
      if (t.quadrant && byQ[t.quadrant]) byQ[t.quadrant].push(t);
    });
    var html = '<div class="eisenhower-wrap">' +
      '<div class="eisenhower-head"><h3>Eisenhower board</h3><button type="button" class="ghost" id="btn-edit-delegatees">Edit delegates</button></div>' +
      '<p class="eisenhower-hint">Drag any open task onto a quadrant, or onto Completed below. Do parks it on Home as personal and urgent. Decide sets a defer date. Delegate assigns a teammate. Delete dismisses without counting as done. Completed marks it done and logs it.</p>' +
      '<div class="eisenhower-grid">';
    var panels = [
      { id: 'do', title: 'Do', sub: 'Personal + urgent (Home)' },
      { id: 'decide', title: 'Decide', sub: 'Defer with a due date' },
      { id: 'delegate', title: 'Delegate', sub: 'Hand off to a teammate' },
      { id: 'delete', title: 'Delete', sub: 'Dismiss (not counted as done)' }
    ];
    panels.forEach(function (p) {
      html += '<div class="eq-panel ' + p.id + '" data-quadrant="' + p.id + '">' +
        '<h4>' + p.title + '</h4>' +
        '<p class="eq-sub">' + escapeHtml(p.sub) + '</p>';
      if (!byQ[p.id].length) {
        html += '<div class="eq-empty">Drop tasks here</div>';
      } else {
        html += '<ul class="eq-list">';
        byQ[p.id].forEach(function (t) {
          html += '<li draggable="true" data-task-id="' + escapeHtml(t.id) + '">' +
            escapeHtml(t.title) + taskMoveSelectHtml(t.id, p.id) +
            (t.dueDate ? '<span class="eq-meta">Due ' + escapeHtml(t.dueDate) + '</span>' : '') +
            (t.delegatedTo ? '<span class="eq-meta">→ ' + escapeHtml(t.delegatedTo) + '</span>' : '') +
            '</li>';
        });
        html += '</ul>';
      }
      html += '</div>';
    });
    html += '</div>'; // grid

    var todayDone = completedEntriesToday();
    var shown = showAllCompleted ? todayDone : todayDone.slice(0, 5);
    html += '<div class="eq-panel completed" data-quadrant="completed">' +
      '<h4>Completed</h4>' +
      '<p class="eq-sub">Drop here to mark done · ' + todayDone.length + ' today</p>';
    if (!shown.length) {
      html += '<div class="eq-empty">No completions today yet</div>';
    } else {
      html += '<ul class="eq-list completed-list">';
      shown.forEach(function (e) {
        var when = '';
        try {
          when = new Date(e.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        } catch (err) { when = (e.completedAt || '').slice(11, 16); }
        html += '<li class="eq-completed-item">' +
          '<span class="eq-completed-title">' + escapeHtml(e.title || '') + '</span>' +
          '<span class="eq-meta">' + escapeHtml(e.completedBy || 'local') +
          (when ? ' · ' + escapeHtml(when) : '') + '</span></li>';
      });
      html += '</ul>';
    }
    if (todayDone.length > 5) {
      html += '<button type="button" class="ghost eq-show-all" data-toggle-completed-all="1">' +
        (showAllCompleted ? 'Show less' : 'Show all (' + todayDone.length + ')') + '</button>';
    }
    html += '</div></div>'; // completed panel + wrap
    return html;
  }

  function taskItemHtml(t, isVirtual, opts) {
    opts = opts || {};
    var deal = t.dealId ? (getDeal(t.dealId) || getSku(t.dealId) || null) : null;
    var ent = deal ? entityLabel(deal) : 'Deal';
    var entLower = deal ? entityLabelLower(deal) : 'deal';
    var metaParts = [];
    if (t.dueDate) {
      var od = isOverdue(t.dueDate) && !t.done;
      metaParts.push(od
        ? '<span class="overdue">Due ' + escapeHtml(t.dueDate) + ' (overdue)</span>'
        : 'Due ' + escapeHtml(t.dueDate));
    }
    if (t.delegatedTo) {
      metaParts.push('Delegated to ' + escapeHtml(t.delegatedTo));
    } else if (t.assigneeTeam || t.executedBy) {
      metaParts.push('<span class="quoting-bots">' + escapeHtml(t.assigneeTeam || t.executedBy) + '</span>');
    }
    if (t.personal) metaParts.push('Personal');
    if (t.urgent) metaParts.push('Urgent');
    if (deal) {
      metaParts.push('<span class="badge badge-entity">' + escapeHtml(ent) + '</span><a data-open-deal="' + escapeHtml(deal.id) + '">' + escapeHtml(cardTitle(deal)) + '</a>' +
        (isProjectCard(deal) ? ' <span class="muted-note">' + escapeHtml(customerNameFor(deal)) + '</span>' : ''));
    } else if (t.dealId) {
      metaParts.push(ent + ' missing');
    }
    if (t.completedAt) {
      try {
        metaParts.push('Completed ' + new Date(t.completedAt).toLocaleString());
      } catch (e) { /* ignore */ }
    }
    var check = isVirtual
      ? ''
      : '<input type="checkbox" class="task-check" data-task-id="' + escapeHtml(t.id) + '"' +
        (t.done ? ' checked' : '') + ' />';
    var actions = '';
    if (isVirtual && t.poId) {
      actions = '<div class="task-actions"><button type="button" class="icon-btn" data-open-po-task="' + escapeHtml(t.poId) + '">Open PO</button></div>';
    } else if (isVirtual) {
      actions = '<div class="task-actions">' +
        '<button type="button" class="icon-btn" data-open-deal="' + escapeHtml(t.dealId) + '">Open ' +
        escapeHtml(entLower) + '</button></div>';
    } else {
      actions = '<div class="task-actions">' +
        (deal ? '<button type="button" class="icon-btn" data-open-deal="' + escapeHtml(deal.id) + '">' +
          escapeHtml(ent) + '</button>' : '') +
        '<button type="button" class="icon-btn danger" data-delete-task="' + escapeHtml(t.id) + '">Delete</button>' +
        '</div>';
    }
    var badge = '';
    if (isVirtual) {
      badge = '<span class="virtual-badge">' + escapeHtml(t.autoKind || 'auto') + '</span>';
    }
    var todayBtn = t.done ? '' : '<button type="button" class="today-btn' + (t.today ? ' on' : '') + '" data-today-task="' + escapeHtml(t.id) +
      '" title="' + (t.today ? 'Remove from Today' : 'Pin to Today') + '">' + (t.today ? 'Today \u2713' : 'Today') + '</button>';
    var drag = (opts.draggable && !t.done)
      ? ' draggable="true" data-task-id="' + escapeHtml(t.id) + '"'
      : '';
    if (opts.draggable && !t.done) actions = actions.replace('<div class="task-actions">', '<div class="task-actions">' + taskMoveSelectHtml(t.id));
    return '<li class="' + (t.done ? 'done-item' : '') + (t.today ? ' today-item' : '') + '" data-task="' + escapeHtml(t.id) + '"' + drag + '>' +
      check + todayBtn +
      '<div class="task-body">' +
      '<div class="task-title">' + escapeHtml(t.title) + badge + '</div>' +
      (metaParts.length ? '<div class="task-meta">' + metaParts.join(' · ') + '</div>' : '') +
      '</div>' + actions + '</li>';
  }

  function bindTaskEvents() {
    document.querySelectorAll('#tasks-root [data-tasks-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setActiveTasksTab(btn.getAttribute('data-tasks-tab'));
      });
    });
    document.querySelectorAll('#tasks-root [data-bucket-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setActiveTasksBucketFilter(btn.getAttribute('data-bucket-filter'));
      });
    });
    var editDeleg = document.getElementById('btn-edit-delegatees');
    if (editDeleg) editDeleg.addEventListener('click', editDelegatees);

    var addBtn = document.getElementById('btn-add-task');
    if (addBtn) addBtn.addEventListener('click', addManualTask);
    var titleInput = document.getElementById('task-title');
    if (titleInput) {
      titleInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          addManualTask();
        }
      });
    }
    document.querySelectorAll('#tasks-root .task-filters .chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        taskFilter = btn.getAttribute('data-filter') || 'open';
        renderTasks();
      });
    });
    document.querySelectorAll('#tasks-root input.task-check').forEach(function (cb) {
      cb.addEventListener('change', function () {
        toggleTaskDone(cb.getAttribute('data-task-id'), cb.checked);
      });
    });
    document.querySelectorAll('#tasks-root [data-today-task]').forEach(function (btn) {
      btn.addEventListener('click', function () { toggleTodayFlag(btn.getAttribute('data-today-task')); });
    });
    document.querySelectorAll('#tasks-root [data-delete-task]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        deleteManualTask(btn.getAttribute('data-delete-task'));
      });
    });
    document.querySelectorAll('#tasks-root [data-open-po-task]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        if (getCustomerPo(el.getAttribute('data-open-po-task'))) openPoModal({ poId: el.getAttribute('data-open-po-task') });
      });
    });
    document.querySelectorAll('#tasks-root [data-open-deal]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var id = el.getAttribute('data-open-deal');
        if (id) openDetail(id);
      });
    });

    document.querySelectorAll('#tasks-root [draggable="true"][data-task-id]').forEach(function (el) {
      el.addEventListener('dragstart', function (e) {
        dragTaskId = el.getAttribute('data-task-id');
        el.classList.add('dragging');
        try {
          e.dataTransfer.setData('text/plain', dragTaskId);
          e.dataTransfer.effectAllowed = 'move';
        } catch (err) { /* ignore */ }
      });
      el.addEventListener('dragend', function () {
        el.classList.remove('dragging');
        dragTaskId = null;
        document.querySelectorAll('#tasks-root .eq-panel.drag-over').forEach(function (p) {
          p.classList.remove('drag-over');
        });
      });
    });
    document.querySelectorAll('#tasks-root .eq-panel[data-quadrant]').forEach(function (panel) {
      panel.addEventListener('dragenter', function (e) {
        e.preventDefault();
        panel.classList.add('drag-over');
      });
      panel.addEventListener('dragover', function (e) {
        e.preventDefault();
        try { e.dataTransfer.dropEffect = 'move'; } catch (err) { /* ignore */ }
        panel.classList.add('drag-over');
      });
      panel.addEventListener('dragleave', function (e) {
        if (panel.contains(e.relatedTarget)) return;
        panel.classList.remove('drag-over');
      });
      panel.addEventListener('drop', function (e) {
        e.preventDefault();
        panel.classList.remove('drag-over');
        var id = dragTaskId;
        try {
          if (!id && e.dataTransfer) id = e.dataTransfer.getData('text/plain');
        } catch (err) { /* ignore */ }
        var q = panel.getAttribute('data-quadrant');
        if (id && q) handleQuadrantDrop(q, id, e.clientX, e.clientY);
        dragTaskId = null;
      });
    });
    // Non-drag alternative for phones and keyboards (issue #42).
    document.querySelectorAll('#tasks-root [data-task-move]').forEach(function (sel) {
      sel.addEventListener('click', function (e) { e.stopPropagation(); });
      sel.addEventListener('change', function () {
        var q = sel.value;
        if (!q) return;
        var r = sel.getBoundingClientRect();
        handleQuadrantDrop(q, sel.getAttribute('data-task-move'), r.left, r.bottom + 4);
      });
    });
    document.querySelectorAll('#tasks-root [data-toggle-completed-all]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showAllCompleted = !showAllCompleted;
        renderTasks();
      });
    });
  }

  function addManualTask() {
    var titleEl = document.getElementById('task-title');
    var dueEl = document.getElementById('task-due');
    var dealEl = document.getElementById('task-deal');
    var title = titleEl ? titleEl.value.trim() : '';
    if (!title) {
      alert('Task title is required.');
      return;
    }
    var bucketEl = document.getElementById('task-bucket');
    var bucket = bucketEl && findTaskBucket(bucketEl.value)
      ? bucketEl.value
      : (findTaskBucket(activeTaskBucket) ? activeTaskBucket : TASK_GROUPS[0].buckets[0].id);
    activeTaskBucket = bucket;
    var task = {
      id: 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
      title: title,
      dueDate: (dueEl && dueEl.value) ? dueEl.value : null,
      done: false,
      dealId: (dealEl && dealEl.value) ? dealEl.value : null,
      entityType: (dealEl && dealEl.value) ? (getSku(dealEl.value) ? 'sku' : isProjectCard(getDeal(dealEl.value)) ? 'project' : 'lead') : null,
      entityId: (dealEl && dealEl.value) ? dealEl.value : null,
      bucket: bucket,
      createdAt: nowIso(),
      completedAt: null,
      quadrant: null,
      personal: false,
      urgent: false,
      delegatedTo: null,
      decideOption: null,
      suppressed: false,
      dismissedAt: null
    };
    if (!state.tasks) state.tasks = [];
    state.tasks.push(task);
    save();
    taskFilter = 'open';
    renderApp();
  }

  function toggleTaskDone(id, done) {
    var ref = resolveTaskRef(id);
    if (!ref) return;
    if (done) markTaskCompleted(ref, { source: 'done-button' });
    else markTaskReopened(id, { source: 'done-button' });
    save();
    renderApp();
  }

  function deleteManualTask(id) {
    if (!id) return;
    var ref = resolveTaskRef(id);
    if (!ref) return;
    applyQuadrantDelete(ref);
  }

  function renderTabs() {
    // Pre-Production view tabs (Owner 2026-10-12): one menu item, its boards as tabs.
    var wrap = document.querySelector('#view-board .board-wrap');
    if (!wrap) return;
    var bar = document.getElementById('preprod-tabs');
    var cur = currentSection();
    var boards = preprodBoards();
    var on = cur && boards.some(function (s) { return s.id === cur.id; });
    if (!on) { if (bar) { bar.hidden = true; bar.innerHTML = ''; } return; }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'preprod-tabs';
      bar.className = 'preprod-tabs';
      bar.setAttribute('role', 'tablist');
      wrap.insertBefore(bar, wrap.firstChild);
    }
    bar.hidden = false;
    var tabs = preprodTabs();
    if (cur.id !== StuffMigrate.SKU_BOARD_ID) preprodStageFilter = null;
    bar.innerHTML = tabs.map(function (tb) {
      var on = tb.boardId === cur.id && (tb.stage || null) === (preprodStageFilter || null);
      return '<button type="button" role="tab" class="preprod-tab' + (on ? ' active' : '') + '" data-pp-tab="' + escapeHtml(tb.boardId) + '" data-pp-stage="' + escapeHtml(tb.stage || '') + '" aria-selected="' + (on ? 'true' : 'false') + '">' +
        escapeHtml(tb.label) + ' <span class="rail-count' + (tb.count ? '' : ' zero') + '">' + tb.count + '</span></button>';
    }).join('');
    bar.querySelectorAll('[data-pp-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-pp-tab');
        preprodStageFilter = b.getAttribute('data-pp-stage') || null;
        boardFilters[id] = {}; lastPreprodBoardId = id; lastPreprodStage = preprodStageFilter; setActiveBoard(id, preprodStageFilter);
      });
    });
  }

  var lastPreprodBoardId = null;
  var lastPreprodStage = null;
  // Design, Prototyping and Tooling tabs are filtered views of the All board by its stage (Owner 2026-10-12).
  var preprodStageFilter = null;
  var PREPROD_STAGE_TABS = [
    { label: 'Design', ids: ['sku-design-dfm'], re: /design/i },
    { label: 'Prototyping', ids: ['sku-prototyping'], re: /prototyp/i },
    { label: 'Tooling', ids: ['sku-tooling-molds'], re: /tooling|mold/i }
  ];
  function preprodTabs() {
    var boards = preprodBoards();
    var all = getSection(StuffMigrate.SKU_BOARD_ID);
    var out = [];
    var used = {};
    if (all) {
      out.push({ boardId: all.id, stage: null, label: 'All', count: preprodBoardCount(all) });
      var st = all.stages || [];
      PREPROD_STAGE_TABS.forEach(function (d) {
        var stage = st.filter(function (s) { return d.ids.indexOf(s) !== -1; })[0] || st.filter(function (s) { return d.re.test(stageLabel(s)); })[0];
        if (!stage) return;
        used[d.label] = true;
        out.push({ boardId: all.id, stage: stage, label: d.label, count: liveSkus().filter(function (s) { return s.stage === stage; }).length });
      });
    }
    boards.forEach(function (s) {
      if (all && s.id === all.id) return;
      var n = preprodBoardCount(s);
      // Old Design / Prototyping / Tooling boards hide while empty; their tab is the stage view now.
      if (used[s.label] && !n) return;
      out.push({ boardId: s.id, stage: null, label: used[s.label] ? s.label + ' (old board)' : s.label, count: n });
    });
    return out;
  }
  // Pre-Production page boards: the All board first, then Design, Prototyping, Tooling, Sourcing.
  function preprodBoards() {
    var list = sectionList().filter(function (s) {
      return !isSeparator(s) && ((s.railArea || '') === 'pre-production' || (!s.railArea && areaRoleFor(s.area) === 'pre-production'));
    });
    var all = list.filter(function (s) { return s.id === StuffMigrate.SKU_BOARD_ID; });
    return all.concat(list.filter(function (s) { return s.id !== StuffMigrate.SKU_BOARD_ID; }));
  }
  function preprodBoardCount(sec) {
    var stages = sec.stages || [];
    var n = 0;
    if (isCrmBoard(sec)) n += (state.deals || []).filter(function (d) { return stages.indexOf(d.stage) !== -1 && d.status !== 'archived'; }).length;
    else n += liveSkus().filter(function (s) { return stages.indexOf(s.stage) !== -1; }).length;
    return n;
  }
  function preprodCardCount() {
    return preprodBoards().reduce(function (n, s) { return n + preprodBoardCount(s); }, 0);
  }
  function setActivePreprod() {
    var boards = preprodBoards();
    if (!boards.length) return;
    var id = lastPreprodBoardId && boards.some(function (s) { return s.id === lastPreprodBoardId; }) ? lastPreprodBoardId : boards[0].id;
    boardFilters[id] = {};
    setActiveBoard(id, id === lastPreprodBoardId ? lastPreprodStage : null);
  }


  // Customer Success (Owner 2026-10-15): paying-customer projects (deal.cs), written by the CS bot via the
  // write API (csSet, milestonesUpsert, touchesAdd). Six views: board by stage and five watch lists.
  var csNav = { tab: 'board', openId: null };
  var CS_TABS = [
    { id: 'board', label: 'CS board' }, { id: 'slippedToday', label: 'Slipped Today' },
    { id: 'customerSilent5', label: 'Customer Silent 5+d' }, { id: 'noUpdate7', label: 'No Update 7+d' },
    { id: 'missingOwnerDue', label: 'Missing Owner/Due' }, { id: 'paymentPending', label: 'Payment Pending' }
  ];
  function csToday() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  // Needs Reply (#54): deals where the customer wrote last and we have not answered (deal.email.replyWaiting).
  function setActiveNeedsReply() {
    autoCloseNavOnPhone();
    activeView = 'needs-reply';
    activeArea = 'needs-reply';
    activeDetailId = null;
    persistActiveNav();
    renderApp();
  }
  function renderNeedsReply() {
    var root = document.getElementById('needs-reply-root');
    if (!root) return;
    var rows = StuffMigrate.needsReplyList(state);
    var html = '<div class="page-head"><h2>Needs Reply</h2></div>' +
      '<p class="muted-note">The customer wrote last and nobody has answered for more than 4 business hours (Mon to Fri, 8am to 5pm Pacific). Oldest first. Filled in from Gmail by the sync.</p>';
    if (!rows.length) html += '<p class="muted-note">Nothing is waiting for a reply.</p>';
    else {
      html += '<div class="table-wrap"><table class="customers-table"><thead><tr><th>Lead</th><th>Stage</th><th>Owner</th><th>Waiting</th><th>Email</th></tr></thead><tbody>';
      rows.forEach(function (r) {
        var d = r.deal;
        html += '<tr data-lead-id="' + escapeHtml(d.id) + '"><td class="customer-name-cell">' + escapeHtml(csDealName(d)) + '</td>' +
          '<td>' + escapeHtml(stageLabel(d.stage)) + '</td>' +
          '<td>' + escapeHtml(d.owner || d.ownerName || d.assignee || 'No owner') + '</td>' +
          '<td>' + r.days + ' day' + (r.days === 1 ? '' : 's') + '</td>' +
          '<td>' + (d.email.lastThreadUrl ? '<a href="' + escapeHtml(d.email.lastThreadUrl) + '" target="_blank" rel="noopener" class="tl-gmail">Open in Gmail</a>' : '') + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    root.innerHTML = html;
    root.querySelectorAll('tr[data-lead-id]').forEach(function (tr) {
      tr.addEventListener('click', function (e) { if (e.target.closest('a')) return; openDetail(tr.getAttribute('data-lead-id')); });
    });
  }

  function setActiveCs() {
    autoCloseNavOnPhone();
    activeView = 'cs';
    activeArea = 'cs';
    activeDetailId = null;
    persistActiveNav();
    renderApp();
  }
  function csDealName(d) {
    var c = d.customerId ? getCustomer(d.customerId) : null;
    return (c ? c.name : (d.company || '')) || d.title || d.id;
  }
  function csCardHtml(d, reason) {
    var cs = d.cs || {}, ms = (cs.milestones || []).filter(function (m) { return m.status !== 'done'; });
    var bad = ms.some(function (m) { return m.status === 'slipped'; }) ? 'slipped' : ms.some(function (m) { return m.status === 'at risk'; }) ? 'at-risk' : '';
    var h = '<div class="cs-card ' + bad + '" data-cs-id="' + escapeHtml(d.id) + '" tabindex="0">' +
      '<div class="cs-card-title">' + escapeHtml(csDealName(d)) + '</div>' +
      '<div class="muted-note">' + escapeHtml(d.title || '') + '</div>' +
      (reason ? '<div class="cs-reason">' + escapeHtml(reason) + '</div>' : '') +
      (cs.nextMilestone ? '<div class="cs-next">Next: ' + escapeHtml(cs.nextMilestone) + (cs.nextDueDate ? ' (' + escapeHtml(cs.nextDueDate.slice(0, 10)) + ')' : '') + '</div>' : '') +
      '<div class="muted-note">' + ms.length + ' open milestone' + (ms.length === 1 ? '' : 's') + (cs.customerHardDeadline ? ' / deadline ' + escapeHtml(cs.customerHardDeadline.slice(0, 10)) : '') + '</div>';
    if (csNav.openId === d.id) {
      h += '<div class="cs-more">';
      var k = cs.kickoff || {};
      h += '<div class="muted-note">Kickoff: ' + StuffMigrate.CS_KICKOFF_KEYS.map(function (x) { return (k[x] ? '✓ ' : '○ ') + x; }).join(', ') + '</div>';
      if (cs.bankInvoiceId || cs.paidDate) h += '<div class="muted-note">Invoice ' + escapeHtml(cs.bankInvoiceId || 'none') + (cs.paidDate ? ', paid ' + escapeHtml(cs.paidDate.slice(0, 10)) : '') + '</div>';
      h += '<table class="cs-ms"><tr><th>Milestone</th><th>Owner</th><th>Due</th><th>Status</th></tr>' + (cs.milestones || []).map(function (m) {
        return '<tr class="' + escapeHtml(String(m.status || '').replace(' ', '-')) + '"><td>' + escapeHtml(m.name || '') + (m.blocker ? '<div class="muted-note">Blocker: ' + escapeHtml(m.blocker) + (m.blockerOwner ? ' (' + escapeHtml(m.blockerOwner) + ')' : '') + '</div>' : '') +
          '</td><td>' + escapeHtml(m.owner || '?') + '</td><td>' + escapeHtml(m.dueDate ? m.dueDate.slice(0, 10) : '?') + '</td><td>' + escapeHtml(m.status || '') + '</td></tr>';
      }).join('') + '</table>';
      var t = (cs.touches || []).slice(-3).reverse();
      if (t.length) h += '<div class="muted-note">Touches: ' + t.map(function (x) { var txt = escapeHtml(x.date.slice(0, 10) + ' ' + x.channel + ': ' + x.summary); return x.direction === 'internal' ? '<span class="cs-touch-internal">' + txt + ' <span class="note-badge">Internal</span></span>' : txt; }).join('<br>') + '</div>';
      h += '<button type="button" class="ghost" data-cs-open>Open lead</button></div>';
    }
    return h + '</div>';
  }
  function renderCs() {
    var root = document.getElementById('cs-root');
    if (!root) return;
    var v = StuffMigrate.csViews(state, csToday());
    var html = '<div class="page-head"><h2>Customer Success</h2></div><div class="cs-tabs" role="tablist">' + CS_TABS.map(function (t) {
      var n = t.id === 'board' ? v.count : v[t.id].length;
      return '<button type="button" role="tab" class="cs-tab' + (csNav.tab === t.id ? ' active' : '') + '" data-cs-tab="' + t.id + '">' + escapeHtml(t.label) + ' <span class="rail-count' + (n ? '' : ' zero') + '">' + n + '</span></button>';
    }).join('') + '</div>';
    if (!v.count) html += '<p class="muted-note">No Customer Success projects yet. The CS bot adds them through the write API.</p>';
    else if (csNav.tab === 'board') {
      html += '<div class="cs-board">' + v.board.filter(function (col) { return col.deals.length; }).map(function (col) {
        return '<div class="cs-col"><div class="cs-col-head">' + escapeHtml(col.stage) + ' <span class="rail-count">' + col.deals.length + '</span></div>' + col.deals.map(function (d) { return csCardHtml(d); }).join('') + '</div>';
      }).join('') + '</div>';
    } else {
      var rows = v[csNav.tab];
      html += rows.length ? '<div class="cs-list">' + rows.map(function (r) { return csCardHtml(r.deal, r.reason); }).join('') + '</div>' : '<p class="muted-note">Nothing here. Good.</p>';
    }
    root.innerHTML = html;
    root.querySelectorAll('[data-cs-tab]').forEach(function (b) {
      b.addEventListener('click', function () { csNav.tab = b.getAttribute('data-cs-tab'); renderCs(); });
    });
    root.querySelectorAll('.cs-card').forEach(function (c) {
      var id = c.getAttribute('data-cs-id');
      c.addEventListener('click', function (e) {
        if (e.target.closest('[data-cs-open]')) { openDetail(id); return; }
        csNav.openId = csNav.openId === id ? null : id; renderCs();
      });
    });
  }

  // We owe a reply (issue #130): open leads where we own the next reply, oldest first.
  function setActiveReply() {
    autoCloseNavOnPhone();
    activeView = 'reply';
    activeArea = 'reply';
    activeDetailId = null;
    persistActiveNav();
    renderApp();
  }
  function renderReply() {
    var root = document.getElementById('reply-root');
    if (!root) return;
    var rows = StuffMigrate.weOweReplyRows(state, Date.now());
    var html = '<div class="page-head"><h2>We owe a reply</h2></div>' +
      '<p class="muted-note">' + rows.length + ' open lead' + (rows.length === 1 ? '' : 's') + ' waiting on us, oldest first. Set who owes the next reply on the lead page.</p>';
    if (!rows.length) html += '<p class="muted-note">Nothing here. Good.</p>';
    else {
      html += '<div class="cs-list">' + rows.map(function (r) {
        var d = r.deal;
        return '<div class="cs-card reply-row-card" data-reply-id="' + escapeHtml(d.id) + '"><div class="cs-card-title">' + escapeHtml(cardTitle(d)) + ' ' + replyChipHtml(d) + '</div>' +
          '<div class="muted-note">' + escapeHtml(customerNameFor(d)) + ' / ' + escapeHtml(stageLabel(d.stage)) + (d.waitingSince ? ' / waiting since ' + escapeHtml(String(d.waitingSince).slice(0, 10)) : '') + '</div></div>';
      }).join('') + '</div>';
    }
    root.innerHTML = html;
    root.querySelectorAll('[data-reply-id]').forEach(function (c) {
      c.addEventListener('click', function () { openDetail(c.getAttribute('data-reply-id')); });
    });
  }

  // Archived folder (Owner 2026-10-12): every archived record stays in storage, with Restore.
  var archivedNav = { search: '' };
  function setActiveArchived() {
    autoCloseNavOnPhone();
    activeView = 'archived';
    activeArea = 'archived';
    activeDetailId = null;
    persistActiveNav();
    renderApp();
  }
  function renderArchived() {
    var root = document.getElementById('archived-root');
    if (!root) return;
    var all = StuffMigrate.archivedItems(state);
    var q = archivedNav.search.trim().toLowerCase();
    var kindLabel = { sku: 'SKU', lead: 'Lead', project: 'Old project' };
    var rows = all.filter(function (x) {
      if (!q) return true;
      var c = x.customerId ? getCustomer(x.customerId) : null;
      return (x.title + ' ' + (c ? c.name : '') + ' ' + kindLabel[x.kind]).toLowerCase().indexOf(q) !== -1;
    });
    var html = '<div class="page-head"><h2>Archived</h2></div>' +
      '<p class="muted-note">Archived items are off the boards but never deleted. Restore puts one back where it was.</p>' +
      '<div class="archived-search"><input type="search" id="archived-q" placeholder="Search archived" aria-label="Search archived" value="' + escapeHtml(archivedNav.search) + '"></div>';
    if (!rows.length) html += '<p class="muted-note">' + (all.length ? 'Nothing matches.' : 'Nothing is archived.') + '</p>';
    else {
      html += '<div class="archived-list">' + rows.map(function (x) {
        var c = x.customerId ? getCustomer(x.customerId) : null;
        return '<div class="archived-row" data-arc-kind="' + x.kind + '" data-arc-id="' + escapeHtml(x.id) + '">' +
          '<div class="archived-main"><div class="archived-title">' + escapeHtml(x.title) + '</div>' +
          '<div class="muted-note">' + escapeHtml(kindLabel[x.kind]) + (c ? ' / ' + escapeHtml(c.name) : '') + (x.archivedAt ? ' / archived ' + escapeHtml(new Date(x.archivedAt).toLocaleDateString()) : '') +
          (x.kind === 'project' ? ' / moved to SKU jobs' : '') + '</div></div>' +
          '<div class="archived-actions"><button type="button" class="ghost" data-arc-open>Open</button>' +
          (x.restorable ? '<button type="button" class="primary" data-arc-restore>Restore</button>' : '') + '</div></div>';
      }).join('') + '</div>';
    }
    root.innerHTML = html;
    var qi = root.querySelector('#archived-q');
    qi.addEventListener('input', function () {
      archivedNav.search = qi.value;
      var pos = qi.selectionStart;
      renderArchived();
      var n = document.getElementById('archived-q'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* ignore */ } }
    });
    root.querySelectorAll('.archived-row').forEach(function (row) {
      var kind = row.getAttribute('data-arc-kind'), id = row.getAttribute('data-arc-id');
      var open = row.querySelector('[data-arc-open]');
      if (open) open.addEventListener('click', function () {
        if (kind === 'sku') { activeSkuId = id; skuDraft = null; openDetail(id); }
        else openDetail(id);
      });
      var rs = row.querySelector('[data-arc-restore]');
      if (rs) rs.addEventListener('click', function () {
        if (!StuffMigrate.restoreArchived(state, kind, id, nowIso())) return;
        if (kind === 'sku') addSkuEvent(id, 'restored', 'Restored from Archived');
        logChange('restore', kind, id, 'Restored from Archived');
        save();
        showToast('Restored');
        renderApp();
      });
    });
  }

  function setActiveSection(id) {
    setActiveBoard(id);
  }

  // Cards drawn on the active board, counted the same way renderBoard draws them.
  function activeBoardCardCount() {
    var stages = sectionStages(currentSection());
    return boardCards().filter(function (d) { return stages.indexOf(d.stage) !== -1; }).length +
      stages.reduce(function (n, st) { return n + jobCardsOnStage(st).length; }, 0);
  }

  function renderBoardNote() {
    const note = document.getElementById('board-note');
    // "Empty for now" hints show only while the board has no cards (#12).
    var emptyHint = (activeBoardId === 'inbound-leads' || activeBoardId === 'partner-leads') && activeBoardCardCount() > 0;
    if (emptyHint) {
      note.textContent = '';
      note.classList.remove('visible');
    } else if (activeBoardId === 'inbound-leads') {
      note.textContent = 'Inbound Leads: empty for now. Jotform submissions will land in Inbound (Jotform).';
      note.classList.add('visible');
    } else if (activeBoardId === 'partner-leads') {
      note.textContent = 'Partner Leads: empty for now. Stages: New, Active, Handed to Design.';
      note.classList.add('visible');
    } else if (activeBoardId === 'quotes') {
      note.textContent = 'Quotes: Needs Quotation through Invoicing (last stage).';
      note.classList.add('visible');
    } else if (activeBoardId === 'pp-raw-material-sampling') {
      note.textContent = 'Pre-Production stub board. One column for now. Stages will expand later.';
      note.classList.add('visible');
    } else if (activeBoardId === 'pp-freight') {
      note.textContent = 'Logistics (formerly Freight). One column for now. Stages will expand later.';
      note.classList.add('visible');
    } else if (activeBoardId === 'fo-scheduling') {
      note.textContent = 'Scheduling: Handoff to Operations. Jobs (work orders) will replace the Operations boards in a later phase.';
      note.classList.add('visible');
    } else if (
      activeBoardId === 'fo-raw-materials-production' ||
      activeBoardId === 'fo-processes' ||
      activeBoardId === 'fo-qc' ||
      activeBoardId === 'fo-packaging'
    ) {
      note.textContent = 'Operations stub board. One column for now. Stages will expand later.';
      note.classList.add('visible');
    } else if (activeBoardId === 'fo-ordering') {
      note.textContent = 'Shop Needs: vendor columns Amazon.com and PPE.com.';
      note.classList.add('visible');
    } else {
      note.textContent = '';
      note.classList.remove('visible');
    }
  }

  function flowArrowEl() {
    var el = document.createElement('div');
    el.className = 'board-flow-arrow';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<svg viewBox="0 0 24 24" focusable="false">' +
      '<path fill="currentColor" d="M8 4l10 8-10 8V4z"/></svg>';
    return el;
  }

  function stageIdExists(slug) {
    if (!slug) return true;
    if (state && state.stageLabels && state.stageLabels[slug]) return true;
    var secs = sectionList();
    for (var i = 0; i < secs.length; i++) {
      if ((secs[i].stages || []).indexOf(slug) !== -1) return true;
    }
    if (state && state.deals) {
      var cards = allCards();
      for (var j = 0; j < cards.length; j++) {
        if (cards[j].stage === slug) return true;
      }
    }
    if (STAGE_LABELS[slug]) return true;
    return false;
  }

  function slugifyStageLabel(label) {
    var base = String(label || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!base) base = 'stage';
    var slug = base;
    if (!stageIdExists(slug)) return slug;
    var n = 0;
    while (stageIdExists(slug)) {
      n += 1;
      var suffix = Math.random().toString(36).slice(2, 5);
      slug = base + '-' + suffix;
      if (n > 40) {
        slug = base + '-' + Date.now().toString(36).slice(-4);
        break;
      }
    }
    return slug;
  }

  function getMutableSection(id) {
    if (!state || !state.sections) return null;
    for (var i = 0; i < state.sections.length; i++) {
      if (state.sections[i].id === id) return state.sections[i];
    }
    return null;
  }

  function renameStage(stageId, newLabel) {
    var label = String(newLabel || '').trim();
    if (!label) return false;
    if (!state.stageLabels) state.stageLabels = Object.assign({}, STAGE_LABELS);
    state.stageLabels[stageId] = label;
    syncStagesFromState();
    save();
    return true;
  }

  function reorderStage(sectionId, stageId, dir) {
    var sec = getMutableSection(sectionId);
    if (!sec || !sec.stages) return false;
    var idx = sec.stages.indexOf(stageId);
    if (idx < 0) return false;
    var to = idx + (dir < 0 ? -1 : 1);
    if (to < 0 || to >= sec.stages.length) return false;
    var tmp = sec.stages[idx];
    sec.stages[idx] = sec.stages[to];
    sec.stages[to] = tmp;
    syncStagesFromState();
    save();
    return true;
  }

  function addStageToBoard(sectionId, label) {
    var sec = getMutableSection(sectionId);
    if (!sec) return null;
    var name = String(label || '').trim();
    if (!name) return null;
    if (!sec.stages) sec.stages = [];
    var slug = slugifyStageLabel(name);
    sec.stages.push(slug);
    if (!state.stageLabels) state.stageLabels = Object.assign({}, STAGE_LABELS);
    state.stageLabels[slug] = name;
    syncStagesFromState();
    save();
    return slug;
  }

  function dealsInStage(stageId) {
    return allCards().filter(function (d) { return d.stage === stageId; });
  }

  function removeStageFromBoard(sectionId, stageId) {
    var sec = getMutableSection(sectionId);
    if (!sec || !sec.stages) return false;
    if (sec.stages.length <= 1) {
      alert('Each board needs at least one stage. Add another stage before removing this one.');
      return false;
    }
    var idx = sec.stages.indexOf(stageId);
    if (idx < 0) return false;
    var inStage = dealsInStage(stageId);
    if (inStage.length) {
      var others = sec.stages.filter(function (s) { return s !== stageId; });
      var choices = others.map(function (s, i) {
        return (i + 1) + ') ' + stageLabel(s);
      }).join('\n');
      var warn = stageId === 'lost'
        ? 'Lost has ' + inStage.length + ' deal(s). Move them before removing this stage.\n\n'
        : 'This stage has ' + inStage.length + ' deal(s). Move them before removing.\n\n';
      var pick = prompt(
        warn + 'Move deals to which stage? Enter a number:\n' + choices + '\n\nCancel to keep the stage.',
        '1'
      );
      if (pick == null) return false;
      var n = parseInt(pick, 10);
      if (!n || n < 1 || n > others.length) {
        alert('Invalid choice. Stage not removed.');
        return false;
      }
      var target = others[n - 1];
      inStage.forEach(function (d) {
        d.stage = target;
        var t = nowIso();
        d.updatedAt = t;
        d.lastActivityAt = t;
      });
    } else {
      if (!confirm('Remove stage "' + stageLabel(stageId) + '" from this board?')) return false;
    }
    sec.stages.splice(idx, 1);
    syncStagesFromState();
    save();
    return true;
  }

  function beginStageRename(nameEl, stageId) {
    if (!stagesEditMode) return;
    var current = stageLabel(stageId);
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'col-name-input';
    input.value = current;
    var parent = nameEl.parentNode;
    parent.replaceChild(input, nameEl);
    input.focus();
    input.select();
    var done = false;
    function finish(commit) {
      if (done) return;
      done = true;
      if (commit) renameStage(stageId, input.value);
      renderBoard();
    }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        finish(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finish(false);
      }
    });
    input.addEventListener('blur', function () { finish(true); });
  }

  function toggleStagesEditMode() {
    if (!stagesEditMode && !requireAdmin('edit stages')) return;
    stagesEditMode = !stagesEditMode;
    if (stagesEditMode && menuEditMode) {
      menuEditMode = false;
      var menuBtn = document.getElementById('btn-edit-menu');
      if (menuBtn) {
        menuBtn.classList.remove('active');
        menuBtn.textContent = 'Edit menu';
      }
      renderLeftRail();
    }
    var btn = document.getElementById('btn-edit-stages');
    if (btn) {
      btn.classList.toggle('active', stagesEditMode);
      btn.textContent = stagesEditMode ? 'Done editing' : 'Edit stages';
    }
    if (activeView === 'board') renderBoard();
  }

  // ---- Saved views and the table view on CRM boards (#53) ----
  var BOARD_PREFS_KEY = 'matrix-crm-v53-board-prefs';
  var boardFilters = {}; // boardId -> filter object. In memory: opening a board starts unfiltered.
  var boardColsOpen = false;

  function isCrmBoard(sec) {
    return !!sec && !isProductionBoard(sec) && areaRoleFor(sec.area) === 'crm';
  }

  function allBoardPrefs() {
    try { var p = JSON.parse(localStorage.getItem(BOARD_PREFS_KEY) || '{}'); return p && typeof p === 'object' ? p : {}; } catch (e) { return {}; }
  }
  function boardPref(boardId) { return allBoardPrefs()[boardId] || {}; }
  function setBoardPref(boardId, patch) {
    var all = allBoardPrefs();
    all[boardId] = Object.assign({}, all[boardId], patch);
    try { localStorage.setItem(BOARD_PREFS_KEY, JSON.stringify(all)); } catch (e) { /* storage full: choice is not remembered */ }
  }

  function boardViewMode(sec) {
    return isCrmBoard(sec) && !stagesEditMode && boardPref(sec.id).mode === 'table' ? 'table' : 'board';
  }

  function boardFilter(boardId) { return boardFilters[boardId] || {}; }

  function viewRowOpts() {
    return {
      today: todayStr(), nowMs: Date.now(), terminalStages: TERMINAL_STAGES, leadValue: leadDollars, stageLabel: stageLabel,
      sourceLabel: function (id) { return sourceLabel(normalizeSource(id)); }
    };
  }

  // One row per lead on the board, in board order, before any filter.
  function boardLeadRows(sec) {
    var stages = sectionStages(sec);
    var o = viewRowOpts();
    var cards = boardCards().filter(function (d) { return !isProjectCard(d) && d.type !== 'internal' && stages.indexOf(d.stage) !== -1; });
    cards.sort(function (a, b) { return stages.indexOf(a.stage) - stages.indexOf(b.stage); });
    return cards.map(function (d) { return StuffMigrate.leadViewRow(state, d, o); });
  }

  function sameViewFilter(a, b) {
    return JSON.stringify(StuffMigrate.normalizeViewFilter(a)) === JSON.stringify(StuffMigrate.normalizeViewFilter(b));
  }

  function openBoardView(boardId, filter) {
    boardFilters[boardId] = StuffMigrate.normalizeViewFilter(filter);
    setBoardPref(boardId, {});
    setActiveBoard(boardId);
  }

  function hideBoardViews() {
    var bar = document.getElementById('board-viewbar');
    var root = document.getElementById('board-table-root');
    if (bar) { bar.hidden = true; bar.innerHTML = ''; }
    if (root) { root.hidden = true; root.innerHTML = ''; }
  }

  function saveCurrentView(sec) {
    var filter = boardFilter(sec.id);
    if (StuffMigrate.viewFilterIsEmpty(filter)) { showToast('Set a filter first.'); return; }
    var name = prompt('Name this view:');
    if (name == null) return;
    var r = StuffMigrate.saveView(state, sec.id, name, filter, { by: currentUserEmail() || currentUserName() });
    if (r.error) { alert(r.error); return; }
    logChange(r.replaced ? 'update' : 'create', 'view', r.view.id, (r.replaced ? 'Updated' : 'Saved') + ' view "' + r.view.name + '" on ' + sec.label);
    save();
    renderApp();
  }

  function deleteSavedView(sec, view) {
    if (!confirm('Delete the view "' + view.name + '"? The leads stay as they are.')) return;
    if (!StuffMigrate.deleteView(state, view.id)) return;
    logChange('delete', 'view', view.id, 'Deleted view "' + view.name + '" from ' + sec.label);
    save();
    renderApp();
  }

  function viewColumns(rows) {
    var hidden = boardPref(activeBoardId).hidden || [];
    var anyOwner = rows.some(function (r) { return r.owner; });
    return StuffMigrate.VIEW_COLUMNS.filter(function (c) { return c[0] !== 'owner' || anyOwner; })
      .map(function (c) { return { key: c[0], label: c[1], shown: hidden.indexOf(c[0]) === -1 }; });
  }

  // Rows as shown: filtered, then sorted by the remembered column (board order when none).
  function boardTableRows(sec, allRows) {
    var rows = StuffMigrate.filterViewRows(allRows, boardFilter(sec.id), todayStr());
    var pref = boardPref(sec.id);
    if (pref.sortKey && StuffMigrate.VIEW_COLUMNS.some(function (c) { return c[0] === pref.sortKey; })) {
      rows = sortRowsByKey(rows, pref.sortKey, pref.sortDir === 'desc' ? 'desc' : 'asc');
    }
    return rows;
  }

  // Blank values last, numbers as numbers, text with locale compare.
  function sortRowsByKey(rows, key, dir) {
    var sign = dir === 'desc' ? -1 : 1;
    return rows.map(function (r, i) { return { r: r, i: i }; }).sort(function (a, b) {
      var x = a.r[key], y = b.r[key];
      var xb = x === null || x === undefined || x === '', yb = y === null || y === undefined || y === '';
      if (xb || yb) return xb === yb ? a.i - b.i : (xb ? 1 : -1);
      var c = (typeof x === 'number' && typeof y === 'number') ? x - y : String(x).localeCompare(String(y));
      return c ? c * sign : a.i - b.i;
    }).map(function (p) { return p.r; });
  }

  function exportBoardCsv(sec) {
    var allRows = boardLeadRows(sec);
    var cols = viewColumns(allRows).filter(function (c) { return c.shown; }).map(function (c) { return [c.key, c.label]; });
    var csv = StuffMigrate.viewRowsToCsv(boardTableRows(sec, allRows), cols);
    var name = String(sec.label || 'board').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'board';
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name + '-' + todayStr() + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  var bvFiltersOpen = false;
  // Stages whose column is filtered to the cards past their SLA (the "N over SLA" chip). Not saved.
  var slaOnlyStages = {};

  // Search, Filters button, view chips and Board / Table toggle above a CRM board.
  function renderBoardViewBar(sec, allRows) {
    var bar = document.getElementById('board-viewbar');
    if (!bar) return;
    var mode = boardViewMode(sec);
    var f = StuffMigrate.normalizeViewFilter(boardFilter(sec.id));
    var stages = sectionStages(sec);
    var sources = {};
    allRows.forEach(function (r) { if (r.source) sources[r.source] = r.sourceLabel || r.source; });
    if (f.source && !sources[f.source]) sources[f.source] = sourceLabel(f.source) || f.source;
    var opt = function (v, label, cur) { return '<option value="' + escapeHtml(v) + '"' + (String(cur == null ? '' : cur) === String(v) ? ' selected' : '') + '>' + escapeHtml(label) + '</option>'; };
    var hasPick = function (k) { return opt('', 'Any', f[k]) + opt('has', 'Has', f[k]) + opt('missing', 'Missing', f[k]); };
    var num = function (k) { return f[k] == null ? '' : String(f[k]); };
    var saved = StuffMigrate.savedViewsForBoard(state, sec.id);
    var starters = StuffMigrate.startersForBoard(stages);
    var chip = function (v, isSaved) {
      var on = sameViewFilter(f, v.filter);
      return '<button type="button" class="bv-chip' + (on ? ' active' : '') + '" data-bv-chip="' + escapeHtml(v.id) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
        escapeHtml(v.name) + ' <span class="bv-chip-count">' + StuffMigrate.filterViewRows(allRows, v.filter, todayStr()).length + '</span></button>';
    };
    var current = saved.filter(function (v) { return sameViewFilter(f, v.filter); })[0] || null;
    // Only search, the Filters button and Board / Table sit in the bar (#104). Two starter views stay
    // as chips; the other starters, every filter and Save view live in the Filters panel.
    var CHIP_STARTERS = ['starter-overdue', 'starter-inbound-untouched'];
    var barStarters = starters.filter(function (v) { return CHIP_STARTERS.indexOf(v.id) !== -1; });
    var panelStarters = starters.filter(function (v) { return CHIP_STARTERS.indexOf(v.id) === -1; });
    var activeCount = Object.keys(f).filter(function (k) { return k !== 'q' && f[k] != null && f[k] !== ''; }).length;
    var html =
      '<div class="bv-row bv-search-row">' +
      '<input type="search" id="bv-q" placeholder="Search company, contact, email, phone" aria-label="Search" value="' + escapeHtml(f.q || '') + '" />' +
      '<button type="button" class="bv-filters-btn' + (activeCount ? ' active' : '') + '" id="bv-filters-btn" aria-expanded="' + (bvFiltersOpen ? 'true' : 'false') + '" aria-controls="bv-panel">Filters' +
      (activeCount ? ' <span class="bv-filters-count" aria-label="' + activeCount + ' active">' + activeCount + '</span>' : '') + '</button>' +
      '<span class="bv-modes" role="group" aria-label="Board or table">' +
      '<button type="button" class="bv-mode' + (mode === 'board' ? ' active' : '') + '" data-bv-mode="board" aria-pressed="' + (mode === 'board') + '">Board</button>' +
      '<button type="button" class="bv-mode' + (mode === 'table' ? ' active' : '') + '" data-bv-mode="table" aria-pressed="' + (mode === 'table') + '">Table</button>' +
      '</span>' +
      '<span class="bv-spacer"></span>' +
      (mode === 'table'
        ? '<details class="bv-cols"' + (boardColsOpen ? ' open' : '') + '><summary>Columns</summary><div class="bv-cols-menu">' +
          viewColumns(allRows).map(function (c) {
            return '<label><input type="checkbox" data-bv-col="' + c.key + '"' + (c.shown ? ' checked' : '') + ' /> ' + escapeHtml(c.label) + '</label>';
          }).join('') + '</div></details>' +
          '<button type="button" class="secondary" id="bv-export">Export CSV</button>'
        : '') +
      '</div>' +
      '<div class="bv-row bv-chips">' +
      barStarters.map(function (v) { return chip(v, false); }).join('') +
      (saved.length ? '<span class="bv-sep" aria-hidden="true"></span>' + saved.map(function (v) { return chip(v, true); }).join('') : '') +
      '</div>' +
      '<div class="bv-panel" id="bv-panel"' + (bvFiltersOpen ? '' : ' hidden') + '>' +
      '<div class="bv-row bv-filters">' +
      '<label>Stage <select id="bv-stage">' + opt('', 'Any', f.stage) + stages.map(function (s) { return opt(s, stageLabel(s), f.stage); }).join('') + '</select></label>' +
      '<label>Source <select id="bv-source">' + opt('', 'Any', f.source) + Object.keys(sources).map(function (s) { return opt(s, sources[s], f.source); }).join('') + '</select></label>' +
      '<label>Email <select id="bv-email">' + hasPick('email') + '</select></label>' +
      '<label>Phone <select id="bv-phone">' + hasPick('phone') + '</select></label>' +
      '<label>Next step <select id="bv-nextstep">' + opt('', 'Any', f.nextStep) + opt('none', 'None', f.nextStep) + opt('overdue', 'Overdue', f.nextStep) + opt('week', 'Due this week', f.nextStep) + '</select></label>' +
      '<label>Idle days, at least <input type="number" id="bv-idle" min="0" step="1" value="' + escapeHtml(num('idleMin')) + '" /></label>' +
      '<label>Value from <input type="number" id="bv-vmin" min="0" step="any" value="' + escapeHtml(num('valueMin')) + '" /></label>' +
      '<label>to <input type="number" id="bv-vmax" min="0" step="any" value="' + escapeHtml(num('valueMax')) + '" /></label>' +
      '<button type="button" class="ghost" id="bv-clear"' + (StuffMigrate.viewFilterIsEmpty(f) ? ' disabled' : '') + '>Clear</button>' +
      '</div>' +
      '<div class="bv-panel-title">Views</div>' +
      '<div class="bv-row bv-chips">' +
      panelStarters.map(function (v) { return chip(v, false); }).join('') +
      '<span class="bv-spacer"></span>' +
      '<button type="button" class="secondary" id="bv-save"' + (StuffMigrate.viewFilterIsEmpty(f) || current ? ' disabled' : '') + '>Save view</button>' +
      (current ? '<button type="button" class="ghost" id="bv-delete">Delete view</button>' : '') +
      '</div>' +
      '</div>';
    var focusId = document.activeElement && bar.contains(document.activeElement) ? document.activeElement.id : '';
    var selStart = null, selEnd = null;
    if (focusId === 'bv-q') { selStart = document.activeElement.selectionStart; selEnd = document.activeElement.selectionEnd; }
    bar.innerHTML = html;
    bar.hidden = false;
    if (focusId && document.getElementById(focusId)) {
      var el = document.getElementById(focusId);
      el.focus();
      if (selStart != null && el.setSelectionRange) { try { el.setSelectionRange(selStart, selEnd); } catch (e) { /* not a text field */ } }
    }

    function setFilter(patch) {
      boardFilters[sec.id] = StuffMigrate.normalizeViewFilter(Object.assign({}, boardFilter(sec.id), patch));
      renderBoard();
    }
    bar.querySelectorAll('[data-bv-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (stagesEditMode) { showToast('Finish editing stages first.'); return; }
        setBoardPref(sec.id, { mode: b.getAttribute('data-bv-mode') });
        renderBoard();
      });
    });
    bar.querySelector('#bv-q').addEventListener('input', function (e) { setFilter({ q: e.target.value }); });
    bar.querySelector('#bv-filters-btn').addEventListener('click', function () {
      bvFiltersOpen = !bvFiltersOpen;
      bar.querySelector('#bv-panel').hidden = !bvFiltersOpen;
      this.setAttribute('aria-expanded', bvFiltersOpen ? 'true' : 'false');
    });
    [['bv-stage', 'stage'], ['bv-source', 'source'], ['bv-email', 'email'], ['bv-phone', 'phone'], ['bv-nextstep', 'nextStep']].forEach(function (p) {
      bar.querySelector('#' + p[0]).addEventListener('change', function (e) { var patch = {}; patch[p[1]] = e.target.value; setFilter(patch); });
    });
    [['bv-idle', 'idleMin'], ['bv-vmin', 'valueMin'], ['bv-vmax', 'valueMax']].forEach(function (p) {
      bar.querySelector('#' + p[0]).addEventListener('input', function (e) { var patch = {}; patch[p[1]] = e.target.value; setFilter(patch); });
    });
    bar.querySelector('#bv-clear').addEventListener('click', function () { boardFilters[sec.id] = {}; renderBoard(); });
    bar.querySelectorAll('[data-bv-chip]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-bv-chip');
        var v = starters.concat(saved).filter(function (x) { return x.id === id; })[0];
        if (!v) return;
        // Pressing the active chip again clears it.
        boardFilters[sec.id] = sameViewFilter(f, v.filter) ? {} : StuffMigrate.normalizeViewFilter(v.filter);
        renderBoard();
      });
    });
    bar.querySelector('#bv-save').addEventListener('click', function () { saveCurrentView(sec); });
    var del = bar.querySelector('#bv-delete');
    if (del) del.addEventListener('click', function () { deleteSavedView(sec, current); });
    var exp = bar.querySelector('#bv-export');
    if (exp) exp.addEventListener('click', function () { exportBoardCsv(sec); });
    var det = bar.querySelector('.bv-cols');
    if (det) {
      det.addEventListener('toggle', function () { boardColsOpen = det.open; });
      det.querySelectorAll('[data-bv-col]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var hidden = (boardPref(sec.id).hidden || []).filter(function (k) { return k !== cb.getAttribute('data-bv-col'); });
          if (!cb.checked) hidden.push(cb.getAttribute('data-bv-col'));
          setBoardPref(sec.id, { hidden: hidden });
          renderBoard();
        });
      });
    }
  }

  // Next step date edited in the table. Same rule as the board: a stage that needs a next step keeps one.
  function setLeadNextStepFromTable(deal, value) {
    var date = String(value || '').slice(0, 10);
    if (!date && StuffMigrate.stageNeedsNextStep(state, deal.stage, TERMINAL_STAGES)) {
      showToast('This stage needs a next step date.');
      return false;
    }
    if ((deal.nextFollowUp || '') === date) return false;
    var t = nowIso();
    deal.nextFollowUp = date || null;
    deal.updatedAt = t;
    deal.lastActivityAt = t;
    logChange('update', 'lead', deal.id, 'Next step date ' + (date || 'cleared') + ' (from table)');
    save();
    return true;
  }

  function renderBoardTable(sec, allRows) {
    var root = document.getElementById('board-table-root');
    var rows = boardTableRows(sec, allRows);
    var pref = boardPref(sec.id);
    var cols = viewColumns(allRows).filter(function (c) { return c.shown; });
    var stages = sectionStages(sec);
    var numeric = { value: 1, idleDays: 1, missingCount: 1 };
    var today = todayStr();
    var head = cols.map(function (c) {
      var sorted = pref.sortKey === c.key;
      return '<th scope="col"' + (numeric[c.key] ? ' class="num"' : '') + ' aria-sort="' + (sorted ? (pref.sortDir === 'desc' ? 'descending' : 'ascending') : 'none') + '">' +
        '<button type="button" class="bt-sort" data-bt-sort="' + c.key + '">' + escapeHtml(c.label) + (sorted ? (pref.sortDir === 'desc' ? ' &#9660;' : ' &#9650;') : '') + '</button></th>';
    }).join('');
    var body = rows.map(function (r) {
      var deal = getDeal(r.id);
      var locked = !deal || isConvertedLead(deal);
      var cells = cols.map(function (c) {
        var label = ' data-label="' + escapeHtml(c.label) + '"';
        if (c.key === 'stageLabel') {
          return '<td' + label + '><select class="bt-stage" data-bt-stage="' + escapeHtml(r.id) + '" aria-label="Stage for ' + escapeHtml(r.title) + '"' + (locked ? ' disabled' : '') + '>' +
            stages.map(function (s) { return '<option value="' + escapeHtml(s) + '"' + (s === r.stage ? ' selected' : '') + '>' + escapeHtml(stageLabel(s)) + '</option>'; }).join('') + '</select></td>';
        }
        if (c.key === 'nextFollowUp') {
          return '<td' + label + '><input type="date" class="bt-date' + (r.nextFollowUp && r.nextFollowUp < today ? ' overdue' : '') + '" data-bt-date="' + escapeHtml(r.id) + '" value="' + escapeHtml(r.nextFollowUp) + '" aria-label="Next step date for ' + escapeHtml(r.title) + '"' + (locked ? ' disabled' : '') + ' /></td>';
        }
        if (c.key === 'value') return '<td class="num"' + label + '>' + (r.value ? formatMoney(r.value) : '') + '</td>';
        if (c.key === 'idleDays') return '<td class="num"' + label + '>' + (r.idleDays == null ? '' : r.idleDays) + '</td>';
        if (c.key === 'missingCount') return '<td class="num"' + label + '>' + (r.missingCount || '') + '</td>';
        return '<td' + label + (c.key === 'company' ? ' class="bt-company"' : '') + '>' + escapeHtml(r[c.key]) + '</td>';
      }).join('');
      return '<tr class="bt-row" data-bt-row="' + escapeHtml(r.id) + '">' + cells + '</tr>';
    }).join('');
    root.hidden = false;
    root.innerHTML =
      '<p class="muted-note bt-count" id="bt-count">' + rows.length + (rows.length === 1 ? ' lead' : ' leads') +
      (rows.length !== allRows.length ? ' of ' + allRows.length : '') + '</p>' +
      (rows.length
        ? '<table class="board-table"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>'
        : '<p class="muted-note">No leads match.</p>');
    root.querySelectorAll('[data-bt-sort]').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-bt-sort');
        var cur = boardPref(sec.id);
        setBoardPref(sec.id, { sortKey: key, sortDir: cur.sortKey === key && cur.sortDir !== 'desc' ? 'desc' : 'asc' });
        renderBoard();
      });
    });
    root.querySelectorAll('[data-bt-row]').forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        if (e.target.closest('select, input, button, label')) return;
        openDetail(tr.getAttribute('data-bt-row'));
      });
    });
    root.querySelectorAll('[data-bt-stage]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var id = sel.getAttribute('data-bt-stage');
        // Same guards as a board drop: Lost asks for a reason, a stage past Inbound asks for a next step.
        if (moveDealToStage(id, sel.value)) renderApp(); else renderBoard();
      });
    });
    root.querySelectorAll('[data-bt-date]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var deal = getDeal(inp.getAttribute('data-bt-date'));
        if (deal && setLeadNextStepFromTable(deal, inp.value)) renderApp(); else renderBoard();
      });
    });
  }

  function renderBoard() {
    renderTabs();
    renderBoardNote();
    var crmSec = currentSection();
    var crm = isCrmBoard(crmSec);
    if (!crm) hideBoardViews();
    if (renderProductionViews()) { renderPipelineTotal(null); renderFollowupStrip(); return; }
    const board = document.getElementById('board');
    var viewRows = null;
    var allowed = null;
    if (crm) {
      viewRows = boardLeadRows(crmSec);
      renderBoardViewBar(crmSec, viewRows);
      if (!StuffMigrate.viewFilterIsEmpty(boardFilter(crmSec.id))) {
        allowed = {};
        StuffMigrate.filterViewRows(viewRows, boardFilter(crmSec.id), todayStr()).forEach(function (r) { allowed[r.id] = true; });
      }
      if (boardViewMode(crmSec) === 'table') {
        board.hidden = true;
        board.innerHTML = '';
        renderPipelineTotal(sectionStages(crmSec));
        renderBoardTable(crmSec, viewRows);
        fillStageSelect(defaultStageForSection(crmSec));
        renderFollowupStrip();
        return;
      }
      var tableRoot = document.getElementById('board-table-root');
      if (tableRoot) { tableRoot.hidden = true; tableRoot.innerHTML = ''; }
    }
    board.innerHTML = '';
    board.classList.toggle('editing-stages', !!stagesEditMode);
    var editBtn = document.getElementById('btn-edit-stages');
    if (editBtn) {
      editBtn.classList.toggle('active', !!stagesEditMode);
      editBtn.textContent = stagesEditMode ? 'Done editing' : 'Edit stages';
    }
    const sec = currentSection();
    var stages = sectionStages(sec);
    if (preprodStageFilter && sec && sec.id === StuffMigrate.SKU_BOARD_ID && stages.indexOf(preprodStageFilter) !== -1) stages = [preprodStageFilter];
    renderPipelineTotal(stages);
    const sopOverMap = overSlaByStage();
    stages.forEach(function (stage, stageIndex) {
      const slaOnly = !!slaOnlyStages[stage] && !!sopOverMap[stage];
      const isOver = function (c) { var s = cardSla(c); return !!(s && s.over); };
      const deals = boardCards().filter(function (d) { return d.stage === stage && (!allowed || allowed[d.id]) && (!slaOnly || isOver(d)); });
      // Inbound (Jotform): newest submission first (#10). Render order only, never saved.
      if (stage === StuffMigrate.INBOUND_SORT_STAGE) deals.sort(StuffMigrate.compareInboundNewestFirst);
      const jobs = jobCardsOnStage(stage).filter(function (c) { return !slaOnly || isOver(c.kind === 'sku' ? c.sku : c.line); });
      const overSlaCount = sopOverMap[stage] || 0;
      const sopInfo = StuffMigrate.stageSop(state, stage);
      const stageTip = [sopInfo.owner ? 'Owner: ' + StuffMigrate.sopBotLabel(state, sopInfo.owner) : '', sopInfo.slaDays ? 'SLA: ' + sopInfo.slaDays + ' day' + (sopInfo.slaDays === 1 ? '' : 's') : ''].filter(Boolean).join('. ');
      const col = document.createElement('div');
      col.className = 'column' + (stagesEditMode ? ' editing-stages' : '');
      col.setAttribute('data-stage', stage);

      var headerHtml =
        '<div class="column-header">' +
        '<div class="col-name-row">' +
        '<span class="col-name' + (stagesEditMode ? ' editable-stage' : '') + '"' + (stageTip ? ' title="' + escapeHtml(stageTip) + '"' : '') + '>' +
        escapeHtml(stageLabel(stage)) + '</span>';
      if (stagesEditMode) {
        headerHtml +=
          '<div class="col-stage-controls">' +
          '<button type="button" class="stage-up" title="Move left" data-stage-move="up"' +
          (stageIndex === 0 ? ' disabled' : '') + '>Up</button>' +
          '<button type="button" class="stage-down" title="Move right" data-stage-move="down"' +
          (stageIndex === stages.length - 1 ? ' disabled' : '') + '>Down</button>' +
          '<button type="button" class="danger-x" title="Remove stage" data-stage-remove="1">x</button>' +
          '</div>';
      }
      headerHtml +=
        '</div>' +
        '<div class="col-stats">' +
        '<span class="column-count">' + (deals.length + jobs.length) + '</span>' +
        (overSlaCount ? '<button type="button" class="column-over-sla' + (slaOnly ? ' active' : '') + '" data-over-sla="1" aria-pressed="' + slaOnly + '" title="' +
          (slaOnly ? 'Showing only the cards past the stage SLA. Click to show all.' : 'Cards past the stage SLA. Click to show only these.') + '">' + overSlaCount + ' over SLA</button>' : '') +
        '</div>' +
        (stagesEditMode ? sopEditHtml(stage) : '') +
        (stagesEditMode ? '<label class="col-idle-edit">Idle after <input type="number" min="1" max="365" class="col-idle-input" value="' + (state.stageIdleDays && state.stageIdleDays[stage] || '') +
          '" placeholder="' + rotThreshold(stage) + '" /> days</label>' : '') +
        (stagesEditMode && isCrmBoard(sec) && !isLostStage(stage) && StuffMigrate.KPI_WON_STAGES.indexOf(stage) === -1
          ? '<label class="col-idle-edit">Chance to close <input type="number" min="0" max="100" class="col-prob-input" value="' +
            (state.stageMeta && state.stageMeta[stage] && state.stageMeta[stage].probability != null ? state.stageMeta[stage].probability : '') +
            '" placeholder="' + (StuffMigrate.KPI_DEFAULT_PROBABILITY[stage] != null ? StuffMigrate.KPI_DEFAULT_PROBABILITY[stage] : 'none') + '" /> %</label>' : '') +
        (stagesEditMode && (isCrmBoard(sec) || StuffMigrate.KPI_WON_STAGES.indexOf(stage) !== -1) ? '<button type="button" class="ghost col-rules-btn" data-stage-rules="1">On enter rules (' + StuffMigrate.stageRulesFor(state, stage).length + ')</button>' : '') +
        stageFaceTotalsHtml(stageFaceTotals(deals, jobs)) +
        '</div>' +
        '<div class="cards" data-stage="' + escapeHtml(stage) + '"></div>';
      col.innerHTML = headerHtml;
      var faceDet = col.querySelector('.col-face-details');
      if (faceDet) faceDet.querySelector('summary').addEventListener('click', function () { faceTotalsOpen = !faceDet.open; });
      var slaChip = col.querySelector('[data-over-sla]');
      if (slaChip) slaChip.addEventListener('click', function (e) {
        e.stopPropagation();
        if (slaOnlyStages[stage]) delete slaOnlyStages[stage]; else slaOnlyStages[stage] = true;
        renderBoard();
      });

      if (stagesEditMode) {
        bindSopEdit(col, stage);
        var idleIn = col.querySelector('.col-idle-input');
        if (idleIn) idleIn.addEventListener('change', function () {
          StuffMigrate.setStageIdleDays(state, stage, idleIn.value);
          save();
          renderBoard();
        });
        var probIn = col.querySelector('.col-prob-input');
        if (probIn) probIn.addEventListener('change', function () {
          var r = StuffMigrate.setStageProbability(state, stage, probIn.value);
          if (!r.ok) { showToast(r.error); renderBoard(); return; }
          save();
          renderBoard();
        });
        var rulesBtn = col.querySelector('[data-stage-rules]');
        if (rulesBtn) rulesBtn.addEventListener('click', function (e) { e.stopPropagation(); openStageRulesModal(stage); });
        var nameEl = col.querySelector('.col-name');
        nameEl.addEventListener('click', function (e) {
          e.stopPropagation();
          beginStageRename(nameEl, stage);
        });
        var upBtn = col.querySelector('[data-stage-move="up"]');
        var downBtn = col.querySelector('[data-stage-move="down"]');
        var rmBtn = col.querySelector('[data-stage-remove]');
        if (upBtn) upBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (reorderStage(sec.id, stage, -1)) renderBoard();
        });
        if (downBtn) downBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (reorderStage(sec.id, stage, 1)) renderBoard();
        });
        if (rmBtn) rmBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (removeStageFromBoard(sec.id, stage)) renderBoard();
        });
      }

      const cardsEl = col.querySelector('.cards');
      function onColDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.classList.add('drag-over');
      }
      function onColDragLeave(e) {
        if (!col.contains(e.relatedTarget)) col.classList.remove('drag-over');
      }
      function onColDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        clearDragOver();
        clearAreaDragExpand();
        var id = e.dataTransfer.getData('text/plain') || dragDealId;
        if (!id) return;
        if (moveDealToStage(id, stage)) {
          suppressCardClick = true;
          setTimeout(function () { suppressCardClick = false; }, 80);
          renderBoard();
        }
      }
      col.addEventListener('dragover', onColDragOver);
      col.addEventListener('dragleave', onColDragLeave);
      col.addEventListener('drop', onColDrop);
      cardsEl.addEventListener('dragover', onColDragOver);
      cardsEl.addEventListener('dragleave', onColDragLeave);
      cardsEl.addEventListener('drop', onColDrop);
      deals.forEach(function (deal) {
        cardsEl.appendChild(renderCard(deal));
      });
      jobs.forEach(function (c) {
        cardsEl.appendChild(renderJobCard(c));
      });
      if (stageIndex > 0) board.appendChild(flowArrowEl());
      board.appendChild(col);
    });

    if (stagesEditMode) {
      var addWrap = document.createElement('div');
      addWrap.className = 'board-add-stage';
      addWrap.innerHTML = '<button type="button" id="btn-add-stage">+ Add stage</button>';
      addWrap.querySelector('button').addEventListener('click', function () {
        var name = prompt('New stage name:');
        if (name == null) return;
        if (!String(name).trim()) return;
        if (addStageToBoard(sec.id, name)) renderBoard();
      });
      if (stages.length) board.appendChild(flowArrowEl());
      board.appendChild(addWrap);
    }

    fillStageSelect(defaultStageForSection(currentSection()));
    renderFollowupStrip();
  }

  // Who owes the next reply (issue #130): chip on cards and in the Leads table, plus the lead page field.
  function replyChipHtml(deal) {
    var c = StuffMigrate.replyChip(deal, Date.now());
    if (!c) return '';
    var tip = (c.kind === 'customer' ? 'Waiting on the customer' : 'Next reply owed by ' + c.owner) +
      (deal.waitingSince ? ' since ' + String(deal.waitingSince).slice(0, 10) : '') + (c.red ? '. Past the ' + StuffMigrate.REPLY_SLA_DAYS + ' day quote SLA.' : '');
    return '<span class="reply-chip reply-chip-' + c.kind + (c.red ? ' reply-chip-red' : '') + '" title="' + escapeHtml(tip) + '">' + escapeHtml(c.text) + '</span>';
  }

  function replyFieldHtml(deal) {
    var owner = deal.nextReplyOwner || '';
    var kind = !owner ? '' : owner.toLowerCase() === 'us' ? 'us' : owner.toLowerCase() === 'customer' ? 'customer' : 'other';
    var day = deal.waitingSince ? String(deal.waitingSince).slice(0, 10) : '';
    function o(v, label) { return '<option value="' + v + '"' + (v === kind ? ' selected' : '') + '>' + label + '</option>'; }
    return '<div class="row reply-row" id="d-reply-row" data-orig-owner="' + escapeHtml(owner) + '" data-orig-since="' + escapeHtml(deal.waitingSince || '') + '">' +
      '<div class="field"><label for="d-reply-kind">Who owes the next reply ' + replyChipHtml(deal) + '</label>' +
      '<select id="d-reply-kind">' + o('', 'Unknown') + o('us', 'Us') + o('customer', 'Customer') + o('other', 'Someone else') + '</select></div>' +
      '<div class="field"' + (kind === 'other' ? '' : ' hidden') + ' id="d-reply-other-wrap"><label for="d-reply-other">Name</label>' +
      '<input type="text" id="d-reply-other" maxlength="60" placeholder="Example Molding Co./Owner" value="' + escapeHtml(kind === 'other' ? owner : '') + '" /></div>' +
      '<div class="field"><label for="d-reply-since">Waiting since</label><input type="date" id="d-reply-since" value="' + escapeHtml(day) + '" /></div></div>';
  }

  function wireReplyField() {
    var k = document.getElementById('d-reply-kind');
    if (!k) return;
    k.addEventListener('change', function () {
      var w = document.getElementById('d-reply-other-wrap');
      if (w) w.hidden = k.value !== 'other';
    });
  }

  // Human edit through the same audit path as the write API (changeLog action reply-owner).
  function saveReplyFromDetail(deal) {
    var row = document.getElementById('d-reply-row');
    if (!row) return;
    var kind = document.getElementById('d-reply-kind').value;
    var owner = kind === 'other' ? document.getElementById('d-reply-other').value.trim() : kind === 'us' ? 'us' : kind === 'customer' ? 'customer' : '';
    var day = document.getElementById('d-reply-since').value;
    var origOwner = row.getAttribute('data-orig-owner') || '', origSince = row.getAttribute('data-orig-since') || '';
    var origDay = origSince.slice(0, 10);
    if (owner === origOwner && day === origDay) return;
    try {
      var cleaned = null;
      if (owner) {
        var since = day && day !== origDay ? new Date(day + 'T00:00:00').toISOString() : (owner === origOwner && origSince ? origSince : null);
        cleaned = StuffMigrate.replyCleanSet({ owner: owner, since: since }, Date.now());
      }
      StuffMigrate.applyReplySet(state, deal, cleaned, { by: sectionActor().by, source: 'human', at: nowIso() });
    } catch (e) {
      alert(e.message || 'Could not save who owes the next reply.');
    }
  }

  function renderCard(deal) {
    const el = document.createElement('div');
    el.className = 'card';
    el.setAttribute('data-id', deal.id);
    el.draggable = true;
    if (!isProjectCard(deal)) {
      var qs = StuffMigrate.quoteSentState(state, deal);
      if (qs) el.classList.add(qs === 'sent' ? 'card-q-sent' : 'card-q-unsent');
    }
    var badges = '';
    if (isRotting(deal)) {
      el.classList.add('card-rotting');
    }
    if (!isProjectCard(deal) && StuffMigrate.lacksNextStep(state, deal, TERMINAL_STAGES)) {
      badges += '<span class="badge badge-nonext">No next step</span>';
    }
    // One status dot replaces the Over SLA, Overdue and missing chips (#104): red = overdue or past the
    // stage SLA, amber = due soon. The reasons are in its tooltip; the full picture is on the lead page.
    var dealSla = cardSla(deal);
    var dotReasons = [];
    var dotLevel = '';
    if (isRotting(deal)) {
      var days = idleDays(deal);
      dotReasons.push(days === Infinity ? 'Idle ' + rotThreshold(deal.stage) + '+ days' : 'Idle ' + days + ' day' + (days === 1 ? '' : 's'));
      dotLevel = 'amber';
    }
    if (dealSla && dealSla.over) { dotReasons.push('Over SLA ' + dealSla.daysOver + ' day' + (dealSla.daysOver === 1 ? '' : 's')); dotLevel = 'red'; }
    if (deal.nextFollowUp && !isConvertedLead(deal)) {
      if (isOverdue(deal.nextFollowUp)) { dotReasons.push('Overdue ' + deal.nextFollowUp); dotLevel = 'red'; }
      else if (isDueSoon(deal.nextFollowUp)) { dotReasons.push('Due ' + deal.nextFollowUp); dotLevel = dotLevel || 'amber'; }
    }
    var sub = cardSubline(deal);
    var thumb = deal.coverFileId ? '<span class="card-thumb" data-cover-id="' + escapeHtml(deal.coverFileId) + '"></span>' : '';
    var top = '';
    if (isProjectCard(deal)) {
      var skuCount = (state.skus || []).filter(function (x) { return x.projectId === deal.id; }).length;
      top = '<div class="card-customer">' + escapeHtml(customerNameFor(deal)) +
        (skuCount ? '<span class="badge badge-sku">' + skuCount + ' SKU' + (skuCount === 1 ? '' : 's') + '</span>' : '') + '</div>';
      el.classList.add('card-project');
    }
    if (isConvertedLead(deal)) {
      el.classList.add('card-converted');
      el.draggable = false;
      badges += '<span class="badge badge-converted">' + (deal.status === 'won' ? 'Won' : 'Converted') + '</span>';
    }
    // #102: say when a lead's ARR is left out of Pipeline ARR, or kept in by a pin.
    if (!isProjectCard(deal) && !isConvertedLead(deal) && StuffMigrate.dealArr(deal) > 0) {
      var arrWhy = StuffMigrate.arrExcludedReason(state, deal);
      if (arrWhy && arrWhy !== 'lost') badges += '<span class="badge badge-arr-out" title="Not counted in Pipeline ARR: ' + escapeHtml(arrWhy) + '. Still in ARR potential.">Not in ARR</span>';
      else if (!arrWhy && deal.arrPinned) badges += '<span class="badge badge-arr-pin" title="Counted in ARR even when idle">ARR pinned</span>';
    }
    if (!isProjectCard(deal) && !isConvertedLead(deal) && StuffMigrate.isSoldAndPaid(state, deal)) {
      badges += '<span class="badge badge-paid" title="Sold and paid. Mark won to move it to Pre-Production.">Paid, not in Pre-Production</span>';
    }
    if (!isProjectCard(deal) && !isConvertedLead(deal)) badges += replyChipHtml(deal);
    var chkOpen = (deal.checklist || []).filter(function (c) { return !c.done; }).length;
    if (chkOpen && !isProjectCard(deal)) badges += '<span class="badge badge-source" title="Checklist items not ticked yet">' + chkOpen + ' to tick</span>';
    if (isLostStage(deal.stage) && deal.lostReason) badges += '<span class="badge badge-lost">' + escapeHtml(StuffMigrate.lostReasonLabel(deal.lostReason.code)) + '</span>';
    if (!isProjectCard(deal)) badges = replyWaitingChipHtml(deal) + staleChipHtml(deal) + badges;
    var metaInner = badges;
    if (dotLevel) {
      el.classList.add('card-has-dot');
      top += '<span class="card-dot card-dot-' + dotLevel + '" role="img" aria-label="' + escapeHtml(dotReasons.join('. ')) + '" title="' + escapeHtml(dotReasons.join('. ')) + '"></span>';
    }
    el.innerHTML = top +
      '<div class="card-title-row">' + thumb + '<div class="card-title">' + escapeHtml(cardTitle(deal)) + '</div></div>' +
      (sub ? '<div class="card-sub">' + escapeHtml(sub) + '</div>' : '') +
      (isProjectCard(deal) ? '' : emailLineHtml(deal)) +
      cardFaceHtml(leadFace(deal), null) +
      (metaInner ? '<div class="card-meta">' + metaInner + '</div>' : '');
    el.addEventListener('dragstart', function (e) {
      dragDealId = deal.id;
      el.classList.add('dragging');
      try {
        e.dataTransfer.setData('text/plain', deal.id);
        e.dataTransfer.effectAllowed = 'move';
      } catch (err) { /* ignore */ }
    });
    el.addEventListener('dragend', function () {
      el.classList.remove('dragging');
      dragDealId = null;
      clearDragOver();
      clearAreaDragExpand();
      suppressCardClick = true;
      setTimeout(function () { suppressCardClick = false; }, 80);
    });
    el.addEventListener('click', function (e) {
      if (suppressCardClick) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      openDetail(deal.id);
    });
    addCardMoveButton(el, deal.id, cardTitle(deal));
    if (deal.coverFileId) hydrateCoverThumb(el.querySelector('.card-thumb'), deal.coverFileId);
    return el;
  }

  function renderFileListHtml(filesObj, opts) {
    opts = opts || {};
    var compact = !!opts.compact;
    var prefix = opts.prefix || 'files';
    var html = '';
    FILE_CATEGORIES.forEach(function (cat) {
      var label = FILE_CATEGORY_LABELS[cat] || cat;
      var list = (filesObj && filesObj[cat]) ? filesObj[cat] : [];
      html += '<div class="files-section" data-file-cat="' + cat + '">';
      html += compact
        ? '<div class="files-heading">' + escapeHtml(label) + '</div>'
        : '<h3>' + escapeHtml(label) + '</h3>';
      html += '<div class="files-toolbar">' +
        '<button type="button" class="ghost file-upload-btn" data-cat="' + cat + '" data-prefix="' + escapeHtml(prefix) + '">Upload</button>' +
        '<input type="file" class="file-input" data-cat="' + cat + '" data-prefix="' + escapeHtml(prefix) + '" multiple />' +
        '</div>';
      if (!list.length) {
        html += '<div class="file-empty">No files yet.</div>';
      } else {
        html += '<ul class="file-list">';
        list.forEach(function (f) {
          var when = f.addedAt ? new Date(f.addedAt).toLocaleString() : '';
          html += '<li data-file-id="' + escapeHtml(f.id) + '" data-cat="' + cat + '">' +
            '<button type="button" class="file-name" data-action="open-file" data-cat="' + cat + '" data-id="' + escapeHtml(f.id) + '">' +
            escapeHtml(f.name || 'file') + '</button>' +
            '<span class="file-meta">' + escapeHtml(formatBytes(f.size)) +
            (when ? ' · ' + escapeHtml(when) : '') + '</span>' +
            '<button type="button" class="file-remove" data-action="remove-file" data-cat="' + cat + '" data-id="' + escapeHtml(f.id) + '">Remove</button>' +
            '</li>';
        });
        html += '</ul>';
      }
      html += '</div>';
    });
    return html;
  }

  function bindFileSectionEvents(root, getFiles, setFiles, onChange) {
    if (!root) return;
    root.querySelectorAll('.file-upload-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-cat');
        var input = root.querySelector('.file-input[data-cat="' + cat + '"]');
        if (input) input.click();
      });
    });
    root.querySelectorAll('.file-input').forEach(function (input) {
      input.addEventListener('change', function () {
        var cat = input.getAttribute('data-cat');
        var files = input.files;
        if (!files || !files.length) return;
        var bag = getFiles();
        ensureDealFiles({ files: bag });
        var chain = Promise.resolve();
        Array.prototype.forEach.call(files, function (file) {
          if (file.size > 25 * 1024 * 1024) {
            alert('Skipping "' + file.name + '": over the 25 MB limit (' + formatBytes(file.size) + ').');
            return;
          }
          if (file.size > FILE_SOFT_LIMIT) {
            // Soft warn; IndexedDB can still hold larger blobs.
            console.warn('Large file', file.name, formatBytes(file.size));
          }
          chain = chain.then(function () {
            var id = uid();
            return storeFileBlob(id, file).then(function (stored) {
              bag[cat].push({
                id: id,
                name: file.name,
                mime: file.type || '',
                size: file.size,
                addedAt: nowIso(),
                dataKey: stored.dataKey,
                dataURL: stored.dataURL || null
              });
            }).catch(function (err) {
              alert('Could not store "' + file.name + '": ' + (err && err.message ? err.message : 'unknown error'));
            });
          });
        });
        chain.then(function () {
          setFiles(bag);
          input.value = '';
          if (onChange) onChange();
        });
      });
    });
    root.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      var action = t.getAttribute('data-action');
      if (!action) return;
      var cat = t.getAttribute('data-cat');
      var id = t.getAttribute('data-id');
      var bag = getFiles();
      var list = (bag[cat] || []);
      var meta = list.find(function (f) { return f.id === id; });
      if (!meta) return;
      if (action === 'open-file') {
        openStoredFile(meta);
      } else if (action === 'remove-file') {
        if (!confirm('Remove "' + (meta.name || 'file') + '"?')) return;
        deleteStoredBlob(meta).then(function () {
          bag[cat] = (bag[cat] || []).filter(function (f) { return f.id !== id; });
          setFiles(bag);
          if (onChange) onChange();
        });
      }
    });
  }

  function renderModalFiles() {
    var root = document.getElementById('modal-files-root');
    if (!root) return;
    if (!editingId) {
      root.innerHTML = '<p class="file-empty">Save the deal first to attach files, or use Open on an existing record.</p>';
      return;
    }
    if (!pendingFiles) pendingFiles = emptyFiles();
    root.innerHTML = renderFileListHtml(pendingFiles, { compact: true, prefix: 'modal' });
    bindFileSectionEvents(
      root,
      function () { return pendingFiles; },
      function (f) { pendingFiles = f; },
      function () { renderModalFiles(); }
    );
  }

  function fillDetailStageSelect(preferredStage) {
    var sel = document.getElementById('d-stage');
    if (!sel) return;
    var deal = getDeal(activeDetailId);
    var sec = deal ? sectionForStage(deal.stage) : currentSection();
    if (!sec) sec = currentSection();
    var stages = sectionStages(sec);
    var extra = preferredStage && stages.indexOf(preferredStage) === -1 ? preferredStage : null;
    sel.innerHTML = '';
    if (extra) {
      var opt = document.createElement('option');
      opt.value = extra;
      var owner = sectionForStage(extra);
      opt.textContent = stageLabel(extra) + (owner ? ' (' + owner.label + ')' : ' (other board)');
      sel.appendChild(opt);
    }
    stages.forEach(function (slug) {
      var o = document.createElement('option');
      o.value = slug;
      o.textContent = stageLabel(slug);
      sel.appendChild(o);
    });
    var pick = preferredStage || defaultStageForSection(sec);
    if (Array.prototype.some.call(sel.options, function (o) { return o.value === pick; })) {
      sel.value = pick;
    } else if (sel.options.length) {
      sel.value = sel.options[0].value;
    }
  }

  // TL;DR rows (issue #61). One line per entry: date, source chip, summary (or auto-TL;DR).
  // The full text sits behind Show more, formatted for reading. Display only.
  function linkifyHtml(s) {
    return escapeHtml(s).replace(/https?:\/\/(?:(?!&quot;|&lt;|&gt;)[^\s<>"'])+/g, function (u) {
      var tail = (u.match(/[.,;:!?)]+$/) || [''])[0];
      var url = u.slice(0, u.length - tail.length);
      return '<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>' + tail;
    });
  }

  function entryFullHtml(text) {
    return StuffMigrate.formatEntryText(text).map(function (b) {
      if (b.type === 'fields') {
        return '<div class="tl-fields">' + b.items.map(function (x) {
          return '<div class="tl-field"><b>' + escapeHtml(x.label) + ':</b> ' + linkifyHtml(x.value) + '</div>';
        }).join('') + '</div>';
      }
      return '<p class="tl-para">' + linkifyHtml(b.text) + '</p>';
    }).join('');
  }

  // o: { date, sourceHtml, extraHtml }. entry: { text, summary, url }.
  function entryRowHtml(entry, o) {
    var text = String(entry.text || '');
    var line = StuffMigrate.entrySummary(entry);
    var gmail = StuffMigrate.extractGmailUrl(text, entry.url);
    var isMail = entry.type === 'email' && String(entry.id || '').indexOf('gmail:') === 0;
    // Gmail sync entries (#54): direction badge, subject and the short snippet; the thread link is Open in Gmail.
    if (isMail) { line = (entry.subject || text || '(no subject)') + (entry.snippet ? ' - ' + entry.snippet : ''); gmail = entry.threadUrl || gmail; text = ''; }
    var hasMore = !!text.trim() && (text.trim() !== line || text.indexOf('\n') !== -1);
    return '<div class="tl-entry"><div class="tl-line"><span class="tl-date">' + escapeHtml(o.date || '') + '</span>' +
      (isMail ? '<span class="note-badge mail-' + (entry.direction === 'outbound' ? 'out' : 'in') + '">' + (entry.direction === 'outbound' ? 'Email out' : 'Email in') + '</span>' :
        o.sourceHtml ? '<span class="note-badge">' + o.sourceHtml + '</span>' : '') +
      '<span class="tl-sum">' + escapeHtml(line) + '</span>' +
      (gmail ? '<a class="tl-gmail" href="' + escapeHtml(gmail) + '" target="_blank" rel="noopener">Open in Gmail</a>' : '') +
      (hasMore ? '<button type="button" class="link-btn tl-toggle" aria-expanded="false">Show more</button>' : '') + '</div>' +
      (o.extraHtml ? '<div class="tl-extra">' + o.extraHtml + '</div>' : '') +
      (hasMore ? '<div class="tl-full" hidden>' + entryFullHtml(text) + '</div>' : '') + '</div>';
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('.tl-toggle') : null;
    if (!t) return;
    var full = t.closest('.tl-entry').querySelector('.tl-full');
    if (!full) return;
    var open = full.hasAttribute('hidden');
    if (open) full.removeAttribute('hidden'); else full.setAttribute('hidden', '');
    t.setAttribute('aria-expanded', open ? 'true' : 'false');
    t.textContent = open ? 'Show less' : 'Show more';
  });

  function tldrStripHtml(deal) {
    var lines = StuffMigrate.leadTldrStrip(state, deal);
    if (!lines.length) return '';
    return '<div class="tldr-strip">' + lines.map(function (l) {
      return '<div class="tldr-line tldr-' + l.kind + '">' + (l.date ? '<span class="tl-date">' + escapeHtml(l.date) + '</span> ' : '') + escapeHtml(l.text) + '</div>';
    }).join('') + '</div>';
  }

  // Readable note card (issue #21). Display only: the stored note is never changed.
  function noteItemHtml(n, opts) {
    var f = StuffMigrate.formatNote(n);
    if (f.kind !== 'jotform' && f.kind !== 'pipedrive-import') {
      return '<li class="note-card note-' + escapeHtml(f.kind) + '">' + entryRowHtml(n && typeof n === 'object' ? n : { text: n }, {
        date: StuffMigrate.formatNoteDate(f.date || (n && n.createdAt)), sourceHtml: escapeHtml(f.source)
      }) + '</li>';
    }
    var when = StuffMigrate.formatNoteDate(f.date || (n && n.createdAt));
    var html = '<li class="note-card note-' + escapeHtml(f.kind) + '"><div class="note-meta"><span>' + escapeHtml(when) + '</span>' +
      (f.source ? '<span class="note-badge">' + escapeHtml(f.source) + '</span>' : '') + '</div>';
    if (f.kind === 'pipedrive-import') html += '<div class="note-chip">' + escapeHtml(f.title) + '</div>';
    else if (f.title) html += '<div class="note-title">' + escapeHtml(f.title) + '</div>';
    if (f.fields.length) {
      html += '<dl class="note-fields">' + f.fields.map(function (x) {
        var v = x.href ? '<a href="' + escapeHtml(x.href) + '">' + escapeHtml(x.value) + '</a>' : escapeHtml(x.value);
        return '<dt>' + escapeHtml(x.label) + '</dt><dd>' + v + '</dd>';
      }).join('') + '</dl>';
    }
    if (f.body) html += '<div class="note-body">' + escapeHtml(f.body) + '</div>';
    if ((f.kind === 'jotform' || f.kind === 'pipedrive-import') && !(opts && opts.noRaw)) {
      html += '<details class="note-raw"><summary>Show original</summary><pre>' + escapeHtml(f.raw) + '</pre></details>';
    }
    return html + '</li>';
  }

  function renderDetailNotes(notes) {
    var list = document.getElementById('d-notes-list');
    if (!list) return;
    var sorted = (notes || []).slice().sort(function (a, b) {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    list.innerHTML = sorted.map(function (n) { return noteItemHtml(n, { noRaw: true }); }).join('');
  }

  function updateDetailTotal() {
    var el = document.getElementById('d-total');
    if (!el) return;
    var card = getDeal(activeDetailId);
    var o = Object.assign(emptyValues(), card ? migrateDealValues(card) : {});
    VALUE_KEYS.forEach(function (k) {
      var inp = document.getElementById('d-' + k);
      if (inp) o[k] = Number(inp.value) || 0;
    });
    el.textContent = formatMoney(totalValue({ values: o }));
    ['ls-value', 'd-core-total'].forEach(function (id) { var x = document.getElementById(id); if (x) x.textContent = el.textContent; });
  }

  function renderDetailFiles() {
    var root = document.getElementById('d-files-root');
    if (!root) return;
    if (!detailPendingFiles) detailPendingFiles = emptyFiles();
    root.innerHTML = renderFileListHtml(detailPendingFiles, { compact: false, prefix: 'detail' });
    bindFileSectionEvents(
      root,
      function () { return detailPendingFiles; },
      function (f) { detailPendingFiles = f; },
      function () { renderDetailFiles(); }
    );
  }

  // =====================================================================
  // Lead page (issue #105): summary header, four tabs, one Files list, a "..." menu for the rarely
  // used actions. Every input keeps its id and stays in the form, so Save works as before; the tabs
  // only show and hide panels. Projects keep the older layout.
  // =====================================================================
  var LEAD_TABS = [['overview', 'Overview'], ['files', 'Files'], ['activity', 'Activity'], ['money', 'Money']];
  var LEAD_FILE_TYPES = [['quotes', 'Quote'], ['invoices', 'Invoice'], ['designs', 'Design'], ['molds', 'Mold'], ['renderings', 'Render']];
  var leadTab = 'overview';
  var leadTabFor = null;
  var leadFileType = 'quotes';
  var leadFileFilter = '';
  var leadShowSquid = false;
  var leadHistoryAll = false;

  function rawNotesOf(deal) {
    return (deal.notes || []).map(function (n) { return { n: n, f: StuffMigrate.formatNote(n) }; })
      .filter(function (x) { return (x.f.kind === 'jotform' || x.f.kind === 'pipedrive-import') && x.f.raw; });
  }

  // One primary action by stage. Returns { label, run } or null.
  function leadPrimaryAction(deal) {
    if (!deal || deal.type === 'internal') return null;
    var stage = deal.stage;
    var sec = sectionForStage(stage);
    if (StuffMigrate.isClosedLead(deal) || (sec && isProjectArea(sec.area))) {
      var job = (state.skus || []).find(function (s) { return s.dealId === deal.id; });
      return job ? { label: 'Open job', run: function () { openDetail(job.id); } } : null;
    }
    if (isLostStage(stage)) return null;
    if (isColdStage(stage)) return { label: 'Log activity', run: function () { openQuickLog('lead', deal.id); } };
    if (stage === 'won-awaiting-payment') {
      return deal.customerId ? { label: 'Record payment', run: function () { openBillingChargeModal({ customerId: deal.customerId, dealId: deal.id, category: 'deposit' }); } } : null;
    }
    if (stage === 'invoicing') {
      return deal.customerId ? { label: 'Send invoice', run: function () { setActiveBilling(deal.customerId); } } : null;
    }
    if (StuffMigrate.quoteSentState(state, deal) === 'sent' || stage === 'design-prototyping-quote-sent' || stage === 'follow-up-negotiation') {
      return { label: 'Mark won', run: function () { openWonModal({ leadId: deal.id }); } };
    }
    return {
      label: 'Send quote',
      run: function () {
        var draft = quotesForLead(deal.id).filter(function (q) { return q.status === 'draft'; }).pop();
        openCustomerQuoteModal(draft ? { leadId: deal.id, quoteId: draft.id } : { leadId: deal.id });
      }
    };
  }

  function leadSummaryFactsHtml(deal, core) {
    var parts = [];
    var c = primaryContactFor(deal);
    var name = (c && c.name) || core.contactName;
    var email = (c && c.email) || core.email;
    var phone = (c && c.phone) || core.phone;
    if (name || email || phone) {
      parts.push('<span class="ls-contact">' + (name ? '<strong>' + escapeHtml(name) + '</strong>' : '') +
        (email ? ' <a href="mailto:' + escapeHtml(email) + '">' + escapeHtml(email) + '</a>' : '') +
        (phone ? ' <a href="tel:' + escapeHtml(phone) + '">' + escapeHtml(phone) + '</a>' : '') + '</span>');
    } else {
      parts.push('<button type="button" class="link-btn" id="ls-add-contact">+ Contact</button>');
    }
    parts.push('<button type="button" class="stage-pill" id="ls-stage" title="Move to another stage">' + escapeHtml(stageLabel(deal.stage)) + '</button>');
    parts.push('<span class="ls-value" title="Total value">' + '<span id="ls-value">' + formatMoney(totalValue({ values: migrateDealValues(deal) })) + '</span></span>');
    var next = core.nextStep || '';
    if (next || deal.nextFollowUp) {
      parts.push('<span class="ls-next">Next: ' + escapeHtml(next || 'follow up') + (deal.nextFollowUp ? ' <span class="muted-note">' + escapeHtml(deal.nextFollowUp) + '</span>' : '') + '</span>');
    }
    var sop = StuffMigrate.stageSop(state, deal.stage);
    if (sop.owner) parts.push('<span class="sop-owner-chip" title="Stage owner">' + escapeHtml(StuffMigrate.sopBotLabel(state, sop.owner)) + '</span>');
    return parts.join('');
  }

  function setLeadTab(tab) {
    leadTab = tab;
    var root = document.getElementById('detail-root');
    if (!root) return;
    root.querySelectorAll('[data-lead-tab]').forEach(function (b) {
      var on = b.getAttribute('data-lead-tab') === tab;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    root.querySelectorAll('[data-lead-panel]').forEach(function (p) {
      if (p.getAttribute('data-lead-panel') === tab) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
    });
    if (tab === 'activity') {
      var deal = getDeal(activeDetailId);
      var det = root.querySelector('#d-comms-root details.rec-section');
      if (deal && det && det.open && gmailConnected()) loadComms(deal);
    }
  }

  // Files tab: one list with a type tag, one Upload with a type picker, Drive links accepted.
  function leadFilesHtml(bag) {
    var all = [];
    LEAD_FILE_TYPES.forEach(function (t) { ((bag && bag[t[0]]) || []).forEach(function (f) { all.push({ cat: t[0], label: t[1], f: f }); }); });
    all.sort(function (a, b) { return String(b.f.addedAt || '').localeCompare(String(a.f.addedAt || '')); });
    var counts = {};
    all.forEach(function (x) { counts[x.cat] = (counts[x.cat] || 0) + 1; });
    var html = '<div class="lead-files-bar"><div class="field"><label for="lf-type">Type</label><select id="lf-type">' + LEAD_FILE_TYPES.map(function (t) {
      return '<option value="' + t[0] + '"' + (t[0] === leadFileType ? ' selected' : '') + '>' + t[1] + '</option>';
    }).join('') + '</select></div>' +
      '<button type="button" class="file-upload-btn" id="lf-upload" data-cat="' + leadFileType + '">Upload</button>' +
      '<input type="file" class="file-input" id="lf-input" data-cat="' + leadFileType + '" multiple />' +
      '<button type="button" class="ghost" id="lf-link">Add Drive link</button></div>';
    if (all.length) {
      html += '<div class="lead-file-filter" role="group" aria-label="Filter files">' +
        '<button type="button" class="chip-btn' + (!leadFileFilter ? ' active' : '') + '" data-lf-filter="">All ' + all.length + '</button>' +
        LEAD_FILE_TYPES.filter(function (t) { return counts[t[0]]; }).map(function (t) {
          return '<button type="button" class="chip-btn' + (leadFileFilter === t[0] ? ' active' : '') + '" data-lf-filter="' + t[0] + '">' + t[1] + ' ' + counts[t[0]] + '</button>';
        }).join('') + '</div>';
      var shown = all.filter(function (x) { return !leadFileFilter || x.cat === leadFileFilter; });
      html += '<ul class="file-list lead-file-list">' + shown.map(function (x) {
        var f = x.f;
        var isLink = /^https?:\/\//i.test(String(f.url || f.driveUrl || '')) && !f.dataURL && !f.dataKey;
        var meta = isLink ? 'Drive link' : formatBytes(f.size);
        var warn = !isLink && !(Number(f.size) > 0) ? ' <span class="badge file-warn" title="This file is empty">0 B</span>' : '';
        return '<li data-file-id="' + escapeHtml(f.id) + '" data-cat="' + x.cat + '"><span class="badge file-type-tag">' + x.label + '</span>' +
          '<button type="button" class="file-name" data-action="open-file" data-cat="' + x.cat + '" data-id="' + escapeHtml(f.id) + '">' + escapeHtml(f.name || 'file') + '</button>' + warn +
          '<span class="file-meta">' + escapeHtml(meta) + (f.addedAt ? ' &middot; ' + escapeHtml(new Date(f.addedAt).toLocaleDateString()) : '') + '</span>' +
          '<button type="button" class="file-remove" data-action="remove-file" data-cat="' + x.cat + '" data-id="' + escapeHtml(f.id) + '">Remove</button></li>';
      }).join('') + '</ul>';
    }
    return html;
  }

  function renderLeadFiles() {
    var root = document.getElementById('d-files-root');
    if (!root) return;
    if (!detailPendingFiles) detailPendingFiles = emptyFiles();
    root.innerHTML = leadFilesHtml(detailPendingFiles);
    bindFileSectionEvents(root, function () { return detailPendingFiles; }, function (f) { detailPendingFiles = f; }, function () { renderLeadFiles(); refreshLeadTabCounts(); });
    var sel = root.querySelector('#lf-type');
    sel.addEventListener('change', function () {
      leadFileType = sel.value;
      root.querySelector('#lf-upload').setAttribute('data-cat', leadFileType);
      root.querySelector('#lf-input').setAttribute('data-cat', leadFileType);
    });
    root.querySelectorAll('[data-lf-filter]').forEach(function (b) {
      b.addEventListener('click', function () { leadFileFilter = b.getAttribute('data-lf-filter'); renderLeadFiles(); });
    });
    root.querySelector('#lf-link').addEventListener('click', function () {
      var url = (prompt('Drive or web link for this ' + (LEAD_FILE_TYPES.find(function (t) { return t[0] === leadFileType; }) || [, 'file'])[1].toLowerCase() + ':') || '').trim();
      if (!url) return;
      if (!/^https?:\/\/\S+$/i.test(url)) { alert('Links must start with http:// or https://.'); return; }
      var name = (prompt('Name', url.replace(/^https?:\/\//, '').slice(0, 60)) || '').trim() || 'Link';
      ensureDealFiles({ files: detailPendingFiles });
      detailPendingFiles[leadFileType].push({ id: uid(), name: name, url: url, mime: '', size: 0, addedAt: nowIso(), source: 'link' });
      renderLeadFiles();
      refreshLeadTabCounts();
    });
  }

  function refreshLeadTabCounts() {
    var b = document.querySelector('[data-lead-tab="files"] .tab-count');
    if (!b) return;
    var n = 0;
    LEAD_FILE_TYPES.forEach(function (t) { n += ((detailPendingFiles && detailPendingFiles[t[0]]) || []).length; });
    b.textContent = n ? String(n) : '';
  }

  // Activity: the communication timeline and this lead's change log in one list, newest first, plus
  // "+ Timeline entry". Notes are listed above it.
  function renderLeadHistory(root, deal) {
    if (!root) return;
    var items = [];
    StuffMigrate.timelineNewestFirst(deal.timeline).forEach(function (e) {
      var src = e.url ? '<a href="' + escapeHtml(e.url) + '" target="_blank" rel="noopener">' + escapeHtml(e.source || 'source') + '</a>' : escapeHtml(e.source || '');
      items.push({ at: String(e.at || ''), html: entryRowHtml(e, { date: String(e.at || '').slice(0, 10), sourceHtml: src }) });
    });
    (state.changeLog || []).forEach(function (e) {
      if (!e || e.entityId !== deal.id) return;
      var who = e.who || e.by || '';
      items.push({ at: String(e.at || ''), html: '<span class="tl-date">' + escapeHtml(String(e.at || '').slice(0, 10)) + '</span> <span class="note-badge">Change</span> ' +
        escapeHtml(e.detail || (e.field ? e.field + ' changed' : e.action || '')) + (who ? ' <span class="muted-note">' + escapeHtml(who) + '</span>' : '') });
    });
    items.sort(function (a, b) { return b.at.localeCompare(a.at); });
    var shown = leadHistoryAll ? items : items.slice(0, 15);
    var html = items.length ? '<div class="section-title">History</div><ul class="timeline-list lead-history">' + shown.map(function (x) { return '<li>' + x.html + '</li>'; }).join('') + '</ul>' +
      (items.length > shown.length ? '<button type="button" class="link-btn" id="lh-all">Show all ' + items.length + '</button>' : '') : '';
    html += '<button type="button" class="add-row" id="lh-add-row">+ Timeline entry</button>' +
      '<div class="lh-add" id="lh-add" hidden><div class="row"><div class="field"><label for="lh-at">Date</label><input type="date" id="lh-at" /></div>' +
      '<div class="field"><label for="lh-url">Source link</label><input type="text" inputmode="url" id="lh-url" placeholder="Gmail or Drive link" /></div></div>' +
      '<div class="field"><label for="lh-text">What happened</label><input type="text" id="lh-text" /></div>' +
      '<div class="admin-actions"><button type="button" class="secondary" id="lh-save">Add to timeline</button></div></div>';
    root.innerHTML = html;
    var all = root.querySelector('#lh-all');
    if (all) all.addEventListener('click', function () { leadHistoryAll = true; renderLeadHistory(root, deal); });
    root.querySelector('#lh-add-row').addEventListener('click', function () {
      root.querySelector('#lh-add').removeAttribute('hidden');
      root.querySelector('#lh-add-row').setAttribute('hidden', '');
      root.querySelector('#lh-text').focus();
    });
    root.querySelector('#lh-save').addEventListener('click', function () {
      var url = root.querySelector('#lh-url').value;
      var r = StuffMigrate.addTimelineEntry(state, deal, 'lead', {
        at: root.querySelector('#lh-at').value, text: root.querySelector('#lh-text').value, url: url,
        source: url ? (/mail\.google/.test(url) ? 'gmail' : /drive\.google|docs\.google/.test(url) ? 'drive' : 'link') : sectionActor().by
      }, sectionActor());
      if (r.error) { alert(r.error); return; }
      if (r.duplicate) { alert('That entry is already on the timeline.'); return; }
      save();
      renderLeadHistory(root, deal);
    });
  }

  function openShowOriginal(deal) {
    var raws = rawNotesOf(deal);
    var html = '<div class="modal-title-row"><h2>Original text</h2></div>' +
      (raws.length ? raws.map(function (x) {
        return '<details class="note-raw" open><summary>' + escapeHtml((x.f.source || 'Note') + ', ' + StuffMigrate.formatNoteDate(x.f.date || x.n.createdAt)) + '</summary><pre>' + escapeHtml(x.f.raw) + '</pre></details>';
      }).join('') : '<p class="muted-note">This lead has no imported notes with original text.</p>') +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Close</button></div>';
    openJobModal(html, 'lg');
  }

  function leadSophHtml(deal) {
    var sc = deal.sophisticationScore;
    return '<div class="row"><div class="field lead-soph"><label for="ls-soph">Sophistication <button type="button" class="info-btn" id="ls-soph-info" aria-label="How to score" title="' +
      escapeHtml(SOPH_RUBRIC.join('. ')) + '">i</button></label><select id="ls-soph"><option value="">Not set</option>' +
      [1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + (n === sc ? ' selected' : '') + '>' + escapeHtml(SOPH_RUBRIC[n - 1]) + '</option>'; }).join('') +
      '</select><div class="muted-note lead-soph-rubric" id="ls-soph-rubric" hidden>' + SOPH_RUBRIC.map(escapeHtml).join('<br>') + '<br>Internal only. Never shown to the customer.</div></div></div>';
  }

  function renderLeadDetail(root, deal) {
    if (leadTabFor !== deal.id) { leadTab = 'overview'; leadTabFor = deal.id; leadFileFilter = ''; leadShowSquid = false; leadHistoryAll = false; }
    var cust = deal.customerId ? getCustomer(deal.customerId) : null;
    var core = StuffMigrate.leadCoreValues(state, deal);
    var coreMiss = StuffMigrate.leadCoreMissing(state, deal);
    var coreField = function (key, id, label, input) {
      return '<div class="field core-field' + (coreMiss.indexOf(key) !== -1 ? ' is-missing' : '') + '" data-core="' + key + '"><label for="' + id + '">' + escapeHtml(label) +
        ' <span class="core-missing-tag">missing</span></label>' + input + '</div>';
    };
    var primary = leadPrimaryAction(deal);
    var raws = rawNotesOf(deal);
    var html = '';
    // Summary header (sticky).
    html += '<div class="lead-summary" id="lead-summary">';
    html += '<div class="ls-top"><button type="button" class="ghost drawer-close" id="d-back" aria-label="Close">Close</button>' +
      '<div class="ls-title"><h2>' + escapeHtml(cardTitle(deal)) + '</h2>' +
      (cust ? '<button type="button" class="link-btn crumb-link" id="d-open-customer">Customer: ' + escapeHtml(cust.name) + '</button>' : '') + '</div>' +
      (primary ? '<button type="button" id="ls-primary" class="ls-primary">' + escapeHtml(primary.label) + '</button>' : '') +
      '<div class="ls-menu-wrap"><button type="button" class="ghost ls-more" id="ls-menu-btn" aria-haspopup="true" aria-expanded="false" aria-label="More actions">&middot;&middot;&middot;</button>' +
      '<div class="ls-menu" id="ls-menu" role="menu" hidden>' +
      '<button type="button" role="menuitem" id="d-log">Log a call, meeting or note</button>' +
      '<button type="button" role="menuitem" id="ls-original">Show original' + (raws.length ? ' (' + raws.length + ')' : '') + '</button>' +
      '<button type="button" role="menuitem" id="ls-squid">Partner value</button>' +
      (isAdmin() ? '<button type="button" role="menuitem" class="danger-text" id="d-delete">Delete lead</button>' : '<span class="ls-menu-note">Delete is Admin only</span>') +
      '</div></div></div>';
    html += '<div class="ls-facts">' + leadSummaryFactsHtml(deal, core) + '</div>';
    html += '<div class="lead-tabs" role="tablist" aria-label="Lead sections">' + LEAD_TABS.map(function (t) {
      return '<button type="button" role="tab" data-lead-tab="' + t[0] + '" id="lt-' + t[0] + '" aria-controls="lp-' + t[0] + '">' + t[1] +
        (t[0] === 'files' ? ' <span class="tab-count"></span>' : '') + '</button>';
    }).join('') + '</div>';
    html += '</div>';
    if (deal.coverFileId) html += '<div id="d-cover-root"></div>';

    html += '<form id="detail-form">';
    // Overview.
    html += '<div class="lead-panel" data-lead-panel="overview" id="lp-overview" role="tabpanel" aria-labelledby="lt-overview">';
    html += '<div class="core-block" id="d-core"><div class="core-head"><span class="core-title">Core</span><span class="core-count" id="d-core-count"></span></div>';
    html += '<div class="row">' + coreField('company', 'd-company', 'Company', '<input type="text" id="d-company" required />') +
      coreField('stage', 'd-stage', 'Stage', '<select id="d-stage"></select>') + '</div>';
    html += '<div class="row">' +
      coreField('contactName', 'd-core-name', 'Contact', '<input type="text" id="d-core-name" autocomplete="off" data-orig="' + escapeHtml(core.contactName) + '" value="' + escapeHtml(core.contactName) + '" />') +
      coreField('email', 'd-core-email', 'Email', '<input type="email" id="d-core-email" autocomplete="off" data-orig="' + escapeHtml(core.email) + '" value="' + escapeHtml(core.email) + '" />') +
      coreField('phone', 'd-core-phone', 'Phone', '<input type="tel" id="d-core-phone" autocomplete="off" data-orig="' + escapeHtml(core.phone) + '" value="' + escapeHtml(core.phone) + '" />') + '</div>';
    html += '<div class="row">' + coreField('source', 'd-source', 'Source', '<select id="d-source"></select>');
    if (isColdStage(deal.stage)) {
      html += '<div class="field"><label>Next step date</label><input type="hidden" id="d-followup" />' +
        '<div class="muted-note cold-note">Cold leads do not carry follow-ups. Move it to Inbound or Quotes to schedule one.</div></div></div>';
    } else {
      html += coreField('nextFollowUp', 'd-followup', 'Next step date', '<input type="date" id="d-followup" />') + '</div>';
    }
    html += coreField('nextStep', 'd-next-step', 'Next step', '<input type="text" id="d-next-step" data-orig="' + escapeHtml(core.nextStep) + '" value="' + escapeHtml(core.nextStep) + '" placeholder="What happens next" />');
    if (deal.type !== 'internal') html += replyFieldHtml(deal);
    // The value inputs live on the Money tab; the core block shows the total and still flags it missing.
    html += '<div class="field core-field core-value' + (coreMiss.indexOf('value') !== -1 ? ' is-missing' : '') + '" data-core="value"><label>Value <span class="core-missing-tag">missing</span></label>' +
      '<div class="core-value-line"><strong id="d-core-total">' + formatMoney(totalValue({ values: migrateDealValues(deal) })) + '</strong> <button type="button" class="link-btn" id="d-edit-money">Edit on Money</button></div></div>';
    html += '</div>';
    html += '<div class="row"><div class="field"><label for="d-first-contact">First contact</label><input type="date" id="d-first-contact" /></div></div>';
    if (deal.type !== 'internal') html += leadSophHtml(deal);
    var linked = deal.customerId ? linkedContactsForDeal(deal) : [];
    if (linked.length || !deal.customerId) html += '<div class="section-title">Contacts</div><div id="d-contacts-root"></div>';
    else html += '<div id="d-contacts-root"><button type="button" class="add-row" id="d-add-contact-row">+ Contact</button></div>';
    var mtgCount = StuffMigrate.meetingNotesNewestFirst(deal).length;
    html += '<div id="d-meetings-root" class="rec-sections">' + (mtgCount ? '' : '<button type="button" class="add-row" id="d-add-meeting-row">+ Meeting notes</button>') + '</div>';
    if ((deal.checklist || []).length) html += '<div class="section-title">Checklist</div><div id="d-checklist-root" class="rec-sections"></div>';
    html += '<div id="d-sections-root" class="rec-sections"></div>';
    html += '</div>';
    // Files.
    html += '<div class="lead-panel" data-lead-panel="files" id="lp-files" role="tabpanel" aria-labelledby="lt-files" hidden><div id="d-files-root"></div></div>';
    // Activity.
    html += '<div class="lead-panel" data-lead-panel="activity" id="lp-activity" role="tabpanel" aria-labelledby="lt-activity" hidden>';
    html += '<div class="note-add"><textarea id="d-note-text" aria-label="New note" placeholder="Add a note..."></textarea>' +
      '<button type="button" class="ghost" id="d-add-note">Add note</button></div>';
    html += tldrStripHtml(deal);
    html += '<ul class="notes-list" id="d-notes-list"></ul>';
    html += '<div id="d-comms-root" class="rec-sections"></div>';
    html += '<div id="d-history-root"></div>';
    html += '</div>';
    // Money.
    var shownKeys = moneyKeysFor(deal);
    var labels = { designDfm: 'Design/DFM ($)', prototyping: 'Prototyping ($)', tooling: 'Tooling ($)', productionArr: 'Production ARR ($)', currentPo: 'Current PO ($)', partnerServices: 'Partner Services ($)' };
    var vals0 = migrateDealValues(deal);
    var estimate = StuffMigrate.isArrEstimated(deal);
    html += '<div class="lead-panel" data-lead-panel="money" id="lp-money" role="tabpanel" aria-labelledby="lt-money" hidden>';
    html += '<div class="row values-grid">';
    VALUE_KEYS.filter(function (k) { return shownKeys.indexOf(k) !== -1; }).forEach(function (k) {
      var hide = k === 'partnerServices' && !(Number(vals0[k]) > 0) && !leadShowSquid;
      html += '<div class="field" data-money="' + k + '"' + (hide ? ' hidden' : '') + '><label for="d-' + k + '">' + escapeHtml(labels[k] || k) +
        (k === 'productionArr' && estimate ? ' <span class="badge arr-estimate">estimate</span>' : '') + '</label>' +
        '<input type="number" id="d-' + k + '" min="0" step="any" value="0" /></div>';
    });
    html += '</div><p class="totals-line">Total value: <strong id="d-total">$0</strong></p>';
    html += hiddenMoneyLineHtml(deal, shownKeys);
    html += arrControlsHtml(deal);
    if (deal.type !== 'internal') html += '<div class="section-title">Quotes and won</div><div id="d-projects-root"></div>';
    html += '</div>';
    html += '<div class="detail-actions lead-save-bar"><span class="spacer"></span><button type="submit" id="d-save">Save</button></div>';
    html += '</form>';
    root.innerHTML = html;

    if (deal.coverFileId) renderCoverHeader(document.getElementById('d-cover-root'), { ownerType: 'lead', owner: deal });
    var contactsRoot = document.getElementById('d-contacts-root');
    var addContactRow = document.getElementById('d-add-contact-row');
    var showContacts = function (openNew) {
      contactsRoot.outerHTML = '<div class="section-title">Contacts</div><div id="d-contacts-root"></div>';
      renderContactsSection(document.getElementById('d-contacts-root'), { ownerType: 'lead', owner: deal });
      var others = contactsForCustomer(deal.customerId).filter(function (c) { return linkedContactsForDeal(deal).indexOf(c) === -1; });
      if (openNew && !others.length) openContactModal({ customerId: deal.customerId, dealId: deal.id, onDone: function () { renderApp(); } });
    };
    if (addContactRow) addContactRow.addEventListener('click', function () { showContacts(true); });
    else renderContactsSection(contactsRoot, { ownerType: 'lead', owner: deal });
    var meetRoot = document.getElementById('d-meetings-root');
    var addMeet = document.getElementById('d-add-meeting-row');
    if (addMeet) addMeet.addEventListener('click', function () {
      renderMeetingNotes(meetRoot, deal, 'lead');
      var d = meetRoot.querySelector('details.rec-section');
      if (d) d.open = true;
    });
    else renderMeetingNotes(meetRoot, deal, 'lead');
    renderDealChecklist(document.getElementById('d-checklist-root'), deal);
    renderRecordSections(document.getElementById('d-sections-root'), deal, 'lead', { skip: ['sophistication', 'timeline'] });
    renderCommunications(document.getElementById('d-comms-root'), deal);
    renderLeadHistory(document.getElementById('d-history-root'), deal);
    if (document.getElementById('d-projects-root')) renderLeadJobs(document.getElementById('d-projects-root'), deal);

    document.getElementById('d-company').value = deal.company || '';
    fillSourceSelect('d-source', deal.source);
    document.getElementById('d-followup').value = deal.nextFollowUp || '';
    document.getElementById('d-first-contact').value = String(deal.firstContactAt || '').slice(0, 10);
    fillDetailStageSelect(deal.stage);
    VALUE_KEYS.forEach(function (k) { var inp = document.getElementById('d-' + k); if (inp) inp.value = vals0[k] || 0; });
    renderDetailNotes(detailPendingNotes);
    updateDetailTotal();
    renderLeadFiles();
    refreshLeadTabCounts();
    var coreRoot = document.getElementById('d-core');
    refreshCoreMissing();
    coreRoot.addEventListener('input', refreshCoreMissing);
    coreRoot.addEventListener('change', refreshCoreMissing);

    // Header, tabs and menu.
    var openCust = document.getElementById('d-open-customer');
    if (openCust) openCust.addEventListener('click', function () { setActiveCustomers(deal.customerId); });
    document.getElementById('d-back').addEventListener('click', backFromDetail);
    var pb = document.getElementById('ls-primary');
    if (pb) pb.addEventListener('click', function () { primary.run(); });
    root.querySelectorAll('[data-lead-tab]').forEach(function (b) {
      b.addEventListener('click', function () { setLeadTab(b.getAttribute('data-lead-tab')); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var ids = LEAD_TABS.map(function (t) { return t[0]; });
        var i = (ids.indexOf(leadTab) + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length;
        setLeadTab(ids[i]);
        root.querySelector('[data-lead-tab="' + ids[i] + '"]').focus();
      });
    });
    setLeadTab(leadTab);
    var stagePill = document.getElementById('ls-stage');
    stagePill.addEventListener('click', function () {
      setLeadTab('overview');
      var s = document.getElementById('d-stage');
      s.focus();
      if (typeof s.showPicker === 'function') { try { s.showPicker(); } catch (e) {} }
    });
    var addC = document.getElementById('ls-add-contact');
    if (addC) addC.addEventListener('click', function () { setLeadTab('overview'); document.getElementById('d-core-name').focus(); });
    document.getElementById('d-edit-money').addEventListener('click', function () { setLeadTab('money'); var f = document.getElementById('d-designDfm'); if (f) f.focus(); });
    var menuBtn = document.getElementById('ls-menu-btn'), menu = document.getElementById('ls-menu');
    var closeMenu = function () { menu.setAttribute('hidden', ''); menuBtn.setAttribute('aria-expanded', 'false'); };
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.hasAttribute('hidden');
      if (open) { menu.removeAttribute('hidden'); menuBtn.setAttribute('aria-expanded', 'true'); var first = menu.querySelector('button'); if (first) first.focus(); }
      else closeMenu();
    });
    menu.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); menuBtn.focus(); } });
    root.addEventListener('click', function (e) { if (!menu.hasAttribute('hidden') && !e.target.closest('.ls-menu-wrap')) closeMenu(); });
    document.getElementById('d-log').addEventListener('click', function () { closeMenu(); openQuickLog('lead', deal.id); });
    document.getElementById('ls-original').addEventListener('click', function () { closeMenu(); openShowOriginal(deal); });
    document.getElementById('ls-squid').addEventListener('click', function () {
      closeMenu();
      leadShowSquid = true;
      var f = root.querySelector('[data-money="partnerServices"]');
      if (f) f.removeAttribute('hidden');
      setLeadTab('money');
      var inp = document.getElementById('d-partnerServices');
      if (inp) inp.focus();
    });
    var dDel = document.getElementById('d-delete');
    if (dDel) dDel.addEventListener('click', function () { closeMenu(); deleteDealFromDetail(); });
    var soph = document.getElementById('ls-soph');
    if (soph) {
      soph.addEventListener('change', function () {
        var r = StuffMigrate.setSophistication(state, deal, 'lead', soph.value, deal.sophisticationNotes || '', sectionActor());
        if (r.bad.length) { alert(r.bad.join(', ')); return; }
        if (r.changed) { save(); showToast('Sophistication saved'); }
      });
      document.getElementById('ls-soph-info').addEventListener('click', function () {
        var r = document.getElementById('ls-soph-rubric');
        if (r.hasAttribute('hidden')) r.removeAttribute('hidden'); else r.setAttribute('hidden', '');
      });
    }

    // Notes, values, save.
    wireReplyField();
    document.getElementById('d-add-note').addEventListener('click', function () {
      var text = document.getElementById('d-note-text').value.trim();
      if (!text) return;
      detailPendingNotes.push({ id: uid(), text: text, createdAt: nowIso() });
      document.getElementById('d-note-text').value = '';
      renderDetailNotes(detailPendingNotes);
    });
    VALUE_KEYS.forEach(function (k) { var inp = document.getElementById('d-' + k); if (inp) inp.addEventListener('input', updateDetailTotal); });
    document.getElementById('detail-form').addEventListener('submit', function (e) { e.preventDefault(); saveDealFromDetail(); });
  }

  function renderDetail() {
    var root = document.getElementById('detail-root');
    var deal = getDeal(activeDetailId);
    var skuRec = deal ? null : getSku(activeDetailId);
    if (skuRec) { renderSkuEditor(root, skuRec); return; }
    if (activeSkuId) {
      var openSkuRec = getSku(activeSkuId);
      if (deal && openSkuRec) { renderSkuEditor(root, openSkuRec); return; }
      activeSkuId = null;
    }
    if (!deal) {
      root.innerHTML = '<p>Record not found.</p><button type="button" class="ghost" id="d-back-missing">Back to board</button>';
      var bm = document.getElementById('d-back-missing');
      if (bm) bm.addEventListener('click', backFromDetail);
      return;
    }
    ensureDealFiles(deal);
    detailPendingNotes = (deal.notes || []).slice();
    detailPendingFiles = cloneFilesMeta(deal.files);
    if (!isProjectCard(deal)) { renderLeadDetail(root, deal); return; }
    var ent = entityLabel(deal);
    var entLower = entityLabelLower(deal);
    var html = '';
    var cust = deal.customerId ? getCustomer(deal.customerId) : null;
    var isProj = isProjectCard(deal);
    var ownerType = isProj ? 'project' : 'lead';
    html += '<div class="detail-bar">';
    html += '<button type="button" class="ghost drawer-close" id="d-back" aria-label="Close">Close</button>';
    if (isProj && cust) {
      html += '<h2 class="crumbs"><button type="button" class="link-btn" id="d-open-customer">' + escapeHtml(cust.name) + '</button> <span class="crumb-sep">/</span> ' + escapeHtml(cardTitle(deal)) + '</h2>';
    } else {
      html += '<h2>' + escapeHtml(ent) + ': ' + escapeHtml(cardTitle(deal)) + '</h2>';
      if (cust) html += '<button type="button" class="ghost crumb-link" id="d-open-customer">Customer: ' + escapeHtml(cust.name) + '</button>';
    }
    html += '</div>';
    if (!isProj) html += tldrStripHtml(deal);
    html += '<div id="d-cover-root"></div>';
    if (isProj && deal.archived) {
      html += '<p class="board-note visible">Archived project. Its work moved to SKU jobs: ' + (deal.migratedToSkuIds || []).map(function (id) {
        var sk = getSku(id);
        return '<button type="button" class="link-btn" data-open-sku="' + escapeHtml(id) + '">' + escapeHtml(sk ? (sk.code || skuTitle(sk)) : id) + '</button>';
      }).join(', ') + '. Its notes, files and values are kept here for reference.</p>';
    }
    html += '<form id="detail-form">';
    var core = isProj ? null : StuffMigrate.leadCoreValues(state, deal);
    var coreMiss = isProj ? [] : StuffMigrate.leadCoreMissing(state, deal);
    var coreField = function (key, id, label, input) {
      return '<div class="field core-field' + (coreMiss.indexOf(key) !== -1 ? ' is-missing' : '') + '" data-core="' + key + '"><label for="' + id + '">' + escapeHtml(label) +
        ' <span class="core-missing-tag">missing</span></label>' + input + '</div>';
    };
    if (isProj) {
      html += '<div class="row"><div class="field"><label for="d-company">Project name</label><input type="text" id="d-company" required /></div>';
      html += '<div class="field"><label for="d-stage">Stage</label><select id="d-stage"></select></div></div>';
    } else {
      // #50: the core fields, always at the top. Everything else is under Add details.
      html += '<div class="core-block" id="d-core"><div class="core-head"><span class="core-title">Core</span><span class="core-count" id="d-core-count"></span></div>';
      html += '<div class="row">' + coreField('company', 'd-company', 'Company', '<input type="text" id="d-company" required />') +
        coreField('stage', 'd-stage', 'Stage', '<select id="d-stage"></select>') + '</div>';
      html += '<div class="row">' +
        coreField('contactName', 'd-core-name', 'Contact', '<input type="text" id="d-core-name" autocomplete="off" data-orig="' + escapeHtml(core.contactName) + '" value="' + escapeHtml(core.contactName) + '" />') +
        coreField('email', 'd-core-email', 'Email', '<input type="email" id="d-core-email" autocomplete="off" data-orig="' + escapeHtml(core.email) + '" value="' + escapeHtml(core.email) + '" />') +
        coreField('phone', 'd-core-phone', 'Phone', '<input type="tel" id="d-core-phone" autocomplete="off" data-orig="' + escapeHtml(core.phone) + '" value="' + escapeHtml(core.phone) + '" />') + '</div>';
    }
    if (isProj) {
      html += '<div class="row"><div class="field"><label for="d-po">PO number</label><input type="text" id="d-po" /></div>';
      html += '<div class="field"><label for="d-ship">Target ship date</label><input type="date" id="d-ship" /></div>';
      html += '<div class="field"><label for="d-followup">Next follow-up</label><input type="date" id="d-followup" /></div></div>';
      html += '<div class="field"><label for="d-desc">Description</label><textarea id="d-desc" rows="2"></textarea></div>';
      html += '<div class="field" style="display:none"><select id="d-source"></select></div>';
    } else {
      html += '<div class="row">' + coreField('source', 'd-source', 'Source', '<select id="d-source"></select>');
      if (isColdStage(deal.stage)) {
        html += '<div class="field"><label>Next step date</label><input type="hidden" id="d-followup" />' +
          '<div class="muted-note cold-note">Cold leads do not carry follow-ups. Move it to Inbound or Quotes to schedule one.</div></div></div>';
      } else {
        html += coreField('nextFollowUp', 'd-followup', 'Next step date', '<input type="date" id="d-followup" />') + '</div>';
      }
      html += coreField('nextStep', 'd-next-step', 'Next step', '<input type="text" id="d-next-step" data-orig="' + escapeHtml(core.nextStep) + '" value="' + escapeHtml(core.nextStep) + '" placeholder="What happens next" />');
      if (deal.type !== 'internal') html += replyFieldHtml(deal);
      html += '<div id="d-core-value"></div></div>';
      // #16: when the lead first reached out (not when the card was made).
      html += '<div class="row"><div class="field"><label for="d-first-contact">First contact</label><input type="date" id="d-first-contact" /></div></div>';
    }
    html += '<div class="section-title">Contacts</div>';
    html += '<div id="d-contacts-root"></div>';
    if (isProj) {
      html += '<div class="section-title">Tasks</div><div id="d-tasks-root"></div>';
      html += '<div class="section-title">SKUs</div><div id="d-skus-root"></div>';
    } else if (deal.type !== 'internal') {
      html += '<div class="section-title">Quotes and won</div><div id="d-projects-root"></div>';
    }
    var shownKeys = moneyKeysFor(deal);
    var leadHtml = html;
    html = '';
    html += isProj ? '<div class="section-title">Value</div>' : '';
    html += '<div class="row values-grid">';
    VALUE_KEYS.filter(function (k) { return shownKeys.indexOf(k) !== -1; }).forEach(function (k) {
      var labels = {
        designDfm: 'Design/DFM ($)',
        prototyping: 'Prototyping ($)',
        tooling: 'Tooling ($)',
        productionArr: 'Production ARR ($)',
        currentPo: 'Current PO ($)',
        partnerServices: 'Partner Services ($)'
      };
      html += '<div class="field"><label for="d-' + k + '">' + escapeHtml(labels[k] || k) + '</label>' +
        '<input type="number" id="d-' + k + '" min="0" step="any" value="0" /></div>';
    });
    html += '</div>';
    html += '<p class="totals-line">Total value: <strong id="d-total">$0</strong></p>';
    html += hiddenMoneyLineHtml(deal, shownKeys);
    if (!isProj) html += arrControlsHtml(deal);
    if (isProj) html = leadHtml + html;
    else {
      // Leads: the value grid sits inside the core block, as its Value field.
      var valueField = '<div class="field core-field core-value' + (coreMiss.indexOf('value') !== -1 ? ' is-missing' : '') +
        '" data-core="value"><label>Value <span class="core-missing-tag">missing</span></label>' + html + '</div>';
      html = leadHtml.replace('<div id="d-core-value"></div>', function () { return valueField; });
    }
    html += '<div class="section-title">Notes</div>';
    html += '<div class="note-add"><textarea id="d-note-text" aria-label="New note" placeholder="Add a note..."></textarea>' +
      '<button type="button" class="ghost" id="d-add-note">Add note</button></div>';
    html += '<ul class="notes-list" id="d-notes-list"></ul>';
    if (!isProj) html += '<div class="section-title">Communications</div><div id="d-comms-root" class="rec-sections"></div>';
    if (!isProj && (deal.checklist || []).length) html += '<div class="section-title">Checklist</div><div id="d-checklist-root" class="rec-sections"></div>';
    if (!isProj) html += '<div class="section-title">Meeting notes</div><div id="d-meetings-root" class="rec-sections"></div>';
    if (!isProj) html += '<div id="d-sections-root" class="rec-sections"></div>';
    html += '<div class="section-title">Files</div>';
    html += '<div id="d-files-root"></div>';
    html += '<div class="detail-actions">';
    if (isProj && deal.archived) {
      html += '<span class="muted-note">Archived projects are read only. Edit the SKU jobs instead.</span>';
    } else {
      if (isAdmin()) {
        html += '<button type="button" class="danger" id="d-delete">Delete ' + escapeHtml(entLower) + '</button>';
      } else {
        html += '<span class="muted-note">Delete is Admin only</span>';
      }
      html += '<span class="spacer"></span>';
      html += '<button type="button" class="secondary" id="d-log" title="Log a call, meeting or note">Log</button>';
      html += '<button type="submit" id="d-save">Save</button>';
    }
    html += '</div></form>';
    root.innerHTML = html;

    renderCoverHeader(document.getElementById('d-cover-root'), { ownerType: ownerType, owner: deal });
    renderContactsSection(document.getElementById('d-contacts-root'), { ownerType: ownerType, owner: deal });
    if (!isProj) renderCommunications(document.getElementById('d-comms-root'), deal);
    if (!isProj) renderDealChecklist(document.getElementById('d-checklist-root'), deal);
    if (!isProj) renderMeetingNotes(document.getElementById('d-meetings-root'), deal, 'lead');
    if (!isProj) renderRecordSections(document.getElementById('d-sections-root'), deal, 'lead');
    var openCust = document.getElementById('d-open-customer');
    if (openCust) openCust.addEventListener('click', function () { setActiveCustomers(deal.customerId); });
    if (isProj) {
      renderProjectTasks(document.getElementById('d-tasks-root'), deal);
      renderProjectSkus(document.getElementById('d-skus-root'), deal);
      document.getElementById('d-po').value = deal.poNumber || '';
      document.getElementById('d-ship').value = deal.targetShipDate || '';
      document.getElementById('d-desc').value = deal.description || '';
    } else if (document.getElementById('d-projects-root')) {
      renderLeadJobs(document.getElementById('d-projects-root'), deal);
    }
    root.querySelectorAll('[data-open-sku]').forEach(function (b) { b.addEventListener('click', function () { openDetail(b.getAttribute('data-open-sku')); }); });

    document.getElementById('d-company').value = isProj ? (deal.name || '') : (deal.company || '');
    fillSourceSelect('d-source', deal.source);
    document.getElementById('d-followup').value = deal.nextFollowUp || '';
    var fcIn = document.getElementById('d-first-contact');
    if (fcIn) fcIn.value = String(deal.firstContactAt || '').slice(0, 10);
    fillDetailStageSelect(deal.stage);
    var vals = migrateDealValues(deal);
    VALUE_KEYS.forEach(function (k) {
      var inp = document.getElementById('d-' + k);
      if (inp) inp.value = vals[k] || 0;
    });
    renderDetailNotes(detailPendingNotes);
    updateDetailTotal();
    renderDetailFiles();
    var coreRoot = document.getElementById('d-core');
    if (coreRoot) {
      refreshCoreMissing();
      coreRoot.addEventListener('input', refreshCoreMissing);
      coreRoot.addEventListener('change', refreshCoreMissing);
    }

    document.getElementById('d-back').addEventListener('click', backFromDetail);
    wireReplyField();
    document.getElementById('d-add-note').addEventListener('click', function () {
      var text = document.getElementById('d-note-text').value.trim();
      if (!text) return;
      detailPendingNotes.push({ id: uid(), text: text, createdAt: nowIso() });
      document.getElementById('d-note-text').value = '';
      renderDetailNotes(detailPendingNotes);
    });
    VALUE_KEYS.forEach(function (k) {
      var inp = document.getElementById('d-' + k);
      if (inp) inp.addEventListener('input', updateDetailTotal);
    });
    document.getElementById('detail-form').addEventListener('submit', function (e) {
      e.preventDefault();
      saveDealFromDetail();
    });
    var dDel = document.getElementById('d-delete');
    if (dDel) dDel.addEventListener('click', function () {
      deleteDealFromDetail();
    });
    var dLog = document.getElementById('d-log');
    if (dLog) dLog.addEventListener('click', function () { openQuickLog(isProj ? 'project' : 'lead', deal.id); });
  }

  // #50: the core block marks empty fields as missing while typing. Cold leads skip the next step.
  function refreshCoreMissing() {
    var coreRoot = document.getElementById('d-core');
    if (!coreRoot) return;
    var deal = getDeal(activeDetailId);
    var stageSel = document.getElementById('d-stage');
    var cold = isColdStage(stageSel ? stageSel.value : deal && deal.stage);
    var checked = deal && StuffMigrate.isActiveLead(Object.assign({}, deal, { stage: stageSel ? stageSel.value : deal.stage }));
    var count = 0;
    coreRoot.querySelectorAll('[data-core]').forEach(function (f) {
      var key = f.getAttribute('data-core');
      var empty;
      if (key === 'value') {
        var sum = 0;
        VALUE_KEYS.forEach(function (k) { var el = document.getElementById('d-' + k); if (el) sum += Number(el.value) || 0; });
        empty = !(sum > 0);
      } else {
        var input = f.querySelector('input, select');
        empty = !input || !String(input.value || '').trim();
      }
      if (cold && (key === 'nextStep' || key === 'nextFollowUp')) empty = false;
      if (!checked) empty = false;
      f.classList.toggle('is-missing', empty);
      if (empty) count += 1;
    });
    var cnt = document.getElementById('d-core-count');
    if (cnt) cnt.textContent = count ? count + ' missing' : '';
  }

  // #50: save the core next step (openItems.nextStep) and the primary contact fields. Only fields
  // the user changed in this form are written, so edits made elsewhere are not overwritten.
  function saveCoreFromDetail(deal) {
    saveReplyFromDetail(deal);
    var ns = document.getElementById('d-next-step');
    if (ns && ns.value.trim() !== (ns.getAttribute('data-orig') || '')) {
      StuffMigrate.setRecordSection(state, deal, 'lead', 'openItems', { nextStep: ns.value }, sectionActor());
    }
    var keys = ['name', 'email', 'phone'], vals = {}, changed = [];
    keys.forEach(function (k) {
      var el = document.getElementById('d-core-' + k);
      if (!el) return;
      vals[k] = el.value.trim();
      if (vals[k] !== (el.getAttribute('data-orig') || '')) changed.push(k);
    });
    if (!changed.length || deal.type === 'internal') return;
    var c = primaryContactFor(deal);
    if (c) {
      changed.forEach(function (k) { if (k !== 'name' || vals.name) c[k] = vals[k]; });
      c.updatedAt = nowIso();
      logChange('update', 'contact', c.id, c.name + ': ' + changed.join(', ') + ' updated from the lead core fields');
      return;
    }
    if (!vals.name && !vals.email && !vals.phone) return;
    var cust = ensureDealCustomer(deal);
    if (!cust) return;
    c = StuffMigrate.createContact(state, cust.id, { name: vals.name, email: vals.email, phone: vals.phone }, nowIso());
    if (!Array.isArray(deal.contactIds)) deal.contactIds = [];
    deal.contactIds.push(c.id);
    if (!deal.primaryContactId) deal.primaryContactId = c.id;
    logChange('create', 'contact', c.id, 'Added ' + c.name + ' on ' + cust.name + ' from the lead core fields');
  }

  function saveDealFromDetail() {
    var deal = getDeal(activeDetailId);
    if (!deal) return;
    if (isProjectCard(deal) && deal.archived) return;
    var company = document.getElementById('d-company').value.trim();
    if (!company) {
      alert('Company is required.');
      return;
    }
    var t = nowIso();
    var prevStage = deal.stage;
    var newStage = document.getElementById('d-stage').value;
    var newSec = sectionForStage(newStage);
    if (isProjectCard(deal)) {
      if (newSec && !isProjectArea(newSec.area)) { alert('Projects cannot move back to CRM.'); return; }
      deal.name = company;
      deal.title = company;
      deal.poNumber = document.getElementById('d-po').value.trim();
      deal.targetShipDate = document.getElementById('d-ship').value || null;
      deal.description = document.getElementById('d-desc').value.trim();
      setDealStage(deal, newStage);
      deal.status = StuffMigrate.projectStatusFor(StuffMigrate.sectionAreaForStage(state, newStage));
    } else {
      if (newSec && isProjectArea(newSec.area) && newStage !== prevStage && deal.type !== 'internal') {
        if (isConvertedLead(deal)) { alert('This lead is already won. Its work runs as SKU jobs.'); return; }
        openWonModal({ leadId: deal.id, stage: newStage });
        return;
      }
      if (needsLostReason(deal, newStage)) { openLostReasonModal(deal, saveDealFromDetail); return; }
      var fuEl = document.getElementById('d-followup');
      if (needsNextStepOnMove(deal, newStage, fuEl && fuEl.value)) {
        openNextStepModal(deal, newStage, function (date, text) {
          if (fuEl) fuEl.value = date;
          var nsEl = document.getElementById('d-next-step');
          if (nsEl && text) nsEl.value = text;
          saveDealFromDetail();
        });
        return;
      }
      deal.company = company;
      deal.source = normalizeSource(document.getElementById('d-source').value);
      setDealStage(deal, newStage);
      syncDealCustomerName(deal);
      saveCoreFromDetail(deal);
    }
    var vals = Object.assign(emptyValues(), migrateDealValues(deal)); // hidden fields keep their values
    VALUE_KEYS.forEach(function (k) {
      var el = document.getElementById('d-' + k);
      if (el) vals[k] = Number(el.value) || 0;
    });
    deal.values = vals;
    delete deal.arr;
    delete deal.oneShot;
    if (!isProjectCard(deal)) saveArrControls(deal);
    var fu = document.getElementById('d-followup').value;
    deal.nextFollowUp = isColdStage(deal.stage) ? null : (fu || null);
    var fcEl = document.getElementById('d-first-contact');
    if (fcEl) {
      var fcNew = fcEl.value, fcOld = String(deal.firstContactAt || '').slice(0, 10);
      if (fcNew !== fcOld) {
        if (fcNew) deal.firstContactAt = fcNew; else delete deal.firstContactAt;
        logChange('update', 'lead', deal.id, 'First contact ' + (fcOld || 'none') + ' to ' + (fcNew || 'none'));
      }
    }
    deal.notes = detailPendingNotes.slice();
    deal.files = cloneFilesMeta(detailPendingFiles);
    deal.updatedAt = t;
    deal.lastActivityAt = t;
    deal.customerActivityAt = t; // a person saved the lead: real activity for the ARR 45-day rule (#102)
    if (!deal.timeline) deal.timeline = [];
    if (!deal.title) deal.title = deal.company;
    logChange('update', isProjectCard(deal) ? 'project' : 'lead', deal.id, 'Saved from detail' + (prevStage !== deal.stage ? ', stage ' + prevStage + ' to ' + deal.stage : ''));
    save();
    var owner = sectionForStage(deal.stage);
    if (owner) {
      activeBoardId = owner.id;
      activeArea = owner.area || 'crm';
      persistActiveSection();
    }
    renderApp();
  }

  function deleteDealFromDetail() {
    if (!activeDetailId) return;
    if (!requireAdmin('delete a ' + (getDeal(activeDetailId) ? entityLabelLower(getDeal(activeDetailId)) : 'deal'))) return;
    var deal = getDeal(activeDetailId);
    var delLabel = deal ? entityLabelLower(deal) : 'deal';
    if (!confirm('Delete this ' + delLabel + '? This cannot be undone.')) return;
    var files = deal ? deal.files : null;
    var id = activeDetailId;
    takeSnapshot('before-delete-' + id);
    removeCardRecord(id);
    logChange('delete', isProjectCard(deal) ? 'project' : 'lead', id, 'Deleted from detail');
    save();
    deleteAllDealBlobs(files).then(function () {
      backFromDetail();
    });
  }

  function goOpenFromModal() {
    if (!editingId) return;
    var id = editingId;
    closeModal();
    openDetail(id);
  }

  function readFormValues() {
    var o = emptyValues();
    VALUE_KEYS.forEach(function (k) {
      var el = document.getElementById('f-' + k);
      o[k] = el ? (Number(el.value) || 0) : 0;
    });
    return o;
  }

  function updateTotalDisplay() {
    document.getElementById('f-total').textContent = formatMoney(totalValue({ values: readFormValues() }));
  }

  function renderNotesList(notes) {
    const list = document.getElementById('notes-list');
    const sorted = (notes || []).slice().sort(function (a, b) {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    if (!sorted.length) {
      list.innerHTML = '<li style="color:var(--muted)">No notes yet.</li>';
      return;
    }
    list.innerHTML = sorted.map(noteItemHtml).join('');
  }

  function openModal(id) {
    editingId = id || null;
    pendingNotes = [];
    pendingFiles = emptyFiles();
    const form = document.getElementById('deal-form');
    form.reset();
    document.getElementById('f-note-text').value = '';
    var openBtn = document.getElementById('btn-modal-open');
    var openBtnFoot = document.getElementById('btn-modal-open-footer');

    if (id) {
      const deal = getDeal(id);
      if (!deal) return;
      ensureDealFiles(deal);
      document.getElementById('modal-title').textContent = 'Edit ' + entityLabelLower(deal);
      var strip = document.getElementById('modal-tldr');
      if (strip) strip.innerHTML = isProjectCard(deal) ? '' : tldrStripHtml(deal);
      fillStageSelect(deal.stage);
      document.getElementById('f-company').value = isProjectCard(deal) ? (deal.name || '') : (deal.company || '');
      document.querySelector('label[for="f-company"]').textContent = isProjectCard(deal) ? 'Project name (' + customerNameFor(deal) + ')' : 'Company';
      var pcm = primaryContactFor(deal);
      document.getElementById('f-contact').value = pcm ? (pcm.name || '') : '';
      fillSourceSelect('f-source', deal.source);
      document.getElementById('f-email').value = pcm ? (pcm.email || '') : '';
      document.getElementById('f-phone').value = pcm ? (pcm.phone || '') : '';
      document.getElementById('f-stage').value = deal.stage || defaultStageForSection(currentSection());
      var vals = migrateDealValues(deal);
      VALUE_KEYS.forEach(function (k) {
        document.getElementById('f-' + k).value = vals[k] || 0;
      });
      document.getElementById('f-followup').value = deal.nextFollowUp || '';
      pendingNotes = (deal.notes || []).slice();
      pendingFiles = cloneFilesMeta(deal.files);
      document.getElementById('btn-delete').style.display = isAdmin() ? '' : 'none';
      if (openBtn) openBtn.style.display = '';
      if (openBtnFoot) openBtnFoot.style.display = '';
    } else {
      document.getElementById('modal-title').textContent = 'Add ' + entityLabelLower(currentSection());
      var stripNew = document.getElementById('modal-tldr');
      if (stripNew) stripNew.innerHTML = '';
      document.querySelector('label[for="f-company"]').textContent = 'Company';
      fillStageSelect(defaultStageForSection(currentSection()));
      fillSourceSelect('f-source', '');
      document.getElementById('f-stage').value = defaultStageForSection(currentSection());
      VALUE_KEYS.forEach(function (k) {
        document.getElementById('f-' + k).value = 0;
      });
      pendingNotes = [];
      pendingFiles = emptyFiles();
      document.getElementById('btn-delete').style.display = 'none';
      if (openBtn) openBtn.style.display = 'none';
      if (openBtnFoot) openBtnFoot.style.display = 'none';
    }
    renderNotesList(pendingNotes);
    renderModalFiles();
    updateTotalDisplay();
    // #3: no progress bar; the card face shows ARR and Pre-production value instead.
    var progRoot = document.getElementById('modal-progress-root');
    if (progRoot) progRoot.innerHTML = '';
    document.getElementById('modal-backdrop').classList.add('open');
  }

  function closeModal() {
    document.getElementById('modal-backdrop').classList.remove('open');
    editingId = null;
    pendingNotes = [];
    pendingFiles = null;
  }

  function collectFormDeal(base) {
    const t = nowIso();
    const deal = base || {
      id: uid(),
      timeline: [],
      createdAt: t,
      notes: [],
      files: emptyFiles()
    };
    deal.company = document.getElementById('f-company').value.trim();
    deal.source = normalizeSource(document.getElementById('f-source').value);
    setDealStage(deal, document.getElementById('f-stage').value);
    // Quick modal keeps its three contact inputs; they read and write the primary contact.
    deal._pendingPrimaryContact = {
      name: document.getElementById('f-contact').value.trim(),
      email: document.getElementById('f-email').value.trim(),
      phone: document.getElementById('f-phone').value.trim()
    };
    if (!deal.stageEnteredAt) deal.stageEnteredAt = t;
    deal.values = readFormValues();
    delete deal.arr;
    delete deal.oneShot;
    const fu = document.getElementById('f-followup').value;
    deal.nextFollowUp = isColdStage(deal.stage) ? null : (fu || null);
    deal.notes = pendingNotes.slice();
    deal.files = cloneFilesMeta(pendingFiles || deal.files || emptyFiles());
    deal.updatedAt = t;
    deal.lastActivityAt = t;
    if (!deal.timeline) deal.timeline = [];
    if (!deal.title) deal.title = deal.company;
    return deal;
  }

  function saveDealFromForm() {
    const company = document.getElementById('f-company').value.trim();
    if (!company) {
      alert('Company is required.');
      return;
    }
    var saved;
    var isNew = !editingId;
    var chosenStage = document.getElementById('f-stage').value;
    var chosenSec = sectionForStage(chosenStage);
    if (editingId) {
      var editing = getDeal(editingId);
      if (!editing) return;
      if (!isProjectCard(editing) && editing.type !== 'internal' && chosenSec && isProjectArea(chosenSec.area) && editing.stage !== chosenStage) {
        closeModal();
        openWonModal({ leadId: editing.id, stage: chosenStage });
        return;
      }
      if (needsLostReason(editing, chosenStage)) { openLostReasonModal(editing, saveDealFromForm); return; }
      var ffEl = document.getElementById('f-followup');
      if (!isProjectCard(editing) && needsNextStepOnMove(editing, chosenStage, ffEl && ffEl.value)) {
        openNextStepModal(editing, chosenStage, function (date, text) {
          if (ffEl) ffEl.value = date;
          if (text) StuffMigrate.setRecordSection(state, editing, 'lead', 'openItems', { nextStep: text }, sectionActor());
          saveDealFromForm();
        });
        return;
      }
      if (isProjectCard(editing) && chosenSec && !isProjectArea(chosenSec.area)) {
        alert('Projects cannot move back to CRM.');
        return;
      }
      collectFormDeal(editing);
      saved = editing;
    } else {
      if (chosenSec && isProjectArea(chosenSec.area) && stageKind(chosenStage) !== 'internal') {
        closeModal();
        openAddSkuModal({ stage: stageKind(chosenStage) === 'sku' ? chosenStage : undefined });
        return;
      }
      saved = collectFormDeal(null);
      saved.kind = 'lead';
      state.deals.push(saved);
    }
    if (isProjectCard(saved)) {
      delete saved._pendingPrimaryContact;
      saved.name = saved.company;
      saved.company = customerNameFor(saved);
      saved.title = saved.name;
      saved.status = StuffMigrate.projectStatusFor(StuffMigrate.sectionAreaForStage(state, saved.stage));
    } else {
      applyPendingPrimaryContact(saved);
    }
    logChange(isNew ? 'create' : 'update', isProjectCard(saved) ? 'project' : 'lead', saved.id, (isNew ? 'Added ' : 'Saved ') + cardTitle(saved) + ' on ' + saved.stage);
    save();
    closeModal();
    // If deal moved to another section, switch tab so the user sees it
    var owner = sectionForStage(saved.stage);
    if (owner && owner.id !== activeBoardId) {
      // For lost (cold-leads only), stay on current section if it owns lost
      var cur = currentSection();
      if ((cur.stages || []).indexOf(saved.stage) === -1) {
        activeBoardId = owner.id;
        persistActiveSection();
      }
    }
    renderApp();
  }

  function addNote() {
    const text = document.getElementById('f-note-text').value.trim();
    if (!text) return;
    pendingNotes.push({
      id: uid(),
      text: text,
      createdAt: nowIso()
    });
    document.getElementById('f-note-text').value = '';
    renderNotesList(pendingNotes);
  }

  function deleteDeal() {
    if (!editingId) return;
    if (!requireAdmin('delete a deal')) return;
    var deal = getDeal(editingId);
    var delLabel = deal ? entityLabelLower(deal) : 'deal';
    if (!confirm('Delete this ' + delLabel + '? This cannot be undone.')) return;
    var files = deal ? deal.files : null;
    var id = editingId;
    takeSnapshot('before-delete-' + id);
    removeCardRecord(id);
    logChange('delete', isProjectCard(deal) ? 'project' : 'lead', id, 'Deleted from quick modal');
    save();
    closeModal();
    if (activeDetailId === id) {
      activeDetailId = null;
      activeView = 'board';
    }
    deleteAllDealBlobs(files);
    renderApp();
  }

  function exportJson() {
    save();
    var payload = Object.assign({}, state, { schemaVersion: 12, exportedAt: nowIso(), exportedBy: currentUserName() });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matrix-matrix-export-' + todayStr() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importJson(file) {
    if (!file) return;
    if (!confirm('Import will replace all current Matrix data. Continue?')) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.deals)) {
          alert('Invalid Matrix JSON. Expected an object with a deals array.');
          return;
        }
        takeSnapshot('before-import');
        state = normalizeState(parsed);
        logChange('import', 'state', null, 'Imported ' + (file.name || 'file') + ' (v' + (parsed.version || parsed.schemaVersion || '?') + ', ' + state.deals.length + ' deals)');
        save();
        if (!sectionList().some(function (s) { return s.id === activeBoardId; })) {
          activeBoardId = sectionList()[0] ? sectionList()[0].id : 'cold-leads';
          persistActiveSection();
        }
        renderApp();
      } catch (e) {
        console.error(e);
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  }

  var btnHeaderTasks = document.getElementById('btn-header-tasks');
  if (btnHeaderTasks) {
    btnHeaderTasks.addEventListener('click', function () {
      setActiveTasks();
    });
  }
  document.getElementById('btn-add').addEventListener('click', function () {
    var sec = currentSection();
    var first = sec ? defaultStageForSection(sec) : null;
    var kind = first ? stageKind(first) : null;
    if (sec && isProjectArea(sec.area) && kind === 'po-line') openPoModal({});
    else if (sec && isProjectArea(sec.area) && kind !== 'internal') openAddSkuModal({ stage: kind === 'sku' ? first : undefined });
    else openModal(null);
  });
  document.getElementById('btn-show-converted').addEventListener('click', function () {
    showConvertedLeads = !showConvertedLeads;
    renderApp();
  });
  document.getElementById('btn-edit-stages').addEventListener('click', function () {
    toggleStagesEditMode();
  });
  var btnEditMenu = document.getElementById('btn-edit-menu');
  if (btnEditMenu) btnEditMenu.addEventListener('click', function () {
    toggleMenuEditMode();
  });
  document.getElementById('btn-export').addEventListener('click', exportJson);
  document.getElementById('btn-import').addEventListener('click', function () {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0];
    importJson(file);
    e.target.value = '';
  });
  document.getElementById('btn-cancel').addEventListener('click', closeModal);
  document.getElementById('btn-delete').addEventListener('click', deleteDeal);
  document.getElementById('btn-add-note').addEventListener('click', addNote);
  var btnModalOpen = document.getElementById('btn-modal-open');
  if (btnModalOpen) btnModalOpen.addEventListener('click', goOpenFromModal);
  var btnModalOpenFoot = document.getElementById('btn-modal-open-footer');
  if (btnModalOpenFoot) btnModalOpenFoot.addEventListener('click', goOpenFromModal);
  document.getElementById('deal-form').addEventListener('submit', function (e) {
    e.preventDefault();
    saveDealFromForm();
  });
  VALUE_KEYS.forEach(function (k) {
    document.getElementById('f-' + k).addEventListener('input', updateTotalDisplay);
  });
  document.getElementById('modal-backdrop').addEventListener('click', function (e) {
    if (e.target === document.getElementById('modal-backdrop')) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('modal-backdrop').classList.contains('open')) {
      closeModal();
    }
  });


  // =====================================================================
  // v12: auth stub, change log, time machine, bot proposals, kill switch
  // =====================================================================

  var auth = { provider: (window.MatrixCloud ? 'google' : 'stub'), signedIn: !window.MatrixCloud, user: { name: window.MatrixCloud ? '' : 'Demo Owner', email: window.MatrixCloud ? '' : 'you@example.com' }, role: 'admin' };

  function loadAuth() {
    try {
      var raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') auth = Object.assign(auth, parsed);
      }
    } catch (e) { /* keep default */ }
    if (auth.role !== 'admin' && auth.role !== 'user') auth.role = 'admin';
  }

  function saveAuth() {
    try { localStorage.setItem(AUTH_KEY, JSON.stringify(auth)); } catch (e) { /* ignore */ }
  }

  function isAdmin() { return auth.role === 'admin'; }

  function currentUserName() { return (auth.user && auth.user.name) || 'user'; }

  function requireAdmin(actionLabel) {
    if (isAdmin()) return true;
    alert('Only an Admin can ' + actionLabel + '. Ask Owner.');
    return false;
  }

  function applyRoleToChrome() {
    var chip = document.getElementById('role-chip');
    if (chip) {
      chip.textContent = isAdmin() ? 'Admin' : 'User';
      chip.classList.toggle('role-user', !isAdmin());
    }
    var es = document.getElementById('btn-edit-stages');
    var em = document.getElementById('btn-edit-menu');
    if (es) es.style.display = isAdmin() ? '' : 'none';
    if (em) em.style.display = isAdmin() ? '' : 'none';
    var ab = document.getElementById('btn-header-admin');
    if (ab) ab.classList.toggle('active', activeView === 'admin');
    // The board "..." button only shows when at least one of its items applies here.
    var bm = document.getElementById('btn-board-menu');
    if (bm) {
      var any = Array.prototype.some.call(document.querySelectorAll('#board-menu .pop-item'), function (b) { return b.style.display !== 'none'; });
      bm.style.display = any ? '' : 'none';
    }
  }

  // Google sign-in via MatrixCloud (Firebase Auth) when present.
  function signInWithGoogleStub() {
    if (window.MatrixCloud) {
      if (auth.signedIn && window.MatrixCloud.signOut) {
        window.MatrixCloud.signOut();
        return;
      }
      if (window.MatrixCloud.signIn) {
        window.MatrixCloud.signIn();
        return;
      }
    }
    alert('Google sign-in is not available in this build (' + currentUserName() + ', ' + auth.role + ').');
  }

  var CHANGE_LOG_CAP = 500;

  function logChange(action, entityType, entityId, detail, source) {
    if (!state) return;
    if (!Array.isArray(state.changeLog)) state.changeLog = [];
    state.changeLog.push({
      id: StuffMigrate.makeId('chg'),
      at: nowIso(),
      who: source === 'bot' ? (detail && detail.bot) || 'bot' : currentUserName(),
      source: source || 'human',
      action: action,
      entityType: entityType,
      entityId: entityId || null,
      detail: typeof detail === 'string' ? detail : JSON.stringify(detail || '')
    });
    if (state.changeLog.length > CHANGE_LOG_CAP) {
      state.changeLog = state.changeLog.slice(state.changeLog.length - CHANGE_LOG_CAP);
    }
  }

  var SNAPSHOT_CAP = 10;

  function listSnapshots() {
    try {
      var raw = localStorage.getItem(SNAPSHOT_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function writeSnapshots(list) {
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      // Storage full: drop oldest and retry once.
      if (list.length > 1) {
        try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(list.slice(1))); return true; } catch (e2) { /* give up */ }
      }
      return false;
    }
  }

  function takeSnapshotRaw(label, rawJson) {
    var list = listSnapshots();
    list.push({ id: StuffMigrate.makeId('snap'), at: nowIso(), label: label || 'manual', by: currentUserName(), size: rawJson.length, json: rawJson });
    while (list.length > SNAPSHOT_CAP) list.shift();
    return writeSnapshots(list);
  }

  function takeSnapshot(label) {
    if (!state) return false;
    return takeSnapshotRaw(label, JSON.stringify(state));
  }

  function restoreSnapshot(snapId) {
    if (!requireAdmin('restore from the time machine')) return;
    var snap = listSnapshots().find(function (x) { return x.id === snapId; });
    if (!snap) return;
    if (!confirm('Restore snapshot "' + snap.label + '" from ' + new Date(snap.at).toLocaleString() + '? Current data is snapshotted first.')) return;
    takeSnapshot('before-restore');
    try {
      var parsed = JSON.parse(snap.json);
      state = normalizeState(parsed);
      logChange('restore', 'state', snap.id, 'Restored snapshot ' + snap.label);
      save();
      renderApp();
    } catch (e) {
      alert('Snapshot could not be parsed.');
    }
  }

  // Bot proposal queue. Bots never write state directly; they propose, a human applies.
  function botWritesFrozen() {
    return !!(state && state.settings && state.settings.botWritesFrozen);
  }

  function addProposal(p) {
    if (!state) return null;
    if (!Array.isArray(state.proposals)) state.proposals = [];
    if (botWritesFrozen()) {
      logChange('proposal-rejected', 'proposal', null, 'Kill switch on: rejected proposal from ' + (p.bot || 'bot'), 'bot');
      save();
      return null;
    }
    var prop = {
      id: StuffMigrate.makeId('prp'),
      at: nowIso(),
      bot: p.bot || 'bot',
      action: p.action || 'note',
      entityType: p.entityType || 'lead',
      entityId: p.entityId || null,
      payload: p.payload || {},
      summary: p.summary || '',
      status: 'pending',
      resolvedAt: null,
      resolvedBy: null
    };
    state.proposals.push(prop);
    logChange('proposal', 'proposal', prop.id, prop.bot + ': ' + prop.summary, 'bot');
    save();
    if (activeView === 'admin') renderAdmin();
    return prop.id;
  }

  // Supported proposal actions in Phase 1: add-note, set-stage, set-follow-up.
  function applyProposal(id, li) {
    var prop = (state.proposals || []).find(function (x) { return x.id === id; });
    if (!prop || prop.status !== 'pending') return;
    if (prop.action === 'po-upsert') { applyPoUploadProposal(prop, li); return; }
    if (prop.action === 'lead-upsert') { applyLeadImportProposal(prop, li); return; }
    if (prop.action === 'set-field') {
      // Enrichment conflict: Owner picks the proposed value over the current one.
      if (!StuffMigrate.applyFieldProposal(state, prop, (auth.user && auth.user.email) || currentUserName())) {
        alert('This record or field no longer exists. Reject the proposal instead.');
        return;
      }
      if (prop.entityType === 'lead' && prop.payload.field === 'company') syncDealCustomerName(getDeal(prop.entityId));
      prop.status = 'applied';
      prop.resolvedAt = nowIso();
      prop.resolvedBy = currentUserName();
      save();
      renderAdmin();
      return;
    }
    var deal = prop.entityType === 'lead' ? getDeal(prop.entityId) : null;
    var ok = false;
    if (deal && prop.action === 'add-note') {
      deal.notes = deal.notes || [];
      deal.notes.push({ id: uid(), text: String(prop.payload.text || ''), createdAt: nowIso(), source: prop.bot });
      ok = true;
    } else if (deal && prop.action === 'set-stage' && prop.payload.stage && sectionForStage(prop.payload.stage)) {
      setDealStage(deal, prop.payload.stage);
      runStageRules(deal);
      ok = true;
    } else if (deal && prop.action === 'set-follow-up') {
      deal.nextFollowUp = prop.payload.date || null;
      ok = true;
    }
    if (!ok) {
      alert('This proposal type cannot be applied automatically yet. Apply it by hand, then reject it here.');
      return;
    }
    deal.updatedAt = nowIso();
    prop.status = 'applied';
    prop.resolvedAt = nowIso();
    prop.resolvedBy = currentUserName();
    logChange('proposal-applied', prop.entityType, prop.entityId, prop.bot + ': ' + prop.summary);
    save();
    renderAdmin();
  }

  function rejectProposal(id) {
    var prop = (state.proposals || []).find(function (x) { return x.id === id; });
    if (!prop || prop.status !== 'pending') return;
    prop.status = 'rejected';
    prop.resolvedAt = nowIso();
    prop.resolvedBy = currentUserName();
    logChange('proposal-rejected', prop.entityType, prop.entityId, prop.bot + ': ' + prop.summary);
    save();
    renderAdmin();
  }

  // Enrichment import (issue #7). Approved bots (active botGrant) and admins upload a JSON list of
  // lead patches. Rules live in StuffMigrate.applyEnrichment: empty fields fill, conflicts go to
  // the proposal queue, lists are add-only, nothing is deleted, every change is logged.
  var lastEnrichResult = null; // { dryRun, fileName, lines, ignored, at }

  // Who may import: admin role (users/{email}.roles) or an active bot grant for the signed-in
  // email. Without Firebase (local mode) the local role stub decides.
  function resolveEnrichAccess() {
    var a = accessApi();
    if (!cloudReady()) {
      if (!isAdmin()) return Promise.resolve({ ok: false, reason: 'Only an Admin can import enrichment.' });
      return Promise.resolve({ ok: true, by: (auth.user && auth.user.email) || currentUserName(), actedFor: null, isAdmin: true, sections: null });
    }
    var me = a.me();
    return Promise.all([a.getProfile(), a.getGrant(me.email)]).then(function (r) {
      var admin = !!(r[0] && Array.isArray(r[0].roles) && r[0].roles.indexOf('admin') !== -1);
      var grant = r[1] && r[1].status === 'active' ? r[1] : null;
      if (!admin && !grant) return { ok: false, reason: 'Import needs an active bot grant or the admin role for ' + me.email + '.' };
      return {
        ok: true, by: me.email, isAdmin: admin,
        actedFor: grant && grant.sponsorUserEmail ? String(grant.sponsorUserEmail).toLowerCase() : null,
        sections: admin ? null : (grant.sections || {})
      };
    });
  }

  function parseEnrichFile(text) {
    var parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.patches)) return parsed.patches;
    throw new Error('Expected a JSON array of lead patches (or { "patches": [...] }).');
  }

  function runEnrichmentImport(text, fileName, dryRun) {
    var patches;
    try { patches = parseEnrichFile(text); } catch (e) {
      lastEnrichResult = { dryRun: dryRun, fileName: fileName, lines: ['Could not read the file: ' + (e && e.message ? e.message : e)], ignored: [], at: nowIso() };
      renderAdmin();
      return Promise.resolve(lastEnrichResult);
    }
    return resolveEnrichAccess().then(function (acc) {
      if (!acc.ok) {
        lastEnrichResult = { dryRun: dryRun, fileName: fileName, lines: [acc.reason], ignored: [], at: nowIso() };
        return;
      }
      if (!dryRun && !takeSnapshot('before-enrichment')) {
        lastEnrichResult = { dryRun: dryRun, fileName: fileName, lines: ['Snapshot failed (browser storage may be full). Nothing was imported.'], ignored: [], at: nowIso() };
        return;
      }
      var working = JSON.parse(JSON.stringify(state));
      var res = StuffMigrate.applyEnrichment(working, patches, {
        by: acc.by, actedFor: acc.actedFor, isAdmin: acc.isAdmin, frozen: botWritesFrozen(), logCap: CHANGE_LOG_CAP,
        canWriteLead: function (deal) { return StuffMigrate.grantCanWriteLead(working, deal, acc.sections); },
        canWriteCustomers: !acc.sections || acc.sections.customers === 'write'
      });
      var lines = StuffMigrate.enrichSummaryLines(res.summary);
      if (!dryRun && !res.summary.frozen) {
        state = working;
        save();
        lines.unshift('Saved. Snapshot "before-enrichment" is in Time machine.');
      } else if (dryRun) {
        lines.unshift('Dry run: nothing was saved.');
      }
      lastEnrichResult = { dryRun: dryRun, fileName: fileName, lines: lines, ignored: res.summary.ignored, at: nowIso() };
    }).catch(function (err) {
      lastEnrichResult = { dryRun: dryRun, fileName: fileName, lines: ['Import failed, nothing was saved: ' + (err && err.message ? err.message : err)], ignored: [], at: nowIso() };
    }).then(function () {
      if (activeView === 'admin') renderAdmin();
      return lastEnrichResult;
    });
  }

  function enrichCardHtml() {
    var html = '<section class="admin-card" id="enrich-card"><h3>Import enrichment</h3>';
    html += '<p class="muted-note">For approved bots and admins. Upload a JSON list of lead patches. Empty fields fill in, different values go to the proposal queue, lists only add, nothing is deleted. A snapshot is taken first and every change is logged.</p>';
    html += '<div class="admin-actions"><input type="file" id="adm-enrich-file" aria-label="Enrichment JSON file" accept=".json,application/json" />' +
      '<label class="check-line"><input type="checkbox" id="adm-enrich-dry" checked /> Dry run</label>' +
      '<button type="button" class="secondary" id="adm-enrich-run">Import</button></div>';
    var r = lastEnrichResult;
    if (r) {
      html += '<div class="enrich-result"><strong>' + (r.dryRun ? 'Dry run' : 'Import') + ': ' + escapeHtml(r.fileName || 'file') + '</strong><ul>' +
        r.lines.map(function (l) { return '<li>' + escapeHtml(l) + '</li>'; }).join('') + '</ul>';
      if (r.ignored && r.ignored.length) {
        html += '<details><summary>' + r.ignored.length + ' notes</summary><ul class="muted-note">' +
          r.ignored.slice(0, 200).map(function (l) { return '<li>' + escapeHtml(l) + '</li>'; }).join('') + '</ul></details>';
      }
      html += '</div>';
    }
    return html + '</section>';
  }

  function bindEnrichCard() {
    var btn = document.getElementById('adm-enrich-run');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var input = document.getElementById('adm-enrich-file');
      var file = input && input.files && input.files[0];
      if (!file) { alert('Choose an enrichment JSON file first.'); return; }
      var dry = document.getElementById('adm-enrich-dry').checked;
      btn.disabled = true;
      var reader = new FileReader();
      reader.onload = function () { runEnrichmentImport(String(reader.result || ''), file.name, dry); };
      reader.onerror = function () { btn.disabled = false; alert('Could not read the file.'); };
      reader.readAsText(file);
    });
  }

  // Customer PO upload (issue #20). Same JSON as the write API poUpserts. Rules live in
  // StuffMigrate.applyPoUpserts: one PO per customer and PO number, nothing deleted, unmatched
  // customers or SKU codes go to the proposal queue.
  var lastPoResult = null; // { dryRun, lines, results, ignored, at }

  function parsePoJson(text) {
    var parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.poUpserts)) return parsed.poUpserts;
    if (parsed && parsed.poNumber) return [parsed];
    throw new Error('Expected { "poUpserts": [...] }, a list of POs, or one PO.');
  }

  function poResultLine(r) {
    var what = { created: 'created', updated: 'updated', unchanged: 'no change', proposal: 'sent to proposals', 'proposal-refreshed': 'proposal refreshed',
      stale: 'skipped, changed since ifUpdatedAt', 'no-access': 'skipped, no access', invalid: 'invalid' }[r.action] || r.action;
    var cust = r.customerId ? getCustomer(r.customerId) : null;
    return 'PO ' + (r.poNumber || '(no number)') + (cust ? ' for ' + cust.name : '') + ': ' + what + (r.reasons && r.reasons.length ? ' (' + r.reasons.join('; ') + ')' : '');
  }

  function runPoImport(text, dryRun) {
    var list;
    try { list = parsePoJson(text); } catch (e) {
      lastPoResult = { dryRun: dryRun, lines: ['Could not read the JSON: ' + (e && e.message ? e.message : e)], results: [], ignored: [], at: nowIso() };
      renderAdmin();
      return Promise.resolve(lastPoResult);
    }
    return resolveEnrichAccess().then(function (acc) {
      if (!acc.ok) { lastPoResult = { dryRun: dryRun, lines: [acc.reason.replace('import enrichment', 'import POs')], results: [], ignored: [], at: nowIso() }; return; }
      if (!acc.isAdmin && (acc.sections || {}).customers !== 'write') {
        lastPoResult = { dryRun: dryRun, lines: ['PO import needs write access to Customers.'], results: [], ignored: [], at: nowIso() };
        return;
      }
      if (!dryRun && !takeSnapshot('before-po-upload')) {
        lastPoResult = { dryRun: dryRun, lines: ['Snapshot failed (browser storage may be full). Nothing was imported.'], results: [], ignored: [], at: nowIso() };
        return;
      }
      var working = JSON.parse(JSON.stringify(state));
      var res = StuffMigrate.applyPoUpserts(working, list, {
        by: acc.by, actedFor: acc.actedFor, isAdmin: acc.isAdmin, frozen: botWritesFrozen(), logCap: CHANGE_LOG_CAP
      });
      var lines = StuffMigrate.poSummaryLines(res.summary);
      if (!dryRun && !res.summary.frozen) {
        state = working;
        save();
        lines.unshift('Saved. Snapshot "before-po-upload" is in Time machine.');
      } else if (dryRun) {
        lines.unshift('Dry run: nothing was saved.');
      }
      lastPoResult = { dryRun: dryRun, lines: lines, results: res.summary.results.map(poResultLine), ignored: res.summary.ignored, at: nowIso() };
    }).catch(function (err) {
      lastPoResult = { dryRun: dryRun, lines: ['PO import failed, nothing was saved: ' + (err && err.message ? err.message : err)], results: [], ignored: [], at: nowIso() };
    }).then(function () {
      if (activeView === 'admin') renderAdmin();
      return lastPoResult;
    });
  }

  function poImportCardHtml() {
    var html = '<section class="admin-card" id="po-import-card"><h3>Import PO JSON</h3>';
    html += '<p class="muted-note">Paste a customer PO as JSON (the same shape HelperBot sends to the write API). The PO is matched by customer and PO number, so pasting it again does not duplicate it. Lines are never deleted. If the customer or a SKU code is not found, the PO goes to the proposal queue. A snapshot is taken first.</p>';
    html += '<textarea id="adm-po-json" aria-label="PO JSON" rows="6" spellcheck="false" placeholder=\'{ "poUpserts": [ { "customer": { "name": "..." }, "poNumber": "...", "lines": [ ... ] } ] }\'></textarea>';
    html += '<div class="admin-actions"><label class="check-line"><input type="checkbox" id="adm-po-dry" checked /> Dry run</label>' +
      '<button type="button" class="secondary" id="adm-po-run">Import</button></div>';
    var r = lastPoResult;
    if (r) {
      html += '<div class="enrich-result" id="po-import-result"><strong>' + (r.dryRun ? 'Dry run' : 'Import') + '</strong><ul>' +
        r.lines.concat(r.results || []).map(function (l) { return '<li>' + escapeHtml(l) + '</li>'; }).join('') + '</ul>';
      if (r.ignored && r.ignored.length) {
        html += '<details><summary>' + r.ignored.length + ' notes</summary><ul class="muted-note">' +
          r.ignored.slice(0, 200).map(function (l) { return '<li>' + escapeHtml(l) + '</li>'; }).join('') + '</ul></details>';
      }
      html += '</div>';
    }
    return html + '</section>';
  }

  function bindPoImportCard() {
    var btn = document.getElementById('adm-po-run');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var text = (document.getElementById('adm-po-json').value || '').trim();
      if (!text) { alert('Paste the PO JSON first.'); return; }
      btn.disabled = true;
      runPoImport(text, document.getElementById('adm-po-dry').checked);
    });
  }

  // Proposal from a PO upload: Owner picks the customer (or a new one) and may create missing SKUs.
  function poProposalControlsHtml(p) {
    var pay = p.payload || {};
    var po = pay.po || {};
    var spec = typeof po.customer === 'string' ? { name: po.customer } : (po.customer || {});
    var name = Array.isArray(spec.name) ? spec.name[0] : spec.name;
    var cands = (pay.candidates || []).map(getCustomer).filter(Boolean);
    var sel = p.entityType === 'customer' && p.entityId ? p.entityId : (cands[0] ? cands[0].id : '__new__');
    var html = '<div class="po-prop-controls"><label>Customer <select data-po-customer>';
    if (name) html += '<option value="__new__"' + (sel === '__new__' ? ' selected' : '') + '>New customer: ' + escapeHtml(name) + '</option>';
    if (cands.length) {
      html += '<optgroup label="Matches">' + cands.map(function (c) { return '<option value="' + escapeHtml(c.id) + '"' + (c.id === sel ? ' selected' : '') + '>' + escapeHtml(c.name) + '</option>'; }).join('') + '</optgroup>';
    }
    html += '<optgroup label="All customers">' + (state.customers || []).slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); })
      .filter(function (c) { return !cands.some(function (x) { return x.id === c.id; }); })
      .map(function (c) { return '<option value="' + escapeHtml(c.id) + '"' + (c.id === sel ? ' selected' : '') + '>' + escapeHtml(c.name) + '</option>'; }).join('') + '</optgroup></select></label>';
    var codes = (po.lines || []).map(function (l) { return l && StuffMigrate.splitSkuCode(l.skuCode).code; }).filter(Boolean);
    html += '<label class="check-line"><input type="checkbox" data-po-create-skus /> Create SKUs the customer does not have' + (codes.length ? ' (' + escapeHtml(codes.join(', ')) + ')' : '') + '</label></div>';
    return html;
  }

  function applyPoUploadProposal(prop, li) {
    if (!requireAdmin('apply a PO upload')) return;
    var sel = li ? li.querySelector('[data-po-customer]') : null;
    var cb = li ? li.querySelector('[data-po-create-skus]') : null;
    var choice = sel ? sel.value : '';
    if (!takeSnapshot('before-po-upload')) { alert('Snapshot failed (browser storage may be full). Nothing was applied.'); return; }
    var working = JSON.parse(JSON.stringify(state));
    var wprop = working.proposals.find(function (x) { return x.id === prop.id; });
    var res = StuffMigrate.applyPoProposal(working, wprop, {
      by: (auth.user && auth.user.email) || currentUserName(),
      customerId: choice && choice !== '__new__' ? choice : null,
      createCustomer: choice === '__new__',
      createSkus: !!(cb && cb.checked)
    });
    if (!res || ['created', 'updated', 'unchanged'].indexOf(res.action) === -1) {
      alert('Not applied: ' + (res && res.reasons && res.reasons.length ? res.reasons.join('; ') : 'this proposal can no longer be applied') + '.');
      return;
    }
    state = working;
    save();
    lastPoResult = { dryRun: false, lines: ['Applied the proposal. Snapshot "before-po-upload" is in Time machine.'].concat(StuffMigrate.poSummaryLines(res.summary)), results: [poResultLine(res)], ignored: res.summary.ignored, at: nowIso() };
    renderAdmin();
  }

  // Lead import (issue #25). Same JSON as the write API leadUpserts. Rules live in
  // StuffMigrate.applyLeadUpserts: stages add-only, leads already here are merged (notes only),
  // ambiguous ones go to the proposal queue, nothing is deleted or overwritten.
  var lastLeadResult = null; // { dryRun, lines, results, ignored }

  function parseLeadJson(text) {
    var parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return { leads: parsed };
    if (parsed && parsed.leadUpserts) return Array.isArray(parsed.leadUpserts) ? { leads: parsed.leadUpserts } : parsed.leadUpserts;
    if (parsed && (Array.isArray(parsed.leads) || Array.isArray(parsed.stagesAdd))) return parsed;
    throw new Error('Expected { "stagesAdd": [...], "leads": [...] }.');
  }

  function leadResultLine(r) {
    var what = { added: 'added', merged: 'already here, notes added', duplicate: 'already here, no change', proposal: 'sent to proposals',
      'proposal-refreshed': 'proposal refreshed', skipped: 'skipped' }[r.action] || r.action;
    return r.ref + ': ' + what + (r.reasons && r.reasons.length ? ' (' + r.reasons.join('; ') + ')' : '');
  }

  function runLeadImport(text, dryRun) {
    var body;
    try { body = parseLeadJson(text); } catch (e) {
      lastLeadResult = { dryRun: dryRun, lines: ['Could not read the JSON: ' + (e && e.message ? e.message : e)], results: [], ignored: [] };
      renderAdmin();
      return Promise.resolve(lastLeadResult);
    }
    return resolveEnrichAccess().then(function (acc) {
      if (!acc.ok) { lastLeadResult = { dryRun: dryRun, lines: [acc.reason.replace('import enrichment', 'import leads')], results: [], ignored: [] }; return; }
      if (!acc.isAdmin && (acc.sections || {}).customers !== 'write') {
        lastLeadResult = { dryRun: dryRun, lines: ['Lead import needs write access to Customers.'], results: [], ignored: [] };
        return;
      }
      if (!dryRun && !takeSnapshot('before-lead-import')) {
        lastLeadResult = { dryRun: dryRun, lines: ['Snapshot failed (browser storage may be full). Nothing was imported.'], results: [], ignored: [] };
        return;
      }
      var working = JSON.parse(JSON.stringify(state));
      var res = StuffMigrate.applyLeadUpserts(working, body, {
        by: acc.by, actedFor: acc.actedFor, isAdmin: acc.isAdmin, frozen: botWritesFrozen(), logCap: CHANGE_LOG_CAP, grantSections: acc.sections
      });
      var lines = StuffMigrate.leadSummaryLines(res.summary);
      if (!dryRun && !res.summary.frozen) {
        state = working;
        save();
        lines.unshift('Saved. Snapshot "before-lead-import" is in Time machine.');
      } else if (dryRun) {
        lines.unshift('Dry run: nothing was saved.');
      }
      lastLeadResult = { dryRun: dryRun, lines: lines, results: res.summary.results.map(leadResultLine), ignored: res.summary.ignored };
    }).catch(function (err) {
      lastLeadResult = { dryRun: dryRun, lines: ['Lead import failed, nothing was saved: ' + (err && err.message ? err.message : err)], results: [], ignored: [] };
    }).then(function () {
      if (activeView === 'admin') renderAdmin();
      return lastLeadResult;
    });
  }

  function leadImportCardHtml() {
    var html = '<section class="admin-card" id="lead-import-card"><h3>Import leads JSON</h3>';
    html += '<p class="muted-note">Paste new leads as JSON (the same shape bots send to the write API). A lead that is already here, by contact email or by name and company, only gets its new notes. Unclear matches go to the proposal queue. Stages are only added, never renamed or removed. A snapshot is taken first.</p>';
    html += '<textarea id="adm-lead-json" class="adm-json" aria-label="Leads JSON" rows="6" spellcheck="false" placeholder=\'{ "stagesAdd": [ ... ], "leads": [ { "lead": { ... }, "contacts": [ ... ], "customer": { ... } } ] }\'></textarea>';
    html += '<div class="admin-actions"><label class="check-line"><input type="checkbox" id="adm-lead-dry" checked /> Dry run</label>' +
      '<button type="button" class="secondary" id="adm-lead-run">Import</button></div>';
    var r = lastLeadResult;
    if (r) {
      html += '<div class="enrich-result" id="lead-import-result"><strong>' + (r.dryRun ? 'Dry run' : 'Import') + '</strong><ul>' +
        r.lines.map(function (l) { return '<li>' + escapeHtml(l) + '</li>'; }).join('') + '</ul>';
      if (r.results && r.results.length) {
        html += '<details><summary>' + r.results.length + ' lead(s)</summary><ul class="muted-note">' +
          r.results.map(function (l) { return '<li>' + escapeHtml(l) + '</li>'; }).join('') + '</ul></details>';
      }
      if (r.ignored && r.ignored.length) {
        html += '<details><summary>' + r.ignored.length + ' notes</summary><ul class="muted-note">' +
          r.ignored.slice(0, 200).map(function (l) { return '<li>' + escapeHtml(l) + '</li>'; }).join('') + '</ul></details>';
      }
      html += '</div>';
    }
    return html + '</section>';
  }

  function bindLeadImportCard() {
    var btn = document.getElementById('adm-lead-run');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var text = (document.getElementById('adm-lead-json').value || '').trim();
      if (!text) { alert('Paste the leads JSON first.'); return; }
      btn.disabled = true;
      runLeadImport(text, document.getElementById('adm-lead-dry').checked);
    });
  }

  // Proposal from a lead import: add the notes to one of the matching leads, or create the lead
  // for a chosen or new customer.
  function leadProposalControlsHtml(p) {
    var pay = p.payload || {};
    var entry = pay.entry || {};
    var name = (entry.customer && entry.customer.name) || (entry.lead && entry.lead.company) || '';
    var leads = (pay.leadCandidates || []).map(getDeal).filter(Boolean);
    var custs = (pay.customerCandidates || []).map(getCustomer).filter(Boolean);
    var sel = leads[0] ? 'lead:' + leads[0].id : custs[0] ? 'cust:' + custs[0].id : 'new';
    function opt(v, label) { return '<option value="' + escapeHtml(v) + '"' + (v === sel ? ' selected' : '') + '>' + escapeHtml(label) + '</option>'; }
    var html = '<div class="po-prop-controls"><label>Do <select data-lead-target>';
    if (leads.length) html += '<optgroup label="Add the notes to">' + leads.map(function (d) { return opt('lead:' + d.id, cardTitle(d) + ' (' + stageLabel(d.stage) + ')'); }).join('') + '</optgroup>';
    html += '<optgroup label="New lead for">' + opt('new', 'New customer: ' + (name || 'from the JSON')) +
      custs.map(function (c) { return opt('cust:' + c.id, c.name); }).join('') + '</optgroup>';
    html += '<optgroup label="New lead for another customer">' + (state.customers || []).slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); })
      .filter(function (c) { return !custs.some(function (x) { return x.id === c.id; }); })
      .map(function (c) { return opt('cust:' + c.id, c.name); }).join('') + '</optgroup></select></label></div>';
    return html;
  }

  function applyLeadImportProposal(prop, li) {
    if (!requireAdmin('apply a lead import')) return;
    var sel = li ? li.querySelector('[data-lead-target]') : null;
    if (!takeSnapshot('before-lead-import')) { alert('Snapshot failed (browser storage may be full). Nothing was applied.'); return; }
    var working = JSON.parse(JSON.stringify(state));
    var wprop = working.proposals.find(function (x) { return x.id === prop.id; });
    var r = StuffMigrate.applyLeadProposal(working, wprop, { by: (auth.user && auth.user.email) || currentUserName(), target: sel ? sel.value : '', logCap: CHANGE_LOG_CAP });
    if (!r || ['added', 'merged', 'duplicate'].indexOf(r.action) === -1) {
      alert('Not applied: ' + (r && r.reasons && r.reasons.length ? r.reasons.join('; ') : 'this proposal can no longer be applied') + '.');
      return;
    }
    state = working;
    save();
    lastLeadResult = { dryRun: false, lines: ['Applied the proposal. Snapshot "before-lead-import" is in Time machine.'].concat(StuffMigrate.leadSummaryLines(r.summary)), results: [leadResultLine(r)], ignored: r.summary.ignored };
    renderAdmin();
  }

  // Completion log card (issue #5): copy the entries to their own collection, then switch new
  // entries there. Admin role only, hosted Matrix only. Old entries stay in workspace/main.
  var completionCopyResult = '';

  function completionCardHtml() {
    var inState = ensureCompletionLog();
    var bytes = new Blob([JSON.stringify(inState)]).size;
    var store = StuffMigrate.completionLogStore(state);
    var s = state.settings || {};
    var html = '<section class="admin-card" id="completion-card"><h3>Completion log</h3>';
    html += '<p>New entries go to: <strong>' + (store === 'collection' ? 'their own collection (completionLog)' : 'workspace/main') + '</strong>. ' +
      inState.length + ' entries in workspace/main (' + formatBytes(bytes) + ')' +
      (completionCache.loaded ? ', ' + completionCache.entries.length + ' in the collection' : '') + '.</p>';
    if (completionCache.error) html += '<p class="warn-note">Collection not available: ' + escapeHtml(completionCache.error) + '. New entries stay in workspace/main.</p>';
    html += '<p class="muted-note">Each task completion adds about 300 bytes to workspace/main. Once the completionLog rule is deployed (firestore.rules.phase2.proposed), copy the entries, then switch. Nothing is deleted: the entries in workspace/main stay until Owner decides.</p>';
    if (!cloudReady()) html += '<p class="muted-note">Sign in to the hosted Matrix to use the collection.</p>';
    else {
      html += '<div class="admin-actions"><button type="button" class="secondary" id="adm-clog-copy">Copy to collection</button>';
      if (store === 'collection') html += '<button type="button" class="ghost" id="adm-clog-back">New entries back to workspace/main</button>';
      else if (s.completionLogCopiedAt) html += '<button type="button" class="secondary" id="adm-clog-switch">Use the collection for new entries</button>';
      html += '</div>';
    }
    if (completionCopyResult) html += '<p class="muted-note" id="clog-result">' + escapeHtml(completionCopyResult) + '</p>';
    return html + '</section>';
  }

  function requireProfileAdmin() {
    var a = accessApi();
    return a.getProfile().then(function (p) {
      if (p && Array.isArray(p.roles) && p.roles.indexOf('admin') !== -1) return true;
      alert('Only an Admin (users roles) can do this.');
      return false;
    });
  }

  function copyCompletionLog() {
    var a = accessApi();
    return requireProfileAdmin().then(function (ok) {
      if (!ok) return;
      if (!takeSnapshot('before-completion-copy')) { completionCopyResult = 'Snapshot failed (browser storage may be full). Nothing was copied.'; return; }
      return a.completionLog.list().then(function (existing) {
        var plan = StuffMigrate.completionCopyPlan(ensureCompletionLog(), existing.map(function (e) { return e.id; }));
        return a.completionLog.copy(plan.toCopy).then(function (r) {
          return a.completionLog.list().then(function (after) {
            var check = StuffMigrate.completionCopyPlan(ensureCompletionLog(), after.map(function (e) { return e.id; }));
            completionCache = { loaded: true, loading: false, entries: after, error: '' };
            if (check.toCopy.length) {
              completionCopyResult = 'Copied ' + r.copied + ', but ' + check.toCopy.length + ' entries are still missing. Not switching.';
              return;
            }
            state.settings.completionLogCopiedAt = nowIso();
            state.settings.completionLogCopiedCount = after.length;
            logChange('setting', 'settings', 'completionLogCopiedAt', 'Copied ' + r.copied + ' completion log entries to the completionLog collection (' + plan.already + ' already there' + (plan.badId ? ', ' + plan.badId + ' without an id kept only in workspace/main' : '') + ')');
            save();
            completionCopyResult = 'Copied ' + r.copied + ' entries; ' + plan.already + ' were already there. All entries are in the collection.' + (plan.badId ? ' ' + plan.badId + ' without an id stay only in workspace/main.' : '');
          });
        });
      });
    }).catch(function (err) {
      completionCopyResult = 'Copy failed, nothing changed in workspace/main: ' + ((err && err.message) || err);
    }).then(function () { if (activeView === 'admin') renderAdmin(); });
  }

  function setCompletionStore(store) {
    return requireProfileAdmin().then(function (ok) {
      if (!ok) return;
      state.settings.completionLogStore = store;
      logChange('setting', 'settings', 'completionLogStore', 'New completion log entries go to ' + (store === 'collection' ? 'the completionLog collection' : 'workspace/main'));
      save();
      completionCopyResult = '';
      return loadCompletionCache();
    }).then(function () { if (activeView === 'admin') renderAdmin(); });
  }

  // ---- Backups, staging and build info (issue #111) ----
  // Nightly backups are written by the nightlyBackup Function; this card lists their status docs
  // (backups/{date}), downloads a file (signed link) and restores through the backupAdmin Function:
  // dry run diff first, typed confirm, a before-restore snapshot is taken on the server.
  var STALE_BACKUP_MS = 36 * 3600 * 1000;
  var backupState = { rows: null, error: '', msg: '', plan: null, loading: false };
  var backupBannerChecked = false;

  function isStagingEnv() { return window.MATRIX_ENV === 'staging'; }

  function buildLabel() {
    var b = window.MATRIX_BUILD || {};
    return (b.commit || 'dev') + (b.builtAt ? ', built ' + String(b.builtAt).slice(0, 10) : '');
  }

  // null = fine, otherwise the warning text. Newest ok backup must be within 36 h.
  function backupStaleNote(rows, nowMs) {
    var ok = (rows || []).filter(function (r) { return r.status === 'ok'; })[0];
    if (!ok) return 'No successful backup yet.';
    var ageH = Math.floor(((nowMs || Date.now()) - new Date(ok.finishedAt || ok.startedAt).getTime()) / 3600000);
    if (ageH * 3600000 > STALE_BACKUP_MS || isNaN(ageH)) return 'Last good backup is ' + ageH + ' hours old (' + ok.date + '). Check Admin tools > Backups.';
    return null;
  }

  function showBackupBanner(text) {
    var el = document.getElementById('backup-banner');
    if (!text) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = 'backup-banner';
      el.className = 'env-banner env-banner-warn';
      el.setAttribute('role', 'alert');
      document.body.insertBefore(el, document.body.firstChild);
    }
    el.textContent = text;
  }

  // Once per page load, for admins on the hosted Matrix. Quiet when the rule is not deployed yet.
  function checkBackupBanner() {
    if (backupBannerChecked || !cloudReady()) return;
    backupBannerChecked = true;
    var a = accessApi();
    if (!a.backups) return;
    a.getProfile().then(function (p) {
      if (!(p && Array.isArray(p.roles) && p.roles.indexOf('admin') !== -1)) return null;
      return a.backups.list().then(function (rows) { backupState.rows = rows; showBackupBanner(backupStaleNote(rows)); });
    }).catch(function () { /* backups rule not deployed or no access: no banner */ });
  }

  function loadBackupRows() {
    var a = accessApi();
    if (!cloudReady() || !a.backups || backupState.loading || backupState.rows) return;
    backupState.loading = true;
    Promise.resolve().then(function () { return a.backups.list(); })
      .then(function (rows) { backupState.rows = rows; backupState.error = ''; showBackupBanner(backupStaleNote(rows)); })
      .catch(function (e) { backupState.error = (e && e.message) || String(e); backupState.rows = []; })
      .then(function () { backupState.loading = false; if (activeView === 'admin') renderAdmin(); });
  }

  // ---- Gmail sync panel (issue #54). Admin only. Read-only Gmail; tokens stay on the server. ----
  var GMAIL_MAILBOXES = ['you@example.com', 'sales@example.com'];
  var GMAIL_SCOPES = 'openid email https://www.googleapis.com/auth/gmail.readonly';
  var gmailState = { status: null, review: null, error: '', msg: '', loading: false };

  function gmailReviewVisible(rows, nowMs) {
    return (rows || []).filter(function (r) {
      var last = Date.parse(r.lastSeen || '') || 0;
      if (nowMs - last > 30 * 86400000) return false; // older than 30 days with no new mail: hidden, not deleted
      return !(r.dismissedAt && Date.parse(r.dismissedAt) >= last);
    }).sort(function (a, b) { return String(b.lastSeen || '').localeCompare(String(a.lastSeen || '')); });
  }

  // #137: red banner on every page, for admins, until both mailboxes are linked. null = fine.
  function gmailBannerNote(st) {
    if (!st || !st.mailboxes) return null;
    var missing = GMAIL_MAILBOXES.filter(function (m) { return !(st.mailboxes[m] && st.mailboxes[m].linked); });
    if (!missing.length) return null;
    var parts = GMAIL_MAILBOXES.map(function (m) {
      var x = st.mailboxes[m] || {};
      return m + (x.linked ? ' linked, last sync ' + (x.lastSyncAt ? new Date(x.lastSyncAt).toLocaleString() : 'not yet') : ' NOT linked');
    });
    return 'Gmail sync is not fully linked (' + parts.join('; ') + '). Customer email and last touch are stale until both are linked. Open Admin > Gmail sync.';
  }

  function showGmailBanner(text) {
    var el = document.getElementById('gmail-banner');
    if (!text) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = 'gmail-banner';
      el.className = 'env-banner env-banner-warn';
      el.setAttribute('role', 'alert');
      el.style.cursor = 'pointer';
      el.addEventListener('click', function () { setActiveAdmin(); });
      document.body.insertBefore(el, document.body.firstChild);
    }
    el.textContent = text;
  }

  var gmailBannerChecked = false;
  function checkGmailBanner() {
    if (gmailBannerChecked || !cloudReady()) return;
    gmailBannerChecked = true;
    var a = accessApi();
    if (!a || !a.gmail) return;
    a.getProfile().then(function (p) {
      if (!(p && Array.isArray(p.roles) && p.roles.indexOf('admin') !== -1)) return null;
      return a.gmail.call({ action: 'status' }).then(function (s) { showGmailBanner(gmailBannerNote(s)); });
    }).catch(function () { /* function not deployed or no access: no banner */ });
  }

  function loadGmailPanel() {
    var a = accessApi();
    if (!cloudReady() || !a.gmail || gmailState.loading || gmailState.status) return;
    gmailState.loading = true;
    a.gmail.call({ action: 'status' }).then(function (s) { gmailState.status = s; gmailState.error = ''; showGmailBanner(gmailBannerNote(s)); })
      .catch(function (e) { gmailState.error = (e && e.message) || String(e); gmailState.status = { mailboxes: {} }; })
      .then(function () { return a.gmail.reviewList().then(function (rows) { gmailState.review = rows; }, function () { gmailState.review = []; }); })
      .then(function () { gmailState.loading = false; if (activeView === 'admin') renderAdmin(); });
  }

  function gmailCardHtml() {
    var html = '<section class="admin-card admin-wide" id="gmail-card"><h3>Gmail sync</h3>' +
      '<p class="muted-note">Read only. Matrix reads owner@ and sales@ mail every 15 minutes and logs customer email on the matching lead. It never sends, drafts, changes or deletes mail, and keeps only a short snippet.</p>';
    if (!cloudReady()) return html + '<p class="muted-note">Sign in to the hosted Matrix to link Gmail.</p></section>';
    loadGmailPanel();
    var st = gmailState.status;
    if (gmailState.msg) html += '<p class="ok-note">' + escapeHtml(gmailState.msg) + '</p>';
    if (gmailState.error) html += '<p class="warn-note">' + escapeHtml(gmailState.error) + '</p>';
    if (!st) return html + '<p class="muted-note">Loading.</p></section>';
    html += '<table class="customers-table"><thead><tr><th>Mailbox</th><th>Status</th><th>Linked address</th><th>Last sync</th><th>Last error</th><th>Messages logged</th><th></th></tr></thead><tbody>';
    GMAIL_MAILBOXES.forEach(function (m) {
      var x = (st.mailboxes || {})[m] || {};
      html += '<tr data-gmail-mailbox="' + escapeHtml(m) + '"><td>' + escapeHtml(m) + '</td><td>' + (x.linked ? 'Linked' : 'Not linked') + '</td>' +
        '<td>' + escapeHtml(x.address || '') + '</td><td>' + (x.lastSyncAt ? escapeHtml(new Date(x.lastSyncAt).toLocaleString()) : '') + '</td>' +
        '<td>' + escapeHtml(x.lastError || '') + '</td><td>' + (x.messagesLogged || 0) + '</td>' +
        '<td>' + (x.linked ? '<button type="button" class="ghost" data-gmail-act="unlink">Unlink</button>' : '<button type="button" class="primary" data-gmail-act="link"' + (st.clientId ? '' : ' disabled') + '>Link Gmail</button>') + '</td></tr>';
    });
    html += '</tbody></table>';
    var rv = gmailReviewVisible(gmailState.review, Date.now());
    html += '<h4>Senders not matched to a lead (' + rv.length + ')</h4>';
    if (!rv.length) html += '<p class="muted-note">None. Matrix never creates leads or customers from email.</p>';
    else {
      html += '<div class="table-wrap"><table class="customers-table"><thead><tr><th>Sender</th><th>First seen</th><th>Last seen</th><th>Messages</th><th>Last subject</th><th>Mailbox</th><th></th></tr></thead><tbody>';
      rv.forEach(function (r) {
        html += '<tr data-gmail-review="' + escapeHtml(r.email) + '"><td>' + escapeHtml(r.name ? r.name + ' <' + r.email + '>' : r.email) + '</td>' +
          '<td>' + escapeHtml(String(r.firstSeen || '').slice(0, 10)) + '</td><td>' + escapeHtml(String(r.lastSeen || '').slice(0, 10)) + '</td><td>' + (r.count || 0) + '</td>' +
          '<td>' + escapeHtml(r.lastSubject || '') + '</td><td>' + escapeHtml(r.mailbox || '') + '</td>' +
          '<td><button type="button" class="primary" data-gmail-act="add-lead">Add as lead</button> <button type="button" class="ghost" data-gmail-act="dismiss">Dismiss</button></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    return html + '</section>';
  }

  function bindGmailCard() {
    var card = document.getElementById('gmail-card');
    var a = accessApi();
    if (!card || !a || !a.gmail) return;
    function reload(msg) { gmailState.status = null; gmailState.msg = msg || ''; renderAdmin(); }
    card.querySelectorAll('[data-gmail-mailbox] [data-gmail-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var mailbox = b.closest('tr').getAttribute('data-gmail-mailbox');
        if (b.getAttribute('data-gmail-act') === 'unlink') {
          if (!requireAdmin('unlink Gmail')) return;
          if (!confirm('Unlink ' + mailbox + '? Sync stops. Leads and timeline entries already logged stay.')) return;
          b.disabled = true;
          a.gmail.call({ action: 'unlink', mailbox: mailbox }).then(function () { reload('Unlinked ' + mailbox + '.'); })
            .catch(function (e) { b.disabled = false; gmailState.error = e.message; renderAdmin(); });
          return;
        }
        if (!requireAdmin('link Gmail')) return;
        // Authorization code flow in this window; the page handles the return (handleGmailReturn).
        var nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
        try { sessionStorage.setItem('gmailLinkNonce', nonce); } catch (e) { /* ignore */ }
        var redirect = window.location.origin + '/';
        window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + [
          ['client_id', gmailState.status.clientId], ['redirect_uri', redirect], ['response_type', 'code'], ['scope', GMAIL_SCOPES],
          ['access_type', 'offline'], ['prompt', 'consent'], ['login_hint', mailbox], ['state', 'gmail:' + mailbox + ':' + nonce]
        ].map(function (p) { return p[0] + '=' + encodeURIComponent(p[1]); }).join('&');
      });
    });
    card.querySelectorAll('[data-gmail-review] [data-gmail-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var tr = b.closest('tr');
        var email = tr.getAttribute('data-gmail-review');
        var row = (gmailState.review || []).filter(function (r) { return r.email === email; })[0] || {};
        if (b.getAttribute('data-gmail-act') === 'dismiss') {
          b.disabled = true;
          a.gmail.dismissReview(email).then(function () {
            row.dismissedAt = new Date().toISOString();
            renderAdmin();
          }).catch(function (e) { b.disabled = false; alert('Could not dismiss: ' + e.message); });
          return;
        }
        // Opens the normal new-lead form with the sender prefilled. Nothing is created until it is saved.
        openModal(null);
        document.getElementById('f-contact').value = row.name || '';
        document.getElementById('f-email').value = email;
      });
    });
  }

  // Back from Google (?code=...&state=gmail:<mailbox>:<nonce>): send the code to gmailLink, then clean the URL.
  function handleGmailReturn() {
    var q = new URLSearchParams(window.location.search);
    var st = q.get('state') || '';
    if (st.indexOf('gmail:') !== 0) return;
    var parts = st.split(':');
    var code = q.get('code');
    var clean = function () { try { window.history.replaceState(null, '', window.location.pathname + window.location.hash); } catch (e) { /* ignore */ } };
    var nonce = null;
    try { nonce = sessionStorage.getItem('gmailLinkNonce'); sessionStorage.removeItem('gmailLinkNonce'); } catch (e) { /* ignore */ }
    clean();
    if (!code || !nonce || parts[2] !== nonce) { gmailState.error = q.get('error') ? 'Google said: ' + q.get('error') : 'Gmail link was not completed.'; return; }
    var tries = 0;
    (function go() {
      var a = accessApi();
      if (!cloudReady() || !a.gmail) { if (tries++ < 40) setTimeout(go, 500); return; }
      a.gmail.call({ action: 'link', mailbox: parts[1], code: code, redirectUri: window.location.origin + '/' })
        .then(function () { gmailState.status = null; gmailState.msg = 'Linked ' + parts[1] + '. The first sync backfills 60 days.'; })
        .catch(function (e) { gmailState.error = 'Link failed: ' + e.message; })
        .then(function () { activeView = 'admin'; activeArea = 'admin'; renderApp(); });
    })();
  }
  handleGmailReturn();

  function backupsCardHtml() {
    var html = '<section class="admin-card admin-wide" id="backups-card"><h3>Backups and version</h3>';
    html += '<p>Environment: <strong>' + (isStagingEnv() ? 'STAGING (workspace/staging)' : 'Production (workspace/main)') + '</strong>. Version: commit <strong>' + escapeHtml(buildLabel()) + '</strong>.</p>';
    if (!cloudReady()) return html + '<p class="muted-note">Sign in to the hosted Matrix to see backups.</p></section>';
    loadBackupRows();
    var rows = backupState.rows;
    if (backupState.error) html += '<p class="warn-note">Could not read backups: ' + escapeHtml(backupState.error) + '. Admins only; the backups rule must be deployed.</p>';
    if (rows) {
      var stale = backupStaleNote(rows);
      if (stale) html += '<p class="warn-note">' + escapeHtml(stale) + '</p>';
      else html += '<p class="ok-note">Last backup is fresh.</p>';
    }
    html += '<p class="muted-note">The nightlyBackup Function saves every collection at 02:15 Pacific. Kept: 30 daily and 12 monthly. Restore brings back the workspace state only (cards, customers, settings), never users or bot access.</p>';
    if (!rows) html += '<p class="muted-note">Loading...</p>';
    else if (!rows.length) html += '<div class="file-empty">No backups yet.</div>';
    else {
      html += '<table class="backup-table"><thead><tr><th>Date</th><th>Status</th><th>Size</th><th>Docs</th><th>sha256</th><th></th></tr></thead><tbody>';
      rows.forEach(function (r) {
        var docs = 0;
        Object.keys(r.counts || {}).forEach(function (k) { docs += r.counts[k]; });
        html += '<tr data-backup-date="' + escapeHtml(r.date) + '"><td>' + escapeHtml(r.date) + '</td><td class="' + (r.status === 'ok' ? 'ok-note' : 'warn-note') + '">' +
          escapeHtml(r.status) + (r.error ? ' (' + escapeHtml(r.error) + ')' : '') + '</td><td>' + escapeHtml(formatBytes(r.bytes || 0)) + '</td><td>' + docs +
          '</td><td title="' + escapeHtml(r.sha256 || '') + '">' + escapeHtml(String(r.sha256 || '').slice(0, 8)) + '</td><td>' +
          (r.status === 'ok' ? '<button type="button" class="ghost" data-backup-act="download">Download</button> <button type="button" class="secondary" data-backup-act="restore">Restore</button>' : '') +
          '</td></tr>';
      });
      html += '</tbody></table>';
    }
    var plan = backupState.plan;
    if (plan) {
      html += '<div class="backup-plan"><h4>Restore ' + escapeHtml(plan.date) + ' into ' + escapeHtml(plan.target === 'staging' ? 'workspace/staging' : 'workspace/main') + ' (dry run)</h4>';
      if (plan.diff.same) html += '<p class="muted-note">No difference. Nothing to restore.</p>';
      else {
        html += '<ul>' + plan.diff.rows.map(function (d) {
          return '<li><strong>' + escapeHtml(d.key) + '</strong>: ' + (d.kind === 'list'
            ? d.before + ' now, ' + d.after + ' after (' + d.added + ' come back, ' + d.removed + ' removed, ' + d.changed + ' changed)'
            : 'value changes') + '</li>';
        }).join('') + '</ul>';
        html += '<p class="muted-note">A before-restore snapshot of the current state is saved first (Time machine). Open tabs reload the restored copy.</p>';
        html += '<div class="field"><label for="backup-confirm">Type RESTORE to confirm</label><input id="backup-confirm" type="text" autocomplete="off" /></div>' +
          '<div class="admin-actions"><button type="button" class="secondary" id="backup-restore-go" disabled>Restore now</button>' +
          '<button type="button" class="ghost" id="backup-restore-cancel">Cancel</button></div>';
      }
      if (plan.diff.same) html += '<div class="admin-actions"><button type="button" class="ghost" id="backup-restore-cancel">Close</button></div>';
      html += '</div>';
    }
    if (backupState.msg) html += '<p class="muted-note" id="backup-msg">' + escapeHtml(backupState.msg) + '</p>';
    if (isStagingEnv()) {
      html += '<div class="admin-actions"><button type="button" class="secondary" id="backup-copy-staging">Copy production into staging</button></div>' +
        '<p class="muted-note">Replaces workspace/staging with a copy of workspace/main. Production is only read.</p>';
    }
    return html + '</section>';
  }

  function backupTarget() { return isStagingEnv() ? 'staging' : 'main'; }

  function bindBackupsCard() {
    var card = document.getElementById('backups-card');
    var a = accessApi();
    if (!card || !a || !a.backups) return;
    function done(msg) { backupState.msg = msg; renderAdmin(); }
    card.querySelectorAll('[data-backup-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var date = b.closest('tr').getAttribute('data-backup-date');
        if (b.getAttribute('data-backup-act') === 'download') {
          if (!requireAdmin('download a backup')) return;
          b.disabled = true;
          a.backups.call({ action: 'download', date: date }).then(function (r) { window.open(r.url, '_blank', 'noopener'); b.disabled = false; })
            .catch(function (e) { b.disabled = false; done('Download failed: ' + e.message); });
          return;
        }
        if (!requireAdmin('restore a backup')) return;
        b.disabled = true;
        a.backups.call({ action: 'restore', date: date, target: backupTarget() }).then(function (r) {
          backupState.plan = { date: date, target: backupTarget(), diff: r.diff };
          backupState.msg = '';
          renderAdmin();
        }).catch(function (e) { done('Restore dry run failed: ' + e.message); });
      });
    });
    var input = document.getElementById('backup-confirm');
    var go = document.getElementById('backup-restore-go');
    if (input && go) input.addEventListener('input', function () { go.disabled = input.value !== 'RESTORE'; });
    if (go) go.addEventListener('click', function () {
      var plan = backupState.plan;
      if (!plan || !requireAdmin('restore a backup') || input.value !== 'RESTORE') return;
      go.disabled = true;
      a.backups.call({ action: 'restore', date: plan.date, target: plan.target, confirm: 'RESTORE' }).then(function () {
        backupState.plan = null;
        done('Restored ' + plan.date + '. Reloading the restored copy.');
        if (plan.target === 'main' || isStagingEnv()) setTimeout(function () { location.reload(); }, 1500);
      }).catch(function (e) { done('Restore failed: ' + e.message); });
    });
    var cancel = document.getElementById('backup-restore-cancel');
    if (cancel) cancel.addEventListener('click', function () { backupState.plan = null; renderAdmin(); });
    var copy = document.getElementById('backup-copy-staging');
    if (copy) copy.addEventListener('click', function () {
      if (!requireAdmin('copy production into staging')) return;
      if (!confirm('Replace everything in staging with a copy of production?')) return;
      copy.disabled = true;
      a.backups.copyProductionToStaging().then(function () { done('Copied production into staging. Reloading.'); setTimeout(function () { location.reload(); }, 1500); })
        .catch(function (e) { done('Copy failed: ' + e.message); });
    });
  }

  function showStagingBanner() {
    if (!isStagingEnv() || document.getElementById('staging-banner')) return;
    var el = document.createElement('div');
    el.id = 'staging-banner';
    el.className = 'env-banner env-banner-staging';
    el.textContent = 'STAGING: test copy, not production. Changes here never reach the live Matrix.';
    document.body.insertBefore(el, document.body.firstChild);
    document.title = 'STAGING ' + document.title;
  }

  function bindCompletionCard() {
    var c = document.getElementById('adm-clog-copy');
    if (c) c.addEventListener('click', function () { c.disabled = true; copyCompletionLog(); });
    var sw = document.getElementById('adm-clog-switch');
    if (sw) sw.addEventListener('click', function () { setCompletionStore('collection'); });
    var bk = document.getElementById('adm-clog-back');
    if (bk) bk.addEventListener('click', function () { setCompletionStore('state'); });
  }

  // Drive-backed uploads (DRIVE_UPLOAD_SPEC.md). Stub until Google auth is live.
  // Same API for humans and bots. Never overwrite, never delete, never change sharing.
  function driveAvailable() { return false; }

  function attachFileToDeal(opts) {
    opts = opts || {};
    return new Promise(function (resolve, reject) {
      if (botWritesFrozen() && opts.uploadedBy === 'bot') {
        reject(new Error('Bot writes are frozen (kill switch).'));
        return;
      }
      if (!driveAvailable()) {
        reject(new Error('Drive upload is not connected. Files are stored in this browser (IndexedDB) until Google auth is wired.'));
        return;
      }
      // TODO(owner): create {company} - {title} [{id}] folder, slot subfolder, upload as new file, store driveFileId/url.
      reject(new Error('Not implemented'));
    });
  }

  // Public surface for bots and future API clients. Read-only except proposals.
  window.StuffCRM = {
    version: 12,
    getState: function () { return JSON.parse(JSON.stringify(state)); },
    proposeChange: addProposal,
    attachFileToDeal: attachFileToDeal,
    driveAvailable: driveAvailable,
    isFrozen: botWritesFrozen,
    migrationReport: function () { return lastMigrationReport; },
    completionsBy: completionsBy,
    // Test hook: same code path as a rail drop.
    __moveSection: function (id, sectionId) { var ok = moveDealToSection(id, sectionId); if (ok) renderApp(); return ok; },
    __moveStage: function (id, stage) { var ok = moveDealToStage(id, stage); if (ok) renderApp(); return ok; },
    __completeTask: function (id, opts) {
      var ref = resolveTaskRef(id);
      if (!ref) return null;
      var t = markTaskCompleted(ref, opts || { source: 'bot' });
      save(); renderApp();
      return t ? t.id : null;
    },
    __dismissTask: function (id, opts) {
      var ref = resolveTaskRef(id);
      if (!ref) return null;
      var t = markTaskDismissed(ref, opts || { source: 'eisenhower-delete' });
      save(); renderApp();
      return t ? t.id : null;
    },
    __reopenTask: function (id, opts) {
      var t = markTaskReopened(id, opts || { source: 'done-button' });
      save(); renderApp();
      return t ? t.id : null;
    },
    checkMigration: function () { return StuffMigrate.checkMigration(state, { requirePrefixes: ['pd-'] }); }
  };

  // =====================================================================
  // v12: Customers and Contacts helpers
  // =====================================================================

  function getCustomer(id) {
    return (state.customers || []).find(function (c) { return c.id === id; });
  }

  function getContact(id) {
    return (state.contacts || []).find(function (c) { return c.id === id; });
  }

  function contactsForCustomer(customerId) {
    return (state.contacts || []).filter(function (c) { return c.customerId === customerId; });
  }

  function linkedContactsForDeal(deal) {
    if (!deal) return [];
    var ids = Array.isArray(deal.contactIds) ? deal.contactIds : [];
    return ids.map(getContact).filter(Boolean);
  }

  function primaryContactFor(deal) {
    if (!deal) return null;
    if (deal.primaryContactId) {
      var c = getContact(deal.primaryContactId);
      if (c) return c;
    }
    var linked = linkedContactsForDeal(deal);
    if (linked.length) return linked.find(function (x) { return x.isPrimary; }) || linked[0];
    if (deal.customerId) {
      var all = contactsForCustomer(deal.customerId);
      return all.find(function (x) { return x.isPrimary; }) || all[0] || null;
    }
    return null;
  }

  function dealsForCustomer(customerId) {
    return (state.deals || []).filter(function (d) { return d.customerId === customerId; });
  }

  function setPrimaryContact(customerId, contactId) {
    contactsForCustomer(customerId).forEach(function (c) { c.isPrimary = (c.id === contactId); });
  }

  function ensureDealCustomer(deal) {
    if (!deal) return null;
    if (StuffMigrate.isShopNeedsStage(deal.stage)) { deal.type = 'internal'; return null; }
    if (deal.customerId && getCustomer(deal.customerId)) return getCustomer(deal.customerId);
    var res = StuffMigrate.findOrCreateCustomer(state, deal.company || deal.title, deal.source, nowIso());
    deal.customerId = res.customer.id;
    if (res.created) logChange('create', 'customer', res.customer.id, 'Created from lead ' + cardTitle(deal));
    return res.customer;
  }

  // Company renamed on a lead: rename the customer if this lead is its only one, otherwise relink.
  function syncDealCustomerName(deal) {
    if (!deal || deal.type === 'internal') return;
    var cust = ensureDealCustomer(deal);
    if (!cust) return;
    var normalized = StuffMigrate.normalizeCompanyName(deal.company) || 'unnamed';
    if (cust.normalizedName === normalized) return;
    var others = dealsForCustomer(cust.id).filter(function (d) { return d.id !== deal.id; });
    if (!others.length) {
      cust.name = deal.company;
      cust.normalizedName = normalized;
      cust.updatedAt = nowIso();
      logChange('update', 'customer', cust.id, 'Renamed to ' + cust.name + ' from lead');
      return;
    }
    var res = StuffMigrate.findOrCreateCustomer(state, deal.company, deal.source, nowIso());
    var oldId = deal.customerId;
    deal.customerId = res.customer.id;
    // Move this lead's linked contacts along if no other lead on the old customer uses them.
    (deal.contactIds || []).forEach(function (cid) {
      var c = getContact(cid);
      if (!c || c.customerId !== oldId) return;
      var usedElsewhere = others.some(function (d) { return (d.contactIds || []).indexOf(cid) !== -1; });
      if (!usedElsewhere) {
        c.customerId = res.customer.id;
        if (!contactsForCustomer(res.customer.id).some(function (x) { return x.isPrimary && x.id !== c.id; })) c.isPrimary = true;
      }
    });
    logChange('update', 'lead', deal.id, 'Relinked from customer ' + oldId + ' to ' + res.customer.id);
  }

  function applyPendingPrimaryContact(deal) {
    var pend = deal._pendingPrimaryContact;
    delete deal._pendingPrimaryContact;
    if (!Array.isArray(deal.contactIds)) deal.contactIds = [];
    if (!Array.isArray(deal.projectIds)) deal.projectIds = [];
    if (!deal.status) deal.status = 'open';
    if (deal.coverFileId === undefined) deal.coverFileId = null;
    var cust = ensureDealCustomer(deal);
    syncDealCustomerName(deal);
    cust = deal.customerId ? getCustomer(deal.customerId) : null;
    if (!pend || !cust) return;
    var hasAny = !!(pend.name || pend.email || pend.phone);
    var current = primaryContactFor(deal);
    if (current && (deal.contactIds.indexOf(current.id) !== -1)) {
      if (!hasAny) return; // blanks in the quick modal never delete a contact
      current.name = pend.name || current.name;
      current.email = pend.email;
      current.phone = pend.phone;
      current.updatedAt = nowIso();
      return;
    }
    if (!hasAny) return;
    var c = StuffMigrate.createContact(state, cust.id, pend, nowIso());
    deal.contactIds.push(c.id);
    if (!deal.primaryContactId) deal.primaryContactId = c.id;
    logChange('create', 'contact', c.id, 'Added ' + c.name + ' on ' + cust.name);
  }

  // =====================================================================
  // Communications (issue #14): quote PDFs, Gmail drafts prepared for the lead's contacts, and
  // sent / received history. Gmail runs in the browser as the signed-in person. Drafts can be
  // edited without sending; Send is a human click only (never for an account with an active bot
  // grant) and every send is logged. Gmail data is shown, not stored in workspace/main.
  // =====================================================================
  var commsCache = { dealId: null, drafts: [], messages: [], loading: false, error: '', isBot: null, loadedAt: 0 };

  function gmailApi() { return window.MatrixCloud && window.MatrixCloud.gmail; }
  function gmailConnected() { var g = gmailApi(); return !!(g && cloudReady() && g.isConnected()); }

  // Bots (an active botGrant for the signed-in email) may draft, never send.
  function checkIsBotAccount() {
    var a = accessApi();
    if (!cloudReady() || !a) return Promise.resolve(true);
    return a.getGrant(a.me().email).then(function (g) { return !!(g && g.status === 'active'); }).catch(function () { return true; });
  }

  // Threads from the server-side index (#137): both mailboxes, no browser Gmail login needed.
  var threadWatch = { dealId: null, unsub: null, rows: null, error: '' };
  function stopThreadWatch() {
    if (threadWatch.unsub) { try { threadWatch.unsub(); } catch (e) { /* ignore */ } }
    threadWatch = { dealId: null, unsub: null, rows: null, error: '' };
  }
  function ensureThreadWatch(deal) {
    var a = accessApi();
    var g = a && a.gmail;
    if (threadWatch.dealId === deal.id) return;
    stopThreadWatch();
    if (!cloudReady() || !g || typeof g.watchThreads !== 'function') return;
    var mine = threadWatch = { dealId: deal.id, unsub: null, rows: null, error: '' };
    function redraw() {
      var root = document.getElementById('d-comms-root');
      if (root && activeDetailId === deal.id && threadWatch === mine) renderCommunications(root, deal);
    }
    try {
      mine.unsub = g.watchThreads(deal.id, function (rows) { mine.rows = rows; mine.error = ''; redraw(); },
        function (err) { mine.rows = mine.rows || []; mine.error = (err && err.message) || String(err); redraw(); });
    } catch (e) { mine.rows = []; mine.error = (e && e.message) || String(e); }
  }

  function threadsHtml(deal) {
    var w = threadWatch.dealId === deal.id ? threadWatch : null;
    if (!w || !w.rows) return '<p class="muted-note">Loading threads...</p>';
    if (w.error) return '<p class="warn-note">Threads: ' + escapeHtml(w.error) + '</p>';
    if (!w.rows.length) {
      return '<p class="muted-note">No email threads for this customer yet. Gmail sync not linked? ' +
        '<a href="#" data-comms-admin-link>Check Gmail sync in Admin</a>.</p>';
    }
    var replyWaiting = !!(deal.email && deal.email.replyWaiting);
    return '<ul class="timeline-list comms-history comms-threads">' + w.rows.map(function (t, i) {
      var box = (t.mailboxes && t.mailboxes.length ? t.mailboxes : [t.mailbox]).filter(Boolean).map(function (m) { return String(m).split('@')[0]; }).join(' + ');
      var dir = t.lastDirection === 'inbound' ? 'Received' : 'Sent';
      var waiting = replyWaiting && t.lastDirection === 'inbound' && t.lastMessageAt === (deal.email && deal.email.lastInboundAt);
      var who = (t.participants || []).slice(0, 3).join(', ');
      var url = String(t.threadUrl || '');
      return '<li data-thread-id="' + escapeHtml(t.id) + '"><span class="tl-date">' + escapeHtml(String(t.lastMessageAt || '').slice(0, 10)) + '</span> ' +
        '<span class="note-badge">' + escapeHtml(box || 'mail') + '</span> <span class="note-badge">' + dir + '</span>' +
        (waiting ? ' <span class="badge badge-reply-waiting">Reply waiting</span>' : '') + ' ' +
        escapeHtml(t.subject || '(no subject)') + ' <span class="muted-note">' + (t.messageCount || 1) + ' msg' + ((t.messageCount || 1) === 1 ? '' : 's') +
        (who ? ', ' + escapeHtml(who) : '') + '</span>' +
        (t.snippet ? '<div class="muted-note">' + escapeHtml(String(t.snippet).slice(0, 160)) + '</div>' : '') +
        (/^https:\/\//.test(url) ? ' <a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">Open in Gmail</a>' : '') + '</li>';
    }).join('') + '</ul>';
  }

  function loadComms(deal, force) {
    var g = gmailApi();
    if (!gmailConnected()) return Promise.resolve();
    if (commsCache.loading || (!force && commsCache.dealId === deal.id && commsCache.loadedAt)) return Promise.resolve();
    var emails = StuffMigrate.leadContactEmails(state, deal);
    commsCache = { dealId: deal.id, drafts: [], messages: [], loading: true, error: '', isBot: commsCache.isBot, loadedAt: 0 };
    var q = StuffMigrate.gmailQueryFor(emails);
    var me = g.email();
    return Promise.all([
      q ? g.listDrafts(q) : Promise.resolve([]),
      q ? g.listMessages(q) : Promise.resolve([]),
      checkIsBotAccount()
    ]).then(function (r) {
      commsCache.drafts = (r[0] || []).map(function (d) { var m = StuffMigrate.parseGmailMessage(d.message || {}, me); m.draftId = d.id; return m; });
      commsCache.messages = StuffMigrate.sortMessagesNewestFirst((r[1] || []).map(function (m) { return StuffMigrate.parseGmailMessage(m, me); }));
      commsCache.isBot = r[2];
      commsCache.noEmails = !emails.length;
    }).catch(function (err) {
      commsCache.error = (err && err.message) || String(err);
    }).then(function () {
      commsCache.loading = false;
      commsCache.loadedAt = Date.now();
      var root = document.getElementById('d-comms-root');
      if (root && activeDetailId === deal.id) renderCommunications(root, deal);
    });
  }

  function renderCommunications(root, deal) {
    if (!root || !deal) return;
    var wasOpen = !!root.querySelector('details.rec-section[open]');
    var quotes = ((deal.files && deal.files.quotes) || []).filter(function (f) { return f && /^https?:\/\//i.test(f.url || f.driveUrl || ''); });
    var html = '';
    var mine = commsCache.dealId === deal.id;
    var nD = mine ? commsCache.drafts.length : 0, nM = mine ? commsCache.messages.length : 0;
    ensureThreadWatch(deal);
    var tw = threadWatch.dealId === deal.id && threadWatch.rows ? threadWatch.rows.length : null;
    var note = tw !== null ? tw + ' thread' + (tw === 1 ? '' : 's') :
      (gmailConnected() ? (mine && commsCache.loadedAt ? nD + ' draft' + (nD === 1 ? '' : 's') + ', ' + nM + ' message' + (nM === 1 ? '' : 's') : 'loading') : 'Gmail not connected');
    html += '<details class="rec-section comms" data-sec="comms"' + (wasOpen ? ' open' : '') + '><summary><span class="rec-sec-label">Communications</span><span class="rec-sec-note">' + escapeHtml(note) + '</span></summary><div class="rec-sec-body">';
    // The quote lives in Files (type Quote); this only points at the latest linked one (#105).
    if (quotes.length) {
      var first = quotes[quotes.length - 1];
      html += '<p class="comms-quote">Quote: <a href="' + escapeHtml(first.url || first.driveUrl) + '" target="_blank" rel="noopener">' + escapeHtml(first.name || 'Quote') + '</a>' +
        (quotes.length > 1 ? ' <span class="muted-note">and ' + (quotes.length - 1) + ' more in Files</span>' : '') + '</p>';
    }
    // Gmail.
    html += '<h4 class="comms-h">Email threads</h4>';
    if (!cloudReady() || !gmailApi()) html += '<p class="muted-note">Email threads show in the hosted Matrix after you sign in.</p>';
    else html += threadsHtml(deal);
    html += '<h4 class="comms-h">Drafts</h4>';
    if (!cloudReady() || !gmailApi()) html += '<p class="muted-note">Drafts work in the hosted Matrix after you sign in.</p>';
    else if (!gmailConnected()) html += '<p class="muted-note">Optional: connect Gmail to see drafts prepared for this customer, edit them, and send them yourself.</p><div class="admin-actions"><button type="button" class="secondary" id="comms-connect">Connect Gmail</button></div>';
    else {
      html += '<p class="muted-note">Connected as ' + escapeHtml(gmailApi().email()) + '. <button type="button" class="link-btn" id="comms-refresh">Refresh</button></p>';
      if (!mine || commsCache.loading) html += '<p class="muted-note">Loading Gmail...</p>';
      else if (commsCache.error) html += '<p class="warn-note">Gmail: ' + escapeHtml(commsCache.error) + '</p>';
      else if (commsCache.noEmails) html += '<p class="muted-note">This lead has no contact email yet, so there is nothing to look up.</p>';
      else {
        var canSend = commsCache.isBot === false;
        html += '<div class="comms-sub">Drafts</div>';
        if (!commsCache.drafts.length) html += '<p class="muted-note">No drafts prepared for this customer.</p>';
        else html += '<ul class="comms-list">' + commsCache.drafts.map(function (d) {
          return '<li data-draft-id="' + escapeHtml(d.draftId) + '"><div><strong>' + escapeHtml(d.subject || '(no subject)') + '</strong> <span class="muted-note">to ' + escapeHtml(d.to.join(', ')) + '</span>' +
            '<div class="muted-note">' + escapeHtml(d.snippet || d.body.slice(0, 160)) + '</div></div><div class="contact-actions">' +
            '<button type="button" class="ghost" data-comms-edit="' + escapeHtml(d.draftId) + '">Edit</button>' +
            (canSend ? '<button type="button" data-comms-send="' + escapeHtml(d.draftId) + '">Send</button>' : '') + '</div></li>';
        }).join('') + '</ul>';
        if (!canSend) html += '<p class="muted-note">This account can prepare drafts but not send them. A person sends from their own account.</p>';
        html += '<div class="comms-sub">History</div>';
        if (!commsCache.messages.length) html += '<p class="muted-note">No sent or received mail with this customer yet.</p>';
        else html += '<ul class="timeline-list comms-history">' + commsCache.messages.map(function (m) {
          return '<li><span class="tl-date">' + escapeHtml(String(m.at).slice(0, 10)) + '</span> <span class="note-badge">' + (m.direction === 'sent' ? 'Sent' : 'Received') + '</span> ' +
            escapeHtml(m.subject || '(no subject)') + ' <span class="muted-note">' + escapeHtml(m.direction === 'sent' ? 'to ' + m.to.join(', ') : 'from ' + m.fromAddr) + '</span>' +
            (m.link ? ' <a href="' + escapeHtml(m.link) + '" target="_blank" rel="noopener">Open in Gmail</a>' : '') + '</li>';
        }).join('') + '</ul>';
      }
    }
    html += '</div></details>';
    root.innerHTML = html;

    var det = root.querySelector('details.rec-section');
    var adminLink = root.querySelector('[data-comms-admin-link]');
    if (adminLink) adminLink.addEventListener('click', function (e) { e.preventDefault(); setActiveAdmin(); });
    det.addEventListener('toggle', function () { if (det.open) loadComms(deal); });
    var c =root.querySelector('#comms-connect');
    if (c) c.addEventListener('click', function () {
      c.disabled = true;
      gmailApi().connect().then(function () { return loadComms(deal, true); }).catch(function (err) {
        alert('Could not connect Gmail: ' + ((err && err.message) || err));
      }).then(function () { renderCommunications(root, deal); root.querySelector('details.rec-section').open = true; });
    });
    var rf = root.querySelector('#comms-refresh');
    if (rf) rf.addEventListener('click', function () { loadComms(deal, true); });
    root.querySelectorAll('[data-comms-edit]').forEach(function (b) { b.addEventListener('click', function () { openDraftEditor(deal, b.getAttribute('data-comms-edit'), root); }); });
    root.querySelectorAll('[data-comms-send]').forEach(function (b) { b.addEventListener('click', function () { sendDraftByHuman(deal, b.getAttribute('data-comms-send'), root, b); }); });
    if (det.open && gmailConnected() && (!mine || !commsCache.loadedAt)) loadComms(deal);
  }

  function openDraftEditor(deal, draftId, root) {
    var d = commsCache.drafts.find(function (x) { return x.draftId === draftId; });
    if (!d) return;
    var html = '<div class="modal-title-row"><h2>Edit draft</h2></div><form id="draft-form">' +
      '<div class="field"><label for="dr-to">To</label><input type="text" id="dr-to" value="' + escapeHtml(d.to.join(', ')) + '" /></div>' +
      '<div class="field"><label for="dr-subject">Subject</label><input type="text" id="dr-subject" value="' + escapeHtml(d.subject) + '" /></div>' +
      '<div class="field"><label for="dr-body">Message</label><textarea id="dr-body" rows="10">' + escapeHtml(d.body) + '</textarea></div>' +
      '<p class="muted-note">Saving updates the draft in Gmail. It does not send it.</p>' +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button><button type="submit" id="dr-save">Save draft</button></div></form>';
    var m = openJobModal(html, 'lg');
    m.querySelector('#draft-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var raw = StuffMigrate.buildRawMessage({
        to: m.querySelector('#dr-to').value, cc: d.cc, subject: m.querySelector('#dr-subject').value, body: m.querySelector('#dr-body').value,
        inReplyTo: d.references ? d.references.split(/\s+/).pop() : '', references: d.references
      });
      var btn = m.querySelector('#dr-save');
      btn.disabled = true;
      gmailApi().updateDraft(draftId, raw, d.threadId).then(function () {
        logChange('comms-draft', 'lead', deal.id, 'Edited Gmail draft "' + (m.querySelector('#dr-subject').value || '(no subject)') + '" for ' + cardTitle(deal) + ' (not sent)');
        save();
        closeJobModal();
        return loadComms(deal, true);
      }).catch(function (err) { btn.disabled = false; alert('Could not save the draft: ' + ((err && err.message) || err)); });
    });
  }

  function sendDraftByHuman(deal, draftId, root, btn) {
    var d = commsCache.drafts.find(function (x) { return x.draftId === draftId; });
    if (!d || !gmailConnected()) return;
    btn.disabled = true;
    checkIsBotAccount().then(function (isBot) {
      if (isBot) { alert('This account can prepare drafts but not send them.'); return; }
      var from = gmailApi().email();
      if (!confirm('Send "' + (d.subject || '(no subject)') + '" to ' + d.to.join(', ') + ' from ' + from + '?')) return;
      return gmailApi().sendDraft(draftId).then(function (sent) {
        var at = nowIso();
        if (!Array.isArray(state.changeLog)) state.changeLog = [];
        state.changeLog.push({
          id: StuffMigrate.makeId('chg'), at: at, who: from, by: from, actedFor: null, source: 'human', action: 'comms-send',
          entityType: 'lead', entityId: deal.id, field: null, oldValue: null,
          newValue: { to: d.to, subject: d.subject, threadId: (sent && sent.threadId) || d.threadId, messageId: (sent && sent.id) || null },
          detail: 'Sent email "' + (d.subject || '(no subject)') + '" to ' + d.to.join(', ') + ' from ' + from + ' (' + cardTitle(deal) + ')'
        });
        save();
        return loadComms(deal, true);
      });
    }).catch(function (err) { alert('Not sent: ' + ((err && err.message) || err)); }).then(function () { btn.disabled = false; });
  }

  // =====================================================================
  // Meeting notes (issue #19): Gemini takeaways on leads and customers. Flip through notes newest
  // first; action items become Matrix tasks (CRM > Follow Ups) linked back by taskId, once.
  // =====================================================================
  var meetingPager = {};

  function taskForActionItem(rec, entityType, item, note) {
    var isLead = entityType === 'lead';
    var t = {
      id: 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
      title: item.text, dueDate: null, done: false,
      dealId: isLead ? rec.id : null, entityType: isLead ? 'lead' : 'customer', entityId: rec.id,
      bucket: 'tasks-crm-follow-ups', createdAt: nowIso(), completedAt: null, quadrant: null, personal: false, urgent: false,
      delegatedTo: null, decideOption: null, suppressed: false, dismissedAt: null
    };
    if (!state.tasks) state.tasks = [];
    state.tasks.push(t);
    logChange('create', 'task', t.id, 'Task from meeting ' + String(note.meetingAt).slice(0, 10) + ' (' + (rec.company || rec.name || rec.id) + '): ' + item.text);
    return t;
  }

  // Checklist items added by a stage rule (#57). Shown on the lead until ticked; ticked items stay for the record.
  function renderDealChecklist(root, deal) {
    if (!root) return;
    var list = deal.checklist || [];
    root.innerHTML = list.map(function (c) {
      return '<label class="check-line"><input type="checkbox" data-chk="' + escapeHtml(c.id) + '"' + (c.done ? ' checked' : '') + ' /> ' +
        '<span' + (c.done ? ' class="is-done"' : '') + '>' + escapeHtml(c.text) + '</span></label>';
    }).join('');
    root.querySelectorAll('[data-chk]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var item = (deal.checklist || []).find(function (x) { return x.id === cb.getAttribute('data-chk'); });
        if (!item) return;
        item.done = cb.checked;
        item.doneAt = cb.checked ? nowIso() : null;
        deal.updatedAt = nowIso();
        logChange('update', 'lead', deal.id, (cb.checked ? 'Ticked' : 'Unticked') + ' checklist item: ' + item.text);
        save();
        renderDealChecklist(root, deal);
      });
    });
  }

  // Structured call note fields (issue #94): people, topics, commitments both ways, next action, transcript.
  function callNoteFieldsHtml(n) {
    function due(x) { return x.due ? ' (due ' + escapeHtml(x.due) + ')' : ''; }
    function list(label, items, fmt) {
      if (!items || !items.length) return '';
      return '<div class="comms-sub">' + label + '</div><ul class="mtg-list">' + items.map(function (x) { return '<li>' + fmt(x) + '</li>'; }).join('') + '</ul>';
    }
    var html = '<div class="mtg-fields">';
    html += list('People', n.persons, function (p) {
      return escapeHtml(p.name || p.email) + (p.name && p.email ? ' <span class="muted-note">' + escapeHtml(p.email) + '</span>' : '');
    });
    html += list('Topics', n.topics, function (t) { return escapeHtml(t); });
    html += list('Owner committed to', n.commitmentsOwner, function (c) { return escapeHtml(c.text) + due(c); });
    html += list('They committed to', n.commitmentsOther, function (c) { return (c.who ? escapeHtml(c.who) + ': ' : '') + escapeHtml(c.text) + due(c); });
    if (n.nextAction) {
      html += '<div class="comms-sub">Next action</div><div class="mtg-next">' + escapeHtml(n.nextAction.text) +
        ' <span class="note-badge">' + (n.nextAction.owner ? 'Owner: ' + escapeHtml(n.nextAction.owner) : 'No owner') + '</span>' + due(n.nextAction) + '</div>';
    }
    if (n.transcriptUrl && /^https:\/\//i.test(n.transcriptUrl)) {
      html += '<div class="mtg-transcript"><a href="' + escapeHtml(n.transcriptUrl) + '" target="_blank" rel="noopener noreferrer">Open transcript</a></div>';
    }
    var missing = StuffMigrate.callNoteMissing(n);
    if (missing.length) html += '<p class="muted-note mtg-missing">Missing: ' + escapeHtml(missing.join(', ')) + '</p>';
    return html + '</div>';
  }

  function renderMeetingNotes(root, rec, entityType) {
    if (!root || !rec) return;
    var notes = StuffMigrate.meetingNotesNewestFirst(rec);
    var wasOpen = !!root.querySelector('details.rec-section[open]');
    var i = Math.min(meetingPager[rec.id] || 0, Math.max(0, notes.length - 1));
    meetingPager[rec.id] = i;
    var html = '<details class="rec-section meeting-notes" data-sec="meetings"' + (wasOpen ? ' open' : '') + '><summary><span class="rec-sec-label">Meeting notes</span><span class="rec-sec-note">' +
      (notes.length ? notes.length + ' meeting' + (notes.length === 1 ? '' : 's') : '') + '</span></summary><div class="rec-sec-body">';
    if (!notes.length) html += '<p class="muted-note">No meeting notes yet. Import Gemini takeaways in Admin tools, Import meeting notes JSON.</p>';
    else {
      var n = notes[i];
      html += '<div class="mtg-pager"><button type="button" class="ghost" id="mtg-newer"' + (i === 0 ? ' disabled' : '') + '>Newer</button>' +
        '<span class="muted-note">' + (i + 1) + ' of ' + notes.length + '</span>' +
        '<button type="button" class="ghost" id="mtg-older"' + (i >= notes.length - 1 ? ' disabled' : '') + '>Older</button></div>';
      html += '<div class="mtg-note" data-note-id="' + escapeHtml(n.id) + '"><div class="note-meta"><span>' + escapeHtml(StuffMigrate.callTimePacific(n.meetingAt)) + '</span><span class="note-badge">Gemini</span></div>' +
        (n.title ? '<div class="note-title">' + escapeHtml(n.title) + '</div>' : '') +
        (n.body ? '<div class="note-body">' + escapeHtml(n.body) + '</div>' : '') +
        callNoteFieldsHtml(n);
      var items = n.actionItems || [];
      if (items.length) {
        html += '<div class="comms-sub">Action items</div><ul class="mtg-items">' + items.map(function (a) {
          var t = a.taskId ? (state.tasks || []).find(function (x) { return x.id === a.taskId; }) : null;
          return '<li><span>' + escapeHtml(a.text) + '</span>' + (t ? ' <span class="note-badge">Task ' + (t.done ? 'done' : 'open') + '</span>' :
            ' <button type="button" class="link-btn" data-mtg-task="' + escapeHtml(a.id) + '">Create task</button>') + '</li>';
        }).join('') + '</ul>';
        var open = items.filter(function (a) { var t = a.taskId && (state.tasks || []).find(function (x) { return x.id === a.taskId; }); return !t && !a.done; });
        if (open.length > 1) html += '<div class="admin-actions"><button type="button" class="secondary" id="mtg-all">Create tasks from ' + open.length + ' open items</button></div>';
      }
      html += '</div>';
    }
    html += '</div></details>';
    root.innerHTML = html;
    var rerender = function () { renderMeetingNotes(root, rec, entityType); root.querySelector('details').open = true; };
    var nw = root.querySelector('#mtg-newer'), od = root.querySelector('#mtg-older');
    if (nw) nw.addEventListener('click', function () { meetingPager[rec.id] = Math.max(0, i - 1); rerender(); });
    if (od) od.addEventListener('click', function () { meetingPager[rec.id] = i + 1; rerender(); });
    function createFor(itemId) {
      var note = notes[i];
      return StuffMigrate.linkActionItemTask(state, rec, note.id, itemId, function (item, nn) { return taskForActionItem(rec, entityType, item, nn); });
    }
    root.querySelectorAll('[data-mtg-task]').forEach(function (b) {
      b.addEventListener('click', function () { if (createFor(b.getAttribute('data-mtg-task')).created) { rec.updatedAt = nowIso(); save(); } rerender(); });
    });
    var all = root.querySelector('#mtg-all');
    if (all) all.addEventListener('click', function () {
      var made = 0;
      (notes[i].actionItems || []).forEach(function (a) { if (!a.done && createFor(a.id).created) made += 1; });
      if (made) { rec.updatedAt = nowIso(); save(); }
      rerender();
    });
  }

  // Admin tools: Import meeting notes JSON (same idea as Import PO JSON; dry run first).
  var lastMeetingResult = null;

  function runMeetingImport(text, dryRun) {
    var body;
    try { var parsed = JSON.parse(text); body = Array.isArray(parsed) ? { notes: parsed } : parsed; } catch (e) {
      lastMeetingResult = { dryRun: dryRun, lines: ['Could not read the JSON: ' + (e && e.message ? e.message : e)] };
      renderAdmin();
      return Promise.resolve(lastMeetingResult);
    }
    return resolveEnrichAccess().then(function (acc) {
      if (!acc.ok) { lastMeetingResult = { dryRun: dryRun, lines: [acc.reason.replace('import enrichment', 'import meeting notes')] }; return; }
      if (!acc.isAdmin && (acc.sections || {}).customers !== 'write') { lastMeetingResult = { dryRun: dryRun, lines: ['Meeting notes import needs write access to Customers.'] }; return; }
      if (!dryRun && !takeSnapshot('before-meeting-import')) { lastMeetingResult = { dryRun: dryRun, lines: ['Snapshot failed (browser storage may be full). Nothing was imported.'] }; return; }
      var working = JSON.parse(JSON.stringify(state));
      var res = StuffMigrate.applyMeetingNotesImport(working, body, { by: acc.by, actedFor: acc.actedFor, isAdmin: acc.isAdmin, frozen: botWritesFrozen() });
      var lines = StuffMigrate.meetingSummaryLines(res.summary);
      if (!dryRun && !res.summary.frozen) { state = working; save(); lines.unshift('Saved. Snapshot "before-meeting-import" is in Time machine.'); }
      else if (dryRun) lines.unshift('Dry run: nothing was saved.');
      lastMeetingResult = { dryRun: dryRun, lines: lines };
    }).catch(function (err) {
      lastMeetingResult = { dryRun: dryRun, lines: ['Import failed, nothing was saved: ' + (err && err.message ? err.message : err)] };
    }).then(function () { if (activeView === 'admin') renderAdmin(); return lastMeetingResult; });
  }

  function meetingImportCardHtml() {
    var html = '<section class="admin-card" id="meeting-import-card"><h3>Import meeting notes JSON</h3>';
    html += '<p class="muted-note">Paste Gemini call notes as JSON: a list of notes, each with leadId, customerId or email (or persons with emails), callTime (Pacific unless it has Z or an offset), title, body, persons, topics, commitmentsOwner, commitmentsOther, nextAction with owner, transcriptUrl and actionItems. Importing the same call again adds nothing new. Nothing is deleted. A snapshot is taken first.</p>';
    html += '<textarea id="adm-mtg-json" class="adm-json" rows="6" spellcheck="false" placeholder=\'[ { "email": "buyer@example.com", "callTime": "2026-10-06 10:00", "title": "Kickoff", "persons": ["Buyer <buyer@example.com>"], "topics": ["Sizes"], "commitmentsOwner": ["Send quote"], "commitmentsOther": ["Send artwork"], "nextAction": { "text": "Send quote", "owner": "Owner" }, "transcriptUrl": "https://docs.google.com/..." } ]\'></textarea>';
    html += '<div class="admin-actions"><label class="check-line"><input type="checkbox" id="adm-mtg-dry" checked /> Dry run</label><button type="button" class="secondary" id="adm-mtg-run">Import</button></div>';
    if (lastMeetingResult) html += '<div class="enrich-result" id="meeting-import-result"><strong>' + (lastMeetingResult.dryRun ? 'Dry run' : 'Import') + '</strong><ul>' +
      lastMeetingResult.lines.map(function (l) { return '<li>' + escapeHtml(l) + '</li>'; }).join('') + '</ul></div>';
    return html + '</section>';
  }

  function bindMeetingImportCard() {
    var btn = document.getElementById('adm-mtg-run');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var text = (document.getElementById('adm-mtg-json').value || '').trim();
      if (!text) { alert('Paste the meeting notes JSON first.'); return; }
      btn.disabled = true;
      runMeetingImport(text, document.getElementById('adm-mtg-dry').checked);
    });
  }

  // =====================================================================
  // Lead and customer sections (issue #8). Collapsible blocks on the lead editor and the
  // customer page. Each block saves on its own (the lead form's unsaved edits are untouched)
  // and every change is logged by the StuffMigrate section helpers.
  // =====================================================================
  var SOPH_RUBRIC = ['1 First-time individual, vague idea', '2 Individual with clear idea or sketch', '3 Specs, CAD or real quantities',
    '4 Operating business with product in market or funding', '5 Established company or engineer buyer'];

  function sectionActor() { return { by: (auth.user && auth.user.email) || currentUserName() || 'user' }; }

  function sectionValueHtml(f, v) {
    if (v === undefined || v === null || v === '') return '';
    if ((f[2] || '') === 'url') return '<a href="' + escapeHtml(v) + '" target="_blank" rel="noopener">' + escapeHtml(f[1] === 'Link' ? 'open' : v) + '</a>';
    if ((f[2] || '') === 'number' && /amount/i.test(f[0])) return escapeHtml(formatMoney(Number(v) || 0));
    return escapeHtml(v);
  }

  function sectionFieldInput(f, v, prefix) {
    var id = prefix + f[0];
    var kind = f[2] || 'text';
    var val = v === undefined || v === null ? '' : v;
    var input;
    if (kind === 'textarea') input = '<textarea id="' + id + '" rows="2">' + escapeHtml(val) + '</textarea>';
    else if (kind === 'select') {
      input = '<select id="' + id + '"><option value="">Pick one</option>' + (f[3] || []).map(function (o) {
        return '<option value="' + escapeHtml(o) + '"' + (String(o) === String(val) ? ' selected' : '') + '>' + escapeHtml(o.charAt(0).toUpperCase() + o.slice(1)) + '</option>';
      }).join('') + '</select>';
    } else {
      var type = kind === 'date' ? 'date' : kind === 'number' ? 'number" step="any' : kind === 'url' ? 'text" inputmode="url" placeholder="https://' : 'text';
      input = '<input type="' + type + '" id="' + id + '" value="' + escapeHtml(val) + '" />';
    }
    return '<div class="field"><label for="' + id + '">' + escapeHtml(f[1]) + '</label>' + input + '</div>';
  }

  function openSectionModal(rec, entityType, def, rowId, onDone) {
    var row = def.type === 'list' && rowId ? (rec[def.key] || []).find(function (r) { return r.id === rowId; }) : null;
    var cur = def.type === 'object' ? (rec[def.key] || {}) : (row || {});
    var title = def.type === 'object' ? def.label : (row ? 'Edit: ' : 'Add: ') + def.label;
    var html = '<div class="modal-title-row"><h2>' + escapeHtml(title) + '</h2></div><form id="sec-form">' +
      def.fields.map(function (f) { return sectionFieldInput(f, cur[f[0]], 'sec-'); }).join('') +
      (def.type === 'list' ? '<p class="muted-note">Rows are kept; edit a row instead of removing it.</p>' : '') +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button><button type="submit" id="sec-save">Save</button></div></form>';
    var m = openJobModal(html, 'sm');
    m.querySelector('#sec-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var raw = {};
      def.fields.forEach(function (f) { raw[f[0]] = m.querySelector('#sec-' + f[0]).value; });
      var r;
      if (def.type === 'object') r = StuffMigrate.setRecordSection(state, rec, entityType, def.key, raw, sectionActor());
      else if (row) r = StuffMigrate.updateRecordSectionRow(state, rec, entityType, def.key, row.id, raw, sectionActor());
      else {
        r = StuffMigrate.addRecordSectionRow(state, rec, entityType, def.key, raw, sectionActor());
        if (r.duplicate) { alert('That row is already there.'); return; }
        if (!r.row) { alert('Fill in at least one field.'); return; }
      }
      if (r.bad && r.bad.length) alert('Not saved (check the format): ' + r.bad.join(', ') + '.');
      closeJobModal();
      save();
      if (onDone) onDone();
    });
  }

  // #51: moving a lead past Inbound asks for a next step date (3 business days out) and optional text.
  // Cancel leaves the lead where it was. Same shape as the Lost reason prompt.
  // opts (#52 Today > Done): { note, button, min } replace the move wording and set the earliest date.
  function openNextStepModal(deal, stage, onDone, opts) {
    opts = opts || {};
    var def = opts.date || StuffMigrate.addBusinessDays(nowIso(), 3);
    var html = '<div class="modal-title-row"><h2>Next step for ' + escapeHtml(cardTitle(deal)) + '</h2></div><form id="nextstep-form">' +
      '<p class="muted-note">' + escapeHtml(opts.note || ('Moving to ' + stageLabel(stage) + '. When is the next step?')) + '</p>' +
      '<div class="field"><label for="ns-date">Next step date</label><input type="date" id="ns-date" required' + (opts.min ? ' min="' + opts.min + '"' : '') + ' value="' + def + '" /></div>' +
      '<div class="field"><label for="ns-text">Next step</label><input type="text" id="ns-text" placeholder="Optional" value="' + escapeHtml(opts.text || '') + '" /></div>' +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button><button type="submit" id="ns-save">' + escapeHtml(opts.button || 'Move') + '</button></div></form>';
    var m = openJobModal(html, 'sm');
    m.querySelector('#nextstep-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var date = m.querySelector('#ns-date').value;
      if (!date) return;
      var text = m.querySelector('#ns-text').value.trim();
      closeJobModal();
      onDone(date, text);
    });
  }

  function openLostReasonModal(deal, onDone) {
    var cur = deal.lostReason || {};
    var html = '<div class="modal-title-row"><h2>Why was ' + escapeHtml(cardTitle(deal)) + ' lost?</h2></div><form id="lost-form">' +
      '<div class="field"><label for="lost-code">Reason</label><select id="lost-code" required><option value="">Pick a reason</option>' +
      StuffMigrate.LOST_REASONS.map(function (r) { return '<option value="' + r[0] + '"' + (r[0] === cur.code ? ' selected' : '') + '>' + escapeHtml(r[1]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="lost-text">Details</label><textarea id="lost-text" rows="2" placeholder="Required for Other">' + escapeHtml(cur.text || '') + '</textarea></div>' +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button><button type="submit" id="lost-save">Save reason</button></div></form>';
    var m = openJobModal(html, 'sm');
    m.querySelector('#lost-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var r = StuffMigrate.setLostReason(state, deal, m.querySelector('#lost-code').value, m.querySelector('#lost-text').value, sectionActor());
      if (!r.ok) { alert(r.error); return; }
      closeJobModal();
      save();
      if (onDone) onDone();
    });
  }

  // Stage editor > On enter rules (#57). Suggested defaults are listed, never auto-enabled.
  function openStageRulesModal(stage) {
    var isWon = StuffMigrate.KPI_WON_STAGES.indexOf(stage) !== -1;
    function ruleRowHtml(r) {
      return '<li class="rule-row"><span>' + escapeHtml(StuffMigrate.stageRuleText(r)) + '</span> <button type="button" class="link-btn" data-rule-del="' + escapeHtml(r.id) + '">Remove</button></li>';
    }
    function draw() {
      var rules = StuffMigrate.stageRulesFor(state, stage);
      var sug = StuffMigrate.stageRuleSuggestions(state, stage);
      var kinds = StuffMigrate.STAGE_RULE_KINDS.filter(function (k) { return k !== 'project' || isWon; });
      var html = '<div class="modal-title-row"><h2>On enter: ' + escapeHtml(stageLabel(stage)) + '</h2></div>' +
        '<p class="muted-note">' + (isWon ? 'Runs when a lead is marked won. Mark won is the confirmation for Create project.' : 'Runs once when a lead moves into this stage, by hand or by a bot.') +
        ' Use {company}, {title} and {contact} in text.</p>' +
        '<ul class="rule-list">' + (rules.length ? rules.map(ruleRowHtml).join('') : '<li class="muted-note">No rules on this stage.</li>') + '</ul>';
      if (sug.length) {
        html += '<div class="section-title">Suggested</div><ul class="rule-list">' + sug.map(function (s, i) {
          return '<li class="rule-row"><span>' + escapeHtml(StuffMigrate.stageRuleText(StuffMigrate.normalizeStageRule(s))) + '</span> <button type="button" class="ghost" data-rule-sug="' + i + '">Accept</button></li>';
        }).join('') + '</ul>';
      }
      html += '<div class="section-title">Add a rule</div><form id="rule-form">' +
        '<div class="row"><div class="field"><label for="rl-kind">Do this</label><select id="rl-kind">' +
        kinds.map(function (k) { return '<option value="' + k + '">' + escapeHtml(StuffMigrate.STAGE_RULE_KIND_LABEL[k]) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field" data-rl="title"><label for="rl-title">Text</label><input type="text" id="rl-title" placeholder="Quote {company}" /></div>' +
        '<div class="field" data-rl="days"><label for="rl-days">Business days out</label><input type="number" id="rl-days" min="0" max="365" value="3" /></div></div>' +
        '<div class="row" data-rl="task"><div class="field"><label for="rl-bucket">Task bucket</label><select id="rl-bucket">' +
        TASK_GROUPS.map(function (g) { return g.buckets.map(function (b) { return '<option value="' + escapeHtml(b.id) + '"' + (b.id === 'tasks-crm-follow-ups' ? ' selected' : '') + '>' + escapeHtml(g.label + ': ' + b.label) + '</option>'; }).join(''); }).join('') + '</select></div>' +
        '<div class="field"><label for="rl-deleg">Delegate</label><select id="rl-deleg"><option value="">No one</option>' +
        ensureDelegatees().map(function (n) { return '<option value="' + escapeHtml(n) + '">' + escapeHtml(n) + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="field" data-rl="items"><label for="rl-items">Checklist items, one per line</label><textarea id="rl-items" rows="3"></textarea></div>' +
        '<p class="muted-note" data-rl="project">Asks you before it creates anything, then opens Mark won.</p>' +
        '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Close</button><button type="submit">Add rule</button></div></form>';
      var m = openJobModal(html, 'lg');
      function sync() {
        var k = m.querySelector('#rl-kind').value;
        var show = { title: k === 'task' || k === 'nextStep', days: k === 'task' || k === 'nextStep', task: k === 'task', items: k === 'checklist', project: k === 'project' };
        m.querySelectorAll('[data-rl]').forEach(function (el) { el.style.display = show[el.getAttribute('data-rl')] ? '' : 'none'; });
      }
      m.querySelector('#rl-kind').addEventListener('change', sync);
      sync();
      function added(r) {
        if (!r.ok) { alert(r.error); return; }
        logChange('create', 'rule', r.rule.id, 'Stage rule on ' + stageLabel(stage) + ': ' + StuffMigrate.stageRuleText(r.rule));
        save();
        draw();
        renderBoard();
      }
      m.querySelectorAll('[data-rule-del]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-rule-del');
          var rule = rules.find(function (x) { return x.id === id; });
          if (!StuffMigrate.removeStageRule(state, stage, id)) return;
          logChange('delete', 'rule', id, 'Removed stage rule from ' + stageLabel(stage) + ': ' + (rule ? StuffMigrate.stageRuleText(rule) : id));
          save();
          draw();
          renderBoard();
        });
      });
      m.querySelectorAll('[data-rule-sug]').forEach(function (b) {
        b.addEventListener('click', function () { added(StuffMigrate.addStageRule(state, stage, sug[Number(b.getAttribute('data-rule-sug'))], nowIso())); });
      });
      m.querySelector('#rule-form').addEventListener('submit', function (e) {
        e.preventDefault();
        added(StuffMigrate.addStageRule(state, stage, {
          kind: m.querySelector('#rl-kind').value, title: m.querySelector('#rl-title').value, days: m.querySelector('#rl-days').value,
          bucket: m.querySelector('#rl-bucket').value, delegate: m.querySelector('#rl-deleg').value, items: m.querySelector('#rl-items').value
        }, nowIso()));
      });
    }
    draw();
  }

  // A lead moving to Lost needs a reason given after it entered its current stage.
  function needsLostReason(deal, targetStage) {
    if (!deal || isProjectCard(deal) || !isLostStage(targetStage) || isLostStage(deal.stage)) return false;
    var r = deal.lostReason;
    return !(r && r.at && (!deal.stageEnteredAt || String(r.at) >= String(deal.stageEnteredAt)));
  }

  // #50: on a lead the next step lives in the core block, so the open items section shows the rest.
  function sectionViewDef(def, entityType) {
    if (!def || def.key !== 'openItems' || entityType !== 'lead') return def;
    return Object.assign({}, def, { label: 'Open questions and risks', fields: def.fields.filter(function (f) { return f[0] !== 'nextStep'; }) });
  }

  function sectionViewSummary(rec, def) {
    if (def.type !== 'object' || def.fields.length === StuffMigrate.recordSection(def.key).fields.length) return StuffMigrate.recordSectionSummary(rec, def.key);
    var o = {}, src = rec[def.key] || {};
    def.fields.forEach(function (f) { if (src[f[0]] !== undefined) o[f[0]] = src[f[0]]; });
    var tmp = {}; tmp[def.key] = o;
    return StuffMigrate.recordSectionSummary(tmp, def.key);
  }

  // Billing totals for a customer, read-only (#50 replaces #8's invoice list). Open is invoiced, not paid yet.
  function billingTotalsText(customerId) {
    var t = StuffMigrate.billingTotals(StuffMigrate.billingEntriesFor(state, customerId));
    return { totals: t, text: 'Invoiced ' + formatCents(t.invoiced + t.paid) + ', paid ' + formatCents(t.paid) + ', open ' + formatCents(t.invoiced) +
      (t.unbilled ? ', unbilled ' + formatCents(t.unbilled) : '') };
  }

  function renderRecordSections(root, rec, entityType, opts) {
    if (!root || !rec) return;
    var skip = (opts && opts.skip) || [];
    // Keep the sections that were open across a re-render after a save.
    var wasOpen = {};
    root.querySelectorAll('details.rec-section[open]').forEach(function (d) { wasOpen[d.getAttribute('data-sec')] = true; });
    var rerender = function () { renderRecordSections(root, entityType === 'lead' ? getDeal(rec.id) || rec : getCustomer(rec.id) || rec, entityType, opts); if (activeView === 'board') renderBoard(); };
    var html = '';
    var filled = 0;
    // Filled: label plus a one-line summary. Empty: "Add <section>" and no form until clicked.
    function block(key, label, summary, body, isEmpty) {
      if (!isEmpty) filled += 1;
      var head = isEmpty ? '<span class="rec-sec-label rec-sec-add">Add ' + escapeHtml(label.charAt(0).toLowerCase() + label.slice(1)) + '</span>'
        : '<span class="rec-sec-label">' + escapeHtml(label) + '</span><span class="rec-sec-note">' + escapeHtml(summary) + '</span>';
      return '<details class="rec-section' + (isEmpty ? ' is-empty' : '') + '" data-sec="' + key + '"' + (wasOpen[key] ? ' open' : '') + '><summary>' + head +
        '</summary><div class="rec-sec-body">' + body + '</div></details>';
    }
    // Lost reason (leads) stays outside Add details: it is required to move to Lost.
    var lostHtml = '';
    if (entityType === 'lead' && (rec.lostReason || isLostStage(rec.stage))) {
      var lr = rec.lostReason;
      lostHtml = '<details class="rec-section rec-lost" data-sec="lost"' + (wasOpen.lost ? ' open' : '') + '><summary><span class="rec-sec-label">Lost or pause reason</span><span class="rec-sec-note">' +
        escapeHtml(lr ? StuffMigrate.lostReasonLabel(lr.code) : '') + '</span></summary><div class="rec-sec-body">' +
        (lr ? '<p>' + escapeHtml(StuffMigrate.lostReasonLabel(lr.code)) + (lr.text ? ': ' + escapeHtml(lr.text) : '') + '</p>' : '') +
        '<div class="admin-actions"><button type="button" class="secondary" id="rs-lost">' + (lr ? 'Change reason' : 'Add reason') + '</button></div></div></details>';
    }
    // Billing totals (read-only, from the Billing ledger).
    var billCust = entityType === 'lead' ? rec.customerId : null;
    if (billCust && getCustomer(billCust)) {
      var bt = billingTotalsText(billCust);
      html += '<div class="rec-section rec-billing" data-sec="billing"><div class="rec-billing-row"><span class="rec-sec-label">Billing</span>' +
        '<span class="rec-sec-note">' + escapeHtml(bt.totals.count ? bt.text : 'no charges yet') + '</span>' +
        '<button type="button" class="link-btn" id="rs-billing-open">Open Billing</button></div></div>';
    }
    // Sophistication (internal only).
    var sc = rec.sophisticationScore;
    if (skip.indexOf('sophistication') === -1) html += block('sophistication', 'Sophistication (internal)', sc ? sc + ' of 5' : '',
      '<div class="row"><div class="field"><label for="rs-soph">Score</label><select id="rs-soph"><option value="">Not set</option>' +
      [1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + (n === sc ? ' selected' : '') + '>' + escapeHtml(SOPH_RUBRIC[n - 1]) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="field"><label for="rs-soph-notes">Evidence</label><textarea id="rs-soph-notes" rows="2">' + escapeHtml(rec.sophisticationNotes || '') + '</textarea></div>' +
      '<p class="muted-note">Internal only. Never shown to the customer.</p><div class="admin-actions"><button type="button" class="secondary" id="rs-soph-save">Save score</button></div>', !sc);
    // Drive folder (customers).
    if (entityType === 'customer') {
      var dUrl = rec.driveFolderUrl || (rec.driveFolderId ? 'https://drive.google.com/drive/folders/' + encodeURIComponent(rec.driveFolderId) : '');
      html += block('drive', 'Drive folder', dUrl ? 'linked' : '',
        (dUrl ? '<p><a href="' + escapeHtml(dUrl) + '" target="_blank" rel="noopener">Open the customer folder</a></p>' : '') +
        '<div class="row"><div class="field"><label for="rs-drive">Folder link</label><input type="text" inputmode="url" id="rs-drive" placeholder="https://drive.google.com/..." value="' + escapeHtml(rec.driveFolderUrl || '') + '" /></div></div>' +
        '<div class="admin-actions"><button type="button" class="secondary" id="rs-drive-save">Save link</button></div>', !dUrl);
    }
    // Object and list sections.
    StuffMigrate.RECORD_SECTIONS.forEach(function (base) {
      var def = sectionViewDef(base, entityType);
      var v = rec[def.key];
      var empty = def.type === 'object' ? !def.fields.some(function (f) { return v && v[f[0]] !== undefined && v[f[0]] !== ''; }) : StuffMigrate.isRecordSectionEmpty(rec, def.key);
      var body = '';
      if (def.type === 'object') {
        v = v || {};
        if (!empty) body += '<dl class="note-fields">' + def.fields.filter(function (f) { return v[f[0]] !== undefined && v[f[0]] !== ''; })
          .map(function (f) { return '<dt>' + escapeHtml(f[1]) + '</dt><dd>' + sectionValueHtml(f, v[f[0]]) + '</dd>'; }).join('') + '</dl>';
        body += '<div class="admin-actions"><button type="button" class="secondary" data-sec-edit="' + def.key + '">Edit</button></div>';
        html += block(def.key, def.label, empty ? '' : sectionViewSummary(rec, def), body, empty);
        return;
      }
      var rows = rec[def.key] || [];
      if (rows.length) {
        body += '<div class="table-wrap"><table class="kpi-table rec-rows"><thead><tr>' + def.fields.map(function (f) { return '<th>' + escapeHtml(f[1]) + '</th>'; }).join('') + '<th></th></tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr>' + def.fields.map(function (f) { return '<td>' + sectionValueHtml(f, r[f[0]]) + '</td>'; }).join('') +
              '<td><button type="button" class="link-btn" data-sec-row="' + def.key + '" data-row-id="' + escapeHtml(r.id) + '">Edit</button></td></tr>';
          }).join('') + '</tbody></table></div>';
      }
      body += '<div class="admin-actions"><button type="button" class="secondary" data-sec-add="' + def.key + '">Add</button></div>';
      html += block(def.key, def.label, rows.length ? StuffMigrate.recordSectionSummary(rec, def.key) : '', body, !rows.length);
    });
    // Communication timeline.
    var tl = entityType === 'customer' ? StuffMigrate.customerTimeline(state, rec.id) : StuffMigrate.timelineNewestFirst(rec.timeline);
    var tlBody = tl.length ? '<ul class="timeline-list">' + tl.map(function (e) {
      var src = e.url ? '<a href="' + escapeHtml(e.url) + '" target="_blank" rel="noopener">' + escapeHtml(e.source || 'source') + '</a>' : escapeHtml(e.source || '');
      return '<li>' + entryRowHtml(e, {
        date: String(e.at || '').slice(0, 10), sourceHtml: src,
        extraHtml: e.dealId && entityType === 'customer' ? '<span class="muted-note">' + escapeHtml(e.dealTitle || e.dealId) + '</span>' : ''
      }) + '</li>';
    }).join('') + '</ul>' : '';
    tlBody += '<div class="row"><div class="field"><label for="rs-tl-at">Date</label><input type="date" id="rs-tl-at" /></div>' +
      '<div class="field"><label for="rs-tl-url">Source link</label><input type="text" inputmode="url" id="rs-tl-url" placeholder="Gmail or Drive link" /></div></div>' +
      '<div class="field"><label for="rs-tl-text">What happened</label><input type="text" id="rs-tl-text" /></div>' +
      '<div class="admin-actions"><button type="button" class="secondary" id="rs-tl-add">Add to timeline</button></div>';
    if (skip.indexOf('timeline') === -1) html += block('timeline', 'Communication timeline', tl.length ? StuffMigrate.timelineSummary(tl) : '', tlBody, !tl.length);
    html = lostHtml + '<details class="rec-section add-details" data-sec="add-details"' + (wasOpen['add-details'] ? ' open' : '') + '><summary><span class="rec-sec-label">Add details</span>' +
      '<span class="rec-sec-note">' + (filled ? filled + ' filled' : '') + '</span></summary><div class="add-details-body">' + html + '</div></details>';
    root.innerHTML = html;

    var sSave = root.querySelector('#rs-soph-save');
    if (sSave) sSave.addEventListener('click', function () {
      var r = StuffMigrate.setSophistication(state, rec, entityType, root.querySelector('#rs-soph').value, root.querySelector('#rs-soph-notes').value, sectionActor());
      if (r.bad.length) { alert(r.bad.join(', ')); return; }
      if (r.changed) save();
      rerender();
    });
    var lb = root.querySelector('#rs-lost');
    if (lb) lb.addEventListener('click', function () { openLostReasonModal(rec, rerender); });
    var dSave = root.querySelector('#rs-drive-save');
    if (dSave) dSave.addEventListener('click', function () {
      var u = root.querySelector('#rs-drive').value.trim();
      if (u && !/^https?:\/\/\S+$/i.test(u)) { alert('Links must start with http:// or https://.'); return; }
      if (u === (rec.driveFolderUrl || '')) return;
      var old = rec.driveFolderUrl || '';
      if (u) rec.driveFolderUrl = u; else delete rec.driveFolderUrl;
      rec.updatedAt = nowIso();
      logChange('update', 'customer', rec.id, 'Drive folder link ' + (old ? 'changed' : 'added') + ' on ' + rec.name);
      save();
      rerender();
    });
    root.querySelectorAll('[data-sec-edit]').forEach(function (b) { b.addEventListener('click', function () { openSectionModal(rec, entityType, sectionViewDef(StuffMigrate.recordSection(b.getAttribute('data-sec-edit')), entityType), null, rerender); }); });
    var billOpen = root.querySelector('#rs-billing-open');
    if (billOpen) billOpen.addEventListener('click', function () { setActiveBilling(rec.customerId); });
    root.querySelectorAll('[data-sec-add]').forEach(function (b) { b.addEventListener('click', function () { openSectionModal(rec, entityType, StuffMigrate.recordSection(b.getAttribute('data-sec-add')), null, rerender); }); });
    root.querySelectorAll('[data-sec-row]').forEach(function (b) {
      b.addEventListener('click', function () { openSectionModal(rec, entityType, StuffMigrate.recordSection(b.getAttribute('data-sec-row')), b.getAttribute('data-row-id'), rerender); });
    });
    var tlAdd = root.querySelector('#rs-tl-add');
    if (tlAdd) tlAdd.addEventListener('click', function () {
      var r = StuffMigrate.addTimelineEntry(state, rec, entityType, {
        at: root.querySelector('#rs-tl-at').value, text: root.querySelector('#rs-tl-text').value, url: root.querySelector('#rs-tl-url').value,
        source: root.querySelector('#rs-tl-url').value ? (/mail\.google/.test(root.querySelector('#rs-tl-url').value) ? 'gmail' : /drive\.google|docs\.google/.test(root.querySelector('#rs-tl-url').value) ? 'drive' : 'link') : (sectionActor().by)
      }, sectionActor());
      if (r.error) { alert(r.error); return; }
      if (r.duplicate) { alert('That entry is already on the timeline.'); return; }
      save();
      rerender();
    });
  }

  // ---------------------------------------------------------------------
  // Contact modal (shared by Customer, Lead, and later Project)
  // ---------------------------------------------------------------------

  var contactModalCtx = null;

  function openContactModal(ctx) {
    contactModalCtx = ctx;
    var c = ctx.contactId ? getContact(ctx.contactId) : null;
    document.getElementById('contact-modal-title').textContent = c ? 'Edit contact' : 'New contact';
    document.getElementById('c-name').value = c ? (c.name || '') : '';
    document.getElementById('c-role').value = c ? (c.role || '') : '';
    document.getElementById('c-email').value = c ? (c.email || '') : '';
    document.getElementById('c-phone').value = c ? (c.phone || '') : '';
    document.getElementById('c-notes').value = c ? (c.notes || '') : '';
    document.getElementById('c-buying-role').value = c && c.buyingRole ? c.buyingRole : '';
    document.getElementById('c-decision-maker').checked = !!(c && c.decisionMaker);
    document.getElementById('c-more').open = !!(c && (c.buyingRole || c.decisionMaker));
    var existingCount = contactsForCustomer(ctx.customerId).length;
    document.getElementById('c-primary').checked = c ? !!c.isPrimary : existingCount === 0;
    document.getElementById('c-delete').style.display = c ? '' : 'none';
    document.getElementById('c-log').style.display = c ? '' : 'none';
    document.getElementById('contact-modal-backdrop').classList.add('open');
    setTimeout(function () { document.getElementById('c-name').focus(); }, 0);
  }

  function closeContactModal() {
    document.getElementById('contact-modal-backdrop').classList.remove('open');
    contactModalCtx = null;
  }

  function saveContactFromModal() {
    var ctx = contactModalCtx;
    if (!ctx) return;
    var name = document.getElementById('c-name').value.trim();
    if (!name) { alert('Name is required.'); return; }
    var fields = {
      name: name,
      role: document.getElementById('c-role').value.trim(),
      email: document.getElementById('c-email').value.trim(),
      phone: document.getElementById('c-phone').value.trim(),
      notes: document.getElementById('c-notes').value.trim()
    };
    var buyingRole = document.getElementById('c-buying-role').value;
    var decisionMaker = document.getElementById('c-decision-maker').checked;
    var makePrimary = document.getElementById('c-primary').checked;
    var c = ctx.contactId ? getContact(ctx.contactId) : null;
    if (c) {
      Object.assign(c, fields);
      c.updatedAt = nowIso();
      logChange('update', 'contact', c.id, 'Edited ' + c.name);
    } else {
      c = StuffMigrate.createContact(state, ctx.customerId, fields, nowIso());
      logChange('create', 'contact', c.id, 'Added ' + c.name);
    }
    // #8: buying role and decision maker, stored only when set.
    if ((c.buyingRole || '') !== buyingRole || !!c.decisionMaker !== decisionMaker) {
      logChange('update', 'contact', c.id, c.name + ': buying role ' + (buyingRole || 'none') + (decisionMaker ? ', decision maker' : ''));
    }
    if (buyingRole) c.buyingRole = buyingRole; else delete c.buyingRole;
    if (decisionMaker) c.decisionMaker = true; else delete c.decisionMaker;
    if (makePrimary) setPrimaryContact(ctx.customerId, c.id);
    if (contactsForCustomer(ctx.customerId).length === 1) c.isPrimary = true;
    if (ctx.dealId) {
      var deal = getDeal(ctx.dealId);
      if (deal) {
        if (!Array.isArray(deal.contactIds)) deal.contactIds = [];
        if (deal.contactIds.indexOf(c.id) === -1) deal.contactIds.push(c.id);
        if (makePrimary || !deal.primaryContactId) deal.primaryContactId = c.id;
      }
    }
    save();
    closeContactModal();
    if (ctx.onDone) ctx.onDone(); else renderApp();
  }

  function deleteContactFromModal() {
    var ctx = contactModalCtx;
    if (!ctx || !ctx.contactId) return;
    var c = getContact(ctx.contactId);
    if (!c) return;
    if (!confirm('Delete contact ' + c.name + '? It will be unlinked from every lead on this customer.')) return;
    state.contacts = state.contacts.filter(function (x) { return x.id !== c.id; });
    (state.deals || []).forEach(function (d) {
      if (Array.isArray(d.contactIds)) d.contactIds = d.contactIds.filter(function (id) { return id !== c.id; });
      if (d.primaryContactId === c.id) d.primaryContactId = d.contactIds && d.contactIds[0] ? d.contactIds[0] : null;
    });
    var rest = contactsForCustomer(c.customerId);
    if (rest.length && !rest.some(function (x) { return x.isPrimary; })) rest[0].isPrimary = true;
    logChange('delete', 'contact', c.id, 'Deleted ' + c.name);
    save();
    closeContactModal();
    if (ctx.onDone) ctx.onDone(); else renderApp();
  }

  // Shared Contacts section. ownerType 'customer' shows every contact; 'lead' shows linked contacts
  // plus a picker for the customer's other contacts.
  function renderContactsSection(root, opts) {
    if (!root) return;
    var ownerType = opts.ownerType;
    var owner = opts.owner;
    var customerId = ownerType === 'customer' ? owner.id : owner.customerId;
    var onDone = opts.onDone || function () { renderApp(); };
    if (!customerId) {
      root.innerHTML = '<div class="contacts-empty">' +
        (owner.type === 'internal' ? 'Internal purchasing card. No customer contacts.' : 'No customer linked yet. Save the card with a company name first.') +
        '</div>';
      return;
    }
    var all = contactsForCustomer(customerId);
    var shown = ownerType === 'customer' ? all : linkedContactsForDeal(owner);
    var html = '<div class="contacts-list">';
    shown.forEach(function (c) {
      var isPrim = ownerType === 'customer' ? !!c.isPrimary : (owner.primaryContactId === c.id);
      html += '<div class="contact-row" data-contact-id="' + escapeHtml(c.id) + '">' +
        '<button type="button" class="contact-star' + (isPrim ? ' on' : '') + '" data-action="star" title="' + (isPrim ? 'Primary contact' : 'Set as primary') + '" aria-label="Set primary">' + (isPrim ? '\u2605' : '\u2606') + '</button>' +
        '<div class="contact-main">' +
        '<div class="contact-name">' + escapeHtml(c.name || 'Contact') + (c.role ? ' <span class="contact-role">' + escapeHtml(c.role) + '</span>' : '') +
          (c.decisionMaker ? ' <span class="badge badge-dm" title="Decision maker">DM</span>' : '') +
          (c.buyingRole ? ' <span class="badge">' + escapeHtml(StuffMigrate.BUYING_ROLE_LABELS[c.buyingRole] || c.buyingRole) + '</span>' : '') + '</div>' +
        '<div class="contact-meta">' +
        (c.email ? '<a href="mailto:' + escapeHtml(c.email) + '">' + escapeHtml(c.email) + '</a>' : '') +
        (c.email && c.phone ? ' <span class="dot">\u00b7</span> ' : '') +
        (c.phone ? '<a href="tel:' + escapeHtml(c.phone) + '">' + escapeHtml(c.phone) + '</a>' : '') +
        '</div>' +
        (c.notes ? '<div class="contact-notes">' + escapeHtml(c.notes) + '</div>' : '') +
        '</div>' +
        '<div class="contact-actions">' +
        '<button type="button" class="ghost" data-action="edit">Edit</button>' +
        (ownerType !== 'customer' ? '<button type="button" class="ghost" data-action="unlink" title="Keep the contact on the customer, remove it from this card">Unlink</button>' : '') +
        '</div></div>';
    });
    html += '</div>';
    html += '<div class="contacts-toolbar">';
    if (ownerType !== 'customer') {
      var unlinked = all.filter(function (c) { return shown.indexOf(c) === -1; });
      if (unlinked.length) {
        html += '<select class="contact-link-select"><option value="">Add existing contact...</option>';
        unlinked.forEach(function (c) {
          html += '<option value="' + escapeHtml(c.id) + '">' + escapeHtml(c.name + (c.role ? ' (' + c.role + ')' : '')) + '</option>';
        });
        html += '</select>';
      }
    }
    html += '<button type="button" class="ghost" data-action="new">+ New contact</button>';
    html += '</div>';
    root.innerHTML = html;

    root.querySelectorAll('.contact-row').forEach(function (row) {
      var cid = row.getAttribute('data-contact-id');
      row.querySelectorAll('[data-action]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var act = btn.getAttribute('data-action');
          if (act === 'edit') {
            openContactModal({ contactId: cid, customerId: customerId, dealId: ownerType !== 'customer' ? owner.id : null, onDone: onDone });
          } else if (act === 'star') {
            if (ownerType === 'customer') {
              setPrimaryContact(customerId, cid);
            } else {
              owner.primaryContactId = cid;
            }
            logChange('update', 'contact', cid, 'Set primary on ' + (ownerType === 'customer' ? 'customer' : 'lead ' + owner.id));
            save();
            onDone();
          } else if (act === 'unlink') {
            owner.contactIds = (owner.contactIds || []).filter(function (id) { return id !== cid; });
            if (owner.primaryContactId === cid) owner.primaryContactId = owner.contactIds[0] || null;
            logChange('update', ownerType, owner.id, 'Unlinked contact ' + cid);
            save();
            onDone();
          }
        });
      });
    });
    var newBtn = root.querySelector('[data-action="new"]');
    if (newBtn) newBtn.addEventListener('click', function () {
      openContactModal({ contactId: null, customerId: customerId, dealId: ownerType !== 'customer' ? owner.id : null, onDone: onDone });
    });
    var linkSel = root.querySelector('.contact-link-select');
    if (linkSel) linkSel.addEventListener('change', function () {
      var cid = linkSel.value;
      if (!cid) return;
      if (!Array.isArray(owner.contactIds)) owner.contactIds = [];
      if (owner.contactIds.indexOf(cid) === -1) owner.contactIds.push(cid);
      if (!owner.primaryContactId) owner.primaryContactId = cid;
      logChange('update', ownerType, owner.id, 'Linked contact ' + cid);
      save();
      onDone();
    });
  }

  // ---------------------------------------------------------------------
  // Cover header (shared by Customer, Lead, and later Project)
  // ---------------------------------------------------------------------

  var COVER_MAX_BYTES = 5 * 1024 * 1024;
  var COVER_MAX_WIDTH = 1600;
  var coverUrlCache = {};
  var coverUrlView = null;

  function revokeCoverUrlsIfViewChanged() {
    var key = activeView + ':' + (activeDetailId || '') + ':' + (activeCustomerId || '') + ':' + activeBoardId;
    if (coverUrlView === key) return;
    Object.keys(coverUrlCache).forEach(function (k) {
      try { URL.revokeObjectURL(coverUrlCache[k]); } catch (e) { /* ignore */ }
    });
    coverUrlCache = {};
    coverUrlView = key;
  }

  function getFileRef(id) {
    return (state.files || []).find(function (f) { return f.id === id; });
  }

  function coverObjectUrl(fileId) {
    if (coverUrlCache[fileId]) return Promise.resolve(coverUrlCache[fileId]);
    var ref = getFileRef(fileId);
    if (!ref) return Promise.resolve(null);
    if (ref.inlineDataURL && ref.dataURL) {
      coverUrlCache[fileId] = ref.dataURL;
      return Promise.resolve(ref.dataURL);
    }
    return idbGet(ref.blobKey || fileId).then(function (blob) {
      if (!blob) return null;
      var url = URL.createObjectURL(blob);
      coverUrlCache[fileId] = url;
      return url;
    }).catch(function () { return null; });
  }

  function hydrateCoverThumb(el, fileId) {
    if (!el || !fileId) return;
    coverObjectUrl(fileId).then(function (url) {
      if (!url) { el.classList.add('missing'); return; }
      el.style.backgroundImage = 'url("' + url + '")';
    });
  }

  function downscaleImage(file) {
    return new Promise(function (resolve) {
      if (!/^image\//.test(file.type) || file.type === 'image/svg+xml' || file.type === 'image/gif') { resolve(file); return; }
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        try {
          if (img.width <= COVER_MAX_WIDTH) { URL.revokeObjectURL(url); resolve(file); return; }
          var scale = COVER_MAX_WIDTH / img.width;
          var canvas = document.createElement('canvas');
          canvas.width = COVER_MAX_WIDTH;
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(function (blob) {
            URL.revokeObjectURL(url);
            resolve(blob || file);
          }, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88);
        } catch (e) { URL.revokeObjectURL(url); resolve(file); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  function removeCover(ownerType, owner) {
    var oldId = owner.coverFileId;
    if (!oldId) return Promise.resolve();
    var ref = getFileRef(oldId);
    owner.coverFileId = null;
    state.files = (state.files || []).filter(function (f) { return f.id !== oldId; });
    if (coverUrlCache[oldId]) { try { URL.revokeObjectURL(coverUrlCache[oldId]); } catch (e) { /* ignore */ } delete coverUrlCache[oldId]; }
    // IndexedDB only. Drive files are never deleted from here (DRIVE_UPLOAD_SPEC.md).
    var p = ref && ref.blobKey ? idbDelete(ref.blobKey).catch(function () {}) : Promise.resolve();
    return p;
  }

  function uploadCover(ownerType, owner, file) {
    if (!file) return Promise.resolve();
    if (!/^image\//.test(file.type)) { alert('Cover must be an image (png, jpg, webp, svg).'); return Promise.resolve(); }
    if (file.size > COVER_MAX_BYTES) { alert('Cover image is over 5 MB. Pick a smaller one.'); return Promise.resolve(); }
    return downscaleImage(file).then(function (blob) {
      var id = StuffMigrate.makeId('fil');
      return idbPut(id, blob).then(function () {
        return { blobKey: id, dataURL: null };
      }).catch(function () {
        if (blob.size > FILE_SOFT_LIMIT) throw new Error('Image too large for fallback storage without IndexedDB.');
        return readFileAsDataURL(blob).then(function (dataURL) { return { blobKey: null, dataURL: dataURL }; });
      }).then(function (stored) {
        return removeCover(ownerType, owner).then(function () {
          var ref = {
            id: id,
            ownerType: ownerType,
            ownerId: owner.id,
            slot: 'cover',
            name: file.name || 'cover',
            mime: blob.type || file.type,
            size: blob.size,
            blobKey: stored.blobKey,
            inlineDataURL: !!stored.dataURL,
            dataURL: stored.dataURL || undefined,
            uploadedAt: nowIso(),
            uploadedBy: 'user',
            driveFileId: null,
            driveUrl: null,
            driveFolderId: null
          };
          state.files.push(ref);
          owner.coverFileId = id;
          owner.updatedAt = nowIso();
          logChange('upload', ownerType, owner.id, 'Cover image ' + ref.name + ' (' + formatBytes(ref.size) + ')');
          save();
        });
      });
    }).catch(function (e) {
      alert(e && e.message ? e.message : 'Could not store the cover image.');
    });
  }

  function renderCoverHeader(root, opts) {
    if (!root) return;
    var owner = opts.owner;
    var ownerType = opts.ownerType;
    var onDone = opts.onDone || function () { renderApp(); };
    var has = !!owner.coverFileId;
    root.innerHTML =
      '<div class="cover-header' + (has ? ' has-cover' : '') + '">' +
      '<div class="cover-image"></div>' +
      '<div class="cover-actions">' +
      '<button type="button" class="ghost cover-upload">' + (has ? 'Replace cover' : 'Add cover image') + '</button>' +
      (has ? '<button type="button" class="ghost cover-remove">Remove</button>' : '') +
      '<input type="file" class="cover-input" accept="image/*" />' +
      '</div>' +
      (!has ? '<div class="cover-hint">Logo, product hero, or packaging mock. Up to 5 MB, stored in this browser.</div>' : '') +
      '</div>';
    if (has) {
      var imgEl = root.querySelector('.cover-image');
      coverObjectUrl(owner.coverFileId).then(function (url) {
        if (url) imgEl.style.backgroundImage = 'url("' + url + '")';
        else imgEl.classList.add('missing');
      });
    }
    var input = root.querySelector('.cover-input');
    root.querySelector('.cover-upload').addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      input.value = '';
      uploadCover(ownerType, owner, f).then(onDone);
    });
    var rm = root.querySelector('.cover-remove');
    if (rm) rm.addEventListener('click', function () {
      if (!confirm('Remove the cover image?')) return;
      removeCover(ownerType, owner).then(function () {
        logChange('delete', ownerType, owner.id, 'Cover image removed');
        save();
        onDone();
      });
    });
  }

  // =====================================================================
  // Leads page (issue #4): every lead across the CRM boards in one list. Read-only view:
  // no board or stage record, not in the menu editor. Rules in StuffMigrate (isActiveLead,
  // leadRowMatches, sortLeadRows) so issue #3 can change "active" in one place.
  // =====================================================================

  var leadsNav = { q: '', board: '', stage: '', source: '', showInactive: false, sort: 'last', dir: 'asc' };

  function isActiveLead(d) { return StuffMigrate.isActiveLead(d); }

  function activeLeadCount() {
    return (state.deals || []).filter(isActiveLead).length;
  }

  function crmAreaId() {
    var a = (state.areas || []).find(function (x) { return !isSeparator(x) && areaRoleFor(x.id) === 'crm'; });
    return a ? a.id : 'crm';
  }

  function setActiveLeads() {
    autoCloseNavOnPhone();
    activeView = 'leads';
    activeArea = crmAreaId();
    activeDetailId = null;
    persistActiveNav();
    renderApp();
  }

  // Every lead (not project or Shop Needs cards), as table rows.
  function leadRows() {
    return (state.deals || []).filter(function (d) {
      return d && !isProjectCard(d) && d.type !== 'internal';
    }).map(function (d) {
      var sec = sectionForStage(d.stage);
      var pc = primaryContactFor(d);
      return {
        id: d.id,
        deal: d,
        active: isActiveLead(d),
        title: cardTitle(d),
        company: customerNameFor(d),
        contactName: pc ? String(pc.name || '') : '',
        contactEmail: pc ? String(pc.email || '') : '',
        boardId: sec ? sec.id : '',
        board: sec ? sec.label : '',
        stage: d.stage || '',
        stageName: stageLabel(d.stage),
        source: d.source || '',
        sourceName: sourceLabel(d.source),
        value: totalValue(d),
        reply: d.nextReplyOwner ? (d.waitingSince || '0') : '',
        followUp: d.nextFollowUp || '',
        firstContact: String(d.firstContactAt || '').slice(0, 10),
        last: d.lastActivityAt || ''
      };
    });
  }

  var LEAD_COLUMNS = [
    { key: 'title', label: 'Lead' }, { key: 'company', label: 'Company' }, { key: 'contactName', label: 'Primary contact' },
    { key: 'board', label: 'Board' }, { key: 'stageName', label: 'Stage' }, { key: 'sourceName', label: 'Source' },
    { key: 'value', label: 'Value' }, { key: 'reply', label: 'Next reply' }, { key: 'followUp', label: 'Follow-up' }, { key: 'firstContact', label: 'First contact' }, { key: 'last', label: 'Last activity' }
  ];

  function renderLeads() {
    revokeCoverUrlsIfViewChanged();
    var root = document.getElementById('leads-root');
    if (!root) return;
    var all = leadRows();
    var pool = leadsNav.showInactive ? all : all.filter(function (r) { return r.active; });
    // Filter choices come from the leads themselves, in menu order.
    var boardIds = {};
    pool.forEach(function (r) { if (r.boardId) boardIds[r.boardId] = true; });
    var boards = sectionList().filter(function (sec) { return boardIds[sec.id]; });
    if (leadsNav.board && !boardIds[leadsNav.board]) { leadsNav.board = ''; leadsNav.stage = ''; }
    var stageIds = [];
    if (leadsNav.board) stageIds = sectionStages(getSection(leadsNav.board));
    else pool.forEach(function (r) { if (r.stage && stageIds.indexOf(r.stage) === -1) stageIds.push(r.stage); });
    if (leadsNav.stage && stageIds.indexOf(leadsNav.stage) === -1) leadsNav.stage = '';
    var filters = { board: leadsNav.board, stage: leadsNav.stage, source: leadsNav.source };
    var rows = StuffMigrate.sortLeadRows(pool.filter(function (r) { return StuffMigrate.leadRowMatches(r, leadsNav.q, filters); }), leadsNav.sort, leadsNav.dir);
    var filtered = !!(leadsNav.q.trim() || leadsNav.board || leadsNav.stage || leadsNav.source);

    function opt(value, label, cur) {
      return '<option value="' + escapeHtml(value) + '"' + (value === cur ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
    }
    var html = '<div class="customers-bar leads-bar">';
    html += '<input type="search" id="leads-search" aria-label="Search leads" placeholder="Search leads, companies or contacts" value="' + escapeHtml(leadsNav.q) + '" />';
    html += '<select id="leads-board" aria-label="Board">' + opt('', 'All boards', leadsNav.board) +
      boards.map(function (b) { return opt(b.id, b.label, leadsNav.board); }).join('') + '</select>';
    html += '<select id="leads-stage" aria-label="Stage">' + opt('', 'All stages', leadsNav.stage) +
      stageIds.map(function (id) { return opt(id, stageLabel(id), leadsNav.stage); }).join('') + '</select>';
    html += '<select id="leads-source" aria-label="Source">' + opt('', 'All sources', leadsNav.source) +
      SOURCE_OPTIONS.map(function (o) { return opt(o.id, o.label, leadsNav.source); }).join('') + '</select>';
    html += '<button type="button" class="ghost' + (leadsNav.showInactive ? ' active' : '') + '" id="btn-leads-inactive">' +
      (leadsNav.showInactive ? 'Hide won / lost' : 'Show won / lost') + '</button>';
    html += '</div>';
    var activeBoards = {};
    all.forEach(function (r) { if (r.active && r.boardId) activeBoards[r.boardId] = true; });
    var activeTotal = all.filter(function (r) { return r.active; }).length;
    html += '<p class="board-note visible" id="leads-summary">' + (filtered ? rows.length + ' match' + (rows.length === 1 ? '' : 'es') + '.' :
      (leadsNav.showInactive ? all.length + ' leads, ' + activeTotal + ' active.' :
        activeTotal + ' active lead' + (activeTotal === 1 ? '' : 's') + ' across ' + Object.keys(activeBoards).length + ' board' + (Object.keys(activeBoards).length === 1 ? '' : 's') + '.')) + '</p>';
    html += '<div class="table-wrap"><table class="customers-table leads-table"><thead><tr><th></th>';
    LEAD_COLUMNS.forEach(function (c) {
      var on = leadsNav.sort === c.key;
      html += '<th class="sortable' + (on ? ' sorted' : '') + '" data-sort="' + c.key + '" aria-sort="' + (on ? (leadsNav.dir === 'asc' ? 'ascending' : 'descending') : 'none') + '">' +
        escapeHtml(c.label) + (on ? (leadsNav.dir === 'asc' ? ' \u25B2' : ' \u25BC') : '') + '</th>';
    });
    html += '</tr></thead><tbody>';
    if (!rows.length) html += '<tr><td colspan="12" class="file-empty">No leads match.</td></tr>';
    rows.forEach(function (r) {
      var d = r.deal;
      html += '<tr data-lead-id="' + escapeHtml(r.id) + '"' + (r.active ? '' : ' class="inactive-lead"') + '>' +
        '<td>' + (d.coverFileId ? '<span class="card-thumb" data-cover-id="' + escapeHtml(d.coverFileId) + '"></span>' :
          '<span class="card-thumb placeholder">' + escapeHtml((r.title || '?').slice(0, 1).toUpperCase()) + '</span>') + '</td>' +
        '<td class="customer-name-cell">' + escapeHtml(r.title) + (r.active ? '' : '<div class="muted-note">' + (isConvertedLead(d) ? 'Converted' : d.status === 'won' ? 'Won' : 'Lost') + '</div>') +
          emailLineHtml(d) + replyWaitingChipHtml(d) + staleChipHtml(d) + '</td>' +
        '<td>' + escapeHtml(r.company) + '</td>' +
        '<td>' + (r.contactName || r.contactEmail ? escapeHtml(r.contactName) + (r.contactEmail ? '<div class="muted-note">' + escapeHtml(r.contactEmail) + '</div>' : '') : '<span class="muted-note">none</span>') + '</td>' +
        '<td>' + escapeHtml(r.board) + '</td><td>' + escapeHtml(r.stageName) + '</td><td>' + escapeHtml(r.sourceName) + '</td>' +
        '<td>' + (r.value ? escapeHtml(formatMoney(r.value)) : '') + '</td>' +
        '<td>' + replyChipHtml(d) + '</td>' +
        '<td' + (r.followUp && isOverdue(r.followUp) ? ' class="overdue-cell"' : '') + '>' + escapeHtml(r.followUp) + '</td>' +
        '<td>' + escapeHtml(r.firstContact) + '</td>' +
        '<td>' + (r.last ? escapeHtml(new Date(r.last).toLocaleDateString()) : '') + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div>';
    root.innerHTML = html;

    root.querySelectorAll('tr[data-lead-id]').forEach(function (tr) {
      tr.addEventListener('click', function () { openDetail(tr.getAttribute('data-lead-id')); });
      var th = tr.querySelector('.card-thumb[data-cover-id]');
      if (th) hydrateCoverThumb(th, th.getAttribute('data-cover-id'));
    });
    root.querySelectorAll('th[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () {
        var k = th.getAttribute('data-sort');
        if (leadsNav.sort === k) leadsNav.dir = leadsNav.dir === 'asc' ? 'desc' : 'asc';
        else { leadsNav.sort = k; leadsNav.dir = 'asc'; }
        renderLeads();
      });
    });
    var search = document.getElementById('leads-search');
    search.addEventListener('input', function () {
      leadsNav.q = search.value;
      var pos = search.selectionStart;
      renderLeads();
      var again = document.getElementById('leads-search');
      again.focus();
      try { again.setSelectionRange(pos, pos); } catch (e) { /* ignore */ }
    });
    document.getElementById('leads-board').addEventListener('change', function (e) { leadsNav.board = e.target.value; leadsNav.stage = ''; renderLeads(); });
    document.getElementById('leads-stage').addEventListener('change', function (e) { leadsNav.stage = e.target.value; renderLeads(); });
    document.getElementById('leads-source').addEventListener('change', function (e) { leadsNav.source = e.target.value; renderLeads(); });
    document.getElementById('btn-leads-inactive').addEventListener('click', function () { leadsNav.showInactive = !leadsNav.showInactive; renderLeads(); });
  }

  // =====================================================================
  // v12: Customers area (list + detail)
  // =====================================================================

  var customersSearch = '';
  var customersShowAll = false;

  // A customer (not just a lead's company) has SKU jobs, customer POs or older projects.
  function hasJobs(c) {
    return (state.skus || []).some(function (s) { return s.customerId === c.id; }) || projectsForCustomer(c.id).length > 0 ||
      (state.customerPos || []).some(function (p) { return p.customerId === c.id; });
  }

  function setActiveCustomers(customerId) {
    autoCloseNavOnPhone();
    activeCustomerId = customerId || null;
    activeView = 'customers';
    activeArea = 'customers';
    activeDetailId = null;
    persistActiveNav();
    renderApp();
  }

  function customerLastActivity(cust) {
    var t = cust.updatedAt || cust.createdAt || '';
    dealsForCustomer(cust.id).forEach(function (d) {
      var a = d.lastActivityAt || d.updatedAt || '';
      if (a > t) t = a;
    });
    return t;
  }

  function renderCustomers() {
    revokeCoverUrlsIfViewChanged();
    var root = document.getElementById('customers-root');
    if (!root) return;
    if (activeCustomerId && getCustomer(activeCustomerId)) {
      renderCustomerDetail(root, getCustomer(activeCustomerId));
    } else {
      activeCustomerId = null;
      renderCustomersList(root);
    }
  }

  function createCustomerPrompt() {
    var name = prompt('Customer name (company):');
    if (name == null || !String(name).trim()) return;
    var res = StuffMigrate.findOrCreateCustomer(state, String(name).trim(), '', nowIso());
    if (!res.created) {
      alert('A customer with that name already exists. Opening it.');
    } else {
      logChange('create', 'customer', res.customer.id, 'Created ' + res.customer.name);
      save();
    }
    setActiveCustomers(res.customer.id);
  }

  function renderCustomersList(root) {
    var list = (state.customers || []).slice();
    var q = customersSearch.trim().toLowerCase();
    var withProjects = list.filter(hasJobs).length;
    // Default: companies with SKU jobs. Search always looks across every company.
    if (!customersShowAll && !q) list = list.filter(hasJobs);
    if (q) {
      list = list.filter(function (c) {
        var prim = contactsForCustomer(c.id).find(function (x) { return x.isPrimary; });
        return (c.name || '').toLowerCase().indexOf(q) !== -1 ||
          (prim && ((prim.name || '').toLowerCase().indexOf(q) !== -1 || (prim.email || '').toLowerCase().indexOf(q) !== -1));
      });
    }
    list.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    var html = '<div class="customers-bar">';
    html += '<input type="search" id="customers-search" aria-label="Search customers" placeholder="Search customers or contacts" value="' + escapeHtml(customersSearch) + '" />';
    html += '<button type="button" class="secondary' + (customersShowAll ? ' active' : '') + '" id="btn-customers-all">' +
      (customersShowAll ? 'Only customers with SKUs' : 'Show all companies (' + (state.customers || []).length + ')') + '</button>';
    html += '<button type="button" id="btn-new-customer">New Customer</button>';
    html += '</div>';
    html += '<p class="board-note">' + (q ? list.length + ' match(es) across all ' + (state.customers || []).length + ' companies.' :
      (customersShowAll ? 'All ' + list.length + ' companies, including leads with no project yet.' :
        withProjects + ' customers with SKUs. ' + ((state.customers || []).length - withProjects) + ' more companies are leads only.')) + '</p>';
    html += '<div class="table-wrap"><table class="customers-table"><thead><tr>' +
      '<th></th><th>Name</th><th>Primary contact</th><th>Open leads</th><th>SKUs</th><th>Molds required</th><th>Last activity</th>' +
      '</tr></thead><tbody>';
    if (!list.length) html += '<tr><td colspan="7" class="file-empty">No customers match.</td></tr>';
    list.forEach(function (c) {
      var prim = contactsForCustomer(c.id).find(function (x) { return x.isPrimary; }) || contactsForCustomer(c.id)[0];
      var deals = dealsForCustomer(c.id);
      var open = deals.filter(function (d) { return !isConvertedLead(d) && !isLostStage(d.stage); }).length;
      var roll = StuffMigrate.moldsForCustomer(state, c.id);
      var last = customerLastActivity(c);
      html += '<tr data-customer-id="' + escapeHtml(c.id) + '">' +
        '<td>' + (c.coverFileId ? '<span class="card-thumb" data-cover-id="' + escapeHtml(c.coverFileId) + '"></span>' : '<span class="card-thumb placeholder">' + escapeHtml((c.name || '?').slice(0, 1).toUpperCase()) + '</span>') + '</td>' +
        '<td class="customer-name-cell">' + escapeHtml(c.name) + '</td>' +
        '<td>' + (prim ? escapeHtml(prim.name) + (prim.email ? '<div class="muted-note">' + escapeHtml(prim.email) + '</div>' : '') : '<span class="muted-note">none</span>') + '</td>' +
        '<td>' + open + '</td><td>' + roll.skus + '</td><td>' + (roll.skus ? roll.total + (roll.blanks ? ' <span class="muted-note">(' + roll.blanks + ' not set)</span>' : '') : '') + '</td>' +
        '<td>' + (last ? escapeHtml(new Date(last).toLocaleDateString()) : '') + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div>';
    root.innerHTML = html;
    root.querySelectorAll('tr[data-customer-id]').forEach(function (tr) {
      tr.addEventListener('click', function () { setActiveCustomers(tr.getAttribute('data-customer-id')); });
      var th = tr.querySelector('.card-thumb[data-cover-id]');
      if (th) hydrateCoverThumb(th, th.getAttribute('data-cover-id'));
    });
    var search = document.getElementById('customers-search');
    search.addEventListener('input', function () {
      customersSearch = search.value;
      var pos = search.selectionStart;
      renderCustomersList(root);
      var again = document.getElementById('customers-search');
      again.focus();
      try { again.setSelectionRange(pos, pos); } catch (e) { /* ignore */ }
    });
    document.getElementById('btn-new-customer').addEventListener('click', createCustomerPrompt);
    document.getElementById('btn-customers-all').addEventListener('click', function () {
      customersShowAll = !customersShowAll;
      renderCustomersList(root);
    });
  }

  // #50: the core fields on the customer page, read-only. Contact from the customer's primary;
  // stage, value and next step from its open lead (the one updated last).
  function customerCoreHtml(cust, deals) {
    var open = (deals || []).filter(function (d) { return StuffMigrate.isActiveLead(d); })
      .sort(function (a, b) { return String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')); })[0] || null;
    var pc = StuffMigrate.leadPrimaryContact(state, { customerId: cust.id }) || {};
    var v = open ? StuffMigrate.leadCoreValues(state, open) : {};
    var miss = open ? StuffMigrate.leadCoreMissing(state, open) : [];
    if (!open) ['contactName', 'email', 'phone'].forEach(function (k) { if (!(k === 'contactName' ? pc.name : pc[k])) miss.push(k); });
    var cold = open && isColdStage(open.stage);
    var rows = [
      ['company', 'Company', cust.name],
      ['contactName', 'Contact', open ? v.contactName : pc.name],
      ['email', 'Email', open ? v.email : pc.email],
      ['phone', 'Phone', open ? v.phone : pc.phone],
      ['source', 'Source', open ? sourceLabel(normalizeSource(open.source)) : sourceLabel(normalizeSource(cust.source))],
      ['stage', 'Stage', open ? stageLabel(open.stage) : 'No open lead'],
      ['value', 'Value', open ? formatMoney(v.value) : ''],
      ['nextStep', 'Next step', open ? (cold ? 'Cold lead' : v.nextStep) : ''],
      ['nextFollowUp', 'Next step date', open ? (cold ? '' : v.nextFollowUp) : '']
    ];
    var html = '<div class="core-block core-readonly" id="cu-core"><div class="core-head"><span class="core-title">Core</span>' +
      (miss.length ? '<span class="core-count">' + miss.length + ' missing</span>' : '') +
      (open ? '<button type="button" class="link-btn" id="cu-core-lead" data-id="' + escapeHtml(open.id) + '">Open lead: ' + escapeHtml(cardTitle(open)) + '</button>' : '') + '</div><dl class="core-grid">';
    rows.forEach(function (r) {
      var m = miss.indexOf(r[0]) !== -1;
      html += '<div class="core-cell' + (m ? ' is-missing' : '') + '" data-core="' + r[0] + '"><dt>' + escapeHtml(r[1]) + ' <span class="core-missing-tag">missing</span></dt><dd>' +
        escapeHtml(r[2] || (m ? '' : '-')) + '</dd></div>';
    });
    return html + '</dl></div>';
  }

  function renderCustomerDetail(root, cust) {
    var deals = dealsForCustomer(cust.id);
    var rerender;
    var html = '';
    html += '<div class="detail-bar">';
    html += '<button type="button" class="ghost" id="cu-back">Back to customers</button>';
    html += '<h2>Customer: ' + escapeHtml(cust.name) + '</h2>';
    html += '</div>';
    html += '<div id="cu-cover-root"></div>';
    html += customerCoreHtml(cust, deals);
    html += '<form id="customer-form">';
    html += '<div class="row"><div class="field"><label for="cu-name">Name</label><input type="text" id="cu-name" required /></div>';
    html += '<div class="field"><label for="cu-website">Website</label><input type="text" id="cu-website" placeholder="https://" /></div>';
    html += '<div class="field"><label for="cu-industry">Industry</label><input type="text" id="cu-industry" /></div></div>';
    html += '<div class="row"><div class="field"><label for="cu-billing">Billing address</label><textarea id="cu-billing" rows="2"></textarea></div>';
    html += '<div class="field"><label for="cu-ship">Ship address</label><textarea id="cu-ship" rows="2"></textarea></div></div>';
    html += '<div class="field"><label for="cu-notes">Notes</label><textarea id="cu-notes" rows="3"></textarea></div>';
    html += '<div class="detail-actions">';
    if (isAdmin()) html += '<button type="button" class="danger" id="cu-delete">Delete customer</button>';
    else html += '<span class="muted-note">Delete is Admin only</span>';
    html += '<span class="spacer"></span><button type="submit" id="cu-save">Save customer</button></div>';
    html += '</form>';
    html += '<div class="section-title">Contacts</div><div id="cu-contacts-root"></div>';
    html += '<div class="section-title">Meeting notes</div><div id="cu-meetings-root" class="rec-sections"></div>';
    html += '<div id="cu-sections-root" class="rec-sections"></div>';
    html += '<div id="cu-jobs-root"></div>';
    html += customerBillingBlockHtml(cust);
    html += '<div class="section-title">Leads (' + deals.length + ')</div>';
    if (!deals.length) html += '<div class="file-empty">No leads linked to this customer.</div>';
    else {
      html += '<ul class="customer-deals">';
      deals.forEach(function (d) {
        var sec = sectionForStage(d.stage);
        html += '<li data-deal-id="' + escapeHtml(d.id) + '">' +
          '<button type="button" class="link-btn">' + escapeHtml(cardTitle(d)) + '</button>' +
          '<span class="badge badge-source">' + escapeHtml(sec ? areaLabelFor(sec.area) + ' / ' + sec.label : d.stage) + '</span>' +
          '<span class="badge">' + escapeHtml(stageLabel(d.stage)) + '</span>' +
          (isConvertedLead(d) ? '<span class="badge badge-converted">' + (d.status === 'won' ? 'Won' : 'Converted') + '</span>' : '<span class="card-value">' + formatMoney(totalValue(d)) + '</span>') +
          '</li>';
      });
      html += '</ul>';
    }
    root.innerHTML = html;

    document.getElementById('cu-name').value = cust.name || '';
    document.getElementById('cu-website').value = cust.website || '';
    document.getElementById('cu-industry').value = cust.industry || '';
    document.getElementById('cu-billing').value = cust.billingAddress || '';
    document.getElementById('cu-ship').value = cust.shipAddress || '';
    document.getElementById('cu-notes').value = cust.notes || '';

    rerender = function () { renderCustomerDetail(root, getCustomer(cust.id) || cust); renderLeftRail(); };
    renderCoverHeader(document.getElementById('cu-cover-root'), { ownerType: 'customer', owner: cust, onDone: rerender });
    renderContactsSection(document.getElementById('cu-contacts-root'), { ownerType: 'customer', owner: cust, onDone: rerender });
    renderCustomerJobs(document.getElementById('cu-jobs-root'), cust);
    renderMeetingNotes(document.getElementById('cu-meetings-root'), cust, 'customer');
    document.getElementById('cu-billing-open').addEventListener('click', function () {
      if (StuffMigrate.billingEntriesFor(state, cust.id).length) setActiveBilling(cust.id);
      else openBillingChargeModal({ customerId: cust.id });
    });
    renderRecordSections(document.getElementById('cu-sections-root'), cust, 'customer');
    var coreLead = document.getElementById('cu-core-lead');
    if (coreLead) coreLead.addEventListener('click', function () { openDetail(coreLead.getAttribute('data-id')); });

    document.getElementById('cu-back').addEventListener('click', function () { setActiveCustomers(null); });
    document.getElementById('customer-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('cu-name').value.trim();
      if (!name) { alert('Name is required.'); return; }
      var normalized = StuffMigrate.normalizeCompanyName(name) || 'unnamed';
      var clash = (state.customers || []).find(function (c) { return c.id !== cust.id && c.normalizedName === normalized; });
      if (clash) { alert('Another customer already uses that name: ' + clash.name); return; }
      cust.name = name;
      cust.normalizedName = normalized;
      cust.website = document.getElementById('cu-website').value.trim();
      cust.industry = document.getElementById('cu-industry').value.trim();
      cust.billingAddress = document.getElementById('cu-billing').value.trim();
      cust.shipAddress = document.getElementById('cu-ship').value.trim();
      cust.notes = document.getElementById('cu-notes').value.trim();
      cust.updatedAt = nowIso();
      logChange('update', 'customer', cust.id, 'Saved ' + cust.name);
      save();
      renderApp();
    });
    var del = document.getElementById('cu-delete');
    if (del) del.addEventListener('click', function () {
      if (!requireAdmin('delete a customer')) return;
      if (deals.length || hasJobs(cust)) { alert('This customer still has ' + deals.length + ' lead(s) and SKUs, POs or projects. Move those first.'); return; }
      if (StuffMigrate.billingEntriesFor(state, cust.id).length) { alert('This customer has billing entries. Billing entries are never deleted, so the customer stays.'); return; }
      if (!confirm('Delete customer ' + cust.name + ' and its contacts? This cannot be undone.')) return;
      takeSnapshot('before-delete-customer');
      removeCover('customer', cust).then(function () {
        state.contacts = state.contacts.filter(function (c) { return c.customerId !== cust.id; });
        state.customers = state.customers.filter(function (c) { return c.id !== cust.id; });
        logChange('delete', 'customer', cust.id, 'Deleted ' + cust.name);
        save();
        setActiveCustomers(null);
      });
    });
    root.querySelectorAll('.customer-deals li').forEach(function (li) {
      li.querySelector('.link-btn').addEventListener('click', function () { openDetail(li.getAttribute('data-deal-id')); });
    });
  }

  // =====================================================================
  // Billing accounts (issue #41): pass-through charges per customer under Operations.
  // Rules live in migrate-v12.js. Entries are never deleted; Void keeps them out of totals.
  // =====================================================================

  var billingNav = { customerId: null, status: 'all' };
  // Billing shows cents ($100.10); formatMoney rounds to whole dollars.
  function formatCents(v) {
    var n = Math.round((Number(v) || 0) * 100) / 100;
    return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  var BILLING_CATEGORY_LABELS = { shipping: 'Shipping', rush: 'Rush', material: 'Material', deposit: 'Deposit', design: 'Design', prototype: 'Prototype', tooling: 'Tooling', other: 'Other' };
  var BILLING_STATUS_LABELS = { unbilled: 'Unbilled', invoiced: 'Invoiced', paid: 'Paid' };

  function opsAreaId() {
    var a = (state.areas || []).find(function (x) { return !isSeparator(x) && areaRoleFor(x.id) === 'operations'; });
    return a ? a.id : 'floor-operations';
  }

  function setActiveBilling(customerId) {
    autoCloseNavOnPhone();
    activeView = 'billing';
    activeArea = opsAreaId();
    activeDetailId = null;
    billingNav.customerId = customerId && getCustomer(customerId) ? customerId : null;
    persistActiveNav();
    renderApp();
  }

  function billingUnbilledCount() {
    return StuffMigrate.billingAccounts(state).filter(function (a) { return a.unbilled; }).length;
  }

  function billingEntryText(e) {
    return (e.date || '') + ' ' + (e.description || '') + ' ' + formatCents(e.amount);
  }

  function renderBilling() {
    var root = document.getElementById('billing-root');
    if (!root) return;
    if (billingNav.customerId && !getCustomer(billingNav.customerId)) billingNav.customerId = null;
    if (billingNav.customerId) return renderBillingLedger(root, getCustomer(billingNav.customerId));
    var accounts = StuffMigrate.billingAccounts(state);
    var all = StuffMigrate.billingTotals(state.billingEntries || []);
    var html = '<div class="page-head"><h2>Billing accounts</h2><span class="spacer"></span>' +
      '<button type="button" id="bill-add">Add charge</button></div>' +
      '<p class="muted-note">Pass-through charges per customer, such as shipping labels, rush fees and surcharges, from unbilled to invoiced to paid.</p>' +
      '<div class="bill-totals"><span>Unbilled <strong>' + formatCents(all.unbilled) + '</strong></span>' +
      '<span>Invoiced, not paid <strong>' + formatCents(all.invoiced) + '</strong></span></div>';
    if (!accounts.length) html += '<p class="file-empty">No charges yet. Use Add charge for the first one.</p>';
    else {
      html += '<div class="table-wrap"><table class="kpi-table bill-accounts"><thead><tr><th>Customer</th><th class="num">Unbilled</th><th class="num">Invoiced, not paid</th><th>Last entry</th><th class="num">Entries</th></tr></thead><tbody>' +
        accounts.map(function (a) {
          return '<tr class="clickable-row" data-bill-customer="' + escapeHtml(a.customerId) + '"><td>' + escapeHtml(a.name) + '</td>' +
            '<td class="num">' + formatCents(a.unbilled) + '</td><td class="num">' + formatCents(a.invoiced) + '</td>' +
            '<td>' + escapeHtml(a.lastDate) + '</td><td class="num">' + a.count + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    root.innerHTML = html;
    root.querySelector('#bill-add').addEventListener('click', function () { openBillingChargeModal({}); });
    root.querySelectorAll('[data-bill-customer]').forEach(function (tr) {
      tr.addEventListener('click', function () { setActiveBilling(tr.getAttribute('data-bill-customer')); });
    });
  }

  function renderBillingLedger(root, cust) {
    var entries = StuffMigrate.billingEntriesFor(state, cust.id);
    var t = StuffMigrate.billingTotals(entries);
    var filter = billingNav.status || 'all';
    var shown = entries.filter(function (e) {
      if (filter === 'all') return true;
      if (filter === 'void') return !!e.voided;
      return !e.voided && e.status === filter;
    });
    // Running total of the shown, non-void charges, oldest first.
    var running = {};
    var sum = 0;
    shown.slice().reverse().forEach(function (e) {
      if (!e.voided) sum = Math.round((sum + (Number(e.amount) || 0)) * 100) / 100;
      running[e.id] = sum;
    });
    var html = '<div class="page-head"><button type="button" class="ghost" id="bill-back">All accounts</button>' +
      '<h2>' + escapeHtml(cust.name) + '</h2><span class="spacer"></span>' +
      '<button type="button" class="ghost" id="bill-open-customer">Customer page</button>' +
      '<button type="button" id="bill-add">Add charge</button></div>' +
      '<div class="bill-totals" id="bill-ledger-totals"><span>Unbilled <strong>' + formatCents(t.unbilled) + '</strong></span>' +
      '<span>Invoiced, not paid <strong>' + formatCents(t.invoiced) + '</strong></span>' +
      '<span>Paid <strong>' + formatCents(t.paid) + '</strong></span>' +
      (t.voided ? '<span class="muted-note">' + t.voided + ' void</span>' : '') + '</div>' +
      '<div class="bill-toolbar"><label for="bill-status">Show</label><select id="bill-status">' +
      [['all', 'All'], ['unbilled', 'Unbilled'], ['invoiced', 'Invoiced'], ['paid', 'Paid'], ['void', 'Void']].map(function (o) {
        return '<option value="' + o[0] + '"' + (o[0] === filter ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select><span class="spacer"></span>' +
      '<button type="button" class="secondary" id="bill-mark-invoiced" disabled>Mark invoiced</button>' +
      '<button type="button" class="secondary" id="bill-mark-paid" disabled>Mark paid</button></div>';
    if (!shown.length) html += '<p class="file-empty">' + (entries.length ? 'No entries match.' : 'No charges for this customer yet.') + '</p>';
    else {
      html += '<div class="table-wrap"><table class="kpi-table bill-ledger"><thead><tr><th><input type="checkbox" id="bill-select-all" aria-label="Select all" /></th><th>Date</th><th>Description</th><th>Category</th><th class="num">Amount</th><th>Ref</th><th>Status</th><th class="num">Running total</th><th></th></tr></thead><tbody>' +
        shown.map(function (e) {
          var url = StuffMigrate.billingRefUrl(e.ref);
          var ref = e.ref ? (url ? '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' + escapeHtml(e.ref) + '</a>' : escapeHtml(e.ref)) : '';
          var status = e.voided ? '<span class="badge bill-void-badge">Void</span><div class="muted-note">' + escapeHtml(e.voidReason) + (e.voidedBy ? ' (' + escapeHtml(e.voidedBy) + ')' : '') + '</div>' :
            '<span class="badge bill-status-' + escapeHtml(e.status) + '">' + escapeHtml(BILLING_STATUS_LABELS[e.status] || e.status) + '</span>' +
            (e.invoiceRef ? '<div class="muted-note">' + escapeHtml(e.invoiceRef) + '</div>' : '');
          return '<tr data-bill-entry="' + escapeHtml(e.id) + '"' + (e.voided ? ' class="bill-voided"' : '') + '>' +
            '<td>' + (e.voided ? '' : '<input type="checkbox" data-bill-select="' + escapeHtml(e.id) + '" aria-label="Select ' + escapeHtml(billingEntryText(e)) + '" />') + '</td>' +
            '<td>' + escapeHtml(e.date) + '</td>' +
            '<td>' + escapeHtml(e.description) + (e.breakdown ? '<div class="muted-note">' + escapeHtml(e.breakdown) + '</div>' : '') +
            (e.shipTo ? '<div class="muted-note">Ship to ' + escapeHtml(e.shipTo) + '</div>' : '') + '</td>' +
            '<td>' + escapeHtml(BILLING_CATEGORY_LABELS[e.category] || e.category) + '</td>' +
            '<td class="num">' + formatCents(e.amount) + '</td><td>' + ref + '</td><td>' + status + '</td>' +
            '<td class="num">' + (e.voided ? '' : formatCents(running[e.id])) + '</td>' +
            '<td class="bill-actions">' + (e.voided ? '' : '<button type="button" class="link-btn" data-bill-edit="' + escapeHtml(e.id) + '">Edit</button>' +
              '<button type="button" class="link-btn" data-bill-void="' + escapeHtml(e.id) + '">Void</button>') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    root.innerHTML = html;

    root.querySelector('#bill-back').addEventListener('click', function () { setActiveBilling(null); });
    root.querySelector('#bill-open-customer').addEventListener('click', function () { setActiveCustomers(cust.id); });
    root.querySelector('#bill-add').addEventListener('click', function () { openBillingChargeModal({ customerId: cust.id }); });
    root.querySelector('#bill-status').addEventListener('change', function (ev) { billingNav.status = ev.target.value; persistActiveNav(); renderBilling(); });
    function selected() {
      return Array.prototype.map.call(root.querySelectorAll('[data-bill-select]:checked'), function (cb) { return cb.getAttribute('data-bill-select'); });
    }
    function syncButtons() {
      var n = selected().length;
      root.querySelector('#bill-mark-invoiced').disabled = !n;
      root.querySelector('#bill-mark-paid').disabled = !n;
    }
    root.querySelectorAll('[data-bill-select]').forEach(function (cb) { cb.addEventListener('change', syncButtons); });
    var all = root.querySelector('#bill-select-all');
    if (all) all.addEventListener('change', function () {
      root.querySelectorAll('[data-bill-select]').forEach(function (cb) { cb.checked = all.checked; });
      syncButtons();
    });
    root.querySelector('#bill-mark-invoiced').addEventListener('click', function () {
      var ids = selected();
      if (!ids.length) return;
      var ref = prompt('Invoice ref for ' + ids.length + ' charge(s):');
      if (ref == null) return;
      if (!ref.trim()) { alert('Add the invoice ref.'); return; }
      var due = prompt('Due date (YYYY-MM-DD). Leave blank for none:', '');
      if (due == null) return;
      applyBillingStatus(ids, 'invoiced', ref.trim(), due.trim());
    });
    root.querySelector('#bill-mark-paid').addEventListener('click', function () {
      var ids = selected();
      if (!ids.length) return;
      if (!confirm('Mark ' + ids.length + ' charge(s) paid?')) return;
      applyBillingStatus(ids, 'paid', '');
    });
    root.querySelectorAll('[data-bill-edit]').forEach(function (b) {
      b.addEventListener('click', function () { openBillingChargeModal({ entryId: b.getAttribute('data-bill-edit') }); });
    });
    root.querySelectorAll('[data-bill-void]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-bill-void');
        var e = (state.billingEntries || []).find(function (x) { return x.id === id; });
        if (!e) return;
        var reason = prompt('Why is this charge void? It stays in the ledger, out of the totals.\n' + billingEntryText(e));
        if (reason == null) return;
        var res = StuffMigrate.voidBillingEntry(state, id, reason, { by: currentUserEmailOrName(), at: nowIso() });
        if (res.error) { alert(res.error); return; }
        logChange('void', 'billing', id, 'Voided charge ' + billingEntryText(e) + ' for ' + customerNameFor(e) + ': ' + res.entry.voidReason);
        save();
        renderBilling();
      });
    });
  }

  function currentUserEmailOrName() {
    return (auth.user && (auth.user.email || auth.user.name)) || currentUserName();
  }

  // Lead ids behind billing entries: the entry's lead, or the lead of its SKU job.
  function billingDealIds(entryIds) {
    return entryIds.map(function (id) {
      var e = (state.billingEntries || []).find(function (x) { return x.id === id; });
      if (!e) return '';
      if (e.dealId) return e.dealId;
      var k = e.skuJobId ? getSku(e.skuJobId) : null;
      return k && k.dealId || '';
    });
  }

  // Invoice sent (#101): a won lead's SKU jobs move to Awaiting Payment. A lead that is not won yet
  // keeps Mark won as the confirmation, with the start stage set to Awaiting Payment.
  function afterInvoiced(dealIds, invoiceRef) {
    var seen = {}, unwon = [];
    dealIds.forEach(function (id) {
      var lead = id && !seen[id] ? getDeal(id) : null;
      seen[id] = true;
      if (!lead) return;
      if (!StuffMigrate.isClosedLead(lead)) { if (!isLostStage(lead.stage)) unwon.push(lead); return; }
      var moved = StuffMigrate.sendLeadToAwaitingPayment(state, lead, { at: nowIso(), by: currentUserEmailOrName(), invoiceRef: invoiceRef, source: 'human' });
      if (moved.length) { save(); showToast(moved.length + ' SKU job' + (moved.length === 1 ? '' : 's') + ' moved to Awaiting Payment.'); }
    });
    if (!unwon.length) return;
    var lead = unwon[0];
    var m = openJobModal('<div class="modal-title-row"><h2>Invoice sent. Move to Awaiting Payment?</h2></div>' +
      '<p><strong>' + escapeHtml(cardTitle(lead)) + '</strong> has an open invoice and is not won yet.</p>' +
      '<p class="muted-note">Mark won creates its SKU jobs on Awaiting Payment. You check them first.' + (unwon.length > 1 ? ' ' + (unwon.length - 1) + ' more lead(s) are listed in Admin tools.' : '') + '</p>' +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Not now</button><button type="button" id="inv-won-go">Mark won</button></div>', 'sm');
    m.querySelector('#inv-won-go').addEventListener('click', function () { closeJobModal(); openWonModal({ leadId: lead.id, stage: StuffMigrate.AWAITING_STAGE }); });
  }

  // Paid (#101): when nothing is left open on a won lead, its Awaiting Payment jobs move on by invoice type.
  function afterPaid(dealIds) {
    var seen = {};
    dealIds.forEach(function (id) {
      var lead = id && !seen[id] ? getDeal(id) : null;
      seen[id] = true;
      if (!lead || !StuffMigrate.isClosedLead(lead)) return;
      var r = StuffMigrate.settleAwaitingPayment(state, lead, { at: nowIso(), by: currentUserEmailOrName(), source: 'human' });
      if (r.moved.length) { save(); showToast('Paid. ' + r.moved.length + ' SKU job' + (r.moved.length === 1 ? '' : 's') + ' moved to ' + stageLabel(r.moved[0].to) + '.'); }
      else if (r.partial) showToast('Partial paid ' + formatMoney(r.info.paid) + ' of ' + formatMoney(r.info.total) + '. Still in Awaiting Payment.');
    });
  }

  function applyBillingStatus(ids, status, invoiceRef, dueDate) {
    var res = StuffMigrate.setBillingStatus(state, ids, status, { invoiceRef: invoiceRef, dueDate: dueDate || '', at: nowIso(), by: currentUserEmailOrName() });
    if (res.error) { alert(res.error); return; }
    res.changed.forEach(function (c) {
      var e = state.billingEntries.find(function (x) { return x.id === c.id; });
      logChange('update', 'billing', c.id, 'Charge ' + billingEntryText(e) + ' for ' + customerNameFor(e) + ': status ' + c.from + ' to ' + c.to +
        (c.to === 'invoiced' ? ' (invoice ' + c.invoiceRef + ')' : ''));
    });
    if (res.changed.length) save();
    if (res.skipped.length) showToast(res.changed.length + ' updated, ' + res.skipped.length + ' skipped (' + res.skipped.map(function (s) { return s.reason; }).join(', ') + ').');
    renderBilling();
    var changedIds = res.changed.map(function (c) { return c.id; });
    if (status === 'invoiced' && changedIds.length) afterInvoiced(billingDealIds(changedIds), invoiceRef);
    if (status === 'paid' && changedIds.length) {
      afterPaid(billingDealIds(changedIds));
      promptPaidLeads(res.changed.map(function (c) { return (state.billingEntries.find(function (x) { return x.id === c.id; }) || {}).dealId; }));
    }
  }

  // =====================================================================
  // Sold and paid to Pre-Production (issue #96). A lead that is sold and paid (StuffMigrate.soldPaidInfo)
  // but not won yet is flagged on its card, counted on the board and listed in Admin tools. Mark won stays
  // the confirmation: nothing creates SKU jobs on its own.
  // =====================================================================
  function soldPaidText(info) {
    return info.via === 'deposit' ? 'Deposit paid' : 'Paid ' + formatMoney(info.paidUpfront) + ' of ' + formatMoney(info.upfrontTotal) + ' up front';
  }

  // After Mark paid: offer Mark won for the first lead that just became sold and paid.
  function promptPaidLeads(dealIds) {
    var seen = {};
    var leads = (dealIds || []).filter(function (id) { if (!id || seen[id]) return false; seen[id] = true; return true; })
      .map(getDeal).filter(function (d) { return d && !StuffMigrate.isClosedLead(d) && StuffMigrate.isSoldAndPaid(state, d); });
    if (!leads.length) return;
    var lead = leads[0];
    var info = StuffMigrate.soldPaidInfo(state, lead);
    var m = openJobModal('<div class="modal-title-row"><h2>Paid. Move to Pre-Production?</h2></div>' +
      '<p><strong>' + escapeHtml(cardTitle(lead)) + '</strong> is sold and paid (' + escapeHtml(soldPaidText(info)) + ', quote ' + escapeHtml(StuffMigrate.quoteLabel(info.quote)) + ').</p>' +
      '<p class="muted-note">Mark won creates its SKU jobs on the first Pre-Production stage. You check them first.' + (leads.length > 1 ? ' ' + (leads.length - 1) + ' more paid lead(s) are listed in Admin tools.' : '') + '</p>' +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Not now</button><button type="button" id="paid-won-go">Mark won</button></div>', 'sm');
    m.querySelector('#paid-won-go').addEventListener('click', function () { closeJobModal(); openWonModal({ leadId: lead.id }); });
  }

  function paidWaitingRowsHtml(list) {
    if (!list.length) return '<p class="muted-note">Nothing paid is waiting. Every sold and paid lead is in Pre-Production.</p>';
    return '<div class="table-wrap"><table class="kpi-table paid-waiting-table"><thead><tr><th>Lead</th><th>Customer</th><th>Stage</th><th>Paid</th><th></th></tr></thead><tbody>' +
      list.map(function (d) {
        var info = StuffMigrate.soldPaidInfo(state, d);
        return '<tr><td><button type="button" class="link-btn" data-paid-open="' + escapeHtml(d.id) + '">' + escapeHtml(cardTitle(d)) + '</button></td>' +
          '<td>' + escapeHtml(customerNameFor(d)) + '</td><td>' + escapeHtml(stageLabel(d.stage)) + '</td><td>' + escapeHtml(soldPaidText(info)) + '</td>' +
          '<td><button type="button" class="secondary" data-paid-won="' + escapeHtml(d.id) + '">Mark won</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function bindPaidWaitingRows(root, after) {
    root.querySelectorAll('[data-paid-won]').forEach(function (b) {
      b.addEventListener('click', function () { if (after) after(); openWonModal({ leadId: b.getAttribute('data-paid-won') }); });
    });
    root.querySelectorAll('[data-paid-open]').forEach(function (b) {
      b.addEventListener('click', function () { if (after) after(); openDetail(b.getAttribute('data-paid-open')); });
    });
  }

  function openPaidWaitingModal(list) {
    var m = openJobModal('<div class="modal-title-row"><h2>Paid, not in Pre-Production</h2></div>' + paidWaitingRowsHtml(list) +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Close</button></div>', 'lg');
    bindPaidWaitingRows(m, closeJobModal);
  }

  // Admin tools sweep: every sold and paid lead that is not won. Read-only until Mark won is clicked.
  function paidSweepCardHtml() {
    var list = StuffMigrate.paidNotWon(state);
    return '<section class="admin-card" id="paid-sweep-card"><h3>Paid, not in Pre-Production</h3>' +
      '<p class="muted-note">Leads with an accepted quote and a paid Deposit, or paid Design, Prototype and Tooling covering the quote. Mark won moves each one onto Pre-Production.</p>' +
      paidWaitingRowsHtml(list) + '</section>';
  }

  // Admin tools sweep (#101): an open invoice whose lead is not in Awaiting Payment. One click per row:
  // SKU jobs of a won lead move; a lead that is not won opens Mark won on Awaiting Payment.
  function openInvoiceSweepCardHtml() {
    var rows = StuffMigrate.openInvoiceNotAwaiting(state, nowIso());
    var body = !rows.length ? '<p class="muted-note">Nothing to move. Every open invoice is in Awaiting Payment.</p>' :
      '<div class="table-wrap"><table class="kpi-table"><thead><tr><th>Lead</th><th>Customer</th><th>Invoice</th><th>Open</th><th></th></tr></thead><tbody>' +
      rows.map(function (r) {
        var d = r.deal;
        return '<tr><td><button type="button" class="link-btn" data-inv-open="' + escapeHtml(d.id) + '">' + escapeHtml(cardTitle(d)) + '</button></td>' +
          '<td>' + escapeHtml(customerNameFor(d)) + '</td><td>' + escapeHtml(r.info.invoiceRefs.join(', ') || '(no number)') + '</td>' +
          '<td>' + escapeHtml(formatMoney(r.info.openAmount)) + '</td>' +
          '<td><button type="button" class="secondary" data-inv-go="' + escapeHtml(d.id) + '">' + (r.kind === 'move' ? 'Move to Awaiting Payment' : 'Mark won') + '</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    return '<section class="admin-card" id="open-invoice-sweep-card"><h3>Open invoice, not in Awaiting Payment</h3>' +
      '<p class="muted-note">Leads with an invoiced charge that is not paid yet. Won leads move their SKU jobs. Leads not won open Mark won with the start stage Awaiting Payment.</p>' + body + '</section>';
  }

  function bindOpenInvoiceSweep(root) {
    if (!root) return;
    root.querySelectorAll('[data-inv-open]').forEach(function (b) {
      b.addEventListener('click', function () { openDetail(b.getAttribute('data-inv-open')); });
    });
    root.querySelectorAll('[data-inv-go]').forEach(function (b) {
      b.addEventListener('click', function () {
        var lead = getDeal(b.getAttribute('data-inv-go'));
        if (!lead) return;
        if (!StuffMigrate.isClosedLead(lead)) { openWonModal({ leadId: lead.id, stage: StuffMigrate.AWAITING_STAGE }); return; }
        var moved = StuffMigrate.sendLeadToAwaitingPayment(state, lead, { at: nowIso(), by: currentUserEmailOrName(), source: 'human' });
        if (moved.length) { save(); showToast(moved.length + ' SKU job' + (moved.length === 1 ? '' : 's') + ' moved to Awaiting Payment.'); }
        renderApp();
      });
    });
  }

  // Add or edit one charge. ctx: { customerId } for a new one, { entryId } to edit.
  function openBillingChargeModal(ctx) {
    ctx = ctx || {};
    var e = ctx.entryId ? (state.billingEntries || []).find(function (x) { return x.id === ctx.entryId; }) : null;
    var v = e || { customerId: ctx.customerId || '', date: todayStr(), description: '', amount: '', breakdown: '', category: ctx.category || 'shipping', ref: '', shipTo: '', dealId: ctx.dealId || '' };
    var html = '<div class="modal-title-row"><h2>' + (e ? 'Edit charge' : 'Add charge') + '</h2></div><form id="bill-form">' +
      '<div class="field"><label for="bf-customer">Customer</label><select id="bf-customer" required>' + customerOptions(v.customerId, false) + '</select></div>' +
      '<div class="row"><div class="field"><label for="bf-date">Date</label><input type="date" id="bf-date" required value="' + escapeHtml(v.date) + '" /></div>' +
      '<div class="field"><label for="bf-amount">Amount $</label><input type="text" inputmode="decimal" id="bf-amount" required value="' + escapeHtml(v.amount === '' ? '' : Number(v.amount).toFixed(2)) + '" placeholder="100.10" /></div>' +
      '<div class="field"><label for="bf-category">Category</label><select id="bf-category">' + StuffMigrate.BILLING_CATEGORIES.map(function (c) {
        return '<option value="' + c + '"' + (c === v.category ? ' selected' : '') + '>' + BILLING_CATEGORY_LABELS[c] + '</option>';
      }).join('') + '</select></div></div>' +
      '<div class="field"><label for="bf-description">Description</label><input type="text" id="bf-description" required value="' + escapeHtml(v.description) + '" /></div>' +
      // #96: a payment linked to a lead (Deposit, Design, Prototype, Tooling) counts toward sold and paid.
      '<div class="field"><label for="bf-deal">Lead (optional)</label><select id="bf-deal"></select></div>' +
      '<div class="field"><label for="bf-breakdown">Breakdown (optional)</label><input type="text" id="bf-breakdown" value="' + escapeHtml(v.breakdown || '') + '" placeholder="84.10 + 16.00 Saturday surcharge" /></div>' +
      '<div class="row"><div class="field"><label for="bf-ref">Ref or tracking number</label><input type="text" id="bf-ref" value="' + escapeHtml(v.ref || '') + '" /></div>' +
      '<div class="field"><label for="bf-shipto">Ship to (optional)</label><input type="text" id="bf-shipto" value="' + escapeHtml(v.shipTo || '') + '" /></div>' +
      '<div class="field"><label for="bf-due">Due date (optional)</label><input type="date" id="bf-due" value="' + escapeHtml(v.dueDate || '') + '" /></div></div>' +
      (e ? '<p class="muted-note">Status: ' + escapeHtml(e.voided ? 'Void' : (BILLING_STATUS_LABELS[e.status] || e.status)) + '. Use Mark invoiced, Mark paid or Void in the ledger to change it.</p>' : '<p class="muted-note">New charges start unbilled.</p>') +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button><button type="submit" id="bf-save">Save charge</button></div></form>';
    var m = openJobModal(html);
    function fillDeals() {
      var cid = m.querySelector('#bf-customer').value;
      var leads = (state.deals || []).filter(function (d) { return d && d.customerId === cid && !isProjectCard(d) && d.type !== 'internal'; });
      if (v.dealId && !leads.some(function (d) { return d.id === v.dealId; })) { var cur = getDeal(v.dealId); if (cur) leads.unshift(cur); }
      m.querySelector('#bf-deal').innerHTML = '<option value="">No lead</option>' + leads.map(function (d) {
        return '<option value="' + escapeHtml(d.id) + '"' + (d.id === v.dealId ? ' selected' : '') + '>' + escapeHtml(cardTitle(d)) + '</option>';
      }).join('');
    }
    fillDeals();
    m.querySelector('#bf-customer').addEventListener('change', function () { v.dealId = ''; fillDeals(); });
    m.querySelector('#bill-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var input = {
        customerId: m.querySelector('#bf-customer').value, date: m.querySelector('#bf-date').value,
        amount: m.querySelector('#bf-amount').value, category: m.querySelector('#bf-category').value,
        description: m.querySelector('#bf-description').value, breakdown: m.querySelector('#bf-breakdown').value,
        ref: m.querySelector('#bf-ref').value, shipTo: m.querySelector('#bf-shipto').value,
        dealId: m.querySelector('#bf-deal').value, dueDate: m.querySelector('#bf-due').value
      };
      var o = { by: currentUserEmailOrName(), at: nowIso() };
      if (e) {
        var res = StuffMigrate.updateBillingEntry(state, e.id, input, o);
        if (res.error) { alert(res.error); return; }
        if (res.changes.length) {
          logChange('update', 'billing', e.id, 'Charge for ' + customerNameFor(e) + ': ' + res.changes.map(function (c) {
            return c.field + ' ' + (c.from === '' ? '(blank)' : c.from) + ' to ' + (c.to === '' ? '(blank)' : c.to);
          }).join('; '));
          save();
        }
      } else {
        var add = StuffMigrate.addBillingEntry(state, input, o);
        if (add.error) { alert(add.error); return; }
        var n = add.entry;
        logChange('create', 'billing', n.id, 'Added charge ' + billingEntryText(n) + ' (' + n.category + (n.ref ? ', ref ' + n.ref : '') + ') for ' + customerNameFor(n) + ', unbilled');
        save();
        billingNav.customerId = n.customerId;
      }
      closeJobModal();
      if (activeView === 'billing') { persistActiveNav(); renderBilling(); } else renderApp();
    });
  }

  // Small Billing block on the customer page.
  function customerBillingBlockHtml(cust) {
    var t = StuffMigrate.billingTotals(StuffMigrate.billingEntriesFor(state, cust.id));
    return '<div class="section-title">Billing</div><div class="bill-customer-block" id="cu-billing-block">' +
      '<span>Unbilled <strong>' + formatCents(t.unbilled) + '</strong></span>' +
      // #50: invoiced, paid and open (invoiced, not paid yet), read-only from the ledger.
      '<span>Invoiced <strong>' + formatCents(t.invoiced + t.paid) + '</strong></span>' +
      '<span>Paid <strong>' + formatCents(t.paid) + '</strong></span>' +
      '<span>Open <strong>' + formatCents(t.invoiced) + '</strong></span>' +
      '<button type="button" class="link-btn" id="cu-billing-open">' + (t.count || t.voided ? 'Open ledger' : 'Add a charge') + '</button></div>';
  }

  // =====================================================================
  // v12: Admin tools panel (role stub, migration check, change log, time machine, proposals, kill switch)
  // =====================================================================

  // =====================================================================
  // SOPs (issue #97): stage owner, exit criteria and SLA. Defaults live in code (StuffMigrate.stageSop);
  // only edits are stored in state.stageMeta. Edited in Edit stages, shown on the SOP page.
  // =====================================================================

  function cardSla(card) {
    return StuffMigrate.slaStatus(state, card, Date.now(), TERMINAL_STAGES);
  }

  // Every card, SKU job and PO line that is past its stage SLA now.
  function overSlaCards() {
    var out = [];
    function add(id, title, customer, stage, status) {
      out.push({ id: id, title: title, customer: customer, stage: stage, status: status, owner: StuffMigrate.stageSop(state, stage).owner });
    }
    activeCards().forEach(function (c) {
      var s = cardSla(c);
      if (s && s.over) add(c.id, cardTitle(c), customerNameFor(c), c.stage, s);
    });
    liveSkus().forEach(function (k) {
      var s = cardSla(k);
      if (s && s.over) add(k.id, skuTitle(k), customerNameFor(k), k.stage, s);
    });
    allPoLines().forEach(function (x) {
      var s = cardSla(x.line);
      if (s && s.over) add(x.line.id, 'PO ' + (x.po.poNumber || '(no number)'), customerNameFor(x.po), x.line.stage, s);
    });
    return out;
  }

  function overSlaByStage() {
    var map = {};
    overSlaCards().forEach(function (c) { map[c.stage] = (map[c.stage] || 0) + 1; });
    return map;
  }

  function sopEditHtml(stage) {
    var sop = StuffMigrate.stageSop(state, stage);
    var own = (state.stageMeta && state.stageMeta[stage]) || {};
    var bots = StuffMigrate.sopBots(state);
    var defOwner = StuffMigrate.stageSop({ sopBots: state.sopBots, sections: state.sections }, stage).owner;
    return '<label class="col-idle-edit">Owner <select class="col-sop-select"><option value="">' +
      (defOwner ? 'Default (' + escapeHtml(StuffMigrate.sopBotLabel(state, defOwner)) + ')' : 'No owner') + '</option>' +
      bots.map(function (b) { return '<option value="' + escapeHtml(b.id) + '"' + (own.owner === b.id ? ' selected' : '') + '>' + escapeHtml(b.label) + '</option>'; }).join('') +
      '</select></label>' +
      '<label class="col-idle-edit">SLA days <input type="number" min="1" max="365" class="col-sla-input" value="' + (own.slaDays != null ? escapeHtml(String(own.slaDays)) : '') +
      '" placeholder="' + (sop.slaDays && own.slaDays == null ? sop.slaDays : 'none') + '" /></label>' +
      '<button type="button" class="ghost col-rules-btn" data-stage-exit="1">Exit criteria</button>';
  }

  // Stores an SOP edit and writes one change log line per changed field, with old and new value.
  function applySopEdit(stage, patch) {
    var res = StuffMigrate.setStageSop(state, stage, patch);
    if (!res.ok) { showToast(res.error); return false; }
    res.changes.forEach(function (c) {
      var show = function (v) { return c.field === 'owner' ? StuffMigrate.sopBotLabel(state, v) || 'none' : (v == null || v === '' ? 'none' : String(v)); };
      logChange('update', 'stage', stage, 'SOP ' + c.field + ' on ' + stageLabel(stage) + ': ' + show(c.oldValue) + ' to ' + show(c.newValue));
    });
    if (res.changes.length) save();
    return true;
  }

  function bindSopEdit(col, stage) {
    var ownerSel = col.querySelector('.col-sop-select');
    if (ownerSel) ownerSel.addEventListener('change', function () { applySopEdit(stage, { owner: ownerSel.value }); renderBoard(); });
    var slaIn = col.querySelector('.col-sla-input');
    if (slaIn) slaIn.addEventListener('change', function () { applySopEdit(stage, { slaDays: slaIn.value }); renderBoard(); });
    var exitBtn = col.querySelector('[data-stage-exit]');
    if (exitBtn) exitBtn.addEventListener('click', function (e) { e.stopPropagation(); openStageExitModal(stage); });
  }

  function openStageExitModal(stage) {
    var sop = StuffMigrate.stageSop(state, stage);
    var m = openJobModal('<div class="modal-title-row"><h2>Exit criteria: ' + escapeHtml(stageLabel(stage)) + '</h2></div>' +
      '<form id="exit-form"><div class="field"><label for="ex-entry">Moves in when (' + StuffMigrate.SOP_ENTRY_MAX + ' characters)</label>' +
      '<input type="text" id="ex-entry" maxlength="' + StuffMigrate.SOP_ENTRY_MAX + '" value="' + escapeHtml(sop.entry) + '" /></div>' +
      '<div class="field"><label for="ex-exit">Exit criteria (' + StuffMigrate.SOP_EXIT_MAX + ' characters)</label>' +
      '<textarea id="ex-exit" rows="3" maxlength="' + StuffMigrate.SOP_EXIT_MAX + '">' + escapeHtml(sop.exit) + '</textarea></div>' +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button><button type="submit">Save</button></div></form>', 'sm');
    m.querySelector('#exit-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (applySopEdit(stage, { entry: m.querySelector('#ex-entry').value, exit: m.querySelector('#ex-exit').value })) {
        closeJobModal();
        renderBoard();
      }
    });
  }

  // Rows of the SOP table in menu order: area, board, stage.
  function sopRows() {
    var overMap = overSlaByStage();
    var counts = {};
    activeCards().forEach(function (c) { counts[c.stage] = (counts[c.stage] || 0) + 1; });
    var rows = [];
    areaList().forEach(function (area) {
      if (isFixedItem(area) || isSeparator(area)) return;
      sectionList().filter(function (s) { return s.area === area.id && s.kind !== 'separator'; }).forEach(function (sec) {
        (sec.stages || []).forEach(function (st) {
          var sop = StuffMigrate.stageSop(state, st);
          rows.push({
            area: area.label, board: sec.label, boardId: sec.id, stage: st, label: stageLabel(st),
            owner: sop.owner, ownerLabel: sop.owner ? StuffMigrate.sopBotLabel(state, sop.owner) : '',
            entry: sop.entry, exit: sop.exit, slaDays: sop.slaDays || '',
            cards: (counts[st] || 0) + jobCardsOnStage(st).length, over: overMap[st] || 0
          });
        });
      });
    });
    return rows;
  }

  function exportSopCsv() {
    var cols = [['area', 'Area'], ['board', 'Board'], ['label', 'Stage'], ['stage', 'Stage id'], ['ownerLabel', 'Owner'], ['entry', 'Moves in when'],
      ['exit', 'Exit criteria'], ['slaDays', 'SLA days'], ['cards', 'Cards now'], ['over', 'Over SLA now']];
    var csv = StuffMigrate.viewRowsToCsv(sopRows(), cols);
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'matrix-sop-' + todayStr() + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function setActiveSop() {
    autoCloseNavOnPhone();
    activeView = 'sop';
    activeArea = 'sop';
    activeDetailId = null;
    persistActiveNav();
    renderApp();
  }

  function sopEnforceMode() {
    var m = state.settings && state.settings.sopEnforce;
    return m === 'warn' || m === 'on' ? m : 'off';
  }

  function renderSop() {
    var root = document.getElementById('sop-root');
    if (!root) return;
    var admin = isAdmin();
    var rows = sopRows();
    var html = '<div class="kpi-head"><h2>SOP</h2><button type="button" class="ghost" id="sop-csv">Export CSV</button></div>';
    html += '<div class="sop-static"><p><strong>Who moves a card.</strong> ' + escapeHtml(StuffMigrate.SOP_MOVER_RULE) + ' Matrix Manager may move a card for any bot.</p>' +
      '<p><strong>When Owner is asked.</strong></p><ul>' + StuffMigrate.SOP_ESCALATIONS.map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; }).join('') + '</ul>' +
      '<p>Bot request format: <a href="https://github.com/catjiz/matrix-matrix/blob/main/MATRIX_WRITE_API.md" target="_blank" rel="noopener">MATRIX_WRITE_API.md</a>. ' +
      'Owner check: <strong>' + escapeHtml(sopEnforceMode()) + '</strong>.</p></div>';
    html += '<div class="table-wrap"><table class="kpi-table sop-table"><thead><tr><th>Stage</th><th>Id</th><th>Owner</th><th>Moves in when</th><th>Exit criteria</th>' +
      '<th class="num">SLA days</th><th class="num">Cards now</th><th class="num">Over SLA now</th>' + (admin ? '<th></th>' : '') + '</tr></thead><tbody>';
    var lastKey = '';
    rows.forEach(function (r) {
      var key = r.area + '|' + r.boardId;
      if (key !== lastKey) {
        html += '<tr class="sop-group"><td colspan="' + (admin ? 9 : 8) + '">' + escapeHtml(r.area + ' / ' + r.board) + '</td></tr>';
        lastKey = key;
      }
      html += '<tr><td>' + escapeHtml(r.label) + '</td><td><code>' + escapeHtml(r.stage) + '</code></td><td>' + escapeHtml(r.ownerLabel) + '</td>' +
        '<td>' + escapeHtml(r.entry) + '</td><td>' + escapeHtml(r.exit) + '</td><td class="num">' + escapeHtml(String(r.slaDays)) + '</td>' +
        '<td class="num">' + r.cards + '</td><td class="num">' + (r.over || '') + '</td>' +
        (admin ? '<td><button type="button" class="link-btn" data-sop-edit="' + escapeHtml(r.boardId) + '">Edit stages</button></td>' : '') + '</tr>';
    });
    html += '</tbody></table></div>';
    if (admin) {
      html += '<div class="section-title">SOP bots</div><p class="muted-note">Names shown as stage owners. A bot id is never removed or reused.</p><div id="sop-bots">';
      StuffMigrate.sopBots(state).forEach(function (b) {
        html += '<div class="sop-bot-row"><code>' + escapeHtml(b.id) + '</code><input type="text" maxlength="' + 40 + '" data-sop-bot="' + escapeHtml(b.id) + '" value="' + escapeHtml(b.label) + '" /></div>';
      });
      html += '<div class="sop-bot-row"><input type="text" id="sop-new-id" placeholder="new-bot-id" maxlength="30" /><input type="text" id="sop-new-label" placeholder="Name" maxlength="40" /></div></div>' +
        '<div class="detail-actions"><span class="spacer"></span><button type="button" id="sop-bots-save">Save bots</button></div>';
    }
    root.innerHTML = html;
    document.getElementById('sop-csv').addEventListener('click', exportSopCsv);
    root.querySelectorAll('[data-sop-edit]').forEach(function (b) {
      b.addEventListener('click', function () {
        activeBoardId = b.getAttribute('data-sop-edit');
        persistActiveSection();
        setActiveView('board');
        if (!stagesEditMode) toggleStagesEditMode();
        renderApp();
      });
    });
    var saveBots = document.getElementById('sop-bots-save');
    if (saveBots) saveBots.addEventListener('click', function () {
      if (!requireAdmin('edit SOP bots')) return;
      var list = StuffMigrate.sopBots(state).map(function (b) {
        var inp = root.querySelector('[data-sop-bot="' + b.id + '"]');
        return { id: b.id, label: inp ? inp.value : b.label };
      });
      var nid = document.getElementById('sop-new-id').value.trim();
      var nlabel = document.getElementById('sop-new-label').value.trim();
      if (nid || nlabel) list.push({ id: nid, label: nlabel });
      var res = StuffMigrate.setSopBots(state, list);
      if (!res.ok) { showToast(res.error); return; }
      logChange('update', 'settings', 'sopBots', 'SOP bots: ' + res.bots.map(function (b) { return b.id + '=' + b.label; }).join(', '));
      save();
      renderSop();
    });
  }

  function setActiveAdmin() {
    activeView = 'admin';
    activeArea = 'admin';
    activeDetailId = null;
    persistActiveNav();
    renderApp();
  }

  // Split storage (issue #103): Admin tools card. Dry run works anywhere; copy, switch and join back
  // need the hosted Matrix and an admin. Nothing changes for anyone until Switch.
  var splitTool = { plan: null, copy: null, msg: '', busy: false };
  function storageApi() { return window.MatrixCloud && window.MatrixCloud.storage; }
  function isSplitNow() { return !!(window.MatrixCloud && window.MatrixCloud.isSplit && window.MatrixCloud.isSplit()); }
  function splitPlanHtml(plan) {
    var rows = plan.collections.filter(function (c) { return c.count; }).map(function (c) {
      return '<tr><td>' + escapeHtml(c.key) + '</td><td>' + c.count + '</td><td>' + escapeHtml(formatBytes(c.bytes)) + '</td><td>' + escapeHtml(formatBytes(c.largestBytes)) + '</td></tr>';
    }).join('');
    return '<p class="muted-note">' + plan.docs + ' records in ' + plan.collections.filter(function (c) { return c.count; }).length + ' collections. Config ' +
      escapeHtml(formatBytes(plan.configBytes)) + '. Checksum ' + escapeHtml(plan.checksum) + '.</p>' +
      '<div class="table-wrap"><table class="log-table"><thead><tr><th>Collection</th><th>Records</th><th>Size</th><th>Largest</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (plan.blockers.length ? '<p class="warn-note">Fix before the split:</p><ul class="muted-note">' + plan.blockers.map(function (b) { return '<li>' + escapeHtml(b) + '</li>'; }).join('') + '</ul>'
        : '<p class="ok-note">Nothing blocks the split.</p>');
  }
  function splitCardHtml() {
    var api = storageApi();
    var cloud = !!(api && api.status().cloud);
    var split = isSplitNow();
    var html = '<section class="admin-card admin-wide" id="split-card"><h3>Storage: ' + (split ? 'split into collections' : 'one document') + '</h3>';
    html += '<p class="muted-note">' + (split
      ? 'Each record is its own document under workspace/main. Two people (or a bot) can save different records at the same time.'
      : 'Split moves each record into its own document so the 1 MB limit no longer applies. Dry run first. Copy and check writes the copy and changes nothing for anyone. Switch makes it live.') + '</p>';
    html += '<div class="admin-actions">';
    if (!split) {
      html += '<button type="button" class="secondary" id="split-dry">Dry run</button>';
      if (cloud) {
        html += '<button type="button" class="secondary" id="split-copy"' + (splitTool.busy ? ' disabled' : '') + '>Copy and check</button>';
        if (splitTool.copy && splitTool.copy.ok) html += '<button type="button" class="danger" id="split-switch"' + (splitTool.busy ? ' disabled' : '') + '>Switch to split</button>';
      }
    } else {
      html += '<button type="button" class="secondary" id="split-verify"' + (splitTool.busy ? ' disabled' : '') + '>Check records</button>';
      html += '<button type="button" class="ghost" id="split-rollback"' + (splitTool.busy ? ' disabled' : '') + '>Join back into one document</button>';
    }
    html += '</div>';
    if (!cloud) html += '<p class="muted-note">Copy and switch work in the hosted Matrix only.</p>';
    if (splitTool.msg) html += '<p class="' + (/^OK/.test(splitTool.msg) ? 'ok-note' : 'warn-note') + '" id="split-msg">' + escapeHtml(splitTool.msg) + '</p>';
    if (splitTool.plan && !split) html += splitPlanHtml(splitTool.plan);
    return html + '</section>';
  }
  function runSplitStep(fn) {
    splitTool.busy = true; splitTool.msg = 'Working...'; renderAdmin();
    return fn().then(function (msg) { splitTool.msg = msg; }, function (e) { splitTool.msg = 'Stopped: ' + ((e && e.message) || e); })
      .then(function () { splitTool.busy = false; renderAdmin(); });
  }
  function bindSplitCard() {
    var api = storageApi();
    var on = function (id, fn) { var el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    on('split-dry', function () {
      splitTool.plan = StuffMigrate.splitPlan(state);
      splitTool.msg = splitTool.plan.blockers.length ? splitTool.plan.blockers.length + ' problem(s) block the split.' : 'OK. Dry run found nothing that blocks the split.';
      renderAdmin();
    });
    on('split-copy', function () {
      if (!requireAdmin('copy records for the split')) return;
      if (!confirm('Copy every record into its own document and check the copy? Nothing changes for anyone until you switch.')) return;
      takeSnapshot('before-split');
      runSplitStep(function () {
        return api.copy().then(function (r) {
          splitTool.copy = r; splitTool.plan = r.plan;
          return r.ok ? 'OK. Copied ' + r.written + ' records' + (r.removed ? ', removed ' + r.removed + ' leftover record(s)' : '') + '. Check passed (' + r.verify.copyChecksum + '). Archive ' + r.archiveId + '.'
            : 'The check found ' + r.verify.problems.length + ' problem(s): ' + r.verify.problems.slice(0, 5).join('; ');
        });
      });
    });
    on('split-switch', function () {
      if (!requireAdmin('switch to split storage')) return;
      if (!confirm('Switch to split storage now? Open tabs reload the records. You can join back later.')) return;
      runSplitStep(function () {
        return api.switchOn(splitTool.copy).then(function () { splitTool.copy = null; splitTool.plan = null; return 'OK. Switched to split storage.'; });
      });
    });
    on('split-verify', function () {
      runSplitStep(function () {
        return api.verify().then(function (v) { return v.ok ? 'OK. Every record matches (' + v.copyChecksum + ').' : v.problems.length + ' problem(s): ' + v.problems.slice(0, 5).join('; '); });
      });
    });
    on('split-rollback', function () {
      if (!requireAdmin('join the records back')) return;
      if (!confirm('Join every record back into one document? The record documents are kept.')) return;
      takeSnapshot('before-split-rollback');
      runSplitStep(function () { return api.rollback().then(function () { return 'OK. Joined back into one document.'; }); });
    });
  }

  function renderAdmin() {
    revokeCoverUrlsIfViewChanged();
    var root = document.getElementById('admin-root');
    if (!root) return;
    var rep = lastMigrationReport || state.lastMigrationReport || null;
    var check = StuffMigrate.checkMigration(state, { requirePrefixes: ['pd-'] });
    var snaps = listSnapshots().slice().reverse();
    var pending = (state.proposals || []).filter(function (p) { return p.status === 'pending'; });
    var log = (state.changeLog || []).slice(-100).reverse();
    var html = '';
    html += '<div class="detail-bar"><h2>Admin tools</h2></div>';

    html += '<div class="admin-grid">';

    html += '<section class="admin-card"><h3>Sign-in and role</h3>';
    html += '<p>Signed in as <strong>' + escapeHtml(currentUserName() || (auth.user && auth.user.email) || '—') + '</strong>' +
      (auth.user && auth.user.email ? ' (' + escapeHtml(auth.user.email) + ')' : '') +
      ' via ' + escapeHtml(auth.provider || 'stub') + '. Role: <strong>' + escapeHtml(auth.role) + '</strong>.</p>';
    html += '<div class="admin-actions">' +
      '<button type="button" class="secondary" id="adm-role-toggle">Switch to ' + (isAdmin() ? 'User' : 'Admin') + ' view</button>' +
      '<button type="button" class="ghost" id="adm-google">' + (auth.signedIn && window.MatrixCloud ? 'Sign out' : 'Sign in with Google') + '</button></div>';
    html += '<p class="muted-note">Admin only: Edit stages, Edit menu, hard delete, time machine restore, role changes. Users can add and edit cards, move them, add notes and tasks.</p>';
    html += '</section>';

    html += '<section class="admin-card"><h3>SOP</h3>' +
      '<p class="muted-note">Stage owners, exit criteria and SLAs. Bots that write through the API are checked against the stage owner.</p>' +
      '<div class="field"><label for="adm-sop-enforce">Owner check on the write API</label><select id="adm-sop-enforce">' +
      [['off', 'Off (no check)'], ['warn', 'Warn (allow, log a warning)'], ['on', 'On (refuse moves by a bot that owns neither stage)']].map(function (o) {
        return '<option value="' + o[0] + '"' + (sopEnforceMode() === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select></div>' +
      '<div class="admin-actions"><button type="button" class="secondary" id="adm-sop-open">Open SOP page</button></div></section>';

    html += '<section class="admin-card"><h3>Data and migration</h3>';
    html += '<p>Schema v' + (state.schemaVersion || state.version) + '. ' + state.deals.length + ' cards, ' + (state.customers || []).length + ' customers, ' +
      (state.contacts || []).length + ' contacts, ' + (state.files || []).length + ' file refs, ' + (state.tasks || []).length + ' tasks.</p>';
    if (rep) {
      html += '<p class="muted-note">Last migration ' + escapeHtml(new Date(rep.at).toLocaleString()) + ': v' + rep.fromVersion + ' to v' + rep.toVersion +
        ', deals in ' + rep.dealsIn + ', leads out ' + rep.leadsOut + ', projects out ' + rep.projectsOut +
        ', customers created ' + rep.customersCreated + ' (reused ' + rep.customersReused + '), contacts created ' + rep.contactsCreated +
        ' (merged ' + rep.contactsMerged + '), file refs ' + rep.filesRehomed + ', pd ids ' + rep.pdIds + ', jf ids ' + rep.jfIds + '.</p>';
    }
    html += '<p class="' + (check.ok ? 'ok-note' : 'warn-note') + '">Migration check: ' + (check.ok ? 'OK' : check.problems.length + ' problem(s)') +
      ' (' + check.uniqueCompanyNames + ' unique company names)</p>';
    if (!check.ok) html += '<ul class="muted-note">' + check.problems.map(function (p) { return '<li>' + escapeHtml(p) + '</li>'; }).join('') + '</ul>';
    var seedDealCount = (window.MATRIX_SEED && window.MATRIX_SEED.deals) ? window.MATRIX_SEED.deals.length : 0;
    html += '<div class="admin-actions"><button type="button" class="secondary" id="adm-run-check">Run migration check</button>' +
      '<button type="button" class="secondary" id="adm-reseed"' + (seedDealCount ? '' : ' title="Seed data is local only"') +
      '>Reload enriched seed (' + seedDealCount + ' deals)</button></div>';
    html += '<p class="muted-note">Reload seed replaces current data. A snapshot is taken first. The v11 localStorage key is kept as a rollback copy for one release.</p>';
    html += '</section>';

    // Data size gauge: same thresholds as the write API (700 KB bulk writes refused, 950 KB all writes refused).
    // Split storage: only the 900 KB per document limit applies, so the gauge shows the largest document.
    if (isSplitNow()) {
      var sp = StuffMigrate.splitPlan(state);
      var big = sp.collections.reduce(function (m, c) { return c.largestBytes > m.b ? { b: c.largestBytes, n: c.key + ' ' + c.largestId } : m; }, { b: sp.configBytes, n: 'config' });
      var lvl = big.b >= 900 * 1024 ? 'blocked' : big.b >= 600 * 1024 ? 'watch' : 'ok';
      html += '<section class="admin-card"><h3>Data size: ' + Math.round(sp.totalBytes / 1024) + ' KB in ' + (sp.docs + 1) + ' documents</h3>' +
        '<div class="size-bar"><div class="size-fill size-' + lvl + '" style="width:' + Math.min(100, Math.round(big.b / (900 * 1024) * 100)) + '%"></div></div>' +
        '<p class="' + (lvl === 'ok' ? 'muted-note' : 'warn-note') + '">Largest document: ' + escapeHtml(big.n) + ', ' + escapeHtml(formatBytes(big.b)) + ' of 900 KB. Config ' +
        escapeHtml(formatBytes(sp.configBytes)) + '.</p></section>';
    }
    var dataBytes = new Blob([JSON.stringify(state)]).size;
    var dataKb = Math.round(dataBytes / 1024);
    var sizeLevel = dataBytes >= 950 * 1024 ? 'blocked' : dataBytes >= 700 * 1024 ? 'split' : dataBytes >= 550 * 1024 ? 'watch' : 'ok';
    if (!isSplitNow()) html += '<section class="admin-card"><h3>Data size: ' + dataKb + ' KB</h3>' +
      '<div class="size-bar"><div class="size-fill size-' + sizeLevel + '" style="width:' + Math.min(100, Math.round(dataBytes / (1024 * 1024) * 100)) + '%"></div>' +
      '<span class="size-mark" style="left:68.4%" title="700 KB"></span><span class="size-mark" style="left:92.8%" title="950 KB"></span></div>' +
      '<p class="' + (sizeLevel === 'ok' ? 'muted-note' : 'warn-note') + '">' + ({
        ok: 'Fine. The hosted workspace document caps at 1 MB; this is the same number an Export shows.',
        watch: 'Getting larger. Plan the split into collections (Phase 1.5) before SKU timelines and change logs grow.',
        split: 'Split required: the write API now refuses bulk bot writes. Single small writes still work.',
        blocked: 'Split required now: the write API refuses all writes at this size.'
      })[sizeLevel] + '</p></section>';

    html += splitCardHtml();

    html += '<section class="admin-card"><h3>Bot writes: ' + (botWritesFrozen() ? '<span class="warn-note">FROZEN</span>' : '<span class="ok-note">allowed as proposals</span>') + '</h3>';
    html += '<p class="muted-note">Bots propose through window.StuffCRM.proposeChange, or an approved bot signs in and uses Import enrichment (empty fields only; conflicts land here). The kill switch rejects new proposals and bot imports.</p>';
    html += '<div class="admin-actions"><button type="button" class="' + (botWritesFrozen() ? 'secondary' : 'danger') + '" id="adm-kill">' + (botWritesFrozen() ? 'Unfreeze bot writes' : 'Freeze bot writes (kill switch)') + '</button>' +
      '<button type="button" class="ghost" id="adm-demo-proposal">Queue a demo proposal</button></div>';
    html += '<h4>Proposal queue (' + pending.length + ' pending)</h4>';
    if (!pending.length) html += '<div class="file-empty">No pending proposals.</div>';
    else {
      html += '<ul class="proposal-list">';
      pending.forEach(function (p) {
        var deal = getDeal(p.entityType === 'lead' ? p.entityId : (p.payload && p.payload.leadId) || p.entityId);
        var isPo = p.action === 'po-upsert';
        var isLead = p.action === 'lead-upsert';
        var leadEntry = isLead ? ((p.payload || {}).entry || {}) : null;
        var onWhat = isPo ? 'customer PO ' + StuffMigrate.normalizePoNumber(((p.payload || {}).po || {}).poNumber)
          : isLead ? 'new lead ' + ((leadEntry.lead && leadEntry.lead.company) || (leadEntry.customer && leadEntry.customer.name) || '')
          : (deal ? cardTitle(deal) : (p.entityId || 'unknown'));
        html += '<li data-prop-id="' + escapeHtml(p.id) + '"><div><strong>' + escapeHtml(p.bot) + '</strong> proposes <em>' + escapeHtml(isPo ? 'PO upload' : isLead ? 'lead import' : p.action) + '</em> on ' +
          escapeHtml(onWhat) + '<div class="muted-note">' + escapeHtml(p.summary) + ' (' + escapeHtml(new Date(p.updatedAt || p.at).toLocaleString()) + ')</div>' +
          (isPo ? poProposalControlsHtml(p) : isLead ? leadProposalControlsHtml(p) : '') + '</div>' +
          '<div class="contact-actions"><button type="button" data-action="apply">Apply</button><button type="button" class="ghost" data-action="reject">Reject</button></div></li>';
      });
      html += '</ul>';
    }
    html += '</section>';

    html += enrichCardHtml();
    html += meetingImportCardHtml();
    html += paidSweepCardHtml();
    html += openInvoiceSweepCardHtml();
    html += completionCardHtml();
    html += backupsCardHtml();
    html += gmailCardHtml();
    html += poImportCardHtml();
    html += leadImportCardHtml();

    html += '<section class="admin-card"><h3>Time machine (' + snaps.length + ' snapshots)</h3>';
    html += '<p class="muted-note">Snapshots are taken before migrations, imports, restores and deletes, plus manually. Last ' + SNAPSHOT_CAP + ' kept in this browser.</p>';
    html += '<div class="admin-actions"><button type="button" class="secondary" id="adm-snap">Take snapshot now</button></div>';
    if (!snaps.length) html += '<div class="file-empty">No snapshots yet.</div>';
    else {
      html += '<ul class="snapshot-list">';
      snaps.forEach(function (sn) {
        html += '<li data-snap-id="' + escapeHtml(sn.id) + '"><div><strong>' + escapeHtml(sn.label) + '</strong><div class="muted-note">' +
          escapeHtml(new Date(sn.at).toLocaleString()) + ' by ' + escapeHtml(sn.by || '') + ', ' + escapeHtml(formatBytes(sn.size || 0)) + '</div></div>' +
          '<div class="contact-actions">' + (isAdmin() ? '<button type="button" class="secondary" data-action="restore">Restore</button>' : '<span class="muted-note">Admin only</span>') + '</div></li>';
      });
      html += '</ul>';
    }
    html += '</section>';

    var rescues = listRescueKeys();
    if (rescues.length || loadFailed) {
      html += '<section class="admin-card admin-wide rescue-card"><h3>Rescue copies' + (loadFailed ? ': saving is paused' : '') + '</h3>';
      html += '<p>' + (loadFailed ? 'Your saved data did not load this session, so nothing is being saved. ' : '') +
        'These are untouched copies of your data taken when a load failed. Download one and keep it; it imports like any export.</p><ul class="snapshot-list">';
      rescues.forEach(function (k) {
        html += '<li><div><strong>' + escapeHtml(k.replace(RESCUE_PREFIX, '')) + '</strong></div><div class="contact-actions"><button type="button" data-rescue="' + escapeHtml(k) + '">Download</button></div></li>';
      });
      html += '</ul></section>';
    }
    html += '<section class="admin-card"><h3>Drive uploads (stub)</h3>';
    html += '<p class="muted-note">Contract per DRIVE_UPLOAD_SPEC.md: Upload means a new file in the customer or project Drive folder plus slot subfolder. Never overwrite, never delete, never change sharing. ' +
      'Status: <strong>' + (driveAvailable() ? 'connected' : 'not connected, files stay in this browser') + '</strong>. API: window.StuffCRM.attachFileToDeal(...).</p>';
    html += '</section>';

    html += '<section class="admin-card admin-wide"><h3>Change log (last ' + log.length + ' of ' + (state.changeLog || []).length + ')</h3>';
    if (!log.length) html += '<div class="file-empty">Nothing logged yet.</div>';
    else {
      html += '<div class="table-wrap"><table class="log-table"><thead><tr><th>When</th><th>Who</th><th>Source</th><th>Action</th><th>Entity</th><th>Detail</th></tr></thead><tbody>';
      log.forEach(function (e) {
        html += '<tr><td>' + escapeHtml(new Date(e.at).toLocaleString()) + '</td><td>' + escapeHtml((e.who || '') + (e.actedFor ? ' for ' + e.actedFor : '') + (e.requestedBy ? ', requested by ' + e.requestedBy : '')) + '</td><td>' + escapeHtml(e.source || '') + '</td>' +
          '<td>' + escapeHtml(e.action || '') + '</td><td>' + escapeHtml((e.entityType || '') + (e.entityId ? ' ' + e.entityId : '')) + '</td><td>' +
          escapeHtml(e.detail || (e.field ? e.field + ': ' + (e.oldValue == null ? '' : e.oldValue) + ' to ' + (e.newValue == null ? '' : e.newValue) : '') + (e.warning ? ' (' + e.warning + ')' : '')) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '</section>';

    html += '</div>';
    root.innerHTML = html;

    document.getElementById('adm-role-toggle').addEventListener('click', function () {
      // Role switch is itself Admin only once live; in the stub Owner can flip it to preview the User view.
      auth.role = isAdmin() ? 'user' : 'admin';
      saveAuth();
      logChange('role', 'auth', null, 'Role set to ' + auth.role + ' (stub)');
      save();
      renderApp();
    });
    document.getElementById('adm-sop-open').addEventListener('click', setActiveSop);
    document.getElementById('adm-sop-enforce').addEventListener('change', function (e) {
      var sel = e.target;
      if (!requireAdmin('change the owner check')) { sel.value = sopEnforceMode(); return; }
      var was = sopEnforceMode();
      var next = sel.value === 'warn' || sel.value === 'on' ? sel.value : 'off';
      if (next === was) return;
      if (!state.settings) state.settings = {};
      state.settings.sopEnforce = next;
      logChange('update', 'settings', 'sopEnforce', 'SOP owner check: ' + was + ' to ' + next);
      save();
      renderAdmin();
    });
    document.getElementById('adm-google').addEventListener('click', signInWithGoogleStub);
    document.getElementById('adm-run-check').addEventListener('click', function () {
      var res = StuffMigrate.checkMigration(state, { requirePrefixes: ['pd-'] });
      alert(res.ok ? 'Migration check OK. ' + state.deals.length + ' cards, ' + state.customers.length + ' customers.' : 'Problems:\n' + res.problems.join('\n'));
      renderAdmin();
    });
    document.getElementById('adm-reseed').addEventListener('click', function () {
      if (!requireAdmin('reload the seed')) return;
      if (!window.MATRIX_SEED || !window.MATRIX_SEED.deals || !window.MATRIX_SEED.deals.length) {
        alert('Seed data is local only. Run this from a local checkout with the full seed-data.js loaded.');
        return;
      }
      if (!confirm('Replace all current data with the enriched seed? A snapshot is taken first.')) return;
      takeSnapshot('before-reseed');
      state = normalizeState(seedData());
      logChange('import', 'state', null, 'Reloaded enriched seed (' + state.deals.length + ' deals)');
      save();
      renderApp();
    });
    document.getElementById('adm-kill').addEventListener('click', function () {
      if (!requireAdmin('change the bot kill switch')) return;
      state.settings.botWritesFrozen = !botWritesFrozen();
      logChange('setting', 'settings', 'botWritesFrozen', String(state.settings.botWritesFrozen));
      save();
      renderAdmin();
    });
    document.getElementById('adm-demo-proposal').addEventListener('click', function () {
      var d = state.deals[0];
      if (!d) return;
      var id = addProposal({ bot: 'demo-bot', action: 'add-note', entityType: 'lead', entityId: d.id, payload: { text: '[bot] Demo proposal note' }, summary: 'Add a demo note to ' + cardTitle(d) });
      if (!id) alert('Proposal rejected: bot writes are frozen.');
    });
    bindEnrichCard();
    bindMeetingImportCard();
    bindSplitCard();
    var sweep = document.getElementById('paid-sweep-card');
    if (sweep) bindPaidWaitingRows(sweep);
    bindOpenInvoiceSweep(document.getElementById('open-invoice-sweep-card'));
    bindCompletionCard();
    bindBackupsCard();
    bindGmailCard();
    bindPoImportCard();
    bindLeadImportCard();
    document.getElementById('adm-snap').addEventListener('click', function () {
      if (takeSnapshot('manual')) renderAdmin(); else alert('Snapshot failed. Browser storage may be full.');
    });
    root.querySelectorAll('.proposal-list li').forEach(function (li) {
      var pid = li.getAttribute('data-prop-id');
      li.querySelector('[data-action="apply"]').addEventListener('click', function () { applyProposal(pid, li); });
      li.querySelector('[data-action="reject"]').addEventListener('click', function () { rejectProposal(pid); });
    });
    root.querySelectorAll('[data-rescue]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-rescue');
        downloadText(k + '.json', localStorage.getItem(k) || '');
      });
    });
    root.querySelectorAll('.snapshot-list li').forEach(function (li) {
      var b = li.querySelector('[data-action="restore"]');
      if (b) b.addEventListener('click', function () { restoreSnapshot(li.getAttribute('data-snap-id')); });
    });
  }


  // =====================================================================
  // v12 Phase 2: Projects, graduation, converted leads
  // =====================================================================

  var PROJECT_STATUS_LABELS = {
    design: 'Design', prototype: 'Prototype', tooling: 'Tooling', first_article: 'First article',
    production: 'Production', on_hold: 'On hold', complete: 'Complete'
  };
  var PROJECT_STATUS_ORDER = ['design', 'prototype', 'tooling', 'first_article', 'production', 'complete'];

  // #2: every money key is editable on a lead; nothing hides in a read-only line.
  var LEAD_MONEY_KEYS = ['designDfm', 'prototyping', 'tooling', 'partnerServices', 'productionArr', 'currentPo'];
  var PROJECT_MONEY_KEYS = ['tooling', 'currentPo', 'productionArr'];

  function moneyKeysFor(card) {
    return isProjectCard(card) ? PROJECT_MONEY_KEYS : LEAD_MONEY_KEYS;
  }

  // Values in fields this area hides still count; show them read-only so nothing looks lost.
  function hiddenMoneyLineHtml(card, shownKeys) {
    var vals = migrateDealValues(card);
    var labels = VALUE_LABELS();
    var parts = VALUE_KEYS.filter(function (k) { return shownKeys.indexOf(k) === -1 && Number(vals[k]) > 0; })
      .map(function (k) { return escapeHtml(labels[k] || k) + ' ' + formatMoney(vals[k]); });
    return parts.length ? '<p class="muted-note hidden-money">Also carried (included in total): ' + parts.join(', ') + '</p>' : '';
  }

  function projectStatusLabel(st) { return PROJECT_STATUS_LABELS[st] || st || 'Design'; }

  function projectsForCustomer(customerId) {
    return (state.projects || []).filter(function (p) { return p.customerId === customerId; });
  }

  function projectsForLead(lead) {
    var ids = (lead && lead.projectIds) || [];
    return ids.map(getDeal).filter(Boolean);
  }

  function projectStatusStepperHtml(p) {
    var idx = PROJECT_STATUS_ORDER.indexOf(p.status);
    var html = '<div class="status-stepper">';
    PROJECT_STATUS_ORDER.forEach(function (st, i) {
      var cls = i < idx ? 'done' : (i === idx ? 'current' : '');
      html += '<span class="status-step ' + cls + '">' + escapeHtml(projectStatusLabel(st)) + '</span>';
    });
    if (p.status === 'on_hold') html += '<span class="status-step hold current">On hold</span>';
    html += '</div>';
    return html;
  }

  var toastTimer = null;
  function showToast(msg) {
    var el = document.getElementById('toast');
    if (!el) { alert(msg); return; }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    // Long messages (for example the cloud reload notice) stay up long enough to read.
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, String(msg).length > 80 ? 9000 : 2600);
  }

  // Remove a lead or project record and clean references (tasks keep their rows, links go stale).
  function removeCardRecord(id) {
    var card = getDeal(id);
    if (!card) return;
    if (isProjectCard(card)) {
      state.projects = state.projects.filter(function (p) { return p.id !== id; });
      (state.deals || []).forEach(function (d) {
        if (Array.isArray(d.projectIds) && d.projectIds.indexOf(id) !== -1) {
          d.projectIds = d.projectIds.filter(function (x) { return x !== id; });
          if (!d.projectIds.length && d.status === 'converted') d.status = 'open';
        }
      });
    } else {
      state.deals = state.deals.filter(function (d) { return d.id !== id; });
      (state.projects || []).forEach(function (p) { if (p.leadId === id) p.leadId = null; });
    }
    state.files = (state.files || []).filter(function (f) { return !(f.ownerId === id && f.slot === 'cover'); });
  }

  // Project detail: own tasks plus tasks inherited from the source lead, with Move.
  function renderProjectTasks(root, proj) {
    if (!root) return;
    var own = (state.tasks || []).filter(function (t) { return !t.done && (t.entityId === proj.id || t.dealId === proj.id); });
    var inherited = proj.leadId ? (state.tasks || []).filter(function (t) {
      return !t.done && t.entityType === 'lead' && (t.entityId === proj.leadId || t.dealId === proj.leadId);
    }) : [];
    var html = '';
    if (!own.length && !inherited.length) html += '<div class="contacts-empty">No open tasks. Add one from the Tasks area and pick this project.</div>';
    function row(t, inh) {
      var bucket = findTaskBucket(t.bucket);
      return '<li class="project-task-row" data-task-id="' + escapeHtml(t.id) + '">' +
        '<span class="task-title">' + escapeHtml(t.title) + '</span>' +
        (t.dueDate ? '<span class="muted-note">Due ' + escapeHtml(t.dueDate) + '</span>' : '') +
        (bucket ? '<span class="badge">' + escapeHtml(bucket.label) + '</span>' : '') +
        (inh ? '<span class="badge badge-converted">Inherited from lead</span><button type="button" class="ghost" data-action="move">Move to project</button>' : '') +
        '</li>';
    }
    if (own.length) html += '<ul class="project-tasks">' + own.map(function (t) { return row(t, false); }).join('') + '</ul>';
    if (inherited.length) html += '<ul class="project-tasks">' + inherited.map(function (t) { return row(t, true); }).join('') + '</ul>';
    root.innerHTML = html;
    root.querySelectorAll('[data-action="move"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tid = btn.closest('li').getAttribute('data-task-id');
        var t = (state.tasks || []).find(function (x) { return x.id === tid; });
        if (!t) return;
        t.inheritedFromLeadId = t.entityId || t.dealId;
        t.entityType = 'project';
        t.entityId = proj.id;
        t.dealId = proj.id;
        logChange('update', 'task', t.id, 'Moved task to project ' + proj.id);
        save();
        renderProjectTasks(root, proj);
      });
    });
  }


  document.getElementById('detail-scrim').addEventListener('click', function () { if (activeView === 'detail') backFromDetail(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || activeView !== 'detail') return;
    if (document.querySelector('.modal-backdrop.open')) return;
    if (activeSkuId) { closeSku(); return; }
    backFromDetail();
  });


  // =====================================================================
  // Materials and Vendors (Owner 2026-09-23)
  // Materials (by type) with data sheets, Vendors with contacts and documents,
  // and Vendor Quotes that tie a vendor to a material at a price.
  // Vendor contacts reuse the Contact records (customerId holds the vendor id).
  // =====================================================================

  var DEFAULT_MATERIAL_TYPES = [
    'LSR (liquid silicone)', 'HCR (high consistency silicone)', 'Platinum / RTV silicone', 'TPE / TPU',
    'Polypropylene (PP)', 'Polyethylene (PE)', 'ABS', 'Nylon (PA)', 'Polycarbonate (PC)',
    'Pigment / colorant', 'Catalyst / additive', 'Mold release', 'Packaging', 'Other'
  ];
  var MATERIAL_DOC_SLOTS = [
    { id: 'tds', label: 'Data sheets (TDS)' },
    { id: 'sds', label: 'Safety data sheets (SDS)' },
    { id: 'certs', label: 'Certifications and COAs' },
    { id: 'other', label: 'Other documents' }
  ];
  var VENDOR_DOC_SLOTS = [
    { id: 'docs', label: 'Vendor documents (W-9, catalogs, credit app)' }
  ];
  var QUOTE_UNITS = ['kg', 'lb', 'gal', 'L', 'drum', 'pail', 'kit', 'ea', 'roll', 'sheet'];
  var DOC_MAX_BYTES = 25 * 1024 * 1024;
  var LB_PER_KG = 2.20462;

  var materialsNav = { tab: 'materials', materialId: null, vendorId: null, typeFilter: 'all', search: '', showExpired: false };

  function materialTypes() {
    if (!state.settings) state.settings = {};
    if (!Array.isArray(state.settings.materialTypes) || !state.settings.materialTypes.length) {
      state.settings.materialTypes = DEFAULT_MATERIAL_TYPES.slice();
    }
    return state.settings.materialTypes;
  }

  function getMaterial(id) { return (state.materials || []).find(function (m) { return m.id === id; }); }
  function getVendor(id) { return (state.vendors || []).find(function (v) { return v.id === id; }); }
  function getVendorQuote(id) { return (state.vendorQuotes || []).find(function (q) { return q.id === id; }); }
  function quotesForMaterial(id) { return (state.vendorQuotes || []).filter(function (q) { return q.materialId === id; }); }
  function quotesForVendor(id) { return (state.vendorQuotes || []).filter(function (q) { return q.vendorId === id; }); }
  function docsFor(ownerType, ownerId, slot) {
    return (state.files || []).filter(function (f) {
      return f.ownerType === ownerType && f.ownerId === ownerId && (!slot || f.slot === slot);
    });
  }

  function isQuoteExpired(q) { return !!q.validUntil && q.validUntil < todayStr(); }

  // A quote is superseded when the same vendor has a newer quote for the same material.
  function isQuoteSuperseded(q) {
    return (state.vendorQuotes || []).some(function (o) {
      return o.id !== q.id && o.vendorId === q.vendorId && o.materialId === q.materialId &&
        (o.quoteDate || '') > (q.quoteDate || '');
    });
  }

  function quoteStatus(q) {
    if (isQuoteSuperseded(q)) return 'superseded';
    if (isQuoteExpired(q)) return 'expired';
    return 'current';
  }

  // Price per kg when the unit allows it, so kg and lb quotes compare fairly.
  function pricePerKg(q) {
    var p = Number(q.price) || 0;
    if (!p) return null;
    if (q.unit === 'kg') return p;
    if (q.unit === 'lb') return p * LB_PER_KG;
    return null;
  }

  function comparablePrice(q) {
    var k = pricePerKg(q);
    return k != null ? { value: k, unit: 'kg' } : { value: Number(q.price) || 0, unit: q.unit || '' };
  }

  function bestCurrentQuote(materialId) {
    var cur = quotesForMaterial(materialId).filter(function (q) { return quoteStatus(q) === 'current' && Number(q.price) > 0; });
    if (!cur.length) return null;
    // Prefer weight-comparable quotes; fall back to the lowest raw price in the most common unit.
    var byKg = cur.filter(function (q) { return pricePerKg(q) != null; });
    var pool = byKg.length ? byKg : cur;
    return pool.slice().sort(function (a, b) { return comparablePrice(a).value - comparablePrice(b).value; })[0];
  }

  function formatUnitPrice(value, unit, currency) {
    if (value == null || isNaN(value)) return '';
    var cur = currency && currency !== 'USD' ? currency + ' ' : '$';
    // Small unit prices (a cent or two per piece) keep 4 decimals; everything else rounds to cents.
    var maxDigits = Math.abs(value) < 1 ? 4 : 2;
    return cur + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: maxDigits }) + (unit ? '/' + unit : '');
  }

  function materialsTitle() {
    if (materialsNav.materialId && getMaterial(materialsNav.materialId)) return 'Materials / ' + getMaterial(materialsNav.materialId).name;
    if (materialsNav.vendorId && getVendor(materialsNav.vendorId)) return 'Vendors / ' + getVendor(materialsNav.vendorId).name;
    return 'Materials and Vendors';
  }

  function setActiveMaterials(patch) {
    autoCloseNavOnPhone();
    materialsNav = Object.assign(materialsNav, patch || {});
    activeView = 'materials';
    activeArea = 'materials';
    activeDetailId = null;
    persistActiveNav();
    renderApp();
  }

  function renderMaterialsRailItem(rail) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rail-item customers-rail-item' + (activeView === 'materials' ? ' active' : '');
    btn.setAttribute('data-rail', 'materials');
    btn.title = 'Raw materials, vendors, vendor quotes and data sheets';
    var label = document.createElement('span');
    label.className = 'rail-item-label';
    label.textContent = 'Materials and Vendors';
    btn.appendChild(label);
    var badge = document.createElement('span');
    var n = (state.materials || []).length;
    badge.className = 'rail-count' + (n ? '' : ' zero');
    badge.textContent = String(n);
    btn.appendChild(badge);
    if (menuEditMode) {
      var lock = document.createElement('span');
      lock.className = 'rail-locked';
      lock.textContent = 'fixed';
      btn.appendChild(lock);
    }
    btn.addEventListener('click', function () {
      if (!menuEditMode) setActiveMaterials({ materialId: null, vendorId: null });
    });
    rail.appendChild(btn);
  }

  // ---------------------------------------------------------------------
  // Documents (data sheets etc.): IndexedDB blobs + FileRef, same store as covers.
  // ---------------------------------------------------------------------

  function uploadDocs(ownerType, ownerId, slot, fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    var tooBig = files.filter(function (f) { return f.size > DOC_MAX_BYTES; });
    if (tooBig.length) alert('Skipped (over 25 MB): ' + tooBig.map(function (f) { return f.name; }).join(', '));
    files = files.filter(function (f) { return f.size <= DOC_MAX_BYTES; });
    return files.reduce(function (p, file) {
      return p.then(function () {
        var id = StuffMigrate.makeId('fil');
        return idbPut(id, file).then(function () { return { blobKey: id, dataURL: null }; }).catch(function () {
          if (file.size > FILE_SOFT_LIMIT) throw new Error(file.name + ' is too large to store without IndexedDB.');
          return readFileAsDataURL(file).then(function (u) { return { blobKey: null, dataURL: u }; });
        }).then(function (stored) {
          state.files.push({
            id: id, ownerType: ownerType, ownerId: ownerId, slot: slot, name: file.name || 'document',
            mime: file.type || '', size: file.size, blobKey: stored.blobKey, inlineDataURL: !!stored.dataURL,
            dataURL: stored.dataURL || undefined, uploadedAt: nowIso(), uploadedBy: 'user',
            driveFileId: null, driveUrl: null, driveFolderId: null
          });
          logChange('upload', ownerType, ownerId, slot + ': ' + file.name + ' (' + formatBytes(file.size) + ')');
          if (ownerType === 'sku') addSkuEvent(ownerId, 'file', 'Added ' + slot + ' file ' + file.name);
        });
      });
    }, Promise.resolve()).then(function () { save(); }).catch(function (e) {
      save();
      alert(e && e.message ? e.message : 'Could not store the file.');
    });
  }

  function openDoc(ref) {
    openStoredFile({ id: ref.id, name: ref.name, dataKey: ref.blobKey, dataURL: ref.dataURL || null, url: ref.url || null });
  }

  function removeDoc(ref) {
    state.files = state.files.filter(function (f) { return f.id !== ref.id; });
    logChange('delete', ref.ownerType, ref.ownerId, 'Removed ' + ref.slot + ': ' + ref.name);
    if (ref.ownerType === 'sku' && getSku(ref.ownerId)) addSkuEvent(ref.ownerId, 'file', 'Removed ' + ref.slot + ' file ' + ref.name);
    save();
    // IndexedDB only. Drive files are never deleted from here.
    if (ref.blobKey) return idbDelete(ref.blobKey).catch(function () {});
    return Promise.resolve();
  }

  function docSlotsHtml(ownerType, ownerId, slots) {
    var html = '<div class="doc-slots">';
    slots.forEach(function (slot) {
      var docs = docsFor(ownerType, ownerId, slot.id);
      html += '<div class="doc-slot" data-slot="' + slot.id + '"><div class="doc-slot-head"><strong>' + escapeHtml(slot.label) + '</strong>' +
        '<span class="rail-count' + (docs.length ? '' : ' zero') + '">' + docs.length + '</span>' +
        '<button type="button" class="ghost doc-upload">Upload</button><input type="file" class="doc-input" multiple /></div>';
      if (!docs.length) html += '<div class="file-empty">None yet.</div>';
      else {
        html += '<ul class="file-list">';
        docs.forEach(function (d) {
          html += '<li><button type="button" class="file-name" data-doc="' + escapeHtml(d.id) + '">' + escapeHtml(d.name) + '</button>' +
            '<span class="file-meta">' + escapeHtml(formatBytes(d.size)) + ' · ' + escapeHtml(new Date(d.uploadedAt).toLocaleDateString()) + '</span>' +
            '<button type="button" class="file-remove" data-remove-doc="' + escapeHtml(d.id) + '">Remove</button></li>';
        });
        html += '</ul>';
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function bindDocSlots(root, ownerType, ownerId, rerender) {
    root.querySelectorAll('.doc-slot').forEach(function (el) {
      var slot = el.getAttribute('data-slot');
      var input = el.querySelector('.doc-input');
      el.querySelector('.doc-upload').addEventListener('click', function () { input.click(); });
      input.addEventListener('change', function () {
        var list = input.files;
        uploadDocs(ownerType, ownerId, slot, list).then(rerender);
        input.value = '';
      });
    });
    root.querySelectorAll('[data-doc]').forEach(function (b) {
      b.addEventListener('click', function () { var r = getFileRef(b.getAttribute('data-doc')); if (r) openDoc(r); });
    });
    root.querySelectorAll('[data-remove-doc]').forEach(function (b) {
      b.addEventListener('click', function () {
        var r = getFileRef(b.getAttribute('data-remove-doc'));
        if (!r || !confirm('Remove ' + r.name + '?')) return;
        removeDoc(r).then(rerender);
      });
    });
  }

  // ---------------------------------------------------------------------
  // Page: tabs Materials | Vendors | Quotes, plus material and vendor detail
  // ---------------------------------------------------------------------

  function renderMaterials() {
    var root = document.getElementById('materials-root');
    if (!root) return;
    materialTypes();
    if (materialsNav.materialId && getMaterial(materialsNav.materialId)) return renderMaterialDetail(root, getMaterial(materialsNav.materialId));
    materialsNav.materialId = null;
    if (materialsNav.vendorId && getVendor(materialsNav.vendorId)) return renderVendorDetail(root, getVendor(materialsNav.vendorId));
    materialsNav.vendorId = null;
    var tab = materialsNav.tab || 'materials';
    var html = '<div class="kpi-head"><h2>Materials and Vendors</h2>' +
      '<button type="button" id="mv-add-quote">Add vendor quote</button></div>';
    html += '<div class="tasks-tabs" role="tablist">';
    [['materials', 'Materials', (state.materials || []).length], ['vendors', 'Vendors', (state.vendors || []).length],
      ['quotes', 'Vendor quotes', (state.vendorQuotes || []).length]].forEach(function (t) {
      html += '<button type="button" class="tasks-tab' + (tab === t[0] ? ' active' : '') + '" data-mv-tab="' + t[0] + '">' + t[1] +
        ' <span class="rail-count' + (t[2] ? '' : ' zero') + '">' + t[2] + '</span></button>';
    });
    html += '</div>';
    if (tab === 'vendors') html += vendorsListHtml();
    else if (tab === 'quotes') html += quotesTableHtml(state.vendorQuotes || [], { filters: true });
    else html += materialsListHtml();
    root.innerHTML = html;

    root.querySelectorAll('[data-mv-tab]').forEach(function (b) {
      b.addEventListener('click', function () { setActiveMaterials({ tab: b.getAttribute('data-mv-tab') }); });
    });
    document.getElementById('mv-add-quote').addEventListener('click', function () { openQuoteModal({}); });
    bindListControls(root);
  }

  function materialsListHtml() {
    var q = (materialsNav.search || '').trim().toLowerCase();
    var list = (state.materials || []).filter(function (m) {
      if (materialsNav.typeFilter !== 'all' && m.type !== materialsNav.typeFilter) return false;
      if (!q) return true;
      return [m.name, m.type, m.manufacturer, m.grade, m.notes].join(' ').toLowerCase().indexOf(q) !== -1;
    });
    var html = listToolbarHtml('Search materials, grades, manufacturers', 'New material', 'mv-new-material', true);
    if (!(state.materials || []).length) {
      return html + '<div class="comms-stub">No materials yet. Add a material, then attach its data sheets and log vendor quotes against it.</div>';
    }
    var byType = {};
    list.forEach(function (m) { (byType[m.type || 'Other'] = byType[m.type || 'Other'] || []).push(m); });
    var types = materialTypes().filter(function (t) { return byType[t]; })
      .concat(Object.keys(byType).filter(function (t) { return materialTypes().indexOf(t) === -1; }));
    if (!types.length) html += '<p class="task-empty">No materials match.</p>';
    types.forEach(function (t) {
      var items = byType[t].slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
      html += '<details class="kpi-section kpi-details mv-group" open><summary><h3>' + escapeHtml(t) + ' <span class="rail-count">' + items.length + '</span></h3></summary>';
      html += '<div class="table-wrap"><table class="kpi-table mv-table"><thead><tr><th>Material</th><th>Manufacturer / grade</th><th>Durometer</th>' +
        '<th class="num">Best current price</th><th>From</th><th class="num">Quotes</th><th class="num">Docs</th></tr></thead><tbody>';
      items.forEach(function (m) {
        var best = bestCurrentQuote(m.id);
        var bp = best ? comparablePrice(best) : null;
        var v = best ? getVendor(best.vendorId) : null;
        var tds = docsFor('material', m.id).length;
        html += '<tr class="pv-row" data-material="' + escapeHtml(m.id) + '"><td><strong>' + escapeHtml(m.name) + '</strong></td>' +
          '<td>' + escapeHtml([m.manufacturer, m.grade].filter(Boolean).join(' / ')) + '</td>' +
          '<td>' + escapeHtml(m.durometer || '') + '</td>' +
          '<td class="num">' + (bp ? formatUnitPrice(bp.value, bp.unit, best.currency) : '<span class="muted-note">no current quote</span>') + '</td>' +
          '<td>' + escapeHtml(v ? v.name : '') + '</td>' +
          '<td class="num">' + quotesForMaterial(m.id).length + '</td>' +
          '<td class="num">' + (tds ? tds : '<span class="warn-note" title="No data sheet on file">0</span>') + '</td></tr>';
      });
      html += '</tbody></table></div></details>';
    });
    return html;
  }

  function vendorsListHtml() {
    var q = (materialsNav.search || '').trim().toLowerCase();
    var list = (state.vendors || []).filter(function (v) {
      if (!q) return true;
      return [v.name, v.website, v.notes].join(' ').toLowerCase().indexOf(q) !== -1;
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    var html = listToolbarHtml('Search vendors', 'New vendor', 'mv-new-vendor', false);
    if (!(state.vendors || []).length) return html + '<div class="comms-stub">No vendors yet. Add one here or while logging a quote.</div>';
    html += '<div class="table-wrap"><table class="kpi-table mv-table"><thead><tr><th>Vendor</th><th>Primary contact</th><th>Material types</th>' +
      '<th class="num">Current quotes</th><th>Last quote</th><th>Terms</th></tr></thead><tbody>';
    list.forEach(function (v) {
      var qs = quotesForVendor(v.id);
      var cur = qs.filter(function (x) { return quoteStatus(x) === 'current'; }).length;
      var types = {};
      qs.forEach(function (x) { var m = getMaterial(x.materialId); if (m) types[m.type] = true; });
      var last = qs.map(function (x) { return x.quoteDate || ''; }).sort().pop();
      var prim = contactsForCustomer(v.id).find(function (c) { return c.isPrimary; });
      html += '<tr class="pv-row" data-vendor="' + escapeHtml(v.id) + '"><td><strong>' + escapeHtml(v.name) + '</strong></td>' +
        '<td>' + escapeHtml(prim ? prim.name : '') + '</td><td>' + escapeHtml(Object.keys(types).join(', ')) + '</td>' +
        '<td class="num">' + cur + '</td><td>' + escapeHtml(last || '') + '</td><td>' + escapeHtml(v.terms || '') + '</td></tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function listToolbarHtml(placeholder, addLabel, addId, withType) {
    var html = '<div class="customers-bar">';
    html += '<input type="search" id="mv-search" aria-label="Search" placeholder="' + escapeHtml(placeholder) + '" value="' + escapeHtml(materialsNav.search || '') + '" />';
    if (withType) {
      html += '<select id="mv-type-filter" aria-label="Material type"><option value="all">All types</option>';
      materialTypes().forEach(function (t) {
        html += '<option value="' + escapeHtml(t) + '"' + (materialsNav.typeFilter === t ? ' selected' : '') + '>' + escapeHtml(t) + '</option>';
      });
      html += '</select>';
    }
    html += '<button type="button" id="' + addId + '">' + escapeHtml(addLabel) + '</button></div>';
    return html;
  }

  // Quotes table used on the Quotes tab, material detail and vendor detail.
  function quotesTableHtml(quotes, opts) {
    opts = opts || {};
    var html = '';
    var list = quotes.slice();
    if (opts.filters) {
      html += '<div class="customers-bar"><select id="mv-type-filter" aria-label="Material type"><option value="all">All material types</option>';
      materialTypes().forEach(function (t) {
        html += '<option value="' + escapeHtml(t) + '"' + (materialsNav.typeFilter === t ? ' selected' : '') + '>' + escapeHtml(t) + '</option>';
      });
      html += '</select><label class="check-line"><input type="checkbox" id="mv-show-expired"' + (materialsNav.showExpired ? ' checked' : '') +
        ' /> Show expired and superseded</label></div>';
      list = list.filter(function (q) {
        var m = getMaterial(q.materialId);
        if (materialsNav.typeFilter !== 'all' && (!m || m.type !== materialsNav.typeFilter)) return false;
        return materialsNav.showExpired || quoteStatus(q) === 'current';
      });
    }
    if (!list.length) return html + '<div class="file-empty">No vendor quotes' + (opts.filters && !materialsNav.showExpired ? ' (current)' : '') + '.</div>';
    // Best current per material gets a badge.
    var bestIds = {};
    list.forEach(function (q) { var b = bestCurrentQuote(q.materialId); if (b) bestIds[b.id] = true; });
    list.sort(function (a, b) {
      var ma = getMaterial(a.materialId), mb = getMaterial(b.materialId);
      var n = (ma ? ma.name : '').localeCompare(mb ? mb.name : '');
      return n || (comparablePrice(a).value - comparablePrice(b).value);
    });
    html += '<div class="table-wrap"><table class="kpi-table mv-table"><thead><tr>' +
      (opts.hideMaterial ? '' : '<th>Material</th>') + (opts.hideVendor ? '' : '<th>Vendor</th>') +
      '<th class="num">Price</th><th class="num">Per kg</th><th class="num">MOQ</th><th class="num">Lead time</th>' +
      '<th>Quoted</th><th>Valid until</th><th>Status</th><th>File</th><th></th></tr></thead><tbody>';
    list.forEach(function (q) {
      var m = getMaterial(q.materialId), v = getVendor(q.vendorId), st = quoteStatus(q);
      var perKg = pricePerKg(q);
      var file = docsFor('vendorQuote', q.id)[0];
      html += '<tr class="quote-row status-' + st + '" data-quote="' + escapeHtml(q.id) + '">' +
        (opts.hideMaterial ? '' : '<td><button type="button" class="link-btn" data-go-material="' + escapeHtml(q.materialId) + '">' + escapeHtml(m ? m.name : '(missing)') + '</button></td>') +
        (opts.hideVendor ? '' : '<td><button type="button" class="link-btn" data-go-vendor="' + escapeHtml(q.vendorId) + '">' + escapeHtml(v ? v.name : '(missing)') + '</button></td>') +
        '<td class="num">' + formatUnitPrice(Number(q.price) || 0, q.unit, q.currency) +
        ((q.breaks || []).length ? '<div class="muted-note">' + q.breaks.map(function (b) { return b.qty + '+ @ ' + formatUnitPrice(b.price, '', q.currency); }).join(', ') + '</div>' : '') + '</td>' +
        '<td class="num">' + (perKg != null ? formatUnitPrice(perKg, 'kg', q.currency) : '') + '</td>' +
        '<td class="num">' + escapeHtml(q.moq ? q.moq + ' ' + (q.unit || '') : '') + '</td>' +
        '<td class="num">' + escapeHtml(q.leadTimeDays ? q.leadTimeDays + 'd' : '') + '</td>' +
        '<td>' + escapeHtml(q.quoteDate || '') + '</td><td>' + escapeHtml(q.validUntil || '') + '</td>' +
        '<td>' + (bestIds[q.id] ? '<span class="badge badge-best">Best</span>' : '') + '<span class="badge quote-status ' + st + '">' + st + '</span></td>' +
        '<td>' + (file ? '<button type="button" class="link-btn" data-doc="' + escapeHtml(file.id) + '">' + escapeHtml(file.name) + '</button>' : '') + '</td>' +
        '<td><button type="button" class="ghost" data-edit-quote="' + escapeHtml(q.id) + '">Edit</button></td></tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function bindListControls(root) {
    var search = root.querySelector('#mv-search');
    if (search) search.addEventListener('input', function () {
      var pos = search.selectionStart;
      materialsNav.search = search.value;
      renderMaterials();
      var again = document.getElementById('mv-search');
      if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (e) { /* ignore */ } }
    });
    var tf = root.querySelector('#mv-type-filter');
    if (tf) tf.addEventListener('change', function () { materialsNav.typeFilter = tf.value; renderMaterials(); });
    var ex = root.querySelector('#mv-show-expired');
    if (ex) ex.addEventListener('change', function () { materialsNav.showExpired = ex.checked; renderMaterials(); });
    root.querySelectorAll('[data-material]').forEach(function (tr) {
      tr.addEventListener('click', function () { setActiveMaterials({ materialId: tr.getAttribute('data-material'), vendorId: null }); });
    });
    root.querySelectorAll('[data-vendor]').forEach(function (tr) {
      tr.addEventListener('click', function () { setActiveMaterials({ vendorId: tr.getAttribute('data-vendor'), materialId: null }); });
    });
    bindQuoteRowControls(root);
    var nm = root.querySelector('#mv-new-material');
    if (nm) nm.addEventListener('click', function () {
      var m = createMaterial({ name: 'New material', type: materialsNav.typeFilter !== 'all' ? materialsNav.typeFilter : materialTypes()[0] });
      setActiveMaterials({ materialId: m.id, vendorId: null });
    });
    var nv = root.querySelector('#mv-new-vendor');
    if (nv) nv.addEventListener('click', function () {
      var name = prompt('Vendor name:');
      if (!name || !name.trim()) return;
      var v = createVendor(name.trim());
      setActiveMaterials({ vendorId: v.id, materialId: null });
    });
  }

  function bindQuoteRowControls(root) {
    root.querySelectorAll('[data-go-material]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); setActiveMaterials({ materialId: b.getAttribute('data-go-material'), vendorId: null }); });
    });
    root.querySelectorAll('[data-go-vendor]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); setActiveMaterials({ vendorId: b.getAttribute('data-go-vendor'), materialId: null }); });
    });
    root.querySelectorAll('.quote-row [data-doc]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); var r = getFileRef(b.getAttribute('data-doc')); if (r) openDoc(r); });
    });
    root.querySelectorAll('[data-edit-quote]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); openQuoteModal({ quoteId: b.getAttribute('data-edit-quote') }); });
    });
  }

  function createMaterial(fields) {
    var m = Object.assign({
      id: StuffMigrate.makeId('mtl'), name: 'New material', type: 'Other', manufacturer: '', grade: '',
      durometer: '', color: '', cureSystem: '', specificGravity: '', shelfLifeMonths: '', storage: '',
      preferredVendorId: null, notes: '', createdAt: nowIso(), updatedAt: nowIso()
    }, fields || {});
    state.materials.push(m);
    logChange('create', 'material', m.id, 'Created ' + m.name);
    save();
    return m;
  }

  function createVendor(name) {
    var v = {
      id: StuffMigrate.makeId('ven'), name: name, website: '', phone: '', address: '', terms: '',
      accountNumberNote: '', shipsFrom: '', notes: '', createdAt: nowIso(), updatedAt: nowIso()
    };
    state.vendors.push(v);
    logChange('create', 'vendor', v.id, 'Created ' + v.name);
    save();
    return v;
  }

  function renderMaterialDetail(root, m) {
    var html = '<div class="detail-bar"><button type="button" class="ghost" id="mt-back">Back to materials</button>' +
      '<h2>Material: ' + escapeHtml(m.name) + '</h2><button type="button" id="mt-add-quote">Add vendor quote</button></div>';
    html += '<form id="material-form">';
    html += '<div class="row"><div class="field"><label for="mt-name">Name</label><input type="text" id="mt-name" required /></div>' +
      '<div class="field"><label for="mt-type">Type</label><select id="mt-type"></select></div></div>';
    html += '<div class="row"><div class="field"><label for="mt-mfr">Manufacturer</label><input type="text" id="mt-mfr" placeholder="e.g. Shin-Etsu, Wacker, Dow" /></div>' +
      '<div class="field"><label for="mt-grade">Grade / product code</label><input type="text" id="mt-grade" /></div>' +
      '<div class="field"><label for="mt-duro">Durometer</label><input type="text" id="mt-duro" placeholder="e.g. 40A" /></div></div>';
    html += '<div class="row"><div class="field"><label for="mt-color">Color</label><input type="text" id="mt-color" /></div>' +
      '<div class="field"><label for="mt-cure">Cure system</label><input type="text" id="mt-cure" placeholder="platinum, peroxide, n/a" /></div>' +
      '<div class="field"><label for="mt-sg">Specific gravity</label><input type="text" id="mt-sg" /></div></div>';
    html += '<div class="row"><div class="field"><label for="mt-shelf">Shelf life (months)</label><input type="text" id="mt-shelf" /></div>' +
      '<div class="field"><label for="mt-storage">Storage</label><input type="text" id="mt-storage" placeholder="temperature, humidity" /></div>' +
      '<div class="field"><label for="mt-pref">Preferred vendor</label><select id="mt-pref"></select></div></div>';
    html += '<div class="field"><label for="mt-notes">Notes</label><textarea id="mt-notes" rows="3" placeholder="Processing notes, approvals, where it is used"></textarea></div>';
    html += '<div class="detail-actions">' + (isAdmin() ? '<button type="button" class="danger" id="mt-delete">Delete material</button>' : '<span class="muted-note">Delete is Admin only</span>') +
      '<span class="spacer"></span><button type="submit">Save material</button></div></form>';
    html += '<div class="section-title">Vendor quotes</div>' + quotesTableHtml(quotesForMaterial(m.id), { hideMaterial: true });
    html += '<div class="section-title">Data sheets and documents</div>' + docSlotsHtml('material', m.id, MATERIAL_DOC_SLOTS);
    html += '<p class="muted-note">Documents are stored in this browser until Drive upload is connected. Export does not include file contents.</p>';
    root.innerHTML = html;

    var sel = document.getElementById('mt-type');
    var types = materialTypes().slice();
    if (m.type && types.indexOf(m.type) === -1) types.push(m.type);
    sel.innerHTML = types.map(function (t) { return '<option' + (t === m.type ? ' selected' : '') + '>' + escapeHtml(t) + '</option>'; }).join('') +
      '<option value="__new__">+ Add a type...</option>';
    sel.addEventListener('change', function () {
      if (sel.value !== '__new__') return;
      var t = prompt('New material type:');
      if (t && t.trim()) {
        if (materialTypes().indexOf(t.trim()) === -1) state.settings.materialTypes.push(t.trim());
        var o = document.createElement('option'); o.textContent = t.trim(); sel.insertBefore(o, sel.lastChild); sel.value = t.trim();
      } else sel.value = m.type;
    });
    var pref = document.getElementById('mt-pref');
    pref.innerHTML = '<option value="">(none)</option>' + (state.vendors || []).slice().sort(function (a, b) { return a.name.localeCompare(b.name); })
      .map(function (v) { return '<option value="' + escapeHtml(v.id) + '"' + (m.preferredVendorId === v.id ? ' selected' : '') + '>' + escapeHtml(v.name) + '</option>'; }).join('');
    [['mt-name', 'name'], ['mt-mfr', 'manufacturer'], ['mt-grade', 'grade'], ['mt-duro', 'durometer'], ['mt-color', 'color'],
      ['mt-cure', 'cureSystem'], ['mt-sg', 'specificGravity'], ['mt-shelf', 'shelfLifeMonths'], ['mt-storage', 'storage'], ['mt-notes', 'notes']].forEach(function (pair) {
      document.getElementById(pair[0]).value = m[pair[1]] || '';
    });
    var rerender = function () { renderMaterials(); renderLeftRail(); };
    document.getElementById('mt-back').addEventListener('click', function () { setActiveMaterials({ materialId: null, tab: 'materials' }); });
    document.getElementById('mt-add-quote').addEventListener('click', function () { openQuoteModal({ materialId: m.id }); });
    document.getElementById('material-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('mt-name').value.trim();
      if (!name) { alert('Name is required.'); return; }
      m.name = name;
      m.type = sel.value === '__new__' ? m.type : sel.value;
      [['mt-mfr', 'manufacturer'], ['mt-grade', 'grade'], ['mt-duro', 'durometer'], ['mt-color', 'color'], ['mt-cure', 'cureSystem'],
        ['mt-sg', 'specificGravity'], ['mt-shelf', 'shelfLifeMonths'], ['mt-storage', 'storage'], ['mt-notes', 'notes']].forEach(function (pair) {
        m[pair[1]] = document.getElementById(pair[0]).value.trim();
      });
      m.preferredVendorId = pref.value || null;
      m.updatedAt = nowIso();
      logChange('update', 'material', m.id, 'Saved ' + m.name);
      save();
      rerender();
    });
    var del = document.getElementById('mt-delete');
    if (del) del.addEventListener('click', function () {
      if (!requireAdmin('delete a material')) return;
      if (quotesForMaterial(m.id).length) { alert('This material has vendor quotes. Delete those first.'); return; }
      if (!confirm('Delete ' + m.name + ' and its documents?')) return;
      takeSnapshot('before-delete-material');
      docsFor('material', m.id).reduce(function (p, r) { return p.then(function () { return removeDoc(r); }); }, Promise.resolve()).then(function () {
        state.materials = state.materials.filter(function (x) { return x.id !== m.id; });
        logChange('delete', 'material', m.id, 'Deleted ' + m.name);
        save();
        setActiveMaterials({ materialId: null });
      });
    });
    bindQuoteRowControls(root);
    bindDocSlots(root, 'material', m.id, rerender);
  }

  function renderVendorDetail(root, v) {
    var html = '<div class="detail-bar"><button type="button" class="ghost" id="vd-back">Back to vendors</button>' +
      '<h2>Vendor: ' + escapeHtml(v.name) + '</h2><button type="button" id="vd-add-quote">Add quote from this vendor</button></div>';
    html += '<form id="vendor-form">';
    html += '<div class="row"><div class="field"><label for="vd-name">Name</label><input type="text" id="vd-name" required /></div>' +
      '<div class="field"><label for="vd-web">Website</label><input type="text" id="vd-web" /></div>' +
      '<div class="field"><label for="vd-phone">Main phone</label><input type="tel" id="vd-phone" /></div></div>';
    html += '<div class="row"><div class="field"><label for="vd-terms">Payment terms</label><input type="text" id="vd-terms" placeholder="Net 30, prepay" /></div>' +
      '<div class="field"><label for="vd-ships">Ships from</label><input type="text" id="vd-ships" /></div>' +
      '<div class="field"><label for="vd-acct">Our account #</label><input type="text" id="vd-acct" /></div></div>';
    html += '<div class="field"><label for="vd-addr">Address</label><textarea id="vd-addr" rows="2"></textarea></div>';
    html += '<div class="field"><label for="vd-notes">Notes</label><textarea id="vd-notes" rows="2"></textarea></div>';
    html += '<div class="detail-actions">' + (isAdmin() ? '<button type="button" class="danger" id="vd-delete">Delete vendor</button>' : '<span class="muted-note">Delete is Admin only</span>') +
      '<span class="spacer"></span><button type="submit">Save vendor</button></div></form>';
    html += '<div class="section-title">Contacts</div><div id="vd-contacts-root"></div>';
    html += '<div class="section-title">Quotes from ' + escapeHtml(v.name) + '</div>' + quotesTableHtml(quotesForVendor(v.id), { hideVendor: true });
    html += '<div class="section-title">Documents</div>' + docSlotsHtml('vendor', v.id, VENDOR_DOC_SLOTS);
    root.innerHTML = html;
    [['vd-name', 'name'], ['vd-web', 'website'], ['vd-phone', 'phone'], ['vd-terms', 'terms'], ['vd-ships', 'shipsFrom'],
      ['vd-acct', 'accountNumberNote'], ['vd-addr', 'address'], ['vd-notes', 'notes']].forEach(function (pair) {
      document.getElementById(pair[0]).value = v[pair[1]] || '';
    });
    var rerender = function () { renderMaterials(); };
    renderContactsSection(document.getElementById('vd-contacts-root'), { ownerType: 'customer', owner: v, onDone: rerender });
    document.getElementById('vd-back').addEventListener('click', function () { setActiveMaterials({ vendorId: null, tab: 'vendors' }); });
    document.getElementById('vd-add-quote').addEventListener('click', function () { openQuoteModal({ vendorId: v.id }); });
    document.getElementById('vendor-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('vd-name').value.trim();
      if (!name) { alert('Name is required.'); return; }
      v.name = name;
      [['vd-web', 'website'], ['vd-phone', 'phone'], ['vd-terms', 'terms'], ['vd-ships', 'shipsFrom'], ['vd-acct', 'accountNumberNote'],
        ['vd-addr', 'address'], ['vd-notes', 'notes']].forEach(function (pair) { v[pair[1]] = document.getElementById(pair[0]).value.trim(); });
      v.updatedAt = nowIso();
      logChange('update', 'vendor', v.id, 'Saved ' + v.name);
      save();
      rerender();
    });
    var del = document.getElementById('vd-delete');
    if (del) del.addEventListener('click', function () {
      if (!requireAdmin('delete a vendor')) return;
      if (quotesForVendor(v.id).length) { alert('This vendor has quotes. Delete those first.'); return; }
      if (!confirm('Delete vendor ' + v.name + '?')) return;
      takeSnapshot('before-delete-vendor');
      state.vendors = state.vendors.filter(function (x) { return x.id !== v.id; });
      state.contacts = state.contacts.filter(function (c) { return c.customerId !== v.id; });
      (state.materials || []).forEach(function (m) { if (m.preferredVendorId === v.id) m.preferredVendorId = null; });
      logChange('delete', 'vendor', v.id, 'Deleted ' + v.name);
      save();
      setActiveMaterials({ vendorId: null, tab: 'vendors' });
    });
    bindQuoteRowControls(root);
    bindDocSlots(root, 'vendor', v.id, rerender);
  }

  // ---------------------------------------------------------------------
  // Vendor quote modal
  // ---------------------------------------------------------------------

  var quoteModalCtx = null;

  function openQuoteModal(ctx) {
    quoteModalCtx = ctx || {};
    var q = ctx.quoteId ? getVendorQuote(ctx.quoteId) : null;
    document.getElementById('vq-title').textContent = q ? 'Edit vendor quote' : 'Add vendor quote';
    var vsel = document.getElementById('vq-vendor'), msel = document.getElementById('vq-material');
    vsel.innerHTML = '<option value="__new__">+ New vendor</option>' + (state.vendors || []).slice().sort(function (a, b) { return a.name.localeCompare(b.name); })
      .map(function (v) { return '<option value="' + escapeHtml(v.id) + '">' + escapeHtml(v.name) + '</option>'; }).join('');
    msel.innerHTML = '<option value="__new__">+ New material</option>' + (state.materials || []).slice().sort(function (a, b) { return (a.type + a.name).localeCompare(b.type + b.name); })
      .map(function (m) { return '<option value="' + escapeHtml(m.id) + '">' + escapeHtml(m.name + ' (' + m.type + ')') + '</option>'; }).join('');
    var vid = q ? q.vendorId : (ctx.vendorId || ((state.vendors || [])[0] ? null : '__new__'));
    var mid = q ? q.materialId : (ctx.materialId || null);
    vsel.value = vid && getVendor(vid) ? vid : (state.vendors.length ? vsel.options[1].value : '__new__');
    if (!q && !ctx.vendorId) vsel.value = state.vendors.length ? vsel.options[1].value : '__new__';
    msel.value = mid && getMaterial(mid) ? mid : (state.materials.length ? msel.options[1].value : '__new__');
    document.getElementById('vq-new-vendor').value = '';
    document.getElementById('vq-new-material').value = '';
    var ntype = document.getElementById('vq-new-material-type');
    ntype.innerHTML = materialTypes().map(function (t) { return '<option>' + escapeHtml(t) + '</option>'; }).join('');
    var unit = document.getElementById('vq-unit');
    unit.innerHTML = QUOTE_UNITS.map(function (u) { return '<option>' + u + '</option>'; }).join('');
    document.getElementById('vq-price').value = q ? q.price : '';
    unit.value = q ? (q.unit || 'kg') : 'kg';
    document.getElementById('vq-currency').value = q ? (q.currency || 'USD') : 'USD';
    document.getElementById('vq-moq').value = q ? (q.moq || '') : '';
    document.getElementById('vq-lead').value = q ? (q.leadTimeDays || '') : '';
    document.getElementById('vq-date').value = q ? (q.quoteDate || '') : todayStr();
    document.getElementById('vq-valid').value = q ? (q.validUntil || '') : '';
    document.getElementById('vq-ref').value = q ? (q.reference || '') : '';
    document.getElementById('vq-freight').value = q ? (q.freight || '') : '';
    document.getElementById('vq-breaks').value = q ? (q.breaks || []).map(function (b) { return b.qty + ' @ ' + b.price; }).join('\n') : '';
    document.getElementById('vq-notes').value = q ? (q.notes || '') : '';
    document.getElementById('vq-file').value = '';
    var existing = q ? docsFor('vendorQuote', q.id) : [];
    document.getElementById('vq-file-current').textContent = existing.length ? 'On file: ' + existing.map(function (f) { return f.name; }).join(', ') : '';
    document.getElementById('vq-delete').style.display = q && isAdmin() ? '' : 'none';
    function sync() {
      document.getElementById('vq-new-vendor-wrap').style.display = vsel.value === '__new__' ? '' : 'none';
      document.getElementById('vq-new-material-wrap').style.display = msel.value === '__new__' ? '' : 'none';
    }
    vsel.onchange = sync; msel.onchange = sync; sync();
    document.getElementById('quote-modal-backdrop').classList.add('open');
  }

  function closeQuoteModal() {
    document.getElementById('quote-modal-backdrop').classList.remove('open');
    quoteModalCtx = null;
  }

  function parseBreaks(text) {
    return String(text || '').split(/\n|;/).map(function (line) {
      var m = line.match(/([\d,.]+)\s*(?:\+|@|:|,|\s)\s*\$?\s*([\d,.]+)/);
      if (!m) return null;
      var qty = Number(m[1].replace(/,/g, '')), price = Number(m[2].replace(/,/g, ''));
      return qty && price ? { qty: qty, price: price } : null;
    }).filter(Boolean).sort(function (a, b) { return a.qty - b.qty; });
  }

  function saveQuoteFromModal() {
    var ctx = quoteModalCtx || {};
    var vsel = document.getElementById('vq-vendor').value, msel = document.getElementById('vq-material').value;
    var price = Number(document.getElementById('vq-price').value);
    if (!(price > 0)) { alert('Price is required.'); return; }
    var vendor = vsel === '__new__' ? null : getVendor(vsel);
    if (!vendor) {
      var vn = document.getElementById('vq-new-vendor').value.trim();
      if (!vn) { alert('Vendor name is required.'); return; }
      vendor = (state.vendors || []).find(function (x) { return x.name.toLowerCase() === vn.toLowerCase(); }) || createVendor(vn);
    }
    var material = msel === '__new__' ? null : getMaterial(msel);
    if (!material) {
      var mn = document.getElementById('vq-new-material').value.trim();
      if (!mn) { alert('Material name is required.'); return; }
      material = createMaterial({ name: mn, type: document.getElementById('vq-new-material-type').value });
    }
    var q = ctx.quoteId ? getVendorQuote(ctx.quoteId) : null;
    var isNew = !q;
    if (!q) { q = { id: StuffMigrate.makeId('vq'), createdAt: nowIso() }; state.vendorQuotes.push(q); }
    Object.assign(q, {
      vendorId: vendor.id, materialId: material.id, price: price,
      unit: document.getElementById('vq-unit').value, currency: document.getElementById('vq-currency').value.trim().toUpperCase() || 'USD',
      moq: document.getElementById('vq-moq').value.trim(), leadTimeDays: document.getElementById('vq-lead').value.trim(),
      quoteDate: document.getElementById('vq-date').value || todayStr(), validUntil: document.getElementById('vq-valid').value || '',
      reference: document.getElementById('vq-ref').value.trim(), freight: document.getElementById('vq-freight').value.trim(),
      breaks: parseBreaks(document.getElementById('vq-breaks').value), notes: document.getElementById('vq-notes').value.trim(),
      updatedAt: nowIso()
    });
    logChange(isNew ? 'create' : 'update', 'vendorQuote', q.id, vendor.name + ' / ' + material.name + ' ' + formatUnitPrice(price, q.unit, q.currency));
    var fileInput = document.getElementById('vq-file');
    var files = fileInput.files;
    save();
    closeQuoteModal();
    (files && files.length ? uploadDocs('vendorQuote', q.id, 'quote', files) : Promise.resolve()).then(function () {
      renderApp();
    });
  }

  function deleteQuoteFromModal() {
    var ctx = quoteModalCtx || {};
    var q = ctx.quoteId ? getVendorQuote(ctx.quoteId) : null;
    if (!q || !requireAdmin('delete a vendor quote')) return;
    if (!confirm('Delete this vendor quote?')) return;
    docsFor('vendorQuote', q.id).forEach(function (r) { removeDoc(r); });
    state.vendorQuotes = state.vendorQuotes.filter(function (x) { return x.id !== q.id; });
    logChange('delete', 'vendorQuote', q.id, 'Deleted quote');
    save();
    closeQuoteModal();
    renderApp();
  }

  document.getElementById('vq-cancel').addEventListener('click', closeQuoteModal);
  document.getElementById('vq-delete').addEventListener('click', deleteQuoteFromModal);
  document.getElementById('quote-form').addEventListener('submit', function (e) { e.preventDefault(); saveQuoteFromModal(); });
  document.getElementById('quote-modal-backdrop').addEventListener('click', function (e) {
    if (e.target === document.getElementById('quote-modal-backdrop')) closeQuoteModal();
  });


  // =====================================================================
  // Phase 3 step 1: SKUs, bill of materials, SKU timeline (Owner 2026-09-23)
  // A SKU lives under a Project (and its Customer). Its BOM lines point at
  // Materials and Vendors records. Every change writes to state.skuEvents,
  // an append-only timeline per SKU that later steps (customer POs, jobs,
  // vendor POs) also write to.
  // =====================================================================

  var SKU_STATUSES = [
    ['concept', 'Concept'], ['quoted', 'Quoted'], ['tooling', 'Tooling'], ['first_article', 'First article'],
    ['approved', 'Approved'], ['production', 'Production'], ['on_hold', 'On hold'], ['discontinued', 'Discontinued']
  ];
  var FA_STATUSES = [['pending', 'Pending'], ['submitted', 'Submitted'], ['approved', 'Approved'], ['rejected', 'Rejected']];
  var BOM_ROLES = ['primary', 'secondary', 'insert', 'pigment', 'additive', 'packaging', 'label', 'hardware'];
  var BOM_UNITS = ['g', 'kg', 'lb', 'oz', 'ml', 'L', 'ea'];
  var SKU_DOC_SLOTS = [
    { id: 'designs', label: 'Design files' },
    { id: 'cad', label: 'CAD files' },
    { id: 'packaging', label: 'Packaging files' },
    { id: 'renderings', label: 'Renderings and photos' }
  ];
  var SKU_TRACKED_FIELDS = [
    ['arrEstimated', 'ARR is our estimate'],
    ['code', 'Code'], ['name', 'Name'], ['size', 'Size'], ['style', 'Style'], ['color', 'Color'], ['colorSpec', 'Color spec'],
    ['durometer', 'Durometer'], ['status', 'Status'], ['revision', 'Revision'], ['drawingRev', 'Drawing rev'],
    ['moldId', 'Mold'], ['cavityCount', 'Cavities'], ['cycleTimeSec', 'Cycle time'], ['weightGrams', 'Part weight'],
    ['tolerances', 'Tolerances'], ['sellPrice', 'Sell price'], ['unitCostTarget', 'Target unit cost'], ['moq', 'MOQ'],
    ['leadTimeDays', 'Lead time'], ['overrunPct', 'Overrun %'],
    ['ids.upc', 'UPC'], ['ids.ean', 'EAN'], ['ids.gtin', 'GTIN'], ['ids.fnsku', 'FNSKU'], ['ids.asin', 'ASIN'], ['ids.sellerSku', 'Seller SKU'],
    ['firstArticle.status', 'First article'], ['packaging.type', 'Packaging'], ['packaging.casePack', 'Case pack'],
    ['material', 'Material'], ['stage', 'Stage'], ['moldsRequired', 'Molds required'], ['annualQty', 'Annual qty'], ['targetShipDate', 'Target ship date'],
    ['values.designDfm', 'Design/DFM'], ['values.prototyping', 'Prototyping'], ['values.tooling', 'Tooling/Molds'],
    ['values.partnerServices', 'Partner services'], ['values.productionArr', 'ARR']
  ];

  var activeSkuId = null;
  var skuEditorTab = 'job';
  // Unsaved bill-of-materials edits live here until Save, so the stored SKU never changes early.
  var skuDraft = null;

  function getSku(id) { return (state.skus || []).find(function (x) { return x.id === id; }); }
  function skusForProject(pid) { return (state.skus || []).filter(function (x) { return x.projectId === pid; }); }
  function skuStatusLabel(st) { var f = SKU_STATUSES.find(function (x) { return x[0] === st; }); return f ? f[1] : (st || ''); }
  function getPath(obj, path) { return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj); }

  function addSkuEvent(skuId, type, text, data) {
    if (!Array.isArray(state.skuEvents)) state.skuEvents = [];
    state.skuEvents.push({
      id: StuffMigrate.makeId('sev'), skuId: skuId, at: nowIso(), who: currentUserName(),
      type: type, text: text, data: data || null
    });
  }

  function skuEvents(skuId) {
    return (state.skuEvents || []).filter(function (e) { return e.skuId === skuId; })
      .sort(function (a, b) { return (b.at || '').localeCompare(a.at || ''); });
  }

  function abbrev(text, maxLen) {
    var words = String(text || '').replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return 'X';
    var out = words.length === 1 ? words[0].slice(0, maxLen) : words.map(function (w) { return w[0]; }).join('').slice(0, maxLen);
    return out.toUpperCase();
  }

  function skuCodeClash(sku, code) {
    return (state.skus || []).find(function (x) { return x.id !== sku.id && x.customerId === sku.customerId && x.code && x.code.toLowerCase() === String(code || '').toLowerCase(); });
  }

  // Next free code in the same series: DEMO-LID-001 gives DEMO-LID-002.
  function nextCodeAfter(src) {
    var m = String(src.code || '').match(/^(.*?)(\d+)$/);
    if (!m) return suggestCodeFor(src.customerId, src.name);
    var used = (state.skus || []).filter(function (x) { return x.customerId === src.customerId; }).map(function (x) { return x.code; });
    var n = Number(m[2]) + 1;
    while (used.indexOf(m[1] + String(n).padStart(m[2].length, '0')) !== -1) n += 1;
    return m[1] + String(n).padStart(m[2].length, '0');
  }

  function duplicateSku(src) {
    var copy = JSON.parse(JSON.stringify(src));
    delete copy.id; delete copy.createdAt; delete copy.updatedAt;
    copy.code = nextCodeAfter(src);
    copy.ids = { upc: '', ean: '', gtin: '', fnsku: '', asin: '', sellerSku: '', other: [] };
    copy.firstArticle = { status: 'pending', date: '', approvedBy: '', notes: '' };
    copy.status = 'concept';
    copy.bom = (copy.bom || []).map(function (l) { return Object.assign({}, l, { id: StuffMigrate.makeId('bom') }); });
    copy.name = (src.name || src.code) + ' (copy)';
    // A duplicate is a new job: no money, quote link or archive state carried over.
    copy.values = StuffMigrate.blankSku({}).values;
    copy.source = null; copy.prefilled = {}; copy.quoteMissing = []; copy.legacyProjectId = null;
    copy.archived = false; copy.archivedAt = null;
    var t = nowIso();
    var sku = StuffMigrate.blankSku(Object.assign(copy, { createdAt: t, updatedAt: t }));
    state.skus.push(sku);
    logChange('create', 'sku', sku.id, sku.code + ' duplicated from ' + src.code);
    addSkuEvent(sku.id, 'created', 'Duplicated from ' + src.code + ' (specs and bill of materials copied; codes, marketplace IDs, files and first article reset)');
    addSkuEvent(src.id, 'note', 'Duplicated to ' + sku.code);
    return sku;
  }

  // ---------------------------------------------------------------------
  // Bill of materials math
  // ---------------------------------------------------------------------

  function toKg(qty, unit, material) {
    var q = Number(qty) || 0;
    if (!q) return 0;
    var sg = material && Number(material.specificGravity) > 0 ? Number(material.specificGravity) : null;
    switch (unit) {
      case 'g': return q / 1000;
      case 'kg': return q;
      case 'lb': return q / LB_PER_KG;
      case 'oz': return q / 35.274;
      case 'ml': return sg ? (q / 1000) * sg : null;
      case 'L': return sg ? q * sg : null;
      default: return null;
    }
  }

  // Estimated cost of one BOM line per finished part, from the Best current quote.
  function bomLineCost(line) {
    var m = getMaterial(line.materialId);
    if (!m) return { cost: null, why: 'Pick a material' };
    var best = bestCurrentQuote(m.id);
    if (!best) return { cost: null, why: 'No current quote' };
    var scrap = 1 + (Number(line.scrapPct) || 0) / 100;
    var perKg = pricePerKg(best);
    var kg = toKg(line.qtyPerPart, line.unit, m);
    if (perKg != null && kg != null) return { cost: kg * perKg * scrap, quote: best };
    if (best.unit === line.unit) return { cost: (Number(line.qtyPerPart) || 0) * Number(best.price) * scrap, quote: best };
    if ((line.unit === 'ml' || line.unit === 'L') && perKg != null) return { cost: null, why: 'Add specific gravity to the material' };
    return { cost: null, why: 'Quote is per ' + best.unit + ', line is per ' + line.unit };
  }

  function bomCostPerPart(sku) {
    var total = 0, complete = true;
    (sku.bom || []).forEach(function (l) {
      var c = bomLineCost(l);
      if (c.cost == null) complete = false; else total += c.cost;
    });
    return { total: total, complete: complete && (sku.bom || []).length > 0 };
  }

  // ---------------------------------------------------------------------
  // SKU table on Project detail
  // ---------------------------------------------------------------------

  function renderProjectSkus(root, project) {
    if (!root) return;
    var list = skusForProject(project.id).slice().sort(function (a, b) { return (a.code || '').localeCompare(b.code || ''); });
    var html = '';
    if (!list.length) {
      html += '<div class="contacts-empty">No SKUs.</div>';
    } else {
      html += '<div class="table-wrap"><table class="kpi-table sku-table"><thead><tr><th>Code</th><th>Name</th><th>Size</th><th>Style</th><th>Color</th>' +
        '<th>Status</th><th>Rev</th><th>ASIN</th><th>FNSKU</th><th>Mold</th><th class="num">MOQ</th><th class="num">Material / part</th><th>Now</th></tr></thead><tbody>';
      list.forEach(function (x) {
        var c = bomCostPerPart(x);
        html += '<tr class="pv-row" data-sku="' + escapeHtml(x.id) + '"><td><strong>' + escapeHtml(x.code) + '</strong></td>' +
          '<td>' + escapeHtml(x.name || '') + '</td><td>' + escapeHtml(x.size || '') + '</td><td>' + escapeHtml(x.style || '') + '</td>' +
          '<td>' + escapeHtml(x.color || '') + '</td><td><span class="badge sku-status ' + escapeHtml(x.status) + '">' + escapeHtml(skuStatusLabel(x.status)) + '</span></td>' +
          '<td>' + escapeHtml(x.revision || '') + '</td><td>' + escapeHtml(x.ids.asin || '') + '</td><td>' + escapeHtml(x.ids.fnsku || '') + '</td>' +
          '<td>' + escapeHtml(x.moldId || '') + '</td><td class="num">' + escapeHtml(x.moq || '') + '</td>' +
          '<td class="num">' + ((x.bom || []).length ? formatUnitPrice(c.total, '', 'USD') + (c.complete ? '' : '<span class="muted-note" title="Some lines have no priced quote"> *</span>') : '') + '</td>' +
          '<td>' + escapeHtml(skuPlaceText(x)) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    var events = (state.skuEvents || []).filter(function (e) { return list.some(function (x) { return x.id === e.skuId; }); })
      .sort(function (a, b) { return (b.at || '').localeCompare(a.at || ''); });
    if (events.length) {
      html += '<details class="kpi-details sku-rollup"><summary><h3>SKU activity (' + events.length + ')</h3></summary>' + timelineHtml(events.slice(0, 60), true) + '</details>';
    }
    root.innerHTML = html;
    root.querySelectorAll('tr[data-sku]').forEach(function (tr) {
      tr.addEventListener('click', function () { openDetail(tr.getAttribute('data-sku')); });
    });
  }

  function closeSku() {
    activeSkuId = null;
    skuDraft = null;
    renderDetail();
  }

  function timelineHtml(events, withSku) {
    if (!events.length) return '<div class="file-empty">No activity yet.</div>';
    var html = '<ol class="timeline">';
    events.forEach(function (e) {
      var sku = withSku ? getSku(e.skuId) : null;
      html += '<li class="tl-' + escapeHtml(e.type) + '"><div class="tl-when">' + escapeHtml(new Date(e.at).toLocaleString()) + '</div>' +
        '<div class="tl-body">' + (sku ? '<strong>' + escapeHtml(sku.code) + '</strong> ' : '') +
        '<span class="badge tl-type">' + escapeHtml(e.type.replace(/_/g, ' ')) + '</span> ' + escapeHtml(e.text) +
        '<span class="muted-note"> by ' + escapeHtml(e.who || '') + '</span></div></li>';
    });
    html += '</ol>';
    return html;
  }

  // ---------------------------------------------------------------------
  // SKU editor (inside the slide-in drawer, over its project)
  // ---------------------------------------------------------------------

  // SKU editor in the slide-in drawer (#3: a SKU stands on its own under its customer).
  function renderSkuEditor(root, sku) {
    StuffMigrate.ensureSkuJobFields(sku);
    if (!skuDraft || skuDraft.id !== sku.id) skuDraft = { id: sku.id, bom: JSON.parse(JSON.stringify(sku.bom || [])) };
    var draft = skuDraft;
    var cust = getCustomer(sku.customerId);
    var poCount = StuffMigrate.poLinesForSku(state, sku.id).length;
    var tabs = [['job', 'Job and value'], ['identity', 'Identity'], ['pos', 'Customer POs'], ['commerce', 'Marketplace IDs'], ['specs', 'Specs and packaging'],
      ['bom', 'Bill of materials'], ['files', 'Files'], ['timeline', 'Timeline']];
    var html = '<div class="detail-bar"><button type="button" class="ghost drawer-close" id="sk-back" aria-label="Close">Close</button>' +
      '<h2 class="crumbs">' + (cust ? '<button type="button" class="link-btn" id="sk-cust">' + escapeHtml(cust.name) + '</button> <span class="crumb-sep">/</span> ' : '') +
      escapeHtml(sku.code || 'SKU') + (sku.name ? ' <span class="muted-note">' + escapeHtml(sku.name) + '</span>' : '') + '</h2></div>';
    if (sku.archived) html += '<p class="board-note visible">Archived' + (sku.archivedAt ? ' on ' + escapeHtml(new Date(sku.archivedAt).toLocaleDateString()) : '') + '. It is off the boards and kept with its POs and history.</p>';
    html += cardFaceHtml(StuffMigrate.cardFace(state, sku, 'sku'), sku);
    html += '<div class="tasks-tabs sku-tabs" role="tablist">';
    tabs.forEach(function (t) {
      var n = t[0] === 'bom' ? draft.bom.length : t[0] === 'files' ? docsFor('sku', sku.id).length : t[0] === 'timeline' ? skuEvents(sku.id).length : t[0] === 'pos' ? poCount : null;
      html += '<button type="button" class="tasks-tab' + (skuEditorTab === t[0] ? ' active' : '') + '" data-sku-tab="' + t[0] + '">' + t[1] +
        (n != null ? ' <span class="rail-count' + (n ? '' : ' zero') + '">' + n + '</span>' : '') + '</button>';
    });
    html += '</div>';
    html += '<form id="sku-form">';

    function pane(id, inner) { return '<div class="sku-pane" data-pane="' + id + '"' + (skuEditorTab === id ? '' : ' hidden') + '>' + inner + '</div>'; }
    function field(id, label, value, opts) {
      opts = opts || {};
      var input = opts.textarea
        ? '<textarea id="' + id + '" rows="' + (opts.rows || 2) + '">' + escapeHtml(value == null ? '' : value) + '</textarea>'
        : '<input type="' + (opts.type || 'text') + '" id="' + id + '"' + (opts.step ? ' step="' + opts.step + '" min="0"' : '') +
          ' value="' + escapeHtml(value == null ? '' : value) + '"' + (opts.placeholder ? ' placeholder="' + escapeHtml(opts.placeholder) + '"' : '') + ' />';
      return '<div class="field"><label for="' + id + '">' + escapeHtml(label) + '</label>' + input + (opts.hint ? '<div class="muted-note" id="' + id + '-hint">' + opts.hint + '</div>' : '') + '</div>';
    }
    function select(id, label, value, options) {
      return '<div class="field"><label for="' + id + '">' + escapeHtml(label) + '</label><select id="' + id + '">' +
        options.map(function (o) { return '<option value="' + escapeHtml(o[0]) + '"' + (o[0] === value ? ' selected' : '') + '>' + escapeHtml(o[1]) + '</option>'; }).join('') + '</select></div>';
    }

    html += pane('job', skuJobPaneHtml(sku));
    html += pane('pos', skuPosPaneHtml(sku));
    html += pane('identity',
      '<div class="row">' + field('sk-code', 'Part number / SKU code', sku.code, { hint: '' }) + field('sk-name', 'Name', sku.name) + select('sk-status', 'Status', sku.status, SKU_STATUSES) + '</div>' +
      '<div class="row">' + field('sk-size', 'Size', sku.size) + field('sk-style', 'Style', sku.style) + field('sk-color', 'Color', sku.color) + field('sk-material', 'Material', sku.material) + '</div>' +
      '<div class="row">' + field('sk-colorspec', 'Color spec (Pantone / masterbatch)', sku.colorSpec) + field('sk-duro', 'Durometer', sku.durometer, { placeholder: 'e.g. 40A' }) + '</div>' +
      '<div class="row">' + field('sk-rev', 'Revision', sku.revision) + field('sk-drev', 'Drawing revision', sku.drawingRev) + '</div>' +
      field('sk-desc', 'Description', sku.description, { textarea: true }) + field('sk-notes', 'Notes', sku.notes, { textarea: true }));

    var ids = sku.ids || {};
    html += pane('commerce',
      '<div class="row">' + field('sk-upc', 'UPC', ids.upc, { hint: '12 digits' }) + field('sk-ean', 'EAN', ids.ean) + field('sk-gtin', 'GTIN', ids.gtin) + '</div>' +
      '<div class="row">' + field('sk-asin', 'ASIN', ids.asin, { hint: '10 characters' }) + field('sk-fnsku', 'FNSKU', ids.fnsku, { hint: '10 characters' }) + field('sk-sellersku', 'Seller SKU', ids.sellerSku) + '</div>' +
      '<div class="field"><label for="sk-otherids">Other marketplace IDs (one per line: label = value)</label><textarea id="sk-otherids" rows="3" placeholder="Walmart = 123456&#10;Shopify = MY-SKU-1">' +
      escapeHtml((ids.other || []).map(function (o) { return o.label + ' = ' + o.value; }).join('\n')) + '</textarea></div>');

    var dim = sku.dimensions || {}, pk = sku.packaging || {}, fa = sku.firstArticle || {};
    html += pane('specs',
      '<h4 class="pane-h">Molding</h4><div class="row">' + field('sk-mold', 'Mold / tool', sku.moldId) + field('sk-cav', 'Cavities', sku.cavityCount, { type: 'number', step: '1' }) +
      field('sk-cycle', 'Cycle time (sec)', sku.cycleTimeSec, { type: 'number', step: 'any' }) + field('sk-weight', 'Part weight (g)', sku.weightGrams, { type: 'number', step: 'any' }) + '</div>' +
      '<div class="row">' + field('sk-l', 'Length', dim.l) + field('sk-w', 'Width', dim.w) + field('sk-h', 'Height', dim.h) +
      select('sk-dunit', 'Units', dim.unit || 'mm', [['mm', 'mm'], ['in', 'in'], ['cm', 'cm']]) + '</div>' +
      field('sk-tol', 'Tolerances', sku.tolerances, { textarea: true }) +
      '<h4 class="pane-h">Commercial</h4><div class="row">' + field('sk-sell', 'Unit price (sell, per part)', sku.sellPrice, { type: 'number', step: 'any' }) +
      field('sk-target', 'Target unit cost (internal)', sku.unitCostTarget, { type: 'number', step: 'any' }) +
      field('sk-moq', 'MOQ (parts)', sku.moq) + field('sk-lead', 'Lead time (days)', sku.leadTimeDays) + field('sk-overrun', 'Overrun %', sku.overrunPct, { type: 'number', step: 'any' }) + '</div>' +
      '<h4 class="pane-h">Packaging</h4><div class="row">' + field('sk-pktype', 'Packaging type', pk.type, { placeholder: 'poly bag, blister, box' }) +
      field('sk-casepack', 'Case pack', pk.casePack) + field('sk-master', 'Master carton qty', pk.masterCartonQty) + field('sk-carton', 'Carton dims', pk.cartonDims) + '</div>' +
      field('sk-label', 'Label spec', pk.labelSpec, { textarea: true }) +
      '<h4 class="pane-h">First article</h4><div class="row">' + select('sk-fa', 'Status', fa.status || 'pending', FA_STATUSES) +
      field('sk-fadate', 'Date', fa.date, { type: 'date' }) + field('sk-faby', 'Approved by', fa.approvedBy) + '</div>' +
      field('sk-fanotes', 'First article notes', fa.notes, { textarea: true }));

    html += pane('bom', bomPaneHtml(draft));
    html += pane('files', docSlotsHtml('sku', sku.id, SKU_DOC_SLOTS) + '<p class="muted-note">Molds stay on the project. Files are stored in this browser until Drive upload is connected.</p>');
    html += pane('timeline', timelinePaneHtml(sku));

    html += '<div class="detail-actions">' + (sku.archived ? '<button type="button" class="ghost" id="sk-restore">Restore SKU</button>' : '<button type="button" class="ghost" id="sk-archive">Archive SKU</button>') +
      '<button type="button" class="ghost" id="sk-dup">Duplicate</button><span class="spacer"></span><button type="submit" id="sk-save">Save SKU</button></div></form>';
    root.innerHTML = html;

    // Validation hints (warn, never block).
    function hint(id, bad, msg) {
      var el = document.getElementById(id + '-hint');
      if (el) { el.textContent = bad ? msg : el.getAttribute('data-ok') || el.textContent; el.classList.toggle('warn-note', !!bad); }
    }
    function validate() {
      var code = document.getElementById('sk-code').value.trim();
      var clash = skuCodeClash(sku, code);
      hint('sk-code', !!clash, clash ? 'Already used by another SKU for this customer' : '');
      var upc = document.getElementById('sk-upc').value.trim();
      hint('sk-upc', upc && !/^\d{12}$/.test(upc), 'UPC is usually 12 digits');
      var asin = document.getElementById('sk-asin').value.trim();
      hint('sk-asin', asin && !/^[A-Za-z0-9]{10}$/.test(asin), 'ASIN is 10 letters and numbers');
      var fn = document.getElementById('sk-fnsku').value.trim();
      hint('sk-fnsku', fn && !/^[A-Za-z0-9]{10}$/.test(fn), 'FNSKU is 10 letters and numbers');
    }
    ['sk-upc', 'sk-asin', 'sk-fnsku'].forEach(function (id) { var el = document.getElementById(id + '-hint'); if (el) el.setAttribute('data-ok', el.textContent); });
    ['sk-code', 'sk-upc', 'sk-asin', 'sk-fnsku'].forEach(function (id) { document.getElementById(id).addEventListener('input', validate); });
    validate();

    root.querySelectorAll('[data-sku-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        skuEditorTab = b.getAttribute('data-sku-tab');
        root.querySelectorAll('[data-sku-tab]').forEach(function (x) { x.classList.toggle('active', x === b); });
        root.querySelectorAll('.sku-pane').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== skuEditorTab; });
      });
    });
    document.getElementById('sk-back').addEventListener('click', function () { activeSkuId = null; skuDraft = null; backFromDetail(); });
    var sc = document.getElementById('sk-cust');
    if (sc) sc.addEventListener('click', function () { activeSkuId = null; skuDraft = null; setActiveCustomers(sku.customerId); });
    document.getElementById('sku-form').addEventListener('submit', function (e) { e.preventDefault(); saveSkuFromEditor(sku); });
    document.getElementById('sk-dup').addEventListener('click', function () {
      saveSkuFromEditor(sku, true);
      if (skuDraft) return; // save refused (for example a blank code)
      var d = duplicateSku(sku); save(); if (d) openDetail(d.id);
    });
    var arc = document.getElementById('sk-archive');
    if (arc) arc.addEventListener('click', function () {
      if (!confirm('Archive SKU ' + (sku.code || '') + '? It leaves the boards and stays on the customer with its POs and history. You can restore it.')) return;
      saveSkuFromEditor(sku, true);
      if (skuDraft) return;
      setSkuArchived(sku, true);
      renderApp();
    });
    var rst = document.getElementById('sk-restore');
    if (rst) rst.addEventListener('click', function () { setSkuArchived(sku, false); renderApp(); });
    // Keep unsaved edits when a dialog (quote, PO) saves and redraws the drawer.
    root._skuSaveQuiet = function () { saveSkuFromEditor(sku, true); };
    bindSkuJobPane(root, sku);
    bindSkuPosPane(root, sku);
    bindTimelinePane(root, sku);
    bindBomPane(root, draft);
    var filesPane = root.querySelector('.sku-pane[data-pane="files"]');
    var refreshFiles = function () {
      // Refresh only the files pane so unsaved edits on other tabs are kept.
      filesPane.innerHTML = docSlotsHtml('sku', sku.id, SKU_DOC_SLOTS) + '<p class="muted-note">Molds stay on the project. Files are stored in this browser until Drive upload is connected.</p>';
      bindDocSlots(filesPane, 'sku', sku.id, refreshFiles);
      refreshTimelinePane(root, sku);
    };
    bindDocSlots(filesPane, 'sku', sku.id, refreshFiles);
  }

  function timelinePaneHtml(sku) {
    return '<div class="note-add"><textarea id="sk-tl-note" placeholder="Add a note to this SKU timeline..."></textarea><button type="button" class="ghost" id="sk-tl-add">Add note</button></div>' +
      timelineHtml(skuEvents(sku.id), false);
  }

  function refreshTimelinePane(root, sku) {
    var p = root.querySelector('.sku-pane[data-pane="timeline"]');
    if (!p) return;
    p.innerHTML = timelinePaneHtml(sku);
    bindTimelinePane(root, sku);
  }

  function bindTimelinePane(root, sku) {
    var btn = root.querySelector('#sk-tl-add');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var t = document.getElementById('sk-tl-note').value.trim();
      if (!t) return;
      addSkuEvent(sku.id, 'note', t);
      save();
      refreshTimelinePane(root, sku);
    });
  }

  function bomPaneHtml(sku) {
    var mats = (state.materials || []).slice().sort(function (a, b) { return (a.type + a.name).localeCompare(b.type + b.name); });
    var html = '<p class="muted-note">Quantity per finished part, before scrap. Cost uses the Best current vendor quote for each material.</p>';
    if (!mats.length) html += '<div class="comms-stub">No materials yet. Add them under Materials and Vendors, then pick them here.</div>';
    html += '<div class="table-wrap"><table class="kpi-table bom-table"><thead><tr><th>Material</th><th>Role</th><th class="num">Qty / part</th><th>Unit</th>' +
      '<th class="num">Scrap %</th><th>Best quote</th><th class="num">Cost / part</th><th></th></tr></thead><tbody>';
    if (!(sku.bom || []).length) html += '<tr><td colspan="8" class="file-empty">No material lines yet.</td></tr>';
    (sku.bom || []).forEach(function (l, i) {
      var c = bomLineCost(l);
      var v = c.quote ? getVendor(c.quote.vendorId) : null;
      html += '<tr data-bom="' + i + '"><td><select data-f="materialId"><option value="">Pick material</option>' +
        mats.map(function (m) { return '<option value="' + escapeHtml(m.id) + '"' + (m.id === l.materialId ? ' selected' : '') + '>' + escapeHtml(m.name + ' (' + m.type + ')') + '</option>'; }).join('') +
        '</select></td><td><select data-f="role">' + BOM_ROLES.map(function (r) { return '<option' + (r === l.role ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></td>' +
        '<td class="num"><input type="number" step="any" min="0" data-f="qtyPerPart" value="' + escapeHtml(l.qtyPerPart == null ? '' : l.qtyPerPart) + '" /></td>' +
        '<td><select data-f="unit">' + BOM_UNITS.map(function (u) { return '<option' + (u === l.unit ? ' selected' : '') + '>' + u + '</option>'; }).join('') + '</select></td>' +
        '<td class="num"><input type="number" step="any" min="0" data-f="scrapPct" value="' + escapeHtml(l.scrapPct == null ? '' : l.scrapPct) + '" /></td>' +
        '<td>' + (c.quote ? escapeHtml((v ? v.name : '') + ' ' + formatUnitPrice(Number(c.quote.price), c.quote.unit, c.quote.currency)) : '<span class="muted-note">' + escapeHtml(c.why || '') + '</span>') + '</td>' +
        '<td class="num">' + (c.cost != null ? formatUnitPrice(c.cost, '', 'USD') : '') + '</td>' +
        '<td><button type="button" class="ghost" data-bom-remove="' + i + '">Remove</button></td></tr>';
    });
    var tot = bomCostPerPart(sku);
    html += '</tbody></table></div>';
    html += '<div class="bom-foot"><button type="button" class="ghost" id="bom-add">+ Add material line</button>' +
      '<span class="spacer"></span><span>Material cost per part: <strong>' + ((sku.bom || []).length ? formatUnitPrice(tot.total, '', 'USD') : '$0.00') + '</strong>' +
      (tot.complete || !(sku.bom || []).length ? '' : ' <span class="muted-note">(some lines unpriced)</span>') + '</span></div>';
    return html;
  }

  function bindBomPane(root, sku) {
    function reread() {
      root.querySelectorAll('tr[data-bom]').forEach(function (tr) {
        var l = sku.bom[Number(tr.getAttribute('data-bom'))];
        if (!l) return;
        tr.querySelectorAll('[data-f]').forEach(function (el) {
          var f = el.getAttribute('data-f');
          l[f] = (f === 'qtyPerPart' || f === 'scrapPct') ? (el.value === '' ? '' : Number(el.value)) : el.value;
        });
      });
    }
    function redraw() {
      reread();
      var paneEl = root.querySelector('.sku-pane[data-pane="bom"]');
      paneEl.innerHTML = bomPaneHtml(sku);
      bindBomPane(root, sku);
      var tabN = root.querySelector('[data-sku-tab="bom"] .rail-count');
      if (tabN) { tabN.textContent = String(sku.bom.length); tabN.classList.toggle('zero', !sku.bom.length); }
    }
    root.querySelectorAll('tr[data-bom] [data-f]').forEach(function (el) {
      el.addEventListener('change', redraw);
    });
    var add = root.querySelector('#bom-add');
    if (add) add.addEventListener('click', function () {
      reread();
      sku.bom.push({ id: StuffMigrate.makeId('bom'), materialId: '', role: sku.bom.length ? 'secondary' : 'primary', qtyPerPart: '', unit: 'g', scrapPct: 5, notes: '' });
      redraw();
    });
    root.querySelectorAll('[data-bom-remove]').forEach(function (b) {
      b.addEventListener('click', function () {
        reread();
        sku.bom.splice(Number(b.getAttribute('data-bom-remove')), 1);
        redraw();
      });
    });
    root._bomReread = reread;
  }

  function saveSkuFromEditor(sku, quiet) {
    var root = document.getElementById('detail-root');
    var before = JSON.parse(JSON.stringify(sku));
    var beforeBom = JSON.stringify(before.bom || []);
    if (root._bomReread) root._bomReread();
    var draftBom = skuDraft && skuDraft.id === sku.id ? skuDraft.bom : (sku.bom || []);
    function v(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
    var code = v('sk-code');
    if (!code) { alert('SKU code is required.'); return; }
    sku.code = code;
    sku.name = v('sk-name'); sku.status = v('sk-status'); sku.size = v('sk-size'); sku.style = v('sk-style'); sku.color = v('sk-color');
    sku.colorSpec = v('sk-colorspec'); sku.durometer = v('sk-duro'); sku.revision = v('sk-rev'); sku.drawingRev = v('sk-drev');
    sku.description = v('sk-desc'); sku.notes = v('sk-notes');
    sku.ids = sku.ids || {};
    sku.ids.upc = v('sk-upc'); sku.ids.ean = v('sk-ean'); sku.ids.gtin = v('sk-gtin'); sku.ids.asin = v('sk-asin').toUpperCase();
    sku.ids.fnsku = v('sk-fnsku').toUpperCase(); sku.ids.sellerSku = v('sk-sellersku');
    sku.ids.other = v('sk-otherids').split('\n').map(function (line) {
      var i = line.indexOf('=');
      return i > 0 ? { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() } : null;
    }).filter(function (o) { return o && o.label && o.value; });
    sku.moldId = v('sk-mold'); sku.cavityCount = v('sk-cav'); sku.cycleTimeSec = v('sk-cycle'); sku.weightGrams = v('sk-weight');
    sku.dimensions = { l: v('sk-l'), w: v('sk-w'), h: v('sk-h'), unit: v('sk-dunit') || 'mm' };
    sku.tolerances = v('sk-tol'); sku.sellPrice = v('sk-sell'); sku.unitCostTarget = v('sk-target'); sku.moq = v('sk-moq');
    sku.leadTimeDays = v('sk-lead'); sku.overrunPct = v('sk-overrun') === '' ? '' : Number(v('sk-overrun'));
    sku.packaging = { type: v('sk-pktype'), casePack: v('sk-casepack'), masterCartonQty: v('sk-master'), cartonDims: v('sk-carton'), labelSpec: v('sk-label') };
    sku.firstArticle = { status: v('sk-fa') || 'pending', date: v('sk-fadate'), approvedBy: v('sk-faby'), notes: v('sk-fanotes') };
    sku.bom = JSON.parse(JSON.stringify(draftBom)).filter(function (l) { return l.materialId || l.qtyPerPart; });
    sku.material = v('sk-material');
    // Job and value (#3). Every money key is a plain editable field (#2).
    var beforeTiers = JSON.stringify(before.tiers || []);
    if (document.getElementById('sk-molds')) {
      sku.moldsRequired = numOrBlank(v('sk-molds'));
      sku.annualQty = numOrBlank(v('sk-annual'));
      sku.targetShipDate = v('sk-shipdate') || null;
      if (!sku.values) sku.values = {};
      SKU_MONEY_KEYS.forEach(function (k) { sku.values[k] = Number(v('sk-v-' + k)) || 0; });
      var estEl = document.getElementById('sk-arrEstimated');
      if (estEl) { if (estEl.checked) sku.arrEstimated = true; else delete sku.arrEstimated; }
      sku.tiers = parseTiers(v('sk-tiers'));
      var newStage = v('sk-stage');
      if (newStage !== (sku.stage || '')) StuffMigrate.setSkuStage(state, sku, newStage, nowIso());
    }
    sku.updatedAt = nowIso();

    // Timeline: one event per save listing what changed; status, revision and first article get their own types.
    var changes = [];
    SKU_TRACKED_FIELDS.forEach(function (f) {
      var a = getPath(before, f[0]), b = getPath(sku, f[0]);
      a = a == null ? '' : String(a); b = b == null ? '' : String(b);
      if (a !== b) changes.push({ field: f[0], label: f[1], from: a, to: b });
    });
    var special = { status: 'status', revision: 'revision', drawingRev: 'revision', 'firstArticle.status': 'first_article', stage: 'stage' };
    changes.filter(function (c) { return special[c.field]; }).forEach(function (c) {
      var from = c.field === 'status' ? skuStatusLabel(c.from) : c.field === 'stage' ? (c.from ? stageLabel(c.from) : 'not on a board') : c.from;
      var to = c.field === 'status' ? skuStatusLabel(c.to) : c.field === 'stage' ? (c.to ? stageLabel(c.to) : 'not on a board') : c.to;
      addSkuEvent(sku.id, special[c.field], c.label + ': ' + (from || '(blank)') + ' to ' + (to || '(blank)'), c);
    });
    var rest = changes.filter(function (c) { return !special[c.field]; });
    if (rest.length) {
      addSkuEvent(sku.id, 'updated', rest.map(function (c) { return c.label + ' ' + (c.from || '(blank)') + ' to ' + (c.to || '(blank)'); }).join('; '), { changes: rest });
    }
    if (JSON.stringify(sku.tiers || []) !== beforeTiers) {
      addSkuEvent(sku.id, 'updated', 'Qty ladder: ' + (sku.tiers.length ? tiersText(sku.tiers).replace(/\n/g, '; ') : 'cleared'));
    }
    var custPick = v('sk-customer');
    if (custPick && custPick !== sku.customerId) StuffMigrate.reassignSkuCustomer(state, sku, custPick, { by: currentUserName() });
    if (JSON.stringify(sku.bom) !== beforeBom) {
      addSkuEvent(sku.id, 'bom', 'Bill of materials: ' + (sku.bom.length ? sku.bom.map(function (l) {
        var m = getMaterial(l.materialId);
        return (m ? m.name : '?') + ' ' + (l.qtyPerPart || 0) + ' ' + l.unit + '/part, ' + (l.scrapPct || 0) + '% scrap';
      }).join('; ') : 'cleared'));
    }
    skuDraft = null;
    if (skuCodeClash(sku, sku.code)) showToast('Saved. Note: code ' + sku.code + ' is also used by another SKU for this customer.');
    logChange('update', 'sku', sku.id, 'Saved ' + sku.code + (changes.length ? ' (' + changes.length + ' field changes)' : ''));
    save();
    if (!quiet) renderDetail();
  }

  // =====================================================================
  // SKU jobs (issue #3, Owner 2026-09-23). The CRM ends at Won. Pre-Production and
  // Operations run by Customer, then SKU, then customer PO. Board cards there are SKU
  // jobs (Pre-production) and PO lines (Production). Rules live in migrate-v12.js.
  // =====================================================================

  var SKU_MONEY_KEYS = StuffMigrate.SKU_VALUE_KEYS.slice();
  var MONEY_LABELS = {
    designDfm: 'Design/DFM', prototyping: 'Prototyping', tooling: 'Tooling/Molds',
    partnerServices: 'Partner services', productionArr: 'ARR', currentPo: 'Current PO'
  };
  var QUOTE_STATUS_LABELS = { draft: 'Draft', sent: 'Sent', accepted: 'Accepted', superseded: 'Superseded' };

  function liveSkus() { return (state.skus || []).filter(function (s) { return !s.archived; }); }
  function skusForCustomer(customerId, withArchived) {
    return (state.skus || []).filter(function (s) { return s.customerId === customerId && (withArchived || !s.archived); });
  }
  function stageKind(stage) { return StuffMigrate.stageKindOf(state, stage); }
  function allPoLines() {
    var out = [];
    (state.customerPos || []).forEach(function (po) { (po.lines || []).forEach(function (l) { out.push({ po: po, line: l }); }); });
    return out;
  }
  function getPoLine(lineId) { return allPoLines().find(function (x) { return x.line.id === lineId; }) || null; }
  function getCustomerPo(id) { return (state.customerPos || []).find(function (p) { return p.id === id; }) || null; }
  function posForCustomer(customerId) { return (state.customerPos || []).filter(function (p) { return p.customerId === customerId; }); }
  function quotesForLead(leadId) { return (state.customerQuotes || []).filter(function (q) { return q.dealId === leadId; }); }
  function getCustomerQuote(id) { return (state.customerQuotes || []).find(function (q) { return q.id === id; }) || null; }
  function skuTitle(sku) { return (sku && (String(sku.name || '').trim() || sku.code)) || 'SKU'; }

  // Board cards drawn from SKU and PO records. Wrappers only; moves write the records.
  function jobCardsOnStage(stage) {
    var kind = stageKind(stage);
    if (kind === 'po-line') {
      return allPoLines().filter(function (x) { return x.line.stage === stage; })
        .map(function (x) { return { kind: 'po-line', id: x.line.id, stage: stage, line: x.line, po: x.po }; });
    }
    if (kind !== 'sku') return [];
    return liveSkus().filter(function (s) { return s.stage === stage; })
      .map(function (s) { return { kind: 'sku', id: s.id, stage: stage, sku: s }; });
  }

  function getJobCard(id) {
    if (!id) return null;
    var sku = liveSkus().find(function (s) { return s.id === id; });
    if (sku) return { kind: 'sku', id: sku.id, stage: sku.stage, sku: sku };
    var pl = getPoLine(id);
    if (pl) return { kind: 'po-line', id: pl.line.id, stage: pl.line.stage, line: pl.line, po: pl.po };
    return null;
  }

  function jobCardValue(card) {
    return card.kind === 'po-line' ? StuffMigrate.poLineAmount(card.line) : totalValue(card.sku);
  }

  function moldsBlankText(sku) {
    return (sku.quoteMissing || []).indexOf('moldsRequired') !== -1 ? 'not on quote' : 'not set';
  }

  function cardFaceHtml(face, sku) {
    var parts = [];
    if (face.prepro != null) parts.push('<span class="face-item"><span class="face-k">Pre-Production</span> <strong>' + formatMoney(face.prepro) + '</strong></span>');
    if (face.tooling != null) parts.push('<span class="face-item"><span class="face-k">Mold Tooling</span> <strong>' + formatMoney(face.tooling) + '</strong></span>');
    var arrStar = face.arrEstimate && face.arr > 0;
    parts.push('<span class="face-item"' + (arrStar ? ' title="Example Molding Co. estimate, not from the lead"' : '') + '><span class="face-k">Estimated ARR</span> <strong>' + formatMoney(face.arr) + (arrStar ? '*' : '') + '</strong></span>');
    if (sku) {
      parts.push(face.molds == null
        ? '<span class="face-item face-flag"><span class="face-k">Molds</span> <strong>' + escapeHtml(moldsBlankText(sku)) + '</strong></span>'
        : '<span class="face-item"><span class="face-k">Molds</span> <strong>' + escapeHtml(String(face.molds)) + '</strong></span>');
    }
    if (face.openPo != null) parts.push('<span class="face-item"><span class="face-k">Open PO</span> <strong>' + formatMoney(face.openPo) + '</strong></span>');
    return '<div class="card-face">' + parts.join('') + '</div>';
  }

  function bindCardDrag(el, id, onClick) {
    el.draggable = true;
    el.addEventListener('dragstart', function (e) {
      dragDealId = id;
      el.classList.add('dragging');
      try { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; } catch (err) { /* ignore */ }
    });
    el.addEventListener('dragend', function () {
      el.classList.remove('dragging');
      dragDealId = null;
      clearDragOver();
      clearAreaDragExpand();
      suppressCardClick = true;
      setTimeout(function () { suppressCardClick = false; }, 80);
    });
    el.addEventListener('click', function (e) {
      if (suppressCardClick) { e.preventDefault(); e.stopPropagation(); return; }
      onClick();
    });
  }

  // Awaiting Payment card face (#101): invoice number, open amount, due date (red when overdue) and a partial chip.
  function awaitingPaymentBadges(sku) {
    if (!sku || sku.stage !== StuffMigrate.AWAITING_STAGE) return '';
    var lead = sku.dealId ? getDeal(sku.dealId) : null;
    var info = lead ? StuffMigrate.invoiceInfo(state, lead, nowIso()) : null;
    if (!info || !info.open) return '<span class="badge badge-followup" title="No open invoice is linked to this lead">No open invoice</span>';
    var h = '<span class="badge badge-source" title="Invoice">Inv ' + escapeHtml(info.invoiceRefs.join(', ') || '(no number)') + '</span>' +
      '<span class="badge badge-followup" title="Open amount">Open ' + escapeHtml(formatMoney(info.openAmount)) + '</span>';
    if (info.dueDate) h += '<span class="badge ' + (info.overdue ? 'badge-overdue' : 'badge-followup') + '" title="' + (info.overdue ? 'Past due' : 'Due date') + '">' + (info.overdue ? 'Overdue ' : 'Due ') + escapeHtml(info.dueDate) + '</span>';
    if (info.partial) h += '<span class="badge badge-source" title="Stays here until the invoice is paid in full">Partial paid ' + escapeHtml(formatMoney(info.paid)) + ' of ' + escapeHtml(formatMoney(info.total)) + '</span>';
    return h;
  }

  function renderJobCard(card) {
    var el = document.createElement('div');
    el.setAttribute('data-id', card.id);
    if (card.kind === 'sku') {
      var sku = card.sku;
      el.className = 'card card-sku';
      var badges = '';
      if (sku.source) badges += '<span class="badge badge-source" title="Values filled from this quote">' + escapeHtml(StuffMigrate.quoteLabel({ number: sku.source.number, revision: sku.source.revision })) + '</span>';
      if ((sku.quoteMissing || []).length) badges += '<span class="badge badge-overdue" title="' + escapeHtml(sku.quoteMissing.map(function (f) { return StuffMigrate.QUOTE_FIELD_LABELS[f] || f; }).join(', ')) + '">Check quote</span>';
      if (sku.targetShipDate) badges += '<span class="badge badge-followup">Ship ' + escapeHtml(sku.targetShipDate) + '</span>';
      badges += awaitingPaymentBadges(sku);
      var skuSla = cardSla(sku);
      if (skuSla && skuSla.over) badges += '<span class="badge badge-sla" title="Past the ' + skuSla.slaDays + ' day stage SLA">Over SLA ' + skuSla.daysOver + 'd</span>';
      el.innerHTML = '<div class="card-customer">' + escapeHtml(customerNameFor(sku)) + '<span class="badge badge-sku">' + escapeHtml(sku.code || 'SKU') + '</span></div>' +
        '<div class="card-title-row"><div class="card-title">' + escapeHtml(skuTitle(sku)) + '</div></div>' +
        cardFaceHtml(StuffMigrate.cardFace(state, sku, 'sku'), sku) +
        (badges ? '<div class="card-meta">' + badges + '</div>' : '');
      bindCardDrag(el, sku.id, function () { openDetail(sku.id); });
      addCardMoveButton(el, sku.id, skuTitle(sku));
      if (sku.stage && areaRoleFor((sectionForStage(sku.stage) || {}).area) === 'pre-production') addPreprodCardActions(el, sku);
      return el;
    }
    var line = card.line, po = card.po, lsku = getSku(line.skuId);
    var lineSla = cardSla(line);
    el.className = 'card card-po';
    var sub = 'PO ' + (po.poNumber || '(no number)') + (line.qty !== '' && line.qty != null ? ' / qty ' + Number(line.qty).toLocaleString('en-US') : '');
    el.innerHTML = '<div class="card-customer">' + escapeHtml(customerNameFor(po)) + (lsku ? '<span class="badge badge-sku">' + escapeHtml(lsku.code || 'SKU') + '</span>' : '') + '</div>' +
      '<div class="card-title-row"><div class="card-title">' + escapeHtml(lsku ? skuTitle(lsku) : 'SKU missing') + '</div></div>' +
      '<div class="card-sub">' + escapeHtml(sub) + '</div>' +
      cardFaceHtml(StuffMigrate.cardFace(state, line, 'po-line'), null) +
      ((line.shipDate || (lineSla && lineSla.over)) ? '<div class="card-meta">' +
        (line.shipDate ? '<span class="badge ' + (isOverdue(line.shipDate) ? 'badge-overdue' : 'badge-followup') + '">Ship ' + escapeHtml(line.shipDate) + '</span>' : '') +
        (lineSla && lineSla.over ? '<span class="badge badge-sla" title="Past the ' + lineSla.slaDays + ' day stage SLA">Over SLA ' + lineSla.daysOver + 'd</span>' : '') + '</div>' : '');
    bindCardDrag(el, line.id, function () { openPoModal({ poId: po.id, lineId: line.id }); });
    addCardMoveButton(el, line.id, 'PO ' + (po.poNumber || '') + (lsku ? ' ' + skuTitle(lsku) : ''));
    return el;
  }

  // Pre-Production card buttons (Owner 2026-10-12): Send to Production, Remove from board.
  function addPreprodCardActions(el, sku) {
    var bar = document.createElement('div');
    bar.className = 'card-actions';
    bar.innerHTML = '<button type="button" class="card-act card-act-prod" data-act="prod">Send to Production</button>' +
      '<button type="button" class="card-act card-act-remove" data-act="remove">Remove from board</button>';
    bar.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    bar.querySelector('[data-act="prod"]').addEventListener('click', function (e) {
      e.stopPropagation(); e.preventDefault();
      sendSkuToProductionUi(sku);
    });
    bar.querySelector('[data-act="remove"]').addEventListener('click', function (e) {
      e.stopPropagation(); e.preventDefault();
      removeSkuFromBoardUi(sku);
    });
    el.appendChild(bar);
  }

  function removeSkuFromBoardUi(sku) {
    if (!confirm('Remove ' + skuTitle(sku) + ' from this board? Only this card leaves. The deal, its other cards and this SKU stay. Find it later under SKUs, Not on a board.')) return;
    var r = StuffMigrate.removeSkuFromBoard(state, sku, nowIso());
    if (!r.ok) return;
    addSkuEvent(sku.id, 'stage', 'Removed from board: ' + stageLabel(r.from) + ' (not archived)');
    logChange('remove-from-board', 'sku', sku.id, 'Removed from ' + r.from + ' (not archived)');
    save();
    showToast('Removed from board. Not archived.');
    renderApp();
  }

  function sendSkuToProductionUi(sku) {
    if (sku.stage === 'awaiting-payment') { showToast('Still awaiting payment. It moves on once paid.'); return; }
    var target = StuffMigrate.productionTargetStage(state);
    var where = target ? (areaLabelFor((sectionForStage(target) || {}).area) + ' / ' + stageLabel(target)) : 'Production';
    if (!confirm('Send ' + skuTitle(sku) + ' to ' + where + '?')) return;
    var r = StuffMigrate.sendSkuToProduction(state, sku, nowIso());
    if (!r.ok) { showToast(r.reason === 'awaiting-payment' ? 'Still awaiting payment.' : 'Already in production.'); return; }
    addSkuEvent(sku.id, 'stage', 'Sent to Production: ' + (r.from ? stageLabel(r.from) : 'not on a board') + ' to ' + (r.to ? stageLabel(r.to) : 'Production'));
    logChange('send-to-production', 'sku', sku.id, 'Stage ' + (r.from || '(none)') + ' to ' + (r.to || '(production)'));
    save();
    showToast('Sent to Production');
    renderApp();
  }

  var PO_LINE_STATUSES = ['open', 'in_production', 'shipped', 'closed'];
  function poStatusForStage(stage) {
    var b = StuffMigrate.boardForKind(state, 'po-line');
    var idx = b ? (b.stages || []).indexOf(stage) : -1;
    return PO_LINE_STATUSES[Math.max(0, Math.min(idx, PO_LINE_STATUSES.length - 1))];
  }

  // Drag or rail drop of a SKU or PO line card. Returns true when it moved.
  function moveJobCard(card, stage) {
    var kind = stageKind(stage);
    var t = nowIso();
    if (card.kind === 'sku') {
      if (kind === 'po-line') { showToast('Add a customer PO on the SKU to put it on Production.'); return false; }
      if (kind !== 'sku') { showToast('SKU jobs stay on Pre-Production and Operations boards.'); return false; }
      var sku = card.sku, from = sku.stage;
      if (from === stage) return false;
      StuffMigrate.setSkuStage(state, sku, stage, t);
      sku.updatedAt = t;
      addSkuEvent(sku.id, 'stage', 'Stage: ' + (from ? stageLabel(from) : 'not on a board') + ' to ' + stageLabel(stage));
      logChange('move', 'sku', sku.id, 'Stage ' + (from || '(none)') + ' to ' + stage);
      save();
      return true;
    }
    if (kind !== 'po-line') { showToast('PO lines stay on the Production board.'); return false; }
    var line = card.line, po = card.po, was = line.stage;
    if (was === stage) return false;
    line.stage = stage;
    line.status = poStatusForStage(stage);
    line.stageEnteredAt = t;
    po.updatedAt = t;
    addSkuEvent(line.skuId, 'po', 'PO ' + (po.poNumber || '(no number)') + ': ' + stageLabel(was) + ' to ' + stageLabel(stage));
    logChange('move', 'po', po.id, 'Line ' + line.id + ' ' + was + ' to ' + stage);
    save();
    return true;
  }

  function skuBoards() {
    return sectionList().filter(function (sec) { return (sec.stages || []).length && stageKind(sec.stages[0]) === 'sku'; });
  }
  function skuBoardStageOptions(selected, withNone) {
    var html = withNone ? '<option value=""' + (!selected ? ' selected' : '') + '>Not on a board</option>' : '';
    skuBoards().forEach(function (sec) {
      html += '<optgroup label="' + escapeHtml(areaLabelFor(sec.area) + ' / ' + sec.label) + '">';
      (sec.stages || []).forEach(function (st) {
        html += '<option value="' + escapeHtml(st) + '"' + (st === selected ? ' selected' : '') + '>' + escapeHtml(stageLabel(st)) + '</option>';
      });
      html += '</optgroup>';
    });
    return html;
  }
  function poStageOptions(selected) {
    var b = StuffMigrate.boardForKind(state, 'po-line');
    var stages = b ? b.stages || [] : [];
    if (selected && stages.indexOf(selected) === -1) stages = stages.concat([selected]);
    return stages.map(function (st) { return '<option value="' + escapeHtml(st) + '"' + (st === selected ? ' selected' : '') + '>' + escapeHtml(stageLabel(st)) + '</option>'; }).join('');
  }
  function customerOptions(selected, withNew) {
    var html = withNew ? '<option value="__new__">+ New customer</option>' : '<option value="">Pick a customer</option>';
    (state.customers || []).slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); }).forEach(function (c) {
      html += '<option value="' + escapeHtml(c.id) + '"' + (c.id === selected ? ' selected' : '') + '>' + escapeHtml(c.name) + '</option>';
    });
    return html;
  }

  function skuPlaceText(sku) {
    if (sku.archived) return 'Archived';
    if (sku.stage) {
      var sec = sectionForStage(sku.stage);
      return (sec ? sec.label + ' / ' : '') + stageLabel(sku.stage);
    }
    var open = StuffMigrate.poLinesForSku(state, sku.id).filter(function (x) { return StuffMigrate.isOpenPoLine(state, x.line); });
    if (open.length) return 'Production / ' + stageLabel(open[0].line.stage);
    return 'Not on a board';
  }

  function suggestCodeFor(customerId, name) {
    var cust = getCustomer(customerId);
    var prefix = abbrev(cust ? cust.name : 'SKU', 4) + '-' + abbrev(name || 'SKU', 4) + '-';
    var used = (state.skus || []).filter(function (x) { return x.customerId === customerId; }).map(function (x) { return x.code; });
    var n = 1;
    while (used.indexOf(prefix + String(n).padStart(3, '0')) !== -1) n += 1;
    return prefix + String(n).padStart(3, '0');
  }

  function parseTiers(text) {
    return String(text || '').split(/\n|;/).map(function (lineTxt) {
      var m = lineTxt.trim().match(/^([\d,.]+)\s*(?:@|at|x)\s*\$?([\d,.]+)$/i);
      return m ? { qty: Number(m[1].replace(/,/g, '')), unitPrice: Number(m[2].replace(/,/g, '')) } : null;
    }).filter(Boolean);
  }
  function tiersText(tiers) {
    return (tiers || []).map(function (t) { return (t.qty === '' ? '' : t.qty) + ' @ ' + (t.unitPrice === '' ? '' : t.unitPrice); }).join('\n');
  }
  function numOrBlank(v) { var s = String(v == null ? '' : v).trim(); return s === '' ? '' : Number(s); }

  // ---------------------------------------------------------------------
  // One modal shell for the SKU job dialogs (Mark won, quote, PO, Add SKU, re-apply).
  // ---------------------------------------------------------------------

  function openJobModal(html, size) {
    var bd = document.getElementById('job-modal-backdrop');
    var m = document.getElementById('job-modal');
    m.className = 'modal' + (size === 'sm' ? ' modal-sm' : size === 'lg' ? ' modal-lg' : '');
    m.innerHTML = html;
    bd.classList.add('open');
    var first = m.querySelector('input:not([type=hidden]):not([type=checkbox]), select, textarea');
    if (first) setTimeout(function () { try { first.focus(); } catch (e) { /* ignore */ } }, 0);
    var cancel = m.querySelector('[data-job-cancel]');
    if (cancel) cancel.addEventListener('click', closeJobModal);
    return m;
  }
  function closeJobModal() {
    var bd = document.getElementById('job-modal-backdrop');
    if (bd) bd.classList.remove('open');
    var m = document.getElementById('job-modal');
    if (m) m.innerHTML = '';
  }
  (function () {
    var bd = document.getElementById('job-modal-backdrop');
    if (!bd) return;
    bd.addEventListener('click', function (e) { if (e.target === bd) closeJobModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && bd.classList.contains('open')) closeJobModal(); });
  })();

  function afterJobChange() {
    save();
    renderApp();
  }

  // ---------------------------------------------------------------------
  // Mark won: close the lead, link the customer, create SKU jobs (from the quote or not).
  // ---------------------------------------------------------------------

  function openWonModal(ctx) {
    var lead = getDeal(ctx.leadId);
    if (!lead || isProjectCard(lead)) return;
    if (!lead.customerId && lead.type !== 'internal') ensureDealCustomer(lead);
    var quotes = quotesForLead(lead.id).filter(function (q) { return q.status !== 'superseded'; });
    var pick = quotes.find(function (q) { return q.status === 'accepted'; }) || quotes.find(function (q) { return q.status === 'sent'; }) || quotes[0] || null;
    var stage = ctx.stage && stageKind(ctx.stage) === 'sku' ? ctx.stage : StuffMigrate.skuStageAt(state, 0);
    var html = '<div class="modal-title-row"><h2>Mark won: ' + escapeHtml(cardTitle(lead)) + '</h2></div><form id="won-form">' +
      '<div class="row"><div class="field"><label for="won-customer">Customer</label><select id="won-customer">' + customerOptions(lead.customerId, true) + '</select></div>' +
      '<div class="field" id="won-new-wrap"><label for="won-new">New customer name</label><input type="text" id="won-new" value="' + escapeHtml(lead.company || '') + '" /></div></div>' +
      '<div class="row"><div class="field"><label for="won-quote">Accepted quote</label><select id="won-quote"><option value="">No quote</option>' +
      quotes.map(function (q) { return '<option value="' + escapeHtml(q.id) + '"' + (pick && q.id === pick.id ? ' selected' : '') + '>' + escapeHtml(StuffMigrate.quoteLabel(q) + ' (' + (QUOTE_STATUS_LABELS[q.status] || q.status) + ', ' + (q.lines || []).length + ' lines)') + '</option>'; }).join('') +
      '</select></div><div class="field"><label for="won-stage">SKU jobs start on</label><select id="won-stage">' + skuBoardStageOptions(stage, false) + '</select></div></div>' +
      '<div class="section-title">SKU jobs to create</div><div id="won-rows"></div>' +
      '<p class="muted-note">The lead closes and leaves the working CRM boards. It stays on the customer and in history. Values stay editable on each SKU.</p>' +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button><button type="submit" id="won-save">Mark won</button></div></form>';
    var m = openJobModal(html, 'lg');
    var custSel = m.querySelector('#won-customer');
    if (!lead.customerId || !getCustomer(lead.customerId)) custSel.value = '__new__';
    function syncCust() { m.querySelector('#won-new-wrap').style.display = custSel.value === '__new__' ? '' : 'none'; }
    custSel.addEventListener('change', syncCust);
    syncCust();
    var extraRows = 0;
    function drawRows() {
      var q = getCustomerQuote(m.querySelector('#won-quote').value);
      var box = m.querySelector('#won-rows');
      var h = '';
      if (q) {
        if (!(q.lines || []).length) h += '<div class="contacts-empty">This quote has no lines. Add them under Quotes on the lead, or pick No quote.</div>';
        (q.lines || []).forEach(function (l) {
          var bits = [];
          bits.push(l.moldsRequired === '' ? 'molds not on quote' : l.moldsRequired + ' molds');
          if (l.tooling !== '') bits.push('tooling ' + formatMoney(l.tooling));
          if (l.designDfm !== '' && Number(l.designDfm)) bits.push('design ' + formatMoney(l.designDfm));
          if (l.prototyping !== '' && Number(l.prototyping)) bits.push('prototyping ' + formatMoney(l.prototyping));
          if (l.unitPrice !== '') bits.push('$' + l.unitPrice + ' each');
          bits.push(l.annualQty !== '' && l.unitPrice !== '' ? 'ARR ' + formatMoney(Number(l.unitPrice) * Number(l.annualQty)) : 'no annual qty, ARR blank');
          h += '<div class="won-row" data-line="' + escapeHtml(l.id) + '"><label class="check-line"><input type="checkbox" checked data-won-use /> </label>' +
            '<input type="text" data-won-name value="' + escapeHtml(l.productName || '') + '" placeholder="SKU name" />' +
            '<span class="muted-note">' + escapeHtml(bits.join(', ')) + (l.skuId && getSku(l.skuId) ? ' (already has SKU ' + escapeHtml(getSku(l.skuId).code) + ')' : '') + '</span></div>';
        });
      } else {
        h += '<div class="won-row"><input type="text" data-won-name value="' + escapeHtml(lead.title || lead.company || '') + '" placeholder="SKU name" />' +
          '<span class="muted-note">Gets the deal amounts: Pre-Production ' + formatMoney(StuffMigrate.preproValue(lead.values)) + ', Mold Tooling ' + formatMoney(StuffMigrate.toolingValue(lead.values)) + ', Estimated ARR ' + formatMoney((lead.values || {}).productionArr) + '</span></div>';
        for (var i = 0; i < extraRows; i++) h += '<div class="won-row"><input type="text" data-won-name value="" placeholder="SKU name" /><span class="muted-note">Starts at $0</span></div>';
        h += '<button type="button" class="ghost" id="won-add-row">+ Add another SKU</button>';
      }
      box.innerHTML = h;
      var add = box.querySelector('#won-add-row');
      if (add) add.addEventListener('click', function () { extraRows += 1; drawRows(); });
    }
    m.querySelector('#won-quote').addEventListener('change', function () { extraRows = 0; drawRows(); });
    drawRows();
    m.querySelector('#won-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var custVal = custSel.value;
      var newName = m.querySelector('#won-new').value.trim();
      if (custVal === '__new__' && !newName) { alert('Customer name is required.'); return; }
      var quoteId = m.querySelector('#won-quote').value || null;
      var rows = [];
      m.querySelectorAll('.won-row').forEach(function (r) {
        var use = r.querySelector('[data-won-use]');
        if (use && !use.checked) return;
        var name = r.querySelector('[data-won-name]').value.trim();
        if (!quoteId && !name) return;
        rows.push({ lineId: r.getAttribute('data-line') || null, name: name });
      });
      var at = nowIso(), by = currentUserName();
      var res = StuffMigrate.markLeadWon(state, lead, { customerId: custVal === '__new__' ? null : custVal, customerName: custVal === '__new__' ? newName : null, quoteId: quoteId, by: by, at: at });
      var made = StuffMigrate.createSkuJobs(state, lead, rows, { quoteId: quoteId, stage: m.querySelector('#won-stage').value, by: by, at: at });
      made.forEach(function (sk) { if (!sk.code) sk.code = suggestCodeFor(sk.customerId, sk.name); });
      // #57: a lead that is won runs the on enter rules of the Won stages. This window was the confirmation
      // for Create project, so it is not asked again.
      StuffMigrate.KPI_WON_STAGES.forEach(function (wonStage) {
        StuffMigrate.applyStageRules(state, lead, {
          at: at, stage: wonStage, allowWon: true, vars: ruleVarsFor(lead), actor: sectionActor(),
          bucketOk: function (b) { return !!findTaskBucket(b); },
          delegateOk: function (n) { return ensureDelegatees().indexOf(n) !== -1; },
          log: function (action, type, id, text) { logChange(action, type, id, text); }
        });
      });
      closeJobModal();
      save();
      showToast('Won for ' + res.customer.name + '. ' + made.length + ' SKU job' + (made.length === 1 ? '' : 's') + ' created.');
      if (made.length) openDetail(made[0].id);
      else renderApp();
    });
  }

  // ---------------------------------------------------------------------
  // Customer quotes on a lead (entered by hand for now; bots can fill the same shape).
  // ---------------------------------------------------------------------

  function quoteLineRowHtml(l) {
    l = l || {};
    function cell(f, v, ph, wide) { return '<td><input type="' + (wide ? 'text' : 'number') + '"' + (wide ? '' : ' step="any" min="0"') + ' data-ql="' + f + '" value="' + escapeHtml(v == null ? '' : v) + '"' + (ph ? ' placeholder="' + escapeHtml(ph) + '"' : '') + ' /></td>'; }
    return '<tr data-line-id="' + escapeHtml(l.id || '') + '" data-sku-id="' + escapeHtml(l.skuId || '') + '">' +
      cell('productName', l.productName, 'Product', true) + cell('moldsRequired', l.moldsRequired, '') + cell('tooling', l.tooling, '') +
      cell('designDfm', l.designDfm, '') + cell('prototyping', l.prototyping, '') + cell('partnerServices', l.partnerServices, '') +
      cell('unitPrice', l.unitPrice, '') + cell('annualQty', l.annualQty, '') +
      '<td><textarea rows="1" data-ql="tiers" placeholder="5000 @ 0.55">' + escapeHtml(tiersText(l.tiers)) + '</textarea></td></tr>';
  }

  function openCustomerQuoteModal(ctx) {
    var lead = getDeal(ctx.leadId);
    if (!lead) return;
    var q = ctx.quoteId ? getCustomerQuote(ctx.quoteId) : null;
    var html = '<div class="modal-title-row"><h2>' + (q ? 'Quote ' + escapeHtml(StuffMigrate.quoteLabel(q)) : 'Add quote') + '</h2></div><form id="cq-form">' +
      '<div class="row"><div class="field"><label for="cq-number">Quote number</label><input type="text" id="cq-number" value="' + escapeHtml(q ? q.number : '') + '" required /></div>' +
      '<div class="field"><label for="cq-rev">Revision</label><input type="text" id="cq-rev" value="' + escapeHtml(q ? q.revision : '') + '" /></div>' +
      '<div class="field"><label for="cq-status">Status</label><select id="cq-status">' + Object.keys(QUOTE_STATUS_LABELS).map(function (k) { return '<option value="' + k + '"' + ((q ? q.status : 'draft') === k ? ' selected' : '') + '>' + QUOTE_STATUS_LABELS[k] + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="section-title">Lines</div><p class="muted-note">One line per SKU. Leave a field blank when the quote does not say; the SKU then shows it as not on the quote. Qty ladder: one tier per line, like 5000 @ 0.55.</p>' +
      '<div class="table-wrap"><table class="kpi-table quote-lines"><thead><tr><th>Product</th><th>Molds</th><th>Tooling/Molds $</th><th>Design/DFM $</th><th>Prototyping $</th><th>Partner $</th><th>Unit price $</th><th>Annual qty</th><th>Qty ladder</th></tr></thead><tbody id="cq-lines">' +
      ((q && q.lines.length ? q.lines : [{}]).map(quoteLineRowHtml).join('')) + '</tbody></table></div>' +
      '<button type="button" class="ghost" id="cq-add-line">+ Add line</button>' +
      '<div class="field"><label for="cq-notes">Notes</label><textarea id="cq-notes" rows="2">' + escapeHtml(q ? q.notes : '') + '</textarea></div>' +
      '<p class="muted-note">Attach the quote PDF under Files, Quotes on the lead. Quotes are never deleted; set an old one to Superseded.</p>' +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button><button type="submit" id="cq-save">Save quote</button></div></form>';
    var m = openJobModal(html, 'lg');
    m.querySelector('#cq-add-line').addEventListener('click', function () { m.querySelector('#cq-lines').insertAdjacentHTML('beforeend', quoteLineRowHtml({})); });
    m.querySelector('#cq-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var number = m.querySelector('#cq-number').value.trim();
      if (!number) { alert('Quote number is required.'); return; }
      var lines = [];
      m.querySelectorAll('#cq-lines tr').forEach(function (tr) {
        var l = { id: tr.getAttribute('data-line-id') || StuffMigrate.makeId('cql'), skuId: tr.getAttribute('data-sku-id') || null };
        tr.querySelectorAll('[data-ql]').forEach(function (inp) {
          var f = inp.getAttribute('data-ql');
          l[f] = f === 'productName' ? inp.value.trim() : f === 'tiers' ? parseTiers(inp.value) : inp.value.trim();
        });
        var blank = !l.productName && ['moldsRequired', 'tooling', 'designDfm', 'prototyping', 'partnerServices', 'unitPrice', 'annualQty'].every(function (k) { return l[k] === ''; }) && !l.tiers.length;
        if (!blank) lines.push(l);
      });
      var at = nowIso();
      var raw = Object.assign({}, q || {}, { number: number, revision: m.querySelector('#cq-rev').value.trim(), status: m.querySelector('#cq-status').value, notes: m.querySelector('#cq-notes').value.trim(), lines: lines });
      var rec = StuffMigrate.normalizeCustomerQuote(raw, { id: q ? q.id : null, dealId: lead.id, customerId: lead.customerId, at: at, by: currentUserName() });
      if (q) {
        var i = state.customerQuotes.indexOf(q);
        state.customerQuotes[i] = rec;
        logChange('update', 'quote', rec.id, 'Saved quote ' + StuffMigrate.quoteLabel(rec) + ' on ' + cardTitle(lead));
      } else {
        state.customerQuotes.push(rec);
        logChange('create', 'quote', rec.id, 'Added quote ' + StuffMigrate.quoteLabel(rec) + ' on ' + cardTitle(lead));
      }
      lead.updatedAt = at;
      closeJobModal();
      afterJobChange();
    });
  }

  // Lead detail: quotes, and either Mark won or what the won deal became.
  function renderLeadJobs(root, lead) {
    if (!root) return;
    var quotes = quotesForLead(lead.id);
    var html = '';
    if (!quotes.length) html += '<div class="contacts-empty">No quotes yet. Add one to fill SKU jobs from it when the deal is won.</div>';
    else {
      html += '<div class="table-wrap"><table class="kpi-table"><thead><tr><th>Quote</th><th>Status</th><th class="num">Lines</th><th class="num">Molds</th><th class="num">One-time $</th><th>Updated</th></tr></thead><tbody>';
      quotes.forEach(function (q) {
        var molds = (q.lines || []).reduce(function (s, l) { return s + (Number(l.moldsRequired) || 0); }, 0);
        var once = (q.lines || []).reduce(function (s, l) { return s + ['tooling', 'designDfm', 'prototyping', 'partnerServices'].reduce(function (t, k) { return t + (Number(l[k]) || 0); }, 0); }, 0);
        html += '<tr class="pv-row" data-quote-id="' + escapeHtml(q.id) + '"><td><strong>' + escapeHtml(StuffMigrate.quoteLabel(q)) + '</strong>' + (q.source && q.source !== 'manual' ? ' <span class="muted-note">from ' + escapeHtml(q.source) + '</span>' : '') +
          (/^https?:\/\//i.test(q.fileUrl || '') ? ' <a href="' + escapeHtml(q.fileUrl) + '" target="_blank" rel="noopener" data-quote-link="1">Quote PDF</a>' : '') + '</td>' +
          '<td><span class="badge quote-status ' + escapeHtml(q.status) + '">' + escapeHtml(QUOTE_STATUS_LABELS[q.status] || q.status) + '</span></td>' +
          '<td class="num">' + (q.lines || []).length + '</td><td class="num">' + molds + '</td><td class="num">' + formatMoney(once) + '</td>' +
          '<td>' + escapeHtml(q.updatedAt ? new Date(q.updatedAt).toLocaleDateString() : '') + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '<div class="contacts-toolbar"><button type="button" class="ghost" id="d-add-quote">Add quote</button>';
    if (StuffMigrate.quoteSentState(state, lead) === 'unsent') html += '<button type="button" class="ghost" id="d-mark-sent" title="Turns the card green">Mark quote sent</button>';
    var won = StuffMigrate.isClosedLead(lead);
    if (!won && lead.type !== 'internal') html += '<button type="button" id="d-mark-won">Mark won</button>';
    if (!won && lead.type !== 'internal' && lead.customerId) html += '<button type="button" class="ghost" id="d-add-payment" title="A Deposit, Design, Prototype or Tooling payment on this lead">Add payment</button>';
    html += '</div>';
    var paidInfo = !won ? StuffMigrate.soldPaidInfo(state, lead) : null;
    if (paidInfo && paidInfo.soldPaid) {
      html += '<p class="board-note visible paid-ready" id="d-paid-ready">Paid. Move to Pre-Production? ' + escapeHtml(soldPaidText(paidInfo)) +
        ' <button type="button" id="d-paid-won">Mark won</button></p>';
    }
    if (won) {
      var cust = getCustomer(lead.customerId);
      var aq = lead.acceptedQuoteId ? getCustomerQuote(lead.acceptedQuoteId) : null;
      html += '<p class="board-note visible">Won' + (lead.wonAt ? ' on ' + escapeHtml(new Date(lead.wonAt).toLocaleDateString()) : '') +
        (cust ? ' for ' + escapeHtml(cust.name) : '') + (aq ? ' with quote ' + escapeHtml(StuffMigrate.quoteLabel(aq)) : '') + '.</p>';
      var jobs = (state.skus || []).filter(function (s) { return s.dealId === lead.id; });
      if (jobs.length) {
        html += '<div class="projects-grid">';
        jobs.forEach(function (s) {
          html += '<div class="project-tile" data-sku-open="' + escapeHtml(s.id) + '"><div class="project-tile-main"><div class="project-tile-name">' + escapeHtml(skuTitle(s)) + ' <span class="badge badge-sku">' + escapeHtml(s.code || '') + '</span></div>' +
            '<div class="muted-note">' + escapeHtml(skuPlaceText(s)) + '</div></div><span class="card-value">' + formatMoney(totalValue(s)) + '</span></div>';
        });
        html += '</div>';
      }
      var legacy = projectsForLead(lead);
      if (legacy.length) {
        html += '<p class="muted-note">Archived projects: ' + legacy.map(function (p) { return '<button type="button" class="link-btn" data-open-project="' + escapeHtml(p.id) + '">' + escapeHtml(cardTitle(p)) + '</button>'; }).join(', ') + '</p>';
      }
    }
    root.innerHTML = html;
    root.querySelectorAll('[data-quote-id]').forEach(function (tr) {
      tr.addEventListener('click', function () { openCustomerQuoteModal({ leadId: lead.id, quoteId: tr.getAttribute('data-quote-id') }); });
    });
    root.querySelectorAll('[data-quote-link]').forEach(function (a) { a.addEventListener('click', function (e) { e.stopPropagation(); }); });
    root.querySelectorAll('[data-sku-open]').forEach(function (t) { t.addEventListener('click', function () { openDetail(t.getAttribute('data-sku-open')); }); });
    root.querySelectorAll('[data-open-project]').forEach(function (b) { b.addEventListener('click', function () { openDetail(b.getAttribute('data-open-project')); }); });
    root.querySelector('#d-add-quote').addEventListener('click', function () { openCustomerQuoteModal({ leadId: lead.id }); });
    var ms = root.querySelector('#d-mark-sent');
    if (ms) ms.addEventListener('click', function () {
      var n = StuffMigrate.markQuotesSent(state, lead, nowIso(), currentUserName());
      if (!n) return;
      lead.updatedAt = nowIso();
      logChange('update', 'lead', lead.id, 'Marked ' + n + ' quote' + (n === 1 ? '' : 's') + ' sent on ' + cardTitle(lead));
      afterJobChange();
      renderLeadJobs(root, lead);
    });
    var mw = root.querySelector('#d-mark-won');
    if (mw) mw.addEventListener('click', function () { openWonModal({ leadId: lead.id }); });
    var pw = root.querySelector('#d-paid-won');
    if (pw) pw.addEventListener('click', function () { openWonModal({ leadId: lead.id }); });
    var ap = root.querySelector('#d-add-payment');
    if (ap) ap.addEventListener('click', function () { openBillingChargeModal({ customerId: lead.customerId, dealId: lead.id, category: 'deposit' }); });
  }

  // ---------------------------------------------------------------------
  // Customer POs. A Production card is one PO line (SKU x PO).
  // ---------------------------------------------------------------------

  function poLineRowHtml(l, skuOpts) {
    return '<tr data-pol="' + escapeHtml(l.id || '') + '">' +
      '<td><select data-pl="skuId">' + skuOpts(l.skuId) + '</select></td>' +
      '<td><input type="number" step="any" min="0" data-pl="qty" value="' + escapeHtml(l.qty == null ? '' : l.qty) + '" /></td>' +
      '<td><input type="number" step="any" min="0" data-pl="unitPrice" value="' + escapeHtml(l.unitPrice == null ? '' : l.unitPrice) + '" /></td>' +
      '<td><input type="number" step="any" min="0" data-pl="amount" value="' + escapeHtml(l.amount == null ? '' : l.amount) + '" placeholder="qty x price" /></td>' +
      '<td><input type="date" data-pl="shipDate" value="' + escapeHtml(l.shipDate || '') + '" /></td>' +
      '<td><select data-pl="stage">' + poStageOptions(l.stage || StuffMigrate.poStageAt(state, 0)) + '</select></td></tr>';
  }

  // PO file link and where the PO came from (PO upload, #20).
  function poFileLineHtml(po) {
    if (!po) return '';
    var f = po.fileId ? (state.files || []).find(function (x) { return x.id === po.fileId; }) : null;
    var parts = [];
    if (f && f.url) parts.push('PO file: <a href="' + escapeHtml(f.url) + '" target="_blank" rel="noopener">' + escapeHtml(f.name || 'open') + '</a>');
    if (po.buyer) parts.push('Buyer: ' + escapeHtml(po.buyer));
    if (po.shipVia) parts.push('Ship: ' + escapeHtml(po.shipVia));
    if (po.source === 'po-import') parts.push('Uploaded by ' + escapeHtml(po.createdBy || 'a bot'));
    return parts.length ? '<p class="muted-note po-meta">' + parts.join(' &middot; ') + '</p>' : '';
  }

  function openPoModal(ctx) {
    ctx = ctx || {};
    var po = ctx.poId ? getCustomerPo(ctx.poId) : null;
    var sku = ctx.skuId ? getSku(ctx.skuId) : null;
    var customerId = po ? po.customerId : sku ? sku.customerId : (ctx.customerId || '');
    function skuOpts(sel) {
      var list = liveSkus().filter(function (s) { return !customerId || s.customerId === customerId || s.id === sel; });
      var h = '<option value="">Pick a SKU</option>';
      list.forEach(function (s) { h += '<option value="' + escapeHtml(s.id) + '"' + (s.id === sel ? ' selected' : '') + '>' + escapeHtml((s.code ? s.code + ' ' : '') + skuTitle(s)) + '</option>'; });
      return h;
    }
    var lines = po ? po.lines : [{ id: '', skuId: sku ? sku.id : '', qty: '', unitPrice: sku && sku.sellPrice !== '' ? sku.sellPrice : '', amount: '', shipDate: sku && sku.targetShipDate || '', stage: StuffMigrate.poStageAt(state, 0) }];
    var html = '<div class="modal-title-row"><h2>' + (po ? 'Customer PO ' + escapeHtml(po.poNumber || '(no number)') : 'Add customer PO') + '</h2></div><form id="po-form">' +
      '<div class="row"><div class="field"><label for="po-customer">Customer</label><select id="po-customer"' + (po || sku ? ' disabled' : '') + '>' + customerOptions(customerId, false) + '</select></div>' +
      '<div class="field"><label for="po-number">PO number</label><input type="text" id="po-number" value="' + escapeHtml(po ? po.poNumber : '') + '" /></div>' +
      '<div class="field"><label for="po-date">PO date</label><input type="date" id="po-date" value="' + escapeHtml(po ? po.poDate : '') + '" /></div>' +
      '<div class="field"><label for="po-terms">Terms</label><input type="text" id="po-terms" value="' + escapeHtml(po ? po.terms : '') + '" placeholder="Net 30" /></div>' +
      '<div class="field"><label for="po-required">Required</label><input type="date" id="po-required" value="' + escapeHtml(po ? po.requiredDate || '' : '') + '" /></div></div>' +
      poFileLineHtml(po) +
      '<div class="section-title">Lines</div><div class="table-wrap"><table class="kpi-table po-lines"><thead><tr><th>SKU</th><th>Qty</th><th>Unit price $</th><th>Amount $</th><th>Ship date</th><th>Stage</th></tr></thead><tbody id="po-lines">' +
      lines.map(function (l) { return poLineRowHtml(l, skuOpts); }).join('') + '</tbody></table></div>' +
      '<button type="button" class="ghost" id="po-add-line">+ Add line</button>' +
      '<div class="field"><label for="po-notes">Notes</label><textarea id="po-notes" rows="2">' + escapeHtml(po ? po.notes || '' : '') + '</textarea></div>' +
      '<p class="muted-note">Amount is optional; when blank the card uses qty x unit price. Lines are never deleted; move a finished one to Closed.</p>' +
      (po ? '<div id="po-kickoff" class="po-kickoff"></div>' : '') +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button><button type="submit" id="po-save">Save PO</button></div></form>';
    var m = openJobModal(html, 'lg');
    if (po) renderPoKickoff(m, po);
    var custSel = m.querySelector('#po-customer');
    custSel.addEventListener('change', function () {
      customerId = custSel.value;
      m.querySelectorAll('[data-pl="skuId"]').forEach(function (s) { var v = s.value; s.innerHTML = skuOpts(v); });
    });
    m.querySelector('#po-add-line').addEventListener('click', function () {
      m.querySelector('#po-lines').insertAdjacentHTML('beforeend', poLineRowHtml({ id: '', skuId: '', qty: '', unitPrice: '', amount: '', shipDate: '', stage: StuffMigrate.poStageAt(state, 0) }, skuOpts));
    });
    m.querySelector('#po-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!customerId) { alert('Pick a customer.'); return; }
      var at = nowIso(), by = currentUserName();
      var rows = [];
      var bad = false;
      m.querySelectorAll('#po-lines tr').forEach(function (tr) {
        var r = { id: tr.getAttribute('data-pol') || '' };
        tr.querySelectorAll('[data-pl]').forEach(function (inp) { r[inp.getAttribute('data-pl')] = inp.value.trim(); });
        var empty = !r.skuId && !r.qty && !r.unitPrice && !r.amount;
        if (empty && !r.id) return;
        if (!r.skuId) bad = true;
        rows.push(r);
      });
      if (bad) { alert('Every line needs a SKU.'); return; }
      if (!rows.length) { alert('Add at least one line.'); return; }
      var rec = po;
      var num = m.querySelector('#po-number').value.trim();
      if (!rec) {
        rec = { id: StuffMigrate.makeId('po'), customerId: customerId, poNumber: num, poDate: '', terms: '', fileId: null, status: 'open', notes: '', lines: [], createdAt: at, updatedAt: at };
        state.customerPos.push(rec);
      }
      rec.poNumber = num;
      rec.poDate = m.querySelector('#po-date').value;
      rec.terms = m.querySelector('#po-terms').value.trim();
      rec.requiredDate = m.querySelector('#po-required').value;
      rec.notes = m.querySelector('#po-notes').value.trim();
      rec.updatedAt = at;
      rows.forEach(function (r) {
        var line = r.id ? rec.lines.find(function (l) { return l.id === r.id; }) : null;
        var fresh = !line;
        if (fresh) { line = { id: StuffMigrate.makeId('pol'), stageEnteredAt: at }; rec.lines.push(line); }
        var before = JSON.stringify(line);
        var prevStage = line.stage;
        line.skuId = r.skuId;
        line.qty = numOrBlank(r.qty);
        line.unitPrice = numOrBlank(r.unitPrice);
        line.amount = numOrBlank(r.amount);
        line.shipDate = r.shipDate;
        line.stage = r.stage;
        line.status = poStatusForStage(r.stage);
        if (prevStage !== line.stage) line.stageEnteredAt = at;
        if (fresh || before !== JSON.stringify(line)) {
          addSkuEvent(line.skuId, 'po', 'PO ' + (rec.poNumber || '(no number)') + (fresh ? ' added' : ' updated') + ': qty ' + (line.qty === '' ? '?' : line.qty) +
            (line.unitPrice !== '' ? ' at $' + line.unitPrice : '') + ', ' + formatMoney(StuffMigrate.poLineAmount(line)) + (line.shipDate ? ', ship ' + line.shipDate : '') + ', ' + stageLabel(line.stage));
        }
      });
      logChange(po ? 'update' : 'create', 'po', rec.id, (po ? 'Saved' : 'Added') + ' customer PO ' + (rec.poNumber || '(no number)') + ' with ' + rec.lines.length + ' line(s)');
      closeJobModal();
      afterJobChange();
    });
  }

  // ---------------------------------------------------------------------
  // Production views (issue #22): Active, POs (kickoff kanban), By due date, and the
  // existing board. Rules live in migrate-v12.js. The last view is kept per browser.
  // ---------------------------------------------------------------------
  var PROD_VIEW_KEY = 'matrix-crm-v12-production-view';
  var PROD_VIEWS = [['active', 'Active'], ['pos', 'POs'], ['due', 'By due date'], ['board', 'Board']];
  var dragPoId = null;

  function productionView() {
    var v = null;
    try { v = localStorage.getItem(PROD_VIEW_KEY); } catch (e) { v = null; }
    return PROD_VIEWS.some(function (x) { return x[0] === v; }) ? v : 'active';
  }
  function setProductionView(v) {
    try { localStorage.setItem(PROD_VIEW_KEY, v); } catch (e) { /* ignore */ }
    renderBoard();
  }
  function isProductionBoard(sec) { return !!(sec && sec.cardKind === 'po-line'); }

  // Draws the view tabs on the Production board. Returns true when a non-board view took over.
  function renderProductionViews() {
    var bar = document.getElementById('prod-view-bar');
    var root = document.getElementById('prod-view-root');
    var board = document.getElementById('board');
    if (!bar || !root) return false;
    var sec = currentSection();
    if (!isProductionBoard(sec)) {
      bar.hidden = true; root.hidden = true; root.innerHTML = ''; board.hidden = false;
      return false;
    }
    var view = stagesEditMode ? 'board' : productionView();
    bar.hidden = false;
    bar.innerHTML = PROD_VIEWS.map(function (x) {
      return '<button type="button" class="prod-view-tab' + (x[0] === view ? ' active' : '') + '" data-prod-view="' + x[0] + '">' + escapeHtml(x[1]) + '</button>';
    }).join('');
    bar.querySelectorAll('[data-prod-view]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (stagesEditMode && b.getAttribute('data-prod-view') !== 'board') { showToast('Finish editing stages first.'); return; }
        setProductionView(b.getAttribute('data-prod-view'));
      });
    });
    if (view === 'board') { root.hidden = true; root.innerHTML = ''; board.hidden = false; return false; }
    board.hidden = true;
    board.innerHTML = '';
    root.hidden = false;
    if (view === 'active') renderActiveView(root);
    else if (view === 'pos') renderPoKickoffBoard(root);
    else renderDueView(root);
    return true;
  }

  function daysLeftHtml(r) {
    if (r.daysLeft == null) return '<span class="muted-note">No date</span>';
    var txt = r.daysLeft < 0 ? (-r.daysLeft) + (r.daysLeft === -1 ? ' day late' : ' days late') :
      r.daysLeft === 0 ? 'Today' : r.daysLeft + (r.daysLeft === 1 ? ' day' : ' days');
    return '<span class="due-left' + (r.urgency ? ' due-' + r.urgency : '') + '">' + escapeHtml(txt) + '</span>';
  }

  function productionRowHtml(r, withStage) {
    var sku = r.skuId ? getSku(r.skuId) : null;
    var open = r.kind === 'po-line' ? ' data-open-po="' + escapeHtml(r.poId) + '" data-open-line="' + escapeHtml(r.lineId) + '"' : ' data-open-sku="' + escapeHtml(r.id) + '"';
    return '<tr class="clickable-row' + (r.urgency ? ' row-' + r.urgency : '') + '"' + open + '>' +
      '<td>' + escapeHtml(customerNameFor({ customerId: r.customerId })) + '</td>' +
      '<td>' + escapeHtml(sku ? (sku.code ? sku.code + ' ' : '') + skuTitle(sku) : 'SKU missing') + '</td>' +
      '<td>' + escapeHtml(r.poNumber || (r.kind === 'sku' ? 'SKU job' : '')) + '</td>' +
      '<td class="num">' + (r.qty === '' || r.qty == null ? '' : escapeHtml(Number(r.qty).toLocaleString('en-US'))) + '</td>' +
      '<td>' + escapeHtml(r.due || '') + '</td>' +
      '<td>' + daysLeftHtml(r) + '</td>' +
      (withStage ? '<td>' + escapeHtml(stageLabel(r.stage)) + '</td>' : '') +
      '<td class="num">' + formatMoney(r.value) + '</td></tr>';
  }
  function productionHeadHtml(withStage) {
    return '<thead><tr><th>Customer</th><th>SKU</th><th>PO #</th><th class="num">Qty</th><th>Due date</th><th>Days left</th>' +
      (withStage ? '<th>Stage</th>' : '') + '<th class="num">Value</th></tr></thead>';
  }
  function bindProductionRows(root) {
    root.querySelectorAll('[data-open-po]').forEach(function (tr) {
      tr.addEventListener('click', function () { openPoModal({ poId: tr.getAttribute('data-open-po'), lineId: tr.getAttribute('data-open-line') || null }); });
    });
    root.querySelectorAll('[data-open-sku]').forEach(function (tr) {
      tr.addEventListener('click', function () { openDetail(tr.getAttribute('data-open-sku')); });
    });
  }

  function renderActiveView(root) {
    var rows = StuffMigrate.activeProductionRows(state, todayStr());
    var order = [];
    (state.sections || []).forEach(function (s) { (s.stages || []).forEach(function (st) { if (order.indexOf(st) === -1) order.push(st); }); });
    var groups = {};
    rows.forEach(function (r) { (groups[r.stage] = groups[r.stage] || []).push(r); });
    var keys = Object.keys(groups).sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia === -1 ? 1e6 : ia) - (ib === -1 ? 1e6 : ib);
    });
    var total = rows.reduce(function (s, r) { return s + (Number(r.value) || 0); }, 0);
    var html = '<div class="prod-view" id="prod-active"><p class="muted-note">Open PO lines and SKU jobs on Operations boards, by stage, soonest due first. ' +
      rows.length + (rows.length === 1 ? ' row, ' : ' rows, ') + formatMoney(total) + '.</p>';
    if (!rows.length) html += '<p class="muted-note">Nothing in production.</p>';
    else {
      html += '<div class="table-wrap"><table class="kpi-table prod-table">' + productionHeadHtml(true) + '<tbody>';
      keys.forEach(function (k) {
        var g = groups[k];
        html += '<tr class="group-row"><th colspan="8">' + escapeHtml(stageLabel(k) || 'No stage') + ' <span class="muted-note">' + g.length + '</span></th></tr>';
        g.forEach(function (r) { html += productionRowHtml(r, true); });
      });
      html += '</tbody></table></div>';
    }
    root.innerHTML = html + '</div>';
    bindProductionRows(root);
  }

  function renderDueView(root) {
    var groups = StuffMigrate.poLinesByDue(state, todayStr());
    var html = '<div class="prod-view" id="prod-due"><p class="muted-note">Open PO lines by ship or required date. Weeks start on Monday.</p>';
    groups.forEach(function (g) {
      if (g.id === 'no-date' && !g.rows.length) return;
      html += '<div class="section-title" data-due-bucket="' + g.id + '">' + escapeHtml(g.label) + ' <span class="muted-note">' + g.rows.length + '</span></div>';
      html += g.rows.length ? '<div class="table-wrap"><table class="kpi-table prod-table">' + productionHeadHtml(true) + '<tbody>' +
        g.rows.map(function (r) { return productionRowHtml(r, true); }).join('') + '</tbody></table></div>' : '<p class="muted-note">Nothing.</p>';
    });
    root.innerHTML = html + '</div>';
    bindProductionRows(root);
  }

  function poTotals(po) {
    var qty = 0, amount = 0;
    (po.lines || []).forEach(function (l) { qty += Number(l.qty) || 0; amount += StuffMigrate.poLineAmount(l); });
    return { qty: qty, amount: amount, lines: (po.lines || []).length };
  }

  function renderPoKickoffBoard(root) {
    var cols = StuffMigrate.KICKOFF_STAGES;
    var byStage = {};
    (state.customerPos || []).forEach(function (po) { (byStage[StuffMigrate.poKickoffStage(po)] = byStage[StuffMigrate.poKickoffStage(po)] || []).push(po); });
    var html = '<div class="prod-view" id="prod-pos"><p class="muted-note">One card per customer PO. Drag a card to move it, or open it for the kickoff checklist. In production, Shipped and Closed move its lines on the Production board too.</p><div class="kickoff-board">';
    cols.forEach(function (c) {
      var list = (byStage[c[0]] || []).slice().sort(function (a, b) { return String(a.requiredDate || '9999').localeCompare(String(b.requiredDate || '9999')); });
      var sum = list.reduce(function (s, po) { return s + poTotals(po).amount; }, 0);
      html += '<div class="column kickoff-col" data-kickoff-stage="' + c[0] + '"><div class="column-header"><div class="col-name-row"><span class="col-name">' + escapeHtml(c[1]) + '</span></div>' +
        '<div class="col-stats"><span class="column-total">' + formatMoney(sum) + '</span><span class="column-count">' + list.length + '</span></div></div><div class="cards">';
      list.forEach(function (po) {
        var t = poTotals(po), p = StuffMigrate.kickoffProgress(po);
        html += '<div class="card card-po card-kickoff" draggable="true" data-po-card="' + escapeHtml(po.id) + '">' +
          '<div class="card-customer">' + escapeHtml(customerNameFor(po)) + '</div>' +
          '<div class="card-title-row"><div class="card-title">PO ' + escapeHtml(po.poNumber || '(no number)') + '</div></div>' +
          '<div class="card-sub">' + (po.poDate ? 'PO date ' + escapeHtml(po.poDate) : 'No PO date') + (po.requiredDate ? ' / required ' + escapeHtml(po.requiredDate) : '') + '</div>' +
          '<div class="card-face"><span class="face-item"><span class="face-k">Qty</span> <strong>' + t.qty.toLocaleString('en-US') + '</strong></span>' +
          '<span class="face-item"><span class="face-k">Value</span> <strong>' + formatMoney(t.amount) + '</strong></span>' +
          '<span class="face-item"><span class="face-k">Lines</span> <strong>' + t.lines + '</strong></span></div>' +
          '<div class="card-meta"><span class="badge badge-kickoff' + (p.done === p.total ? ' done' : '') + '" data-kickoff-progress>Kickoff ' + p.done + '/' + p.total + '</span>' +
          (po.requiredDate && isOverdue(po.requiredDate) && StuffMigrate.poKickoffStage(po) !== 'closed' && StuffMigrate.poKickoffStage(po) !== 'shipped' ? '<span class="badge badge-overdue">Late</span>' : '') + '</div></div>';
      });
      html += '</div></div>';
    });
    root.innerHTML = html + '</div></div>';
    root.querySelectorAll('[data-po-card]').forEach(function (el) {
      var id = el.getAttribute('data-po-card');
      el.addEventListener('dragstart', function (e) {
        dragPoId = id; el.classList.add('dragging');
        try { e.dataTransfer.setData('text/x-po', id); e.dataTransfer.effectAllowed = 'move'; } catch (err) { /* ignore */ }
      });
      el.addEventListener('dragend', function () { el.classList.remove('dragging'); dragPoId = null; root.querySelectorAll('.drag-over').forEach(function (c) { c.classList.remove('drag-over'); }); });
      el.addEventListener('click', function () { openPoModal({ poId: id }); });
    });
    root.querySelectorAll('[data-kickoff-stage]').forEach(function (col) {
      col.addEventListener('dragover', function (e) { if (!dragPoId) return; e.preventDefault(); col.classList.add('drag-over'); });
      col.addEventListener('dragleave', function (e) { if (!col.contains(e.relatedTarget)) col.classList.remove('drag-over'); });
      col.addEventListener('drop', function (e) {
        e.preventDefault();
        var id = dragPoId;
        try { id = e.dataTransfer.getData('text/x-po') || id; } catch (err) { /* ignore */ }
        dragPoId = null;
        var po = id ? getCustomerPo(id) : null;
        if (po && movePoKickoff(po, col.getAttribute('data-kickoff-stage'))) renderBoard();
        else col.classList.remove('drag-over');
      });
    });
  }

  // Move a PO between kickoff columns, logged like other PO moves. Returns true when it changed.
  function movePoKickoff(po, stage) {
    var from = StuffMigrate.poKickoffStage(po);
    if (from === stage && po.kickoffStage === stage) return false;
    var res = StuffMigrate.setPoKickoffStage(state, po, stage, { at: nowIso() });
    if (!res.changed) return false;
    var label = 'PO ' + (po.poNumber || '(no number)');
    logChange('move', 'po', po.id, 'Kickoff ' + StuffMigrate.kickoffStageLabel(from) + ' to ' + StuffMigrate.kickoffStageLabel(stage) +
      (res.lines.length ? '; ' + res.lines.length + ' line(s) to ' + stageLabel(res.lines[0].toStage) : ''));
    var skus = {};
    (po.lines || []).forEach(function (l) { if (l.skuId) skus[l.skuId] = true; });
    Object.keys(skus).forEach(function (sid) { addSkuEvent(sid, 'po', label + ': kickoff ' + StuffMigrate.kickoffStageLabel(from) + ' to ' + StuffMigrate.kickoffStageLabel(stage)); });
    save();
    return true;
  }

  // Kickoff panel inside the PO modal. Changes save right away; the form's line stages are
  // kept in step so Save PO never undoes a kickoff move.
  function renderPoKickoff(m, po) {
    var box = m.querySelector('#po-kickoff');
    if (!box) return;
    var stage = StuffMigrate.poKickoffStage(po);
    var p = StuffMigrate.kickoffProgress(po);
    var mls = StuffMigrate.materialLinesForPo(state, po.id);
    var html = '<div class="section-title">Kickoff <span class="muted-note" id="po-kick-progress">' + p.done + '/' + p.total + '</span></div>' +
      '<div class="row"><div class="field"><label for="po-kick-stage">Kickoff column</label><select id="po-kick-stage">' +
      StuffMigrate.KICKOFF_STAGES.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === stage ? ' selected' : '') + '>' + escapeHtml(s[1]) + '</option>'; }).join('') +
      '</select></div></div><ul class="kickoff-list">';
    StuffMigrate.poKickoffItems(po).forEach(function (it) {
      html += '<li><label><input type="checkbox" data-kick="' + it.id + '"' + (it.done ? ' checked' : '') + ' /> ' + escapeHtml(it.label) + (it.optional ? ' <span class="muted-note">(optional)</span>' : '') + '</label>' +
        (it.done ? '<span class="muted-note kickoff-when">Done ' + escapeHtml([it.by, String(it.at).slice(0, 10)].filter(Boolean).join(', ')) + '</span>' : '') +
        ' <input type="text" class="kickoff-note" data-kick-note="' + it.id + '" value="' + escapeHtml(it.note) + '" placeholder="Note" /></li>';
    });
    html += '</ul><div class="section-title">Material</div>';
    if (mls.length) {
      html += '<div class="table-wrap"><table class="kpi-table" id="po-material-lines"><thead><tr><th>Material</th><th class="num">Qty</th><th>Vendor</th><th>Vendor PO #</th><th>Expected</th><th>Status</th></tr></thead><tbody>' +
        mls.map(function (ml) {
          var mat = getMaterial(ml.materialId), ven = getVendor(ml.vendorId);
          return '<tr data-ml="' + escapeHtml(ml.id) + '"><td>' + escapeHtml(mat ? mat.name : 'Not picked') + '</td><td class="num">' + escapeHtml(ml.qtyNeeded === '' ? '' : String(ml.qtyNeeded) + ' ' + (ml.unit || '')) + '</td>' +
            '<td>' + escapeHtml(ven ? ven.name : '') + '</td><td>' + escapeHtml(ml.vendorPoNumber || '') + '</td><td>' + escapeHtml(ml.expectedAt || '') + '</td>' +
            '<td><select data-ml-status="' + escapeHtml(ml.id) + '">' + StuffMigrate.MATERIAL_LINE_STATUSES.map(function (s) {
              return '<option value="' + s + '"' + (s === (ml.status || 'ordered') ? ' selected' : '') + '>' + (s === 'ordered' ? 'Ordered' : s === 'received' ? 'Received' : 'Cancelled') + '</option>';
            }).join('') + '</select></td></tr>';
        }).join('') + '</tbody></table></div>';
    } else html += '<p class="muted-note">No material ordered for this PO yet.</p>';
    html += '<button type="button" class="secondary" id="po-order-material">Order material</button><div id="po-material-draft"></div>';
    box.innerHTML = html;

    box.querySelector('#po-kick-stage').addEventListener('change', function (e) {
      if (movePoKickoff(po, e.target.value)) syncPoFormStages(m, po);
      renderPoKickoff(m, po);
    });
    box.querySelectorAll('[data-kick]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var id = cb.getAttribute('data-kick');
        var noteEl = box.querySelector('[data-kick-note="' + id + '"]');
        kickoffItemChange(po, id, cb.checked, noteEl ? noteEl.value : null);
        renderPoKickoff(m, po);
      });
    });
    box.querySelectorAll('[data-kick-note]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var id = inp.getAttribute('data-kick-note');
        var item = StuffMigrate.poKickoffItems(po).find(function (x) { return x.id === id; });
        kickoffItemChange(po, id, item && item.done, inp.value);
      });
    });
    box.querySelectorAll('[data-ml-status]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var ml = (state.materialLines || []).find(function (x) { return x.id === sel.getAttribute('data-ml-status'); });
        if (!ml || ml.status === sel.value) return;
        var was = ml.status || 'ordered', at = nowIso();
        ml.status = sel.value;
        ml.receivedAt = sel.value === 'received' ? todayStr() : '';
        ml.updatedAt = at;
        logChange('update', 'material-line', ml.id, 'PO ' + (po.poNumber || '') + ' material ' + was + ' to ' + ml.status);
        var live = StuffMigrate.materialLinesForPo(state, po.id).filter(function (x) { return x.status !== 'cancelled'; });
        if (live.length && live.every(function (x) { return x.status === 'received'; })) kickoffItemChange(po, 'material-received', true, null, true);
        po.updatedAt = at;
        save();
        renderPoKickoff(m, po);
      });
    });
    box.querySelector('#po-order-material').addEventListener('click', function () { renderMaterialDraft(m, po); });
  }

  function kickoffItemChange(po, id, done, note, quiet) {
    var res = StuffMigrate.setKickoffItem(po, id, !!done, { at: nowIso(), by: currentUserName(), note: note });
    if (!res.changed) return false;
    var def = StuffMigrate.KICKOFF_ITEMS.find(function (x) { return x.id === id; });
    logChange('update', 'po', po.id, 'PO ' + (po.poNumber || '(no number)') + ' kickoff: ' + (def ? def.label : id) + (done ? ' done' : ' not done') +
      (res.stageTo ? '; moved to ' + StuffMigrate.kickoffStageLabel(res.stageTo) : ''));
    po.updatedAt = nowIso();
    if (!quiet) save();
    return true;
  }

  function syncPoFormStages(m, po) {
    (po.lines || []).forEach(function (l) {
      var tr = m.querySelector('#po-lines tr[data-pol="' + l.id + '"]');
      var sel = tr && tr.querySelector('[data-pl="stage"]');
      if (sel) sel.value = l.stage;
    });
  }

  function renderMaterialDraft(m, po) {
    var box = m.querySelector('#po-material-draft');
    var drafts = StuffMigrate.prefillMaterialLines(state, po, { pickQuote: bestCurrentQuote });
    if (!drafts.length) { box.innerHTML = '<p class="muted-note">Every line already has its material ordered.</p>'; return; }
    var mats = (state.materials || []).slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
    var vens = (state.vendors || []).slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
    function opts(list, sel, blank) {
      return '<option value="">' + blank + '</option>' + list.map(function (x) { return '<option value="' + escapeHtml(x.id) + '"' + (x.id === sel ? ' selected' : '') + '>' + escapeHtml(x.name) + '</option>'; }).join('');
    }
    var html = '<div class="table-wrap"><table class="kpi-table" id="po-material-form"><thead><tr><th>For</th><th>Material</th><th class="num">Qty needed</th><th>Unit</th><th>Vendor</th><th>Vendor PO #</th><th>Expected</th></tr></thead><tbody>' +
      drafts.map(function (d, i) {
        var sku = getSku(d.skuId);
        return '<tr data-md="' + i + '"><td>' + escapeHtml(sku ? sku.code || skuTitle(sku) : '') + (d.why ? '<div class="muted-note">' + escapeHtml(d.why) + '</div>' : '') + '</td>' +
          '<td><select data-mf="materialId">' + opts(mats, d.materialId, 'Pick material') + '</select></td>' +
          '<td><input type="number" step="any" data-mf="qtyNeeded" value="' + escapeHtml(d.qtyNeeded === '' ? '' : String(d.qtyNeeded)) + '" /></td>' +
          '<td><input type="text" data-mf="unit" value="' + escapeHtml(d.unit) + '" size="4" /></td>' +
          '<td><select data-mf="vendorId">' + opts(vens, d.vendorId, 'Pick vendor') + '</select></td>' +
          '<td><input type="text" data-mf="vendorPoNumber" /></td><td><input type="date" data-mf="expectedAt" /></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="muted-note">Qty is PO qty x qty per part on the SKU bill of materials, plus scrap. Vendor is the best current quote. Saving records the order here; it does not email the vendor.</p>' +
      '<div class="admin-actions"><button type="button" id="po-material-save">Save material order</button> <button type="button" class="ghost" id="po-material-cancel">Cancel</button></div>';
    box.innerHTML = html;
    box.querySelector('#po-material-cancel').addEventListener('click', function () { box.innerHTML = ''; });
    box.querySelector('#po-material-save').addEventListener('click', function () {
      var rows = [];
      box.querySelectorAll('tr[data-md]').forEach(function (tr) {
        var d = Object.assign({}, drafts[Number(tr.getAttribute('data-md'))]);
        tr.querySelectorAll('[data-mf]').forEach(function (inp) { d[inp.getAttribute('data-mf')] = inp.value.trim(); });
        if (!d.materialId && !d.qtyNeeded && !d.vendorId && !d.vendorPoNumber) return;
        rows.push(d);
      });
      if (!rows.length) { alert('Fill in at least one material line.'); return; }
      var made = StuffMigrate.orderMaterialForPo(state, po, rows, { at: nowIso(), by: currentUserName() });
      made.forEach(function (ml) {
        var mat = getMaterial(ml.materialId), ven = getVendor(ml.vendorId);
        logChange('create', 'material-line', ml.id, 'PO ' + (po.poNumber || '(no number)') + ' material ordered: ' + (mat ? mat.name : 'material not picked') +
          (ml.qtyNeeded !== '' ? ' ' + ml.qtyNeeded + ' ' + ml.unit : '') + (ven ? ' from ' + ven.name : '') + (ml.vendorPoNumber ? ', vendor PO ' + ml.vendorPoNumber : ''));
      });
      logChange('update', 'po', po.id, 'PO ' + (po.poNumber || '(no number)') + ' kickoff: Order material done (' + made.length + ' material line(s))');
      po.updatedAt = nowIso();
      save();
      renderPoKickoff(m, po);
      showToast('Material order saved: ' + made.length + ' line(s).');
    });
  }

  // ---------------------------------------------------------------------
  // Add SKU (SKUs page, Customers page, Add button on a SKU board)
  // ---------------------------------------------------------------------

  function openAddSkuModal(ctx) {
    ctx = ctx || {};
    var stage = ctx.stage !== undefined ? ctx.stage : StuffMigrate.skuStageAt(state, 0);
    var html = '<div class="modal-title-row"><h2>Add SKU</h2></div><form id="as-form">' +
      '<div class="field"><label for="as-customer">Customer</label><select id="as-customer" required>' + customerOptions(ctx.customerId || '', false) + '</select></div>' +
      '<div class="row"><div class="field"><label for="as-code">Part number / SKU code</label><input type="text" id="as-code" placeholder="Leave blank to suggest one" /></div>' +
      '<div class="field"><label for="as-name">Name</label><input type="text" id="as-name" required /></div></div>' +
      '<div class="row"><div class="field"><label for="as-size">Size</label><input type="text" id="as-size" /></div><div class="field"><label for="as-style">Style</label><input type="text" id="as-style" /></div>' +
      '<div class="field"><label for="as-color">Color</label><input type="text" id="as-color" /></div></div>' +
      '<div class="row"><div class="field"><label for="as-material">Material</label><input type="text" id="as-material" /></div>' +
      '<div class="field"><label for="as-price">Unit price $</label><input type="number" id="as-price" step="any" min="0" /></div>' +
      '<div class="field"><label for="as-stage">Board</label><select id="as-stage">' + skuBoardStageOptions(stage, true) + '</select></div></div>' +
      '<div class="field"><label for="as-notes">Notes</label><textarea id="as-notes" rows="2"></textarea></div>' +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button><button type="submit" id="as-save">Add SKU</button></div></form>';
    var m = openJobModal(html, 'sm');
    m.querySelector('#as-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var cid = m.querySelector('#as-customer').value;
      if (!cid || !getCustomer(cid)) { alert('Pick a customer. Every SKU belongs to one.'); return; }
      var name = m.querySelector('#as-name').value.trim();
      if (!name) { alert('Name is required.'); return; }
      var at = nowIso();
      var sku = StuffMigrate.blankSku({
        customerId: cid, name: name, code: m.querySelector('#as-code').value.trim() || suggestCodeFor(cid, name),
        size: m.querySelector('#as-size').value.trim(), style: m.querySelector('#as-style').value.trim(), color: m.querySelector('#as-color').value.trim(),
        material: m.querySelector('#as-material').value.trim(), sellPrice: numOrBlank(m.querySelector('#as-price').value), notes: m.querySelector('#as-notes').value.trim(),
        createdAt: at, updatedAt: at
      });
      StuffMigrate.setSkuStage(state, sku, m.querySelector('#as-stage').value, at);
      state.skus.push(sku);
      addSkuEvent(sku.id, 'created', 'SKU ' + sku.code + ' created for ' + getCustomer(cid).name);
      logChange('create', 'sku', sku.id, sku.code + ' for ' + cid);
      closeJobModal();
      save();
      openDetail(sku.id);
    });
  }

  // ---------------------------------------------------------------------
  // Fill from quote / re-apply: old vs new per field, hand edits unticked by default.
  // ---------------------------------------------------------------------

  function fmtField(field, v) {
    if (v === '' || v == null) return '(blank)';
    if (field === 'tiers') return (v || []).length ? tiersText(v).replace(/\n/g, '; ') : '(blank)';
    if (/^values\./.test(field)) return formatMoney(v);
    if (field === 'sellPrice') return '$' + v;
    return String(v);
  }

  function openQuoteApplyModal(sku, quote, line) {
    var d = StuffMigrate.quoteDiff(sku, quote, line);
    if (!d.rows.length) {
      StuffMigrate.applyQuoteToSku(state, sku, quote, line, { by: currentUserName() });
      save();
      renderApp();
      showToast('The SKU already matches quote ' + StuffMigrate.quoteLabel(quote) + '.');
      return;
    }
    var html = '<div class="modal-title-row"><h2>Fill from quote ' + escapeHtml(StuffMigrate.quoteLabel(quote)) + '</h2></div><form id="qa-form">' +
      '<p class="muted-note">Tick the values to take from the quote. Values edited by hand are unticked so they are not overwritten by accident.</p>' +
      '<div class="table-wrap"><table class="kpi-table"><thead><tr><th>Use quote</th><th>Field</th><th>On the SKU now</th><th>On the quote</th></tr></thead><tbody>' +
      d.rows.map(function (r) {
        return '<tr><td><input type="checkbox" data-qa="' + escapeHtml(r.field) + '"' + (r.handEdited ? '' : ' checked') + ' /></td><td>' + escapeHtml(r.label) +
          (r.handEdited ? ' <span class="badge badge-overdue">edited by hand</span>' : '') + '</td><td>' + escapeHtml(fmtField(r.field, r.from)) + '</td><td>' + escapeHtml(fmtField(r.field, r.to)) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      (d.missing.length ? '<p class="muted-note">Not on the quote (left as is and flagged): ' + escapeHtml(d.missing.map(function (f) { return StuffMigrate.QUOTE_FIELD_LABELS[f] || f; }).join(', ')) + '</p>' : '') +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button><button type="submit" id="qa-apply">Apply ticked values</button></div></form>';
    var m = openJobModal(html, 'lg');
    m.querySelector('#qa-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = [];
      m.querySelectorAll('[data-qa]').forEach(function (c) { if (c.checked) fields.push(c.getAttribute('data-qa')); });
      var res = StuffMigrate.applyQuoteToSku(state, sku, quote, line, { fields: fields, by: currentUserName() });
      if (!line.skuId) line.skuId = sku.id;
      closeJobModal();
      skuDraft = null;
      afterJobChange();
      showToast(res.applied.length + ' value' + (res.applied.length === 1 ? '' : 's') + ' taken from the quote.');
    });
  }

  // Quotes a SKU can be filled from: its own deal's quotes first, then its customer's.
  function quotesForSku(sku) {
    return (state.customerQuotes || []).filter(function (q) {
      return (sku.dealId && q.dealId === sku.dealId) || (sku.customerId && q.customerId === sku.customerId);
    });
  }

  // "Job and value" pane of the SKU editor.
  function skuJobPaneHtml(sku) {
    var v = sku.values || {};
    var html = '<div class="row"><div class="field"><label for="sk-customer">Customer</label><select id="sk-customer">' + customerOptions(sku.customerId, false) + '</select></div>' +
      '<div class="field"><label for="sk-stage">Board and stage</label><select id="sk-stage">' + skuBoardStageOptions(sku.stage, true) + '</select></div></div>';
    html += '<div class="row">' +
      '<div class="field"><label for="sk-molds">Molds required</label><input type="number" id="sk-molds" step="1" min="0" value="' + escapeHtml(sku.moldsRequired == null ? '' : sku.moldsRequired) + '" placeholder="' + escapeHtml(moldsBlankText(sku)) + '" /></div>' +
      '<div class="field"><label for="sk-annual">Annual qty</label><input type="number" id="sk-annual" step="any" min="0" value="' + escapeHtml(sku.annualQty == null ? '' : sku.annualQty) + '" /></div>' +
      '<div class="field"><label for="sk-shipdate">Target ship date</label><input type="date" id="sk-shipdate" value="' + escapeHtml(sku.targetShipDate || '') + '" /></div></div>';
    html += '<h4 class="pane-h">Value</h4><div class="row values-grid">';
    SKU_MONEY_KEYS.forEach(function (k) {
      var tag = '';
      if (sku.prefilled && ('values.' + k) in sku.prefilled) tag = StuffMigrate.isHandEdited(sku, 'values.' + k) ? ' <span class="src-tag edited">edited</span>' : ' <span class="src-tag">quote</span>';
      if ((sku.quoteMissing || []).indexOf('values.' + k) !== -1) tag = ' <span class="src-tag missing">not on quote</span>';
      html += '<div class="field"><label for="sk-v-' + k + '">' + escapeHtml(MONEY_LABELS[k]) + ' ($)' + tag + '</label><input type="number" id="sk-v-' + k + '" min="0" step="any" value="' + escapeHtml(Number(v[k]) || 0) + '" /></div>';
    });
    html += '</div><p class="totals-line">Pre-Production: <strong id="sk-prepro">' + formatMoney(StuffMigrate.preproValue(v)) + '</strong> &nbsp; Mold Tooling: <strong id="sk-tooling">' + formatMoney(StuffMigrate.toolingValue(v)) + '</strong> &nbsp; Estimated ARR: <strong id="sk-arr">' + formatMoney(v.productionArr) + '</strong>' +
      ' &nbsp; Open POs: <strong>' + formatMoney(StuffMigrate.openPoAmountForSku(state, sku.id)) + '</strong></p>';
    // #102: True ARR uses annual qty x sell price when both are set; otherwise this ARR, marked when it is our estimate.
    var skuArr = StuffMigrate.skuArrInfo(sku);
    html += '<label class="check-line"><input type="checkbox" id="sk-arrEstimated"' + (sku.arrEstimated === true ? ' checked' : '') + ' /> ARR is our estimate</label>' +
      '<p class="muted-note" id="sk-arr-note">True ARR for this job: ' + formatMoney(skuArr.arr) + (skuArr.estimated ? '* (estimate)' : '') + '</p>';
    html += '<div class="field"><label for="sk-tiers">Qty ladder (one tier per line, like 5000 @ 0.55)</label><textarea id="sk-tiers" rows="3">' + escapeHtml(tiersText(sku.tiers)) + '</textarea></div>';
    html += '<h4 class="pane-h">Quote</h4>';
    var quotes = quotesForSku(sku);
    if (sku.source) {
      var sq = getCustomerQuote(sku.source.quoteId);
      html += '<p>Filled from quote <strong>' + escapeHtml(StuffMigrate.quoteLabel({ number: sku.source.number, revision: sku.source.revision })) + '</strong>' + (sq ? '' : ' <span class="muted-note">(quote record not found)</span>') + '.</p>';
      if ((sku.quoteMissing || []).length) html += '<p class="warn-note">Not on the quote: ' + escapeHtml(sku.quoteMissing.map(function (f) { return StuffMigrate.QUOTE_FIELD_LABELS[f] || f; }).join(', ')) + '</p>';
    } else {
      html += '<p class="muted-note">Not filled from a quote.</p>';
    }
    if (quotes.length) {
      html += '<div class="row"><div class="field"><label for="sk-q-line">Quote line</label><select id="sk-q-line">';
      quotes.forEach(function (q) {
        (q.lines || []).forEach(function (l) {
          var sel = sku.source && sku.source.quoteId === q.id && sku.source.lineId === l.id;
          html += '<option value="' + escapeHtml(q.id + '|' + l.id) + '"' + (sel ? ' selected' : '') + '>' + escapeHtml(StuffMigrate.quoteLabel(q) + ' / ' + (l.productName || 'line')) + '</option>';
        });
      });
      html += '</select></div><div class="field"><label>&nbsp;</label><button type="button" class="ghost" id="sk-q-apply">' + (sku.source ? 'Re-apply quote' : 'Fill from quote') + '</button></div></div>';
    } else {
      html += '<p class="muted-note">Add quotes on the won lead to fill this SKU from one.</p>';
    }
    if (sku.legacyProjectId) {
      var lp = getDeal(sku.legacyProjectId);
      html += '<p class="muted-note">Moved from project <button type="button" class="link-btn" id="sk-legacy">' + escapeHtml(lp ? cardTitle(lp) : sku.legacyProjectId) + '</button> (archived; its files and notes are kept there).</p>';
    }
    return html;
  }

  function bindSkuJobPane(root, sku) {
    function refreshTotals() {
      var o = {};
      SKU_MONEY_KEYS.forEach(function (k) { var el = root.querySelector('#sk-v-' + k); o[k] = el ? Number(el.value) || 0 : 0; });
      var p = root.querySelector('#sk-prepro'), a = root.querySelector('#sk-arr');
      if (p) p.textContent = formatMoney(StuffMigrate.preproValue(o));
      var tl = document.getElementById('sk-tooling');
      if (tl) tl.textContent = formatMoney(StuffMigrate.toolingValue(o));
      if (a) a.textContent = formatMoney(o.productionArr);
    }
    SKU_MONEY_KEYS.forEach(function (k) { var el = root.querySelector('#sk-v-' + k); if (el) el.addEventListener('input', refreshTotals); });
    var ap = root.querySelector('#sk-q-apply');
    if (ap) ap.addEventListener('click', function () {
      var val = (root.querySelector('#sk-q-line') || {}).value || '';
      var parts = val.split('|');
      var q = getCustomerQuote(parts[0]);
      var l = q ? (q.lines || []).find(function (x) { return x.id === parts[1]; }) : null;
      if (!q || !l) return;
      if (root._skuSaveQuiet) root._skuSaveQuiet();
      openQuoteApplyModal(getSku(sku.id), q, l);
    });
    var lg = root.querySelector('#sk-legacy');
    if (lg) lg.addEventListener('click', function () { openDetail(sku.legacyProjectId); });
  }

  function skuPosPaneHtml(sku) {
    var rows = StuffMigrate.poLinesForSku(state, sku.id);
    var html = '';
    if (!rows.length) html += '<div class="contacts-empty">No customer POs for this SKU yet.</div>';
    else {
      html += '<div class="table-wrap"><table class="kpi-table"><thead><tr><th>PO</th><th>PO date</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th><th>Ship date</th><th>Stage</th></tr></thead><tbody>';
      rows.forEach(function (x) {
        html += '<tr class="pv-row" data-po="' + escapeHtml(x.po.id) + '" data-pol="' + escapeHtml(x.line.id) + '"><td><strong>' + escapeHtml(x.po.poNumber || '(no number)') + '</strong></td>' +
          '<td>' + escapeHtml(x.po.poDate || '') + '</td><td class="num">' + escapeHtml(x.line.qty === '' ? '' : Number(x.line.qty).toLocaleString('en-US')) + '</td>' +
          '<td class="num">' + (x.line.unitPrice === '' ? '' : '$' + escapeHtml(x.line.unitPrice)) + '</td><td class="num">' + formatMoney(StuffMigrate.poLineAmount(x.line)) + '</td>' +
          '<td>' + escapeHtml(x.line.shipDate || '') + '</td><td>' + escapeHtml(stageLabel(x.line.stage)) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '<div class="contacts-toolbar"><button type="button" class="ghost" id="sk-add-po">Add customer PO</button></div>';
    return html;
  }

  function bindSkuPosPane(root, sku) {
    root.querySelectorAll('tr[data-pol]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        if (root._skuSaveQuiet) root._skuSaveQuiet();
        openPoModal({ poId: tr.getAttribute('data-po'), lineId: tr.getAttribute('data-pol') });
      });
    });
    var add = root.querySelector('#sk-add-po');
    if (add) add.addEventListener('click', function () {
      if (root._skuSaveQuiet) root._skuSaveQuiet();
      openPoModal({ skuId: sku.id });
    });
  }

  function setSkuArchived(sku, on) {
    var t = nowIso();
    sku.archived = !!on;
    sku.archivedAt = on ? t : null;
    sku.updatedAt = t;
    addSkuEvent(sku.id, on ? 'archived' : 'restored', on ? 'SKU archived (kept with its POs and history)' : 'SKU restored');
    logChange(on ? 'archive' : 'restore', 'sku', sku.id, (on ? 'Archived ' : 'Restored ') + (sku.code || sku.id));
    save();
  }

  // ---------------------------------------------------------------------
  // SKUs page: every SKU across all customers (Owner 2026-09-24)
  // ---------------------------------------------------------------------

  var skusNav = { search: '', customer: '', status: 'live' };

  function setActiveSkus() {
    autoCloseNavOnPhone();
    activeView = 'skus';
    activeArea = 'skus';
    activeDetailId = null;
    persistActiveNav();
    renderApp();
  }

  function skuStatusGroup(sku) {
    if (sku.archived) return 'archived';
    if (sku.stage) return 'pre';
    if (StuffMigrate.poLinesForSku(state, sku.id).some(function (x) { return StuffMigrate.isOpenPoLine(state, x.line); })) return 'production';
    return 'off';
  }

  function skuTableHtml(list, opts) {
    opts = opts || {};
    var html = '<div class="table-wrap"><table class="customers-table sku-list-table"><thead><tr><th>Code</th><th>Name</th>' + (opts.noCustomer ? '' : '<th>Customer</th>') +
      '<th>Stage</th><th class="num">Molds</th><th class="num">Pre-Production</th><th class="num">Mold Tooling</th><th class="num">Est. ARR</th><th class="num">Open POs</th></tr></thead><tbody>';
    if (!list.length) html += '<tr><td colspan="8" class="file-empty">' + escapeHtml(opts.empty || 'No SKUs match.') + '</td></tr>';
    list.forEach(function (s) {
      var face = StuffMigrate.cardFace(state, s, 'sku');
      var cust = getCustomer(s.customerId);
      html += '<tr data-sku-row="' + escapeHtml(s.id) + '"' + (s.archived ? ' class="row-archived"' : '') + '><td><strong>' + escapeHtml(s.code || '') + '</strong></td><td class="customer-name-cell">' + escapeHtml(s.name || '') + '</td>' +
        (opts.noCustomer ? '' : '<td>' + (cust ? '<button type="button" class="link-btn" data-sku-cust="' + escapeHtml(cust.id) + '">' + escapeHtml(cust.name) + '</button>' : '<span class="muted-note">none</span>') + '</td>') +
        '<td>' + escapeHtml(skuPlaceText(s)) + '</td>' +
        '<td class="num">' + (face.molds == null ? '<span class="muted-note">' + escapeHtml(moldsBlankText(s)) + '</span>' : escapeHtml(String(face.molds))) + '</td>' +
        '<td class="num">' + formatMoney(face.prepro) + '</td><td class="num">' + formatMoney(face.tooling) + '</td><td class="num">' + formatMoney(face.arr) + '</td><td class="num">' + formatMoney(StuffMigrate.openPoAmountForSku(state, s.id)) + '</td></tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function bindSkuTable(root) {
    root.querySelectorAll('tr[data-sku-row]').forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        var c = e.target && e.target.getAttribute && e.target.getAttribute('data-sku-cust');
        if (c) { e.stopPropagation(); setActiveCustomers(c); return; }
        openDetail(tr.getAttribute('data-sku-row'));
      });
    });
  }

  function renderSkus() {
    var root = document.getElementById('skus-root');
    if (!root) return;
    var all = (state.skus || []).slice();
    var q = skusNav.search.trim().toLowerCase();
    var list = all.filter(function (s) {
      var g = skuStatusGroup(s);
      if (skusNav.status === 'live' && g === 'archived') return false;
      if (skusNav.status !== 'live' && skusNav.status !== 'all' && g !== skusNav.status) return false;
      if (skusNav.customer && s.customerId !== skusNav.customer) return false;
      if (!q) return true;
      var cust = getCustomer(s.customerId);
      return [s.code, s.name, s.size, s.style, s.color, s.material, cust && cust.name].some(function (v) { return String(v || '').toLowerCase().indexOf(q) !== -1; });
    });
    list.sort(function (a, b) { return (customerNameFor(a) + ' ' + (a.code || '')).localeCompare(customerNameFor(b) + ' ' + (b.code || '')); });
    var custIds = {};
    all.forEach(function (s) { if (s.customerId) custIds[s.customerId] = true; });
    var html = '<div class="customers-bar">' +
      '<input type="search" id="skus-search" aria-label="Search SKUs" placeholder="Search SKUs, codes or customers" value="' + escapeHtml(skusNav.search) + '" />' +
      '<select id="skus-customer" aria-label="Customer"><option value="">All customers</option>' + Object.keys(custIds).map(getCustomer).filter(Boolean).sort(function (a, b) { return a.name.localeCompare(b.name); })
        .map(function (c) { return '<option value="' + escapeHtml(c.id) + '"' + (c.id === skusNav.customer ? ' selected' : '') + '>' + escapeHtml(c.name) + '</option>'; }).join('') + '</select>' +
      '<select id="skus-status" aria-label="Status">' + [['live', 'All active'], ['pre', 'Pre-production'], ['production', 'Production'], ['off', 'Not on a board'], ['archived', 'Archived'], ['all', 'All, with archived']]
        .map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === skusNav.status ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
      '<button type="button" id="btn-new-sku">Add SKU</button></div>';
    var molds = list.reduce(function (s, k) { return s + (Number(k.moldsRequired) || 0); }, 0);
    html += '<p class="board-note visible">' + list.length + ' of ' + all.length + ' SKUs. Molds required: ' + molds + '.</p>';
    html += skuTableHtml(list, {});
    root.innerHTML = html;
    bindSkuTable(root);
    var search = root.querySelector('#skus-search');
    search.addEventListener('input', function () {
      skusNav.search = search.value;
      var pos = search.selectionStart;
      renderSkus();
      var again = document.getElementById('skus-search');
      again.focus();
      try { again.setSelectionRange(pos, pos); } catch (e) { /* ignore */ }
    });
    root.querySelector('#skus-customer').addEventListener('change', function (e) { skusNav.customer = e.target.value; renderSkus(); });
    root.querySelector('#skus-status').addEventListener('change', function (e) { skusNav.status = e.target.value; renderSkus(); });
    root.querySelector('#btn-new-sku').addEventListener('click', function () { openAddSkuModal({ customerId: skusNav.customer || '' }); });
  }

  function renderSkusRailItem(rail) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rail-item customers-rail-item' + (activeView === 'skus' || (activeView === 'detail' && underlyingView() === 'skus') ? ' active' : '');
    btn.setAttribute('data-rail', 'skus');
    btn.title = menuEditMode ? 'SKUs is a fixed area and cannot be removed' : 'Every SKU across all customers';
    var label = document.createElement('span');
    label.className = 'rail-item-label';
    label.textContent = 'SKUs';
    btn.appendChild(label);
    var n = liveSkus().length;
    var badge = document.createElement('span');
    badge.className = 'rail-count' + (n ? '' : ' zero');
    badge.textContent = String(n);
    btn.appendChild(badge);
    if (menuEditMode) {
      var lock = document.createElement('span');
      lock.className = 'rail-locked';
      lock.textContent = 'fixed';
      btn.appendChild(lock);
    }
    btn.addEventListener('click', function () { if (!menuEditMode) setActiveSkus(); });
    rail.appendChild(btn);
  }

  // Customer page: SKUs with molds rollup, customer POs, archived projects.
  function renderCustomerJobs(root, cust) {
    if (!root) return;
    var skus = skusForCustomer(cust.id, false).sort(function (a, b) { return (a.code || '').localeCompare(b.code || ''); });
    var roll = StuffMigrate.moldsForCustomer(state, cust.id);
    var html = '<div class="section-title">SKUs (' + skus.length + ')</div>';
    html += '<p class="board-note visible">Molds required: <strong>' + roll.total + '</strong>' + (roll.blanks ? ' (' + roll.blanks + ' SKU' + (roll.blanks === 1 ? '' : 's') + ' not set)' : '') + '</p>';
    html += skuTableHtml(skus, { noCustomer: true, empty: 'No SKUs yet.' });
    html += '<div class="contacts-toolbar"><button type="button" id="cu-add-sku">Add SKU</button><button type="button" class="ghost" id="cu-add-po">Add customer PO</button></div>';
    var pos = posForCustomer(cust.id);
    html += '<div class="section-title">Customer POs (' + pos.length + ')</div>';
    if (!pos.length) html += '<div class="file-empty">No customer POs yet.</div>';
    else {
      html += '<div class="table-wrap"><table class="kpi-table"><thead><tr><th>PO</th><th>PO date</th><th>Required</th><th>Lines</th><th class="num">Open amount</th><th class="num">Total</th></tr></thead><tbody>';
      pos.forEach(function (po) {
        var open = (po.lines || []).filter(function (l) { return StuffMigrate.isOpenPoLine(state, l); }).reduce(function (s, l) { return s + StuffMigrate.poLineAmount(l); }, 0);
        var tot = (po.lines || []).reduce(function (s, l) { return s + StuffMigrate.poLineAmount(l); }, 0);
        html += '<tr class="pv-row" data-po-open="' + escapeHtml(po.id) + '"><td><strong>' + escapeHtml(po.poNumber || '(no number)') + '</strong></td><td>' + escapeHtml(po.poDate || '') + '</td><td>' + escapeHtml(po.requiredDate || '') + '</td>' +
          '<td>' + escapeHtml((po.lines || []).map(function (l) { var s = getSku(l.skuId); return (s ? s.code : '?') + ' (' + stageLabel(l.stage) + ')'; }).join(', ')) + '</td>' +
          '<td class="num">' + formatMoney(open) + '</td><td class="num">' + formatMoney(tot) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    var archivedSkus = skusForCustomer(cust.id, true).filter(function (s) { return s.archived; });
    var projects = projectsForCustomer(cust.id);
    if (archivedSkus.length || projects.length) {
      html += '<details class="kpi-details"><summary><h3>Archived (' + (archivedSkus.length + projects.length) + ')</h3></summary>';
      if (archivedSkus.length) html += skuTableHtml(archivedSkus, { noCustomer: true });
      if (projects.length) {
        html += '<div class="projects-grid">';
        projects.forEach(function (p) {
          html += '<div class="project-tile" data-project-id="' + escapeHtml(p.id) + '"><div class="project-tile-main"><div class="project-tile-name">' + escapeHtml(cardTitle(p)) + '</div>' +
            '<div class="muted-note">' + (p.archived ? 'Archived project, moved to SKU jobs' : escapeHtml(stageLabel(p.stage))) + '</div></div><span class="card-value">' + formatMoney(totalValue(p)) + '</span></div>';
        });
        html += '</div>';
      }
      html += '</details>';
    }
    root.innerHTML = html;
    bindSkuTable(root);
    root.querySelectorAll('[data-po-open]').forEach(function (tr) { tr.addEventListener('click', function () { openPoModal({ poId: tr.getAttribute('data-po-open') }); }); });
    root.querySelectorAll('.project-tile[data-project-id]').forEach(function (t) { t.addEventListener('click', function () { openDetail(t.getAttribute('data-project-id')); }); });
    root.querySelector('#cu-add-sku').addEventListener('click', function () { openAddSkuModal({ customerId: cust.id }); });
    root.querySelector('#cu-add-po').addEventListener('click', function () { openPoModal({ customerId: cust.id }); });
  }

  // =====================================================================
  // Menu editor (Edit menu): drag and drop categories, boards and separators.
  // Works on the raw state.areas / state.sections arrays so separators keep their place.
  // Rename, duplicate and remove stay; adding lives only at the bottom.
  // =====================================================================

  var railDrag = null; // { type: 'area' | 'board' | 'sep', id, level: 'top' | 'in' }
  var railAddForm = null; // 'board' | 'category' | null

  function rawAreasList() {
    if (!state.areas || !state.areas.length) state.areas = JSON.parse(JSON.stringify(AREAS));
    return state.areas;
  }

  function rawSectionsList() {
    if (!state.sections || !state.sections.length) state.sections = JSON.parse(JSON.stringify(SECTIONS));
    return state.sections;
  }

  function areaHoldsBoards(area) {
    var role = area.role || areaRoleFor(area.id);
    return role !== 'kpis' && area.id !== 'tasks';
  }

  function areaTypeLabel(area) {
    return isProjectArea(area.id) ? 'Projects' : 'Leads';
  }

  function renderRailEditor(rail) {
    var areas = rawAreasList();
    var secs = rawSectionsList();
    var html = '<div class="rail-editor">';
    html += '<p class="rail-editor-hint">Drag the handle to reorder or move boards between categories. Click a name to rename it.</p>';
    ensureFixedRailItems(state);
    areas = rawAreasList();
    var FIXED_LABELS = { today: 'Today', tasks: 'Tasks', customers: 'Customers', skus: 'SKUs', materials: 'Materials and Vendors' };
    areas.forEach(function (a) {
      if (isFixedItem(a)) {
        html += '<div class="re-row re-fixed-item" draggable="true" data-kind="fixed" data-id="' + escapeHtml(a.id) + '">' +
          '<span class="re-handle" aria-hidden="true">\u2807</span><span class="re-name">' + escapeHtml(FIXED_LABELS[a.id] || a.id) + '</span>' +
          '<span class="re-lock" title="Always in the menu; can be moved, not removed">fixed</span></div>';
        return;
      }
      if (isSeparator(a)) {
        html += '<div class="re-row re-sep" draggable="true" data-kind="sep" data-level="top" data-id="' + escapeHtml(a.id) + '">' +
          '<span class="re-handle" aria-hidden="true">\u2807</span><span class="re-sep-line"></span>' +
          '<button type="button" class="re-btn danger-x" data-act="remove-sep" title="Remove separator">\u00d7</button></div>';
        return;
      }
      var role = a.role || areaRoleFor(a.id);
      var locked = role === 'crm' && a.id === 'crm' || role === 'kpis';
      html += '<div class="re-area" data-area="' + escapeHtml(a.id) + '">';
      html += '<div class="re-row re-area-head" draggable="true" data-kind="area" data-id="' + escapeHtml(a.id) + '">' +
        '<span class="re-handle" aria-hidden="true">\u2807</span>' +
        '<button type="button" class="re-name re-area-name" data-act="rename-area" title="Rename">' + escapeHtml(a.label) + '</button>' +
        (areaHoldsBoards(a) ? '<span class="re-type">' + areaTypeLabel(a) + '</span>' : '') +
        (locked ? '' : '<button type="button" class="re-btn danger-x" data-act="remove-area" title="Remove category">\u00d7</button>') +
        '</div>';
      if (role === 'kpis') {
        kpiPagesList().forEach(function (p) {
          html += '<div class="re-row re-board re-fixed-board"><button type="button" class="re-name" data-act="rename-kpi" data-id="' + escapeHtml(p.id) + '">' + escapeHtml(p.label) + '</button></div>';
        });
      } else {
        var inArea = secs.filter(function (x) { return x.area === a.id; });
        if (!inArea.length) html += '<div class="re-row re-empty" data-kind="empty" data-area="' + escapeHtml(a.id) + '">Drop boards here</div>';
        inArea.forEach(function (x) {
          if (isSeparator(x)) {
            html += '<div class="re-row re-sep re-sep-in" draggable="true" data-kind="sep" data-level="in" data-id="' + escapeHtml(x.id) + '">' +
              '<span class="re-handle" aria-hidden="true">\u2807</span><span class="re-sep-line"></span>' +
              '<button type="button" class="re-btn danger-x" data-act="remove-sep" title="Remove separator">\u00d7</button></div>';
            return;
          }
          var cards = dealsOnBoard(x.id).length;
          html += '<div class="re-row re-board" draggable="true" data-kind="board" data-id="' + escapeHtml(x.id) + '">' +
            '<span class="re-handle" aria-hidden="true">\u2807</span>' +
            '<button type="button" class="re-name" data-act="rename-board" title="Rename' + (cards ? ' (' + cards + ' card' + (cards === 1 ? '' : 's') + ' on this board)' : '') + '">' + escapeHtml(x.label) + '</button>' +
            (cards ? '<span class="re-cards" title="' + cards + ' cards">' + cards + '</span>' : '') +
            '<button type="button" class="re-btn" data-act="dup-board" title="Duplicate board">\u29c9</button>' +
            '<button type="button" class="re-btn danger-x" data-act="remove-board" title="Remove board">\u00d7</button></div>';
        });
      }
      html += '</div>';
    });
    // Bottom: the only place to add things.
    html += '<div class="re-add">';
    if (railAddForm === 'board') {
      html += '<div class="re-form"><input type="text" id="re-new-board" placeholder="Board name" />' +
        '<select id="re-new-board-area">' + areaList().filter(areaHoldsBoards).map(function (a) {
          return '<option value="' + escapeHtml(a.id) + '"' + (a.id === (getSection(activeBoardId) || {}).area ? ' selected' : '') + '>' + escapeHtml(a.label) + '</option>';
        }).join('') + '</select>' +
        '<div class="re-form-actions"><button type="button" class="ghost" data-act="cancel-add">Cancel</button><button type="button" data-act="save-board">Add board</button></div></div>';
    } else if (railAddForm === 'category') {
      html += '<div class="re-form"><input type="text" id="re-new-cat" placeholder="Category name" />' +
        '<select id="re-new-cat-type"><option value="custom">Holds leads (like CRM)</option><option value="projects">Holds projects (like Pre-Production)</option></select>' +
        '<div class="re-form-actions"><button type="button" class="ghost" data-act="cancel-add">Cancel</button><button type="button" data-act="save-cat">Add category</button></div></div>';
    } else {
      html += '<button type="button" class="re-add-btn" data-act="add-board">+ Add board</button>' +
        '<button type="button" class="re-add-btn" data-act="add-cat">+ Add category</button>' +
        '<button type="button" class="re-add-btn" data-act="add-sep">+ Add separator</button>';
    }
    html += '</div></div>';
    rail.innerHTML = html;
    bindRailEditor(rail);
    var focusEl = rail.querySelector('#re-new-board, #re-new-cat');
    if (focusEl) focusEl.focus();
  }

  function railEditorDone(msg) {
    syncStagesFromState();
    save();
    renderApp();
    if (msg) showToast(msg);
  }

  function bindRailEditor(rail) {
    rail.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var act = b.getAttribute('data-act');
        var row = b.closest('[data-id]');
        var id = row ? row.getAttribute('data-id') : null;
        if (act === 'rename-area') {
          var a = areaList().find(function (x) { return x.id === id; });
          var n = prompt('Rename category:', a ? a.label : '');
          if (n != null && renameArea(id, n)) { logChange('update', 'menu', id, 'Renamed category to ' + n); railEditorDone(); }
        } else if (act === 'rename-board') {
          var sec = getMutableSection(id);
          var nb = prompt('Rename board:', sec ? sec.label : '');
          if (nb != null && renameBoard(id, nb)) { logChange('update', 'menu', id, 'Renamed board to ' + nb); railEditorDone(); }
        } else if (act === 'rename-kpi') {
          var kid = b.getAttribute('data-id');
          var page = kpiPagesList().find(function (p) { return p.id === kid; });
          var nk = prompt('Rename:', page ? page.label : '');
          if (nk != null && renameUtilityLabel('kpi:' + kid, nk)) railEditorDone();
        } else if (act === 'remove-area') {
          if (removeArea(id)) { logChange('delete', 'menu', id, 'Removed category'); railEditorDone(); }
        } else if (act === 'remove-board') {
          if (removeBoard(id)) { logChange('delete', 'menu', id, 'Removed board'); railEditorDone(); }
        } else if (act === 'remove-sep') {
          state.areas = state.areas.filter(function (x) { return x.id !== id; });
          state.sections = state.sections.filter(function (x) { return x.id !== id; });
          railEditorDone();
        } else if (act === 'dup-board') {
          var copy = duplicateBoard(id);
          if (copy) railEditorDone('Duplicated as "' + copy.label + '"');
        } else if (act === 'add-board') { railAddForm = 'board'; renderLeftRail(); }
        else if (act === 'add-cat') { railAddForm = 'category'; renderLeftRail(); }
        else if (act === 'cancel-add') { railAddForm = null; renderLeftRail(); }
        else if (act === 'add-sep') {
          rawAreasList().push({ kind: 'separator', id: StuffMigrate.makeId('sep') });
          railEditorDone('Separator added at the bottom. Drag it into place.');
        } else if (act === 'save-board') {
          var name = (document.getElementById('re-new-board').value || '').trim();
          var areaId = document.getElementById('re-new-board-area').value;
          if (!name) { alert('Board name is required.'); return; }
          railAddForm = null;
          var newId = addBoard(areaId, name);
          if (newId) { logChange('create', 'menu', newId, 'Added board ' + name); railEditorDone(); }
        } else if (act === 'save-cat') {
          var cname = (document.getElementById('re-new-cat').value || '').trim();
          var ctype = document.getElementById('re-new-cat-type').value;
          if (!cname) { alert('Category name is required.'); return; }
          railAddForm = null;
          if (addCategory(cname, ctype)) railEditorDone();
        }
      });
    });
    ['re-new-board', 're-new-cat'].forEach(function (fid) {
      var el = rail.querySelector('#' + fid);
      if (el) el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); rail.querySelector(fid === 're-new-board' ? '[data-act="save-board"]' : '[data-act="save-cat"]').click(); }
        if (e.key === 'Escape') { railAddForm = null; renderLeftRail(); }
      });
    });

    // Drag and drop.
    rail.querySelectorAll('[draggable="true"]').forEach(function (row) {
      row.addEventListener('dragstart', function (e) {
        railDrag = { type: row.getAttribute('data-kind'), id: row.getAttribute('data-id'), level: row.getAttribute('data-level') || null };
        row.classList.add('re-dragging');
        try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', railDrag.id); } catch (err) { /* ignore */ }
      });
      row.addEventListener('dragend', function () {
        railDrag = null;
        rail.querySelectorAll('.re-dragging, .re-drop-before, .re-drop-after, .re-drop-into').forEach(function (el) {
          el.classList.remove('re-dragging', 're-drop-before', 're-drop-after', 're-drop-into');
        });
      });
    });
    rail.querySelectorAll('.re-row').forEach(function (row) {
      row.addEventListener('dragover', function (e) {
        if (!railDrag) return;
        var target = railDropTarget(row, e);
        rail.querySelectorAll('.re-drop-before, .re-drop-after, .re-drop-into').forEach(function (el) { el.classList.remove('re-drop-before', 're-drop-after', 're-drop-into'); });
        if (!target) return;
        e.preventDefault();
        row.classList.add(target.mode === 'into' ? 're-drop-into' : (target.before ? 're-drop-before' : 're-drop-after'));
      });
      row.addEventListener('drop', function (e) {
        if (!railDrag) return;
        var target = railDropTarget(row, e);
        if (!target) return;
        e.preventDefault();
        var drag = railDrag;
        railDrag = null;
        applyRailMove(drag, target);
      });
    });
  }

  // Work out what dropping the current drag on this row would mean, or null if not allowed.
  function railDropTarget(row, e) {
    var kind = row.getAttribute('data-kind');
    var id = row.getAttribute('data-id');
    if (!kind || row.classList.contains('re-dragging')) return null;
    var rect = row.getBoundingClientRect();
    var before = (e.clientY - rect.top) < rect.height / 2;
    var d = railDrag;
    var areaOfRow = row.closest('.re-area') ? row.closest('.re-area').getAttribute('data-area') : null;
    var area = areaOfRow ? areaList().find(function (a) { return a.id === areaOfRow; }) : null;
    if (d.type === 'area' || d.type === 'fixed') {
      if (kind === 'area' || kind === 'fixed' || (kind === 'sep' && row.getAttribute('data-level') === 'top')) return { mode: 'top', refId: id, before: before };
      return null;
    }
    if (kind === 'fixed') {
      if (d.type === 'sep') return { mode: 'top', refId: id, before: before };
      return null;
    }
    // board or separator
    if (kind === 'area') {
      if (d.type === 'sep' && before) return { mode: 'top', refId: id, before: true };
      if (!area || !areaHoldsBoards(area)) return null;
      return { mode: 'into', areaId: id, first: true };
    }
    if (kind === 'empty') {
      var emptyArea = row.getAttribute('data-area');
      return { mode: 'into', areaId: emptyArea, first: true };
    }
    if (kind === 'sep' && row.getAttribute('data-level') === 'top') {
      if (d.type === 'sep') return { mode: 'top', refId: id, before: before };
      return null;
    }
    if (kind === 'board' || kind === 'sep') {
      if (!area || !areaHoldsBoards(area)) return null;
      return { mode: 'in', refId: id, areaId: area.id, before: before };
    }
    return null;
  }

  function applyRailMove(drag, target) {
    var areas = rawAreasList();
    var secs = rawSectionsList();
    if (drag.type === 'area' || drag.type === 'fixed') {
      var item = areas.find(function (a) { return a.id === drag.id && (drag.type === 'fixed' ? isFixedItem(a) : !isFixedItem(a)); });
      if (!item || drag.id === target.refId) return;
      state.areas = areas.filter(function (a) { return a !== item; });
      var ri = state.areas.findIndex(function (a) { return a.id === target.refId; });
      state.areas.splice(target.before ? ri : ri + 1, 0, item);
      logChange('update', 'menu', drag.id, drag.type === 'fixed' ? 'Moved ' + drag.id + ' in the menu' : 'Moved category');
      return railEditorDone();
    }
    // Pull the dragged board or separator out of wherever it lives.
    var moving = secs.find(function (x) { return x.id === drag.id; }) || areas.find(function (x) { return x.id === drag.id; });
    if (!moving) return;
    if (drag.type === 'board') {
      var destArea = target.areaId;
      if (destArea && destArea !== moving.area) {
        var cards = dealsOnBoard(moving.id).length;
        if (cards && isProjectArea(destArea) !== isProjectArea(moving.area)) {
          alert('"' + moving.label + '" has ' + cards + ' card(s). A board with cards can only move to a category of the same type (' +
            (isProjectArea(moving.area) ? 'projects' : 'leads') + '). Move or clear its cards first.');
          return renderLeftRail();
        }
      }
    }
    state.sections = secs.filter(function (x) { return x !== moving; });
    state.areas = areas.filter(function (x) { return x !== moving; });
    if (target.mode === 'top') {
      var sepTop = { kind: 'separator', id: moving.id };
      var ti = state.areas.findIndex(function (a) { return a.id === target.refId; });
      state.areas.splice(target.before ? ti : ti + 1, 0, sepTop);
      return railEditorDone();
    }
    var fromArea = moving.area;
    if (isSeparator(moving)) moving = { kind: 'separator', id: moving.id, area: target.areaId };
    else moving.area = target.areaId;
    if (target.mode === 'into') {
      var firstIdx = state.sections.findIndex(function (x) { return x.area === target.areaId; });
      if (firstIdx === -1) {
        // Empty category: place after the last item of the category before it, or at the end.
        state.sections.push(moving);
      } else state.sections.splice(firstIdx, 0, moving);
    } else {
      var idx = state.sections.findIndex(function (x) { return x.id === target.refId; });
      state.sections.splice(target.before ? idx : idx + 1, 0, moving);
    }
    if (!isSeparator(moving)) {
      logChange('update', 'menu', moving.id, fromArea !== moving.area ? 'Moved board ' + moving.label + ' to ' + areaLabelFor(moving.area) : 'Reordered board ' + moving.label);
    }
    railEditorDone();
  }

  // Copy a board's structure (stages, labels, options). Cards are not copied.
  function duplicateBoard(boardId) {
    var src = getMutableSection(boardId);
    if (!src) return null;
    var copy = JSON.parse(JSON.stringify(src));
    copy.id = slugifyId(src.label + ' copy', 'board');
    copy.label = src.label + ' copy';
    if (!state.stageLabels) state.stageLabels = Object.assign({}, STAGE_LABELS);
    var taken = {};
    sectionList().forEach(function (x) { (x.stages || []).forEach(function (st) { taken[st] = true; }); });
    copy.stages = (src.stages || []).map(function (st) {
      var base = st + '-copy', slug = base, n = 1;
      while (taken[slug]) { n += 1; slug = base + '-' + n; }
      taken[slug] = true;
      state.stageLabels[slug] = stageLabel(st);
      return slug;
    });
    var idx = state.sections.indexOf(src);
    state.sections.splice(idx + 1, 0, copy);
    logChange('create', 'menu', copy.id, 'Duplicated board ' + src.label + ' (stages only, no cards)');
    return copy;
  }

  function addCategory(name, type) {
    var role = type === 'projects' ? 'projects' : 'custom';
    var id = slugifyId(name, 'area');
    rawAreasList();
    // New categories go above KPI's so reports stay last.
    var kpiIdx = state.areas.findIndex(function (a) { return !isSeparator(a) && (a.role === 'kpis' || a.id === 'kpis'); });
    var entry = { id: id, label: name, role: role };
    if (kpiIdx === -1) state.areas.push(entry); else state.areas.splice(kpiIdx, 0, entry);
    areaOpen[id] = true;
    persistAreaOpen();
    addBoard(id, 'New board');
    logChange('create', 'menu', id, 'Added category ' + name + ' (' + (role === 'projects' ? 'projects' : 'leads') + ')');
    return true;
  }


  // =====================================================================
  // Global search (Ctrl+K) and quick log (#60). The index is built from the loaded state, and rebuilt
  // when save() runs or a cloud snapshot replaces the state. Nothing here changes the data shape.
  // =====================================================================
  var searchVersion = 0;
  var searchCache = { state: null, ver: -1, index: [] };
  var SEARCH_RECENT_KEY = 'matrix-matrix-search-recent';
  var gsMode = 'search'; // 'search', or 'pick' (the mobile + button: choose who to log)
  var gsRows = [];
  var gsActive = 0;

  function searchIndexNow() {
    if (searchCache.state !== state || searchCache.ver !== searchVersion) {
      searchCache = { state: state, ver: searchVersion, index: StuffMigrate.buildSearchIndex(state, { stageLabel: stageLabel }) };
    }
    return searchCache.index;
  }

  function recentSearches() {
    try {
      var list = JSON.parse(localStorage.getItem(SEARCH_RECENT_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function pushRecentSearch(e) {
    var list = recentSearches().filter(function (r) { return !(r.type === e.type && r.id === e.id); });
    list.unshift({ type: e.type, id: e.id });
    try { localStorage.setItem(SEARCH_RECENT_KEY, JSON.stringify(list.slice(0, 8))); } catch (err) { /* ignore */ }
  }

  function gsLoggable(e) { return e.type === 'lead' || e.type === 'customer' || e.type === 'contact'; }

  function gsRender() {
    var q = document.getElementById('gs-input').value;
    var pick = gsMode === 'pick';
    var groups;
    if (!q.trim()) {
      var idx = searchIndexNow();
      var rec = recentSearches().map(function (r) {
        return idx.find(function (e) { return e.type === r.type && e.id === r.id; });
      }).filter(function (e) { return e && (!pick || gsLoggable(e)); });
      groups = rec.length ? [{ label: 'Recent', items: rec }] : [];
    } else {
      groups = StuffMigrate.searchEntries(searchIndexNow(), q).groups.filter(function (g) { return !pick || gsLoggable({ type: g.type }); });
    }
    gsRows = [];
    var html = '';
    groups.forEach(function (g) {
      html += '<div class="gs-group">' + escapeHtml(g.label) + '</div>';
      g.items.forEach(function (e) {
        var i = gsRows.push(e) - 1;
        html += '<div class="gs-row" role="option" data-gs="' + i + '"><div class="gs-row-main"><div class="gs-row-title">' + escapeHtml(e.title) + '</div>' +
          (e.sub ? '<div class="gs-row-sub">' + escapeHtml(e.sub) + '</div>' : '') + '</div>' +
          (!pick && gsLoggable(e) ? '<button type="button" class="ghost" data-gs-log="' + i + '">Log</button>' : '') + '</div>';
      });
    });
    if (!gsRows.length) {
      html = '<div class="gs-empty">' + (q.trim() ? 'Nothing found.' : pick ? 'Type a company or contact to log against.' : 'Type to search. Prefixes: l: leads, c: customers, p: POs, s: SKUs, v: vendors.') + '</div>';
    }
    var list = document.getElementById('gs-list');
    list.innerHTML = html;
    gsActive = 0;
    gsMark();
  }

  function gsMark() {
    document.querySelectorAll('#gs-list .gs-row').forEach(function (row) {
      var on = Number(row.getAttribute('data-gs')) === gsActive;
      row.classList.toggle('active', on);
      row.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' });
    });
  }

  function openSearch(mode) {
    gsMode = mode || 'search';
    var input = document.getElementById('gs-input');
    input.value = '';
    input.placeholder = gsMode === 'pick' ? 'Who did you talk to? Search a lead or contact' : 'Search anything. l: c: p: s: v: to filter';
    document.getElementById('gs-backdrop').classList.add('open');
    gsRender();
    input.focus();
  }

  function closeSearch() {
    document.getElementById('gs-backdrop').classList.remove('open');
  }

  function openSearchResult(e) {
    if (e.type === 'lead') { openDetail(e.id); return; }
    if (e.type === 'sku') { openDetail(e.id); return; }
    if (e.type === 'customer') { setActiveCustomers(e.id); return; }
    if (e.type === 'contact') {
      var c = getContact(e.id);
      if (!c) return;
      if (getCustomer(c.customerId)) {
        setActiveCustomers(c.customerId);
      } else if (getVendor(c.customerId)) {
        setActiveMaterials({ tab: 'vendors', vendorId: c.customerId, materialId: null });
      }
      openContactModal({ contactId: c.id, customerId: c.customerId, dealId: null, onDone: function () { renderApp(); } });
      return;
    }
    if (e.type === 'po') { openPoModal({ poId: e.id }); return; }
    if (e.type === 'vendor') { setActiveMaterials({ tab: 'vendors', vendorId: e.id, materialId: null }); return; }
    if (e.type === 'material') { setActiveMaterials({ tab: 'materials', materialId: e.id, vendorId: null }); return; }
    if (e.type === 'task') {
      var t = (state.tasks || []).find(function (x) { return x.id === e.id; });
      setActiveTasks(t && t.bucket);
    }
  }

  function gsChoose(i) {
    var e = gsRows[i];
    if (!e) return;
    closeSearch();
    if (gsMode === 'pick') { openQuickLog(e.type, e.id); return; }
    pushRecentSearch(e);
    openSearchResult(e);
  }

  function openQuickLog(type, id) {
    var target = StuffMigrate.quickLogTarget(state, type, id);
    if (!target) { showToast('Could not find that record.'); return; }
    var rec = target.rec;
    var isCard = target.entityType === 'lead' || target.entityType === 'project';
    var canNext = isCard && !isColdStage(rec.stage);
    var html = '<div class="modal-title-row"><h2>Log: ' + escapeHtml(target.label) + '</h2></div>' +
      (target.contact && target.entityType !== 'contact' ? '<p class="muted-note">With ' + escapeHtml(target.contact.name || target.contact.email || 'contact') + '</p>' : '') +
      '<form id="qlog-form"><div class="qlog-kinds">' +
      StuffMigrate.QUICK_LOG_KINDS.map(function (k, i) {
        return '<label class="' + (i === 0 ? 'on' : '') + '"><input type="radio" name="ql-kind" value="' + k[0] + '"' + (i === 0 ? ' checked' : '') + ' />' + escapeHtml(k[1]) + '</label>';
      }).join('') + '</div>' +
      '<div class="field"><label for="ql-outcome">Outcome</label><select id="ql-outcome"><option value="">No outcome</option>' +
      StuffMigrate.QUICK_LOG_OUTCOMES.map(function (o) { return '<option value="' + o[0] + '">' + escapeHtml(o[1]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="ql-note">Note</label><textarea id="ql-note" rows="2" placeholder="What was said"></textarea></div>' +
      (canNext ? '<div class="field"><label for="ql-next">Next step date</label><input type="date" id="ql-next" />' +
        (rec.nextFollowUp ? '<span class="muted-note">Blank keeps ' + escapeHtml(String(rec.nextFollowUp).slice(0, 10)) + '</span>' : '') + '</div>' : '') +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button><button type="submit" id="ql-save">Log</button></div></form>';
    var m = openJobModal(html, 'sm');
    m.querySelectorAll('input[name="ql-kind"]').forEach(function (r) {
      r.addEventListener('change', function () {
        m.querySelectorAll('.qlog-kinds label').forEach(function (l) { l.classList.toggle('on', l.querySelector('input').checked); });
      });
    });
    m.querySelector('#qlog-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var nextEl = m.querySelector('#ql-next');
      var res = StuffMigrate.quickLog(state, rec, target.entityType, {
        kind: m.querySelector('input[name="ql-kind"]:checked').value,
        outcome: m.querySelector('#ql-outcome').value,
        note: m.querySelector('#ql-note').value,
        nextStep: nextEl ? nextEl.value : '',
        contactName: target.contact && target.entityType !== 'contact' ? target.contact.name : ''
      }, sectionActor());
      if (res.error) { alert(res.error); return; }
      closeJobModal();
      save();
      showToast('Logged.');
      renderApp();
    });
  }

  document.getElementById('btn-header-search').addEventListener('click', function () { openSearch('search'); });
  document.getElementById('qlog-fab').addEventListener('click', function () { openSearch('pick'); });
  document.getElementById('c-log').addEventListener('click', function () {
    var ctx = contactModalCtx;
    if (!ctx || !ctx.contactId) return;
    var id = ctx.contactId;
    closeContactModal();
    openQuickLog('contact', id);
  });
  (function () {
    var bd = document.getElementById('gs-backdrop');
    var input = document.getElementById('gs-input');
    bd.addEventListener('click', function (e) { if (e.target === bd) closeSearch(); });
    input.addEventListener('input', gsRender);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!gsRows.length) return;
        gsActive = (gsActive + (e.key === 'ArrowDown' ? 1 : gsRows.length - 1)) % gsRows.length;
        gsMark();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        gsChoose(gsActive);
      }
    });
    document.getElementById('gs-list').addEventListener('click', function (e) {
      var logBtn = e.target.closest('[data-gs-log]');
      if (logBtn) {
        var le = gsRows[Number(logBtn.getAttribute('data-gs-log'))];
        closeSearch();
        if (le) openQuickLog(le.type, le.id);
        return;
      }
      var row = e.target.closest('[data-gs]');
      if (row) gsChoose(Number(row.getAttribute('data-gs')));
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && String(e.key).toLowerCase() === 'k') {
        e.preventDefault();
        if (bd.classList.contains('open')) closeSearch(); else openSearch('search');
      } else if (e.key === 'Escape' && bd.classList.contains('open')) {
        closeSearch();
      }
    });
    // Tap a phone number, come back to the app, and it offers to log the call.
    var pendingCall = null;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="tel:"]');
      if (!a) return;
      var digits = String(a.getAttribute('href')).replace(/\D+/g, '');
      if (digits.length >= 3) pendingCall = { digits: digits, at: Date.now() };
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible' || !pendingCall) return;
      var p = pendingCall;
      pendingCall = null;
      if (Date.now() - p.at < 2000 || Date.now() - p.at > 3600000) return;
      var c = (state.contacts || []).find(function (x) { var d = String(x.phone || '').replace(/\D+/g, ''); return d && (d === p.digits || p.digits.endsWith(d) || d.endsWith(p.digits)); });
      if (!c) return;
      var m = openJobModal('<div class="modal-title-row"><h2>Log that call?</h2></div><p>You called ' + escapeHtml(c.name || c.phone) + '.</p>' +
        '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Not now</button><button type="button" id="tel-log">Log it</button></div>', 'sm');
      m.querySelector('#tel-log').addEventListener('click', function () { closeJobModal(); openQuickLog('contact', c.id); });
    });
  })();

  // Contact modal wiring
  document.getElementById('c-cancel').addEventListener('click', closeContactModal);
  document.getElementById('c-delete').addEventListener('click', deleteContactFromModal);
  document.getElementById('contact-form').addEventListener('submit', function (e) { e.preventDefault(); saveContactFromModal(); });
  document.getElementById('contact-modal-backdrop').addEventListener('click', function (e) {
    if (e.target === document.getElementById('contact-modal-backdrop')) closeContactModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('contact-modal-backdrop').classList.contains('open')) closeContactModal();
  });

  // =====================================================================
  // Phase 2: Profile, Request bot access, Admin access queue (2026-09-24)
  // Data lives in Firestore beside workspace/main: users/{emailLower}, botAccessRequests,
  // botGrants/{botEmailLower}, accessAudit. All reads and writes go through
  // MatrixCloud.access and are decided by Firestore rules. Nothing here edits workspace/main
  // except the local change log mirror of admin decisions.
  // =====================================================================

  var ACCESS_SECTION_LABELS = { quotes: 'Quotes', 'cold-leads': 'Cold Leads', inbound: 'Inbound Leads', customers: 'Customers', tasks: 'Tasks', 'pp-tooling': 'Tooling' };
  var ACCESS_SECTION_KEYS = ['quotes', 'cold-leads', 'inbound', 'customers', 'tasks', 'pp-tooling'];
  var profileTab = 'me';
  var profileData = { loading: false, error: '', profile: null, myRequests: [], requests: [], grants: [], users: [], audit: null, loadedAt: 0 };
  var grantEditing = null; // { kind: 'grant'|'request', id }
  var inviteOpen = false;
  var lastInvite = null; // { email } after an invite, for the copyable message
  var keyFormOpen = false;
  var keyEditing = null; // bot key id whose sections are being edited
  var lastBotKey = null; // { botName, key } right after creating a bot key; shown once, never stored

  function accessApi() { return window.MatrixCloud && window.MatrixCloud.access; }
  function cloudReady() { var a = accessApi(); return !!(a && a.isCloud()); }
  function profileIsAdmin() {
    var p = profileData.profile;
    return !!(p && Array.isArray(p.roles) && p.roles.indexOf('admin') !== -1);
  }
  function levelLabel(l) { return l === 'write' ? 'Write' : l === 'read' ? 'Read' : 'None'; }
  function fmtWhen(iso) { try { return iso ? new Date(iso).toLocaleString() : ''; } catch (e) { return String(iso || ''); } }

  function setActiveProfile(tab) {
    if (tab) profileTab = tab;
    activeView = 'profile';
    activeArea = 'profile';
    activeDetailId = null;
    persistActiveNav();
    renderApp();
    loadProfileData();
  }

  function loadProfileData() {
    var a = accessApi();
    if (!cloudReady()) { renderProfile(); return Promise.resolve(); }
    profileData.loading = true;
    profileData.error = '';
    renderProfile();
    return a.getProfile().then(function (p) {
      profileData.profile = p;
      var admin = profileIsAdmin();
      return Promise.all([
        a.listMyRequests(),
        admin ? a.listAllRequests() : Promise.resolve([]),
        a.listGrants(),
        a.listUsers(), // everyone: needed to know whether any admin exists yet
        admin ? a.listAudit() : Promise.resolve(null),
        admin ? a.listBotKeys() : Promise.resolve(null)
      ]);
    }).then(function (r) {
      profileData.myRequests = r[0] || [];
      profileData.requests = r[1] || [];
      profileData.grants = r[2] || [];
      profileData.users = r[3] || [];
      profileData.audit = r[4];
      profileData.keys = r[5];
      profileData.loadedAt = Date.now();
    }).catch(function (err) {
      profileData.error = (err && err.message) ? err.message : String(err);
    }).then(function () {
      profileData.loading = false;
      if (activeView === 'profile') renderProfile();
    });
  }

  function renderProfile() {
    var root = document.getElementById('profile-root');
    if (!root) return;
    var a = accessApi();
    // Reloading the page while on Profile can render before anything loaded the access data,
    // which shows a signed-in admin as "member". Load it once here if nothing has yet.
    if (cloudReady() && !profileData.loading && !profileData.loadedAt && !profileData.error) { loadProfileData(); return; }
    if (!cloudReady()) {
      root.innerHTML = '<div class="kpi-head"><h2>Profile</h2></div>' +
        '<div class="comms-stub">Profiles and bot access live in the hosted Matrix. Sign in with Google at the hosted site to use them.</div>';
      return;
    }
    var me = a.me();
    var admin = profileIsAdmin();
    if (profileTab === 'admin' && !admin) profileTab = 'me';
    var pending = profileData.requests.filter(function (r) { return r.status === 'pending'; }).length;
    var html = '<div class="kpi-head"><h2>' + (profileTab === 'admin' ? 'Access requests and bot grants' : 'Profile') + '</h2>' +
      '<button type="button" class="ghost" id="pf-refresh"' + (profileData.loading ? ' disabled' : '') + '>' + (profileData.loading ? 'Loading...' : 'Refresh') + '</button></div>';
    html += '<div class="tasks-tabs" role="tablist">' +
      '<button type="button" class="tasks-tab' + (profileTab === 'me' ? ' active' : '') + '" data-ptab="me">My profile</button>' +
      '<button type="button" class="tasks-tab' + (profileTab === 'bots' ? ' active' : '') + '" data-ptab="bots">My bots</button>' +
      (admin ? '<button type="button" class="tasks-tab' + (profileTab === 'admin' ? ' active' : '') + '" data-ptab="admin">Access admin <span class="rail-count' + (pending ? '' : ' zero') + '">' + pending + '</span></button>' : '') +
      '</div>';
    if (profileData.error) html += '<div class="access-error">Could not load access data: ' + escapeHtml(profileData.error) + '</div>';
    html += '<div id="profile-body"></div>';
    root.innerHTML = html;
    var body = document.getElementById('profile-body');
    if (profileTab === 'bots') renderMyBots(body, me);
    else if (profileTab === 'admin') renderAccessAdmin(body);
    else renderMyProfile(body, me);
    root.querySelectorAll('[data-ptab]').forEach(function (b) {
      b.addEventListener('click', function () { profileTab = b.getAttribute('data-ptab'); grantEditing = null; inviteOpen = false; lastInvite = null; renderProfile(); });
    });
    document.getElementById('pf-refresh').addEventListener('click', function () { loadProfileData(); });
  }

  function myGrantLevel(key) {
    if (profileIsAdmin()) return 'write';
    var g = (profileData.profile && profileData.profile.sectionGrants) || {};
    return g[key] === 'write' || g[key] === 'read' ? g[key] : 'none';
  }

  function renderMyProfile(body, me) {
    var p = profileData.profile || {};
    var photo = me.photoURL || p.photoURL || '';
    var html = '<div class="profile-top"><div class="profile-photo">' +
      (photo ? '<img class="profile-avatar" src="' + escapeHtml(photo) + '" alt="" referrerpolicy="no-referrer" />' :
        '<span class="profile-avatar profile-initials">' + escapeHtml(((p.displayName || me.displayName || me.email || '?').trim()[0] || '?').toUpperCase()) + '</span>') +
      '<div class="muted-note">Photo comes from your Google account.</div></div>';
    html += '<form id="profile-form" class="profile-form">';
    if (!profileData.profile && !profileData.loading) html += '<p class="muted-note">No profile yet. Save once to create it.</p>';
    html += '<div class="row"><div class="field"><label for="pf-name">Display name</label><input type="text" id="pf-name" /></div>' +
      '<div class="field"><label for="pf-title">Title or role</label><input type="text" id="pf-title" /></div></div>';
    html += '<div class="row"><div class="field"><label for="pf-email">Email</label><input type="email" id="pf-email" readonly /></div>' +
      '<div class="field"><label for="pf-phone">Phone</label><input type="tel" id="pf-phone" /></div></div>';
    html += '<div class="detail-actions"><button type="button" class="ghost" id="pf-signout">Sign out</button><span class="spacer"></span>' +
      '<button type="submit" id="pf-save">Save profile</button></div></form></div>';
    // Access summary
    var roles = (p.roles && p.roles.length) ? p.roles.join(', ') : 'member';
    html += '<div class="section-title">SOP</div>' +
      '<p class="muted-note">Stage owners, exit criteria and SLAs. <button type="button" class="link-btn" id="pf-sop-open">Open SOP</button></p>';
    html += '<div class="section-title">My access</div>';
    html += '<p class="muted-note">Roles:<strong>' + escapeHtml(roles) + '</strong>. Section access is set by an admin.</p>';
    html += '<div class="table-wrap"><table class="kpi-table access-table"><thead><tr><th>Section</th><th>My access</th></tr></thead><tbody>';
    ACCESS_SECTION_KEYS.forEach(function (k) {
      var lvl = profileIsAdmin() ? 'write' : myGrantLevel(k);
      html += '<tr><td>' + escapeHtml(ACCESS_SECTION_LABELS[k]) + '</td><td><span class="badge lvl-' + lvl + '">' + (profileIsAdmin() ? 'Write (admin)' : levelLabel(lvl)) + '</span></td></tr>';
    });
    html += '</tbody></table></div>';
    var mine = profileData.grants.filter(function (g) { return String(g.sponsorUserEmail || '').toLowerCase() === me.email; });
    html += '<div class="section-title">Bots acting for me</div>' + (mine.length ? grantsTableHtml(mine, false) : '<div class="file-empty">None yet. Use the My bots tab to request bot access.</div>');
    if (!profileIsAdmin() && !profileData.loading && profileData.profile) {
      html += '<p class="muted-note">Admins manage access. The company has the final say on every grant.</p>';
    }
    if (!profileData.loading && !anyAdminKnown()) {
      html += '<div class="access-note">No admin is set up yet. The company owner sets it once: in the Firebase console, open Firestore, <code>users/' + escapeHtml(me.email) +
        '</code>, and set <code>roles</code> to <code>["admin"]</code>. After that, admins manage everything here.</div>';
    }
    body.innerHTML = html;
    document.getElementById('pf-name').value = p.displayName || me.displayName || '';
    document.getElementById('pf-title').value = p.title || '';
    document.getElementById('pf-email').value = me.email || '';
    document.getElementById('pf-phone').value = p.phone || '';
    document.getElementById('pf-sop-open').addEventListener('click', setActiveSop);
    document.getElementById('pf-signout').addEventListener('click', function () {
      if (window.MatrixCloud && window.MatrixCloud.signOut) window.MatrixCloud.signOut();
    });
    document.getElementById('profile-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('pf-name').value.trim();
      if (!name) { alert('Display name is required.'); return; }
      var btn = document.getElementById('pf-save');
      btn.disabled = true;
      accessApi().saveProfile({ displayName: name, title: document.getElementById('pf-title').value, phone: document.getElementById('pf-phone').value })
        .then(function () { showToast('Profile saved'); return loadProfileData(); })
        .catch(function (err) { alert('Could not save the profile: ' + (err && err.message ? err.message : err)); btn.disabled = false; });
    });
  }

  function anyAdminKnown() {
    if (profileIsAdmin()) return true;
    return profileData.users.some(function (u) { return Array.isArray(u.roles) && u.roles.indexOf('admin') !== -1; });
  }

  function sectionsText(map) {
    var parts = ACCESS_SECTION_KEYS.filter(function (k) { return map && map[k]; }).map(function (k) { return ACCESS_SECTION_LABELS[k] + ' ' + levelLabel(map[k]).toLowerCase(); });
    return parts.length ? parts.join(', ') : 'No sections';
  }

  function grantsTableHtml(grants, withActions) {
    var list = grants.slice().sort(function (x, y) { return (x.status === 'revoked') - (y.status === 'revoked') || String(x.botEmail || x.id).localeCompare(String(y.botEmail || y.id)); });
    var html = '<div class="table-wrap"><table class="kpi-table grants-list"><thead><tr><th>Bot</th><th>Acts for</th><th>Sections</th><th>Status</th><th>Approved</th>' + (withActions ? '<th></th>' : '') + '</tr></thead><tbody>';
    list.forEach(function (g) {
      var email = g.botEmail || g.id;
      var onList = userCanSignIn(email);
      html += '<tr data-grant="' + escapeHtml(g.id) + '"><td><strong>' + escapeHtml(email) + '</strong>' +
        (onList ? '' : '<div class="warn-note small">Cannot sign in yet. Invite it under People.</div>') + '</td>' +
        '<td>' + escapeHtml(g.sponsorUserEmail || '') + '</td><td>' + escapeHtml(sectionsText(g.sections)) + '</td>' +
        '<td><span class="badge st-' + escapeHtml(g.status || '') + '">' + escapeHtml(g.status || '') + '</span></td>' +
        '<td>' + escapeHtml(g.approvedBy || '') + '<div class="muted-note">' + escapeHtml(fmtWhen(g.approvedAt)) + '</div></td>' +
        (withActions ? '<td class="access-actions">' + (g.status === 'active' ? '<button type="button" class="ghost" data-gact="edit">Edit</button><button type="button" class="danger" data-gact="revoke">Revoke</button>' : '') + '</td>' : '') +
        '</tr>';
      if (withActions && grantEditing && grantEditing.kind === 'grant' && grantEditing.id === g.id) {
        html += '<tr class="edit-row"><td colspan="6">' + sectionsEditorHtml('ge', g.sections || {}, true) +
          '<div class="access-actions"><button type="button" class="ghost" data-gact="cancel">Cancel</button><button type="button" data-gact="save">Save sections</button></div></td></tr>';
      }
    });
    return html + '</tbody></table></div>';
  }

  // Radio grid None / Read / Write per section. limitToMine caps levels at the viewer's own grants.
  function sectionsEditorHtml(prefix, map, unlimited) {
    var html = '<div class="table-wrap"><table class="kpi-table section-picker"><thead><tr><th>Section</th><th>None</th><th>Read</th><th>Write</th></tr></thead><tbody>';
    ACCESS_SECTION_KEYS.forEach(function (k) {
      var cur = (map && map[k]) || 'none';
      var cap = unlimited ? 'write' : myGrantLevel(k);
      html += '<tr><td>' + escapeHtml(ACCESS_SECTION_LABELS[k]) + (cap === 'none' ? ' <span class="muted-note">(you have no access)</span>' : '') + '</td>';
      ['none', 'read', 'write'].forEach(function (lvl) {
        var allowed = lvl === 'none' || (lvl === 'read' && cap !== 'none') || (lvl === 'write' && cap === 'write');
        html += '<td><input type="radio" name="' + prefix + '-' + k + '" value="' + lvl + '"' + (cur === lvl ? ' checked' : '') + (allowed ? '' : ' disabled') +
          ' aria-label="' + escapeHtml(ACCESS_SECTION_LABELS[k] + ' ' + levelLabel(lvl)) + '" /></td>';
      });
      html += '</tr>';
    });
    return html + '</tbody></table></div>';
  }

  function readSectionsEditor(root, prefix) {
    var map = {};
    ACCESS_SECTION_KEYS.forEach(function (k) {
      var c = root.querySelector('input[name="' + prefix + '-' + k + '"]:checked');
      if (c && c.value !== 'none') map[k] = c.value;
    });
    return map;
  }

  function requestsTableHtml(list, withActions) {
    if (!list.length) return '<div class="file-empty">No requests.</div>';
    var rows = list.slice().sort(function (x, y) { return (x.status !== 'pending') - (y.status !== 'pending') || String(y.createdAt || '').localeCompare(String(x.createdAt || '')); });
    var html = '<div class="table-wrap"><table class="kpi-table requests-list"><thead><tr>' + (withActions ? '<th>Requested by</th>' : '') +
      '<th>Bot</th><th>Sections</th><th>Reason</th><th>Status</th>' + (withActions ? '<th></th>' : '') + '</tr></thead><tbody>';
    rows.forEach(function (r) {
      var map = accessApi().sectionsArrayToMap(r.sections);
      html += '<tr data-req="' + escapeHtml(r.id) + '">' + (withActions ? '<td>' + escapeHtml(r.requesterEmail || '') + '<div class="muted-note">' + escapeHtml(fmtWhen(r.createdAt)) + '</div></td>' : '') +
        '<td><strong>' + escapeHtml(r.botName || '') + '</strong><div class="muted-note">' + escapeHtml(r.botEmail || '') + '</div></td>' +
        '<td>' + escapeHtml(sectionsText(map)) + '</td><td>' + escapeHtml(r.reason || '') + '</td>' +
        '<td><span class="badge st-' + escapeHtml(r.status || '') + '">' + escapeHtml(r.status || '') + '</span>' +
        (r.decidedBy ? '<div class="muted-note">' + escapeHtml(r.decidedBy) + ', ' + escapeHtml(fmtWhen(r.decidedAt)) + '</div>' : '') + '</td>' +
        (withActions ? '<td class="access-actions">' + (r.status === 'pending' ?
          '<button type="button" data-ract="approve">Approve</button><button type="button" class="ghost" data-ract="edit">Edit</button><button type="button" class="ghost" data-ract="deny">Deny</button>' : '') + '</td>' : '') +
        '</tr>';
      if (withActions && grantEditing && grantEditing.kind === 'request' && grantEditing.id === r.id) {
        html += '<tr class="edit-row"><td colspan="6">' + sectionsEditorHtml('re', map, true) +
          '<div class="access-actions"><button type="button" class="ghost" data-ract="cancel">Cancel</button><button type="button" class="ghost" data-ract="save">Save sections</button>' +
          '<button type="button" data-ract="approve-edited">Save and approve</button></div></td></tr>';
      }
    });
    return html + '</tbody></table></div>';
  }

  function renderMyBots(body, me) {
    var html = '<div class="section-title">Request bot access</div>';
    html += '<p class="muted-note">Let a bot (HelperBot or another AI helper with its own Google account) act for you in the sections you choose. An admin reviews every request. You can only request up to your own access.</p>';
    html += '<form id="bot-req-form" class="bot-req-form"><div class="row">' +
      '<div class="field"><label for="br-email">Bot email</label><input type="email" id="br-email" placeholder="assistant@example.com" required /></div>' +
      '<div class="field"><label for="br-name">Bot name</label><input type="text" id="br-name" placeholder="HelperBot" required /></div></div>' +
      '<div class="field"><label>Sections</label>' + sectionsEditorHtml('br', {}, profileIsAdmin()) + '</div>' +
      '<div class="field"><label for="br-reason">Reason</label><textarea id="br-reason" rows="2" required placeholder="What will the bot do for you?"></textarea></div>' +
      '<div class="detail-actions"><span class="spacer"></span><button type="submit" id="br-send">Send request</button></div></form>';
    html += '<div class="section-title">My requests</div>' + requestsTableHtml(profileData.myRequests, false);
    var mine = profileData.grants.filter(function (g) { return String(g.sponsorUserEmail || '').toLowerCase() === me.email; });
    html += '<div class="section-title">My approved bots</div>' + (mine.length ? grantsTableHtml(mine, false) : '<div class="file-empty">None yet.</div>');
    body.innerHTML = html;
    document.getElementById('bot-req-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var botEmail = document.getElementById('br-email').value.trim().toLowerCase();
      var botName = document.getElementById('br-name').value.trim();
      var reason = document.getElementById('br-reason').value.trim();
      var map = readSectionsEditor(body, 'br');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(botEmail)) { alert('Enter a valid bot email.'); return; }
      if (!botName) { alert('Bot name is required.'); return; }
      if (!Object.keys(map).length) { alert('Pick at least one section.'); return; }
      if (!reason) { alert('Add a short reason.'); return; }
      var over = Object.keys(map).filter(function (k) { return (map[k] === 'write' && myGrantLevel(k) !== 'write') || myGrantLevel(k) === 'none'; });
      if (over.length) { alert('You can only request up to your own access. Too high: ' + over.map(function (k) { return ACCESS_SECTION_LABELS[k]; }).join(', ')); return; }
      if (profileData.myRequests.some(function (r) { return r.status === 'pending' && String(r.botEmail).toLowerCase() === botEmail; })) {
        alert('You already have a pending request for this bot.'); return;
      }
      var btn = document.getElementById('br-send');
      btn.disabled = true;
      accessApi().createRequest({ botEmail: botEmail, botName: botName, reason: reason, sections: accessApi().sectionsMapToArray(map) })
        .then(function (r) {
          logChange('access-request', 'bot', botEmail, 'Requested ' + sectionsText(map) + ' for ' + botName + ': ' + reason);
          save();
          showToast(r.audited ? 'Request sent to admins' : 'Request sent to admins (audit log needs the new rules)');
          return loadProfileData();
        })
        .catch(function (err) { alert('Could not send the request: ' + (err && err.message ? err.message : err)); btn.disabled = false; });
    });
  }

  var MATRIX_LIVE_URL = 'https://YOUR-PROJECT-ID.web.app';
  function matrixUrl() {
    return /^https?:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname) ? location.origin : MATRIX_LIVE_URL;
  }
  function inviteMessage(email) {
    return 'You are invited to the Matrix CRM.\n\nOpen ' + matrixUrl() + ' and choose Sign in with Google, using ' + email + '.';
  }
  function inviteMailto(email) {
    return 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent('Your Matrix CRM invite') + '&body=' + encodeURIComponent(inviteMessage(email));
  }

  // Can this email sign in? Fixed allowlist, or an invite (users doc with status invited or active).
  function userCanSignIn(email) {
    var e = String(email || '').toLowerCase();
    if (accessApi().isOnAllowlist(e)) return true;
    return profileData.users.some(function (u) { return u.id === e && (u.status === 'invited' || u.status === 'active'); });
  }

  function peopleHtml() {
    var rulesPending = profileData.audit === null;
    var html = '<div class="section-title people-head">People<button type="button" id="inv-open"' + (inviteOpen ? ' hidden' : '') + '>Invite user</button></div>';
    if (inviteOpen) {
      html += '<form id="invite-form" class="bot-req-form"><div class="row">' +
        '<div class="field"><label for="inv-email">Google email</label><input type="email" id="inv-email" placeholder="name@example.com" required /></div>' +
        '<div class="field"><label for="inv-name">Name</label><input type="text" id="inv-name" placeholder="Optional" /></div></div>' +
        '<div class="field"><label>Role</label><div class="inv-roles">' +
        '<label><input type="radio" name="inv-role" value="member" checked /> Member</label>' +
        '<label><input type="radio" name="inv-role" value="admin" /> Admin</label></div></div>' +
        '<div class="field"><label>Sections</label>' + sectionsEditorHtml('inv', {}, true) +
        '<p class="muted-note">Section access is saved on the profile. The Matrix does not limit people by section yet, so anyone invited can see and edit every board.</p></div>' +
        '<div class="detail-actions"><button type="button" class="ghost" id="inv-cancel">Cancel</button><span class="spacer"></span><button type="submit" id="inv-send">Invite</button></div></form>';
    }
    if (lastInvite) {
      html += '<div class="access-note invite-ready"><strong>' + escapeHtml(lastInvite.email) + ' is invited.</strong> The Matrix does not send email. Send them this:' +
        '<textarea id="inv-msg" rows="3" readonly>' + escapeHtml(inviteMessage(lastInvite.email)) + '</textarea>' +
        '<div class="access-actions"><button type="button" class="ghost" id="inv-copy">Copy message</button>' +
        '<a class="btn-link" id="inv-mail" href="' + escapeHtml(inviteMailto(lastInvite.email)) + '">Open in email</a>' +
        '<button type="button" class="ghost" id="inv-done">Done</button></div></div>';
    }
    if (rulesPending) {
      html += '<div class="access-note">Invited people can sign in once the Phase 2 Firestore rules are deployed. Until then only the fixed allowlist can sign in.</div>';
    }
    if (profileData.users.some(function (u) { return u.status === 'invited'; })) {
      html += '<p class="muted-note">Invites do not expire. Cancel any you no longer need.</p>';
    }
    var users = profileData.users.slice().sort(function (x, y) {
      return (x.status === 'invited' ? 0 : 1) - (y.status === 'invited' ? 0 : 1) || String(x.id).localeCompare(String(y.id));
    });
    if (!users.length) return html + '<div class="file-empty">No profiles yet.</div>';
    html += '<div class="table-wrap"><table class="kpi-table people-list"><thead><tr><th>Person</th><th>Role</th><th>Sections</th><th>Status</th><th>Invited</th><th></th></tr></thead><tbody>';
    users.forEach(function (u) {
      var roles = (u.roles && u.roles.length) ? u.roles.join(', ') : 'member';
      var status = u.status || (accessApi().isOnAllowlist(u.id) ? 'allowlist' : 'no access');
      html += '<tr data-user="' + escapeHtml(u.id) + '"><td><strong>' + escapeHtml(u.displayName || u.id) + '</strong>' +
        (u.displayName ? '<div class="muted-note">' + escapeHtml(u.id) + '</div>' : '') + '</td>' +
        '<td>' + escapeHtml(roles) + '</td>' +
        '<td>' + escapeHtml(roles.indexOf('admin') !== -1 ? 'All (admin)' : sectionsText(u.sectionGrants)) + '</td>' +
        '<td><span class="badge st-' + escapeHtml(status.replace(/\s+/g, '-')) + '">' + escapeHtml(status) + '</span></td>' +
        '<td>' + (u.invitedBy ? escapeHtml(u.invitedBy) + '<div class="muted-note">' + escapeHtml(fmtWhen(u.invitedAt)) + '</div>' : '') + '</td>' +
        '<td class="access-actions">' + (u.status === 'invited' ?
          '<button type="button" class="ghost" data-uact="message">Invite message</button><button type="button" class="ghost" data-uact="cancel-invite">Cancel invite</button>' : '') + '</td></tr>';
    });
    return html + '</tbody></table></div>';
  }

  // Bot keys (issue #63): a per-bot secret for the write API (X-Matrix-Bot-Key). Admin only.
  // The key is shown once; Firestore keeps only its SHA-256.
  function botKeysHtml() {
    var html = '<div class="section-title people-head">Bot keys<button type="button" id="bk-open"' + (keyFormOpen ? ' hidden' : '') + '>Create bot key</button></div>';
    if (profileData.keys === null) {
      return html + '<div class="access-note">Bot keys turn on once the Phase 2 Firestore rules are deployed.</div>';
    }
    html += '<p class="muted-note">A bot sends its key in the X-Matrix-Bot-Key header instead of signing in. It can add and update, never delete. Revoking stops it on its next call.</p>';
    if (lastBotKey) {
      html += '<div class="access-note invite-ready"><strong>Key for ' + escapeHtml(lastBotKey.botName) + '. Copy it now. It is shown once and cannot be found again.</strong>' +
        '<textarea id="bk-key" rows="2" readonly>' + escapeHtml(lastBotKey.key) + '</textarea>' +
        '<div class="access-actions"><button type="button" class="ghost" id="bk-copy">Copy key</button><button type="button" class="ghost" id="bk-done">Done</button></div></div>';
    }
    if (keyFormOpen) {
      var helperbot = profileData.grants.filter(function (g) { return g.status === 'active'; });
      html += '<form id="bk-form" class="bot-req-form"><div class="row">' +
        '<div class="field"><label for="bk-name">Bot name</label><input type="text" id="bk-name" placeholder="SalesBot" required /></div>' +
        '<div class="field"><label for="bk-label">Bot label</label><input type="text" id="bk-label" placeholder="salesbot@bots.example" required />' +
        '<p class="muted-note">Shown as who made each change.</p></div></div>' +
        '<div class="row"><div class="field"><label for="bk-sop">SOP bot</label><select id="bk-sop"><option value="">None</option>' +
        StuffMigrate.sopBots(state).map(function (b) { return '<option value="' + escapeHtml(b.id) + '">' + escapeHtml(b.label) + '</option>'; }).join('') + '</select>' +
        '<p class="muted-note">Which stages this bot owns. Used by the owner check on stage moves.</p></div>' +
        '<div class="field"><label><input type="checkbox" id="bk-manager" /> Matrix Manager: may apply moves for any bot</label></div></div>' +
        (helperbot.length ? '<div class="field"><label for="bk-copyfrom">Copy sections from a bot grant</label><select id="bk-copyfrom"><option value="">Pick sections below</option>' +
          helperbot.map(function (g) { return '<option value="' + escapeHtml(g.id) + '">' + escapeHtml(g.botEmail || g.id) + '</option>'; }).join('') + '</select></div>' : '') +
        '<div class="field"><label>Sections</label>' + sectionsEditorHtml('bk', {}, true) + '</div>' +
        '<div class="detail-actions"><button type="button" class="ghost" id="bk-cancel">Cancel</button><span class="spacer"></span><button type="submit" id="bk-create">Create key</button></div></form>';
    }
    var keys = (profileData.keys || []).slice().sort(function (x, y) {
      return (x.status === 'revoked') - (y.status === 'revoked') || String(y.createdAt || '').localeCompare(String(x.createdAt || ''));
    });
    if (!keys.length) return html + '<div class="file-empty">No bot keys.</div>';
    html += '<div class="table-wrap"><table class="kpi-table keys-list"><thead><tr><th>Bot</th><th>Acts for</th><th>Sections</th><th>Status</th><th>Last used</th></tr></thead><tbody>';
    keys.forEach(function (k) {
      html += '<tr data-key="' + escapeHtml(k.id) + '"><td><strong>' + escapeHtml(k.botName || '') + '</strong><div class="muted-note">' + escapeHtml(k.botEmailLabel || '') + ' (mbk_' + escapeHtml(k.id) + '_...)</div>' +
        (k.status === 'active' ? '<div class="access-actions key-actions-inline"><button type="button" class="ghost" data-kact="edit">Edit sections</button><button type="button" class="danger" data-kact="revoke">Revoke</button></div>' : '') + '</td>' +
        '<td>' + escapeHtml(k.sponsorUserEmail || '') + '</td><td>' + escapeHtml(sectionsText(k.sections)) +
        (k.sopBotId || k.role === 'manager' ? '<div class="muted-note">SOP: ' + escapeHtml(k.role === 'manager' ? 'Matrix Manager' : StuffMigrate.sopBotLabel(state, k.sopBotId)) + '</div>' : '') + '</td>' +
        '<td><span class="badge st-' + escapeHtml(k.status || '') + '">' + escapeHtml(k.status || '') + '</span></td>' +
        '<td>' + (k.lastUsedAt ? escapeHtml(fmtWhen(k.lastUsedAt)) : 'Never') + '</td>' +
        '</tr>';
      if (keyEditing === k.id && k.status === 'active') {
        html += '<tr class="key-edit-row" data-key-edit="' + escapeHtml(k.id) + '"><td colspan="5">' + sectionsEditorHtml('bke', k.sections || {}, true) +
          '<div class="detail-actions"><button type="button" class="ghost" data-kact="edit-cancel">Cancel</button><span class="spacer"></span><button type="button" data-kact="edit-save">Save sections</button></div></td></tr>';
      }
    });
    return html + '</tbody></table></div>';
  }

  function wireBotKeys(body, done, fail) {
    var open = document.getElementById('bk-open');
    if (open) open.addEventListener('click', function () { keyFormOpen = true; lastBotKey = null; renderAccessAdmin(body); });
    var cancel = document.getElementById('bk-cancel');
    if (cancel) cancel.addEventListener('click', function () { keyFormOpen = false; renderAccessAdmin(body); });
    var doneBtn = document.getElementById('bk-done');
    if (doneBtn) doneBtn.addEventListener('click', function () { lastBotKey = null; renderAccessAdmin(body); });
    var copy = document.getElementById('bk-copy');
    if (copy) copy.addEventListener('click', function () {
      var ta = document.getElementById('bk-key');
      var ok = function () { showToast('Key copied'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(ok, function () { ta.select(); document.execCommand('copy'); ok(); });
      else { ta.select(); document.execCommand('copy'); ok(); }
    });
    var from = document.getElementById('bk-copyfrom');
    if (from) from.addEventListener('change', function () {
      var g = profileData.grants.find(function (x) { return x.id === from.value; });
      ACCESS_SECTION_KEYS.forEach(function (k) {
        var lvl = (g && g.sections && g.sections[k]) || 'none';
        var r = body.querySelector('input[name="bk-' + k + '"][value="' + lvl + '"]');
        if (r && g) r.checked = true;
      });
      if (g) {
        var label = document.getElementById('bk-label');
        if (label && !label.value) label.value = g.botEmail || g.id;
      }
    });
    var form = document.getElementById('bk-form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('bk-name').value.trim();
      var label = document.getElementById('bk-label').value.trim().toLowerCase();
      var map = readSectionsEditor(body, 'bk');
      if (!name) { alert('Enter a bot name.'); return; }
      if (!/^[a-z0-9._+-]+@[a-z0-9.-]+$/.test(label)) { alert('The bot label looks like salesbot@bots.example.'); return; }
      if (!Object.keys(map).length) { alert('Pick at least one section.'); return; }
      if (!confirm('Create a key for ' + name + ' (' + label + ') to act for ' + (accessApi().me().email) + '?\n\n' + sectionsText(map))) return;
      var btn = document.getElementById('bk-create');
      btn.disabled = true;
      accessApi().createBotKey({ botName: name, botEmailLabel: label, sections: map,
        sopBotId: document.getElementById('bk-sop').value, role: document.getElementById('bk-manager').checked ? 'manager' : '' }).then(function (res) {
        keyFormOpen = false;
        lastBotKey = { botName: name, key: res.key };
        return done('Bot key created', res, 'Created bot key ' + res.keyId + ' for ' + name + ' (' + label + '): ' + sectionsText(map), label, 'bot-key');
      }).catch(function (err) { btn.disabled = false; fail(err); });
    });
    body.querySelectorAll('tr[data-key] [data-kact="edit"]').forEach(function (b) {
      b.addEventListener('click', function () { keyEditing = b.closest('tr').getAttribute('data-key'); renderAccessAdmin(body); });
    });
    body.querySelectorAll('tr[data-key-edit] [data-kact="edit-cancel"]').forEach(function (b) {
      b.addEventListener('click', function () { keyEditing = null; renderAccessAdmin(body); });
    });
    body.querySelectorAll('tr[data-key-edit] [data-kact="edit-save"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var row = b.closest('tr');
        var id = row.getAttribute('data-key-edit');
        var k = (profileData.keys || []).find(function (x) { return x.id === id; });
        if (!k) return;
        var map = readSectionsEditor(row, 'bke');
        if (!Object.keys(map).length) { alert('Pick at least one section, or revoke the key instead.'); return; }
        if (!confirm('Change sections for ' + (k.botName || k.botEmailLabel) + '?\n\n' + sectionsText(map))) return;
        b.disabled = true;
        accessApi().updateBotKeySections(k, map).then(function (res) {
          keyEditing = null;
          return done('Key updated', res, 'Changed bot key ' + k.id + ' for ' + (k.botName || k.botEmailLabel) + ': ' + sectionsText(map), k.botEmailLabel || k.id, 'bot-key');
        }).catch(function (err) { b.disabled = false; fail(err); });
      });
    });
    body.querySelectorAll('tr[data-key] [data-kact="revoke"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.closest('tr').getAttribute('data-key');
        var k = (profileData.keys || []).find(function (x) { return x.id === id; });
        if (!k) return;
        var note = prompt('Revoke the key for ' + (k.botName || k.botEmailLabel) + '? It stops working on its next call. Reason (optional):');
        if (note === null) return;
        accessApi().revokeBotKey(k, note).then(function (res) {
          return done('Key revoked', res, 'Revoked bot key ' + k.id + ' for ' + (k.botName || k.botEmailLabel) + (note ? ': ' + note : ''), k.botEmailLabel || k.id, 'bot-key');
        }).catch(fail);
      });
    });
  }

  function wirePeople(body, done, fail) {
    var open = document.getElementById('inv-open');
    if (open) open.addEventListener('click', function () { inviteOpen = true; lastInvite = null; renderAccessAdmin(body); });
    var cancel = document.getElementById('inv-cancel');
    if (cancel) cancel.addEventListener('click', function () { inviteOpen = false; renderAccessAdmin(body); });
    var doneBtn = document.getElementById('inv-done');
    if (doneBtn) doneBtn.addEventListener('click', function () { lastInvite = null; renderAccessAdmin(body); });
    var copy = document.getElementById('inv-copy');
    if (copy) copy.addEventListener('click', function () {
      var ta = document.getElementById('inv-msg');
      var text = ta.value;
      var ok = function () { showToast('Invite message copied'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () { ta.select(); document.execCommand('copy'); ok(); });
      else { ta.select(); document.execCommand('copy'); ok(); }
    });
    var form = document.getElementById('invite-form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('inv-email').value.trim().toLowerCase();
      var name = document.getElementById('inv-name').value.trim();
      var roleEl = form.querySelector('input[name="inv-role"]:checked');
      var role = roleEl ? roleEl.value : 'member';
      var map = readSectionsEditor(body, 'inv');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { alert('Enter a valid Google email.'); return; }
      if (accessApi().isOnAllowlist(email)) { alert(email + ' can already sign in.'); return; }
      if (profileData.users.some(function (u) { return u.id === email; })) { alert(email + ' already has a profile.'); return; }
      if (role === 'admin' && !confirm('Invite ' + email + ' as an admin? Admins manage people, bots and all access.')) return;
      var btn = document.getElementById('inv-send');
      btn.disabled = true;
      accessApi().inviteUser({ email: email, displayName: name, role: role, sectionGrants: map }).then(function (res) {
        inviteOpen = false;
        lastInvite = { email: email };
        return done('Invited ' + email, res, 'Invited ' + email + ' as ' + role + (role === 'admin' ? '' : ': ' + sectionsText(map)), email, 'user');
      }).catch(function (err) { btn.disabled = false; fail(err); });
    });
    body.querySelectorAll('tr[data-user] [data-uact]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.closest('tr').getAttribute('data-user');
        var u = profileData.users.find(function (x) { return x.id === id; });
        if (!u) return;
        if (b.getAttribute('data-uact') === 'message') { inviteOpen = false; lastInvite = { email: u.id }; renderAccessAdmin(body); return; }
        if (!confirm('Cancel the invite for ' + u.id + '? They will not be able to sign in.')) return;
        accessApi().cancelInvite(u).then(function (res) {
          if (lastInvite && lastInvite.email === u.id) lastInvite = null;
          return done('Invite cancelled', res, 'Cancelled the invite for ' + u.id, u.id, 'user');
        }).catch(fail);
      });
    });
  }

  function renderAccessAdmin(body) {
    var html = '<p class="muted-note">The company has the final say. Approving creates or updates the bot grant. Revoking stops the bot on its next call.</p>';
    html += peopleHtml();
    html += '<div class="section-title">Requests</div>' + requestsTableHtml(profileData.requests, true);
    html += '<div class="section-title">Bot grants</div>' + (profileData.grants.length ? grantsTableHtml(profileData.grants, true) : '<div class="file-empty">No bot grants.</div>');
    html += botKeysHtml();
    html += '<div class="section-title">Audit log</div>';
    if (profileData.audit === null) html += '<div class="access-note">The audit log turns on once the Phase 2 Firestore rules are deployed. Until then, decisions are still recorded in Admin tools, Change log.</div>';
    else if (!profileData.audit.length) html += '<div class="file-empty">No entries yet.</div>';
    else {
      html += '<div class="table-wrap"><table class="kpi-table"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Bot or person</th><th>Detail</th></tr></thead><tbody>';
      profileData.audit.slice().sort(function (x, y) { return String(y.at || '').localeCompare(String(x.at || '')); }).slice(0, 50).forEach(function (a) {
        var detail = a.after && a.after.sections ? sectionsText(a.after.sections) : a.after && a.after.sectionGrants ? sectionsText(a.after.sectionGrants) : (a.after && a.after.status) || '';
        var target = a.botEmail || (a.after && a.after.email) || (a.before && a.before.email) || '';
        html += '<tr><td>' + escapeHtml(fmtWhen(a.at)) + '</td><td>' + escapeHtml(a.actorEmail || '') + '</td><td>' + escapeHtml(a.action || '') + '</td>' +
          '<td>' + escapeHtml(target) + '</td><td>' + escapeHtml(detail + (a.note ? ' (' + a.note + ')' : '')) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    body.innerHTML = html;

    function done(label, result, logText, botEmail, kind) {
      logChange('access', kind || 'bot', botEmail, logText);
      save();
      grantEditing = null;
      showToast(result && result.audited === false ? label + ' (audit log needs the new rules)' : label);
      return loadProfileData();
    }
    function fail(err) { alert('Could not save: ' + (err && err.message ? err.message : err)); loadProfileData(); }
    wirePeople(body, done, fail);
    wireBotKeys(body, done, fail);

    body.querySelectorAll('tr[data-req] [data-ract], tr.edit-row [data-ract]').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.getAttribute('data-ract');
        var reqId = b.closest('tr').getAttribute('data-req') || (grantEditing && grantEditing.id);
        var r = profileData.requests.find(function (x) { return x.id === reqId; });
        if (!r) return;
        var api = accessApi();
        if (act === 'edit') { grantEditing = { kind: 'request', id: r.id }; renderAccessAdmin(body); return; }
        if (act === 'cancel') { grantEditing = null; renderAccessAdmin(body); return; }
        if (act === 'approve' || act === 'approve-edited') {
          var map = act === 'approve-edited' ? readSectionsEditor(body, 're') : api.sectionsArrayToMap(r.sections);
          if (!Object.keys(map).length) { alert('Pick at least one section, or deny the request.'); return; }
          if (!confirm('Approve ' + (r.botName || r.botEmail) + ' (' + r.botEmail + ') to act for ' + r.requesterEmail + '?\n\n' + sectionsText(map))) return;
          api.approveRequest(r, map, '').then(function (res) {
            var warn = userCanSignIn(r.botEmail) ? '' : ' Invite it under People before it can sign in.';
            return done('Approved' + (warn ? '.' + warn : ''), res, 'Approved ' + r.botEmail + ' for ' + r.requesterEmail + ': ' + sectionsText(map), r.botEmail);
          }).catch(fail);
        } else if (act === 'save') {
          var m2 = readSectionsEditor(body, 're');
          api.editRequest(r, m2).then(function (res) { return done('Request updated', res, 'Edited request ' + r.id + ' for ' + r.botEmail + ': ' + sectionsText(m2), r.botEmail); }).catch(fail);
        } else if (act === 'deny') {
          var note = prompt('Reason for denying (optional):');
          if (note === null) return;
          api.denyRequest(r, note).then(function (res) { return done('Request denied', res, 'Denied ' + r.botEmail + ' for ' + r.requesterEmail + (note ? ': ' + note : ''), r.botEmail); }).catch(fail);
        }
      });
    });
    body.querySelectorAll('tr[data-grant] [data-gact], tr.edit-row [data-gact]').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.getAttribute('data-gact');
        var gid = b.closest('tr').getAttribute('data-grant') || (grantEditing && grantEditing.id);
        var g = profileData.grants.find(function (x) { return x.id === gid; });
        if (!g) return;
        var api = accessApi();
        if (act === 'edit') { grantEditing = { kind: 'grant', id: g.id }; renderAccessAdmin(body); return; }
        if (act === 'cancel') { grantEditing = null; renderAccessAdmin(body); return; }
        if (act === 'save') {
          var m = readSectionsEditor(body, 'ge');
          if (!Object.keys(m).length) { alert('A grant needs at least one section. To remove all access, revoke it.'); return; }
          api.editGrant(g, m).then(function (res) { return done('Grant updated', res, 'Edited grant ' + (g.botEmail || g.id) + ': ' + sectionsText(m), g.botEmail || g.id); }).catch(fail);
        } else if (act === 'revoke') {
          var note = prompt('Revoke ' + (g.botEmail || g.id) + '? It stops working on its next call. Reason (optional):');
          if (note === null) return;
          api.revokeGrant(g, note, profileData.requests).then(function (res) { return done('Grant revoked', res, 'Revoked ' + (g.botEmail || g.id) + (note ? ': ' + note : ''), g.botEmail || g.id); }).catch(fail);
        }
      });
    });
  }

  // Stale-save guard: the cloud had a newer copy than the one this tab was about to save.
  function onCloudConflict(remote) {
    try { takeSnapshot('before-cloud-reload'); } catch (e) { /* keep going: the cloud copy still wins */ }
    if (remote && remote.state && !(remote.state.settings && remote.state.settings.skuJobs1)) snapshotBeforeSkuJobs(JSON.stringify(remote.state));
    if (remote && remote.state && StuffMigrate.wonStagePending(remote.state)) snapshotBeforeWonStage(JSON.stringify(remote.state));
    if (remote && remote.state && StuffMigrate.awaitingPaymentPending(remote.state)) snapshotBeforeAwaiting(JSON.stringify(remote.state));
    state = normalizeState(remote.state);
    saveLocalOnly();
    renderApp();
    showToast('Cloud had a newer copy, so it was reloaded. Your last change is saved in Time machine; please redo it.');
  }

  var cloudSaveErrorShownAt = 0;
  function onCloudSaveError() {
    if (Date.now() - cloudSaveErrorShownAt < 60000) return;
    cloudSaveErrorShownAt = Date.now();
    showToast('Could not save to the cloud. Retrying.');
  }

  var headerSopBtn = document.getElementById('btn-header-sop');
  if (headerSopBtn) headerSopBtn.addEventListener('click', function () {
    if (activeView === 'sop') setActiveView('board'); else setActiveSop();
  });

  var headerProfileBtn = document.getElementById('btn-header-profile');
  if (headerProfileBtn) headerProfileBtn.addEventListener('click', function () {
    if (activeView === 'profile') setActiveView('board'); else setActiveProfile('me');
  });

  var btnHeaderAdmin = document.getElementById('btn-header-admin');
  if (btnHeaderAdmin) btnHeaderAdmin.addEventListener('click', function () {
    if (activeView === 'admin') setActiveView('board'); else setActiveAdmin();
  });

  // Popover menus in the header (settings gear, board "...", #104). One open at a time; a click
  // outside, Esc or picking an item closes it. The items keep their own click handlers.
  function bindPopMenu(btnId, menuId) {
    var btn = document.getElementById(btnId);
    var menu = document.getElementById(menuId);
    if (!btn || !menu) return;
    function setOpen(open) {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.hidden;
      document.querySelectorAll('.pop-menu').forEach(function (m) { m.hidden = true; });
      setOpen(open);
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('.pop-item')) setOpen(false); });
    document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setOpen(false); btn.focus(); } });
  }
  bindPopMenu('btn-header-menu', 'header-menu');
  bindPopMenu('btn-board-menu', 'board-menu');

  window.addEventListener('beforeunload', function () {
    Object.keys(coverUrlCache).forEach(function (k) { try { URL.revokeObjectURL(coverUrlCache[k]); } catch (e) { /* ignore */ } });
  });

  // ---------------------------------------------------------------------
  // Mobile and accessibility helpers (issue #42)
  // ---------------------------------------------------------------------
  var TASK_MOVE_TARGETS = [['do', 'Do'], ['decide', 'Decide'], ['delegate', 'Delegate'], ['delete', 'Delete'], ['completed', 'Completed']];
  function taskMoveSelectHtml(taskId, current) {
    return '<select class="task-move" data-task-move="' + escapeHtml(taskId) + '" aria-label="Move task to">' +
      '<option value="">Move to...</option>' + TASK_MOVE_TARGETS.filter(function (o) { return o[0] !== current; }).map(function (o) {
        return '<option value="' + o[0] + '">' + o[1] + '</option>';
      }).join('') + '</select>';
  }

  // A "Move" button on board cards: pick a stage without dragging.
  function addCardMoveButton(el, id, title) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-move';
    btn.textContent = 'Move';
    btn.setAttribute('aria-label', 'Move ' + (title || 'card') + ' to another stage');
    btn.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); openCardMoveMenu(id, title); });
    btn.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    btn.draggable = false;
    el.appendChild(btn);
  }

  function openCardMoveMenu(id, title) {
    var deal = getDeal(id);
    var job = deal ? null : getJobCard(id);
    var stage = deal ? deal.stage : job ? job.stage : null;
    var sec = stage ? sectionForStage(stage) : currentSection();
    var stages = sectionStages(sec || currentSection());
    var html = '<div class="modal-title-row"><h2 id="card-move-title">Move ' + escapeHtml(title || 'card') + '</h2></div>' +
      '<p class="muted-note">' + escapeHtml(sec ? areaLabelFor(sec.area) + ' / ' + sec.label : '') + '</p><div class="move-list">' +
      stages.map(function (st) {
        return '<button type="button" class="' + (st === stage ? 'secondary' : 'ghost') + '" data-move-stage="' + escapeHtml(st) + '"' +
          (st === stage ? ' aria-current="true" disabled' : '') + '>' + escapeHtml(stageLabel(st)) + (st === stage ? ' (here now)' : '') + '</button>';
      }).join('') + '</div>' +
      '<div class="modal-actions"><span class="spacer"></span><button type="button" class="ghost" data-job-cancel>Cancel</button></div>';
    var m = openJobModal(html, 'sm');
    m.querySelectorAll('[data-move-stage]').forEach(function (b) {
      b.addEventListener('click', function () {
        closeJobModal();
        if (moveDealToStage(id, b.getAttribute('data-move-stage'))) renderBoard();
      });
    });
  }

  // Every modal: role and name, focus moves in on open and back to the opener on close,
  // Tab stays inside, Esc closes the ones without their own handler.
  function setupModalA11y() {
    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    function openBackdrop() {
      var list = document.querySelectorAll('.modal-backdrop.open');
      return list.length ? list[list.length - 1] : null;
    }
    var obs = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        var bd = m.target;
        var isOpen = bd.classList.contains('open');
        var was = (' ' + (m.oldValue || '') + ' ').indexOf(' open ') !== -1;
        if (isOpen && !was) {
          bd._opener = document.activeElement;
          var box = bd.querySelector('.modal') || bd;
          if (!box.hasAttribute('tabindex')) box.setAttribute('tabindex', '-1');
          var h = box.querySelector('h2');
          if (h && !bd.getAttribute('aria-labelledby')) {
            if (!h.id) h.id = bd.id + '-title';
            bd.setAttribute('aria-labelledby', h.id);
          }
          setTimeout(function () { if (!box.contains(document.activeElement)) box.focus({ preventScroll: true }); }, 0);
        }
        if (!isOpen && was) {
          var o = bd._opener;
          bd._opener = null;
          if (h2Gone(bd)) bd.removeAttribute('aria-labelledby');
          if (o && document.contains(o) && typeof o.focus === 'function') o.focus({ preventScroll: true });
        }
      });
    });
    function h2Gone(bd) { var id = bd.getAttribute('aria-labelledby'); return id && !document.getElementById(id); }
    document.querySelectorAll('.modal-backdrop').forEach(function (bd) {
      obs.observe(bd, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    });
    document.addEventListener('keydown', function (e) {
      var bd = openBackdrop();
      if (!bd) return;
      if (e.key === 'Escape' && bd.id === 'quote-modal-backdrop') { closeQuoteModal(); return; }
      if (e.key !== 'Tab') return;
      var items = Array.prototype.filter.call(bd.querySelectorAll(FOCUSABLE), function (el) { return el.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !bd.contains(document.activeElement) || document.activeElement === bd.querySelector('.modal'))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !bd.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    });
  }

  function bootLocal() {
    loadAuth();
    load();
    loadActiveNav();
    loadNavOpen();
    loadAreaOpen();
    var navToggle = document.getElementById('btn-nav-toggle');
    if (navToggle) navToggle.addEventListener('click', toggleNav);
    var navScrim = document.getElementById('nav-scrim');
    if (navScrim) navScrim.addEventListener('click', function () { if (navOpen && isPhoneWidth()) toggleNav(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navOpen && isPhoneWidth() && !document.querySelector('.modal-backdrop.open')) toggleNav();
    });
    setupModalA11y();
    applyNavOpen();
    showStagingBanner();
    renderApp();
  }
  if (window.MatrixCloud && typeof window.MatrixCloud.start === 'function') {
    window.MatrixCloud.start({
      getState: function () { return state; },
      snapshotLocal: function (label) { try { takeSnapshot(label); } catch (e) { /* storage full: nothing to keep */ } },
      setState: function (s) {
        if (s && !(s.settings && s.settings.skuJobs1)) snapshotBeforeSkuJobs(JSON.stringify(s));
        if (s && StuffMigrate.wonStagePending(s)) snapshotBeforeWonStage(JSON.stringify(s));
        if (s && StuffMigrate.awaitingPaymentPending(s)) snapshotBeforeAwaiting(JSON.stringify(s));
        state = normalizeState(s);
        loadFailed = false;
        if (!completionCache.loaded) setTimeout(loadCompletionCache, 0);
      },
      saveLocal: function () { saveLocalOnly(); },
      bootLocal: bootLocal,
      render: function () { try { detectNewInboundLeads(); openLeadFromHash(); } catch (e) { /* alert only */ } renderApp(); },
      onCloudConflict: function (remote) { onCloudConflict(remote); },
      onCloudSaveError: function (err) { onCloudSaveError(err); },
      setAuthUser: function (user) {
        if (!user) {
          auth.signedIn = false;
          auth.user = { name: '', email: '' };
        } else {
          auth.signedIn = true;
          auth.provider = 'google';
          auth.user = { name: user.displayName || user.email || '', email: user.email || '' };
          auth.role = 'admin';
        }
        saveAuth();
        applyRoleToChrome();
        var chip = document.getElementById('role-chip');
        if (chip) chip.textContent = (user && user.email) ? user.email : (auth.signedIn ? 'Admin' : 'Signed out');
        var hp = document.getElementById('btn-header-profile');
        if (hp) {
          var initial = ((user && (user.displayName || user.email)) || '?').trim().charAt(0).toUpperCase();
          hp.innerHTML = (user && user.photoURL)
            ? '<img src="' + escapeHtml(user.photoURL) + '" alt="" referrerpolicy="no-referrer" />'
            : '<span>' + escapeHtml(initial) + '</span>';
          hp.hidden = !user;
        }
        profileData = { loading: false, error: '', profile: null, myRequests: [], requests: [], grants: [], users: [], audit: null, loadedAt: 0 };
        if (user && activeView === 'profile') loadProfileData();
      }
    });
  } else {
    bootLocal();
  }
})();
