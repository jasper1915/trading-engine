import React, { useEffect, useState } from 'react'
import TradingChart from '../components/TradingChart'
import OrderBook from '../components/OrderBook'
import OrderEntry from '../components/OrderEntry'
import OrderTabs from '../components/OrderTabs'
import api from '../services/api'
import { Wallet, Coins, TrendingUp, BarChart3, Gift, Menu, X } from 'lucide-react'
import { useNotification } from '../context/NotificationContext'

const Dashboard = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC')
  const [balances, setBalances] = useState({
    USD_AVAILABLE: 0,
    USD_LOCKED: 0,
    ASSET_AVAILABLE: 0,
    ASSET_LOCKED: 0
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [showMarketMenu, setShowMarketMenu] = useState(false)
  const { showNotification } = useNotification()

  const markets = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', color: '#00539f' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', color: '#1b4d9b' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', color: '#004c8f' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', color: '#f58220' },
    { symbol: 'INFY', name: 'Infosys Ltd', color: '#007cc3' },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', color: '#004c8f' },
    { symbol: 'ITC', name: 'ITC Ltd', color: '#3156a3' },
    { symbol: 'SBIN', name: 'State Bank of India', color: '#0068a8' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel', color: '#e40000' },
    { symbol: 'BAJFINANCE', name: 'Bajaj Finance', color: '#0072bc' },
    { symbol: 'LICI', name: 'LIC of India', color: '#ffcc00' },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', color: '#ed1c24' },
    { symbol: 'LT', name: 'Larsen & Toubro', color: '#ffcc00' },
    { symbol: 'HCLTECH', name: 'HCL Technologies', color: '#007cc3' },
    { symbol: 'AXISBANK', name: 'Axis Bank Ltd', color: '#97144d' },
    { symbol: 'ASIANPAINT', name: 'Asian Paints', color: '#fdb913' },
    { symbol: 'MARUTI', name: 'Maruti Suzuki', color: '#1b4d9b' },
    { symbol: 'SUNPHARMA', name: 'Sun Pharma Industries', color: '#f15a24' },
    { symbol: 'TITAN', name: 'Titan Company', color: '#004c8f' },
    { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', color: '#ffcc00' },
    { symbol: 'WIPRO', name: 'Wipro Ltd', color: '#00a4e4' },
    { symbol: 'ZOMATO', name: 'Zomato Ltd', color: '#cb202d' },
    { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', color: '#00a9e0' },
    { symbol: 'M&M', name: 'Mahindra & Mahindra', color: '#e31837' },
    { symbol: 'ADANIENT', name: 'Adani Enterprises', color: '#fdb913' },
    { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', color: '#00539f' },
    { symbol: 'POWERGRID', name: 'Power Grid Corp', color: '#00a9e0' },
    { symbol: 'NTPC', name: 'NTPC Ltd', color: '#007cc3' },
    { symbol: 'ONGC', name: 'ONGC Ltd', color: '#ed1c24' },
    { symbol: 'BTC', name: 'Bitcoin', color: '#f59e0b' },
    { symbol: 'ETH', name: 'Ethereum', color: '#6366f1' },
    { symbol: 'SOL', name: 'Solana', color: '#14f195' },
    { symbol: 'BNB', name: 'Binance Coin', color: '#f3ba2f' },
    { symbol: 'XRP', name: 'Ripple', color: '#23292f' }
  ]

  const fetchBalances = async () => {
    setIsRefreshing(true)
    try {
      const [usd, asset] = await Promise.all([
        api.get('/wallet/balance?currency=USD'),
        api.get(`/wallet/balance?currency=${selectedSymbol}`)
      ])

      setBalances({
        USD_AVAILABLE: parseFloat(usd.data.available || 0),
        USD_LOCKED: parseFloat(usd.data.locked || 0),
        ASSET_AVAILABLE: parseFloat(asset.data.available || 0),
        ASSET_LOCKED: parseFloat(asset.data.locked || 0)
      })
    } catch (err) {
      console.error('Failed to fetch balances:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleManualDeposit = async () => {
    try {
      await api.post('/wallet/deposit?amount=10000&currency=USD')
      showNotification('Successfully deposited $10,000 USD! 💸', 'success')
      fetchBalances()
    } catch (err) {
      showNotification('Deposit failed.', 'error')
    }
  }

  const [hasClaimed, setHasClaimed] = useState(localStorage.getItem('giftClaimed') === 'true')

  const handleClaimCoins = async () => {
    setIsClaiming(true)
    try {
      const response = await api.post('/wallet/claim-test-coins')
      showNotification('Gift Reset! Balances set to $1,000,000 and 1,000 units each. 🎁', 'success')
      fetchBalances()
    } catch (err) {
      console.error('Gift claim failed:', err)
      const msg = err.response?.data?.message || err.message || 'Claim failed.'
      showNotification(msg, 'warning')
    } finally {
      setIsClaiming(false)
    }
  }

  useEffect(() => {
    fetchBalances()
    window.addEventListener('balanceUpdated', fetchBalances)
    return () => window.removeEventListener('balanceUpdated', fetchBalances)
  }, [selectedSymbol])

  const [searchTerm, setSearchTerm] = useState('')

  // Map common names to official NSE Tickers
  const tickerMap = {
    'ADANI': 'ADANIENT',
    'RELIANCE': 'RELIANCE',
    'TATA MOTORS': 'TATAMOTORS',
    'TATA': 'TCS',
    'SBI': 'SBIN',
    'HDFC': 'HDFCBANK',
    'ICICI': 'ICICIBANK',
    'AIRTEL': 'BHARTIARTL',
    'BAJAJ': 'BAJFINANCE'
  }

  const getTicker = (name) => {
    const upper = name.toUpperCase().trim()
    return tickerMap[upper] || upper
  }

  // Filter markets based on search
  const filteredMarkets = markets.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Check if search term is a valid-looking symbol not in list
  const showGlobalSearch = searchTerm.length >= 2 && !markets.some(m => m.symbol.toLowerCase() === searchTerm.toLowerCase())

  const handleSelectMarket = (sym) => {
    const finalSym = getTicker(sym)
    setSelectedSymbol(finalSym)
    setSearchTerm('')
  }

  return (
    <div className="dashboard-layout">
      <style>
        {`
          .dashboard-layout {
            padding: 20px;
            display: grid;
            grid-template-columns: 240px 1fr 320px;
            gap: 20px;
            height: calc(100vh - 64px);
            max-width: 1600px;
            margin: 0 auto;
            width: 100%;
          }
          .search-input {
            width: 100%;
            padding: 10px 12px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            color: #fff;
            font-size: 0.85rem;
            outline: none;
            transition: 0.2s;
          }
          .search-input:focus {
            border-color: var(--brand-primary);
            background: rgba(255,255,255,0.08);
          }

          @media (max-width: 1200px) {
            .dashboard-layout {
              grid-template-columns: 1fr 320px;
            }
            .market-sidebar {
              display: none !important;
            }
            .mobile-market-selector {
              display: flex !important;
            }
          }

          @media (max-width: 768px) {
            .dashboard-layout {
              display: flex;
              flex-direction: column;
              height: auto;
              padding: 12px;
            }
            .wallet-bar {
              flex-direction: column;
              gap: 16px;
            }
            .wallet-stats {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>

      {/* MOBILE MARKET SELECTOR */}
      <div className="mobile-market-selector glass" style={{
        display: 'none',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '12px',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: markets.find(m => m.symbol === selectedSymbol)?.color }} />
          <span style={{ fontWeight: 700 }}>{markets.find(m => m.symbol === selectedSymbol)?.name || selectedSymbol}/USD</span>
        </div>
        <button onClick={() => setShowMarketMenu(!showMarketMenu)} style={{ background: 'transparent', padding: '4px' }}>
          {showMarketMenu ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {showMarketMenu && (
        <div className="glass" style={{ position: 'fixed', top: '120px', left: '12px', right: '12px', zIndex: 100, borderRadius: '12px', padding: '16px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Select Market</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {markets.map(m => (
              <div key={m.symbol} onClick={() => { setSelectedSymbol(m.symbol); setShowMarketMenu(false); }} style={{ padding: '8px', borderRadius: '6px', background: selectedSymbol === m.symbol ? 'rgba(255,255,255,0.05)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
                {m.symbol}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MARKET SIDEBAR (DESKTOP) */}
      <div className="market-sidebar glass" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
        <div style={{ padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <BarChart3 size={18} color="var(--brand-primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>MARKETS</span>
          </div>
          <input 
            type="text" 
            placeholder="Search Stocks or Crypto..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {filteredMarkets.map(m => (
            <div 
              key={m.symbol}
              onClick={() => handleSelectMarket(m.symbol)}
              style={{ 
                padding: '10px 12px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                background: selectedSymbol === m.symbol ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: selectedSymbol === m.symbol ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                transition: '0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{m.symbol}/USD</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{m.name}</div>
              </div>
            </div>
          ))}

          {showGlobalSearch && (
            <div 
              onClick={() => handleSelectMarket(searchTerm)}
              style={{ 
                padding: '16px', 
                borderRadius: '12px', 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                <TrendingUp size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>GLOBAL MARKET</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{searchTerm.toUpperCase()}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)' }}>Trade on NSE/Binance →</div>
              </div>
            </div>
          )}

          {filteredMarkets.length === 0 && !showGlobalSearch && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              No markets found. Try searching for "AAPL" or "BTC".
            </div>
          )}
        </div>
      </div>

      {/* CENTER COLUMN */}
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

        {/* WALLET BAR */}
        <div className="wallet-bar glass" style={{ padding: '16px 24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Wallet size={20} style={{ color: 'var(--brand-primary)' }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>Balances</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={handleClaimCoins} 
                disabled={isClaiming} 
                style={{ 
                  padding: '4px 12px', 
                  borderRadius: '4px', 
                  fontSize: '0.8rem', 
                  color: '#f59e0b', 
                  background: 'rgba(245,158,11,0.1)', 
                  border: '1px solid rgba(245,158,11,0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Gift size={14} /> {isClaiming ? '...' : 'Gift Reset'}
              </button>
              <button onClick={handleManualDeposit} style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                + $10k
              </button>
              <button onClick={fetchBalances} disabled={isRefreshing} style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {isRefreshing ? '...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="wallet-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>USD BALANCE</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Total: ${(balances.USD_AVAILABLE + balances.USD_LOCKED).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>${balances.USD_AVAILABLE.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                  <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>AVAILABLE</span>
                  {balances.USD_LOCKED > 0 && <span>• Locked: ${balances.USD_LOCKED.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>}
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{selectedSymbol} BALANCE</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Total: {(balances.ASSET_AVAILABLE + balances.ASSET_LOCKED).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: markets.find(m => m.symbol === selectedSymbol)?.color || '#fff' }}>
                  {balances.ASSET_AVAILABLE.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                  <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>AVAILABLE</span>
                  {balances.ASSET_LOCKED > 0 && <span>• Locked: {balances.ASSET_LOCKED.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CHART */}
        <div style={{ flex: 1, minHeight: '300px' }}>
          <TradingChart key={selectedSymbol} symbol={selectedSymbol} />
        </div>

        {/* ORDER TABS */}
        <div style={{ height: '300px', flexShrink: 0, marginBottom: '80px' }}>
          <OrderTabs symbol={selectedSymbol} markets={markets} />
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="right-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
        <div style={{ flex: 1, minHeight: '300px' }}>
          <OrderBook
            symbol={selectedSymbol}
            name={markets.find(m => m.symbol === selectedSymbol)?.name || selectedSymbol}
          />
        </div>
        <div style={{ flexShrink: 0 }}>
          <OrderEntry symbol={selectedSymbol} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
