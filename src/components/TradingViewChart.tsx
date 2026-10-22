import React, { useEffect } from 'react';

declare global {
  interface Window {
    TradingView?: any;
  }
}

interface TradingViewChartProps {
  symbol?: string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol = 'BITSTAMP:BTCUSD',
}) => {
  useEffect(() => {
    let timer: any = null;

    const initWidget = () => {
      if (typeof window.TradingView !== 'undefined') {
        const container = document.getElementById('tradingview_chart_container');
        if (container) {
          container.innerHTML = ''; // clear old
        }
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'vi_VN',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: 'tradingview_chart_container',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(3, 7, 18, 0.5)',
          gridColor: 'rgba(255, 255, 255, 0.05)',
        });
      } else {
        timer = setTimeout(initWidget, 300);
      }
    };

    initWidget();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [symbol]);

  return <div id="tradingview_chart_container" style={{ width: '100%', height: '100%' }} />;
};

