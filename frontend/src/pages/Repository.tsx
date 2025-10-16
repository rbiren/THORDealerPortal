import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { repositoryAPI } from '../services/api';
import type { Document } from '../types';

const Repository: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, [selectedCategory, searchTerm]);

  const loadDocuments = async () => {
    try {
      const params: any = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await repositoryAPI.getAll(params);
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Document Repository</h1>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
        <div>
          <label style={{ marginRight: '10px' }}>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '8px' }}
          >
            <option value="all">All Categories</option>
            <option value="manual">Manuals</option>
            <option value="specification">Specifications</option>
            <option value="warranty">Warranty</option>
            <option value="technical">Technical</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {documents.map((doc) => (
          <div
            key={doc.id}
            style={{
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <h3 style={{ marginTop: 0 }}>{doc.name}</h3>
            <div style={{ marginBottom: '10px' }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: '#2196F3',
                color: 'white',
                fontSize: '12px'
              }}>
                {doc.category}
              </span>
            </div>
            <p style={{ color: '#666', fontSize: '14px' }}>Type: {doc.type.toUpperCase()}</p>
            <button
              onClick={() => window.open(doc.url, '_blank')}
              style={{ padding: '8px 15px', cursor: 'pointer', width: '100%' }}
            >
              View Document
            </button>
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>No documents found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Repository;
