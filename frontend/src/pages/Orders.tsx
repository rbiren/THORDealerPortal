import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import type { Order } from '../types';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    unitModel: '',
    quantity: '',
    specifications: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ordersAPI.create({
        unitModel: formData.unitModel,
        quantity: parseInt(formData.quantity),
        specifications: formData.specifications,
        estimatedDelivery: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setShowForm(false);
      setFormData({ unitModel: '', quantity: '', specifications: '' });
      loadOrders();
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Unit Orders</h1>
        <div>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', marginRight: '10px', cursor: 'pointer' }}>
            {showForm ? 'Cancel' : 'Place New Order'}
          </button>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h2>Place New Order</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Unit Model:</label>
              <input
                type="text"
                value={formData.unitModel}
                onChange={(e) => setFormData({ ...formData, unitModel: e.target.value })}
                required
                placeholder="e.g., Class A Motorhome 2024"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Quantity:</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Specifications:</label>
              <textarea
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                rows={4}
                placeholder="Enter any special requirements or configurations"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
              Submit Order
            </button>
          </form>
        </div>
      )}

      <div>
        <h2>Your Orders</h2>
        {orders.length === 0 ? (
          <p>No orders found. Place your first order above.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Order ID</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Model</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Quantity</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Est. Delivery</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Ordered</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{order.id}</td>
                  <td style={{ padding: '10px' }}>{order.unitModel}</td>
                  <td style={{ padding: '10px' }}>{order.quantity}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor:
                        order.status === 'delivered' ? '#4CAF50' :
                        order.status === 'shipped' ? '#2196F3' :
                        order.status === 'in_production' ? '#FF9800' : '#FFC107',
                      color: 'white'
                    }}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    {new Date(order.estimatedDelivery).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
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

export default Orders;
