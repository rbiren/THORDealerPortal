import express from 'express';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { Dealer } from '../types';

const router = express.Router();

// Mock data storage
const dealers: Dealer[] = [];

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const dealer = dealers.find(d => d.id === req.params.id);
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }
    res.json(dealer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.post('/', authenticateToken, authorizeRole('admin', 'dealer'), async (req: AuthRequest, res) => {
  try {
    const newDealer: Dealer = {
      id: Date.now().toString(),
      userId: req.userId || '',
      ...req.body,
      status: 'pending',
      createdAt: new Date()
    };
    dealers.push(newDealer);
    res.status(201).json(newDealer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.put('/:id', authenticateToken, authorizeRole('admin', 'dealer'), async (req: AuthRequest, res) => {
  try {
    const index = dealers.findIndex(d => d.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Dealer not found' });
    }
    dealers[index] = { ...dealers[index], ...req.body };
    res.json(dealers[index]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

export default router;
