const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const MONGO_URI = "mongodb+srv://adnan:aFdbDSQzHk8G4cs6@cluster0.7fvc3no.mongodb.net/paystation_demo?retryWrites=true&w=majority";

// Order Schema
const orderSchema = new mongoose.Schema({
  invoice: String,
  amount: Number,
  status: String,
  verified: Boolean,
  createdAt: Date,
  customer: {
    name: String,
    email: String,
    phone: String,
    address: String,
  },
  items: [{ id: String, name: String, price: Number, qty: Number, subtotal: Number }],
}, { strict: false });

const Order = mongoose.model('Order', orderSchema, 'orders');

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

// API: Get all orders with filters
app.get('/api/orders', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { invoice: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const [total, paid, failed, pending, revenue] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'paid' }),
      Order.countDocuments({ status: 'failed' }),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    res.json({ total, paid, failed, pending, revenue: revenue[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Update order status
app.patch('/api/orders/:id', async (req, res) => {
  try {
    const { status, verified } = req.body;
    const update = {};
    if (status !== undefined) update.status = status;
    if (verified !== undefined) update.verified = verified;
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Delete order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Admin panel running at http://localhost:${PORT}`));