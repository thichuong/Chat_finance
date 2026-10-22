import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical } from 'lucide-react';
import { MarketPanel } from './components/MarketPanel';
import { ChatPanel } from './components/ChatPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { getApiKey } from './agent/llmClient';

const DEFAULT_CHAT_WIDTH = 540;
const MIN_CHAT_WIDTH = 340;

export const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(() => {
    // Open settings modal if no API Key is set
    return !getApiKey();
  });

  const [chatWidth, setChatWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_CHAT_WIDTH;
    const saved = localStorage.getItem('chat_panel_width');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= MIN_CHAT_WIDTH && parsed <= window.innerWidth - 300) {
        return parsed;
      }
    }
    // Default to ~40% of screen width clamped between 420 and 620
    return Math.min(Math.max(Math.round(window.innerWidth * 0.4), 420), 620);
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const chatWidthRef = useRef(chatWidth);
  chatWidthRef.current = chatWidth;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startWidth: chatWidthRef.current,
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.touches[0].clientX,
      startWidth: chatWidthRef.current,
    };
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const deltaX = dragRef.current.startX - e.clientX;
      const proposedWidth = dragRef.current.startWidth + deltaX;
      const maxAllowed = Math.max(window.innerWidth - 320, MIN_CHAT_WIDTH);
      const clamped = Math.min(Math.max(proposedWidth, MIN_CHAT_WIDTH), maxAllowed);
      setChatWidth(clamped);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragRef.current || e.touches.length !== 1) return;
      const deltaX = dragRef.current.startX - e.touches[0].clientX;
      const proposedWidth = dragRef.current.startWidth + deltaX;
      const maxAllowed = Math.max(window.innerWidth - 300, MIN_CHAT_WIDTH);
      const clamped = Math.min(Math.max(proposedWidth, MIN_CHAT_WIDTH), maxAllowed);
      setChatWidth(clamped);
    };

    const handleEnd = () => {
      setIsDragging(false);
      dragRef.current = null;
      try {
        localStorage.setItem('chat_panel_width', chatWidthRef.current.toString());
      } catch {
        // Ignore localStorage quota errors
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging]);

  // Window resize handler: ensure chat width stays within window bounds
  useEffect(() => {
    const handleResize = () => {
      const maxAllowed = Math.max(window.innerWidth - 320, MIN_CHAT_WIDTH);
      setChatWidth((prev) => {
        if (prev > maxAllowed) {
          const clamped = Math.max(maxAllowed, MIN_CHAT_WIDTH);
          try {
            localStorage.setItem('chat_panel_width', clamped.toString());
          } catch {}
          return clamped;
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDoubleClickReset = useCallback(() => {
    const defaultW = Math.min(Math.max(Math.round(window.innerWidth * 0.4), 420), 600);
    setChatWidth(defaultW);
    try {
      localStorage.setItem('chat_panel_width', defaultW.toString());
    } catch {}
  }, []);

  return (
    <div className={`app-container ${isDragging ? 'is-resizing' : ''}`}>
      <div className="bg-mesh" />

      {/* Left Column: Market Panel */}
      <MarketPanel />

      {/* Resizer Divider */}
      <div
        className={`panel-resizer ${isDragging ? 'is-dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClickReset}
        role="separator"
        aria-orientation="vertical"
        aria-label="Điều chỉnh chiều rộng khung chat"
        title="Kéo chuột sang trái/phải để tùy ý chỉnh độ rộng khung chat (Nhấp đúp để về mặc định)"
      >
        <div className="resizer-handle">
          <GripVertical size={12} />
        </div>
      </div>

      {/* Right Column: Agent Chat Panel */}
      <ChatPanel
        width={chatWidth}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* API Key Settings Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

