import React, { useEffect, useState } from 'react';
import { TrendingUp, Bitcoin, Coins, Activity } from 'lucide-react';
import { TradingViewChart } from './TradingViewChart';
import { getVnIndices } from '../tools/finance/getVnIndices';
import { getCryptoPrice } from '../tools/finance/getCryptoPrice';
import { getGoldPrice } from '../tools/finance/getGoldPrice';

interface CardData {
  label: string;
  icon: any;
  color: string;
  value: string;
  change: string;
}

export const MarketPanel: React.FC = () => {
  const [cards, setCards] = useState<CardData[]>([
    {
      label: 'VN-INDEX',
      icon: TrendingUp,
      color: 'var(--accent-blue)',
      value: 'Đang tải...',
      change: '0.00%',
    },
    {
      label: 'Bitcoin',
      icon: Bitcoin,
      color: '#f7931a',
      value: 'Đang tải...',
      change: '0.00%',
    },
    {
      label: 'Gold (Global)',
      icon: Coins,
      color: '#ffd700',
      value: 'Đang tải...',
      change: '0.00%',
    },
  ]);

  const fetchAllMarketData = async () => {
    try {
      const [vnData, btcData, goldData] = await Promise.all([
        getVnIndices(),
        getCryptoPrice('BTC'),
        getGoldPrice(),
      ]);

      // Parse VN-Index: "VNINDEX: 1,280.50 (+0.45%) | VN30: ..."
      const vnPart = vnData.split('|')[0] || '';
      let vnValue = '---';
      let vnChange = '0.00%';
      if (vnPart.includes(':')) {
        const afterColon = vnPart.split(':')[1]?.trim() || '';
        const match = afterColon.match(/([0-9.,]+)\s*\(([^)]+)\)/);
        if (match) {
          vnValue = match[1];
          vnChange = match[2];
        } else {
          vnValue = afterColon.split('(')[0]?.trim() || afterColon;
        }
      }

      // Parse BTC: "Crypto BTC/USDT: $67,500.00 (+2.15%), 24h High: ..."
      let btcValue = '---';
      let btcChange = '0.00%';
      if (btcData.includes(':')) {
        const afterColon = btcData.split(':')[1]?.trim() || '';
        const match = afterColon.match(/\$([0-9.,]+)\s*\(([^)]+)\)/);
        if (match) {
          btcValue = `$${match[1]}`;
          btcChange = match[2];
        } else {
          btcValue = afterColon.split('(')[0]?.trim() || afterColon;
        }
      }

      // Parse Gold: "Global Gold (XAU/USD quy chiếu PAXG): $2,720.50/ounce (+0.35%)"
      let goldValue = '---';
      let goldChange = '0.00%';
      if (goldData.includes(':')) {
        const afterColon = goldData.split(':')[1]?.trim() || '';
        const match = afterColon.match(/\$([0-9.,]+)(?:\/[a-zA-Z]+)?\s*\(([^)]+)\)/);
        if (match) {
          goldValue = `$${match[1]}`;
          goldChange = match[2];
        } else {
          goldValue = afterColon.split('(')[0]?.trim() || afterColon;
        }
      }

      setCards([
        {
          label: 'VN-INDEX',
          icon: TrendingUp,
          color: 'var(--accent-blue)',
          value: vnValue,
          change: vnChange,
        },
        {
          label: 'Bitcoin',
          icon: Bitcoin,
          color: '#f7931a',
          value: btcValue,
          change: btcChange,
        },
        {
          label: 'Gold (Global)',
          icon: Coins,
          color: '#ffd700',
          value: goldValue,
          change: goldChange,
        },
      ]);
    } catch (e) {
      console.error('Failed to fetch market data:', e);
    }
  };

  useEffect(() => {
    fetchAllMarketData();
    const interval = setInterval(fetchAllMarketData, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="market-panel">
      <div className="market-cards">
        {cards.map((card, idx) => {
          const isPositive = card.change.includes('+');
          const isNegative = card.change.includes('-');
          const changeColor = isPositive
            ? 'var(--success-color)'
            : isNegative
            ? 'var(--danger-color)'
            : 'var(--text-secondary)';
          const IconComponent = card.icon;

          return (
            <div key={idx} className="glass-card">
              <div className="market-card-header">
                <div className="market-card-label">
                  <IconComponent style={{ color: card.color, width: 16, height: 16 }} />
                  <span>{card.label}</span>
                </div>
              </div>
              <span className="market-card-value">{card.value}</span>
              <span className="market-card-change" style={{ color: changeColor }}>
                {card.change}
              </span>
            </div>
          );
        })}
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h3>Biểu đồ Phân tích Kỹ thuật</h3>
          <div className="live-indicator">
            <div className="dot" />
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Live Data</span>
          </div>
        </div>
        <div className="glass-card chart-container">
          <TradingViewChart symbol="BITSTAMP:BTCUSD" />
        </div>
      </div>
    </aside>
  );
};

