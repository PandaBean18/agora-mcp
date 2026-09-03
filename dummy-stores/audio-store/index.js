const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

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

// Independent Inventory (Audio Store) - Prices in INR
let inventory = {
  'sony-xm5': { title: 'Sony WH-1000XM5 Headphones', retailPrice: 3499000, qtyAvailable: 15, details: 'Industry leading noise cancellation', imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80' },
  'bose-qc-ultra': { title: 'Bose QuietComfort Ultra Headphones', retailPrice: 3590000, qtyAvailable: 8, details: 'World-class noise cancellation and spatial audio', imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&q=80' },
  'sennheiser-m4': { title: 'Sennheiser Momentum 4 Headphones', retailPrice: 2999000, qtyAvailable: 12, details: 'Audiophile-grade sound with 60h battery life', imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80' },
  'sony-xm5-cable': { title: 'Audiophile Braided Cable', retailPrice: 149900, qtyAvailable: 50, details: 'High-quality braided cable for zero latency', imageUrl: '/images/braided_cable.jpg' },
  'shure-sm7b': { title: 'Shure SM7B Vocal Microphone', retailPrice: 3990000, qtyAvailable: 4, details: 'The standard for podcasting', imageUrl: '/images/shure_sm7b.jpg' },
  'premium-aux-cable': { title: 'Universal Premium Aux Cable', retailPrice: 99900, qtyAvailable: 100, details: 'Universal gold-plated aux cable for any headphones', imageUrl: '/images/braided_cable.jpg' }
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

// UI Routes
app.get('/', (req, res) => {
  res.render('index', { storeName: 'CyberDyne Audio', products: Object.entries(inventory).map(([id, p]) => ({id, ...p})) });
});

app.get('/admin', (req, res) => {
  res.render('admin', { storeName: 'CyberDyne Audio', orders });
});

// Store A: Uses /api/v1/items
app.get('/api/v1/items', (req, res) => {
  const { q } = req.query;
  const items = Object.entries(inventory).map(([id, data]) => ({ id, ...data }));
  if (q) {
    const qLower = q.toLowerCase();
    const filtered = items.filter(i => 
      i.title.toLowerCase().includes(qLower) || 
      i.details.toLowerCase().includes(qLower)
    );
    return res.json(filtered);
  }
  res.json(items);
});

// Store A: Details endpoint /api/v1/items/:id
app.get('/api/v1/items/:id', (req, res) => {
  const item = inventory[req.params.id];
  if (item) res.json({ id: req.params.id, ...item });
  else res.status(404).json({ error: 'Not found' });
});

// Store A: Webhook for Orders
app.post('/api/v1/checkout', (req, res) => {
  const { items, orderId } = req.body; // Items array [{ id, qty }]
  
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
  console.log(`[Audio Store] Order ${orderId} received. Fulfilled ${items.length} items.`);
  res.json({ success: true, orderId });
});

// Admin: Ship Order
app.post('/admin/ship', async (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => (o.id || o.orderId) === orderId);
  
  if (order && order.status === 'processing') {
    order.status = 'shipped';
    const trackingNumber = 'CYBERDYNE' + Math.floor(Math.random() * 1000000);
    order.trackingNumber = trackingNumber;
    
    try {
      await fetch('http://localhost:3000/api/webhooks/order-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'shipped', trackingNumber })
      });
      console.log(`[Audio Store] Sent shipped webhook for ${orderId}`);
    } catch (e) {
      console.error(`[Audio Store] Failed to send shipped webhook for ${orderId}`);
    }
    saveState();
  }
  res.redirect('/admin');
});

// Store A: Webhook for Refunds
app.post('/api/v1/refund', (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => o.id === orderId);
  
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'refunded') return res.status(400).json({ error: 'Already refunded' });
  
  order.status = 'refunded';
  
  // Restock items
  order.items.forEach(item => {
    if (inventory[item.id]) {
      inventory[item.id].qtyAvailable += item.qty;
    }
  });
  saveState();
  
  console.log(`[Audio Store] Processed refund for order ${orderId}`);
  res.json({ success: true });
});

// Shared Order Tracking Endpoint
app.get('/api/v1/orders/:id', (req, res) => {
  const order = orders.find(o => (o.id || o.orderId || o.transactionRef) === req.params.id);
  if (order) {
    res.json({ id: order.id, status: order.status, trackingNumber: order.trackingNumber });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

app.listen(4001, () => console.log('Audio Store running on port 4001'));
