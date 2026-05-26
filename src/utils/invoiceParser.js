// ─── AI Invoice Parser ────────────────────────────────────────────────────────
// Uses Claude vision to extract structured inventory data from invoices.
// This REPLACES manual data entry for:
//   1. Purchase invoice received from supplier → auto-updates stock IN
//   2. Sales invoice issued to customer → auto-updates stock OUT
//   3. New item detection → prompts to add to master inventory

const SYSTEM_PROMPT = `You are an expert invoice parser for an Indian SME inventory management system.
Extract structured data from the invoice image provided.

Return ONLY valid JSON (no markdown, no explanation) with this exact schema:
{
  "invoiceNumber": "string or null",
  "invoiceDate": "YYYY-MM-DD or null",
  "invoiceType": "purchase" or "sales",
  "supplierOrCustomer": "name string",
  "gstin": "string or null",
  "items": [
    {
      "name": "product name as written on invoice",
      "sku": "SKU/item code if visible, else null",
      "quantity": number,
      "unit": "pcs/mtr/roll/kg/litre/set/etc",
      "unitPrice": number,
      "totalPrice": number,
      "hsnCode": "string or null",
      "gstRate": number or null
    }
  ],
  "subtotal": number or null,
  "totalGst": number or null,
  "grandTotal": number or null,
  "currency": "INR",
  "notes": "any important notes or null",
  "confidence": number between 0 and 1
}

Rules:
- invoiceType is "purchase" if it's a bill/invoice FROM a supplier TO the business (stock comes IN)
- invoiceType is "sales" if it's an invoice FROM the business TO a customer (stock goes OUT)
- If you cannot determine invoiceType, default to "purchase"
- quantity must be a positive number
- All prices in INR
- If a field is not visible or unclear, use null
- confidence: 1.0 = perfectly clear invoice, 0.5 = some fields unclear, 0.2 = very unclear`;

export async function parseInvoiceWithAI(base64Image, mimeType = "image/jpeg") {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType, data: base64Image }
          },
          {
            type: "text",
            text: "Parse this invoice and return the structured JSON data. Extract all line items carefully."
          }
        ]
      }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const raw = data.content?.find(b => b.type === "text")?.text || "";

  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    throw new Error("Could not parse AI response as JSON");
  }
}

// Match parsed invoice items to existing inventory items
export function matchItemsToInventory(parsedItems, inventory) {
  return parsedItems.map(item => {
    const nameLower = item.name.toLowerCase();

    // Try SKU match first (most reliable)
    let match = inventory.find(inv =>
      item.sku && inv.sku.toLowerCase() === item.sku.toLowerCase()
    );

    // Try name fuzzy match
    if (!match) {
      match = inventory.find(inv => {
        const invName = inv.name.toLowerCase();
        return invName.includes(nameLower) || nameLower.includes(invName) ||
          nameLower.split(" ").some(word => word.length > 3 && invName.includes(word));
      });
    }

    return {
      ...item,
      matchedItem: match || null,
      matchStatus: match ? "matched" : "new",
    };
  });
}

// Convert file to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

// Generate a mock invoice result for demo (when no real invoice is uploaded)
export function getMockInvoiceResult() {
  return {
    invoiceNumber: "INV-2026-0847",
    invoiceDate: "2026-05-25",
    invoiceType: "purchase",
    supplierOrCustomer: "Kirloskar Brothers Ltd",
    gstin: "29AABCK1234A1Z5",
    items: [
      { name: "Water Pump 1HP", sku: "WP-001", quantity: 10, unit: "pcs", unitPrice: 2000, totalPrice: 20000, hsnCode: "8413", gstRate: 18 },
      { name: "Centrifugal Pump 0.5HP", sku: "CP-005", quantity: 5, unit: "pcs", unitPrice: 3200, totalPrice: 16000, hsnCode: "8413", gstRate: 18 },
      { name: "Pressure Gauge 0-10", sku: "PG-010", quantity: 8, unit: "pcs", unitPrice: 600, totalPrice: 4800, hsnCode: "9026", gstRate: 18 },
      { name: "Inline Booster Pump", sku: null, quantity: 3, unit: "pcs", unitPrice: 8500, totalPrice: 25500, hsnCode: "8413", gstRate: 18 },
    ],
    subtotal: 66300,
    totalGst: 11934,
    grandTotal: 78234,
    currency: "INR",
    notes: "Delivery within 3 working days. Payment due Net 30.",
    confidence: 0.97
  };
}
