import React, { useState } from "react";
import { fmt, fmtDate } from "../store";

export default function InvoiceLog({ invoices }) {
  const [filter, setFilter] = useState("all");

  const filtered = invoices.filter(inv =>
    filter === "all" || inv.invoiceType === filter
  );

  const totalPurchase = invoices.filter(i => i.invoiceType === "purchase").reduce((s, i) => s + (i.grandTotal || 0), 0);
  const totalSales = invoices.filter(i => i.invoiceType === "sales").reduce((s, i) => s + (i.grandTotal || 0), 0);
  const avgConfidence = invoices.length ? Math.round(invoices.reduce((s, i) => s + (i.confidence || 0), 0) / invoices.length * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em" }}>Invoice Log</div>
        <div style={{ fontSize: 13, color: "#4b5563", marginTop: 2 }}>{invoices.length} invoices scanned · all stock updates automated</div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        {[
          ["Total Scanned", invoices.length, "invoices", "#3b82f6"],
          ["Purchase Value", `₹${fmt(totalPurchase)}`, "stock received", "#22c55e"],
          ["Sales Value", `₹${fmt(totalSales)}`, "stock dispatched", "#f59e0b"],
          ["Avg AI Accuracy", `${avgConfidence}%`, "extraction confidence", "#a78bfa"],
        ].map(([label, value, sub, accent]) => (
          <div key={label} style={{ background: "#0e1117", border: "1px solid #1e2530", borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
            <div style={{ fontSize: 10, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 11, color: "#4b5563" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["all", "purchase", "sales"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "7px 16px", borderRadius: 8, border: filter === f ? "1px solid #1e3a5f" : "1px solid #1e2530",
            cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "DM Sans, sans-serif",
            background: filter === f ? "#1a2744" : "#0e1117",
            color: filter === f ? "#60a5fa" : "#4b5563",
          }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {/* Invoice cards */}
      {filtered.length === 0 ? (
        <div style={{ background: "#0e1117", border: "1px solid #1e2530", borderRadius: 14, padding: "60px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>📄</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#4b5563", marginBottom: 6 }}>No invoices scanned yet</div>
          <div style={{ fontSize: 13, color: "#374151" }}>Upload a supplier invoice to get started — AI will auto-update your stock</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(inv => (
            <div key={inv.id} style={{
              background: "#0e1117", border: "1px solid #1e2530", borderRadius: 14,
              padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
            }}>
              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: inv.invoiceType === "purchase" ? "#0d2b1a" : "#2b1a05",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              }}>{inv.invoiceType === "purchase" ? "📦" : "🧾"}</div>

              {/* Main info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{inv.party}</div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                    background: inv.invoiceType === "purchase" ? "#0d2b1a" : "#2b1a05",
                    color: inv.invoiceType === "purchase" ? "#22c55e" : "#f59e0b",
                  }}>{inv.invoiceType === "purchase" ? "Stock IN" : "Stock OUT"}</div>
                </div>
                <div style={{ fontSize: 11, color: "#4b5563", display: "flex", gap: 12 }}>
                  <span>{inv.invoiceNumber || "No number"}</span>
                  <span>·</span>
                  <span>{fmtDate(inv.invoiceDate)}</span>
                  <span>·</span>
                  <span>{inv.itemCount} items updated</span>
                  <span>·</span>
                  <span>Scanned {new Date(inv.scannedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>

              {/* File name */}
              {inv.fileName && (
                <div style={{ fontSize: 11, color: "#374151", fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
                  {inv.fileName.length > 24 ? inv.fileName.slice(0, 22) + "…" : inv.fileName}
                </div>
              )}

              {/* Confidence */}
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 3 }}>AI Accuracy</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: (inv.confidence || 0) > 0.8 ? "#22c55e" : "#f59e0b", fontFamily: "DM Mono, monospace" }}>
                  {Math.round((inv.confidence || 0) * 100)}%
                </div>
              </div>

              {/* Amount */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 3 }}>Grand Total</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", fontFamily: "DM Mono, monospace" }}>₹{fmt(inv.grandTotal)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
