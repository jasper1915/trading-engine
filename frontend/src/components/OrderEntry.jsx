import React, { useState } from 'react'
import api from '../services/api'
import { useNotification } from '../context/NotificationContext'

const OrderEntry = ({ symbol = 'BTC' }) => {
  const [type, setType] = useState('BUY') // BUY or SELL
  const [orderType, setOrderType] = useState('LIMIT') // LIMIT or MARKET
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [useTrigger, setUseTrigger] = useState(false)
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotification()

  const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'DOT', 'ADA']
  const isCrypto = cryptoSymbols.includes(symbol.toUpperCase())
  const currencyLabel = isCrypto ? 'USD' : 'INR'
  const currencySymbol = isCrypto ? '$' : '₹'

  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      await api.post('/orders', {
        type,
        symbol: symbol,
        currency: currencyLabel,
        price: orderType === 'MARKET' ? 0 : parseFloat(price),
        stopPrice: useTrigger ? parseFloat(stopPrice) : null,
        quantity: parseFloat(quantity),
        orderType: orderType,
        timeInForce: 'GTC'
      })
      
      showNotification(`${type} ${orderType} order placed successfully! 🚀`, 'success')
      
      setPrice('')
      setQuantity('')
      setStopPrice('')
      setUseTrigger(false)
      
      // ✅ Trigger a balance refresh on the dashboard
      window.dispatchEvent(new Event('balanceUpdated'))
    } catch (err) {
      console.error('Order Error:', err.response?.data || err.message)
      const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to place order'
      showNotification(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass" style={{ borderRadius: '12px', padding: '16px' }}>
      {/* BUY / SELL Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button 
          onClick={() => setType('BUY')}
          style={{ 
            flex: 1, 
            backgroundColor: type === 'BUY' ? 'var(--brand-success)' : 'transparent',
            color: type === 'BUY' ? '#000' : 'var(--text-secondary)',
            border: type === 'BUY' ? 'none' : '1px solid var(--border-color)',
            height: '40px',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Buy
        </button>
        <button 
          onClick={() => setType('SELL')}
          style={{ 
            flex: 1, 
            backgroundColor: type === 'SELL' ? 'var(--brand-danger)' : 'transparent',
            color: type === 'SELL' ? '#fff' : 'var(--text-secondary)',
            border: type === 'SELL' ? 'none' : '1px solid var(--border-color)',
            height: '40px',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Sell
        </button>
      </div>

      {/* LIMIT / MARKET Toggle */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', fontSize: '0.9rem' }}>
        <span 
          onClick={() => setOrderType('LIMIT')}
          style={{ 
            color: orderType === 'LIMIT' ? 'var(--brand-primary)' : 'var(--text-secondary)', 
            cursor: 'pointer', 
            fontWeight: orderType === 'LIMIT' ? 700 : 400,
            borderBottom: orderType === 'LIMIT' ? '2px solid var(--brand-primary)' : 'none',
            paddingBottom: '4px'
          }}
        >
          Limit
        </span>
        <span 
          onClick={() => setOrderType('MARKET')}
          style={{ 
            color: orderType === 'MARKET' ? 'var(--brand-primary)' : 'var(--text-secondary)', 
            cursor: 'pointer', 
            fontWeight: orderType === 'MARKET' ? 700 : 400,
            borderBottom: orderType === 'MARKET' ? '2px solid var(--brand-primary)' : 'none',
            paddingBottom: '4px'
          }}
        >
          Market
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Price Input (Hidden for Market Orders) */}
        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>Price</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={orderType === 'MARKET' ? 'text' : 'number'} 
              value={orderType === 'MARKET' ? 'Market Price' : price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={orderType === 'MARKET'}
              style={{ 
                width: '100%', 
                paddingRight: '40px',
                background: orderType === 'MARKET' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                color: orderType === 'MARKET' ? 'var(--text-muted)' : '#fff'
              }} 
              placeholder="0.00"
            />
            <span style={{ position: 'absolute', right: '12px', top: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{currencyLabel}</span>
          </div>
        </div>

        {/* Quantity Input */}
        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>Qty</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="number" 
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={{ width: '100%', paddingRight: '40px' }} 
              placeholder="0.00"
            />
            <span style={{ position: 'absolute', right: '12px', top: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{symbol}</span>
          </div>
        </div>

        {/* Trigger / Stop-Loss Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setUseTrigger(!useTrigger)}>
          <input type="checkbox" checked={useTrigger} onChange={() => {}} style={{ cursor: 'pointer' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: useTrigger ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
            Add Stop Trigger (SL/TP)
          </span>
        </div>

        {useTrigger && (
          <div className="glass" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--brand-primary)' }}>
            <label style={{ display: 'block', color: 'var(--brand-primary)', fontSize: '0.8rem', marginBottom: '4px', fontWeight: 700 }}>Trigger Price (SL/TP)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="number" 
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                style={{ width: '100%', paddingRight: '40px', borderColor: 'var(--brand-primary)' }} 
                placeholder="Trigger price..."
              />
              <span style={{ position: 'absolute', right: '12px', top: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{currencyLabel}</span>
            </div>
          </div>
        )}

        {/* Estimated Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Total</span>
          <span>{orderType === 'MARKET' ? '≈ Best Market' : `${currencySymbol}${(price * quantity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currencyLabel}`}</span>
        </div>

        <button 
          onClick={handlePlaceOrder}
          disabled={loading || (orderType === 'LIMIT' && !price) || !quantity}
          style={{ 
            width: '100%', 
            backgroundColor: type === 'BUY' ? 'var(--brand-success)' : 'var(--brand-danger)',
            color: type === 'BUY' ? '#000' : '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '1rem',
            fontWeight: 700,
            marginTop: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : `${type} ${symbol}`}
        </button>
      </div>
    </div>
  )
}

export default OrderEntry
