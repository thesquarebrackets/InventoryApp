# Backend Proxy Setup (Production)

In production, never expose your Anthropic API key in the React frontend.
Set up this simple Node.js proxy server instead.

## server.js

```javascript
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' })); // your frontend URL
app.use(express.json({ limit: '20mb' }));

app.post('/api/parse-invoice', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY, // stored on server only
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => console.log('Proxy running on port 4000'));
```

## Setup

```bash
npm install express cors node-fetch
ANTHROPIC_API_KEY=sk-ant-... node server.js
```

## Update invoiceParser.js

Change the fetch URL from:
```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  headers: { "Content-Type": "application/json" },
  ...
```

To:
```javascript
const response = await fetch("http://localhost:4000/api/parse-invoice", {
  headers: { "Content-Type": "application/json" },
  ...
```

Remove the `x-api-key` header from the frontend entirely.
