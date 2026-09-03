import db from './sqlite';

db.exec('DELETE FROM merchants');
db.exec('DELETE FROM merchant_fts');
db.exec('DELETE FROM ledger');

const insertMerchant = db.prepare(`
  INSERT INTO merchants (id, name, description, base_url, endpoints_json, fields_mapping_json, upsell_rules_json) 
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertFts = db.prepare(`
  INSERT INTO merchant_fts (merchant_id, name, description, categories)
  VALUES (?, ?, ?, ?)
`);

const merchants = [
  {
    id: 'store_audio',
    name: 'CyberDyne Audio',
    description: 'High-end audio equipment, headphones, microphones, and electronics.',
    categories: 'audio electronics headphones microphones sound',
    baseUrl: 'http://localhost:4001',
    endpoints: {
      search: '/api/v1/items?q={{query}}',
      details: '/api/v1/items/{{sku}}',
      order_webhook: '/api/v1/checkout'
    },
    fields: {
      sku: 'id',
      name: 'title',
      price: 'retailPrice',
      stock: 'qtyAvailable',
      description: 'details',
      image: 'imageUrl'
    },
    upsell_rules: [
      {
        trigger_category: 'Headphones',
        suggested_sku: 'sony-xm5-cable',
        reason: 'Audiophile Braided Cable (Often bought together)',
        discount_percent: 10
      }
    ]
  },
  {
    id: 'store_clothing',
    name: 'Agora Threads',
    description: 'Developer clothing, apparel, hoodies, and jackets.',
    categories: 'clothing apparel fashion shirts hoodies jackets',
    baseUrl: 'http://localhost:4002',
    endpoints: {
      search: '/store/products?search={{query}}',
      details: '/store/products?slug={{sku}}',
      order_webhook: '/store/orders/new'
    },
    fields: {
      sku: 'slug',
      name: 'name',
      price: 'cost',
      stock: 'stock_count',
      image: 'image'
    }
  },
  {
    id: 'store_tcg',
    name: 'Rare Vault TCG',
    description: 'Trading card games, collectibles, pokemon, magic the gathering.',
    categories: 'tcg trading cards collectibles pokemon mtg magic',
    baseUrl: 'http://localhost:4003',
    endpoints: {
      search_post: { url: '/query', body: { action: 'SEARCH_CARDS', payload: { keyword: '{{query}}' } } },
      details_post: { url: '/query', body: { action: 'GET_CARD', payload: { uuid: '{{sku}}' } } },
      order_webhook: '/webhooks/agora'
    },
    fields: {
      sku: 'uuid',
      name: 'cardName',
      price: 'usdPrice',
      stock: 'inStock',
      image: 'image'
    }
  },
  {
    id: 'store_electronics',
    name: 'Agora Electronics',
    description: 'General electronics, PlayStations, Xbox, controllers, and video games.',
    categories: 'electronics gaming playstation xbox ps5 games console',
    baseUrl: 'http://localhost:4004',
    endpoints: {
      search: '/api/v1/items?q={{query}}',
      details: '/api/v1/items/{{sku}}',
      order_webhook: '/api/v1/checkout'
    },
    fields: {
      sku: 'id',
      name: 'title',
      price: 'retailPrice',
      stock: 'qtyAvailable',
      description: 'details',
      image: 'imageUrl'
    },
    upsell_rules: [
      {
        trigger_category: 'gaming console',
        suggested_sku: 'ps5-controller',
        reason: 'Extra DualSense Controller (For local multiplayer)',
        discount_percent: 15
      }
    ]
  }
];

const seed = db.transaction(() => {
  for (const m of merchants) {
    insertMerchant.run(m.id, m.name, m.description, m.baseUrl, JSON.stringify(m.endpoints), JSON.stringify(m.fields), m.upsell_rules ? JSON.stringify(m.upsell_rules) : null);
    insertFts.run(m.id, m.name, m.description, m.categories);
  }
});

seed();
console.log('Agora Gateway Database seeded with merchants.');
