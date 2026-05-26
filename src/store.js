// ─── StockAI Global Store ────────────────────────────────────────────────────
// Single source of truth. No Redux needed for Phase 1.
// Replace with backend API calls in Phase 2.

export const INITIAL_INVENTORY = [
  { id: 1,  name: "Water Pump 1HP",        sku: "WP-001", category: "Pumps",       stock: 42, reorder: 20, unit: "pcs",  supplier: "Kirloskar",  costPrice: 2000,  sellPrice: 2800, lastUpdated: "2026-05-20", source: "manual" },
  { id: 2,  name: "Motor Bearings 6205",   sku: "MB-205", category: "Spares",      stock: 8,  reorder: 25, unit: "pcs",  supplier: "SKF India",   costPrice: 300,   sellPrice: 420,  lastUpdated: "2026-05-18", source: "manual" },
  { id: 3,  name: "PVC Pipe 2 inch",       sku: "PP-200", category: "Pipes",       stock: 0,  reorder: 50, unit: "mtr",  supplier: "Finolex",     costPrice: 45,    sellPrice: 68,   lastUpdated: "2026-05-15", source: "manual" },
  { id: 4,  name: "Submersible Pump 2HP",  sku: "SP-002", category: "Pumps",       stock: 15, reorder: 10, unit: "pcs",  supplier: "Grundfos",    costPrice: 10500, sellPrice: 14200,lastUpdated: "2026-05-22", source: "manual" },
  { id: 5,  name: "Copper Wire 2.5mm",     sku: "CW-025", category: "Electrical",  stock: 3,  reorder: 20, unit: "roll", supplier: "Polycab",     costPrice: 1500,  sellPrice: 1900, lastUpdated: "2026-05-19", source: "manual" },
  { id: 6,  name: "Pressure Gauge 0-10",   sku: "PG-010", category: "Instruments", stock: 28, reorder: 10, unit: "pcs",  supplier: "H.Guru",      costPrice: 600,   sellPrice: 850,  lastUpdated: "2026-05-21", source: "manual" },
  { id: 7,  name: "Gate Valve 1 inch",     sku: "GV-100", category: "Valves",      stock: 60, reorder: 15, unit: "pcs",  supplier: "L&T Valves",  costPrice: 300,   sellPrice: 420,  lastUpdated: "2026-05-17", source: "manual" },
  { id: 8,  name: "Centrifugal Pump 0.5HP",sku: "CP-005", category: "Pumps",       stock: 22, reorder: 12, unit: "pcs",  supplier: "Kirloskar",   costPrice: 3200,  sellPrice: 4400, lastUpdated: "2026-05-16", source: "manual" },
  { id: 9,  name: "Cable 4 Core 1.5mm",    sku: "CA-415", category: "Electrical",  stock: 12, reorder: 8,  unit: "roll", supplier: "Polycab",     costPrice: 2200,  sellPrice: 2900, lastUpdated: "2026-05-14", source: "manual" },
  { id: 10, name: "Float Switch",          sku: "FS-001", category: "Controls",    stock: 35, reorder: 15, unit: "pcs",  supplier: "Gems Sensors",costPrice: 180,   sellPrice: 280,  lastUpdated: "2026-05-23", source: "manual" },
];

export const CATEGORIES = ["Pumps", "Spares", "Pipes", "Electrical", "Instruments", "Valves", "Controls"];

export function getStatus(item) {
  if (item.stock === 0) return "out";
  if (item.stock < item.reorder) return "low";
  if (item.stock > item.reorder * 4) return "excess";
  return "ok";
}

export const STATUS_CONFIG = {
  ok:     { label: "In Stock",  bg: "#0d2b1a", color: "#22c55e", dot: "#22c55e" },
  low:    { label: "Low Stock", bg: "#2b1a05", color: "#f59e0b", dot: "#f59e0b" },
  out:    { label: "Out",       bg: "#2b0a0a", color: "#ef4444", dot: "#ef4444" },
  excess: { label: "Excess",    bg: "#0a1a2b", color: "#60a5fa", dot: "#60a5fa" },
};

export function fmt(n) {
  if (n === undefined || n === null) return "–";
  return Number(n).toLocaleString("en-IN");
}

export function fmtDate(iso) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
