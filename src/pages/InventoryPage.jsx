import React, { useState } from "react";
import { fmt, fmtDate, getStatus, STATUS_CONFIG, CATEGORIES } from "../store";

export default function InventoryPage({ inventory, onUpdate }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [editId, setEditId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", sku: "", category: "Pumps", stock: 0, reorder: 10, unit: "pcs", supplier: "", costPrice: 0, sellPrice: 0 });

  const filtered = inventory.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.supplier.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || getStatus(i) === filterStatus;
    const matchCat = filterCat === "all" || i.category === filterCat;
    return matchSearch && matchStatus && matchCat;
  });

  const saveEdit = (id) => {
    onUpdate(prev => prev.map(i => i.id === id ? { ...i, ...editDraft, lastUpdated: new Date().toISOString().split("T")[0], source: "manual" } : i));
    setEditId(null);
  };

  const addItem = () => {
    if (!newItem.name || !newItem.sku) return;
    onUpdate(prev => [...prev, { ...newItem, id: Date.now(), lastUpdated: new Date().toISOString().split("T")[0], source: "manual" }]);
    setShowAddForm(false);
    setNewItem({ name: "", sku: "", category: "Pumps", stock: 0, reorder: 10, unit: "pcs", supplier: "", costPrice: 0, sellPrice: 0 });
  };

  const deleteItem = (id) => {
    if (window.confirm("Delete this item?")) {
      onUpdate(prev => prev.filter(i => i.id !== id));
    }
  };

  const totalValue = filtered.reduce((s, i) => s + i.stock * i.costPrice, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em" }}>Inventory</div>
          <div style={{ fontSize: 13, color: "#4b5563", marginTop: 2 }}>{filtered.length} items · ₹{fmt(totalValue)} total value</div>
        </div>
        <button onClick={() => setShowAddForm(v => !v)} style={{
          background: "#1d4ed8", border: "none", borderRadius: 8, color: "#fff",
          padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif",
        }}>+ Add Item</button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div style={{ background: "#0e1117", border: "1px solid #1e3a5f", borderRadius: 14, padding: 20, marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa", marginBottom: 14 }}>Add New Item Manually</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 10 }}>
            {[["Name *", "name", "text"], ["SKU *", "sku", "text"], ["Supplier", "supplier", "text"], ["Cost ₹", "costPrice", "number"], ["Sell ₹", "sellPrice", "number"]].map(([l, f, t]) => (
              <div key={f}>
                <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 4 }}>{l}</div>
                <input type={t} value={newItem[f]} onChange={e => setNewItem(p => ({ ...p, [f]: t === "number" ? Number(e.target.value) : e.target.value }))}
                  style={inputStyle} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 4 }}>Category</div>
              <select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {[["Stock", "stock", "number"], ["Reorder At", "reorder", "number"], ["Unit", "unit", "text"]].map(([l, f, t]) => (
              <div key={f}>
                <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 4 }}>{l}</div>
                <input type={t} value={newItem[f]} onChange={e => setNewItem(p => ({ ...p, [f]: t === "number" ? Number(e.target.value) : e.target.value }))} style={inputStyle} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={addItem} style={{ background: "#1d4ed8", border: "none", borderRadius: 7, color: "#fff", padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>Save Item</button>
            <button onClick={() => setShowAddForm(false)} style={{ background: "transparent", border: "1px solid #1e2530", borderRadius: 7, color: "#6b7280", padding: "8px 14px", fontSize: 13, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, SKU, supplier..."
          style={{ ...inputStyle, flex: 1, minWidth: 200, padding: "9px 14px" }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {["all", "ok", "low", "out", "excess"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: "8px 14px", borderRadius: 8, border: filterStatus === s ? "1px solid #1e3a5f" : "1px solid #1e2530",
            cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "DM Sans, sans-serif",
            background: filterStatus === s ? "#1a2744" : "#0e1117",
            color: filterStatus === s ? "#60a5fa" : "#4b5563",
          }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#0e1117", border: "1px solid #1e2530", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0a0d13" }}>
                {["Item / SKU", "Category", "Supplier", "Stock", "Reorder", "Cost", "Status", "Source", "Updated", ""].map(h => (
                  <th key={h} style={{ padding: "11px 14px", fontSize: 10, color: "#4b5563", textAlign: "left", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const status = getStatus(item);
                const cfg = STATUS_CONFIG[status];
                const isEditing = editId === item.id;
                const d = isEditing ? editDraft : item;
                return (
                  <tr key={item.id} style={{ borderTop: "1px solid #111827", transition: "background 0.1s" }}>
                    <td style={{ padding: "12px 14px" }}>
                      {isEditing ? (
                        <input value={d.name} onChange={e => setEditDraft(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, marginBottom: 4 }} />
                      ) : (
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{item.name}</div>
                      )}
                      <div style={{ fontSize: 11, color: "#4b5563", fontFamily: "DM Mono, monospace" }}>{item.sku}</div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280" }}>{item.category}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280" }}>
                      {isEditing ? <input value={d.supplier} onChange={e => setEditDraft(p => ({ ...p, supplier: e.target.value }))} style={{ ...inputStyle, width: 120 }} /> : item.supplier}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {isEditing ? (
                        <input type="number" value={d.stock} onChange={e => setEditDraft(p => ({ ...p, stock: Number(e.target.value) }))} style={{ ...inputStyle, width: 64 }} />
                      ) : (
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", fontFamily: "DM Mono, monospace" }}>{item.stock} <span style={{ fontSize: 10, color: "#4b5563" }}>{item.unit}</span></span>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {isEditing ? (
                        <input type="number" value={d.reorder} onChange={e => setEditDraft(p => ({ ...p, reorder: Number(e.target.value) }))} style={{ ...inputStyle, width: 60 }} />
                      ) : (
                        <span style={{ fontSize: 12, color: "#4b5563" }}>{item.reorder}</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8", fontFamily: "DM Mono, monospace" }}>₹{fmt(item.costPrice)}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot }} />
                        {cfg.label}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {item.source === "invoice"
                        ? <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, background: "#0d2b1a", padding: "2px 8px", borderRadius: 20 }}>✦ AI Scan</span>
                        : <span style={{ fontSize: 10, color: "#4b5563" }}>Manual</span>}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 11, color: "#374151" }}>{fmtDate(item.lastUpdated)}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {isEditing ? (
                          <>
                            <button onClick={() => saveEdit(item.id)} style={{ ...smallBtn, background: "#0d2b1a", color: "#22c55e", borderColor: "#14532d" }}>✓</button>
                            <button onClick={() => setEditId(null)} style={{ ...smallBtn, color: "#6b7280" }}>✕</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditId(item.id); setEditDraft({ ...item }); }} style={{ ...smallBtn }}>✎</button>
                            <button onClick={() => deleteItem(item.id)} style={{ ...smallBtn, color: "#ef4444", borderColor: "#2b0a0a" }}>✕</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#374151", fontSize: 13 }}>No items match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  background: "#1e2530", border: "1px solid #374151", borderRadius: 7,
  color: "#e2e8f0", padding: "6px 10px", fontSize: 12, fontFamily: "DM Sans, sans-serif",
  width: "100%", outline: "none",
};

const smallBtn = {
  background: "transparent", border: "1px solid #1e2530", borderRadius: 6,
  color: "#6b7280", padding: "4px 9px", fontSize: 12, cursor: "pointer", fontFamily: "DM Sans, sans-serif",
};
