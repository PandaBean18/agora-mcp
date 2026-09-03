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

// Independent Inventory (TCG Store) - Prices in INR
const database = {
  cards: [
    { uuid: 'base-set-charizard', cardName: 'Charizard Base Set Holo (PSA 9)', usdPrice: 85000000, inStock: 1, image: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=500&q=80' },
    { uuid: 'mtg-black-lotus', cardName: 'Black Lotus (Beta, MP)', usdPrice: 350000000, inStock: 0, image: 'https://images.unsplash.com/photo-1620336655055-088d06e36bf0?w=500&q=80' } // Simulating out of stock
  ]
};

app.get('/', (req, res) => {
  res.render('index', { storeName: 'Rare Vault TCG', products: database.cards });
});

app.get('/admin', (req, res) => {
  res.render('admin', { storeName: 'Rare Vault TCG', orders });
});

// Store C: Uses /query (simulating a messy REST endpoint or quasi-graphql)
app.post('/query', (req, res) => {
  const { action, payload } = req.body;

  if (action === 'SEARCH_CARDS') {
    const q = payload.keyword ? payload.keyword.toLowerCase() : '';
    const results = database.cards.filter(c => c.cardName.toLowerCase().includes(q));
    return res.json({ data: results });
  }

  if (action === 'GET_CARD') {
    const card = database.cards.find(c => c.uuid === payload.uuid);
    return card ? res.json({ data: card }) : res.status(404).json({ error: 'Card not found' });
  }

  res.status(400).json({ error: 'Unknown action' });
});

// Store C: Webhook for Orders
app.post('/webhooks/agora', (req, res) => {
  const { purchaseData, authSignature } = req.body;
  
  if (!purchaseData || !purchaseData.items) return res.status(400).send('Bad Request');

  for (const item of purchaseData.items) {
    const card = database.cards.find(c => c.uuid === item.uuid);
    if (!card || card.inStock < item.qty) {
      return res.status(400).json({ error: 'Card no longer available' });
    }
  }

  // Decrement
  purchaseData.items.forEach(item => {
    const card = database.cards.find(c => c.uuid === item.uuid);
    card.inStock -= item.qty;
  });

  orders.unshift({ id: purchaseData.orderId, items: purchaseData.items.map(i => ({ sku: i.uuid, qty: i.qty })), status: 'processing' });
  saveOrders();
  console.log(`[TCG Store] Webhook hit! Order ${purchaseData.orderId} processed.`);
  res.json({ ok: true, tracking: 'TRACK-1234' });
});

// Admin: Ship Order
app.post('/admin/ship', async (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => (o.id || o.orderId) === orderId);
  
  if (order && order.status === 'processing') {
    order.status = 'shipped';
    const trackingNumber = 'TCG' + Math.floor(Math.random() * 1000000);
    order.trackingNumber = trackingNumber;
    
    try {
      await fetch('http://localhost:3000/api/webhooks/order-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'shipped', trackingNumber })
      });
      console.log(`[TCG Store] Sent shipped webhook for ${orderId}`);
    } catch (e) {
      console.error(`[TCG Store] Failed to send shipped webhook for ${orderId}`);
    }
    saveOrders();
  }
  res.redirect('/admin');
});

// Store C: Webhook for Refunds
app.post('/api/v1/refund', (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => o.id === orderId);
  
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'refunded') return res.status(400).json({ error: 'Already refunded' });
  
  order.status = 'refunded';
  
  // Restock items
  order.items.forEach(item => {
    const card = database.cards.find(c => c.uuid === item.sku);
    if (card) card.inStock += item.qty;
  });
  saveOrders();
  
  console.log(`[TCG Store] Processed refund for order ${orderId}`);
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

app.listen(4003, () => console.log('TCG Store running on port 4003'));
