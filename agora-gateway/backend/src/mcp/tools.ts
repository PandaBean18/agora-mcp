import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { searchNetwork, getProductDetails, submitOrderWebhook } from '../services/router';
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
      query: z.string().describe('Search query (e.g. "headphones", "jacket", "charizard")')
    },
    async ({ query }) => {
      const results = await searchNetwork(query);
      logAction(agentId, 'search_network', `Searched network for: ${query}`, 'PASS', { query, resultsFound: results.length });
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    }
  );

  // 2. get_product_details
  server.tool(
    'get_product_details',
    'Get specific details and live inventory for a product from a specific merchant.',
    {
      merchant_id: z.string().describe('Merchant ID'),
      sku: z.string().describe('Merchant-specific Product SKU')
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
    'Lock items and get a deterministic quote (taxes, shipping) before settlement. Supports multiple items.',
    {
      merchant_id: z.string(),
      items: z.array(z.object({ sku: z.string(), quantity: z.number() })),
      shipping_address: z.string().optional()
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
        
        let itemPriceCents = product.price_cents;
        subtotal += itemPriceCents * reqItem.quantity;
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
                // Apply discount to the suggested item!
                const p = await getProductDetails(merchant_id, rule.suggested_sku);
                if (p) {
                   const discountAmount = Math.floor(p.price_cents * (rule.discount_percent / 100));
                   // Find how many suggested items are in cart to discount them
                   const bundledQty = items.find(i => i.sku === rule.suggested_sku)?.quantity || 1;
                   subtotal -= (discountAmount * bundledQty); 
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
        console.error('Failed to parse upsell rules', e);
      }

      const tax = Math.floor(subtotal * 0.18); // 18% tax
      const shipping = 5000; // Flat 50.00
      const total = subtotal + tax + shipping;

      const token = crypto.randomUUID();

      logAction(agentId, 'lock_cart_and_quote', `Quoted cart with ${items.length} items`, 'PASS', { subtotal, tax, shipping, total, token, upsell: recommended_addon ? 'Triggered' : (discountApplied ? 'Applied' : 'None') }, merchant_id);

      const responsePayload: any = {
        cart_token: token,
        merchant_id,
        locked_items: items,
        breakdown: { subtotal, tax, shipping, total }
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
      quoted_total: z.number(),
      max_authorized_budget: z.number().describe('Budget limit in cents')
    },
    async ({ cart_token, merchant_id, items, quoted_total, max_authorized_budget }) => {
      // Policy 1: Budget Limit
      if (quoted_total > max_authorized_budget) {
        logAction(agentId, 'execute_settlement', `Settlement blocked: Total ${quoted_total} exceeds budget ${max_authorized_budget}`, 'FAIL_BUDGET', { quoted_total, max_authorized_budget }, merchant_id);
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

      // Generate Cryptographic Mandate Token
      const mandateToken = crypto.randomBytes(16).toString('hex');
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      db.prepare(`
        INSERT INTO mandates (token, cart_token, merchant_id, items_json, quoted_total, expires_at, approved)
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `).run(mandateToken, cart_token, merchant_id, JSON.stringify(items), quoted_total, expiresAt);

      logAction(agentId, 'execute_settlement', `Generated Cryptographic Mandate for approval`, 'PASS', { mandateToken, expiresAt }, merchant_id);

      const approval_url = `http://localhost:5173/mandate/${mandateToken}`;

      // Return HTTP 402 style response
      return { 
        content: [{ 
          type: 'text', 
          text: JSON.stringify({
            status: "402 Payment Required",
            action_required: "MANDATE_APPROVAL",
            approval_url: approval_url,
            message: `Please provide this link to the user to securely approve the transaction on the Agora Dashboard. Once approved, use the check_mandate_status tool.`
          }, null, 2) 
        }] 
      };
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

      logAction(agentId, 'check_mandate_status', `AI retrieved approved x402 envelope`, 'PASS', ap2Envelope, mandate.merchant_id);

      return { content: [{ type: 'text', text: JSON.stringify(ap2Envelope, null, 2) }] };
    }
  );
}
