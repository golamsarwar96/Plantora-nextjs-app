const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const ORDERS_FILE = path.join(__dirname, '../data/orders.json');

const readOrders = () => JSON.parse(fs.readFileSync(ORDERS_FILE));
const writeOrders = (data) => fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2));

// Get all orders (Admin/Manager only)
router.get('/', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const orders = readOrders();
  res.json(orders);
});

// Get user's own orders
router.get('/my', authenticateToken, (req, res) => {
  const orders = readOrders();
  const userOrders = orders.filter(o => o.userId === req.user.id);
  res.json(userOrders);
});

// Create order
router.post('/', authenticateToken, (req, res) => {
  const orders = readOrders();
  const { items, total } = req.body;
  
  const newOrder = {
    id: 'ord-' + Date.now(),
    userId: req.user.id,
    items,
    total,
    status: 'Pending',
    date: new Date().toISOString()
  };

  orders.push(newOrder);
  writeOrders(orders);
  res.status(201).json(newOrder);
});

// Update order status (Admin/Manager)
router.put('/:id/status', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const orders = readOrders();
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Order not found' });

  orders[index].status = req.body.status;
  writeOrders(orders);
  res.json(orders[index]);
});

module.exports = router;
