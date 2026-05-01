import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { XCircle, Clock, CheckCircle } from 'lucide-react';

const OrderTabs = ({ symbol = 'BTC' }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [activeOrders, setActiveOrders] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'active') {
        const res = await api.get('/orders/my-active');
        // Filter by selected symbol
        const filtered = res.data.filter(o => o.symbol === symbol);
        setActiveOrders(filtered);
      } else {
        const res = await api.get('/orders/my-trades');
        // Filter by selected symbol (Trades don't have symbol field in model, but we can derive it from order IDs or just show all)
        // For now, let's show all or filter if possible. 
        // Actually, let's keep all trades in history but highlight the current pair.
        setTradeHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch order data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [activeTab, symbol]);

  const handleCancel = async (id) => {
    try {
      await api.delete(`/orders/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to cancel order');
    }
  };

  return (
    <div className="glass order-tabs-container" style={{ borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>
        {`
          @media (max-width: 768px) {
            .order-tabs-container thead { display: none; }
            .order-tabs-container td { 
              display: flex; 
              justify-content: space-between; 
              padding: 10px 16px !important;
              border: none !important;
            }
            .order-tabs-container td::before {
              content: attr(data-label);
              font-weight: 600;
              color: var(--text-secondary);
              font-size: 0.75rem;
            }
            .order-tabs-container tr {
              display: block;
              border-bottom: 1px solid var(--border-color);
              padding: 10px 0;
            }
          }
        `}
      </style>
      {/* TABS HEADER */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('active')}
          style={{ 
            padding: '12px 20px', 
            fontSize: '0.85rem', 
            fontWeight: 600,
            color: activeTab === 'active' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'active' ? '2px solid var(--brand-primary)' : 'none',
            background: 'none'
          }}
        >
          Open {symbol} Orders ({activeOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ 
            padding: '12px 20px', 
            fontSize: '0.85rem', 
            fontWeight: 600,
            color: activeTab === 'history' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'history' ? '2px solid var(--brand-primary)' : 'none',
            background: 'none'
          }}
        >
          My Trade History
        </button>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 20px' }}>Date</th>
              <th style={{ padding: '12px 20px' }}>Pair</th>
              <th style={{ padding: '12px 20px' }}>Side</th>
              <th style={{ padding: '12px 20px' }}>Price</th>
              <th style={{ padding: '12px 20px' }}>Amount</th>
              {activeTab === 'active' && <th style={{ padding: '12px 20px' }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {activeTab === 'active' ? (
              activeOrders.map((o, i) => (
                <tr key={i}>
                  <td data-label="Date" style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{new Date(o.timestamp).toLocaleTimeString()}</td>
                  <td data-label="Pair" style={{ padding: '12px 20px', fontWeight: 600 }}>{o.symbol}/{o.currency}</td>
                  <td data-label="Side" style={{ padding: '12px 20px', color: o.type === 'BUY' ? 'var(--brand-success)' : 'var(--brand-danger)', fontWeight: 700 }}>{o.type}</td>
                  <td data-label="Price" style={{ padding: '12px 20px' }}>${o.price.toLocaleString()}</td>
                  <td data-label="Amount" style={{ padding: '12px 20px' }}>{o.quantity}</td>
                  <td data-label="Action" style={{ padding: '12px 20px' }}>
                    <button onClick={() => handleCancel(o.orderId)} style={{ color: 'var(--brand-danger)', background: 'none', padding: 0 }}>
                      <XCircle size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              [...tradeHistory].reverse().map((t, i) => (
                <tr key={i}>
                  <td data-label="Date" style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{new Date(t.timestamp).toLocaleTimeString()}</td>
                  <td data-label="Pair" style={{ padding: '12px 20px', fontWeight: 600 }}>{t.symbol || 'BTC'}/USD</td>
                  <td data-label="Side" style={{ padding: '12px 20px', color: 'var(--brand-success)', fontWeight: 700 }}>FILLED</td>
                  <td data-label="Price" style={{ padding: '12px 20px' }}>${t.price.toLocaleString()}</td>
                  <td data-label="Amount" style={{ padding: '12px 20px' }}>{t.quantity}</td>
                </tr>
              ))
            )}
            {((activeTab === 'active' && activeOrders.length === 0) || (activeTab === 'history' && tradeHistory.length === 0)) && (
              <tr>
                <td colSpan={activeTab === 'active' ? 6 : 5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTabs;
