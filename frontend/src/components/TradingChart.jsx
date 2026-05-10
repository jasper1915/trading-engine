import React, { useEffect, useRef, memo } from 'react'

const TradingChart = ({ symbol = 'BTC' }) => {
  const container = useRef();

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
    const nseTicker = rawSymbol === 'M&M' ? 'M_M' : rawSymbol;
    // We try NSE first, but use a more robust search
    tvSymbol = `NSE:${nseTicker}`;
  }

  useEffect(() => {
    // Clear previous chart
    if (container.current) {
      container.current.innerHTML = '';
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-realtime.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": tvSymbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "allow_symbol_change": true,
      "container_id": "tradingview_widget_container",
      "support_host": "https://www.tradingview.com"
    });

    container.current.appendChild(script);
  }, [tvSymbol]);

  return (
    <div 
      className="tradingview-widget-container glass" 
      ref={container} 
      style={{ height: "550px", width: "100%", borderRadius: '16px', overflow: 'hidden' }}
    >
      <div id="tradingview_widget_container" style={{ height: "100%", width: "100%" }}></div>
    </div>
  );
}

export default memo(TradingChart)
