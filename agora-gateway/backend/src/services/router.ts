import db from '../db/sqlite.js';
import redisClient from './redis.js';

export async function searchNetwork(query: string, merchantId?: string) {
  // 1. Semantic Router using FTS5 (BM25 ranking)
  // If merchantId is provided, only search that merchant
  let merchants: any[] = [];
  if (merchantId) {
    merchants = [{ merchant_id: merchantId }];
  } else if (!query) {
    merchants = db.prepare('SELECT id as merchant_id FROM merchants').all();
  } else {
    // Basic match on FTS table
    const stmt = db.prepare(`
      SELECT merchant_id 
      FROM merchant_fts 
      WHERE merchant_fts MATCH ? 
      ORDER BY rank
    `);
    // Format query for FTS (basic OR matching for words)
    const ftsQuery = query.split(' ')
      .map(w => w.trim())
      .filter(w => w)
      .map(w => `"${w.replace(/"/g, '""')}"`)
      .join(' OR ');
    merchants = stmt.all(ftsQuery);
    
    // Fallback if FTS yields nothing (e.g. query is a specific product name not in merchant description)
    if (merchants.length === 0) {
       merchants = db.prepare('SELECT id as merchant_id FROM merchants').all();
    }
  }

  const results: any[] = [];

  // 2. Scatter to relevant merchants
  for (const { merchant_id } of merchants) {
    const merchant = getMerchant(merchant_id);
    if (!merchant) continue;

    try {
      const endpoints = JSON.parse(merchant.endpoints_json);
      const fields = JSON.parse(merchant.fields_mapping_json);

      let data;
      if (endpoints.search_post) {
        // Handle POST mapping (e.g. Store C)
        const bodyStr = JSON.stringify(endpoints.search_post.body).replace('{{query}}', query);
        const res = await fetch(`${merchant.base_url}${endpoints.search_post.url}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyStr
        });
        const raw = await res.json();
        data = raw.data || [];
      } else {
        // Handle GET mapping
        const url = `${merchant.base_url}${endpoints.search.replace('{{query}}', encodeURIComponent(query))}`;
        const res = await fetch(url);
        data = await res.json();
      }

      // Standardize response
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (!item) continue;
        results.push({
          agora_sku: `${merchant.id}::${item[fields.sku]}`,
          merchant_id: merchant.id,
          merchant_name: merchant.name,
          sku: String(item[fields.sku]),
          name: item[fields.name],
          price_paise: Number(item[fields.price]),
          stock: Number(item[fields.stock]),
          description: fields.description ? item[fields.description] : undefined,
          image_url: fields.image ? item[fields.image] : undefined
        });
      }
    } catch (e) {
      console.error(`[Router] Error querying merchant ${merchant.id}:`, e);
    }
  }

  return results;
}

export async function getProductDetails(merchantId: string, sku: string) {
  // Strip merchant prefix if the AI passed the full agora_sku
  sku = sku.replace(`${merchantId}::`, '');
  
  const merchant = getMerchant(merchantId);
  if (!merchant) throw new Error('Merchant not found');

  const cacheKey = `stock:${merchantId}:${sku}`;
  
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('Redis cache error:', e);
  }

  const endpoints = JSON.parse(merchant.endpoints_json);
  const fields = JSON.parse(merchant.fields_mapping_json);

  try {
    let data;
    if (endpoints.details_post) {
      const bodyStr = JSON.stringify(endpoints.details_post.body).replace('{{sku}}', sku);
      const res = await fetch(`${merchant.base_url}${endpoints.details_post.url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      });
      const raw = await res.json();
      data = raw.data;
    } else {
      let url = endpoints.details.replace('{{sku}}', encodeURIComponent(sku));
      const res = await fetch(`${merchant.base_url}${url}`);
      data = await res.json();
      // Store B returns array for search, Store A returns object
      if (Array.isArray(data)) data = data[0]; 
    }

    if (!data || data.error) return null;

    const result = {
      agora_sku: `${merchant.id}::${data[fields.sku]}`,
      merchant_id: merchant.id,
      merchant_name: merchant.name,
      sku: String(data[fields.sku]),
      name: data[fields.name],
      price_paise: Number(data[fields.price]),
      stock: Number(data[fields.stock]),
      description: fields.description ? data[fields.description] : undefined,
      image_url: fields.image ? data[fields.image] : undefined
    };

    // Cache the result for 5 seconds to prevent DDoS via AI loop
    try {
      await redisClient.setEx(cacheKey, 5, JSON.stringify(result));
    } catch (e) {
      console.error('Redis cache set error:', e);
    }

    return result;

  } catch (e) {
    console.error(`[Router] Error getting details for ${sku} from ${merchant.id}:`, e);
    return null;
  }
}

export async function submitOrderWebhook(merchantId: string, items: any[], cartToken: string) {
  // Strip merchant prefix if the AI passed the full agora_sku
  items = items.map(i => ({ ...i, sku: i.sku.replace(`${merchantId}::`, '') }));

  const merchant = getMerchant(merchantId);
  if (!merchant) throw new Error('Merchant not found');
  
  const endpoints = JSON.parse(merchant.endpoints_json);
  
  // Custom mapping based on the dummy stores we built
  let payload: any = {};
  if (merchantId === 'store_audio') {
    payload = { orderId: cartToken, items: items.map(i => ({ id: i.sku, qty: i.qty })) };
  } else if (merchantId === 'store_clothing') {
    payload = { transactionRef: cartToken, cart: items.map(i => ({ product_slug: i.sku, count: i.qty })) };
  } else if (merchantId === 'store_tcg') {
    payload = { purchaseData: { orderId: cartToken, items: items.map(i => ({ uuid: i.sku, qty: i.qty })) } };
  } else if (merchantId === 'store_electronics') {
    payload = { orderId: cartToken, items: items.map(i => ({ id: i.sku, qty: i.qty })) };
  }

  const url = `${merchant.base_url}${endpoints.order_webhook}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Merchant Webhook Failed: ${res.status} - ${txt}`);
  }
  
  return await res.json();
}

export async function submitRefundWebhook(merchantId: string, cartToken: string) {
  const merchant = getMerchant(merchantId);
  if (!merchant) throw new Error('Merchant not found');
  
  // For the hackathon dummy stores, they all listen for refunds on /api/v1/refund
  // In a real system this would be dynamic via endpoints_json
  const url = `${merchant.base_url}/api/v1/refund`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: cartToken })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Merchant Refund Webhook Failed: ${res.status} - ${txt}`);
  }
  
  return await res.json();
}

export async function trackOrder(merchantId: string, orderId: string) {
  const merchant = getMerchant(merchantId);
  if (!merchant) throw new Error('Merchant not found');
  
  // Hardcoded for hackathon dummy stores
  const res = await fetch(`${merchant.base_url}/api/v1/orders/${orderId}`);
  if (!res.ok) throw new Error('Order not found at merchant');
  return await res.json();
}

function getMerchant(id: string) {
  return db.prepare('SELECT * FROM merchants WHERE id = ?').get(id) as any;
}
