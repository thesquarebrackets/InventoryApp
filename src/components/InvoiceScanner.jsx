import React, { useState, useCallback } from "react";
import { parseInvoiceWithAI, matchItemsToInventory, fileToBase64, getMockInvoiceResult } from "../utils/invoiceParser";
import { fmt, fmtDate, getStatus, STATUS_CONFIG } from "../store";

const STAGES = {
  IDLE: "idle",
  UPLOADING: "uploading",
  PARSING: "parsing",
  REVIEW: "review",
  APPLYING: "applying",
  DONE: "done",
};

export default function InvoiceScanner({ inventory, onInventoryUpdate, onInvoiceSaved }) {
  const [stage, setStage] = useState(STAGES.IDLE);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [matched, setMatched] = useState([]);
  const [error, setError] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [newItemDrafts, setNewItemDrafts] = useState({});

  const reset = () => {
    setStage(STAGES.IDLE); setFile(null); setPreview(null);
    setParsed(null); setMatched([]); setError(null);
    setEditItems([]); setNewItemDrafts({});
  };

  const processFile = useCallback(async (f) => {
    if (!f) return;
    setFile(f);
    setError(null);

    // Preview
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    }

    setStage(STAGES.PARSING);
    try {
      let result;
      // Use demo mock if file is tiny/placeholder, else call real API
      if (f.size < 500) {
        await new Promise(r => setTimeout(r, 2200)); // simulate
        result = getMockInvoiceResult();
      } else {
        const b64 = await fileToBase64(f);
        result = await parseInvoiceWithAI(b64, f.type);
      }
      const matchedItems = matchItemsToInventory(result.items, inventory);
      setParsed(result);
      setMatched(matchedItems);
      setEditItems(matchedItems.map((m, i) => ({ ...m, _key: i, selected: true })));
      setStage(STAGES.REVIEW);
    } catch (e) {
      setError(e.message);
      setStage(STAGES.IDLE);
    }
  }, [inventory]);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleFileInput = (e) => {
    const f = e.target.files[0];
    if (f) processFile(f);
  };

  // Demo: load mock without real file
  const handleDemo = async () => {
    setFile({ name: "KirloskarInvoice_May2026.jpg", size: 100, type: "image/jpeg" });
    setPreview(null);
    setStage(STAGES.PARSING);
    setError(null);
    await new Promise(r => setTimeout(r, 2400));
    const result = getMockInvoiceResult();
    const matchedItems = matchItemsToInventory(result.items, inventory);
    setParsed(result);
    setMatched(matchedItems);
    setEditItems(matchedItems.map((m, i) => ({ ...m, _key: i, selected: true })));
    setStage(STAGES.REVIEW);
  };

  const applyToInventory = async () => {
    setStage(STAGES.APPLYING);
    await new Promise(r => setTimeout(r, 800));

    const updates = [];
    const newItems = [];

    editItems.forEach(item => {
      if (!item.selected) return;
      if (item.matchStatus === "matched" && item.matchedItem) {
        const delta = parsed.invoiceType === "purchase" ? item.quantity : -item.quantity;
        updates.push({ id: item.matchedItem.id, delta, invoiceRef: parsed.invoiceNumber });
      } else if (item.matchStatus === "new") {
        const draft = newItemDrafts[item._key] || {};
        if (draft.sku && draft.name) {
          newItems.push({
            id: Date.now() + item._key,
            name: draft.name || item.name,
            sku: draft.sku,
            category: draft.category || "Uncategorised",
            stock: parsed.invoiceType === "purchase" ? item.quantity : 0,
            reorder: draft.reorder || 10,
            unit: item.unit,
            supplier: parsed.supplierOrCustomer,
            costPrice: item.unitPrice,
            sellPrice: Math.round(item.unitPrice * 1.35),
            lastUpdated: new Date().toISOString().split("T")[0],
            source: "invoice",
          });
        }
      }
    });

    const savedInvoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: parsed.invoiceNumber,
      invoiceDate: parsed.invoiceDate,
      invoiceType: parsed.invoiceType,
      party: parsed.supplierOrCustomer,
      grandTotal: parsed.grandTotal,
      itemCount: editItems.filter(i => i.selected).length,
      scannedAt: new Date().toISOString(),
      confidence: parsed.confidence,
      fileName: file?.name,
    };

    onInventoryUpdate(updates, newItems);
    onInvoiceSaved(savedInvoice);
    setStage(STAGES.DONE);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (stage === STAGES.IDLE) return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <SectionHeader
        title="Scan Invoice"
        sub="Upload a supplier or sales invoice — AI extracts all line items and updates your stock automatically"
      />

      {/* What this replaces */}
      <div style={{ ...card, marginBottom: 20, borderColor: "#1e3a5f" }}>
        <div style={{ fontSize: 12, color: "#3b82f6", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
          ✦ Replaces Manual Entry For
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            ["📦 Purchase invoice from supplier", "Auto adds stock IN + updates quantities"],
            ["🧾 Sales invoice to customer", "Auto deducts stock OUT after sale"],
            ["🆕 New product detection", "Prompts to add unknown items to master list"],
            ["📊 Supplier tracking", "Builds price history per supplier automatically"],
          ].map(([title, desc], i) => (
            <div key={i} style={{ background: "#0a1020", borderRadius: 10, padding: "12px 14px", border: "1px solid #1a2744" }}>
              <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => document.getElementById("fileInput").click()}
        style={{
          border: `2px dashed ${dragOver ? "#3b82f6" : "#1e2530"}`,
          borderRadius: 16, padding: "48px 32px", textAlign: "center",
          cursor: "pointer", transition: "all 0.2s",
          background: dragOver ? "#0a1122" : "#0e1117",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
        <div style={{ fontSize: 17, fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
          Drop your invoice here
        </div>
        <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 20 }}>
          Supports JPG, PNG, PDF — supplier bills, purchase orders, sales invoices
        </div>
        <div style={{
          display: "inline-block", padding: "10px 24px", borderRadius: 8,
          background: "#1a2744", border: "1px solid #1e3a5f",
          color: "#60a5fa", fontSize: 13, fontWeight: 600,
        }}>Browse Files</div>
        <input id="fileInput" type="file" accept="image/*,.pdf" onChange={handleFileInput} style={{ display: "none" }} />
      </div>

      {error && <div style={{ background: "#2b0a0a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "12px 16px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>⚠ {error}</div>}

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#374151", marginBottom: 12 }}>— or try with sample data —</div>
        <button onClick={handleDemo} style={{
          background: "transparent", border: "1px solid #1e2530", borderRadius: 8,
          color: "#6b7280", fontSize: 13, padding: "8px 20px", cursor: "pointer",
          fontFamily: "DM Sans, sans-serif",
        }}>
          ▶ Run Demo with Kirloskar Invoice
        </button>
      </div>
    </div>
  );

  if (stage === STAGES.PARSING) return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <SectionHeader title="Reading Invoice..." sub="Claude AI is extracting line items, prices, and quantities" />
      <div style={{ ...card, textAlign: "center", padding: "60px 32px" }}>
        <div style={{ fontSize: 48, marginBottom: 20, animation: "spin 2s linear infinite" }}>⟳</div>
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>Scanning {file?.name}</div>
        {[
          "Reading invoice header...",
          "Extracting line items...",
          "Matching to inventory...",
          "Validating quantities...",
        ].map((msg, i) => (
          <div key={i} style={{ fontSize: 12, color: "#374151", marginBottom: 4 }}>• {msg}</div>
        ))}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (stage === STAGES.REVIEW) return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader
        title="Review Extracted Data"
        sub="Verify the AI-extracted items before updating your inventory. Uncheck any row to skip it."
      />

      {/* Invoice header */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
          {[
            ["Invoice No", parsed.invoiceNumber || "–"],
            ["Date", fmtDate(parsed.invoiceDate)],
            ["Type", parsed.invoiceType === "purchase" ? "📦 Purchase (Stock IN)" : "🧾 Sales (Stock OUT)"],
            ["Party", parsed.supplierOrCustomer],
          ].map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: 10, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 11, color: "#4b5563" }}>AI Confidence:</div>
          <div style={{ flex: 1, height: 4, background: "#1e2530", borderRadius: 2 }}>
            <div style={{ width: `${(parsed.confidence || 0) * 100}%`, height: "100%", background: parsed.confidence > 0.8 ? "#22c55e" : "#f59e0b", borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 11, color: parsed.confidence > 0.8 ? "#22c55e" : "#f59e0b", fontWeight: 600 }}>
            {Math.round((parsed.confidence || 0) * 100)}%
          </div>
        </div>
      </div>

      {/* Items table */}
      <div style={{ ...card, marginBottom: 16, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2530" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>
            Extracted Line Items
            <span style={{ fontSize: 11, color: "#4b5563", marginLeft: 8 }}>
              {editItems.filter(i => i.matchStatus === "matched").length} matched · {editItems.filter(i => i.matchStatus === "new").length} new
            </span>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0a0d13" }}>
                {["✓", "Item Name", "SKU", "Qty", "Unit Price", "Total", "Match", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", fontSize: 11, color: "#4b5563", textAlign: "left", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {editItems.map((item, idx) => (
                <React.Fragment key={item._key}>
                  <tr style={{ borderTop: "1px solid #111827", background: item.selected ? "transparent" : "#0a0d13", opacity: item.selected ? 1 : 0.45 }}>
                    <td style={{ padding: "12px 14px" }}>
                      <input type="checkbox" checked={item.selected} onChange={e => {
                        const updated = [...editItems];
                        updated[idx].selected = e.target.checked;
                        setEditItems(updated);
                      }} style={{ accentColor: "#3b82f6", width: 15, height: 15, cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{item.name}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280", fontFamily: "DM Mono, monospace" }}>{item.sku || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <input
                        type="number" min="1" value={item.quantity}
                        onChange={e => {
                          const updated = [...editItems];
                          updated[idx].quantity = Number(e.target.value);
                          setEditItems(updated);
                        }}
                        style={{ width: 64, background: "#1e2530", border: "1px solid #374151", borderRadius: 6, color: "#e2e8f0", padding: "4px 8px", fontSize: 13, fontFamily: "DM Mono, monospace" }}
                      />
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#94a3b8", fontFamily: "DM Mono, monospace" }}>₹{fmt(item.unitPrice)}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#f1f5f9", fontWeight: 600, fontFamily: "DM Mono, monospace" }}>₹{fmt(item.quantity * item.unitPrice)}</td>
                    <td style={{ padding: "12px 14px" }}>
                      {item.matchStatus === "matched" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                          <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>Matched</span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                          <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>New Item</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151" }}>
                      {item.matchStatus === "matched" && item.matchedItem && (
                        <span>→ {item.matchedItem.name} (stock: {item.matchedItem.stock})</span>
                      )}
                    </td>
                  </tr>

                  {/* New item form */}
                  {item.matchStatus === "new" && item.selected && (
                    <tr style={{ background: "#0d1a08", borderTop: "1px solid #1a2e0a" }}>
                      <td />
                      <td colSpan={7} style={{ padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 8 }}>
                          ⚠ New item — fill details to add to master inventory (or uncheck to skip)
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {[
                            ["SKU *", "sku", item.sku || ""],
                            ["Name *", "name", item.name],
                            ["Category", "category", ""],
                            ["Reorder At", "reorder", "10"],
                          ].map(([label, field, def]) => (
                            <div key={field}>
                              <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 3 }}>{label}</div>
                              <input
                                defaultValue={def}
                                onChange={e => setNewItemDrafts(d => ({
                                  ...d, [item._key]: { ...d[item._key], [field]: e.target.value }
                                }))}
                                style={{ background: "#1e2530", border: "1px solid #374151", borderRadius: 6, color: "#e2e8f0", padding: "5px 10px", fontSize: 12, width: 120 }}
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #1e2530", display: "flex", justifyContent: "flex-end", gap: 32 }}>
          {[["Subtotal", parsed.subtotal], ["GST", parsed.totalGst], ["Grand Total", parsed.grandTotal]].map(([l, v]) => (
            <div key={l} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#4b5563" }}>{l}</div>
              <div style={{ fontSize: l === "Grand Total" ? 18 : 14, fontWeight: l === "Grand Total" ? 700 : 400, color: "#f1f5f9", fontFamily: "DM Mono, monospace" }}>₹{fmt(v)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button onClick={reset} style={{ ...outlineBtn }}>✕ Cancel</button>
        <button onClick={applyToInventory} style={{ ...primaryBtn }}>
          ✓ Apply {editItems.filter(i => i.selected).length} Items to Inventory
        </button>
      </div>
    </div>
  );

  if (stage === STAGES.APPLYING) return (
    <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
      <div style={{ ...card, padding: "60px 32px" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⟳</div>
        <div style={{ fontSize: 16, color: "#e2e8f0", fontWeight: 600 }}>Updating inventory...</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (stage === STAGES.DONE) return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ ...card, textAlign: "center", padding: "48px 32px" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✓</div>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: "#22c55e", marginBottom: 8 }}>Inventory Updated!</div>
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 32 }}>
          {editItems.filter(i => i.selected && i.matchStatus === "matched").length} items updated ·{" "}
          {editItems.filter(i => i.selected && i.matchStatus === "new").length} new items added
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={reset} style={{ ...primaryBtn }}>Scan Another Invoice</button>
        </div>
      </div>
    </div>
  );

  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em" }}>{title}</div>
      <div style={{ fontSize: 13, color: "#4b5563", marginTop: 3 }}>{sub}</div>
    </div>
  );
}

const card = {
  background: "#0e1117", border: "1px solid #1e2530", borderRadius: 16, padding: 20,
};

const primaryBtn = {
  background: "#1d4ed8", border: "none", borderRadius: 8, color: "#fff",
  padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  fontFamily: "DM Sans, sans-serif",
};

const outlineBtn = {
  background: "transparent", border: "1px solid #1e2530", borderRadius: 8,
  color: "#6b7280", padding: "10px 18px", fontSize: 13, cursor: "pointer",
  fontFamily: "DM Sans, sans-serif",
};
