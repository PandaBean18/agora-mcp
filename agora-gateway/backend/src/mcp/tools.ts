import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { searchNetwork, getProductDetails, submitOrderWebhook, submitRefundWebhook, trackOrder } from '../services/router';
import { createPaymentLink } from '../services/razorpay';
import { logAction } from '../services/ledger';
import crypto from 'crypto';
import db from '../db/sqlite';

export function registerTools(server: McpServer, agentId: string) {

  // 1. search_network
  server.tool(
    'search_network',
    'Search the federated network. Returns products from matching merchants based on semantic category routing.',
    {
      query: z.string().describe('Search query (e.g. "headphones", "jacket", "charizard")'),
      merchant_id: z.string().optional().describe('Optional: narrow search to a specific merchant ID')
    },
    async ({ query, merchant_id }) => {
      const results = await searchNetwork(query, merchant_id);
      logAction(agentId, 'search_network', `Searched for ${query}`, 'PASS', { resultsCount: results.length, merchant_id });
      
      // Format the results for Claude with Markdown Images!
      let formattedText = `Found ${results.length} results for "${query}":\n\n`;
      for (const item of results) {
        formattedText += `### ${item.name} (${item.merchant_name})\n`;
        if (item.image_url) {
          formattedText += `![${item.name}](${item.image_url})\n`;
        }
        formattedText += `- **SKU**: ${item.agora_sku}\n`;
        formattedText += `- **Merchant ID**: ${item.merchant_id} (Use this EXACT ID for other tools)\n`;
        formattedText += `- **Price**: ₹${(item.price_paise / 100).toFixed(2)} (Paise: ${item.price_paise})\n`;
        formattedText += `- **Stock**: ${item.stock}\n`;
        if (item.description) formattedText += `- **Description**: ${item.description}\n`;
        formattedText += `\n---\n`;
      }

      return { content: [{ type: 'text', text: formattedText }] };
    }
  );

  // 2. get_product_details
  server.tool(
    'get_product_details',
    'Get detailed information about a specific product. You MUST use the exact SKU and Merchant ID returned by search_network.',
    {
      merchant_id: z.string().describe('The exact Merchant ID string returned by search_network (e.g., "store_audio")'),
      sku: z.string().describe('The exact SKU string returned by search_network')
    },
    async ({ merchant_id, sku }) => {
      const product = await getProductDetails(merchant_id, sku);
      if (!product) {
        logAction(agentId, 'get_product_details', `Product ${sku} not found at ${merchant_id}`, 'FAIL', { merchant_id, sku }, merchant_id);
        return { content: [{ type: 'text', text: 'Product not found.' }] };
      }
      logAction(agentId, 'get_product_details', `Viewed product ${sku}`, 'PASS', product, merchant_id);
      return { content: [{ type: 'text', text: JSON.stringify(product, null, 2) }] };
    }
  );

  // 3. lock_cart_and_quote
  server.tool(
    'lock_cart_and_quote',
    'Get a final price quote for a cart. CRITICAL: When the user places an order, you MUST explicitly explain Agora\'s 3-way handshake Escrow system to the user: "Your payment is safely held in escrow by Agora. Funds are only released to the merchant AFTER they mark the order delivered AND you confirm receipt via email. If there is a dispute, your funds are safe."',
    {
      merchant_id: z.string(),
      items: z.array(z.object({ sku: z.string(), quantity: z.number() })),
      shipping_address: z.string().describe('Mandatory shipping address')
    },
    async ({ merchant_id, items, shipping_address }) => {
      let subtotal = 0;
      let triggerFound = false;
      let bundledSuggestedFound = false;

      for (const reqItem of items) {
        const product = await getProductDetails(merchant_id, reqItem.sku);

        if (!product || product.stock < reqItem.quantity) {
          logAction(agentId, 'lock_cart_and_quote', `Failed cart lock. Insufficient stock for ${reqItem.sku}`, 'FAIL', { merchant_id, sku: reqItem.sku, requested: reqItem.quantity }, merchant_id);
          return { content: [{ type: 'text', text: `Product ${reqItem.sku} not found or insufficient stock.` }] };
        }
        
        let itemPricePaise = product.price_paise;
        subtotal += itemPricePaise * reqItem.quantity;
      }

      // Upsell Engine Check
      let recommended_addon = undefined;
      let discountApplied = false;
      
      try {
        const merchantRow = db.prepare('SELECT upsell_rules_json FROM merchants WHERE id = ?').get(merchant_id) as any;
        if (merchantRow && merchantRow.upsell_rules_json) {
          const rules = JSON.parse(merchantRow.upsell_rules_json);
          for (const rule of rules) {
            
            // Check if cart has trigger
            for (const reqItem of items) {
               const p = await getProductDetails(merchant_id, reqItem.sku);
               if (p && ((p.name || '').toLowerCase().includes(rule.trigger_category.toLowerCase()) || 
                   (p.description || '').toLowerCase().includes(rule.trigger_category.toLowerCase()))) {
                 triggerFound = true;
               }
               if (reqItem.sku === rule.suggested_sku) {
                 bundledSuggestedFound = true;
               }
            }

            if (triggerFound) {
              if (bundledSuggestedFound) {
              const suggestedProduct = await getProductDetails(merchant_id, rule.suggested_sku);
              if (suggestedProduct) {
                const discountAmount = (suggestedProduct.price_paise * (rule.discount_percent / 100));
                subtotal -= discountAmount;
                discountApplied = true;
              }
            } else {
                recommended_addon = {
                  sku: rule.suggested_sku,
                  reason: rule.reason,
                  bundle_discount: `${rule.discount_percent}% off when bundled`
                };
              }
              break;
            }
          }
        }
      } catch (e) {
        console.error('Upsell check error:', e);
      }

      const tax = Math.round(subtotal * 0.18); // 18% tax
      const shipping = 50000; // Flat ₹500.00
      const total = subtotal + tax + shipping;

      const token = crypto.randomBytes(8).toString('hex');
      logAction(agentId, 'lock_cart_and_quote', `Locked cart ${token}`, 'PASS', { items, total }, merchant_id);

      const responsePayload: any = {
        cart_token: token,
        merchant_id,
        shipping_address,
        locked_items: items,
        breakdown_paise: { subtotal, tax, shipping, total },
        total_inr: `₹${(total / 100).toFixed(2)}`
      };

      if (recommended_addon) {
        responsePayload.recommended_addon = recommended_addon;
      }
      if (discountApplied) {
        responsePayload.notes = "Bundle discount applied!";
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(responsePayload, null, 2) }]
      };
    }
  );

  // 4. execute_settlement
  server.tool(
    'execute_settlement',
    'Generate a Cryptographic Mandate for human approval to execute settlement.',
    {
      cart_token: z.string(),
      merchant_id: z.string(),
      items: z.array(z.object({ sku: z.string(), quantity: z.number() })),
      quoted_total_paise: z.number(),
      shipping_address: z.string().describe('Mandatory shipping address'),
      max_authorized_budget_paise: z.number().describe('Budget limit in paise')
    },
    async ({ cart_token, merchant_id, items, quoted_total_paise, shipping_address, max_authorized_budget_paise }) => {
      try {
        // Policy 1: Budget Limit
        if (quoted_total_paise > max_authorized_budget_paise) {
          logAction(agentId, 'execute_settlement', `Settlement blocked: Total ${quoted_total_paise} exceeds budget ${max_authorized_budget_paise}`, 'FAIL_BUDGET', { quoted_total_paise, max_authorized_budget_paise }, merchant_id);
          return { content: [{ type: 'text', text: `ERROR: Budget overrun. Transaction blocked.` }] };
        }

        // Policy 2: Live stock ping (Inventory Race check)
        for (const reqItem of items) {
          const liveProduct = await getProductDetails(merchant_id, reqItem.sku);
          if (!liveProduct || liveProduct.stock < reqItem.quantity) {
            logAction(agentId, 'execute_settlement', `Settlement blocked: Race condition. ${reqItem.sku} stocked out.`, 'FAIL_INVENTORY', { requested: reqItem.quantity, available: liveProduct?.stock }, merchant_id);
            return { content: [{ type: 'text', text: `ERROR: Inventory race condition. Stock for ${reqItem.sku} no longer available.` }] };
          }
        }

        // Policy 3: Agent Quota Limits (Sybil Resistance)
        const pendingCountRow = db.prepare('SELECT COUNT(*) as count FROM mandates WHERE approved = 0').get() as { count: number };
        if (pendingCountRow.count >= 3) {
          logAction(agentId, 'execute_settlement', `Settlement blocked: Agent quota exceeded.`, 'FAIL_QUOTA', { pending_count: pendingCountRow.count }, merchant_id);
          return { content: [{ type: 'text', text: `ERROR: Quota exceeded. You already have 3 pending cryptographic mandates waiting for human approval. Please wait for the user to approve them before creating more.` }] };
        }

        // Generate Cryptographic Mandate Token
        const mandateToken = crypto.randomBytes(16).toString('hex');
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        db.prepare(`
          INSERT INTO mandates (token, cart_token, merchant_id, items_json, quoted_total, expires_at, approved, shipping_address)
          VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        `).run(mandateToken, cart_token, merchant_id, JSON.stringify(items), quoted_total_paise, expiresAt, shipping_address);

        logAction(agentId, 'execute_settlement', `Generated Cryptographic Mandate for approval`, 'PASS', { cart_token, mandateToken, expiresAt }, merchant_id);

        const approval_url = `http://localhost:5173/mandate/${mandateToken}`;

        return { 
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              error: "HTTP 402 Payment Required",
              message: "A Cryptographic Mandate has been generated. The human must approve this transaction before settlement can proceed.",
              approval_url: approval_url,
              expires_at: new Date(expiresAt).toISOString()
            }, null, 2) 
          }] 
        };
      } catch (e: any) {
        console.error('Execute Settlement Error:', e);
        return { content: [{ type: 'text', text: `INTERNAL ERROR in execute_settlement: ${e.message}\n${e.stack}` }] };
      }
    }
  );

  // 5. check_mandate_status
  server.tool(
    'check_mandate_status',
    'Check if the human has approved the cryptographic mandate, and retrieve the final x402 AP2 Settlement Envelope.',
    {
      mandate_token: z.string()
    },
    async ({ mandate_token }) => {
      const mandate = db.prepare('SELECT * FROM mandates WHERE token = ?').get(mandate_token) as any;

      if (!mandate) {
        return { content: [{ type: 'text', text: 'ERROR: Mandate not found or expired.' }] };
      }

      if (mandate.approved === 0) {
        return { content: [{ type: 'text', text: 'PENDING: The mandate has not been approved yet. Please wait for the user.' }] };
      }

      // Formal x402 / AP2 JSON Envelope
      const ap2Envelope = {
        protocol: "x402/AP2",
        status: "AUTHORIZED",
        mandate_token: mandate.token,
        settlement_url: mandate.razorpay_link,
        headers: {
          "X-Payment-Protocol": "AP2",
          "X-Amount-Due": mandate.quoted_total,
          "X-Mandate-Signature": crypto.createHash('sha256').update(mandate.token + mandate.razorpay_link).digest('hex')
        }
      };

      return { content: [{ type: 'text', text: JSON.stringify(ap2Envelope, null, 2) }] };
    }
  );

  // 6. request_refund
  server.tool(
    'request_refund',
    'Securely initiate a refund request for an order. Simulates the ledger entry and notifies the merchant.',
    {
      cart_token: z.string().describe('The Order ID / Cart Token to refund'),
      merchant_id: z.string().describe('The merchant ID'),
      reason: z.string().describe('Reason for refund')
    },
    async ({ cart_token, merchant_id, reason }) => {
      try {
        await submitRefundWebhook(merchant_id, cart_token);
        logAction(agentId, 'request_refund', `Refund requested for ${cart_token}`, 'PASS', { reason }, merchant_id);
        return { content: [{ type: 'text', text: `Refund successfully initiated for order ${cart_token}.` }] };
      } catch (e: any) {
        logAction(agentId, 'request_refund', `Refund failed for ${cart_token}`, 'FAIL', { error: e.message }, merchant_id);
        return { content: [{ type: 'text', text: `Failed to initiate refund: ${e.message}` }] };
      }
    }
  );

  // 7. track_order
  server.tool(
    'track_order',
    'Track the live status and shipping information of an order directly from the merchant.',
    {
      cart_token: z.string().describe('The Order ID / Cart Token to track'),
      merchant_id: z.string().describe('The merchant ID')
    },
    async ({ cart_token, merchant_id }) => {
      try {
        const status = await trackOrder(merchant_id, cart_token);
        logAction(agentId, 'track_order', `Tracked order ${cart_token}`, 'PASS', status, merchant_id);
        return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: 'text', text: `Failed to track order: ${e.message}` }] };
      }
    }
  );

  // 8. get_audit_trail
  server.tool(
    'get_audit_trail',
    'Retrieve the full cryptographic ledger audit trail for a specific order. This proves all actions were authorized.',
    {
      cart_token: z.string().describe('The Order ID / Cart Token to audit')
    },
    async ({ cart_token }) => {
      try {
        const events = db.prepare(`
          SELECT * FROM ledger 
          WHERE details LIKE ? 
             OR intent_rationale LIKE ?
          ORDER BY timestamp ASC
        `).all(`%${cart_token}%`, `%${cart_token}%`);
        
        const formattedEvents = events.map((e: any) => ({
          ...e,
          details: e.details ? JSON.parse(e.details) : null
        }));

        logAction(agentId, 'get_audit_trail', `Pulled audit trail for ${cart_token}`, 'PASS', { event_count: events.length });

        return { 
          content: [{ 
            type: 'text', 
            text: JSON.stringify({ 
              message: "Audit Trail Retrieved Successfully",
              total_events: formattedEvents.length,
              timeline: formattedEvents 
            }, null, 2) 
          }] 
        };
      } catch (e: any) {
        return { content: [{ type: 'text', text: `Failed to retrieve audit trail: ${e.message}` }] };
      }
    }
  );
}
