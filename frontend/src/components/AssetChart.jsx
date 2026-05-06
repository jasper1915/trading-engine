import React from 'react';

const AssetChart = ({ holdings, prices }) => {
  const USD_INR_RATE = 83.0;

  const data = holdings.filter(h => h.quantity > 0).map(h => {
    const price = prices[h.asset] || h.avgPrice || 1.0;
    const isCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'].includes(h.asset.toUpperCase());
    
    // Value in USD for the chart split
    const valueUSD = isCrypto ? (h.quantity * price) : (h.quantity * price / USD_INR_RATE);
    
    // Color mapping
    const colors = {
        'BTC': '#F7931A', 'ETH': '#627EEA', 'SOL': '#14F195', 'BNB': '#F3BA2F', 'XRP': '#23292F',
        'RELIANCE': '#00539F', 'TCS': '#1B4D9B', 'HDFCBANK': '#004C8F', 'ICICIBANK': '#F58220'
    };

    return {
      name: h.asset,
      value: valueUSD,
      color: colors[h.asset.toUpperCase()] || `hsl(${Math.random() * 360}, 70%, 50%)`
    };
  }).filter(d => d.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  let cumulativePercent = 0;

  function getCoordinatesForPercent(percent) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  if (data.length === 0) return <div style={{ color: 'var(--text-secondary)' }}>No data</div>;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
      <svg viewBox="-1 -1 2 2" style={{ width: '120px', height: '120px', transform: 'rotate(-90deg)' }}>
        {data.map((slice, i) => {
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += slice.value / total;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = slice.value / total > 0.5 ? 1 : 0;
          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(' ');
          return <path key={i} d={pathData} fill={slice.color} />;
        })}
        <circle cx="0" cy="0" r="0.75" fill="#0f172a" /> 
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto', paddingRight: '10px' }}>
        {data.map((slice, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: slice.color }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{slice.name}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {((slice.value / (total || 1)) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetChart;
