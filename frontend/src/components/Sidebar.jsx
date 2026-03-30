import React, { useState, useEffect } from 'react';
import { TrendingUp, Bitcoin, BarChart3, RefreshCw } from 'lucide-react';

const Sidebar = () => {
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
    const interval = setInterval(fetchMarket, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="glass" style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          background: 'var(--primary-color)',
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <BarChart3 size={24} color="white" />
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Gemma Finance
        </h1>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Thị trường
        </p>
        
        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <TrendingUp size={16} />
              <span style={{ fontSize: '0.875rem' }}>VN-INDEX</span>
            </div>
            {loading && <RefreshCw size={12} className="animate-pulse-subtle" />}
          </div>
          <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            {marketData?.vn_indices?.split('|')[0]?.split(':')[1]?.trim() || '---'}
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <Bitcoin size={16} />
              <span style={{ fontSize: '0.875rem' }}>Bitcoin</span>
            </div>
          </div>
          <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            {marketData?.btc?.split(':')[1]?.split(',')[0]?.trim() || '---'}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--success-color)' }}>
              {marketData?.btc?.includes('(+') ? marketData.btc.split('(')[1].split(')')[0] : ''}
          </span>
        </div>
      </nav>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
        Powered by Gemma 3 & LangGraph
      </div>
    </aside>
  );
};

export default Sidebar;
