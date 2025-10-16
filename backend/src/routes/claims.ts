import express from 'express';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { Claim } from '../types';

const router = express.Router();

// Mock data storage
const claims: Claim[] = [];

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    let filteredClaims = claims;
    
    if (req.userRole === 'dealer' && req.query.dealerId) {
      filteredClaims = claims.filter(c => c.dealerId === req.query.dealerId);
    } else if (req.userRole === 'technician' && req.query.technicianId) {
      filteredClaims = claims.filter(c => c.technicianId === req.query.technicianId);
    }
    
    res.json(filteredClaims);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const claim = claims.find(c => c.id === req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json(claim);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.post('/', authenticateToken, authorizeRole('dealer', 'technician'), async (req: AuthRequest, res) => {
  try {
    const newClaim: Claim = {
      id: Date.now().toString(),
      ...req.body,
      status: 'pending',
      submittedAt: new Date(),
      updatedAt: new Date()
    };
    claims.push(newClaim);
    res.status(201).json(newClaim);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const index = claims.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    claims[index] = { 
      ...claims[index], 
      ...req.body,
      updatedAt: new Date()
    };
    res.json(claims[index]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.patch('/:id/status', authenticateToken, authorizeRole('admin'), async (req: AuthRequest, res) => {
  try {
    const index = claims.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    claims[index].status = req.body.status;
    claims[index].updatedAt = new Date();
    res.json(claims[index]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

export default router;
