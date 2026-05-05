import React, { useEffect, useRef, memo } from 'react'

const TradingChart = ({ symbol = 'BTC' }) => {
  // Map internal symbols to TradingView symbols
  const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'DOT', 'ADA']
  const cleanSymbol = symbol.toUpperCase().split(':')[0];
  const isCrypto = cryptoSymbols.includes(cleanSymbol);
  
  let tvSymbol = isCrypto ? `BINANCE:${cleanSymbol}USDT` : `NSE:${cleanSymbol}`
  if (symbol.includes(':')) {
    tvSymbol = symbol.toUpperCase();
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
