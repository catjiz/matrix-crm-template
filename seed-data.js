/* Root seed with EXAMPLE DATA (fictional). Written by tools/seed-example.mjs. */
window.MATRIX_SEED = {
 "version": 11,
 "areas": [
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
 ],
 "sections": [
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
   "label": "partner Leads",
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
    "production-po-received"
   ]
  },
  {
   "id": "pp-raw-material-sampling",
   "label": "Raw Material Sampling",
   "area": "pre-production",
   "stages": [
    "raw-material-sampling"
   ]
  },
  {
   "id": "pp-freight",
   "label": "Logistics",
   "area": "pre-production",
   "stages": [
    "freight"
   ]
  },
  {
   "id": "fo-scheduling",
   "label": "Scheduling",
   "area": "floor-operations",
   "stages": [
    "handoff-to-operations",
    "materials-ready",
    "first-articles",
    "production-setup"
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
 ],
 "stages": [
  "cold-leads",
  "lost",
  "inbound-jotform",
  "partner-new",
  "partner-active",
  "partner-handed-off",
  "needs-quotation",
  "needs-updated-quotation",
  "design-prototyping-quote-sent",
  "follow-up-negotiation",
  "invoicing",
  "won-awaiting-payment",
  "design-in-progress",
  "round-1",
  "round-2",
  "round-3",
  "completed-end-deal",
  "prototyping-in-progress",
  "round-1-fwa",
  "round-2-d3x",
  "round-3-tfm",
  "complete-end-deal",
  "needs-sourcing",
  "tooling-production-quoted",
  "won-tooling-committed",
  "production-po-received",
  "raw-material-sampling",
  "freight",
  "handoff-to-operations",
  "materials-ready",
  "first-articles",
  "production-setup",
  "raw-materials-production",
  "processes",
  "qc",
  "packaging",
  "amazon-com",
  "ppe-com"
 ],
 "stageLabels": {
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
  "complete-end-deal": "Complete, End Deal",
  "amazon-com": "Amazon.com",
  "ppe-com": "PPE.com"
 },
 "tasks": [],
 "deals": [
  {
   "id": "example-1",
   "company": "Zephyrine Trail Goods",
   "title": "Silicone bottle sleeve",
   "stage": "cold-leads",
   "contactName": "Marla Quenby",
   "contactEmail": "marla.quenby@example.com",
   "contactPhone": "555-0100",
   "nextFollowUp": "2026-11-01",
   "notes": [
    {
     "id": "n-example-1",
     "text": "EXAMPLE DATA. Fictional deal for training.",
     "createdAt": "2026-10-29T00:02:33.376Z"
    }
   ],
   "timeline": [],
   "files": [],
   "source": "Example data",
   "values": {},
   "createdAt": "2026-10-29T00:02:33.376Z",
   "updatedAt": "2026-10-29T00:02:33.376Z",
   "lastActivityAt": "2026-10-29T00:02:33.376Z"
  },
  {
   "id": "example-2",
   "company": "Thimbleroot Kitchenware",
   "title": "Heat-safe trivet",
   "stage": "inbound-jotform",
   "contactName": "Devin Arkwell",
   "contactEmail": "devin.arkwell@example.com",
   "contactPhone": "555-0100",
   "nextFollowUp": "2026-11-02",
   "notes": [
    {
     "id": "n-example-2",
     "text": "EXAMPLE DATA. Fictional deal for training.",
     "createdAt": "2026-10-29T00:02:33.376Z"
    }
   ],
   "timeline": [],
   "files": [],
   "source": "Example data",
   "values": {},
   "createdAt": "2026-10-29T00:02:33.376Z",
   "updatedAt": "2026-10-29T00:02:33.376Z",
   "lastActivityAt": "2026-10-29T00:02:33.376Z"
  },
  {
   "id": "example-3",
   "company": "Vellichor Medical (Example)",
   "title": "Grip cover prototype",
   "stage": "needs-quotation",
   "contactName": "Lena Brightwater",
   "contactEmail": "lena.brightwater@example.com",
   "contactPhone": "555-0100",
   "nextFollowUp": "2026-11-03",
   "notes": [
    {
     "id": "n-example-3",
     "text": "EXAMPLE DATA. Fictional deal for training.",
     "createdAt": "2026-10-29T00:02:33.376Z"
    }
   ],
   "timeline": [],
   "files": [],
   "source": "Example data",
   "values": {},
   "createdAt": "2026-10-29T00:02:33.376Z",
   "updatedAt": "2026-10-29T00:02:33.376Z",
   "lastActivityAt": "2026-10-29T00:02:33.376Z"
  },
  {
   "id": "example-4",
   "company": "Pemberwick Toys",
   "title": "Teether ring set",
   "stage": "design-prototyping-quote-sent",
   "contactName": "Sam Thistlewood",
   "contactEmail": "sam.thistlewood@example.com",
   "contactPhone": "555-0100",
   "nextFollowUp": "2026-11-04",
   "notes": [
    {
     "id": "n-example-4",
     "text": "EXAMPLE DATA. Fictional deal for training.",
     "createdAt": "2026-10-29T00:02:33.376Z"
    }
   ],
   "timeline": [],
   "files": [],
   "source": "Example data",
   "values": {
    "quoted": 4200
   },
   "createdAt": "2026-10-29T00:02:33.376Z",
   "updatedAt": "2026-10-29T00:02:33.376Z",
   "lastActivityAt": "2026-10-29T00:02:33.376Z"
  },
  {
   "id": "example-5",
   "company": "Quillfeather Pet Supply",
   "title": "Collapsible pet bowl",
   "stage": "follow-up-negotiation",
   "contactName": "Priya Ashcombe",
   "contactEmail": "priya.ashcombe@example.com",
   "contactPhone": "555-0100",
   "nextFollowUp": "2026-11-05",
   "notes": [
    {
     "id": "n-example-5",
     "text": "EXAMPLE DATA. Fictional deal for training.",
     "createdAt": "2026-10-29T00:02:33.376Z"
    }
   ],
   "timeline": [],
   "files": [],
   "source": "Example data",
   "values": {
    "quoted": 6800
   },
   "createdAt": "2026-10-29T00:02:33.376Z",
   "updatedAt": "2026-10-29T00:02:33.376Z",
   "lastActivityAt": "2026-10-29T00:02:33.376Z"
  },
  {
   "id": "example-6",
   "company": "Orrinvale Audio Labs",
   "title": "Earbud tip kit",
   "stage": "won-awaiting-payment",
   "contactName": "Tom Wexley",
   "contactEmail": "tom.wexley@example.com",
   "contactPhone": "555-0100",
   "nextFollowUp": "2026-11-06",
   "notes": [
    {
     "id": "n-example-6",
     "text": "EXAMPLE DATA. Fictional deal for training.",
     "createdAt": "2026-10-29T00:02:33.376Z"
    }
   ],
   "timeline": [],
   "files": [],
   "source": "Example data",
   "values": {
    "quoted": 3500
   },
   "createdAt": "2026-10-29T00:02:33.376Z",
   "updatedAt": "2026-10-29T00:02:33.376Z",
   "lastActivityAt": "2026-10-29T00:02:33.376Z"
  },
  {
   "id": "example-7",
   "company": "Brindlecove Marine Parts",
   "title": "Rubber hatch gasket",
   "stage": "design-in-progress",
   "contactName": "Grace Holloway-Fenn",
   "contactEmail": "grace.holloway.fenn@example.com",
   "contactPhone": "555-0100",
   "nextFollowUp": "2026-11-07",
   "notes": [
    {
     "id": "n-example-7",
     "text": "EXAMPLE DATA. Fictional deal for training.",
     "createdAt": "2026-10-29T00:02:33.376Z"
    }
   ],
   "timeline": [],
   "files": [],
   "source": "Example data",
   "values": {
    "quoted": 9100
   },
   "createdAt": "2026-10-29T00:02:33.376Z",
   "updatedAt": "2026-10-29T00:02:33.376Z",
   "lastActivityAt": "2026-10-29T00:02:33.376Z"
  },
  {
   "id": "example-8",
   "company": "Larkspire Baby Co.",
   "title": "Bottle nipple v2",
   "stage": "prototyping-in-progress",
   "contactName": "Omar Venturelli",
   "contactEmail": "omar.venturelli@example.com",
   "contactPhone": "555-0100",
   "nextFollowUp": "2026-11-08",
   "notes": [
    {
     "id": "n-example-8",
     "text": "EXAMPLE DATA. Fictional deal for training.",
     "createdAt": "2026-10-29T00:02:33.376Z"
    }
   ],
   "timeline": [],
   "files": [],
   "source": "Example data",
   "values": {
    "quoted": 5400
   },
   "createdAt": "2026-10-29T00:02:33.376Z",
   "updatedAt": "2026-10-29T00:02:33.376Z",
   "lastActivityAt": "2026-10-29T00:02:33.376Z"
  },
  {
   "id": "example-9",
   "company": "Zephyrine Trail Goods",
   "title": "Cap tether, 2-cavity mold",
   "stage": "tooling-production-quoted",
   "contactName": "Marla Quenby",
   "contactEmail": "marla.quenby@example.com",
   "contactPhone": "555-0100",
   "nextFollowUp": "2026-11-09",
   "notes": [
    {
     "id": "n-example-9",
     "text": "EXAMPLE DATA. Fictional deal for training.",
     "createdAt": "2026-10-29T00:02:33.376Z"
    }
   ],
   "timeline": [],
   "files": [],
   "source": "Example data",
   "values": {
    "quoted": 18500
   },
   "createdAt": "2026-10-29T00:02:33.376Z",
   "updatedAt": "2026-10-29T00:02:33.376Z",
   "lastActivityAt": "2026-10-29T00:02:33.376Z"
  },
  {
   "id": "example-10",
   "company": "Vellichor Medical (Example)",
   "title": "Grip cover production run",
   "stage": "production-po-received",
   "contactName": "Lena Brightwater",
   "contactEmail": "lena.brightwater@example.com",
   "contactPhone": "555-0100",
   "nextFollowUp": "2026-11-10",
   "notes": [
    {
     "id": "n-example-10",
     "text": "EXAMPLE DATA. Fictional deal for training.",
     "createdAt": "2026-10-29T00:02:33.376Z"
    }
   ],
   "timeline": [],
   "files": [],
   "source": "Example data",
   "values": {
    "quoted": 27000
   },
   "createdAt": "2026-10-29T00:02:33.376Z",
   "updatedAt": "2026-10-29T00:02:33.376Z",
   "lastActivityAt": "2026-10-29T00:02:33.376Z"
  },
  {
   "id": "example-11",
   "company": "Quillfeather Pet Supply",
   "title": "Lick mat first articles",
   "stage": "first-articles",
   "contactName": "Priya Ashcombe",
   "contactEmail": "priya.ashcombe@example.com",
   "contactPhone": "555-0100",
   "nextFollowUp": "2026-11-11",
   "notes": [
    {
     "id": "n-example-11",
     "text": "EXAMPLE DATA. Fictional deal for training.",
     "createdAt": "2026-10-29T00:02:33.376Z"
    }
   ],
   "timeline": [],
   "files": [],
   "source": "Example data",
   "values": {
    "quoted": 12000
   },
   "createdAt": "2026-10-29T00:02:33.376Z",
   "updatedAt": "2026-10-29T00:02:33.376Z",
   "lastActivityAt": "2026-10-29T00:02:33.376Z"
  },
  {
   "id": "example-12",
   "company": "Thimbleroot Kitchenware",
   "title": "Spatula head QC lot",
   "stage": "qc",
   "contactName": "Devin Arkwell",
   "contactEmail": "devin.arkwell@example.com",
   "contactPhone": "555-0100",
   "nextFollowUp": "2026-11-12",
   "notes": [
    {
     "id": "n-example-12",
     "text": "EXAMPLE DATA. Fictional deal for training.",
     "createdAt": "2026-10-29T00:02:33.376Z"
    }
   ],
   "timeline": [],
   "files": [],
   "source": "Example data",
   "values": {
    "quoted": 8800
   },
   "createdAt": "2026-10-29T00:02:33.376Z",
   "updatedAt": "2026-10-29T00:02:33.376Z",
   "lastActivityAt": "2026-10-29T00:02:33.376Z"
  }
 ]
};
