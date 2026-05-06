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
  const [livePrices, setLivePrices] = useState({})

  const fetchLivePrices = async () => {
    const prices = {}
    for (const h of holdings) {
        try {
            const res = await api.get(`/api/market/price?symbol=${h.asset}`)
            if (res.data && res.data.price > 0) {
                prices[h.asset] = res.data.price
            }
        } catch (e) { console.error('Live price fetch failed for', h.asset) }
    }
    setLivePrices(prev => ({ ...prev, ...prices }))
  }

  useEffect(() => {
    if (holdings.length > 0) {
        fetchLivePrices()
    }
  }, [holdings.length])

  const getLastPrice = (symbol) => {
    if (livePrices[symbol]) return livePrices[symbol]
    const assetTrades = allTrades.filter(t => t.symbol === symbol)
    if (assetTrades.length > 0) {
      return assetTrades[assetTrades.length - 1].price
    }
    const holding = holdings.find(h => h.asset === symbol)
    return holding ? holding.avgPrice : 0
  }

  const USD_INR_RATE = 83.0; // Standard conversion rate for estimation

  const totalValueUSD = holdings.reduce((sum, h) => {
      const price = getLastPrice(h.asset)
      const isCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'].includes(h.asset.toUpperCase())
      const valueInBase = h.quantity * price
      // If it's a stock (INR), convert to USD for the total summary
      return sum + (isCrypto ? valueInBase : (valueInBase / USD_INR_RATE))
  }, 0)

  const totalPnLUSD = holdings.reduce((sum, h) => {
      const price = getLastPrice(h.asset)
      if (h.avgPrice > 0) {
          const pnl = (price - h.avgPrice) * h.quantity
          const isCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'].includes(h.asset.toUpperCase())
          return sum + (isCrypto ? pnl : (pnl / USD_INR_RATE))
      }
      return sum
  }, 0)

  const totalInvestedUSD = holdings.reduce((sum, h) => {
      const isCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'].includes(h.asset.toUpperCase())
      const invested = h.quantity * h.avgPrice
      return sum + (isCrypto ? invested : (invested / USD_INR_RATE))
  }, 0)

  return (
    <div className="portfolio-container" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>
        {`
          :root {
            --groww-green: #00d09c;
            --groww-red: #eb5b3c;
          }
          .portfolio-container { padding: 40px; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
          .stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 24px; border-radius: 16px; position: relative; overflow: hidden; }
          
          @media (max-width: 768px) {
            .portfolio-container { padding: 16px !important; }
            .stats-grid { grid-template-columns: 1fr !important; gap: 16px; }
          }
        `}
      </style>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Your investment summary</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Invested Value</p>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
            ${totalInvestedUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="stat-card">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Value</p>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
            ${totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ 
            color: totalPnLUSD >= 0 ? 'var(--groww-green)' : 'var(--groww-red)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            fontSize: '0.95rem', 
            fontWeight: 700,
            marginTop: '12px' 
          }}>
            {totalPnLUSD >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            {totalPnLUSD >= 0 ? '+' : ''}${Math.abs(totalPnLUSD).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            <span style={{ fontSize: '0.8rem', opacity: 0.8, marginLeft: '4px' }}>
              ({((totalPnLUSD / (totalInvestedUSD || 1)) * 100).toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="stat-card">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Portfolio Mix</p>
          <AssetChart holdings={holdings} prices={livePrices} />
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
            {holdings.length > 0 ? holdings.filter(h => h.quantity > 0).map((h, i) => {
              const price = getLastPrice(h.asset)
              const pnl = h.avgPrice > 0 ? (price - h.avgPrice) * h.quantity : 0;
              const isCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'DOT', 'ADA'].includes(h.asset.toUpperCase())
              const sym = isCrypto ? '$' : '₹';
              
              return (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition-fast)' }}>
                <td data-label="Asset" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '0.8rem' }}>
                    {h.asset.substring(0, 3)}
                  </div>
                  <span style={{ fontWeight: 600 }}>{h.asset}</span>
                </td>
                <td data-label="Balance" style={{ padding: '20px 24px' }}>{h.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                <td data-label="Avg Price" style={{ padding: '20px 24px' }}>
                  {h.avgPrice > 0 ? `${sym}${h.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Gifted'}
                </td>
                <td data-label="Current Price" style={{ padding: '20px 24px' }}>{sym}{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td data-label="PnL" style={{ 
                   padding: '20px 24px', 
                   color: pnl >= 0 ? 'var(--brand-success)' : 'var(--brand-danger)' 
                 }}>
                  {pnl >= 0 ? '+' : ''}{sym}{pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            )}) : (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No assets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '40px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Trade History</h2>
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
              const isCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'].includes(symbol.toUpperCase());
              const sym = isCrypto ? '$' : '₹';
              
              const currentPrice = getLastPrice(symbol);
              const holding = holdings.find(h => h.asset === symbol);
              const avgBuyPrice = holding ? holding.avgPrice : 0;

              const tradePnL = isBuyer 
                ? (currentPrice - t.price) * t.quantity 
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
                <td data-label="Price" style={{ padding: '20px 24px', fontWeight: 600 }}>{sym}{t.price.toLocaleString()}</td>
                <td data-label="Qty" style={{ padding: '20px 24px' }}>{t.quantity}</td>
                <td data-label="PnL" style={{ 
                  padding: '20px 24px', 
                  fontWeight: 700,
                  color: tradePnL >= 0 ? 'var(--brand-success)' : 'var(--brand-danger)'
                }}>
                  {tradePnL >= 0 ? '+' : ''}{sym}{tradePnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <div style={{ fontSize: '0.65rem', fontWeight: 400, opacity: 0.6 }}>
                    {isBuyer ? 'Unrealized' : 'Realized Profit'}
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Portfolio
