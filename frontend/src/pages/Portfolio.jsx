import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, PieChart } from 'lucide-react'
import AssetChart from '../components/AssetChart'

const Portfolio = () => {
  const [holdings, setHoldings] = useState([])
  const [trades, setTrades] = useState([])
  const [allTrades, setAllTrades] = useState([])
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const [portfolioRes, tradesRes, allTradesRes, userRes] = await Promise.all([
          api.get('/portfolio'),
          api.get('/orders/my-trades'),
          api.get('/orders/trades'),
          api.get('/user/profile')
        ])
        
        setHoldings(portfolioRes.data)
        setTrades(tradesRes.data)
        setAllTrades(allTradesRes.data)
        setUserEmail(userRes.data.email || userRes.data.phone)
      } catch (err) {
        console.error('Failed to fetch portfolio', err)
      }
    }
    fetchPortfolioData()
    const interval = setInterval(fetchPortfolioData, 5000) 
    return () => clearInterval(interval)
  }, [])

  // Helper to get last price for a specific asset
  const getLastPrice = (symbol) => {
    // 🔥 FIXED: Use the new symbol field for accurate filtering
    const assetTrades = allTrades.filter(t => t.symbol === symbol)
    if (assetTrades.length > 0) {
      return assetTrades[assetTrades.length - 1].price
    }
    const holding = holdings.find(h => h.asset === symbol)
    return holding ? holding.avgPrice : 0
  }

  const totalValue = holdings.reduce((sum, h) => {
      const price = getLastPrice(h.asset)
      return sum + (h.quantity * price)
  }, 0)

  const totalPnL = holdings.reduce((sum, h) => {
      const price = getLastPrice(h.asset)
      if (h.avgPrice > 0) {
          return sum + ((price - h.avgPrice) * h.quantity)
      }
      return sum
  }, 0)

  return (
    <div className="portfolio-container" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>
        {`
          .portfolio-container { padding: 40px; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 40px; }
          
          @media (max-width: 768px) {
            .portfolio-container { padding: 16px !important; }
            .stats-grid { grid-template-columns: 1fr !important; gap: 16px; }
            .hide-mobile { display: none !important; }
            
            /* Responsive Tables */
            table thead { display: none; }
            table td { 
              display: flex; 
              justify-content: space-between; 
              padding: 12px 16px !important;
              border: none !important;
            }
            table td::before {
              content: attr(data-label);
              font-weight: 600;
              color: var(--text-secondary);
              font-size: 0.8rem;
            }
            table tr {
              display: block;
              border-bottom: 1px solid var(--border-color);
              padding: 8px 0;
            }
          }
        `}
      </style>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Portfolio</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track your assets and performance</p>
      </div>

      <div className="stats-grid">
        <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Estimated Balance</p>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ 
            color: totalPnL >= 0 ? 'var(--brand-success)' : 'var(--brand-danger)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            fontSize: '0.9rem', 
            marginTop: '8px' 
          }}>
            {totalPnL >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass" style={{ padding: '24px', borderRadius: '16px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Asset Distribution</p>
              <AssetChart holdings={holdings} currentPrice={getLastPrice('BTC')} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Market Sentiment</p>
              <div style={{ padding: '8px 16px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--brand-success)', fontSize: '0.8rem', fontWeight: 600 }}>
                BULLISH
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <th style={{ padding: '20px 24px' }}>Asset</th>
              <th style={{ padding: '20px 24px' }}>Balance</th>
              <th style={{ padding: '20px 24px' }}>Average Price</th>
              <th style={{ padding: '20px 24px' }}>Current Price</th>
              <th style={{ padding: '20px 24px' }}>PnL</th>
            </tr>
          </thead>
          <tbody>
            {holdings.length > 0 ? holdings.map((h, i) => {
              const price = getLastPrice(h.asset)
              const pnl = h.avgPrice > 0 ? (price - h.avgPrice) * h.quantity : 0;
              return (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition-fast)' }}>
                <td data-label="Asset" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '0.8rem' }}>
                    {h.asset.substring(0, 3)}
                  </div>
                  <span style={{ fontWeight: 600 }}>{h.asset}</span>
                </td>
                <td data-label="Balance" style={{ padding: '20px 24px' }}>{h.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</td>
                <td data-label="Avg Price" style={{ padding: '20px 24px' }}>
                  {h.avgPrice > 0 ? `$${h.avgPrice.toLocaleString()}` : 'N/A (Gifted)'}
                </td>
                <td data-label="Current Price" style={{ padding: '20px 24px' }}>${price.toLocaleString()}</td>
                <td data-label="PnL" style={{ 
                  padding: '20px 24px', 
                  color: pnl >= 0 ? 'var(--brand-success)' : 'var(--brand-danger)' 
                }}>
                  {pnl >= 0 ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            )}) : (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No assets found in your portfolio
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '40px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Trade History Performance</h2>
      </div>

      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <th style={{ padding: '20px 24px' }}>Date</th>
              <th style={{ padding: '20px 24px' }}>Asset</th>
              <th style={{ padding: '20px 24px' }}>Side</th>
              <th style={{ padding: '20px 24px' }}>Execution Price</th>
              <th style={{ padding: '20px 24px' }}>Qty</th>
              <th style={{ padding: '20px 24px' }}>Trade PnL</th>
            </tr>
          </thead>
          <tbody>
            {[...trades].reverse().map((t, i) => {
              const isBuyer = t.buyerUsername.toLowerCase() === userEmail.toLowerCase();
              const symbol = t.symbol || 'BTC'; 
              const marketPrice = getLastPrice(symbol);
              const holding = holdings.find(h => h.asset === symbol);
              const avgBuyPrice = holding ? holding.avgPrice : 0;

              const tradePnL = isBuyer 
                ? (marketPrice - t.price) * t.quantity 
                : (t.price - avgBuyPrice) * t.quantity;

              return (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition-fast)' }}>
                <td data-label="Date" style={{ padding: '20px 24px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(t.timestamp).toLocaleString()}</td>
                <td data-label="Asset" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '0.5rem' }}>
                      {symbol.substring(0, 3)}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{symbol}</span>
                  </div>
                </td>
                <td data-label="Side" style={{ padding: '20px 24px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.7rem', 
                    fontWeight: 700,
                    background: isBuyer ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: isBuyer ? 'var(--brand-success)' : 'var(--brand-danger)'
                  }}>
                    {isBuyer ? 'BUY' : 'SELL'}
                  </span>
                </td>
                <td data-label="Price" style={{ padding: '20px 24px', fontWeight: 600 }}>${t.price.toLocaleString()}</td>
                <td data-label="Qty" style={{ padding: '20px 24px' }}>{t.quantity}</td>
                <td data-label="PnL" style={{ 
                  padding: '20px 24px', 
                  fontWeight: 700,
                  color: tradePnL >= 0 ? 'var(--brand-success)' : 'var(--brand-danger)'
                }}>
                  {tradePnL >= 0 ? '+' : ''}${tradePnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <div style={{ fontSize: '0.65rem', fontWeight: 400, opacity: 0.6 }}>
                    {isBuyer ? 'Unrealized' : 'Realized Profit'}
                  </div>
                </td>
              </tr>
            )})}
            {trades.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No trades executed yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Portfolio
