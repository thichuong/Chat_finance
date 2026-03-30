import React, { useEffect, useRef } from 'react';

const TradingViewWidget = ({ symbol = 'BITSTAMP:BTCUSD' }) => {
  const containerRef = useRef();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof TradingView !== 'undefined' && containerRef.current) {
        new window.TradingView.widget({
          "autosize": true,
          "symbol": symbol,
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "hide_side_toolbar": false,
          "allow_symbol_change": true,
          "container_id": "tradingview_chart",
          "width": "100%",
          "height": "100%",
          "backgroundColor": "rgba(3, 7, 18, 0.5)",
          "gridColor": "rgba(255, 255, 255, 0.05)",
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol]);

  return (
    <div className="glass-card" style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      height: '100%',
      padding: '0.5rem',
      background: 'rgba(17, 24, 39, 0.3)',
      border: '1px solid var(--surface-border)',
      borderRadius: 'var(--radius-lg)'
    }}>
      <div id="tradingview_chart" ref={containerRef} style={{ flex: 1, width: '100%' }} />
    </div>
  );
};

export default TradingViewWidget;
