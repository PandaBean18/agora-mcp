const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// SMB Inventory (Arts & Crafts Store) - Prices in INR
const inventory = {
  'watercolor-set': { title: 'Premium Watercolor Paint Set', price: 359900, stock: 25, description: '48 vibrant colors with brushes included', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&q=80' },
  'sketchbook-a4': { title: 'A4 Hardcover Sketchbook', price: 129900, stock: 100, description: '120 pages of 160gsm acid-free paper', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80' },
  'calligraphy-pen': { title: 'Fountain Calligraphy Pen', price: 299900, stock: 40, description: 'Elegant wooden handle with 5 nibs', image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&q=80' },
  'clay-modeling-kit': { title: 'Polymer Clay Modeling Kit', price: 189900, stock: 15, description: '24 colors of oven-bake clay with tools', image: 'https://plus.unsplash.com/premium_photo-1661338622115-4fa221c9a633?w=500&q=80' }
};

app.get('/', (req, res) => {
  res.send('<h1>Creative Corner Crafts (SMB API)</h1><p>This is a headless API store. Our frontend is hosted entirely on the Agora Gateway!</p>');
});

// SMBs only need to expose their catalog! The Gateway handles checkout natively.
app.get('/api/products', (req, res) => {
  const { q } = req.query;
  const items = Object.entries(inventory).map(([id, data]) => ({ id, ...data }));
  if (q) {
    const qLower = q.toLowerCase();
    const filtered = items.filter(i => 
      i.title.toLowerCase().includes(qLower) || 
      i.description.toLowerCase().includes(qLower)
    );
    return res.json(filtered);
  }
  res.json(items);
});

app.listen(4006, () => console.log('Arts & Crafts SMB Store running on port 4006'));
