import React, { useState, useEffect } from 'react';
import { TrendingUp, Bitcoin, Coins, RefreshCw } from 'lucide-react';
import TradingViewWidget from './TradingViewWidget';

const MarketPanel = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMarket = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/market');
      const data = await res.json();
      if (data.status === 'success') {
        setMarketData(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarket();
    const interval = setInterval(fetchMarket, 60000);
    return () => clearInterval(interval);
  }, []);

  const MarketCard = ({ icon, label, value, change, color }) => (
    <div className="glass-card" style={{ 
      flex: 1, 
      padding: '1rem', 
      background: 'rgba(255, 255, 255, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      minWidth: '150px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          {icon}
          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{label}</span>
        </div>
        {loading && <RefreshCw size={12} className="animate-pulse-glow" color="var(--primary-color)" />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          {value || '---'}
        </span>
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: 600,
          color: change?.includes('(+') || change?.includes('+') ? 'var(--success-color)' : 'var(--danger-color)'
        }}>
          {change || '0.00%'}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ 
      flex: 1.5, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1.25rem', 
      padding: '1.5rem',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Top Bar: Market Summaries */}
      <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
        <MarketCard 
          icon={<TrendingUp size={16} color="var(--accent-blue)" />} 
          label="VN-INDEX" 
          value={marketData?.vn_indices?.split('|')[0]?.split(':', 2)[1]?.split('(')[0]?.trim()}
          change={marketData?.vn_indices?.split('|')[0]?.includes('(') ? marketData.vn_indices.split('|')[0].split('(')[1].split(')')[0] : ''}
        />
        <MarketCard 
          icon={<Bitcoin size={16} color="#f7931a" />} 
          label="Bitcoin" 
          value={marketData?.btc?.split(':')[1]?.split('(')[0]?.trim()}
          change={marketData?.btc?.includes('(') ? marketData.btc.split('(')[1].split(')')[0] : ''}
        />
        <MarketCard 
          icon={<Coins size={16} color="#ffd700" />} 
          label="Gold (Global)" 
          value={marketData?.gold?.split(':')[1]?.split('(')[0]?.trim()}
          change={marketData?.gold?.includes('(') ? marketData.gold.split('(')[1].split(')')[0] : ''}
        />
      </div>

      {/* Main Area: TradingView Widget */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '0.75rem',
          paddingLeft: '0.5rem'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-secondary)' }}>
            Biểu đồ Phân tích Kỹ thuật
          </h3>
          <div style={{ 
            fontSize: '0.7rem', 
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px 10px',
            borderRadius: '20px'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-color)' }}></div>
            Dữ liệu Live
          </div>
        </div>
        <TradingViewWidget />
      </div>
    </div>
  );
};

export default MarketPanel;
