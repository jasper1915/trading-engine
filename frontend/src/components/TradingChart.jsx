import React, { useEffect, useRef, memo } from 'react'

const TradingChart = ({ symbol = 'BTC' }) => {
  const container = useRef()

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
    
    // Map internal symbols to TradingView symbols
    const tvSymbol = symbol === 'USD' ? 'FX_IDC:USDTUSD' : `BINANCE:${symbol}USDT`

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
    })

    // Clear existing content before appending new script
    if (container.current) {
        container.current.innerHTML = ''
        container.current.appendChild(script)
    }

    return () => {
        if (container.current) container.current.innerHTML = ''
    }
  }, [symbol])

  return (
    <div className="tradingview-widget-container glass" style={{ height: "550px", width: "100%", borderRadius: '16px', overflow: 'hidden' }}>
      <div className="tradingview-widget-container__widget" ref={container} style={{ height: "100%", width: "100%" }}></div>
      <div className="tradingview-widget-copyright" style={{ display: 'none' }}>
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  )
}

export default memo(TradingChart)
