export const FORM_FIELD_TYPES = ["text", "textarea", "number", "email", "select"];

export const DEFAULT_SECTION_OPTIONS = [
  "Entry",
  "Exit",
  "Forming",
  "Welding",
  "Sizing",
  "Cut-off",
];

export function normalizeFieldOptions(options) {
  if (!Array.isArray(options)) return [];
  const seen = new Set();
  const out = [];
  for (const item of options) {
    const value = String(item).trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}
