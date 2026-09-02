import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { registerTools } from './mcp/tools';
import { getLedgerEntries } from './services/ledger';
import db from './db/sqlite';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());

const transports = new Map<string, SSEServerTransport>();

// --- Cryptographic Mandates (Human-in-the-Loop) ---
import db from './db/sqlite.js';

app.get('/api/mandates/:token', (req, res) => {
  const mandate = db.prepare('SELECT * FROM mandates WHERE token = ?').get(req.params.token) as any;
  if (!mandate) return res.status(404).json({ error: 'Mandate not found or expired' });
  
  if (Date.now() > mandate.expires_at) {
    db.prepare('DELETE FROM mandates WHERE token = ?').run(req.params.token);
    return res.status(400).json({ error: 'Mandate expired' });
  }
  
  mandate.items = JSON.parse(mandate.items_json);
  mandate.approved = mandate.approved === 1;
  res.json(mandate);
});

import { createPaymentLink } from './services/razorpay.js';
import { submitOrderWebhook } from './services/router.js';
import { logAction } from './services/ledger.js';

app.post('/api/mandates/:token/approve', async (req, res) => {
  const mandate = db.prepare('SELECT * FROM mandates WHERE token = ?').get(req.params.token) as any;
  if (!mandate) return res.status(404).json({ error: 'Mandate not found' });
  if (mandate.approved === 1) return res.status(400).json({ error: 'Already approved' });
  
  mandate.items = JSON.parse(mandate.items_json);

  try {
    // 1. Generate real payment link
    const plink = await createPaymentLink(mandate.quoted_total, `Agora Order ${mandate.cart_token}`, mandate.cart_token);
    
    db.prepare('UPDATE mandates SET approved = 1, razorpay_link = ? WHERE token = ?').run(plink.short_url, mandate.token);

    // 2. Fire webhook to merchant to reduce stock (Zero-Click Simulation)
    await submitOrderWebhook(mandate.merchant_id, mandate.items.map((i: any) => ({ sku: i.sku, qty: i.quantity })), mandate.cart_token);

    logAction('human_user', 'approve_mandate', 'Human approved cryptographic mandate', 'PASS', { token: mandate.token, plink: plink.short_url }, mandate.merchant_id);

    res.json({ success: true, link: plink.short_url });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process mandate approval' });
  }
});
// --------------------------------------------------

// Handle Gemini's HEAD request for reachability check
app.head('/mcp/sse', (req, res) => {
  res.status(200).end();
});

app.get('/mcp/sse', async (req, res) => {
  console.log(`[GET] New MCP connection initializing.`);
  
  const mcpServer = new McpServer({
    name: 'Agora Gateway',
    version: '2.0.0'
  });
  registerTools(mcpServer, 'agent_beta_01');
  
  // Provide the BASE url. The SDK automatically appends ?sessionId=UUID
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers.host;
  const postUrl = `${protocol}://${host}/mcp/messages`;
  
  const transport = new SSEServerTransport(postUrl, res);
  // @ts-ignore - The SDK exposes sessionId but TypeScript might not know depending on the version
  const sessionId = transport.sessionId; 
  
  transports.set(sessionId, transport);
  console.log(`[GET] Transport stored with SDK sessionId: ${sessionId}. Active transports: ${transports.size}`);
  
  await mcpServer.connect(transport);
  
  req.on('close', () => {
    transports.delete(sessionId);
    console.log(`[GET] Connection closed event fired. Active transports: ${transports.size}`);
  });
});

app.post('/mcp/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  console.log(`[POST] Received message for sessionId: ${sessionId}`);
  console.log(`[POST] Available sessionIds:`, Array.from(transports.keys()));
  
  const transport = transports.get(sessionId);
  if (transport) {
    console.log(`[POST] Transport found. Handling message.`);
    await transport.handlePostMessage(req, res);
  } else {
    console.log(`[POST] Transport NOT found. Returning 400.`);
    res.status(400).send('No active SSE connection for this session');
  }
});

// Admin / Visualizer REST endpoints
app.get('/api/ledger', (req, res) => {
  res.json(getLedgerEntries(50));
});

// To fetch all products from all merchants (just for the demo storefront UI)
import { searchNetwork } from './services/router';
app.get('/api/storefront', async (req, res) => {
  // Empty query returns all via our router logic
  const items = await searchNetwork('');
  res.json(items);
});

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Support Claude Desktop directly via Stdio
if (process.argv.includes('--stdio')) {
  const stdioServer = new McpServer({
    name: 'Agora Gateway (Stdio)',
    version: '2.0.0'
  });
  registerTools(stdioServer, 'agent_claude_desktop');
  
  const transport = new StdioServerTransport();
  stdioServer.connect(transport).then(() => {
    console.error('Agora Gateway Stdio Server running for Claude Desktop');
  });
} else {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Agora Gateway running on port ${PORT} (SSE Mode)`);
  });
}
