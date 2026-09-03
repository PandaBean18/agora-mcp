const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

const DB_FILE = path.join(__dirname, 'orders.json');

let orders = [];
if (fs.existsSync(DB_FILE)) {
  try {
    orders = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    console.error('Failed to load orders', e);
  }
}

function saveOrders() {
  fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2));
}

// Independent Inventory (Electronics Store) - Prices in INR
const inventory = {
  'ps5-disc': { title: 'PlayStation 5 Console (Disc Edition)', retailPrice: 5499000, qtyAvailable: 5, details: 'Next-gen gaming console with ultra-high speed SSD', imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&q=80' },
  'ps5-controller': { title: 'DualSense Wireless Controller', retailPrice: 599000, qtyAvailable: 20, details: 'Haptic feedback and adaptive triggers', imageUrl: 'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=500&q=80' },
  'xbox-series-x': { title: 'Xbox Series X', retailPrice: 5599000, qtyAvailable: 3, details: 'The fastest, most powerful Xbox ever', imageUrl: '/images/xbox_series_x.jpg' },
  'spiderman-2-ps5': { title: 'Marvels Spider-Man 2 (PS5)', retailPrice: 499900, qtyAvailable: 30, details: 'Swing, jump and utilize the new Web Wings', imageUrl: '/images/spiderman_2_ps5.jpg' }
};

app.get('/', (req, res) => {
  res.render('index', { storeName: 'Agora Electronics', products: Object.entries(inventory).map(([id, p]) => ({id, ...p})) });
});

app.get('/admin', (req, res) => {
  res.render('admin', { storeName: 'Agora Electronics', orders });
});

// Store Electronics: Uses /api/v1/items
app.get('/api/v1/items', (req, res) => {
  const { q } = req.query;
  const items = Object.entries(inventory).map(([id, data]) => ({ id, ...data }));
  if (q) {
    const filtered = items.filter(i => i.title.toLowerCase().includes(q.toLowerCase()));
    return res.json(filtered);
  }
  res.json(items);
});

// Store Electronics: Details endpoint /api/v1/items/:id
app.get('/api/v1/items/:id', (req, res) => {
  const item = inventory[req.params.id];
  if (item) res.json({ id: req.params.id, ...item });
  else res.status(404).json({ error: 'Not found' });
});

// Store Electronics: Webhook for Orders
app.post('/api/v1/checkout', (req, res) => {
  const { items, orderId } = req.body;
  
  for (const item of items) {
    if (!inventory[item.id] || inventory[item.id].qtyAvailable < item.qty) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
  }

  items.forEach(item => {
    inventory[item.id].qtyAvailable -= item.qty;
  });

  orders.unshift({ id: orderId, items, status: 'processing' });
  saveOrders();
  console.log(`[Electronics Store] Order ${orderId} received. Fulfilled ${items.length} items.`);
  res.json({ success: true, orderId });
});

// Admin: Ship Order
app.post('/admin/ship', async (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => (o.id || o.orderId) === orderId);
  
  if (order && order.status === 'processing') {
    order.status = 'shipped';
    const trackingNumber = 'ELEC' + Math.floor(Math.random() * 1000000);
    order.trackingNumber = trackingNumber;
    
    try {
      await fetch('http://localhost:3000/api/webhooks/order-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'shipped', trackingNumber })
      });
      console.log(`[Electronics Store] Sent shipped webhook for ${orderId}`);
    } catch (e) {
      console.error(`[Electronics Store] Failed to send shipped webhook for ${orderId}`);
    }
    saveOrders();
  }
  res.redirect('/admin');
});

// Store Electronics: Webhook for Refunds
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
  saveOrders();
  
  console.log(`[Electronics Store] Processed refund for order ${orderId}`);
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

app.listen(4004, () => console.log('Electronics Store running on port 4004'));
