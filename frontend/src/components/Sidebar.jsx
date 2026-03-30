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
    const interval = setInterval(fetchMarket, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="glass" style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      padding: '2.5rem 1.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2.5rem',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 10,
      borderRight: '1px solid var(--surface-border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-color), var(--accent-purple))',
          width: '3rem',
          height: '3rem',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
        }}>
          <BarChart3 size={28} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1 }}>
            GEMMA
          </h1>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary-color)', letterSpacing: '0.1em' }}>
            FINANCE
          </span>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '0.75rem', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          letterSpacing: '0.1em',
          marginBottom: '0.25rem'
        }}>
          Thị trường Live
        </p>
        
        <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
              <TrendingUp size={18} color="var(--accent-blue)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>VN-INDEX</span>
            </div>
            {loading && <RefreshCw size={14} className="animate-pulse-glow" color="var(--primary-color)" />}
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            {marketData?.vn_indices?.split('|')[0]?.split(':', 2)[1]?.split('(')[0]?.trim() || '---'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ 
              fontSize: '0.8rem', 
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              background: marketData?.vn_indices?.split('|')[0]?.includes('(+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: marketData?.vn_indices?.split('|')[0]?.includes('(+') ? 'var(--success-color)' : 'var(--danger-color)'
            }}>
                {marketData?.vn_indices?.split('|')[0]?.includes('(') 
                  ? marketData.vn_indices.split('|')[0].split('(')[1].split(')')[0] 
                  : '0.00%'}
            </span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
              <Bitcoin size={18} color="#f7931a" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Bitcoin</span>
            </div>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            {marketData?.btc?.split(':')[1]?.split('(')[0]?.trim() || '---'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ 
              fontSize: '0.8rem', 
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '6px',
              background: marketData?.btc?.includes('(+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: marketData?.btc?.includes('(+') ? 'var(--success-color)' : 'var(--danger-color)'
            }}>
                {marketData?.btc?.includes('(') ? marketData.btc.split('(')[1].split(')')[0] : '0.00%'}
            </span>
          </div>
        </div>
      </nav>

      <div style={{ 
        fontSize: '0.8rem', 
        color: 'var(--text-muted)', 
        borderTop: '1px solid var(--surface-border)', 
        paddingTop: '1.5rem',
        fontWeight: 500
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)' }}></div>
          Hệ thống sẵn sàng
        </div>
        <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>Powered by Gemma 3</p>
      </div>
    </aside>
  );
};

export default Sidebar;
