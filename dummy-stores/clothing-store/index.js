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

// Independent Inventory (Clothing Store) - Prices in INR
const catalog = [
  { slug: 'vintage-leather-jacket', name: 'Vintage 90s Leather Jacket', cost: 1299900, stock_count: 2, image: '/images/leather_jacket.jpg' },
  { slug: 'agora-hoodie', name: 'Agora Developer Hoodie', cost: 249900, stock_count: 50, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80' },
  { slug: 'agora-tee', name: 'Agora Logo T-Shirt', cost: 99900, stock_count: 150, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80' }
];

app.get('/', (req, res) => {
  res.render('index', { storeName: 'Agora Threads', products: catalog });
});

app.get('/admin', (req, res) => {
  res.render('admin', { storeName: 'Agora Threads', orders });
});

// Store B: Uses /store/products
app.get('/store/products', (req, res) => {
  const { slug, search } = req.query;
  if (slug) {
    const product = catalog.find(p => p.slug === slug);
    return product ? res.json([product]) : res.json([]);
  }
  if (search) {
    const filtered = catalog.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    return res.json(filtered);
  }
  res.json(catalog);
});

// Store B: Order endpoint /store/orders/new
app.post('/store/orders/new', (req, res) => {
  const { cart, transactionRef } = req.body; // Cart format: [{ product_slug, count }]
  
  for (const item of cart) {
    const product = catalog.find(p => p.slug === item.product_slug);
    if (!product || product.stock_count < item.count) {
      return res.status(400).json({ message: 'Stock error' });
    }
  }

  // Decrement
  cart.forEach(item => {
    const product = catalog.find(p => p.slug === item.product_slug);
    product.stock_count -= item.count;
  });

  orders.unshift({ id: transactionRef, items: cart.map(i => ({ sku: i.product_slug, qty: i.count })), status: 'processing' });
  saveOrders();
  console.log(`[Clothing Store] Order ${transactionRef} received!`);
  res.json({ status: 'confirmed', transactionRef });
});

// Admin: Ship Order
app.post('/admin/ship', async (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => (o.id || o.transactionRef) === orderId);
  
  if (order && order.status === 'processing') {
    order.status = 'shipped';
    const trackingNumber = 'AGORA' + Math.floor(Math.random() * 1000000);
    order.trackingNumber = trackingNumber;
    
    try {
      await fetch('http://localhost:3000/api/webhooks/order-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'shipped', trackingNumber })
      });
      console.log(`[Clothing Store] Sent shipped webhook for ${orderId}`);
    } catch (e) {
      console.error(`[Clothing Store] Failed to send shipped webhook for ${orderId}`);
    }
    saveOrders();
  }
  res.redirect('/admin');
});

// Store B: Webhook for Refunds
app.post('/api/v1/refund', (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => o.id === orderId);
  
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'refunded') return res.status(400).json({ error: 'Already refunded' });
  
  order.status = 'refunded';
  
  // Restock items
  order.items.forEach(item => {
    const product = catalog.find(p => p.slug === item.sku);
    if (product) product.stock_count += item.qty;
  });
  saveOrders();
  
  console.log(`[Clothing Store] Processed refund for order ${orderId}`);
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

app.listen(4002, () => console.log('Clothing Store running on port 4002'));
