import express from 'express';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { Technician } from '../types';

const router = express.Router();

// Mock data storage
const technicians: Technician[] = [];

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const technician = technicians.find(t => t.id === req.params.id);
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    res.json(technician);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.post('/', authenticateToken, authorizeRole('admin', 'technician'), async (req: AuthRequest, res) => {
  try {
    const newTechnician: Technician = {
      id: Date.now().toString(),
      userId: req.userId || '',
      ...req.body,
      status: 'active',
      createdAt: new Date()
    };
    technicians.push(newTechnician);
    res.status(201).json(newTechnician);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.put('/:id', authenticateToken, authorizeRole('admin', 'technician'), async (req: AuthRequest, res) => {
  try {
    const index = technicians.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    technicians[index] = { ...technicians[index], ...req.body };
    res.json(technicians[index]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

export default router;
