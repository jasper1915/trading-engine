import React, { useEffect, useRef, memo } from 'react'

const TradingChart = ({ symbol = 'BTC' }) => {
  // 1. Clean the symbol (Handle formats like "TITAN/INR" or "BTC:USDT")
  const rawSymbol = symbol.toUpperCase().split('/')[0].split(':')[0].trim();
  
  // 2. Identify if it's an Indian Stock or Crypto
  const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'DOT', 'ADA', 'TRX', 'MATIC'];
  const isCrypto = cryptoSymbols.includes(rawSymbol);
  
  // 3. Resolve the exact TradingView ticker
  let tvSymbol;
  if (isCrypto) {
    tvSymbol = `BINANCE:${rawSymbol}USDT`;
  } else if (symbol.includes(':')) {
    tvSymbol = symbol.toUpperCase(); // Respect explicit symbols
  } else {
    // Indian Stocks: Use NSE prefix and handle special tickers
    const nseTicker = rawSymbol === 'M&M' ? 'M_M' : rawSymbol;
    tvSymbol = `NSE:${nseTicker}`;
  }

  // Construct the Iframe URL
  const chartUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_762c9&symbol=${tvSymbol}&interval=D&hidesidetoolbar=1&hidetoptoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${tvSymbol}`;

  return (
    <div className="tradingview-widget-container glass" style={{ height: "550px", width: "100%", borderRadius: '16px', overflow: 'hidden' }}>
      <iframe
        id="tradingview_762c9"
        src={chartUrl}
        style={{ width: "100%", height: "100%", border: 'none' }}
        allowFullScreen
        title="TradingView Chart"
      />
    </div>
  )
}

export default memo(TradingChart)
