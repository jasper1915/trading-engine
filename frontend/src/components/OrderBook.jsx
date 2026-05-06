import React, { useEffect, useState } from 'react'
import api from '../services/api'

const OrderBook = ({ symbol = 'BTC', name = 'Bitcoin' }) => {
  const [data, setData] = useState({ bids: {}, asks: {} })
  const [lastPrice, setLastPrice] = useState(0)

  const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'DOT', 'ADA']
  const isCrypto = cryptoSymbols.includes(symbol.toUpperCase())
  const currency = isCrypto ? 'USD' : 'INR'

  const fetchDepth = async () => {
    try {
      const res = await api.get(`/orders/depth?symbol=${symbol}&currency=${currency}`)
      setData(res.data)
      
      // Update last price from recent trades if available
      const tradesRes = await api.get('/orders/trades')
      // Ensure we match the symbol correctly in the trades list
      const symbolTrades = tradesRes.data.filter(t => t.symbol === symbol)
      
      if (symbolTrades.length > 0) {
          setLastPrice(symbolTrades[symbolTrades.length - 1].price)
      } else {
          // 🚀 LIVE SYNC: Fetch real market price from our backend proxy
          try {
              const liveRes = await api.get(`/api/market/price?symbol=${symbol}`)
              if (liveRes.data && liveRes.data.price > 0) {
                  setLastPrice(liveRes.data.price)
              } else {
                  // Final Fallback: Smart Mock
                  const mockPrices = {
                    'BTC': 65000.50, 'ETH': 3500.20, 'SOL': 145.80, 'XRP': 1.41, 'BNB': 580.00, 'ADA': 0.45,
                    'RELIANCE': 2985.15, 'TCS': 3912.20, 'ZOMATO': 192.30, 'HDFCBANK': 1524.00,
                    'TATAMOTORS': 985.40, 'INFY': 1488.00, 'ADANIENT': 3145.20, 'HINDUNILVR': 2324.00,
                    'ICICIBANK': 1085.00, 'ITC': 425.00, 'BAJFINANCE': 6850.00, 'SUZLON': 54.90,
                    'SBIN': 825.00, 'BHARTIARTL': 1290.00, 'LICINDIA': 950.00
                  }
                  let price = mockPrices[symbol.toUpperCase()] || 100.0
                  setLastPrice(price)
              }
          } catch (err) {
              console.warn('Market sync failed')
          }
      }
    } catch (err) {
      console.error('Orderbook fetch failed:', err)
    }
  }

  useEffect(() => {
    fetchDepth()
    const interval = setInterval(fetchDepth, 2000) // Poll every 2s
    return () => clearInterval(interval)
  }, [symbol])

  // Sort asks (sells) descending so lowest is at bottom
  const sortedAsks = Object.entries(data.asks || {})
    .map(([price, qty]) => ({ price: parseFloat(price), qty }))
    .sort((a, b) => b.price - a.price)
    .slice(-10)

  // Sort bids (buys) descending so highest is at top
  const sortedBids = Object.entries(data.bids || {})
    .map(([price, qty]) => ({ price: parseFloat(price), qty }))
    .sort((a, b) => b.price - a.price)
    .slice(0, 10)

  return (
    <div className="glass" style={{ borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Order Book ({name}/{currency})</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>
        <span>Price ({currency})</span>
        <span style={{ textAlign: 'right' }}>Amount ({symbol})</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* ASKS (SELLS) - RED */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {sortedAsks.map((ask, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '4px 0', fontSize: '0.85rem' }}>
              <span style={{ color: '#ef4444' }}>{ask.price.toLocaleString()}</span>
              <span style={{ textAlign: 'right', color: '#94a3b8' }}>{ask.qty}</span>
            </div>
          ))}
          {sortedAsks.length === 0 && <div style={{ fontSize: '0.8rem', color: '#475569', textAlign: 'center', py: 2 }}>No Sell Orders</div>}
        </div>

        {/* MID PRICE */}
        <div style={{ padding: '12px 0', margin: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '4px' }}>Last Price</div>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>
            {lastPrice ? lastPrice.toLocaleString() : '---'}
          </span>
        </div>

        {/* BIDS (BUYS) - GREEN */}
        <div>
          {sortedBids.map((bid, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '4px 0', fontSize: '0.85rem' }}>
              <span style={{ color: '#10b981' }}>{bid.price.toLocaleString()}</span>
              <span style={{ textAlign: 'right', color: '#94a3b8' }}>{bid.qty}</span>
            </div>
          ))}
          {sortedBids.length === 0 && <div style={{ fontSize: '0.8rem', color: '#475569', textAlign: 'center', py: 2 }}>No Buy Orders</div>}
        </div>
      </div>
    </div>
  )
}

export default OrderBook
