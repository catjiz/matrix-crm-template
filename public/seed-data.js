/* Hosting seed: menu structure only, no customer data. Full seed at the repo root,
   used for tests and local (file:// or http.server) runs. Regenerate this file with
   tools/build-public.py, never edit it by hand. */
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
 "deals": []
};
