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
    const currentContainer = container.current;
    
    // Clear previous widget
    if (currentContainer) {
      currentContainer.innerHTML = '';
    }

    // Create a wrapper for the widget
    const widgetContainer = document.createElement('div');
    widgetContainer.id = "tv_chart_container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";
    currentContainer.appendChild(widgetContainer);

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
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });

    currentContainer.appendChild(script);
  }, [tvSymbol]);

  return (
    <div 
      className="tradingview-widget-container glass" 
      ref={container} 
      style={{ height: "550px", width: "100%", borderRadius: '16px', overflow: 'hidden', position: 'relative' }}
    >
      {/* The script will inject the chart here */}
    </div>
  );
}

export default memo(TradingChart)
