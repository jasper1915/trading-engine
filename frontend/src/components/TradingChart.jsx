import React, { useEffect, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'

const TradingChart = ({ symbol = 'BTC' }) => {
  const chartContainerRef = useRef()

  useEffect(() => {
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#848E9C',
      },
      grid: {
        vertLines: { color: 'rgba(43, 49, 57, 0.5)' },
        horzLines: { color: 'rgba(43, 49, 57, 0.5)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#0ECB81',
      downColor: '#F6465D',
      borderVisible: false,
      wickUpColor: '#0ECB81',
      wickDownColor: '#F6465D',
    })

    // Sample data (In a real app, this would be fetched based on symbol)
    candlestickSeries.setData([
      { time: '2023-10-01', open: 180.34, high: 180.99, low: 178.57, close: 179.85 },
      { time: '2023-10-02', open: 179.85, high: 181.43, low: 179.47, close: 180.82 },
      { time: '2023-10-03', open: 180.82, high: 181.70, low: 180.29, close: 181.21 },
      { time: '2023-10-04', open: 181.21, high: 182.50, low: 181.00, close: 182.10 },
      { time: '2023-10-05', open: 182.10, high: 183.00, low: 181.50, close: 182.80 },
    ])

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [symbol]) // Re-run effect when symbol changes

  return (
    <div className="glass" style={{ borderRadius: '12px', padding: '16px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{symbol} / USD</span>
        <span style={{ color: 'var(--brand-success)', fontWeight: 600 }}>Live Chart</span>
      </div>
      <div ref={chartContainerRef} style={{ width: '100%' }} />
    </div>
  )
}

export default TradingChart
