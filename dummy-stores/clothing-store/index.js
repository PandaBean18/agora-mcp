const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Independent Inventory (Clothing Store)
const catalog = [
  { slug: 'vintage-leather-jacket', name: 'Vintage 90s Leather Jacket', cost: 15000, stock_count: 2 },
  { slug: 'agora-hoodie', name: 'Agora Developer Hoodie', cost: 5500, stock_count: 50 }
];

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

  console.log(`[Clothing Store] Order ${transactionRef} received!`);
  res.json({ status: 'confirmed', transactionRef });
});

app.listen(4002, () => console.log('Clothing Store running on port 4002'));
