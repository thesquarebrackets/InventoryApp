import React from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fmt, fmtDate, getStatus, STATUS_CONFIG } from "../store";

const demandData = [
  { month: "Jan", actual: 38, forecast: 36 },
  { month: "Feb", actual: 42, forecast: 40 },
  { month: "Mar", actual: 55, forecast: 52 },
  { month: "Apr", actual: 49, forecast: 50 },
  { month: "May", actual: 63, forecast: 61 },
  { month: "Jun", forecast: 68 },
  { month: "Jul", forecast: 72 },
  { month: "Aug", forecast: 65 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0e1117", border: "1px solid #1e2530", borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

function KPI({ label, value, sub, accent, icon }) {
  return (
    <div style={{ background: "#0e1117", border: "1px solid #1e2530", borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "#4b5563", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", fontFamily: "DM Mono, monospace" }}>{value}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 5 }}>{sub}</div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{icon}</div>
      </div>
    </div>
  );
}

function StockBar({ stock, reorder }) {
  const max = Math.max(reorder * 5, stock + 5);
  const pct = Math.min(100, (stock / max) * 100);
  const rPct = (reorder / max) * 100;
  const status = getStatus({ stock, reorder });
  const color = STATUS_CONFIG[status].color;
  return (
    <div style={{ position: "relative", height: 5, background: "#1e2530", borderRadius: 3 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s" }} />
      <div style={{ position: "absolute", top: -2, left: `${rPct}%`, width: 2, height: 9, background: "#374151" }} />
    </div>
  );
}

export default function Dashboard({ inventory, invoices, onNav }) {
  const totalValue = inventory.reduce((s, i) => s + i.stock * i.costPrice, 0);
  const lowItems = inventory.filter(i => getStatus(i) === "low");
  const outItems = inventory.filter(i => getStatus(i) === "out");
  const healthyItems = inventory.filter(i => getStatus(i) === "ok");
  const recentInvoices = invoices.slice(0, 5);
  const scanCount = inventory.filter(i => i.source === "invoice").length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em" }}>Dashboard</div>
        <div style={{ fontSize: 13, color: "#4b5563", marginTop: 2 }}>Real-time inventory intelligence · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</div>
      </div>

      {/* Scan prompt banner */}
      {invoices.length === 0 && (
        <div onClick={() => onNav("scan")} style={{
          background: "linear-gradient(135deg, #0a1535, #0d2240)",
          border: "1px solid #1e3a5f", borderRadius: 14, padding: "18px 24px",
          marginBottom: 22, display: "flex", alignItems: "center", gap: 16,
          cursor: "pointer", transition: "border-color 0.2s",
        }}>
          <div style={{ fontSize: 28 }}>📄</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa", marginBottom: 3 }}>Start scanning invoices to eliminate manual entry</div>
            <div style={{ fontSize: 12, color: "#4b5563" }}>Upload your first supplier invoice → AI auto-updates stock quantities</div>
          </div>
          <div style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600 }}>Scan Now →</div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        <KPI label="Stock Value" value={`₹${fmt(totalValue)}`} sub={`${inventory.length} SKUs`} accent="#3b82f6" icon="₹" />
        <KPI label="Low Stock" value={lowItems.length} sub="Need reorder" accent="#f59e0b" icon="⚡" />
        <KPI label="Out of Stock" value={outItems.length} sub="Revenue at risk" accent="#ef4444" icon="⊘" />
        <KPI label="AI Scanned" value={scanCount} sub={`${invoices.length} invoices processed`} accent="#22c55e" icon="✦" />
      </div>

      {/* Charts + Recent invoices */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, marginBottom: 22 }}>
        <div style={{ background: "#0e1117", border: "1px solid #1e2530", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1", marginBottom: 4 }}>Demand Forecast</div>
          <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 18 }}>Actual vs AI prediction (units/month)</div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={demandData}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2530" />
              <XAxis dataKey="month" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#22c55e" strokeWidth={2} fill="none" dot={{ fill: "#22c55e", r: 3, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 3" fill="url(#ag)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#0e1117", border: "1px solid #1e2530", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1", marginBottom: 14 }}>Recent Invoices Scanned</div>
          {recentInvoices.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#374151", fontSize: 13 }}>
              No invoices scanned yet.<br />
              <span onClick={() => onNav("scan")} style={{ color: "#3b82f6", cursor: "pointer" }}>Scan your first invoice →</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentInvoices.map(inv => (
                <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#0a0d13", borderRadius: 8 }}>
                  <div style={{ fontSize: 16 }}>{inv.invoiceType === "purchase" ? "📦" : "🧾"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.party}</div>
                    <div style={{ fontSize: 10, color: "#4b5563" }}>{inv.invoiceNumber} · {fmtDate(inv.invoiceDate)}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "DM Mono, monospace", flexShrink: 0 }}>₹{fmt(inv.grandTotal)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stock health */}
      <div style={{ background: "#0e1117", border: "1px solid #1e2530", borderRadius: 16, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>Stock Health</div>
          <span onClick={() => onNav("inventory")} style={{ fontSize: 12, color: "#3b82f6", cursor: "pointer" }}>View all →</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {inventory.slice(0, 8).map(item => {
            const status = getStatus(item);
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 180, fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 0 }}>{item.name}</div>
                <div style={{ flex: 1 }}><StockBar stock={item.stock} reorder={item.reorder} /></div>
                <div style={{ width: 36, textAlign: "right", fontSize: 12, fontWeight: 700, color: "#f1f5f9", fontFamily: "DM Mono, monospace", flexShrink: 0 }}>{item.stock}</div>
                <div style={{ width: 68, textAlign: "center", padding: "3px 0", borderRadius: 6, fontSize: 10, fontWeight: 700, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>{cfg.label}</div>
                {item.source === "invoice" && <div style={{ fontSize: 10, color: "#22c55e", flexShrink: 0 }}>✦ AI</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
