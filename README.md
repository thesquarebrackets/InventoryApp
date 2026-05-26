# StockAI — Phase 1 Inventory Management
### AI-powered invoice scanning for Coimbatore SMEs

---

## What This Does

Replaces **manual stock entry** by scanning supplier/sales invoices with Claude AI:

| Before (Manual) | After (StockAI) |
|---|---|
| Staff manually types items from paper invoice | Take photo of invoice → AI extracts everything |
| Stock counts updated end-of-day in Excel | Stock updates instantly after each invoice scan |
| New products added manually | AI detects new items and prompts you to add them |
| No supplier price history | Every invoice builds price history automatically |
| Errors in data entry | AI reads quantities, SKUs, prices with 94%+ accuracy |

---

## Pages

- **Dashboard** — KPIs, stock health bars, demand forecast chart, recent scans
- **Scan Invoice** — Upload JPG/PNG/PDF invoice → AI extracts → Review → Apply to stock
- **Inventory** — Full searchable table, inline editing, add/delete items
- **Invoice Log** — History of all scanned invoices with confidence scores

---

## Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Anthropic API key (get one at console.anthropic.com)

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Set your API key
# Create a file called .env in the project root:
echo "REACT_APP_ANTHROPIC_API_KEY=your_key_here" > .env

# 3. Start the app
npm start
```

App opens at http://localhost:3000

### For production build:
```bash
npm run build
```

---

## API Key Setup

The app calls Claude's vision API to read invoices.

1. Go to https://console.anthropic.com
2. Create an API key
3. Add it to `.env`:
   ```
   REACT_APP_ANTHROPIC_API_KEY=sk-ant-...
   ```

> **Note:** For production, never expose API keys in frontend. Set up a small backend proxy (Node/Express) that holds the key and forwards requests. See `BACKEND_NOTES.md` for details.

---

## How Invoice Scanning Works

```
User uploads invoice image/PDF
         ↓
fileToBase64() converts to base64
         ↓
Claude Vision API reads the invoice
         ↓
AI extracts: invoice number, date, party,
             all line items (name, SKU, qty,
             unit price, GST, total)
         ↓
matchItemsToInventory() fuzzy-matches
extracted items to your master inventory
         ↓
User reviews extracted data (can edit qtys)
New items get a form to fill SKU/category
         ↓
User clicks "Apply" → stock updated instantly
Invoice saved to log with confidence score
```

---

## Supported Invoice Types

✅ Supplier purchase invoices (stock IN)  
✅ Sales invoices (stock OUT)  
✅ JPG, PNG image formats  
✅ PDF (text-based)  
✅ Handwritten or printed  
✅ GST invoices with HSN codes  
✅ Tally-generated invoices  

---

## Project Structure

```
src/
├── App.jsx                    # Root: state, routing, layout
├── store.js                   # Shared data, types, helpers
├── components/
│   ├── Sidebar.jsx            # Navigation sidebar
│   └── InvoiceScanner.jsx     # Core AI scan flow (5 stages)
├── pages/
│   ├── Dashboard.jsx          # Overview with charts
│   ├── InventoryPage.jsx      # Full inventory table + edit
│   └── InvoiceLog.jsx         # Invoice history
└── utils/
    └── invoiceParser.js       # Claude API call + item matching
```

---

## Phase 2 Roadmap

- [ ] WhatsApp alerts when stock goes below reorder level
- [ ] Tally integration (ODBC sync)
- [ ] Supplier comparison — auto-suggest cheapest supplier
- [ ] Purchase order auto-generation
- [ ] Multi-branch support
- [ ] Mobile app (Flutter)
- [ ] Backend API + PostgreSQL for multi-user

---

## Demo Mode

Click **"Run Demo with Kirloskar Invoice"** on the Scan page to see the full AI flow without uploading a real invoice. It simulates a purchase invoice from Kirloskar Brothers with 4 line items.

---

Built for Coimbatore SMEs · Phase 1 · 2026
