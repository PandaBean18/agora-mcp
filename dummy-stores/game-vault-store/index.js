const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

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

// Independent Inventory (Game Vault) - Prices in INR (paise)
let catalog = [
  { slug: 'ps5-pro', name: 'PlayStation 5 Pro', price: 6999000, stock_count: 10, description: 'Next-gen Sony gaming console. Experience native 4K gaming with ray tracing.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Black_and_white_Playstation_5_base_edition_with_controller.png' },
  { slug: 'xbox-series-x', name: 'Xbox Series X', price: 4999000, stock_count: 5, description: 'Microsoft flagship console for gaming. The fastest, most powerful Xbox ever.', imageUrl: '/images/xbox_series_x.jpg' },
  { slug: 'switch-oled', name: 'Nintendo Switch OLED', price: 3499000, stock_count: 20, description: 'Hybrid gaming console. Play at home or on the go with a vibrant OLED screen.', imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80' },
  { slug: 'dualsense', name: 'DualSense Wireless Controller', price: 599000, stock_count: 50, description: 'Haptic feedback and adaptive triggers for PlayStation gaming.', imageUrl: '/images/xbox_series_x.jpg' }, // Mock image reuse
  { slug: 'razer-blackshark', name: 'Razer BlackShark V2 Pro', price: 1999000, stock_count: 15, description: 'Esports gaming headset with THX Spatial Audio.', imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80' } // Mock image reuse
];

if (fs.existsSync(INV_FILE)) {
  try {
    catalog = JSON.parse(fs.readFileSync(INV_FILE, 'utf-8'));
  } catch (e) {
    console.error('Failed to load inventory', e);
  }
}

function saveState() {
  fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2));
  fs.writeFileSync(INV_FILE, JSON.stringify(catalog, null, 2));
}

app.get('/', (req, res) => {
  res.render('index', { storeName: 'Game Vault Store', catalog });
});

app.get('/admin', (req, res) => {
  res.render('admin', { storeName: 'Game Vault Store', orders });
});

// Admin Route to ship orders
app.post('/admin/ship', (req, res) => {
  const orderId = req.body.orderId;
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'shipped';
    order.tracking_number = 'GV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    saveState();
  }
  res.redirect('/admin');
});

// Different API Endpoints from defaults
app.get('/api/store/find', (req, res) => {
  const { query } = req.query;
  if (!query) return res.json(catalog);
  
  const lowerQ = query.toLowerCase();
  const filtered = catalog.filter(i => 
    i.name.toLowerCase().includes(lowerQ) || 
    i.description.toLowerCase().includes(lowerQ)
  );
  res.json(filtered);
});

app.get('/api/store/item/:id', (req, res) => {
  const item = catalog.find(i => i.slug === req.params.id);
  if (item) res.json(item);
  else res.status(404).json({ error: 'Not found' });
});

app.post('/api/store/webhook/order', (req, res) => {
  console.log('[Game Vault] Received Order:', req.body);
  const { items, customer, shipping_address } = req.body;
  
  if (!items || !items.length) {
    return res.status(400).json({ success: false, error: 'No items in order' });
  }

  // Deduct stock
  for (const item of items) {
    const product = catalog.find(p => p.slug === item.sku);
    if (product) {
      if (product.stock_count < item.quantity) {
        return res.status(400).json({ success: false, error: `Insufficient stock for ${item.sku}` });
      }
      product.stock_count -= item.quantity;
    }
  }

  const orderId = 'ORD-' + Date.now();
  const newOrder = {
    id: orderId,
    timestamp: new Date().toISOString(),
    status: 'processing',
    customer,
    shipping_address,
    items,
    total_amount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  };
  
  orders.push(newOrder);
  saveState();
  
  res.json({ success: true, order_id: orderId, status: 'processing' });
});

// Agora Webhook: Refund Request
app.post('/api/store/webhook/refund', (req, res) => {
  console.log('[Game Vault] Received Refund Request:', req.body);
  const { order_id, reason } = req.body;
  const order = orders.find(o => o.id === order_id);
  
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
  
  order.status = 'refund_requested';
  order.refund_reason = reason;
  saveState();
  
  res.json({ success: true, status: 'refund_requested' });
});

// Admin Route: Approve Refund
app.post('/admin/refund', (req, res) => {
  const orderId = req.body.orderId;
  const order = orders.find(o => o.id === orderId);
  if (order && order.status === 'refund_requested') {
    order.status = 'refunded';
    
    // Restock items
    for (const item of order.items) {
      const product = catalog.find(p => p.slug === item.sku);
      if (product) {
        product.stock_count += item.quantity;
      }
    }
    saveState();
  }
  res.redirect('/admin');
});

app.listen(4007, () => console.log('Game Vault Store running on port 4007'));
