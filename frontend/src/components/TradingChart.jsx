import React, { useEffect, useRef, memo } from 'react'

const TradingChart = ({ symbol = 'BTC' }) => {
  const containerId = "tradingview_chart_widget";

  // 1. Resolve Ticker Logic
  const rawSymbol = symbol.toUpperCase().split('/')[0].split(':')[0].trim();
  const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'DOT', 'ADA', 'TRX', 'MATIC'];
  const isCrypto = cryptoSymbols.includes(rawSymbol);

  let tvSymbol;
  if (isCrypto) {
    tvSymbol = `BINANCE:${rawSymbol}USDT`;
  } else if (symbol.includes(':')) {
    tvSymbol = symbol.toUpperCase();
  } else {
    const ticker = rawSymbol === 'M&M' ? 'M_M' : rawSymbol;
    // BSE is often less restricted than NSE for free widgets
    tvSymbol = `BSE:${ticker}`;
  }

  useEffect(() => {
    const script = document.createElement('script');
    script.id = 'tradingview-widget-loading-script';
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          "autosize": true,
          "symbol": tvSymbol,
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "hide_side_toolbar": false,
          "allow_symbol_change": true,
          "container_id": containerId
        });
      }
    };
    
    // If already loaded, just initialize
    if (window.TradingView) {
      script.onload();
    } else {
      document.head.appendChild(script);
    }
  }, [tvSymbol]);

  return (
    <div className="tradingview-widget-container glass" style={{ height: "550px", width: "100%", borderRadius: '16px', overflow: 'hidden' }}>
      <div id={containerId} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default memo(TradingChart)
