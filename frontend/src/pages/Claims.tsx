import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { claimsAPI } from '../services/api';
import type { Claim } from '../types';

const Claims: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    unitVin: '',
    unitModel: '',
    claimType: '',
    description: '',
    amount: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      const response = await claimsAPI.getAll();
      setClaims(response.data);
    } catch (error) {
      console.error('Failed to load claims:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await claimsAPI.create({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setShowForm(false);
      setFormData({ unitVin: '', unitModel: '', claimType: '', description: '', amount: '' });
      loadClaims();
    } catch (error) {
      console.error('Failed to create claim:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Claims Management</h1>
        <div>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', marginRight: '10px', cursor: 'pointer' }}>
            {showForm ? 'Cancel' : 'Submit New Claim'}
          </button>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h2>Submit New Claim</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Unit VIN:</label>
              <input
                type="text"
                value={formData.unitVin}
                onChange={(e) => setFormData({ ...formData, unitVin: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Unit Model:</label>
              <input
                type="text"
                value={formData.unitModel}
                onChange={(e) => setFormData({ ...formData, unitModel: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Claim Type:</label>
              <input
                type="text"
                value={formData.claimType}
                onChange={(e) => setFormData({ ...formData, claimType: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Amount ($):</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
              Submit Claim
            </button>
          </form>
        </div>
      )}

      <div>
        <h2>Your Claims</h2>
        {claims.length === 0 ? (
          <p>No claims found. Submit your first claim above.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>VIN</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Model</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Amount</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{claim.unitVin}</td>
                  <td style={{ padding: '10px' }}>{claim.unitModel}</td>
                  <td style={{ padding: '10px' }}>{claim.claimType}</td>
                  <td style={{ padding: '10px' }}>${claim.amount.toFixed(2)}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: claim.status === 'approved' ? '#4CAF50' :
                                       claim.status === 'rejected' ? '#f44336' : '#FFC107',
                      color: 'white'
                    }}>
                      {claim.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    {new Date(claim.submittedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Claims;
