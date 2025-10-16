import express from 'express';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { Order } from '../types';

const router = express.Router();

// Mock data storage
const orders: Order[] = [];

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    let filteredOrders = orders;
    
    if (req.userRole === 'dealer' && req.query.dealerId) {
      filteredOrders = orders.filter(o => o.dealerId === req.query.dealerId);
    }
    
    res.json(filteredOrders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.post('/', authenticateToken, authorizeRole('dealer'), async (req: AuthRequest, res) => {
  try {
    const newOrder: Order = {
      id: Date.now().toString(),
      ...req.body,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    orders.push(newOrder);
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.put('/:id', authenticateToken, authorizeRole('dealer', 'admin'), async (req: AuthRequest, res) => {
  try {
    const index = orders.findIndex(o => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }
    orders[index] = { 
      ...orders[index], 
      ...req.body,
      updatedAt: new Date()
    };
    res.json(orders[index]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.patch('/:id/status', authenticateToken, authorizeRole('admin'), async (req: AuthRequest, res) => {
  try {
    const index = orders.findIndex(o => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }
    orders[index].status = req.body.status;
    orders[index].updatedAt = new Date();
    res.json(orders[index]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

export default router;
