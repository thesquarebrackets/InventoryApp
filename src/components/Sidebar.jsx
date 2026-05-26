import React from "react";

const NAV = [
  { id: "dashboard", icon: "⬡", label: "Dashboard" },
  { id: "scan",      icon: "⊞", label: "Scan Invoice" },
  { id: "inventory", icon: "☰", label: "Inventory" },
  { id: "invoices",  icon: "◈", label: "Invoice Log" },
];

export default function Sidebar({ active, onNav, alertCount }) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div style={{
      width: collapsed ? 64 : 220,
      background: "#0a0d13",
      borderRight: "1px solid #1a1f2e",
      display: "flex", flexDirection: "column",
      transition: "width 0.25s ease", flexShrink: 0,
      overflow: "hidden", zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        padding: "18px 14px", borderBottom: "1px solid #1a1f2e",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: "linear-gradient(135deg, #2563eb, #0891b2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 17, fontFamily: "Syne, sans-serif", fontWeight: 800, color: "#fff",
        }}>S</div>
        {!collapsed && <div>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 15, color: "#f1f5f9", letterSpacing: "-0.02em" }}>SB</div>
          <div style={{ fontSize: 10, color: "#374151", letterSpacing: "0.1em", textTransform: "uppercase" }}>Coimbatore</div>
        </div>}
        {!collapsed && <button onClick={() => setCollapsed(true)} style={btnStyle}>‹</button>}
      </div>

      {/* Collapse toggle when closed */}
      {collapsed && (
        <button onClick={() => setCollapsed(false)} style={{ ...btnStyle, margin: "10px auto", display: "block" }}>›</button>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => onNav(n.id)} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: "11px 12px", borderRadius: 10, border: "none", cursor: "pointer",
            background: active === n.id ? "#1a2744" : "transparent",
            color: active === n.id ? "#60a5fa" : "#6b7280",
            marginBottom: 3, transition: "all 0.15s", textAlign: "left",
            fontFamily: "DM Sans, sans-serif",
            fontWeight: active === n.id ? 600 : 400, fontSize: 13,
          }}>
            <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1 }}>{n.icon}</span>
            {!collapsed && n.label}
          </button>
        ))}
      </nav>

      {/* Alert badge */}
      {alertCount > 0 && (
        <div style={{ padding: "10px 8px", borderTop: "1px solid #1a1f2e" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            background: "#2b0a0a", borderRadius: 10,
          }}>
            <span style={{ fontSize: 15, color: "#ef4444" }}>⚠</span>
            {!collapsed && <div>
              <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{alertCount} Alerts</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Need attention</div>
            </div>}
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  background: "#1e2530", border: "none", color: "#9ca3af", cursor: "pointer",
  width: 24, height: 24, borderRadius: 6, fontSize: 13, marginLeft: "auto",
  display: "flex", alignItems: "center", justifyContent: "center",
};
