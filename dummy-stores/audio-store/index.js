const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Independent Inventory (Audio Store)
const inventory = {
  'sony-xm5': { title: 'Sony WH-1000XM5 Headphones', retailPrice: 39800, qtyAvailable: 15, details: 'Industry leading noise cancellation' },
  'sony-xm5-cable': { title: 'Audiophile Braided Cable', retailPrice: 1499, qtyAvailable: 50, details: 'High-quality braided cable for zero latency' },
  'shure-sm7b': { title: 'Shure SM7B Vocal Microphone', retailPrice: 39900, qtyAvailable: 4, details: 'The standard for podcasting' }
};

// Store A: Uses /api/v1/items
app.get('/api/v1/items', (req, res) => {
  const { q } = req.query;
  const items = Object.entries(inventory).map(([id, data]) => ({ id, ...data }));
  if (q) {
    const filtered = items.filter(i => i.title.toLowerCase().includes(q.toLowerCase()));
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

  console.log(`[Audio Store] Order ${orderId} received. Fulfilled ${items.length} items.`);
  res.json({ success: true, orderId });
});

app.listen(4001, () => console.log('Audio Store running on port 4001'));
