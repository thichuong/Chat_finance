import React, { useState } from 'react';
import { MarketPanel } from './components/MarketPanel';
import { ChatPanel } from './components/ChatPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { getApiKey } from './agent/llmClient';

export const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(() => {
    // Open settings modal if no API Key is set
    return !getApiKey();
  });

  return (
    <div className="app-container">
      <div className="bg-mesh" />

      {/* Left Column: Market Panel */}
      <MarketPanel />

      {/* Right Column: Agent Chat Panel */}
      <ChatPanel onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* API Key Settings Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

