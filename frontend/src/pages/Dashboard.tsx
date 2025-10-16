import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>THOR Dealer Portal - Dashboard</h1>
        <div>
          <span style={{ marginRight: '15px' }}>Welcome, {user?.email} ({user?.role})</span>
          <button onClick={handleLogout} style={{ padding: '8px 15px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
             onClick={() => navigate('/claims')}>
          <h3>Claims</h3>
          <p>Submit and track warranty claims</p>
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
             onClick={() => navigate('/repository')}>
          <h3>Document Repository</h3>
          <p>Access manuals, specifications, and technical documents</p>
        </div>
        
        {user?.role === 'dealer' && (
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
               onClick={() => navigate('/orders')}>
            <h3>Order Units</h3>
            <p>Place new unit orders and track shipments</p>
          </div>
        )}
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
             onClick={() => navigate('/profile')}>
          <h3>Profile</h3>
          <p>Manage your account information</p>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>Recent Activity</h2>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <p>No recent activity to display</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
