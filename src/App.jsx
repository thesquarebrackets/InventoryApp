import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import InvoiceScanner from "./components/InvoiceScanner";
import Dashboard from "./pages/Dashboard";
import InventoryPage from "./pages/InventoryPage";
import InvoiceLog from "./pages/InvoiceLog";
import { INITIAL_INVENTORY, getStatus } from "./store";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [invoices, setInvoices] = useState([]);

  // Alert count for sidebar badge
  const alertCount = inventory.filter(i => {
    const s = getStatus(i);
    return s === "low" || s === "out";
  }).length;

  // Called by InvoiceScanner after user confirms review
  const handleInventoryUpdate = (updates, newItems) => {
    setInventory(prev => {
      let updated = [...prev];
      // Apply stock deltas to matched items
      updates.forEach(({ id, delta }) => {
        updated = updated.map(item =>
          item.id === id
            ? {
                ...item,
                stock: Math.max(0, item.stock + delta),
                lastUpdated: new Date().toISOString().split("T")[0],
                source: "invoice",
              }
            : item
        );
      });
      // Add new items
      return [...updated, ...newItems];
    });
  };

  // Save invoice to log
  const handleInvoiceSaved = (invoice) => {
    setInvoices(prev => [invoice, ...prev]);
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#07090f", overflow: "hidden" }}>
      <Sidebar active={page} onNav={setPage} alertCount={alertCount} />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{
          height: 56, padding: "0 28px", display: "flex", alignItems: "center",
          justifyContent: "space-between", borderBottom: "1px solid #1a1f2e",
          background: "#080b10", flexShrink: 0,
        }}>
          <div style={{ fontSize: 12, color: "#374151", fontFamily: "DM Mono, monospace" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Live sync dot */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6, background: "#0d2b1a",
              border: "1px solid #14532d", borderRadius: 8, padding: "5px 12px",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>Live</span>
            </div>
            {/* Scan shortcut */}
            <button onClick={() => setPage("scan")} style={{
              background: page === "scan" ? "#1d4ed8" : "#1a2744",
              border: "1px solid #1e3a5f", borderRadius: 8, color: "#60a5fa",
              padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
            }}>⊞ Scan Invoice</button>
            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #1d4ed8, #0891b2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 14, color: "#fff",
            }}>R</div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          {page === "dashboard" && (
            <Dashboard
              inventory={inventory}
              invoices={invoices}
              onNav={setPage}
            />
          )}
          {page === "scan" && (
            <InvoiceScanner
              inventory={inventory}
              onInventoryUpdate={handleInventoryUpdate}
              onInvoiceSaved={handleInvoiceSaved}
            />
          )}
          {page === "inventory" && (
            <InventoryPage
              inventory={inventory}
              onUpdate={setInventory}
            />
          )}
          {page === "invoices" && (
            <InvoiceLog invoices={invoices} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
