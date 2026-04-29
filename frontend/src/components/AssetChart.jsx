import React from 'react';

const AssetChart = ({ holdings, currentPrice }) => {
  // Calculate total value for percentage
  const btcValue = holdings.find(h => h.asset === 'BTC')?.quantity * currentPrice || 0;
  const usdValue = holdings.find(h => h.asset === 'USD')?.balance || 0; // Assuming USD wallet is in holdings or separate
  
  // For this project, let's look at BTC vs USD specifically if that's how holdings are structured
  // If holdings only contains crypto, we'll just show the distribution of those.
  
  const data = holdings.map(h => ({
    name: h.asset,
    value: h.asset === 'BTC' ? h.quantity * currentPrice : (h.balance || 0),
    color: h.asset === 'BTC' ? '#F7931A' : '#22C55E'
  })).filter(d => d.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  let cumulativePercent = 0;

  function getCoordinatesForPercent(percent) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
      <svg viewBox="-1 -1 2 2" style={{ width: '160px', height: '160px', transform: 'rotate(-90deg)' }}>
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
        {/* Inner circle for "Donut" effect */}
        <circle cx="0" cy="0" r="0.7" fill="#0f172a" /> 
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map((slice, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: slice.color }}></div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{slice.name}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {((slice.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetChart;
