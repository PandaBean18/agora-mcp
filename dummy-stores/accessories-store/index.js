const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const fs = require('fs');
const path = require('path');
const DB_FILE = path.join(__dirname, 'orders.json');
const INV_FILE = path.join(__dirname, 'inventory.json');

let orders = [];
if (fs.existsSync(DB_FILE)) {
  try {
    orders = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    console.error('Failed to load orders', e);
  }
}

// Independent Inventory (Accessories Store) - Prices in INR
let inventory = {
  'rayban-aviator': { title: 'Ray-Ban Classic Aviator', retailPrice: 1299000, qtyAvailable: 30, details: 'Classic gold frame with green lenses', imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80' },
  'leather-belt': { title: 'Italian Leather Belt', retailPrice: 499900, qtyAvailable: 50, details: 'Genuine full-grain leather belt', imageUrl: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=500&q=80' },
  'minimalist-wallet': { title: 'Minimalist Slim Wallet', retailPrice: 299900, qtyAvailable: 100, details: 'RFID-blocking slim wallet with quick access', imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80' },
  'chronograph-watch': { title: 'Silver Chronograph Watch', retailPrice: 2499000, qtyAvailable: 15, details: 'Stainless steel chronograph watch with sapphire crystal', imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80' },
  'silk-tie': { title: 'Burgundy Silk Tie', retailPrice: 199900, qtyAvailable: 40, details: 'Handmade 100% silk tie for formal wear', imageUrl: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=500&q=80' },
  'silver-cufflinks': { title: 'Sterling Silver Cufflinks', retailPrice: 599900, qtyAvailable: 25, details: 'Elegant sterling silver cufflinks in a presentation box', imageUrl: 'https://images.unsplash.com/photo-1621644754708-543169f44b20?w=500&q=80' }
};

if (fs.existsSync(INV_FILE)) {
  try {
    inventory = JSON.parse(fs.readFileSync(INV_FILE, 'utf-8'));
  } catch (e) {
    console.error('Failed to load inventory', e);
  }
}

function saveState() {
  fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2));
  fs.writeFileSync(INV_FILE, JSON.stringify(inventory, null, 2));
}

app.get('/', (req, res) => {
  res.send('<h1>Agora Accessories (Enterprise API)</h1><p>This is a headless API store. There is no frontend view for this dummy store!</p>');
});

// Enterprise Store: Uses /catalog/find
app.get('/catalog/find', (req, res) => {
  const { query } = req.query;
  const items = Object.entries(inventory).map(([id, data]) => ({ id, ...data }));
  if (query) {
    const qLower = query.toLowerCase();
    const filtered = items.filter(i => 
      i.title.toLowerCase().includes(qLower) || 
      i.details.toLowerCase().includes(qLower)
    );
    return res.json(filtered);
  }
  res.json(items);
});

// Enterprise Store: Uses /item/:id
app.get('/item/:id', (req, res) => {
  const item = inventory[req.params.id];
  if (item) res.json({ id: req.params.id, ...item });
  else res.status(404).json({ error: 'Not found' });
});

// Webhook for Orders
app.post('/webhooks/order', (req, res) => {
  const { items, orderId } = req.body; 
  
  for (const item of items) {
    if (!inventory[item.id] || inventory[item.id].qtyAvailable < item.qty) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
  }

  // Decrement inventory
  items.forEach(item => {
    inventory[item.id].qtyAvailable -= item.qty;
  });

  orders.unshift({ id: orderId, items, status: 'processing' });
  saveState();
  console.log(`[Accessories Store] Order ${orderId} received.`);
  res.json({ success: true, orderId });
});

// Shared Order Tracking Endpoint
app.get('/api/v1/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (order) {
    res.json({ status: order.status, trackingNumber: order.trackingNumber || null });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Webhook for Refunds
app.post('/webhooks/refund', (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => o.id === orderId);
  if (!order || order.status === 'Refunded') {
    return res.status(400).json({ error: 'Cannot refund' });
  }
  
  order.status = 'Refunded';
  
  // Re-increment inventory
  order.items.forEach(item => {
    if (inventory[item.id]) {
      inventory[item.id].qtyAvailable += item.qty;
    }
  });
  saveState();
  
  console.log(`[Accessories Store] Processed refund for order ${orderId}`);
  res.json({ success: true });
});

app.listen(4005, () => console.log('Accessories Store running on port 4005'));
