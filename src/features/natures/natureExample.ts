/**
 * The canonical challan nature, kept as text so the docs can show exactly
 * what a SUPER_ADMIN saves through the admin console's nature builder.
 *
 * No `integrity` or `verdict_policy` block — those are common to every
 * nature and applied automatically at resolution time, never authored here.
 */
export const NATURE_EXAMPLE = `{
  "template_key": "challan",
  "description": "Indian government challan — PF / ESI / GST / LWF",
  "extraction": {
    "plugin": "extractor.generic",
    "strategy": "auto",
    "render": { "dpi": 150, "max_side": 1800, "format": "webp" },
    "max_text_chars": 20000,
    "timeout_s": 120,
    "instructions": "You are a document analyst extracting structured data from Indian government challans. Return ONLY valid JSON. If a field is not present, return null.",
    "fields": [
      { "key": "company_name", "label": "Company Name", "type": "string", "hint": "Full legal company name as printed." },
      { "key": "authority", "label": "Authority", "type": "string" },
      { "key": "state", "label": "State", "type": "string" },
      { "key": "challan_period", "label": "Challan Period", "type": "period" },
      { "key": "challan_amount", "label": "Challan Amount", "type": "number" },
      { "key": "challan_date", "label": "Challan Date", "type": "date", "format": "DD-MM-YYYY" }
    ]
  },
  "checks": [
    { "plugin": "check.fuzzy_text", "field": "company_name", "expects": "company_name", "severity": "mandatory", "params": { "threshold": 95, "absence_rule": "both_absent" } },
    { "plugin": "check.authority_match", "field": "authority", "expects": "authority", "severity": "mandatory", "params": { "fuzzy_threshold": 90 } },
    { "plugin": "check.state_match", "field": "state", "expects": "state", "severity": "advisory", "params": { "threshold": 90 } },
    { "plugin": "check.numeric_equals", "field": "challan_amount", "expects": "challan_amount", "severity": "mandatory", "params": { "tolerance": 0 } },
    { "plugin": "check.period_match", "field": "challan_period", "expects": "challan_period", "severity": "mandatory", "params": { "absence_rule": "both_absent" } },
    { "plugin": "check.date_equals", "field": "challan_date", "expects": "challan_date", "severity": "mandatory", "params": { "tolerance_days": 0, "dayfirst": true } }
  ]
}`;

export const EXTRACTION_PLUGINS = ["extractor.generic"] as const;

export const INTEGRITY_PLUGINS = [
  "integrity.blank_page",
  "integrity.pdf_overlay",
  "integrity.metadata",
] as const;

export const CHECK_PLUGINS = [
  "check.fuzzy_text",
  "check.date_equals",
  "check.numeric_equals",
  "check.period_match",
  "check.state_match",
  "check.authority_match",
] as const;
