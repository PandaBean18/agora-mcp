import cron from 'node-cron';
import db from '../db/sqlite.js';
import redisClient from './redis.js';

/**
 * Syncs the entire network catalog into Redis.
 * This runs on a schedule (e.g. every 15 minutes) to ensure we don't spam merchants
 * when an agent is just searching for items.
 */
export async function syncCatalogs() {
  console.log('[Cron] Starting catalog sync...');
  const merchants = db.prepare('SELECT * FROM merchants').all() as any[];

  for (const merchant of merchants) {
    try {
      const endpoints = JSON.parse(merchant.endpoints_json);
      const fields = JSON.parse(merchant.fields_mapping_json);
      let data;
      
      if (endpoints.search_post) {
        // Handle POST mapping
        const bodyStr = JSON.stringify(endpoints.search_post.body).replace('{{query}}', '');
        const res = await fetch(`${merchant.base_url}${endpoints.search_post.url}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyStr
        });
        const raw = await res.json();
        data = raw.data || [];
      } else {
        // Handle GET mapping
        const url = `${merchant.base_url}${endpoints.search.replace('{{query}}', '')}`;
        const res = await fetch(url);
        data = await res.json();
      }

      const items = Array.isArray(data) ? data : [data];
      const standardizedItems = [];

      for (const item of items) {
        if (!item) continue;
        
        let imageUrl = fields.image ? item[fields.image] : undefined;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `${merchant.base_url}${imageUrl}`;
        }

        standardizedItems.push({
          agora_sku: `${merchant.id}::${item[fields.sku]}`,
          merchant_id: merchant.id,
          merchant_name: merchant.name,
          sku: String(item[fields.sku]),
          name: item[fields.name],
          price_paise: Number(item[fields.price]),
          stock: Number(item[fields.stock]),
          description: fields.description ? item[fields.description] : undefined,
          image_url: imageUrl
        });
      }

      // Store in Redis (expires in 20 mins to ensure slight overlap with 15 min cron)
      await redisClient.setEx(`agora:catalog:${merchant.id}`, 1200, JSON.stringify(standardizedItems));
      console.log(`[Cron] Synced ${standardizedItems.length} items for merchant ${merchant.id}`);
    } catch (e) {
      console.error(`[Cron] Error syncing merchant ${merchant.id}:`, e);
    }
  }
}

// Run every 15 minutes
export function startCronJobs() {
  cron.schedule('*/15 * * * *', () => {
    syncCatalogs();
  });
  
  // Also run once immediately on startup
  setTimeout(syncCatalogs, 5000);
}
