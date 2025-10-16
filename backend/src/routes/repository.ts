import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Document } from '../types';

const router = express.Router();

// Mock data storage
const documents: Document[] = [
  {
    id: '1',
    name: 'RV Service Manual 2024',
    type: 'pdf',
    category: 'manual',
    url: '/documents/service-manual-2024.pdf',
    uploadedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Warranty Guidelines',
    type: 'pdf',
    category: 'warranty',
    url: '/documents/warranty-guidelines.pdf',
    uploadedAt: new Date('2024-01-15')
  },
  {
    id: '3',
    name: 'Technical Specifications - Class A',
    type: 'pdf',
    category: 'specification',
    url: '/documents/class-a-specs.pdf',
    uploadedAt: new Date('2024-02-01')
  }
];

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    let filteredDocs = documents;
    
    if (req.query.category) {
      filteredDocs = documents.filter(d => d.category === req.query.category);
    }
    
    if (req.query.search) {
      const searchTerm = (req.query.search as string).toLowerCase();
      filteredDocs = filteredDocs.filter(d => 
        d.name.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json(filteredDocs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const document = documents.find(d => d.id === req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

router.get('/categories', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const categories = ['manual', 'specification', 'warranty', 'technical', 'other'];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

export default router;
