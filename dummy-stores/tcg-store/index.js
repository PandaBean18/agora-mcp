const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Independent Inventory (TCG Store)
const database = {
  cards: [
    { uuid: 'base-set-charizard', cardName: 'Charizard Base Set Holo (PSA 9)', usdPrice: 150000, inStock: 1 },
    { uuid: 'mtg-black-lotus', cardName: 'Black Lotus (Beta, MP)', usdPrice: 850000, inStock: 0 } // Simulating out of stock
  ]
};

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

  console.log(`[TCG Store] Webhook hit! Order ${purchaseData.orderId} processed.`);
  res.json({ ok: true, tracking: 'TRACK-1234' });
});

app.listen(4003, () => console.log('TCG Store running on port 4003'));
